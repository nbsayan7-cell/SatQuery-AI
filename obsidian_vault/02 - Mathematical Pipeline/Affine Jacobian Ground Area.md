---
title: Affine Jacobian Ground Area Calculation
tags: [satquery, math, area]
type: algorithm
status: verified
---

# Affine Jacobian Ground Area Calculation

Implemented in `pipeline/postprocess/area_calc.py`.

## True Surface Area Derivation
Naive cosine multiplications ($\Delta x \Delta y \cos \phi$) are mathematically invalid on planar projected grids. SatQuery derives ground pixel area directly from the Affine Geotransform Jacobian determinant:

$$A_{\text{pixel}} = |\det(J)| = |a \cdot e - b \cdot d|$$

where $(c, a, b, f, d, e)$ represents the GDAL geotransform:
- $x_{\text{geo}} = c + ax + by$
- $y_{\text{geo}} = f + dx + ey$

Total changed surface area:
$$A_{\text{changed}} = \sum_{p \in M} A_{\text{pixel}}(p)$$

## Analytical Perimeter Boundary Uncertainty
Satellite area is never "exact" due to subpixel alignment errors along feature boundaries. SatQuery reports analytical uncertainty bounds:

$$\delta_{\text{area}} = 4 \sqrt{N_{\text{changed}}} \cdot \mathrm{RMSE}_{\text{reg}} \cdot A_{\text{pixel}}$$

$$\mathrm{UI}_{95}(A) = [A_{\text{changed}} - 1.96 \delta_{\text{area}},\, A_{\text{changed}} + 1.96 \delta_{\text{area}}]$$\n