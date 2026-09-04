from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone
from backend.config import UPLOAD_DIR
from ai.vision_utils import VisionUtils
from ai.ollama_client import OllamaClient, SYSTEM_PROMPT

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    image_id: Optional[str] = None

@router.post("/chat")
async def chat_interaction(payload: ChatRequest):
    """
    Conversational remote-sensing assistant powered by Ollama Llama-3.
    Supports multi-turn context and image-grounded dialogue.
    """
    user_msg = payload.message.strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    image_context = ""
    if payload.image_id:
        matched = list(UPLOAD_DIR.glob(f"{payload.image_id}.*"))
        if matched:
            feat = VisionUtils.extract_image_features(str(matched[0]))
            if feat.get("is_real"):
                image_context = (
                    f"\nActive Image Context (ID: {payload.image_id}):\n"
                    f"- Modality: {feat.get('modality')}\n"
                    f"- Dimensions: {feat.get('width')}x{feat.get('height')}\n"
                    f"- Detected Land Covers: {', '.join(feat.get('detected_classes', []))}\n"
                    f"- Mean Brightness: {feat.get('brightness')}, Edge Density: {feat.get('edge_density')}\n"
                    f"- Cloud Cover: {feat.get('cloud_cover_pct')}%\n"
                )

    # Format messages for Ollama
    messages = []
    for h in (payload.history or []):
        messages.append({"role": h.role, "content": h.content})

    current_content = user_msg + (image_context if image_context else "")
    messages.append({"role": "user", "content": current_content})

    ollama_reply = None
    if await OllamaClient.is_available():
        ollama_reply = await OllamaClient.chat(messages=messages, timeout=25.0)

    if ollama_reply:
        reply = ollama_reply
        model_used = "ollama/llama3:latest"
    else:
        # Fallback intelligent remote-sensing knowledge engine
        lower = user_msg.lower()
        if "sar" in lower:
            reply = "Synthetic Aperture Radar (SAR) sensors like Sentinel-1 emit microwave pulses (C-band) to image Earth day or night and through cloud cover. Rough surfaces cause diffuse scattering, urban areas cause strong double-bounce backscatter, and calm water appears dark due to specular reflection."
        elif "optical" in lower or "sentinel-2" in lower or "band" in lower:
            reply = "Optical sensors like Sentinel-2 measure reflected sunlight across 13 spectral bands from visible (RGB) to Near-Infrared (NIR / Band 8) and Shortwave-Infrared (SWIR), ideal for NDVI vegetation indexing, soil moisture, and water boundary mapping."
        elif "change" in lower:
            reply = "Bi-temporal change detection co-registers two satellite scenes acquired at dates T0 and T1, performing normalized difference and structural anomaly segmentation to isolate land-use shifts such as deforestation, new construction, or flood recession."
        elif "fusion" in lower:
            reply = "Optical + SAR fusion combines the rich spectral context of multispectral sensors with all-weather SAR microwave penetration, resolving ambiguities caused by cloud cover or heavy atmospheric haze."
        elif image_context:
            reply = f"I inspected your active image ({payload.image_id}). It is an Earth-observation scene with prominent geographic boundaries. You can ask me specific questions like 'Are there water bodies?', 'Describe the scene', or 'Highlight urban structures'."
        else:
            reply = "I am SatQuery AI, your interactive remote-sensing copilot. You can ask me questions about satellite imagery, land cover, change detection, optical/SAR fusion, or upload an image to analyze."
        model_tag = "satquery-expert-knowledge-engine"
        model_used = model_tag

    return {
        "reply": reply,
        "model_used": model_used,
        "image_id": payload.image_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
