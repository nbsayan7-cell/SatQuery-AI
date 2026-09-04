from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Optional
from backend.config import UPLOAD_DIR
from ai.specialists.dispatcher import SpecialistDispatcher
from backend.services.audit_service import AuditService

router = APIRouter()

class DispatchRequest(BaseModel):
    specialist: str
    image_id_1: str
    image_id_2: Optional[str] = None
    query: Optional[str] = "Analyze this image"

@router.get("/specialists")
def list_specialists():
    return {
        "specialists": SpecialistDispatcher.get_registered_specialists(),
        "goldeneye_models": SpecialistDispatcher.get_goldeneye_models(),
        "cloned_repositories": [
            "isaaccorley/goldeneye",
            "learncsai/SAR-ML-Fusion",
            "nvhuynh16/Sentinel-Sat-SAR",
            "DIUx-xView/xView2_baseline",
            "justchenhao/LEVIR",
            "hi-paris/deepdespeckling",
            "adityagoelgis-cell/sentinel-image-analysis-pipeline"
        ],
        "categories": {
            "VQA": ["GeoChat", "Falcon"],
            "Captioning": ["DescribeEarth", "VHM"],
            "Grounding": ["GeoGround"],
            "Change Detection": ["UniRS", "Open-CD"],
            "Optical + SAR Fusion": ["DOFA", "SAR-ML-Fusion"]
        }
    }

@router.post("/specialists/dispatch")
async def dispatch_specialist(payload: DispatchRequest):
    matched_1 = list(UPLOAD_DIR.glob(f"{payload.image_id_1}.*"))
    if not matched_1:
        raise HTTPException(status_code=404, detail=f"Image {payload.image_id_1} not found")
    
    path_1 = str(matched_1[0])
    path_2 = None
    if payload.image_id_2:
        matched_2 = list(UPLOAD_DIR.glob(f"{payload.image_id_2}.*"))
        if matched_2:
            path_2 = str(matched_2[0])

    try:
        if payload.specialist in ["UniRS", "Open-CD"]:
            if not path_2:
                raise HTTPException(status_code=400, detail="Change detection requires two images")
            res = await SpecialistDispatcher.dispatch(payload.specialist, image_path_1=path_1, image_path_2=path_2)
        elif payload.specialist in ["DOFA", "SAR-ML-Fusion"]:
            if not path_2:
                raise HTTPException(status_code=400, detail="Fusion requires two images (Optical + SAR)")
            res = await SpecialistDispatcher.dispatch(payload.specialist, image_path_opt=path_1, image_path_sar=path_2)
        else:
            res = await SpecialistDispatcher.dispatch(payload.specialist, image_path=path_1, query=payload.query)

        AuditService.log(payload.image_id_1, f"[{payload.specialist.upper()}] {payload.query}", res)
        return {"status": "success", "specialist": payload.specialist, "result": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
