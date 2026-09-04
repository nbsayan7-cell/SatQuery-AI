- Fixed the Alibaba free-tier allowlist test that went red on its own once the
  shipped catalog's `validUntil` (2026-08-27) passed, leaving every PR and `main`
  with a failing `Unit Tests (1/8)`. The test now builds its own packs with dates
  it controls, and covers the expired-pack fallback that production has actually
  been serving.
