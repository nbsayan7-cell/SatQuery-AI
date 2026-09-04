// src/lib/db/adapters/sqljsAdapter.ts
import fs from "node:fs";
import path from "node:path";
import type { SqliteAdapter, PreparedStatement, RunResult } from "./types";

const SAVE_DEBOUNCE_MS = 100;
const CHECKPOINT_INTERVAL_MS = 60_000;

// sql.js's stmt.getAsObject() returns rows whose prototype is `null`
// (Object.create(null)), whereas better-sqlite3 (the driver we ship and run in
// production/CI) hands back ordinary Object.prototype rows. That difference is
// invisible for normal property access but breaks callers that compare rows
// with structural equality that also checks the prototype (e.g. Node's
// assert.deepStrictEqual, used by several unit tests written against the
// better-sqlite3 row shape). Normalize every row to a plain object so the
// sql.js fallback is behaviourally identical to the native better-sqlite3 path.
function toPlainRow<T>(row: T): T {
  if (row === null || typeof row !== "object") return row;
  return { ...(row as Record<string, unknown>) } as T;
}

let _sqlJsLib: Awaited<ReturnType<(typeof import("sql.js"))["default"]>> | null = null;

function resolveSqlJsWasmPath(): string {
  // The standalone assembler copies the complete sql.js package into
  // <bundle>/node_modules/sql.js. Every packaged server launcher sets cwd to that
  // bundle directory, so the JavaScript entrypoint and its sibling WASM share one
  // explicit runtime contract instead of relying on a require.resolve call that
  // webpack can rewrite. The second path retains direct-source compatibility.
  const candidatePaths = [
    path.join(process.cwd(), "node_modules", "sql.js", "dist", "sql-wasm.wasm"),
    path.join(
      process.cwd(),
      ".next",
      "standalone",
      "node_modules",
      "sql.js",
      "dist",
      "sql-wasm.wasm"
    ),
  ];

  for (const candidatePath of candidatePaths) {
    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  throw new Error(
    `[sqljsAdapter] Packaged sql.js runtime is incomplete: sql-wasm.wasm was not found. Checked:\n${candidatePaths.join(
      "\n"
    )}`
  );
}

/**
 * better-sqlite3's named-parameter convention lets callers bind with the bare
 * property name (e.g. `{ isActive: 1 }` for a SQL placeholder written as
 * `@isActive`, `:isActive`, or `$isActive` — better-sqlite3 strips the sigil
 * internally). sql.js's own named-bind path (`sqlite3_bind_parameter_index`)
 * requires the FULL name INCLUDING the sigil, and silently no-ops (does not
 * throw) for a key it can't resolve. Expand each bare key to all three
 * sigil-prefixed variants so sql.js matches whichever sigil the SQL actually
 * used, while passing through any key the caller already prefixed unchanged.
 */
function withNamedParamPrefixes(obj: Record<string, unknown>): Record<string, unknown> {
  const expanded: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (/^[:@$]/.test(key)) {
      expanded[key] = value;
      continue;
    }
    expanded[`@${key}`] = value;
    expanded[`:${key}`] = value;
    expanded[`$${key}`] = value;
  }
  return expanded;
}

/**
 * sql.js's own `stmt.bind()` dispatches on shape: an Array means positional
 * bind (each element -> bind index N), a plain object means named-parameter
 * bind. Callers here always pass their rest-args as an array, so a caller
 * doing `.all({ isActive: 1 })` for a named placeholder (mirrors
 * better-sqlite3's spread-args named-bind convention, see
 * betterSqliteAdapter.ts) ends up handing sql.js `[{isActive:1}]` — an ARRAY
 * containing the object — which sql.js treats as a single positional value
 * and rejects with "Wrong API use : tried to bind a value of an unknown
 * type (...)." (#6802). Unwrap a lone plain-object param back to the object
 * itself (sigil-expanded) so sql.js takes its named-bind path instead.
 */
function toBindValue(params: unknown[]): unknown[] | Record<string, unknown> | undefined {
  if (!params.length) return undefined;
  const [first] = params;
  const isLoneNamedParamsObject =
    params.length === 1 &&
    first !== null &&
    typeof first === "object" &&
    !Array.isArray(first) &&
    !Buffer.isBuffer(first) &&
    !(first instanceof Uint8Array);
  return isLoneNamedParamsObject
    ? withNamedParamPrefixes(first as Record<string, unknown>)
    : params;
}

async function loadSqlJs(): Promise<typeof _sqlJsLib> {
  if (_sqlJsLib) return _sqlJsLib;
  // Use a non-literal specifier so the bundler doesn't try to statically
  // resolve sql.js (and its package.json) during the build phase.
  // sql.js is an optional/fallback adapter — only needed at runtime when
  // better-sqlite3 and node:sqlite are both unavailable.
  const moduleName = "sql." + "js";
  const mod = (await import(
    /* webpackIgnore: true */
    moduleName
  )) as { default: (typeof import("sql.js"))["default"] };
  const initSqlJs = mod.default;
  const wasmPath = resolveSqlJsWasmPath();

  _sqlJsLib = await initSqlJs({
    locateFile(fileName) {
      if (fileName === "sql-wasm.wasm") {
        return wasmPath;
      }
      return fileName;
    },
  });
  return _sqlJsLib;
}

export async function createSqlJsAdapter(filePath: string): Promise<SqliteAdapter> {
  const SQLLib = await loadSqlJs();
  if (!SQLLib) throw new Error("[sqljsAdapter] Failed to load sql.js");

  const buf = filePath !== ":memory:" && fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
  const db = new SQLLib.Database(buf ? new Uint8Array(buf) : undefined);

  let dirty = false;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let _isOpen = true;

  /**
   * Writes the whole database image out atomically: temp file in the SAME
   * directory, fsync, then `rename()` over the destination.
   *
   * WHY NOT `writeFileSync(filePath, …)` DIRECTLY
   * ---------------------------------------------
   * sql.js has no incremental write path — every save rewrites the entire image.
   * `writeFileSync` opens the destination with `O_TRUNC`, so for the whole
   * duration of the write the on-disk database is 0 bytes and then partial. The
   * window scales with the database size and recurs on every save, so on a busy
   * instance it is open a significant fraction of the time.
   *
   * Unlike better-sqlite3 / node:sqlite, that window is not protected by SQLite's
   * locking protocol, so it is visible to every OTHER process that reads the same
   * file — a backup job, a metrics exporter, an operator running `sqlite3`. Those
   * readers get `SQLITE_CORRUPT` ("database disk image is malformed") even though
   * `PRAGMA integrity_check` passes moments later, which makes the failure look
   * random and points the blame at the reader.
   *
   * `rename()` within a directory is atomic on POSIX and on Windows for a
   * same-volume replace, so a reader now sees either the previous image or the
   * new one — never a truncated one. It also removes the total-loss window: a
   * crash mid-write used to leave the real database truncated, while it now only
   * leaves a stale temp file behind.
   */
  function persist(): void {
    if (filePath === ":memory:") return;
    const data = db.export();
    // Same directory, so `rename` stays within one filesystem — a temp file in
    // os.tmpdir() would make it a cross-device copy, which is not atomic.
    const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
    let fd: number | null = null;
    try {
      fd = fs.openSync(tmpPath, "w");
      fs.writeFileSync(fd, Buffer.from(data));
      // The rename is atomic, but only orders against data that already reached
      // the disk; without this an unclean shutdown can publish an empty file.
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fd = null;
      fs.renameSync(tmpPath, filePath);
    } catch (err) {
      if (fd !== null) {
        try {
          fs.closeSync(fd);
        } catch {
          /* already closed */
        }
      }
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        /* never created, or already gone */
      }
      throw err;
    }
    dirty = false;
  }

  function scheduleSave(): void {
    dirty = true;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      if (dirty) {
        try {
          persist();
        } catch (e) {
          console.error("[sqljsAdapter] save failed:", e);
        }
      }
    }, SAVE_DEBOUNCE_MS);
  }

  function runSavepoint<T>(fn: (...args: unknown[]) => T, ...args: unknown[]): T {
    const sp = `sp_${Math.random().toString(36).slice(2)}`;
    db.run(`SAVEPOINT "${sp}"`);
    try {
      const result = fn(...args);
      db.run(`RELEASE "${sp}"`);
      scheduleSave();
      return result;
    } catch (err) {
      try {
        db.run(`ROLLBACK TO "${sp}"`);
        db.run(`RELEASE "${sp}"`);
      } catch {}
      throw err;
    }
  }

  function makeStatement(sql: string): PreparedStatement {
    return {
      run(...params: unknown[]): RunResult {
        const stmt = db.prepare(sql);
        try {
          const bindValue = toBindValue(params);
          if (bindValue !== undefined) stmt.bind(bindValue);
          stmt.step();
          const changes = db.getRowsModified();
          const lastRows = db.exec("SELECT last_insert_rowid() as id");
          const lastInsertRowid = (lastRows[0]?.values?.[0]?.[0] as number | null | undefined) ?? 0;
          scheduleSave();
          return { changes, lastInsertRowid };
        } finally {
          stmt.free();
        }
      },
      get(...params: unknown[]): unknown {
        const stmt = db.prepare(sql);
        try {
          const bindValue = toBindValue(params);
          if (bindValue !== undefined) stmt.bind(bindValue);
          if (stmt.step()) return toPlainRow(stmt.getAsObject());
          return undefined;
        } finally {
          stmt.free();
        }
      },
      all(...params: unknown[]): unknown[] {
        const stmt = db.prepare(sql);
        try {
          const bindValue = toBindValue(params);
          if (bindValue !== undefined) stmt.bind(bindValue);
          const rows: unknown[] = [];
          while (stmt.step()) rows.push(toPlainRow(stmt.getAsObject()));
          return rows;
        } finally {
          stmt.free();
        }
      },
    };
  }

  const checkpointTimer = setInterval(() => {
    if (dirty)
      try {
        persist();
      } catch {}
  }, CHECKPOINT_INTERVAL_MS);
  (checkpointTimer as unknown as NodeJS.Timeout).unref?.();

  const flush = (): void => {
    if (dirty)
      try {
        persist();
      } catch {}
  };
  process.on("beforeExit", flush);
  process.on("SIGINT", flush);
  process.on("SIGTERM", flush);

  function gracefulClose(): void {
    clearInterval(checkpointTimer as unknown as NodeJS.Timeout);
    if (saveTimer) clearTimeout(saveTimer);
    if (dirty)
      try {
        persist();
      } catch {}
    try {
      db.close();
    } catch {}
    _isOpen = false;
    // Without this, a closed adapter's whole closure (raw sql.js Database +
    // buffers) stays pinned in memory forever by these 3 process-level
    // listeners, compounding the OOM every failed boot leaves behind (#7494).
    process.removeListener("beforeExit", flush);
    process.removeListener("SIGINT", flush);
    process.removeListener("SIGTERM", flush);
  }

  return {
    driver: "sql.js",

    get open() {
      return _isOpen;
    },

    get name() {
      return filePath;
    },

    prepare(sql: string): PreparedStatement {
      return makeStatement(sql);
    },

    exec(sql: string): void {
      db.run(sql);
      scheduleSave();
    },

    pragma(pragmaStr: string, options?: { simple?: boolean }): unknown {
      const result = db.exec(`PRAGMA ${pragmaStr}`);
      if (!result.length) return null;
      const rows = result[0];
      if (options?.simple) {
        return rows.values?.[0]?.[0] ?? null;
      }
      return (rows.values ?? []).map((row: unknown[]) =>
        Object.fromEntries(rows.columns.map((col: string, i: number) => [col, row[i]]))
      );
    },

    transaction<T>(fn: (...args: unknown[]) => T): (...args: unknown[]) => T {
      return (...args: unknown[]) => runSavepoint(fn, ...args);
    },

    immediate(fn: () => void): void {
      runSavepoint(() => fn());
    },

    async backup(destination: string): Promise<void> {
      if (dirty) persist();
      if (filePath !== ":memory:") await fs.promises.copyFile(filePath, destination);
    },

    checkpoint(_mode = "TRUNCATE"): void {
      if (dirty)
        try {
          persist();
        } catch {}
    },

    close(): void {
      gracefulClose();
    },

    get raw() {
      return db;
    },
  };
}
