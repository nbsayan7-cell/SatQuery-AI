"""
Statistical Change Detection Module
Computes Mahalanobis distance with covariance estimation over pseudoinvariant pixels,
and Z-score normalized difference metrics.
"""

from typing import Tuple
import numpy as np


class StatisticalChange:
    """
    Multivariate statistical change detection algorithms.
    """

    @staticmethod
    def mahalanobis_distance(
        x1: np.ndarray,
        x2: np.ndarray,
        stable_mask: np.ndarray = None
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Computes the pixel-wise Mahalanobis distance of the difference vector:
        D_M = sqrt(Delta^T * Sigma^-1 * Delta)
        
        Args:
            x1: Feature tensor at time 1 (H x W x D)
            x2: Feature tensor at time 2 (H x W x D)
            stable_mask: Optional boolean mask (H x W) of stable/no-change pixels.
            
        Returns:
            Tuple of (d_m_map, covariance_matrix)
        """
        diff = (x2 - x1).astype(np.float64)
        h, w, d = diff.shape
        diff_reshaped = diff.reshape(-1, d)

        if stable_mask is not None and np.sum(stable_mask) > d:
            # Estimate covariance from known stable pixels
            stable_flat = stable_mask.reshape(-1)
            sample_diff = diff_reshaped[stable_flat]
        else:
            # Iterative pseudo-invariant pixel estimation
            initial_norm = np.linalg.norm(diff_reshaped, axis=1)
            lower_quantile = np.percentile(initial_norm, 30)
            sample_diff = diff_reshaped[initial_norm <= lower_quantile]

        # Compute regularized covariance matrix
        cov = np.cov(sample_diff, rowvar=False)
        reg_cov = cov + np.eye(d) * 1e-5
        
        try:
            inv_cov = np.linalg.inv(reg_cov)
        except np.linalg.LinAlgError:
            inv_cov = np.linalg.pinv(reg_cov)

        # Vectorized calculation: D_M^2 = sum_j sum_k Delta_j * InvCov_jk * Delta_k
        left = np.dot(diff_reshaped, inv_cov)
        dm_squared = np.sum(left * diff_reshaped, axis=1)
        dm_squared = np.maximum(0.0, dm_squared)
        dm_map = np.sqrt(dm_squared).reshape(h, w)

        return dm_map, cov

    @staticmethod
    def z_score_change(
        x1: np.ndarray,
        x2: np.ndarray,
        baseline_std: np.ndarray = None
    ) -> np.ndarray:
        """
        Z-Score Normalized Change:
        Z = (X2 - X1) / sigma
        """
        diff = x2 - x1
        if baseline_std is None:
            # Compute spatial standard deviation across image
            sigma = np.std(diff, axis=(0, 1), keepdims=True) + 1e-7
        else:
            sigma = baseline_std + 1e-7
        return diff / sigma
