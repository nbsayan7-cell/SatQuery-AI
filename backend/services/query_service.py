from pathlib import Path
from typing import Optional
from fastapi import HTTPException
from backend.config import UPLOAD_DIR
from ai.orchestrator import ModelRouter
from ai.pair_validator import ImagePairValidator

class QueryService:
    @staticmethod
    async def process_query(image_id: str, query: str, image_id_2: Optional[str] = None) -> dict:
        matched_files_1 = [f for f in UPLOAD_DIR.glob(f"{image_id}.*") if f.suffix.lower() not in ('.json', '.meta')]
        
        if not matched_files_1:
            raise HTTPException(status_code=404, detail=f"Image with ID {image_id} not found.")
            
        image_path_1 = str(matched_files_1[0])

        # Dual-image query validation
        if image_id_2:
            matched_files_2 = [f for f in UPLOAD_DIR.glob(f"{image_id_2}.*") if f.suffix.lower() not in ('.json', '.meta')]
            if not matched_files_2:
                raise HTTPException(status_code=404, detail=f"Secondary image with ID {image_id_2} not found.")
            image_path_2 = str(matched_files_2[0])

            # Enforce non-negotiable same-area validation gate
            validation_report = await ImagePairValidator.validate_pair(image_path_1, image_path_2, task="query")
            if validation_report["decision"] == "BLOCK":
                blocked_result = {
                    "status": "blocked",
                    "image_id": image_id,
                    "image_id_2": image_id_2,
                    "query": query,
                    "result": {
                        "status": "REJECTED",
                        "classification": validation_report.get("classification", "DIFFERENT_LOCATION"),
                        "decision": "BLOCK",
                        "reason_codes": validation_report.get("reason_codes", ["GEOGRAPHIC_MISMATCH", "ZERO_SPATIAL_OVERLAP"]),
                        "spatial_overlap": validation_report.get("spatial_overlap", 0.0),
                        "distance": validation_report.get("distance", "unknown"),
                        "has_georeference": validation_report.get("has_georeference", True),
                        "llm_override_status": "DENIED",
                        "answer": validation_report["direct_explanation"],
                        "confidence": validation_report["confidence_breakdown"]["overall_confidence"],
                        "grounding": [],
                        "evidence": [
                            {"step": "Executed Dual-Image Spatial Compatibility Gate", "confidence": 0.99},
                            {"step": f"Safety gate blocked query across disjoint locations: {validation_report['classification']}", "confidence": 0.99}
                        ],
                        "model_used": "pair-validator-v1 (Spatial Safety Gate)",
                        "validation_report": validation_report
                    }
                }
                return blocked_result

        # Pass to the intelligence orchestration tier
        result = await ModelRouter.route_query(image_path_1, query)
        
        # Wrap response
        return {
            "image_id": image_id,
            "image_id_2": image_id_2,
            "query": query,
            "result": result
        }
