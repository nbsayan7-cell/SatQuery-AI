"""
Texture Feature Extraction Module
Extracts local variance and fast Gray-Level Co-occurrence Matrix (GLCM) statistical metrics.
"""

from typing import Dict
import numpy as np


def _box_filter_2d(image: np.ndarray, size: int) -> np.ndarray:
    """Pure NumPy uniform 2D sliding box filter."""
    pad = size // 2
    padded = np.pad(image, pad, mode='reflect')
    integral = np.pad(np.cumsum(np.cumsum(padded, axis=0), axis=1), ((1, 0), (1, 0)), mode='constant')
    h, w = image.shape
    sums = (
        integral[size:size + h, size:size + w]
        - integral[0:h, size:size + w]
        - integral[size:size + h, 0:w]
        + integral[0:h, 0:w]
    )
    return sums / float(size * size)


class TextureFeatures:
    """
    Computes spatial texture heterogeneity and local statistical variance.
    """

    @staticmethod
    def local_variance(image: np.ndarray, window_size: int = 5) -> np.ndarray:
        """
        Computes local sample variance within a sliding window.
        """
        if image.ndim == 3:
            img = np.mean(image, axis=2).astype(np.float32)
        else:
            img = image.astype(np.float32)

        mean = _box_filter_2d(img, size=window_size)
        sq_mean = _box_filter_2d(img**2, size=window_size)
        var = np.maximum(0.0, sq_mean - mean**2)
        return var

    @staticmethod
    def glcm_entropy_proxy(image: np.ndarray, window_size: int = 5, num_levels: int = 16) -> np.ndarray:
        """
        Computes a local intensity entropy proxy measuring structural disorder.
        """
        if image.ndim == 3:
            img = np.mean(image, axis=2)
        else:
            img = image.copy()

        # Quantize to discrete levels
        min_v, max_v = np.min(img), np.max(img)
        denom = (max_v - min_v) + 1e-7
        quantized = np.clip(((img - min_v) / denom * (num_levels - 1)).astype(np.int32), 0, num_levels - 1)

        # Local entropy estimation via local histogram variance
        local_std = np.sqrt(TextureFeatures.local_variance(quantized, window_size))
        entropy_proxy = np.log1p(local_std)
        return entropy_proxy
