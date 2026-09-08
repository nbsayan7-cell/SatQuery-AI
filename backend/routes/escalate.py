from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from backend.config import UPLOAD_DIR
from ai.escalation import EscalationPipeline
from backend.services.audit_service import AuditService

router = APIRouter()

class EscalateRequest(BaseModel):
    image_id: str = Field(..., description="ID of primary satellite image")
    question: str = Field(..., description="Query or inspection prompt")
    task: Optional[str] = Field("vqa", description="'vqa' or 'caption'")
    sar_image_id: Optional[str] = Field(None, description="Optional SAR counterpart image ID for cross-modal radar verification")
    force_high_precision: Optional[bool] = Field(True, description="Enforce high-precision multi-stage pipeline")

@router.post("/analyze/escalate")
async def analyze_escalate_endpoint(payload: EscalateRequest):
    """
    Executes high-precision multi-stage inference (Tiling, TTA, Cross-Modal, LLM reconciliation).
    Fulfills Phase 1C (SQ-037).
    """
    matched = list(UPLOAD_DIR.glob(f"{payload.image_id}.*"))
    if not matched:
        raise HTTPException(status_code=404, detail="Primary image not found")

    sar_path = None
    if payload.sar_image_id:
        matched_sar = [f for f in UPLOAD_DIR.glob(f"{payload.sar_image_id}.*") if f.suffix.lower() not in ('.json', '.meta')]
        if matched_sar:
            sar_path = str(matched_sar[0])
            # Validate same-area compatibility between optical and SAR
            from ai.pair_validator import ImagePairValidator
            val_report = await ImagePairValidator.validate_pair(str(matched[0]), sar_path, task="fusion")
            if val_report["decision"] == "BLOCK":
                blocked_res = {
                    "status": "blocked",
                    "image_id": payload.image_id,
                    "result": {
                        "status": "REJECTED",
                        "classification": val_report.get("classification", "DIFFERENT_LOCATION"),
                        "decision": "BLOCK",
                        "reason_codes": val_report.get("reason_codes", ["GEOGRAPHIC_MISMATCH", "ZERO_SPATIAL_OVERLAP"]),
                        "spatial_overlap": val_report.get("spatial_overlap", 0.0),
                        "distance": val_report.get("distance", "unknown"),
                        "has_georeference": val_report.get("has_georeference", True),
                        "llm_override_status": "DENIED",
                        "answer": val_report["direct_explanation"],
                        "confidence": val_report["confidence_breakdown"]["overall_confidence"],
                        "grounding": [],
                        "evidence": [
                            {"step": "Executed Escalation Pair Validation Gate", "confidence": 0.99},
                            {"step": f"Safety gate blocked cross-modal escalation: {val_report['classification']}", "confidence": 0.99}
                        ],
                        "model_used": "pair-validator-v1 (Spatial Safety Gate)",
                        "validation_report": val_report
                    }
                }
                AuditService.log(payload.image_id, f"[ESCALATE-BLOCKED] {payload.question}", blocked_res["result"])
                return blocked_res

    res = await EscalationPipeline.run_escalated_inference(
        image_path=str(matched[0]),
        question=payload.question,
        task=payload.task or "vqa",
        force_high_precision=payload.force_high_precision,
        sar_image_path=sar_path
    )

    response_payload = {
        "status": "success",
        "image_id": payload.image_id,
        "result": res
    }

    # Record in audit trail (R7)
    AuditService.log(
        payload.image_id,
        f"[ESCALATED-PRECISION] {payload.question}",
        res
    )

    return response_payload
