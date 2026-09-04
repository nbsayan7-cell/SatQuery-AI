from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from backend.services.image_service import ImageService
from backend.config import UPLOAD_DIR

router = APIRouter()

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Accepts an image upload, validates size/type, stores it, and returns metadata.
    """
    result = await ImageService.process_upload(file)
    return result

@router.get("/images/{image_id}")
async def get_image(image_id: str):
    """
    Serves the uploaded image file directly to the frontend.
    """
    matched_files = list(UPLOAD_DIR.glob(f"{image_id}.*"))
    if not matched_files:
        raise HTTPException(status_code=404, detail="Image not found")
        
    # Return the file as a response
    return FileResponse(matched_files[0])
