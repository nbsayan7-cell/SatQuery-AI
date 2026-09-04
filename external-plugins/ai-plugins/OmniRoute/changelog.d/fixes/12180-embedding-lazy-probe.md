- **fix(memory):** self-hosted embedding endpoints now vectorize — the vector width is
  measured from the first embedding that comes back instead of being read from a registry
  that cannot describe them, so `vec_memories` is created and memories stop piling up
  unvectorized behind a green health check
  ([#12180](https://github.com/diegosouzapw/OmniRoute/pull/12180)) — thanks @kanade-hoshino
