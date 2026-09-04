// ENVIRONMENT NOTE (sandbox better-sqlite3 / glibc limitation, not a code defect):
// This test constructs or exercises a real better-sqlite3-backed SQLite database.
// better-sqlite3 is a native addon; production and CI load it normally, but some
// sandboxes/dev boxes ship a system glibc older than the prebuilt binary requires
// ("GLIBC_2.29 not found"), so the native module fails to dlopen and any test that
// reaches better-sqlite3 directly (or asserts stdout that the load-failure warning
// would pollute) fails HERE while passing in CI. This is a known environment
// limitation, not a defect in the code under test: the OmniRoute runtime itself
// cascades to node:sqlite/sql.js when better-sqlite3 is unavailable. See
// tests/unit/_helpers/betterSqlite3Availability.ts for a guard helper.
// #10421 — pre-migration backups were created on every migration run and never pruned,
// so `db_backups/` grew without bound (observed: 48.999 files / 204 GB against a 5,3 MB
// live database). The pruning logic already existed in `cleanupDbBackups()` but nothing
// on the migration path ever reached it. These tests pin the retention step to the
// backup call site so the operator's maxFiles/retentionDays budget is honored there too.

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import Database from "better-sqlite3";

const serial = { concurrency: false };

async function importFresh(modulePath: string) {
  const url = pathToFileURL(path.resolve(modulePath)).href;
  return import(`${url}?test=${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

function withMockedMigrationFs(files: Record<string, string>, fn: () => void) {
  const originalExistsSync = fs.existsSync;
  const originalReaddirSync = fs.readdirSync;
  const originalReadFileSync = fs.readFileSync;

  const isMigrationDir = (target: unknown) =>
    String(target).replaceAll("\\", "/").endsWith("/src/lib/db/migrations") ||
    String(target).replaceAll("\\", "/").endsWith("/migrations");

  fs.existsSync = ((target: unknown) => {
    if (isMigrationDir(target)) return true;
    const fileName = path.basename(String(target));
    if (Object.hasOwn(files, fileName)) return true;
    return originalExistsSync(target as string);
  }) as typeof fs.existsSync;

  fs.readdirSync = ((target: string, options?: unknown) => {
    if (isMigrationDir(target)) return Object.keys(files);
    return originalReaddirSync(target, options as never);
  }) as typeof fs.readdirSync;

  fs.readFileSync = ((target: unknown, options?: unknown) => {
    const fileName = path.basename(String(target));
    if (Object.hasOwn(files, fileName)) return files[fileName];
    return originalReadFileSync(target as string, options as never);
  }) as typeof fs.readFileSync;

  try {
    return fn();
  } finally {
    fs.existsSync = originalExistsSync;
    fs.readdirSync = originalReaddirSync;
    fs.readFileSync = originalReadFileSync;
  }
}

/** Minimal SqliteAdapter over a real on-disk file (VACUUM INTO needs a file, not :memory:). */
function createFileDb(sqlitePath: string) {
  const db = new Database(sqlitePath);

  return {
    driver: "better-sqlite3",
    get open() {
      return db.open;
    },
    get name() {
      return db.name;
    },
    prepare: (sql: string) => db.prepare(sql),
    exec: (sql: string) => db.exec(sql),
    pragma: (str: string, options?: unknown) => db.pragma(str, options as never),
    transaction: (fn: (...args: unknown[]) => unknown) => {
      const tx = db.transaction((...args: unknown[]) => fn(...args));
      return (...args: unknown[]) => tx(...args);
    },
    immediate: (fn: () => void) => fn(),
    async backup() {},
    checkpoint() {},
    close: () => db.close(),
    get raw() {
      return db;
    },
  };
}

/**
 * Build a DB that already has migrations applied (so the pre-migration backup path is
 * reached: it requires `applied.size > 0`) plus one pending migration to trigger a run.
 */
function seedAppliedDb(db: ReturnType<typeof createFileDb>) {
  db.exec(`
    CREATE TABLE provider_connections (id TEXT PRIMARY KEY);
    CREATE TABLE combos (id TEXT PRIMARY KEY);
    CREATE TABLE call_logs (id TEXT PRIMARY KEY);
  `);
}

/**
 * Record 001 as applied in the runner's own ledger table. `runMigrations` only takes a
 * pre-migration backup when `applied.size > 0`, so this is what puts the test on the
 * code path under exercise.
 */
function seedAppliedMigration(db: ReturnType<typeof createFileDb>) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _omniroute_migrations (
      version TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  db.prepare(
    "INSERT OR REPLACE INTO _omniroute_migrations (version, name, applied_at) VALUES (?, ?, ?)"
  ).run("001", "initial_schema", new Date().toISOString());
}

function makeTempDataDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "omniroute-backup-retention-"));
  fs.mkdirSync(path.join(dir, "db_backups"), { recursive: true });
  return dir;
}

/** Pre-existing backups, oldest first, with distinct mtimes so retention ordering is stable. */
function seedBackups(backupDir: string, count: number) {
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    const name = `db_2026-08-${String(i + 1).padStart(2, "0")}T00-00-00-000Z_pre-migration.sqlite`;
    const filePath = path.join(backupDir, name);
    fs.writeFileSync(filePath, "x");
    const t = new Date(2026, 7, i + 1).getTime() / 1000;
    fs.utimesSync(filePath, t, t);
    names.push(name);
  }
  return names;
}

function countBackups(backupDir: string) {
  return fs.readdirSync(backupDir).filter((n) => n.startsWith("db_")).length;
}

function withEnv(vars: Record<string, string | undefined>, fn: () => void) {
  const saved: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(vars)) {
    saved[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return fn();
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

test(
  "#10421 runMigrations prunes pre-migration backups to the configured maxFiles",
  serial,
  async () => {
    const dataDir = makeTempDataDir();
    const backupDir = path.join(dataDir, "db_backups");
    const sqlitePath = path.join(dataDir, "storage.sqlite");
    const db = createFileDb(sqlitePath);

    try {
      seedAppliedDb(db);
      seedBackups(backupDir, 30);
      assert.equal(countBackups(backupDir), 30, "precondition: 30 stale backups on disk");

      const { runMigrations } = await importFresh("src/lib/db/migrationRunner.ts");

      withEnv(
        {
          DB_BACKUP_MAX_FILES: "5",
          DB_BACKUP_RETENTION_DAYS: "0",
          DISABLE_SQLITE_AUTO_BACKUP: undefined,
        },
        () => {
          withMockedMigrationFs(
            {
              "001_initial_schema.sql": "SELECT 1;",
              "002_retention_probe.sql": "CREATE TABLE retention_probe_10421 (id INTEGER);",
            },
            () => {
              // Mark 001 as applied so `applied.size > 0` and the backup path is reached.
              seedAppliedMigration(db);

              runMigrations(db);
            }
          );
        }
      );

      const remaining = countBackups(backupDir);
      assert.ok(
        remaining <= 5,
        `expected retention to cap db_backups at 5 files, found ${remaining} — ` +
          `pre-migration backups are accumulating unbounded (#10421)`
      );
    } finally {
      db.close();
      fs.rmSync(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
  }
);

test("#10421 the newest pre-migration backup survives pruning", serial, async () => {
  const dataDir = makeTempDataDir();
  const backupDir = path.join(dataDir, "db_backups");
  const sqlitePath = path.join(dataDir, "storage.sqlite");
  const db = createFileDb(sqlitePath);

  try {
    seedAppliedDb(db);
    seedBackups(backupDir, 10);

    const { runMigrations } = await importFresh("src/lib/db/migrationRunner.ts");

    withEnv(
      {
        DB_BACKUP_MAX_FILES: "3",
        DB_BACKUP_RETENTION_DAYS: "0",
        DISABLE_SQLITE_AUTO_BACKUP: undefined,
      },
      () => {
        withMockedMigrationFs(
          {
            "001_initial_schema.sql": "SELECT 1;",
            "002_retention_probe.sql": "CREATE TABLE retention_probe_10421b (id INTEGER);",
          },
          () => {
            seedAppliedMigration(db);

            runMigrations(db);
          }
        );
      }
    );

    const remaining = fs.readdirSync(backupDir).filter((n) => n.startsWith("db_"));
    assert.ok(remaining.length <= 3, `expected <=3 backups, found ${remaining.length}`);

    // The backup written by THIS run must be among the survivors — pruning must never
    // discard the snapshot that protects the migration it was taken for.
    const seededNames = new Set(
      Array.from({ length: 10 }, (_, i) => {
        return `db_2026-08-${String(i + 1).padStart(2, "0")}T00-00-00-000Z_pre-migration.sqlite`;
      })
    );
    const fresh = remaining.filter((n) => !seededNames.has(n));
    assert.equal(fresh.length, 1, `expected the run's own backup to survive, got ${fresh.length}`);
  } finally {
    db.close();
    fs.rmSync(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
