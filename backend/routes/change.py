from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, List
from backend.services.change_service import ChangeService

router = APIRouter()

class ChangePayload(BaseModel):
    image_id_1: str = Field(..., description="Baseline image ID (T0)")
    image_id_2: str = Field(..., description="Target image ID (T1)")
    timeline_image_ids: Optional[List[str]] = Field(None, description="Optional array of sequential image IDs for multi-temporal timeline analysis")

@router.post("/analyze/change")
async def analyze_change_endpoint(payload: ChangePayload):
    """
    Spatially-resolved bi-temporal and multi-temporal change detection.
    Fulfills PRD §10 requirement R3 and Phase 1B (SQ-036).
    """
    return await ChangeService.process_change(
        image_id_1=payload.image_id_1,
        image_id_2=payload.image_id_2,
        timeline_ids=payload.timeline_image_ids
    )
