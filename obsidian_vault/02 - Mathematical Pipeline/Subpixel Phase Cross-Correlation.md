---
title: Subpixel Phase Cross-Correlation
tags: [satquery, math, coregistration]
type: algorithm
status: verified
---

# Subpixel Phase Cross-Correlation

Implemented in `pipeline/preprocess/coregistration.py`. Recovers translational spatial offsets between temporal scenes using the Fourier Shift Theorem:

$$R = \frac{\mathcal{F}\{I_1\} \cdot \mathcal{F}^*\{I_2\}}{|\mathcal{F}\{I_1\} \cdot \mathcal{F}^*\{I_2\}|}$$

$$\Delta \mathbf{r} = (\Delta x, \Delta y) = \mathrm{argmax}\left( \mathcal{F}^{-1}\{R\} \right)$$

- **Subpixel Peak Interpolation:** 2D parabolic interpolation achieves shift recovery within $<0.1$ pixel.
- **Hard Gate Check:** If residual $\mathrm{RMSE}_{\mathrm{reg}} > 1.5 \times \text{resolution}$, [[G0-G8 Hard Scientific Gate]] terminates execution.\n