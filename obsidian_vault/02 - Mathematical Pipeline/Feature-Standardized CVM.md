---
title: Feature-Standardized Change Vector Analysis (CVM)
tags: [satquery, math, change-detection]
type: algorithm
status: verified
---

# Feature-Standardized Change Vector Analysis (CVM)

Implemented in `pipeline/change_detect/metrics.py`.

## The Problem with Raw Euclidean Differencing
When differencing multimodal channels where Red reflectance $\in [0, 1]$, raw digital numbers $\in [0, 4000]$, and SAR backscatter $\in [-30, 0]\,\text{dB}$, uncalibrated Euclidean distance causes high-variance bands (e.g., NIR) to completely blind subtle changes in other channels.

## The Standardized Formulation
Bands are $z$-score standardized before computing Euclidean magnitude:

$$z_{t,d}(p) = \frac{x_{t,d}(p) - \mu_d}{\sigma_d + \epsilon}$$

$$\mathrm{CVM}(p) = \|\mathbf{z}_2(p) - \mathbf{z}_1(p)\|_2 = \sqrt{\sum_{d=1}^D (z_{2,d}(p) - z_{1,d}(p))^2}$$

Ensures equitable physical sensitivity across all optical and SAR modalities.\n