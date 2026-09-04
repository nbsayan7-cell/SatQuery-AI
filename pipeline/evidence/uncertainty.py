"""
Uncertainty Propagation Engine
Propagates input sensor radiometric uncertainties and registration offsets
through Change Vector Analysis and area calculations to generate 95% confidence intervals.
"""

from typing import Dict, Tuple, List
import numpy as np


class UncertaintyEngine:
    """
    Computes analytical and empirical error propagation for change metrics
    and provides a decomposed multi-source uncertainty framework:
    U_total = f(U_sensor, U_registration, U_radiometric, U_segmentation, U_classification)
    """

    @staticmethod
    def compute_multi_source_uncertainty(
        sensor_snr_db: float = 25.0,
        registration_rmse_m: float = 1.41,
        pixel_resolution_m: float = 10.0,
        cloud_coverage_pct: float = 3.0,
        change_contrast_ratio: float = 2.5
    ) -> Dict[str, Any]:
        """
        Calculates decomposed multi-axis remote sensing confidence scores.
        
        Returns scores for Data Quality, Registration, Change Detection,
        Semantic Classification, and Overall Evidence Quality.
        """
        # Data Quality Confidence (cloud & SNR driven)
        snr_factor = min(1.0, max(0.5, sensor_snr_db / 30.0))
        cloud_penalty = max(0.0, cloud_coverage_pct / 100.0)
        c_data = float(np.clip(snr_factor * (1.0 - cloud_penalty), 0.1, 0.99))

        # Registration Confidence
        max_allowed_rmse = 1.5 * pixel_resolution_m
        c_reg = float(np.clip(1.0 - (registration_rmse_m / max_allowed_rmse), 0.1, 0.99))

        # Change Detection Confidence (contrast / separation driven)
        c_change = float(np.clip(min(1.0, change_contrast_ratio / 3.0), 0.2, 0.98))

        # Semantic Classification Confidence
        c_semantic = float(np.clip(0.5 * c_data + 0.5 * c_change, 0.2, 0.95))

        # Overall Evidence Quality (Harmonic-weighted composite)
        overall = float(0.30 * c_data + 0.25 * c_reg + 0.25 * c_change + 0.20 * c_semantic)

        return {
            "data_quality_confidence": round(c_data, 3),
            "registration_confidence": round(c_reg, 3),
            "change_detection_confidence": round(c_change, 3),
            "semantic_classification_confidence": round(c_semantic, 3),
            "overall_evidence_quality": round(overall, 3),
            "is_statistically_trustworthy": overall >= 0.70
        }

    @staticmethod
    def propagate_cvm_uncertainty(
        x1: np.ndarray,
        x2: np.ndarray,
        sensor_sigma_x1: float = 0.02,
        sensor_sigma_x2: float = 0.02
    ) -> Dict[str, Any]:
        """
        Calculates analytical first-order Taylor expansion uncertainty on CVM:
        sigma_CVM^2 = sum_d ( (x2_d - x1_d)^2 / CVM^2 ) * (sigma_x1^2 + sigma_x2^2)
                     = sigma_x1^2 + sigma_x2^2
                     
        Therefore, under isotropic independent band noise:
        sigma_CVM = sqrt(sigma_x1^2 + sigma_x2^2)
        """
        diff = x2 - x1
        if diff.ndim == 3:
            cvm = np.sqrt(np.sum(diff**2, axis=2))
        else:
            cvm = np.abs(diff)

        mean_cvm = float(np.mean(cvm))
        
        # Quadrature sum of sensor noise
        sigma_cvm = float(np.sqrt(sensor_sigma_x1**2 + sensor_sigma_x2**2))
        
        # 95% Confidence Interval (Z = 1.96)
        ci_lower = max(0.0, float(mean_cvm - 1.96 * sigma_cvm))
        ci_upper = float(mean_cvm + 1.96 * sigma_cvm)

        return {
            "mean_cvm": round(mean_cvm, 4),
            "sigma_cvm": round(sigma_cvm, 4),
            "cvm_95ci": [round(ci_lower, 4), round(ci_upper, 4)],
            "relative_uncertainty_pct": round((1.96 * sigma_cvm / (mean_cvm + 1e-7)) * 100.0, 2)
        }

    @staticmethod
    def propagate_area_uncertainty(
        changed_pixels: int,
        pixel_area_m2: float = 100.0,
        registration_rmse_pixels: float = 0.14
    ) -> Dict[str, Any]:
        """
        Estimates changed area uncertainty arising from boundary pixel misalignment.
        Uncertainty scales with perimeter-to-area boundary ratio and registration RMSE.
        """
        nominal_area = changed_pixels * pixel_area_m2
        if changed_pixels <= 0:
            return {
                "nominal_area_m2": 0.0,
                "area_uncertainty_m2": 0.0,
                "area_95ci_m2": [0.0, 0.0],
                "uncertainty_pct": 0.0
            }

        # Perimeter proxy: 4 * sqrt(N) for compact shape
        perimeter_pixels = 4.0 * np.sqrt(changed_pixels)
        # Boundary pixel uncertainty = perimeter * rmse
        delta_pixels = perimeter_pixels * registration_rmse_pixels
        delta_area = float(delta_pixels * pixel_area_m2)

        ci_lower = max(0.0, nominal_area - 1.96 * delta_area)
        ci_upper = nominal_area + 1.96 * delta_area
        pct = (1.96 * delta_area / nominal_area) * 100.0

        return {
            "nominal_area_m2": round(nominal_area, 2),
            "area_uncertainty_m2": round(delta_area, 2),
            "area_95ci_m2": [round(ci_lower, 2), round(ci_upper, 2)],
            "uncertainty_pct": round(pct, 2)
        }
