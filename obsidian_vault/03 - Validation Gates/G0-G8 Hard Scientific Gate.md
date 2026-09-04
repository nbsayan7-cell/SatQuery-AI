---
title: G0-G8 Hard Scientific Validation Gate
tags: [satquery, gate, safety]
type: validation-gate
status: verified
---

# G0-G8 Hard Scientific Validation Gate

Implemented in `ai/pair_validator.py`. A non-negotiable 8-level gate executed before any pixel differencing begins.

```text
[G0 File Integrity] ──► [G1 Readability] ──► [G2 CRS Match] ──► [G3 Metadata]
         │                     │                    │                 │
        FAIL                  FAIL                 FAIL              FAIL
         ▼                     ▼                    ▼                 ▼
       STOP                  STOP                 STOP              STOP
         │                     │                    │                 │
[G4 BBox Overlap > 0%] ──► [G5 Resolution] ──► [G6 Time Delta] ──► [G7 Coreg RMSE]
         │                     │                    │                 │
        FAIL                  FAIL                 FAIL              FAIL
         ▼                     ▼                    ▼                 ▼
       STOP                  STOP                 STOP              STOP
         │
    [G8 Residual Alignment Quality] ──► PASS ──► Scientific Pipeline Executes
```

See: [[Kolkata vs Delhi Rejection Case]], [[G4 Bounding Box Overlap Gate]].\n