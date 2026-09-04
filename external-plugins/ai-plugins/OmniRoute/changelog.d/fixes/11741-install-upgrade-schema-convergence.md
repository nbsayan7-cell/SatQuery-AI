- **fix(db):** `model_capabilities` is created by a migration instead of lazily on the first
  models.dev sync, so a clean install and an upgraded install converge on the same schema
  regardless of which features have run
- **fix(ci):** `check:install-upgrade` now fails on an `npm` install truncated by ENOSPC
  (npm reports it as a warning and still exits 0), authenticates its health probe so the
  version assertion works against the hardened health payload, frees the clean-install tree
  before the upgrade phase, and no longer reports a schema divergence computed from a boot
  that never served
