- Add a tenant-bound Video Bridge drill-down lifecycle on top of the existing secure cache
  substrate: opaque hashed handles (never raw session/video identifiers), preview/standard/detail
  multiresolution variants resampled on read, response pagination capped at 8 frames and 32 MiB,
  and a new authenticated `/api/v1/video-bridge/drilldown` consumer route that stays disabled for
  remote access by default and denies cross-key access with the same response as a nonexistent
  handle (no existence oracle).
