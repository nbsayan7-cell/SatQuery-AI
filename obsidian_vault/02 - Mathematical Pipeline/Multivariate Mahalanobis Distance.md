---
title: Multivariate Mahalanobis Distance
tags: [satquery, math, statistical]
type: algorithm
status: verified
---

# Multivariate Mahalanobis Distance

Implemented in `pipeline/change_detect/statistical.py`.

$$D_M(p) = \sqrt{\Delta \mathbf{x}(p)^T \mathbf{\Sigma}^{-1} \Delta \mathbf{x}(p)}$$

- $\mathbf{\Sigma} \in \mathbb{R}^{D \times D}$ is the covariance matrix estimated from pseudoinvariant / stable pixels.
- Under the null hypothesis of no change ($H_0$), $D_M^2 \sim \chi^2(D)$.
- Evaluated via Wilson-Hilferty transformation for significance masking ($p < 0.01$).\n