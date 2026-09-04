from fastapi import APIRouter, Body
from pydantic import BaseModel, Field
from typing import Optional, List
from backend.config import UPLOAD_DIR
from backend.services.change_service import ChangeService


router = APIRouter()

class ComparePayload(BaseModel):
    image_id_1: str
    image_id_2: str
    timeline_image_ids: Optional[List[str]] = Field(None, description="Optional multi-temporal dates")

@router.post("/compare")
async def compare_images(payload: ComparePayload = Body(...)):
    """
    Compares two uploaded images (T0 and T1) for structural changes.
    Maintained for backwards-compatibility; aliases /api/analyze/change.
    """
    return await ChangeService.process_change(
        image_id_1=payload.image_id_1,
        image_id_2=payload.image_id_2,
        timeline_ids=payload.timeline_image_ids
    )
