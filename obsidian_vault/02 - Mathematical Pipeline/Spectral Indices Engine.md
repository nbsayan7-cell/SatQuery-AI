---
title: Spectral Indices Engine
tags: [satquery, math, optical]
type: algorithm
status: verified
---

# Spectral Indices Engine

Implemented in `pipeline/feature_extract/spectral_indices.py`. Calculates physically bounded surface reflectance indices with floating-point epsilon guards:

- **NDVI (Normalized Difference Vegetation Index):**
  $$\mathrm{NDVI} = \frac{B_8 - B_4}{B_8 + B_4 + \epsilon}$$
- **NDWI (Normalized Difference Water Index):**
  $$\mathrm{NDWI} = \frac{B_3 - B_8}{B_3 + B_8 + \epsilon}$$
- **NDBI (Normalized Difference Built-up Index):**
  $$\mathrm{NDBI} = \frac{B_{11} - B_8}{B_{11} + B_8 + \epsilon}$$
- **SAVI (Soil-Adjusted Vegetation Index):**
  $$\mathrm{SAVI} = \frac{(B_8 - B_4)(1 + L)}{B_8 + B_4 + L}, \quad L = 0.5$$

All indices are strictly bounded in $[-1.0, 1.0]$.\n