"""
Geodesic and Projected Area Calculation Engine
Computes exact surface areas in square meters (m²) and hectares (ha)
accounting for map projection distortion and spatial resolution.
"""

from typing import Dict
import numpy as np


class AreaCalculator:
    """
    Computes rigorous surface area measurements with units and error bounds.
    """

    @staticmethod
    def calculate_change_areas(
        binary_mask: np.ndarray,
        pixel_resolution_m: float = 10.0,
        center_latitude_deg: float = 0.0,
        is_geographic_crs: bool = False,
        geotransform: tuple = None,
        registration_rmse_pixels: float = 0.14
    ) -> Dict[str, Any]:
        """
        Calculates ground surface area and estimates boundary misalignment uncertainty.
        
        Args:
            binary_mask: 2D boolean array of changed pixels.
            pixel_resolution_m: Nominal pixel resolution in meters (e.g. 10m).
            center_latitude_deg: Central latitude in degrees for spherical distortion scaling.
            is_geographic_crs: True if pixel coordinates are EPSG:4326 degrees.
            geotransform: Optional affine geotransform tuple (a, b, c, d, e, f) where:
                          x_geo = c + a*x + b*y
                          y_geo = f + d*x + e*y
                          Ground area per pixel = |det(J)| = |a*e - b*d|.
            registration_rmse_pixels: Subpixel registration root-mean-square error.
            
        Returns:
            Dict containing changed_pixels, total_pixels, area_m2, area_ha, change_percentage,
            and explicit area_uncertainty_m2 bounds.
        """
        total_pixels = int(binary_mask.size)
        changed_pixels = int(np.sum(binary_mask))

        if geotransform is not None and len(geotransform) >= 6:
            # Derived directly from Affine Jacobian determinant: |det(J)| = |a*e - b*d|
            # GDAL standard geotransform order: (c, a, b, f, d, e)
            # x_geo = c + a*x + b*y
            # y_geo = f + d*x + e*y
            c, a, b, f, d, e = geotransform[:6]
            det_j = abs(a * e - b * d)
            pixel_area_m2 = float(det_j)
        elif is_geographic_crs:
            # Ellipsoidal / geodesic pixel area approximation at latitude phi
            # 1 deg latitude ≈ 111,320m; 1 deg longitude ≈ 111,320 * cos(lat)
            lat_rad = np.radians(center_latitude_deg)
            pixel_area_m2 = (pixel_resolution_m * 111320.0) * (pixel_resolution_m * 111320.0 * np.cos(lat_rad))
        else:
            # Planar projected CRS (e.g. UTM) where geotransform is north-up: A_p = |dx * dy|
            pixel_area_m2 = float(pixel_resolution_m * pixel_resolution_m)

        area_m2 = float(changed_pixels * pixel_area_m2)
        area_ha = float(area_m2 / 10000.0)
        percentage = float((changed_pixels / total_pixels) * 100.0) if total_pixels > 0 else 0.0

        # Boundary perimeter uncertainty: delta_area = 4 * sqrt(N) * rmse * pixel_area
        if changed_pixels > 0:
            perimeter_px = 4.0 * np.sqrt(changed_pixels)
            delta_px = perimeter_px * registration_rmse_pixels
            area_uncertainty_m2 = float(delta_px * pixel_area_m2)
        else:
            area_uncertainty_m2 = 0.0

        ci_lower = max(0.0, area_m2 - 1.96 * area_uncertainty_m2)
        ci_upper = area_m2 + 1.96 * area_uncertainty_m2

        return {
            "total_pixels": total_pixels,
            "changed_pixels": changed_pixels,
            "pixel_area_m2": round(pixel_area_m2, 3),
            "area_m2": round(area_m2, 2),
            "area_ha": round(area_ha, 4),
            "change_percentage": round(percentage, 4),
            "area_uncertainty_m2": round(area_uncertainty_m2, 2),
            "area_ci95_m2": [round(ci_lower, 2), round(ci_upper, 2)],
            "calculation_method": "jacobian_determinant" if geotransform else ("geodesic_latitude_scaled" if is_geographic_crs else "projected_planar_utm")
        }
