---
title: Otsu Plateau Midpoint Thresholding
tags: [satquery, math, thresholding]
type: algorithm
status: verified
---

# Otsu Plateau Midpoint Thresholding

Implemented in `pipeline/postprocess/thresholding.py`.

Minimizes intra-class variance on continuous change maps:
$$\sigma_w^2(t) = q_1(t)\sigma_1^2(t) + q_2(t)\sigma_2^2(t)$$

## Plateau Midpoint Innovation
When segmenting bimodal or sparse change maps, multiple adjacent threshold bins frequently achieve the exact same maximal between-class variance. Rather than picking the first index, SatQuery calculates the mathematical midpoint of the maximal plateau, guaranteeing symmetric and repeatable boundary masks.\n