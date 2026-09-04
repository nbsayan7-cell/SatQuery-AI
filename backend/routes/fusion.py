from fastapi import APIRouter, Body, HTTPException
from pydantic import BaseModel
from backend.config import UPLOAD_DIR
from ai.models.fusion import FusionModel
from ai.pair_validator import ImagePairValidator
from backend.services.audit_service import AuditService

router = APIRouter()

class FusePayload(BaseModel):
    image_id_1: str
    image_id_2: str

@router.post("/fuse")
async def fuse_images(payload: FusePayload = Body(...)):
    """
    Fuses two uploaded images (Optical and SAR) for multi-modal analysis.
    Enforces mandatory scientific validation to prevent fusing non-corresponding locations.
    """
    matched_files_1 = list(UPLOAD_DIR.glob(f"{payload.image_id_1}.*"))
    matched_files_2 = list(UPLOAD_DIR.glob(f"{payload.image_id_2}.*"))
    
    if not matched_files_1 or not matched_files_2:
        raise HTTPException(status_code=404, detail="One or both images not found")
        
    image_path_1 = str(matched_files_1[0])
    image_path_2 = str(matched_files_2[0])
    
    # Non-negotiable pair validation gate
    validation_report = await ImagePairValidator.validate_pair(image_path_1, image_path_2, task="fusion")
    if validation_report["decision"] == "BLOCK":
        blocked_result = {
            "status": "blocked",
            "image_id_1": payload.image_id_1,
            "image_id_2": payload.image_id_2,
            "result": {
                "answer": validation_report["direct_explanation"],
                "confidence": validation_report["confidence_breakdown"]["overall_confidence"],
                "grounding": [],
                "evidence": [
                    {"step": "Executed Multimodal Pair Validation Gate", "confidence": 0.99},
                    {"step": f"Safety gate blocked fusion analysis: {validation_report['classification']}", "confidence": 0.99}
                ],
                "model_used": "pair-validator-v1 (Multimodal Integrity Gate)",
                "validation_report": validation_report
            }
        }
        AuditService.log(f"{payload.image_id_1} + {payload.image_id_2}", "[FUSION-BLOCKED]", blocked_result["result"])
        return blocked_result

    # Pass to Fusion Model
    result = await FusionModel.analyze(image_path_1, image_path_2)
    result["validation_report"] = validation_report
    
    # Wrap response and log
    final_result = {"status": "success", "result": result}
    AuditService.log(f"{payload.image_id_1} + {payload.image_id_2}", "[OPTICAL+SAR-FUSION]", result)
    
    return final_result
