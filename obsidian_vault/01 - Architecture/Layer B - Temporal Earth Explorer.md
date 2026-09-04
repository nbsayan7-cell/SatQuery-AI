---
title: Layer B — Temporal Earth Explorer (TEE)
tags: [satquery, architecture, globe]
type: architecture
status: verified
---

# Layer B — Temporal Earth Explorer (TEE)

**Layer B** is an interactive 3D geospatial data selection interface built on **CesiumJS**:
- Realistic 3D Earth view with tactical HUD.
- Historical acquisition timeline (displaying authentic observation dates from Sentinel-1 and Sentinel-2).
- Extracts bounding-box sectors directly from open providers (NASA GIBS / Copernicus Open STAC).
- Automatically feeds extracted pairs into [[Layer A - Core SatQuery]] for analysis.

> [!TIP]
> In an SIH demonstration, present Layer B at the end of your pitch ([[5-Step Demo Flow]]), proving it is a data-selection interface rather than a distracting visual toy.\n