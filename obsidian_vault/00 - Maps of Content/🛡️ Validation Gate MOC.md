---
title: Validation Gate Map of Content
tags: [satquery, moc, gate, safety]
type: map-of-content
status: verified
---

# 🛡️ Validation Gate Map of Content

The **Hard Scientific Validation Gate** is SatQuery's central differentiator against generic LLMs. It prevents hallucinated change detection across invalid pairs.

> [!WARNING]
> **RULE: FAIL = STOP.** If any gate fails, the pipeline halts immediately. The LLM is never allowed to override the gate.

## The 8-Level Sequence
- **Gate G0:** File Integrity (Zero-byte and corruption check)
- **Gate G1:** Image Readability (Raster format and channel validation)
- **Gate G2:** CRS & Spatial Projection Compatibility
- **Gate G3:** Geospatial Metadata & Timestamp Validity
- **Gate G4:** [[G4 Bounding Box Overlap Gate]] ($IoU > 0\%$)
- **Gate G5:** Spatial Resolution Compatibility (within $3\times$ ratio)
- **Gate G6:** Temporal Relationship ($t_1 \neq t_2$)
- **Gate G7:** Coregistration Error (RMSE $< 1.5\times$ pixel resolution)
- **Gate G8:** Residual Alignment Quality

## Key Case Studies
- [[Kolkata vs Delhi Rejection Case]] — Empirical rejection of geographically distinct cities.
- [[LLM Non-Pollution Contract]] — Safeguard ensuring LLMs do not produce or alter evidence.\n