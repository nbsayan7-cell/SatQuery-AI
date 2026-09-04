"""
Region-of-Interest (ROI) Analysis Service.
Coordinates image cropping, model dispatch, coordinate alignment, and audit tracing.
Fulfills Phase 1A (SQ-035) of SatQuery AI v2.
"""

import uuid
from typing import Dict, Any, Optional
from fastapi import HTTPException
from backend.config import UPLOAD_DIR
from ai.preprocessing import crop_and_preprocess_roi, offset_crop_detections_to_scene
from ai.models.vqa import VQAModel
from ai.models.captioning import CaptioningModel
from backend.services.audit_service import AuditService

class RegionService:
    @staticmethod
    async def analyze_region(
        image_id: str,
        roi_geometry: Dict[str, Any],
        question: Optional[str] = "Analyze this region",
        task: Optional[str] = "vqa"
    ) -> Dict[str, Any]:
        """
        Processes a targeted Region-of-Interest within an uploaded satellite scene.
        """
        matched_files = list(UPLOAD_DIR.glob(f"{image_id}.*"))
        if not matched_files:
            raise HTTPException(status_code=404, detail=f"Image with ID {image_id} not found.")

        image_path = str(matched_files[0])
        trace_id = f"trace_roi_{uuid.uuid4().hex[:12]}"

        # Step 1: Preprocess and Crop ROI
        crop_info = crop_and_preprocess_roi(
            image_path=image_path,
            roi_geometry=roi_geometry,
            min_dimension=256,
            output_dir=UPLOAD_DIR / "crops"
        )

        crop_path = crop_info["crop_path"]
        effective_question = (question or "Describe this region").strip()
        lower_q = effective_question.lower()

        # Step 2: Dispatch to specialist model using cropped high-resolution patch
        if task == "caption" or any(w in lower_q for w in ["describe", "caption", "overview", "summary"]):
            raw_result = await CaptioningModel.analyze(crop_path, effective_question)
            selected_model = raw_result.get("model_used", "captioning-roi-specialist")
        else:
            raw_result = await VQAModel.analyze(crop_path, effective_question)
            selected_model = raw_result.get("model_used", "vqa-roi-specialist")

        # Step 3: Offset local crop detections back to global scene coordinates
        local_grounding = raw_result.get("grounding", [])
        global_grounding = offset_crop_detections_to_scene(
            detections=local_grounding,
            crop_bounds_px=crop_info["original_bounds_px"],
            full_width_px=crop_info["full_width_px"],
            full_height_px=crop_info["full_height_px"]
        )

        # Include the ROI selection box itself in the overlay
        roi_pct_bbox = crop_info["pct_bounds"]
        per_region_overlay = [
            {
                "bbox": roi_pct_bbox,
                "label": "Selected ROI",
                "is_roi_container": True
            }
        ] + global_grounding

        # Step 4: Build response and trace
        answer = raw_result.get("answer", "Region analyzed.")
        confidence = raw_result.get("confidence", 0.90)

        # Enhance answer with regional precision context
        if crop_info.get("was_upsampled"):
            precision_note = f" (Analyzed via {crop_info['upsample_factor']}x super-resolved sub-region)"
        else:
            precision_note = f" (Analyzed at native resolution: {crop_info['crop_width_px']}x{crop_info['crop_height_px']}px)"

        enhanced_answer = f"[ROI Analysis] {answer}{precision_note}"

        response_payload = {
            "status": "success",
            "image_id": image_id,
            "trace_id": trace_id,
            "task": task,
            "question": effective_question,
            "result": {
                "answer": enhanced_answer,
                "confidence": confidence,
                "grounding": per_region_overlay,
                "evidence": raw_result.get("evidence", []) + [
                    {
                        "step": f"Targeted ROI extracted ({crop_info['area_pixels']} px² sub-region)",
                        "confidence": 0.99
                    }
                ],
                "model_used": f"{selected_model} (ROI Mode)",
                "roi_metadata": {
                    "crop_bounds_px": crop_info["original_bounds_px"],
                    "pct_bounds": crop_info["pct_bounds"],
                    "area_pixels": crop_info["area_pixels"],
                    "was_upsampled": crop_info["was_upsampled"],
                    "upsample_factor": crop_info["upsample_factor"]
                }
            }
        }

        # Step 5: Log to Audit Trail
        AuditService.log(image_id, f"[ROI] {effective_question}", response_payload["result"])

        return response_payload
