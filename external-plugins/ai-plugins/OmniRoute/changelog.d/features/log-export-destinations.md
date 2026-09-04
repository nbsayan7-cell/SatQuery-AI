- **feat(dashboard):** continuously export call logs to external analytics stores. A pluggable
  destination registry ships the full Logs-tab record set on an hourly `JobRegistry` cron, with
  a persisted per-destination cursor, batched inserts, a config UI rendered from each
  destination's own field descriptors, and a REST layer (`/api/log-export/*`) for CRUD, a
  connection test, and an on-demand run. A destination can opt into `includeBodies` to also ship
  the request and response payloads shown in the Logs detail pane, including the client and
  provider views of each call; this is off by default, and payloads inherit the dashboard's PII
  sanitisation, secret redaction and `noLog` handling. Google BigQuery is the first destination,
  using a service-account key stored encrypted at rest and streaming inserts keyed by call-log id,
  into a table that is day-partitioned on `timestamp` and clustered on `api_key_name`, `provider`,
  `model` and `status`.
