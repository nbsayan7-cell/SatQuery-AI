- Dropped the stale-`.eslintcache` `restore-keys` fallback from both "Restore ESLint file
  cache" steps in `ci.yml`, so the blocking `Lint` job can no longer be served per-file
  verdicts computed under a different lint config, suppressions file or lockfile. `quality.yml`
  had already dropped it in #11963; `ci.yml` — the workflow that actually gates PRs — had not
  (#11600).
