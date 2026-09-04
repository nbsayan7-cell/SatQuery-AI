---
title: Spatially Indexed Multidimensional Pixel Field
tags: [satquery, math, remote-sensing]
type: scientific-concept
status: verified
---

# Spatially Indexed Multidimensional Pixel Field

In SatQuery AI, a satellite image is **not a photograph**. It is treated as a **spatially indexed multidimensional measurement field**:

$$\mathbf{p} = \left\langle \text{Geo}(\phi, \lambda, z), \; \text{Time}(t), \; \mathbf{R}_{\text{optical BOA}}, \; \boldsymbol{\sigma}^0_{\text{SAR}}, \; \mathbf{F}_{\text{derived}}, \; \Delta \mathbf{F}_{\text{temporal}}, \; \mathbf{Q}_{\text{quality}} \right\rangle$$

```text
Pixel p
├── Geographic: [latitude, longitude, CRS coordinates, pixel_width, pixel_height]
├── Temporal:   [timestamp_t1, timestamp_t2, delta_days]
├── Optical:    [B2(Blue), B3(Green), B4(Red), B8(NIR), B11(SWIR1), B12(SWIR2)] (BOA reflectance)
├── SAR:        [sigma0_VV_dB, sigma0_VH_dB, incidence_angle, pol_ratio]
├── Derived:    [NDVI, NDWI, NDBI, SAVI, texture_entropy]
├── Temporal Δ: [delta_Band_d, delta_NDVI, delta_NDWI, delta_SAR_ratio]
└── Quality:    [cloud_mask, registration_rmse, valid_data_flag, classification_entropy]
```

Next step in pipeline: [[Subpixel Phase Cross-Correlation]].\n