"""
Spectral Index Computation Module
Calculates NDVI, NDWI, NDBI, and SAVI with strict floating-point stability and boundary checks.
"""

from typing import Dict
import numpy as np


class SpectralIndices:
    """
    Computes optical spectral vegetation, water, and built-up indices.
    All return arrays strictly bounded to [-1.0, 1.0].
    """

    @staticmethod
    def ndvi(nir: np.ndarray, red: np.ndarray, eps: float = 1e-7) -> np.ndarray:
        """
        Normalized Difference Vegetation Index:
        NDVI = (NIR - Red) / (NIR + Red + eps)
        """
        denom = nir + red + eps
        denom = np.where(denom == 0, eps, denom)
        idx = (nir - red) / denom
        return np.clip(idx, -1.0, 1.0)

    @staticmethod
    def ndwi(green: np.ndarray, nir: np.ndarray, eps: float = 1e-7) -> np.ndarray:
        """
        Normalized Difference Water Index (McFeeters):
        NDWI = (Green - NIR) / (Green + NIR + eps)
        """
        denom = green + nir + eps
        denom = np.where(denom == 0, eps, denom)
        idx = (green - nir) / denom
        return np.clip(idx, -1.0, 1.0)

    @staticmethod
    def ndbi(swir: np.ndarray, nir: np.ndarray, eps: float = 1e-7) -> np.ndarray:
        """
        Normalized Difference Built-up Index:
        NDBI = (SWIR - NIR) / (SWIR + NIR + eps)
        """
        denom = swir + nir + eps
        denom = np.where(denom == 0, eps, denom)
        idx = (swir - nir) / denom
        return np.clip(idx, -1.0, 1.0)

    @staticmethod
    def savi(nir: np.ndarray, red: np.ndarray, l_factor: float = 0.5, eps: float = 1e-7) -> np.ndarray:
        """
        Soil Adjusted Vegetation Index:
        SAVI = ((NIR - Red) / (NIR + Red + L)) * (1 + L)
        """
        denom = nir + red + l_factor + eps
        idx = ((nir - red) / denom) * (1.0 + l_factor)
        return np.clip(idx, -1.0, 1.0)

    @classmethod
    def compute_all(
        cls,
        blue: np.ndarray,
        green: np.ndarray,
        red: np.ndarray,
        nir: np.ndarray,
        swir: np.ndarray
    ) -> Dict[str, np.ndarray]:
        """
        Computes all standard indices given 5 optical bands.
        """
        return {
            "ndvi": cls.ndvi(nir, red),
            "ndwi": cls.ndwi(green, nir),
            "ndbi": cls.ndbi(swir, nir),
            "savi": cls.savi(nir, red)
        }
