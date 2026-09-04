- Added a unit test that fails seven days before any dated pack under `config/`
  (`validUntil` and sibling keys) lapses, naming the file and key. The Alibaba
  free-tier pack expired on 2026-08-27 and turned every PR red the next morning
  with no commit involved; renewal now happens on someone's terms, not the clock's.
