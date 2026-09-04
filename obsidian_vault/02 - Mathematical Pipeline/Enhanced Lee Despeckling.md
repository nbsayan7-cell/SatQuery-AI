---
title: Enhanced Lee Radar Despeckling
tags: [satquery, math, sar]
type: algorithm
status: verified
---

# Enhanced Lee Radar Despeckling

Implemented in `pipeline/preprocess/despeckle.py` in pure NumPy without SciPy dependencies:

$$\hat{R} = \bar{I} + W (I - \bar{I}), \quad W = \exp\left( -\frac{D(C_I - C_R)}{C_{\max} - C_R} \right)$$

where $C_I = \sigma_I / \bar{I}$ is the local coefficient of variation and $C_R = 1 / \sqrt{L}$ ($L=\text{looks}$).

Preserves subtle linear and point targets (e.g., ships, building corners) while suppressing multiplicative radar speckle noise.\n