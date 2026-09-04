from fastapi import APIRouter, Body, HTTPException
from pydantic import BaseModel
from backend.config import UPLOAD_DIR
from ai.models.captioning import CaptioningModel
from backend.services.audit_service import AuditService

router = APIRouter()

class CaptionPayload(BaseModel):
    image_id: str

@router.post("/caption")
async def generate_caption(payload: CaptionPayload = Body(...)):
    """
    Directly generates a comprehensive scene overview bypassing orchestration.
    """
    matched_files = list(UPLOAD_DIR.glob(f"{payload.image_id}.*"))
    if not matched_files:
        raise HTTPException(status_code=404, detail="Image not found")
        
    image_path = str(matched_files[0])
    
    # Pass directly to Captioning Model
    result = await CaptioningModel.analyze(image_path, "Generate full scene caption")
    
    # Wrap response and log
    final_result = {"status": "success", "result": result}
    AuditService.log(payload.image_id, "[AUTO-CAPTION]", result)
    
    return final_result
