"""
Statistical Thresholding and Binary Segmentation
Implements Otsu variance minimization and Chi-Square significance thresholding.
"""

from typing import Tuple
import numpy as np


def _chi2_critical_value(df: int, alpha: float = 0.01) -> float:
    """
    Computes Chi-Square critical value using Wilson-Hilferty approximation:
    chi2_val = df * (1 - 2/(9*df) + z * sqrt(2/(9*df)))^3
    """
    # Standard normal quantile: z_0.01 ≈ 2.3263, z_0.05 ≈ 1.6449
    z = 2.326348 if alpha <= 0.01 else 1.644853
    term1 = 1.0 - 2.0 / (9.0 * df)
    term2 = z * np.sqrt(2.0 / (9.0 * df))
    return float(df * ((term1 + term2) ** 3))


class ChangeThresholding:
    """
    Automatic statistical threshold calculation for continuous change metrics.
    """

    @staticmethod
    def otsu_threshold(metric_map: np.ndarray, num_bins: int = 256) -> Tuple[float, np.ndarray]:
        """
        Calculates optimal threshold that minimizes intra-class variance:
        sigma_w^2(t) = q1(t)*sigma1^2(t) + q2(t)*sigma2^2(t)
        
        Returns:
            Tuple of (optimal_threshold, binary_mask)
        """
        valid_data = metric_map[np.isfinite(metric_map)]
        if len(valid_data) == 0:
            return 0.0, np.zeros_like(metric_map, dtype=bool)

        min_val, max_val = float(np.min(valid_data)), float(np.max(valid_data))
        if min_val == max_val:
            return min_val, np.zeros_like(metric_map, dtype=bool)

        counts, bin_edges = np.histogram(valid_data, bins=num_bins, range=(min_val, max_val))
        bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2.0

        total_weight = float(np.sum(counts))
        if total_weight == 0:
            return min_val, np.zeros_like(metric_map, dtype=bool)

        weight_bg = 0.0
        sum_bg = 0.0
        sum_total = float(np.sum(counts * bin_centers))
        
        best_variance = -1.0
        best_thresholds = []

        for i in range(len(counts) - 1):
            weight_bg += float(counts[i])
            if weight_bg == 0:
                continue
            weight_fg = total_weight - weight_bg
            if weight_fg == 0:
                break

            sum_bg += float(counts[i] * bin_centers[i])
            mean_bg = sum_bg / weight_bg
            mean_fg = (sum_total - sum_bg) / weight_fg

            # Inter-class variance: w_bg * w_fg * (mu_bg - mu_fg)^2
            between_var = weight_bg * weight_fg * ((mean_bg - mean_fg) ** 2)
            if between_var > best_variance + 1e-5:
                best_variance = between_var
                best_thresholds = [float(bin_edges[i + 1])]
            elif abs(between_var - best_variance) <= 1e-5:
                best_thresholds.append(float(bin_edges[i + 1]))

        best_threshold = float(np.mean(best_thresholds)) if best_thresholds else min_val
        mask = metric_map >= best_threshold
        return best_threshold, mask

    @staticmethod
    def chi_square_significance(
        mahalanobis_map: np.ndarray,
        degrees_of_freedom: int,
        alpha: float = 0.01
    ) -> Tuple[float, np.ndarray]:
        """
        Calculates Chi-Square significance threshold for Mahalanobis distance squared.
        Under H0 (no change), D_M^2 follows a Chi-square distribution with d degrees of freedom.
        
        Returns:
            Tuple of (critical_threshold_dm, binary_mask)
        """
        critical_dm_squared = _chi2_critical_value(df=degrees_of_freedom, alpha=alpha)
        critical_dm = float(np.sqrt(critical_dm_squared))
        
        mask = mahalanobis_map >= critical_dm
        return critical_dm, mask
