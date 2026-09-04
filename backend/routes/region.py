from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from backend.services.region_service import RegionService

router = APIRouter()

class RegionRequest(BaseModel):
    image_id: str = Field(..., description="ID of the uploaded satellite scene")
    roi_geometry: Dict[str, Any] = Field(..., description="Geometry dictionary (e.g. {'type': 'bbox', 'coordinates': [x, y, w, h]})")
    question: Optional[str] = Field("Analyze this region", description="Natural language question targeting the region")
    task: Optional[str] = Field("vqa", description="Analysis task: 'vqa', 'caption', or 'grounding'")

@router.post("/analyze/region")
async def analyze_region_endpoint(payload: RegionRequest):
    """
    Executes high-precision, sub-region analysis on a designated Region-of-Interest (ROI).
    Fulfills Phase 1A (SQ-035).
    """
    result = await RegionService.analyze_region(
        image_id=payload.image_id,
        roi_geometry=payload.roi_geometry,
        question=payload.question,
        task=payload.task
    )
    return result
