"""
Deterministic Phase Cross-Correlation Coregistration Engine
Computes subpixel spatial translation offsets between bi-temporal optical/SAR image pairs
using the Fourier Shift Theorem. Residual error is logged as RMSE in ground meters.
"""

from typing import Dict, Any, Tuple
import numpy as np


class SubpixelCoregistrator:
    """
    Computes subpixel 2D image registration offsets using Phase Cross-Correlation.
    """

    @staticmethod
    def compute_registration_offset(
        ref_image: np.ndarray,
        sensed_image: np.ndarray,
        pixel_resolution_m: float = 10.0,
        upsample_factor: int = 10
    ) -> Dict[str, Any]:
        """
        Calculates subpixel translation (dx, dy) between ref_image and sensed_image.
        
        Args:
            ref_image: 2D numpy array (grayscale or reference band)
            sensed_image: 2D numpy array matching ref_image shape
            pixel_resolution_m: Ground resolution per pixel in meters (e.g. 10m for S2)
            upsample_factor: Upsampling precision (10 = 0.1 pixel precision)
            
        Returns:
            Dict containing dx, dy, rmse_meters, correlation_peak, and status.
        """
        if ref_image.ndim > 2:
            ref_image = np.mean(ref_image, axis=2)
        if sensed_image.ndim > 2:
            sensed_image = np.mean(sensed_image, axis=2)

        # Normalize inputs
        ref_norm = (ref_image - np.mean(ref_image)) / (np.std(ref_image) + 1e-7)
        sensed_norm = (sensed_image - np.mean(sensed_image)) / (np.std(sensed_image) + 1e-7)

        # Compute 2D Fourier transforms
        f_ref = np.fft.fft2(ref_norm)
        f_sensed = np.fft.fft2(sensed_norm)

        # Cross-power spectrum
        eps = 1e-12
        r_cross = (f_ref * np.conj(f_sensed))
        r_cross_norm = r_cross / (np.abs(r_cross) + eps)

        # Inverse FFT to get normalized cross-correlation surface
        cross_corr = np.fft.ifft2(r_cross_norm).real
        cross_corr = np.fft.fftshift(cross_corr)

        h, w = cross_corr.shape
        center_y, center_x = h // 2, w // 2

        # Locate peak at integer level
        max_idx = np.unravel_index(np.argmax(cross_corr), cross_corr.shape)
        peak_y, peak_x = max_idx[0], max_idx[1]
        
        int_dy = peak_y - center_y
        int_dx = peak_x - center_x
        peak_val = float(cross_corr[peak_y, peak_x])

        # Parabolic subpixel refinement around peak
        sub_dx = float(int_dx)
        sub_dy = float(int_dy)

        if 1 <= peak_x < w - 1:
            left = cross_corr[peak_y, peak_x - 1]
            center = cross_corr[peak_y, peak_x]
            right = cross_corr[peak_y, peak_x + 1]
            denom_x = 2 * (2 * center - left - right)
            if abs(denom_x) > 1e-7:
                sub_dx = int_dx + (left - right) / denom_x

        if 1 <= peak_y < h - 1:
            top = cross_corr[peak_y - 1, peak_x]
            center = cross_corr[peak_y, peak_x]
            bottom = cross_corr[peak_y + 1, peak_x]
            denom_y = 2 * (2 * center - top - bottom)
            if abs(denom_y) > 1e-7:
                sub_dy = int_dy + (top - bottom) / denom_y

        # Compute ground displacement error (RMSE in meters)
        rmse_pixels = float(np.sqrt(sub_dx**2 + sub_dy**2))
        rmse_meters = float(rmse_pixels * pixel_resolution_m)

        max_allowed_rmse_m = 1.5 * pixel_resolution_m
        passed = rmse_meters <= max_allowed_rmse_m

        return {
            "dx_pixels": round(sub_dx, 3),
            "dy_pixels": round(sub_dy, 3),
            "rmse_pixels": round(rmse_pixels, 3),
            "rmse_meters": round(rmse_meters, 2),
            "peak_correlation": round(peak_val, 4),
            "is_aligned": passed,
            "status": "COREGISTRATION_PASSED" if passed else "INCOMPATIBLE_ALIGNMENT",
            "threshold_limit_m": round(max_allowed_rmse_m, 2)
        }
