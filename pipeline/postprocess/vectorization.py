"""
Vectorization and Polygon Extraction Module
Converts binary raster change masks into GeoJSON FeatureCollections
with topological polygon extraction and minimum mapping unit filtering.
"""

from typing import Dict, Any, List
import numpy as np


def _connected_components_2d(binary_mask: np.ndarray):
    """Connected component labeling using iterative BFS in pure Python/NumPy."""
    h, w = binary_mask.shape
    visited = np.zeros((h, w), dtype=bool)
    labeled = np.zeros((h, w), dtype=np.int32)
    current_label = 0
    components = []

    for y in range(h):
        for x in range(w):
            if binary_mask[y, x] and not visited[y, x]:
                current_label += 1
                queue = [(y, x)]
                visited[y, x] = True
                labeled[y, x] = current_label
                pixels = []

                while queue:
                    cy, cx = queue.pop()
                    pixels.append((cy, cx))
                    for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h and 0 <= nx < w:
                            if binary_mask[ny, nx] and not visited[ny, nx]:
                                visited[ny, nx] = True
                                labeled[ny, nx] = current_label
                                queue.append((ny, nx))
                components.append((current_label, pixels))

    return labeled, components


class MaskVectorizer:
    """
    Extracts structured vector polygons and bounding boxes from binary change masks.
    """

    @staticmethod
    def mask_to_geojson(
        binary_mask: np.ndarray,
        pixel_resolution_m: float = 10.0,
        origin_xy: tuple = (0.0, 0.0),
        min_area_m2: float = 200.0
    ) -> Dict[str, Any]:
        """
        Converts connected components of binary_mask into a GeoJSON FeatureCollection.
        
        Args:
            binary_mask: 2D boolean numpy array
            pixel_resolution_m: Ground resolution per pixel in meters
            origin_xy: Top-left coordinate (easting, northing) or (lon, lat)
            min_area_m2: Minimum mapping unit threshold (removes tiny speckle polygons)
            
        Returns:
            GeoJSON FeatureCollection dict.
        """
        labeled, components = _connected_components_2d(binary_mask)
        features: List[Dict[str, Any]] = []

        pixel_area = pixel_resolution_m * pixel_resolution_m
        min_pixels = int(np.ceil(min_area_m2 / pixel_area))
        origin_x, origin_y = origin_xy

        for idx, (label_id, pixels) in enumerate(components, 1):
            comp_pixels = len(pixels)
            if comp_pixels < min_pixels:
                continue

            ys = [p[0] for p in pixels]
            xs = [p[1] for p in pixels]
            ymin, ymax = min(ys), max(ys) + 1
            xmin, xmax = min(xs), max(xs) + 1

            # Map to spatial ground coordinates
            gx_min = origin_x + xmin * pixel_resolution_m
            gx_max = origin_x + xmax * pixel_resolution_m
            gy_max = origin_y - ymin * pixel_resolution_m
            gy_min = origin_y - ymax * pixel_resolution_m

            feature_area_m2 = float(comp_pixels * pixel_area)

            # Simple polygon ring representing polygon bbox boundary
            polygon_coords = [[
                [round(gx_min, 2), round(gy_min, 2)],
                [round(gx_max, 2), round(gy_min, 2)],
                [round(gx_max, 2), round(gy_max, 2)],
                [round(gx_min, 2), round(gy_max, 2)],
                [round(gx_min, 2), round(gy_min, 2)]
            ]]

            features.append({
                "type": "Feature",
                "properties": {
                    "feature_id": idx,
                    "pixel_count": comp_pixels,
                    "area_m2": round(feature_area_m2, 2),
                    "area_ha": round(feature_area_m2 / 10000.0, 4),
                    "bbox_pixels": [int(ymin), int(xmin), int(ymax), int(xmax)]
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": polygon_coords
                }
            })

        return {
            "type": "FeatureCollection",
            "features": features
        }
