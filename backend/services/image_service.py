import uuid
import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException
from PIL import Image, UnidentifiedImageError

from backend.config import UPLOAD_DIR, ALLOWED_EXTENSIONS, MAX_UPLOAD_BYTES

class ImageService:
    @staticmethod
    async def process_upload(file: UploadFile) -> dict:
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"File extension {ext} not allowed.")

        # Read the file content to check size and process
        file_bytes = await file.read()
        if len(file_bytes) > MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=400, detail="File size exceeds maximum limit.")
        
        # Reset file pointer after reading
        await file.seek(0)

        image_id = str(uuid.uuid4())
        file_path = UPLOAD_DIR / f"{image_id}{ext}"

        with open(file_path, "wb") as f:
            # We already have the bytes, but copying from file object is fine too
            f.write(file_bytes)
        
        # Extract metadata
        meta = {"filename": file.filename, "size_bytes": len(file_bytes), "extension": ext}
        try:
            with Image.open(file_path) as img:
                meta["width"] = img.width
                meta["height"] = img.height
                meta["format"] = img.format
                meta["mode"] = img.mode
        except UnidentifiedImageError:
            # Might be a complex GeoTIFF that PIL can't handle out of the box, skip gracefully
            meta["warning"] = "Could not parse image metadata, might be a complex format."
        except Exception as e:
            meta["warning"] = f"Error reading metadata: {str(e)}"

        # Save sidecar metadata json for downstream geospatial tracking
        import json
        meta_path = UPLOAD_DIR / f"{image_id}.meta.json"
        try:
            meta_path.write_text(json.dumps(meta, indent=2))
        except Exception:
            pass

        return {
            "image_id": image_id,
            "meta": meta
        }

