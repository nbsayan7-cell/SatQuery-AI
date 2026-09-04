"""
Deterministic Change Detection Metrics
Computes Change Vector Analysis (CVM), band differences, percent change,
normalized differences, and SAR log-ratios.
"""

from typing import Dict, Union, List
import numpy as np


class ChangeMetrics:
    """
    Formulations for deterministic pixel-wise bi-temporal change computation.
    """

    @staticmethod
    def difference(x1: np.ndarray, x2: np.ndarray) -> np.ndarray:
        """
        Direct band-wise difference: Delta = X2 - X1
        """
        return x2 - x1

    @staticmethod
    def change_vector_magnitude(
        x1: np.ndarray,
        x2: np.ndarray,
        standardize: bool = False,
        means: np.ndarray = None,
        stds: np.ndarray = None,
        eps: float = 1e-7
    ) -> np.ndarray:
        """
        Change Vector Magnitude (CVM):
        CVM = ||X2 - X1|| = sqrt(sum_d (x2_d - x1_d)^2)
        
        If standardize is True, applies z-score normalization:
        z_d = (x_d - mu_d) / (sigma_d + eps)
        preventing high-magnitude channels (e.g. NIR=3000) from blinding lower-scale physical bands (e.g. Red=0.2, SAR=-12dB).
        """
        if standardize:
            if x1.ndim == 3:
                m1 = np.mean(x1, axis=(0, 1), keepdims=True) if means is None else means
                s1 = np.std(x1, axis=(0, 1), keepdims=True) if stds is None else stds
                x1_norm = (x1 - m1) / (s1 + eps)
                x2_norm = (x2 - m1) / (s1 + eps)
            else:
                m1 = np.mean(x1) if means is None else means
                s1 = np.std(x1) if stds is None else stds
                x1_norm = (x1 - m1) / (s1 + eps)
                x2_norm = (x2 - m1) / (s1 + eps)
            diff = x2_norm - x1_norm
        else:
            diff = x2 - x1

        if diff.ndim == 2:
            return np.abs(diff)
        elif diff.ndim == 3:
            return np.sqrt(np.sum(diff**2, axis=2))
        else:
            raise ValueError(f"Unsupported array dimensions: {diff.ndim}")

    @staticmethod
    def percent_change(x1: np.ndarray, x2: np.ndarray, eps: float = 1e-6) -> np.ndarray:
        """
        Relative percent change:
        % = 100 * (X2 - X1) / (|X1| + eps)
        """
        return 100.0 * (x2 - x1) / (np.abs(x1) + eps)

    @staticmethod
    def normalized_difference_change(x1: np.ndarray, x2: np.ndarray, eps: float = 1e-6) -> np.ndarray:
        """
        Normalized Difference Change:
        (X2 - X1) / (X2 + X1 + eps)
        """
        denom = x2 + x1 + eps
        denom = np.where(denom == 0, eps, denom)
        return np.clip((x2 - x1) / denom, -1.0, 1.0)

    @staticmethod
    def sar_log_ratio(sigma0_t1: np.ndarray, sigma0_t2: np.ndarray, eps: float = 1e-6) -> np.ndarray:
        """
        SAR Log-Ratio change metric:
        LR = ln((sigma0_t2 + eps) / (sigma0_t1 + eps))
        """
        s1 = np.maximum(sigma0_t1, eps)
        s2 = np.maximum(sigma0_t2, eps)
        return np.log(s2 / s1)
