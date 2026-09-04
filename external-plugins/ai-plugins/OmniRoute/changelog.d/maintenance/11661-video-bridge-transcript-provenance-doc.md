- **docs(video):** clarify that the Video Bridge transcript `source` field (`client`,
  `embedded`, `audio-bridge`) is presently caller-declared and not yet server-verified —
  OmniRoute enforces the enum shape but does not cryptographically confirm that an
  `embedded`/`audio-bridge` label came from a server-owned extraction
  ([#11661](https://github.com/diegosouzapw/OmniRoute/issues/11661)).
