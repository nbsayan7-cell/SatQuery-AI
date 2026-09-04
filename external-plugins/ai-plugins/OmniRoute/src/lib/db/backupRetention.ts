/**
 * Backup retention primitives — pure filesystem work, no `core.ts` dependency.
 *
 * This module exists so BOTH backup call sites can share one retention policy:
 *
 * - `backup.ts` (manual/API/auto backups) — resolves the operator's settings from the
 *   database and delegates here.
 * - `migrationRunner.ts` (pre-migration snapshots) — cannot import `backup.ts`, because
 *   `core.ts` already imports `migrationRunner.ts` and `backup.ts` imports `core.ts`;
 *   that edge would close a cycle. Keeping the policy here, free of `core`, lets the
 *   migration path prune without one.
 *
 * Before #10421 the migration path had no retention at all and `db_backups/` grew
 * without bound (observed: 48.999 files / 204 GB against a 5,3 MB live database).
 */

import fs from "fs";
import path from "path";

export const MAX_DB_BACKUPS = 20;
export const DEFAULT_DB_BACKUP_RETENTION_DAYS = 0;

export function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseNonNegativeInt(value: string | undefined, fallback: number) {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

/**
 * A backup "family" is the primary `.sqlite` file plus its SQLite sidecars
 * (`-wal` / `-shm` / `-journal`). Retention operates on families so a sidecar is never
 * orphaned from — or outlives — the snapshot it belongs to.
 */
export function getBackupFamilyBase(filename: string) {
  if (filename.endsWith("-wal") || filename.endsWith("-shm")) return filename.slice(0, -4);
  if (filename.endsWith("-journal")) return filename.slice(0, -8);
  return filename;
}

export type BackupFamily = {
  base: string;
  hasPrimary: boolean;
  primaryMtimeMs: number;
  latestMtimeMs: number;
  files: string[];
};

export function collectBackupFamilies(backupDir: string): BackupFamily[] {
  if (!fs.existsSync(backupDir)) return [];

  const families = new Map<string, BackupFamily>();

  for (const name of fs.readdirSync(backupDir)) {
    if (!name.startsWith("db_")) continue;
    const base = getBackupFamilyBase(name);
    const filePath = path.join(backupDir, name);

    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch {
      continue;
    }

    const family = families.get(base) || {
      base,
      hasPrimary: false,
      primaryMtimeMs: 0,
      latestMtimeMs: 0,
      files: [],
    };

    family.files.push(name);
    family.latestMtimeMs = Math.max(family.latestMtimeMs, stat.mtimeMs);
    if (name === base && name.endsWith(".sqlite")) {
      family.hasPrimary = true;
      family.primaryMtimeMs = stat.mtimeMs;
    }

    families.set(base, family);
  }

  return [...families.values()];
}

export type PruneResult = {
  deletedBackupFamilies: number;
  deletedFiles: number;
  keptBackupFamilies: number;
  maxFiles: number;
  retentionDays: number;
};

/**
 * Delete backup families beyond `maxFiles` (newest kept), older than `retentionDays`
 * (0 disables the age rule), or orphaned (sidecars whose primary is already gone).
 */
export function pruneBackupDirectory(options: {
  backupDir: string;
  maxFiles: number;
  retentionDays: number;
}): PruneResult {
  const { backupDir } = options;
  const maxFiles = Math.max(1, options.maxFiles);
  const retentionDays = Math.max(0, options.retentionDays);

  if (!fs.existsSync(backupDir)) {
    return {
      deletedBackupFamilies: 0,
      deletedFiles: 0,
      keptBackupFamilies: 0,
      maxFiles,
      retentionDays,
    };
  }

  const cutoffMs = retentionDays > 0 ? Date.now() - retentionDays * 24 * 60 * 60 * 1000 : 0;
  const families = collectBackupFamilies(backupDir);
  const primaryFamilies = families
    .filter((family) => family.hasPrimary)
    .sort((a, b) => b.primaryMtimeMs - a.primaryMtimeMs);
  const keepPrimaryBases = new Set(primaryFamilies.slice(0, maxFiles).map((family) => family.base));

  let deletedBackupFamilies = 0;
  let deletedFiles = 0;

  for (const family of families) {
    const isOverflowPrimary = family.hasPrimary && !keepPrimaryBases.has(family.base);
    const isExpired = retentionDays > 0 && family.latestMtimeMs < cutoffMs;
    const isOrphan = !family.hasPrimary;
    if (!isOverflowPrimary && !isExpired && !isOrphan) continue;

    deletedBackupFamilies += 1;
    for (const name of family.files) {
      try {
        fs.unlinkSync(path.join(backupDir, name));
        deletedFiles += 1;
      } catch {
        /* ignore */
      }
    }
  }

  return {
    deletedBackupFamilies,
    deletedFiles,
    keptBackupFamilies: collectBackupFamilies(backupDir).filter((family) => family.hasPrimary)
      .length,
    maxFiles,
    retentionDays,
  };
}
