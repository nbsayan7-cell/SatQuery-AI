- **fix(build):** `npm run build` now fails in one second with a named package and a
  copy-pasteable fix when npm silently drops an externalised optional native
  dependency, instead of dying four minutes in with `Module not found: Can't resolve
  'better-sqlite3'` ([#11863](https://github.com/diegosouzapw/OmniRoute/pull/11863)) —
  thanks @ujjawalkaushik1110
- **fix(install):** `postinstall` no longer throws `ReferenceError: isAndroid is not
  defined` — failing the whole `npm install` — when the `better-sqlite3` rebuild
  fallback times out; the manual-fix guidance is reachable again
  ([#11863](https://github.com/diegosouzapw/OmniRoute/pull/11863)) — thanks
  @ujjawalkaushik1110
