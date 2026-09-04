---
title: SHA-256 Provenance Fingerprint
tags: [satquery, api, security]
type: contract
status: verified
---

# SHA-256 Provenance Fingerprint

Implemented in `pipeline/evidence/assembler.py`:
- Calculates a SHA-256 checksum over raw input image buffers.
- Calculates a SHA-256 checksum over numerical output metrics.
- Embedded in `analysis_result.json`. Guarantees non-repudiation and makes numerical hallucination impossible to hide.\n