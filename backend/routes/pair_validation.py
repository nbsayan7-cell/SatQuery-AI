from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from backend.config import UPLOAD_DIR
from ai.pair_validator import ImagePairValidator
from backend.services.audit_service import AuditService

router = APIRouter()

class ValidatePairRequest(BaseModel):
    image_id_1: str = Field(..., description="Baseline image ID (T0)")
    image_id_2: str = Field(..., description="Target image ID (T1)")
    task: Optional[str] = Field("change_detection", description="Requested task: 'change_detection' or 'fusion'")

@router.post("/validate/pair")
async def validate_pair_endpoint(payload: ValidatePairRequest):
    """
    Image pair compatibility & same-area validation gate (SQ-039).
    Must be executed before temporal change detection or multimodal comparison.
    """
    matched_1 = [f for f in UPLOAD_DIR.glob(f"{payload.image_id_1}.*") if f.suffix.lower() not in ('.json', '.meta')]
    matched_2 = [f for f in UPLOAD_DIR.glob(f"{payload.image_id_2}.*") if f.suffix.lower() not in ('.json', '.meta')]

    if not matched_1 or not matched_2:
        raise HTTPException(status_code=404, detail="One or both images not found in image store")


    report = await ImagePairValidator.validate_pair(
        str(matched_1[0]),
        str(matched_2[0]),
        task=payload.task or "change_detection"
    )

    # Log validation gate result to audit trail
    AuditService.log(
        f"{payload.image_id_1} vs {payload.image_id_2}",
        f"[PAIR-VALIDATION] Decision: {report['decision']} ({report['classification']})",
        report
    )

    return {
        "status": "success",
        "validation_report": report
    }
