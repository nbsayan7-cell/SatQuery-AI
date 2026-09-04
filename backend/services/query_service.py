from pathlib import Path
from fastapi import HTTPException
from backend.config import UPLOAD_DIR
from ai.orchestrator import ModelRouter

class QueryService:
    @staticmethod
    async def process_query(image_id: str, query: str) -> dict:
        # Find the image file (we don't know the extension since we only have image_id from the frontend request)
        # We need to search the uploads dir for a matching UUID prefix
        matched_files = list(UPLOAD_DIR.glob(f"{image_id}.*"))
        
        if not matched_files:
            raise HTTPException(status_code=404, detail=f"Image with ID {image_id} not found.")
            
        image_path = str(matched_files[0])
        
        # Pass to the intelligence orchestration tier
        result = await ModelRouter.route_query(image_path, query)
        
        # Wrap response
        return {
            "image_id": image_id,
            "query": query,
            "result": result
        }
