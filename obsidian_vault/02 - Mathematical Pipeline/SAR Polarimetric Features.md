---
title: SAR Polarimetric Features
tags: [satquery, math, sar]
type: algorithm
status: verified
---

# SAR Polarimetric Features

Implemented in `pipeline/feature_extract/sar_features.py` for dual-polarization Sentinel-1 GRD imagery:

- **Decibel Calibration:**
  $$\sigma^0_{\mathrm{dB}} = 10 \cdot \log_{10}(\sigma^0 + \epsilon)$$
- **Cross-Polarization Ratio:**
  $$R_{\mathrm{pol}} = \frac{\sigma^0_{\mathrm{VH}}}{\sigma^0_{\mathrm{VV}} + \epsilon}$$
- **Polarization Difference:**
  $$D_{\mathrm{pol}} = \sigma^0_{\mathrm{VV, dB}} - \sigma^0_{\mathrm{VH, dB}}$$

Separates double-bounce urban structures from specular water surfaces.\n