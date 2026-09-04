"""
Fine-Grained Change Detection Service.
Supports bi-temporal and multi-temporal (>2 scenes) spatially-resolved change analysis.
Integrates non-negotiable Pair Validation Gate (SQ-039).
"""

from typing import Dict, Any, List, Optional
from fastapi import HTTPException
from backend.config import UPLOAD_DIR
from ai.pair_validator import ImagePairValidator
from ai.models.change_detection import ChangeDetectionModel
from backend.services.audit_service import AuditService

class ChangeService:
    @staticmethod
    async def process_change(
        image_id_1: str,
        image_id_2: str,
        timeline_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Executes fine-grained, spatially-resolved bi-temporal or multi-temporal change analysis.
        Enforces mandatory Image Pair Validation Gate (SQ-039).
        """
        import backend.routes.compare as compare_mod
        target_upload_dir = getattr(compare_mod, "UPLOAD_DIR", UPLOAD_DIR)

        matched_1 = [f for f in target_upload_dir.glob(f"{image_id_1}.*") if f.suffix.lower() not in ('.json', '.meta')]
        matched_2 = [f for f in target_upload_dir.glob(f"{image_id_2}.*") if f.suffix.lower() not in ('.json', '.meta')]

        if not matched_1 or not matched_2:
            raise HTTPException(status_code=404, detail="One or both images not found")

        path_1 = str(matched_1[0])
        path_2 = str(matched_2[0])


        # -------------------------------------------------------------
        # MANDATORY SCIENTIFIC INTEGRITY GATE (SQ-039 / RULE 005)
        # -------------------------------------------------------------
        validation_report = await ImagePairValidator.validate_pair(path_1, path_2, task="change_detection")
        
        if validation_report["decision"] == "BLOCK":
            # HARD REJECTION: Do NOT execute change detector model
            final_blocked_result = {
                "status": "blocked",
                "image_id_1": image_id_1,
                "image_id_2": image_id_2,
                "result": {
                    "answer": validation_report["direct_explanation"],
                    "confidence": validation_report["confidence_breakdown"]["overall_confidence"],
                    "changed_regions": [],
                    "total_regions": 0,
                    "grounding": [],
                    "evidence": [
                        {"step": "Executed Image Pair Validation Safety Gate", "confidence": 0.99},
                        {"step": f"Geographic overlap check: {validation_report['geographic_analysis'].get('iou') or 0.0} IoU", "confidence": 0.98},
                        {"step": f"Safety gate blocked change analysis: {validation_report['classification']}", "confidence": 0.99}
                    ],
                    "model_used": "pair-validator-v1 (Scientific Safety Gate)",
                    "validation_report": validation_report
                }
            }

            AuditService.log(
                f"{image_id_1} vs {image_id_2}",
                f"[CHANGE-BLOCKED] Reason: {validation_report['classification']}",
                final_blocked_result["result"]
            )
            return final_blocked_result

        # Execute primary bi-temporal multi-part change detection
        result = await ChangeDetectionModel.analyze(path_1, path_2)
        result["validation_report"] = validation_report

        # Multi-temporal trajectory if additional dates provided (>2 scenes)
        timeline_results = []
        if timeline_ids and len(timeline_ids) > 0:
            current_path = path_2
            for idx, next_id in enumerate(timeline_ids):
                next_matched = list(target_upload_dir.glob(f"{next_id}.*"))
                if next_matched:
                    next_path = str(next_matched[0])
                    step_res = await ChangeDetectionModel.analyze(current_path, next_path)
                    timeline_results.append({
                        "step_index": idx + 1,
                        "interval": f"T{idx + 1} -> T{idx + 2}",
                        "target_image_id": next_id,
                        "changed_regions_count": step_res.get("total_regions", 0),
                        "top_change": step_res.get("changed_regions", [{}])[0].get("change_type", "Stable"),
                        "confidence": step_res.get("confidence", 0.90)
                    })
                    current_path = next_path

        final_result = {
            "status": "success",
            "image_id_1": image_id_1,
            "image_id_2": image_id_2,
            "result": {
                **result,
                "multi_temporal_timeline": timeline_results if timeline_results else None
            }
        }

        # Log to audit trail
        AuditService.log(
            f"{image_id_1} vs {image_id_2}",
            f"[FINE-GRAINED-CHANGE] {result.get('total_regions', 0)} regions segmented",
            final_result["result"]
        )

        return final_result
