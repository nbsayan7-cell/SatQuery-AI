---
title: Layer A — Core SatQuery
tags: [satquery, architecture, core]
type: architecture
status: verified
---

# Layer A — Core SatQuery

**Layer A** represents the core analytical engine answering the SIH26167 problem statement requirements:
- Single-image VQA
- Visual grounding and object detection
- Multi-region bi-temporal change detection
- Optical + SAR cross-modal fusion
- Subpixel coregistration and calibration
- Cryptographic provenance and audit logging

Connects directly with [[Layer B - Temporal Earth Explorer]] for spatial data ingestion.\n