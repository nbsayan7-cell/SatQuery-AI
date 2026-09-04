"""
SAR Polarimetric Feature Extraction
Extracts sigma0 (dB), cross-polarization ratio (VV/VH), and polarimetric differences.
"""

from typing import Dict
import numpy as np


class SARFeatures:
    """
    Computes polarimetric features from dual-pol (VV, VH) calibrated Sentinel-1 GRD imagery.
    """

    @staticmethod
    def to_db(sigma0_linear: np.ndarray, eps: float = 1e-7) -> np.ndarray:
        """
        Converts linear radar backscatter to decibels (dB):
        sigma0_dB = 10 * log10(sigma0 + eps)
        """
        clipped = np.maximum(sigma0_linear, eps)
        return 10.0 * np.log10(clipped)

    @staticmethod
    def pol_ratio(sigma0_vh: np.ndarray, sigma0_vv: np.ndarray, eps: float = 1e-7) -> np.ndarray:
        """
        Cross-polarization ratio: VH / (VV + eps)
        Sensitive to volume scattering (vegetation canopy structure).
        """
        return sigma0_vh / (sigma0_vv + eps)

    @staticmethod
    def pol_difference_db(sigma0_vv_db: np.ndarray, sigma0_vh_db: np.ndarray) -> np.ndarray:
        """
        Difference in dB scale: VV_dB - VH_dB
        Equivalent to 10 * log10(VV / VH).
        """
        return sigma0_vv_db - sigma0_vh_db

    @classmethod
    def extract(cls, vv: np.ndarray, vh: np.ndarray) -> Dict[str, np.ndarray]:
        """
        Extracts complete SAR polarimetric feature suite.
        """
        vv_db = cls.to_db(vv)
        vh_db = cls.to_db(vh)
        ratio = cls.pol_ratio(vh, vv)
        diff_db = cls.pol_difference_db(vv_db, vh_db)
        
        return {
            "sigma0_vv_db": vv_db,
            "sigma0_vh_db": vh_db,
            "pol_ratio_vh_vv": ratio,
            "pol_difference_db": diff_db
        }
