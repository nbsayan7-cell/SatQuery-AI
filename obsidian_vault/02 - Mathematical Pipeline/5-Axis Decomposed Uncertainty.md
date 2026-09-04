---
title: 5-Axis Decomposed Uncertainty Framework
tags: [satquery, math, uncertainty]
type: algorithm
status: verified
---

# 5-Axis Decomposed Uncertainty Framework

Implemented in `pipeline/evidence/uncertainty.py`. Replaces monolithic "AI confidence" with five physically observable axes:

$$U_{\text{total}} = f(U_{\text{sensor}}, U_{\text{registration}}, U_{\text{radiometric}}, U_{\text{segmentation}}, U_{\text{classification}})$$

1. **$C_{\text{data}}$ (Data Quality):** Driven by sensor SNR and cloud obscuration penalty.
2. **$C_{\text{reg}}$ (Registration Quality):** Function of subpixel phase coregistration RMSE relative to resolution.
3. **$C_{\text{change}}$ (Change Separation):** Signal-to-noise separation between changed and background pixels.
4. **$C_{\text{semantic}}$ (Semantic Confidence):** Land-cover classification entropy.
5. **$C_{\text{overall}}$ (Evidence Quality):** Composite score; flags whether the analysis is statistically trustworthy ($\ge 0.70$).\n