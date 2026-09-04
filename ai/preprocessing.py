"""
Satellite Imagery Preprocessing and Region-of-Interest (ROI) Cropping Engine.
Fulfills Phase 1A (SQ-035) of SatQuery AI v2.

WHAT:
    Extracts, normalizes, crops, and upsamples regions of interest from remote-sensing imagery.
WHY:
    Enables targeted high-resolution analysis on user-specified sub-regions (rectangles, polygons,
    points) rather than diluting model resolution across an entire scene.
INPUT:
    image_path (str), roi_geometry (dict with type: 'bbox' | 'polygon' | 'point')
OUTPUT:
    Preprocessed crop metadata, cropped image path, and spatial coordinate mapping functions.
FAILURE CASES:
    Malformed geometry, out-of-bounds coordinates, corrupted image files.
"""

import os
import uuid
from pathlib import Path
from typing import Dict, Any, Tuple, List, Optional
from PIL import Image

def parse_roi_geometry(roi_geometry: Dict[str, Any], img_width: int, img_height: int) -> Tuple[int, int, int, int]:
    """
    Parses ROI geometry (bbox, polygon, or point) into pixel bounding box coordinates: (left, top, right, bottom).
    Supports normalized percentage coordinates (0.0 - 100.0 or 0.0 - 1.0) and absolute pixel coordinates.
    """
    geom_type = roi_geometry.get("type", "bbox").lower()
    coords = roi_geometry.get("coordinates", [])

    if not coords:
        # Default to full image if no coordinates specified
        return 0, 0, img_width, img_height

    def normalize_x(val: float) -> int:
        if 0.0 <= val <= 1.0:
            return int(val * img_width)
        elif 1.0 < val <= 100.0 and any(c > 1.0 for c in (coords if isinstance(coords[0], (int, float)) else [coords[0][0]])):
            # Could be percentage 0-100
            if max(img_width, img_height) > 100 and val <= 100.0 and roi_geometry.get("is_percentage", True):
                return int((val / 100.0) * img_width)
        return int(val)

    def normalize_y(val: float) -> int:
        if 0.0 <= val <= 1.0:
            return int(val * img_height)
        elif 1.0 < val <= 100.0 and any(c > 1.0 for c in (coords if isinstance(coords[0], (int, float)) else [coords[0][1]])):
            if max(img_width, img_height) > 100 and val <= 100.0 and roi_geometry.get("is_percentage", True):
                return int((val / 100.0) * img_height)
        return int(val)

    if geom_type == "bbox":
        # Format: [x, y, w, h]
        x, y, w, h = coords[0], coords[1], coords[2], coords[3]
        left = normalize_x(x)
        top = normalize_y(y)
        width_px = normalize_x(w)
        height_px = normalize_y(h)
        right = left + width_px
        bottom = top + height_px

    elif geom_type == "polygon":
        # Format: [[x1, y1], [x2, y2], ...]
        xs = [normalize_x(pt[0]) for pt in coords]
        ys = [normalize_y(pt[1]) for pt in coords]
        left = min(xs)
        right = max(xs)
        top = min(ys)
        bottom = max(ys)

    elif geom_type == "point":
        # Format: [x, y] with radius in radius field (default 50px or 5%)
        px = normalize_x(coords[0])
        py = normalize_y(coords[1])
        radius = int(roi_geometry.get("radius", min(img_width, img_height) * 0.05))
        left = max(0, px - radius)
        right = min(img_width, px + radius)
        top = max(0, py - radius)
        bottom = min(img_height, py + radius)

    else:
        left, top, right, bottom = 0, 0, img_width, img_height

    # Clamp to valid image boundaries
    left = max(0, min(left, img_width - 1))
    top = max(0, min(top, img_height - 1))
    right = max(left + 1, min(right, img_width))
    bottom = max(top + 1, min(bottom, img_height))

    return left, top, right, bottom


def crop_and_preprocess_roi(
    image_path: str,
    roi_geometry: Dict[str, Any],
    min_dimension: int = 256,
    output_dir: Optional[Path] = None
) -> Dict[str, Any]:
    """
    Crops the ROI from the satellite image, upsamples if smaller than min_dimension,
    and returns crop metadata.
    """
    with Image.open(image_path) as img:
        img_w, img_h = img.size
        left, top, right, bottom = parse_roi_geometry(roi_geometry, img_w, img_h)

        crop_w = right - left
        crop_h = bottom - top
        area_pixels = crop_w * crop_h

        cropped = img.crop((left, top, right, bottom))

        # Check if upsampling is necessary for fine detail resolution
        was_upsampled = False
        upsample_factor = 1.0
        if crop_w < min_dimension or crop_h < min_dimension:
            scale = max(min_dimension / crop_w, min_dimension / crop_h)
            new_w = max(min_dimension, int(crop_w * scale))
            new_h = max(min_dimension, int(crop_h * scale))
            cropped = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
            was_upsampled = True
            upsample_factor = scale

        # Determine output location
        if output_dir is None:
            output_dir = Path(image_path).parent / "crops"
        output_dir.mkdir(parents=True, exist_ok=True)

        crop_id = f"crop_{uuid.uuid4().hex[:12]}"
        crop_path = output_dir / f"{crop_id}.png"
        cropped.save(crop_path, format="PNG")

        return {
            "crop_id": crop_id,
            "crop_path": str(crop_path),
            "original_bounds_px": [left, top, right, bottom],
            "crop_width_px": crop_w,
            "crop_height_px": crop_h,
            "full_width_px": img_w,
            "full_height_px": img_h,
            "area_pixels": area_pixels,
            "was_upsampled": was_upsampled,
            "upsample_factor": round(upsample_factor, 2),
            "pct_bounds": [
                round((left / img_w) * 100.0, 2),
                round((top / img_h) * 100.0, 2),
                round((crop_w / img_w) * 100.0, 2),
                round((crop_h / img_h) * 100.0, 2)
            ]
        }


def offset_crop_detections_to_scene(
    detections: List[Dict[str, Any]],
    crop_bounds_px: List[int],
    full_width_px: int,
    full_height_px: int
) -> List[Dict[str, Any]]:
    """
    Transforms local detections from a cropped sub-image coordinate frame back into the
    global full-scene percentage coordinate system (0 - 100%), ensuring drawn overlays align exactly.
    """
    left_px, top_px, right_px, bottom_px = crop_bounds_px
    crop_w_px = right_px - left_px
    crop_h_px = bottom_px - top_px

    scene_detections = []
    for d in detections:
        bbox = d.get("bbox", [0, 0, 100, 100])
        # bbox format in specialist model is [x_pct, y_pct, w_pct, h_pct] relative to the input image
        local_x_pct, local_y_pct, local_w_pct, local_h_pct = bbox

        # Convert local percentage to local pixel
        local_x_px = (local_x_pct / 100.0) * crop_w_px
        local_y_px = (local_y_pct / 100.0) * crop_h_px
        local_w_px = (local_w_pct / 100.0) * crop_w_px
        local_h_px = (local_h_pct / 100.0) * crop_h_px

        # Translate to global scene pixel
        global_x_px = left_px + local_x_px
        global_y_px = top_px + local_y_px

        # Convert back to global percentage of full scene
        global_x_pct = round((global_x_px / full_width_px) * 100.0, 2)
        global_y_pct = round((global_y_px / full_height_px) * 100.0, 2)
        global_w_pct = round((local_w_px / full_width_px) * 100.0, 2)
        global_h_pct = round((local_h_px / full_height_px) * 100.0, 2)

        scene_d = dict(d)
        scene_d["bbox"] = [global_x_pct, global_y_pct, global_w_pct, global_h_pct]
        scene_d["local_crop_bbox"] = bbox
        scene_detections.append(scene_d)

    return scene_detections
