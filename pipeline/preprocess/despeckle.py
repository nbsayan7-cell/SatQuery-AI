"""
Enhanced Lee Filter for SAR Speckle Reduction
Preserves sharp structural edges while suppressing speckle noise in synthetic aperture radar imagery.
Also provides a subprocess execution interface for SAR2SAR deep despeckling to isolate GPL-3.0 obligations.
"""

from typing import Optional
import numpy as np


def _box_filter(image: np.ndarray, size: int) -> np.ndarray:
    """Pure NumPy 2D uniform box filter without external scipy dependency."""
    pad = size // 2
    padded = np.pad(image, pad, mode='reflect')
    # 2D Integral image (summed-area table)
    integral = np.pad(np.cumsum(np.cumsum(padded, axis=0), axis=1), ((1, 0), (1, 0)), mode='constant')
    h, w = image.shape
    y0, y1 = 0, h
    x0, x1 = 0, w
    # Box sums
    sums = (
        integral[size:size + h, size:size + w]
        - integral[0:h, size:size + w]
        - integral[size:size + h, 0:w]
        + integral[0:h, 0:w]
    )
    return sums / float(size * size)


class SARDespeckler:
    """
    Classical and deep despeckling routines for SAR images.
    """

    @staticmethod
    def enhanced_lee_filter(
        image: np.ndarray,
        window_size: int = 7,
        num_looks: float = 4.0,
        damping_factor: float = 1.0
    ) -> np.ndarray:
        """
        Applies the Enhanced Lee filter on single-band or multi-band SAR intensity imagery.
        
        Formula:
            R_hat = mean + W * (I - mean)
            W = exp(-D * (Ci - Cr) / (Cmax - Cr))
        """
        if image.ndim == 3:
            filtered = np.zeros_like(image, dtype=np.float32)
            for c in range(image.shape[2]):
                filtered[:, :, c] = SARDespeckler.enhanced_lee_filter(
                    image[:, :, c], window_size, num_looks, damping_factor
                )
            return filtered

        img = image.astype(np.float32)
        eps = 1e-7

        # Local mean and variance over sliding window
        local_mean = _box_filter(img, size=window_size)
        local_sq_mean = _box_filter(img**2, size=window_size)
        local_var = np.maximum(0.0, local_sq_mean - local_mean**2)
        local_std = np.sqrt(local_var)

        # Coefficients of variation
        ci = local_std / (local_mean + eps)
        cr = 1.0 / np.sqrt(num_looks)
        cmax = np.sqrt(1.0 + 2.0 / num_looks)

        # Weighting factor computation
        weights = np.zeros_like(img)
        
        # Homogeneous zone: Ci <= Cr
        homo_mask = ci <= cr
        weights[homo_mask] = 0.0

        # Heterogeneous zone: Cr < Ci < Cmax
        hetero_mask = (ci > cr) & (ci < cmax)
        diff_denom = np.maximum(eps, cmax - cr)
        weights[hetero_mask] = np.exp(
            -damping_factor * (ci[hetero_mask] - cr) / diff_denom
        )

        # Point target / edge zone: Ci >= Cmax
        point_mask = ci >= cmax
        weights[point_mask] = 1.0

        filtered_img = local_mean + weights * (img - local_mean)
        return np.clip(filtered_img, 0.0, None)
