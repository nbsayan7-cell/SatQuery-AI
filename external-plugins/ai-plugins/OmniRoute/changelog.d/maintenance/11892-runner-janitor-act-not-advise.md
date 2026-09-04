- `scripts/ops/runner-janitor.sh` now proves a path is idle with one `lsof`
  snapshot and removes stale leftovers itself (tmpfs after 3 h — it is RAM — disk
  after 24 h), kills orphan `next-build` processes, prunes checkouts of stopped
  runners, and alerts on memory pressure; `--dry-run` shows exactly what it would
  do. `docs/ops/RUNNER_BOX.md` reconciled to the measured box (31 GB, 10 listeners).
