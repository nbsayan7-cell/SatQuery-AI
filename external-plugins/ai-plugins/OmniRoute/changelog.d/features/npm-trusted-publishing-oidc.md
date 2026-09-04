- The npm publish is automatic again, through npm Trusted Publishing (OIDC): the hosted
  `stage-npm` job publishes with a short-lived credential minted from GitHub's id-token —
  no `NPM_TOKEN`, no 2FA prompt, provenance attached. `publish_mode=staged` (owner
  approves with 2FA) and `direct` (token) remain available on `workflow_dispatch`.
