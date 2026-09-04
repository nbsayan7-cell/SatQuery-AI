- `check:workflows` now fails (under `--strict`/`--ratchet`) when any job routed to a
  self-hosted runner publishes with `--provenance` — npm rejects that with `422` at the
  registry, which in v3.8.50 only surfaced after the tag and Docker images were public.
