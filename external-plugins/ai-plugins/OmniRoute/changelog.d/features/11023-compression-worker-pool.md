- Run synchronous RTK and Caveman request compression in a bounded worker-thread pool, keeping
  large `/v1/responses` compression heaps outside the HTTP isolate while preserving strict
  fail-open behavior and per-engine telemetry.
