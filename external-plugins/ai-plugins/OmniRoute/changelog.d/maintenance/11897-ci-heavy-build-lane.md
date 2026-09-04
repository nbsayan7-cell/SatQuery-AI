- The CI `build` job now runs in two concurrency lanes — `main` and pull requests —
  so a release build is never queued behind (or OOM-killed beside) PR builds on the
  self-hosted pool, which holds one `next-build` comfortably and two at the edge.
