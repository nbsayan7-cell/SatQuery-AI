"""
SatQuery AI - Cloud AI Engine.
Provides 24/7 free cloud inference for multimodal Vision-Language Models (VLM)
and Large Language Models (LLM), eliminating local laptop/server dependencies.

Supported Free Providers:
1. Google Gemini (Gemini 2.0 Flash / 1.5 Flash): Native Multimodal VLM + LLM (Free via Google AI Studio).
2. Groq Cloud (LLaMA 3.3 70B / 3.1 8B): Ultra-fast text reasoning & synthesis (Free via console.groq.com).
3. OpenRouter / OpenAI: Compatible fallback endpoint.
"""

import os
import base64
import logging
import httpx
from typing import Optional, List, Dict, Any

logger = logging.getLogger("satquery.cloud_ai")

# Environment configurations
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "").strip()
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "").strip()

DEFAULT_GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
DEFAULT_GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

SYSTEM_PROMPT = """You are SatQuery AI, an expert agentic remote-sensing and satellite imagery assistant built for ISRO Problem Statement SIH26167.
You analyze multimodal Earth-observation data (Optical, Multispectral, Sentinel-1 SAR, Sentinel-2, Landsat).

CRITICAL SCIENTIFIC INTEGRITY RULES:
1. Grounding in Satellite Imagery: You inspect satellite scenes. Provide direct, objective, and truthful remote-sensing observations based strictly on what is visible.
2. No Inventions: Never invent coordinates, sensor specs, dates, or quantitative counts not backed by visual evidence.
3. Missing Data Policy: If information is obscured or not visible, state: "Not discernible from the imagery."
4. Tone: Technical, precise, authoritative remote-sensing intelligence.
"""

class CloudAI:
    @staticmethod
    def is_available() -> bool:
        """Returns True if any cloud AI API key is configured."""
        return bool(GEMINI_API_KEY or GROQ_API_KEY or OPENAI_API_KEY or OPENROUTER_API_KEY)

    @staticmethod
    def get_active_provider() -> str:
        """Returns the primary active cloud provider name."""
        if GEMINI_API_KEY:
            return f"Google Gemini ({DEFAULT_GEMINI_MODEL})"
        if GROQ_API_KEY:
            return f"Groq Cloud ({DEFAULT_GROQ_MODEL})"
        if OPENAI_API_KEY:
            return "OpenAI Cloud"
        if OPENROUTER_API_KEY:
            return "OpenRouter Cloud"
        return "None"

    # =========================================================================
    # MULTIMODAL VISION-LANGUAGE MODEL (VLM)
    # =========================================================================
    @staticmethod
    async def generate_vlm(
        prompt: str,
        image_path: str,
        system: Optional[str] = None,
        timeout: float = 25.0
    ) -> Optional[str]:
        """
        Multimodal VLM inference over satellite imagery scenes.
        Uses Google Gemini Multimodal Vision API as primary free cloud VLM.
        """
        if not os.path.exists(image_path):
            logger.warning(f"CloudAI VLM: image path does not exist: {image_path}")
            return None

        # Determine MIME type
        ext = os.path.splitext(image_path)[1].lower()
        mime_map = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".webp": "image/webp",
            ".tif": "image/tiff",
            ".tiff": "image/tiff"
        }
        mime_type = mime_map.get(ext, "image/jpeg")

        try:
            with open(image_path, "rb") as f:
                img_bytes = f.read()
            img_b64 = base64.b64encode(img_bytes).decode("utf-8")
        except Exception as e:
            logger.error(f"CloudAI VLM: failed to encode image {image_path}: {e}")
            return None

        # 1. Primary: Google Gemini 2.0 / 1.5 Flash Vision
        if GEMINI_API_KEY:
            try:
                endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{DEFAULT_GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
                payload = {
                    "contents": [
                        {
                            "role": "user",
                            "parts": [
                                {"text": prompt},
                                {
                                    "inline_data": {
                                        "mime_type": mime_type,
                                        "data": img_b64
                                    }
                                }
                            ]
                        }
                    ],
                    "system_instruction": {
                        "parts": [{"text": system or SYSTEM_PROMPT}]
                    },
                    "generationConfig": {
                        "temperature": 0.2,
                        "maxOutputTokens": 350
                    }
                }
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(endpoint, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            content = candidates[0].get("content", {})
                            parts = content.get("parts", [])
                            if parts:
                                return parts[0].get("text", "").strip()
                    else:
                        logger.warning(f"Gemini VLM error: {resp.status_code} - {resp.text[:200]}")
            except Exception as ex:
                logger.warning(f"Gemini VLM call failed: {ex}")

        # 2. OpenAI / OpenRouter Multimodal Vision Fallback
        api_key = OPENAI_API_KEY or OPENROUTER_API_KEY
        base_url = "https://openrouter.ai/api/v1" if OPENROUTER_API_KEY else "https://api.openai.com/v1"
        if api_key:
            try:
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                vision_model = "gpt-4o-mini" if OPENAI_API_KEY else "meta-llama/llama-3.2-11b-vision-instruct:free"
                payload = {
                    "model": vision_model,
                    "messages": [
                        {"role": "system", "content": system or SYSTEM_PROMPT},
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:{mime_type};base64,{img_b64}"
                                    }
                                }
                            ]
                        }
                    ],
                    "temperature": 0.2,
                    "max_tokens": 300
                }
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(f"{base_url}/chat/completions", headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        choices = data.get("choices", [])
                        if choices:
                            return choices[0].get("message", {}).get("content", "").strip()
            except Exception as ex:
                logger.warning(f"OpenAI/OpenRouter Vision call failed: {ex}")

        return None

    # =========================================================================
    # TEXT REASONING & SYNTHESIS (LLM)
    # =========================================================================
    @staticmethod
    async def generate(
        prompt: str,
        system: Optional[str] = None,
        timeout: float = 15.0
    ) -> Optional[str]:
        """
        Fast cloud text generation using Gemini or Groq.
        """
        # 1. Groq (Ultra-fast LLaMA 3.3 70B)
        if GROQ_API_KEY:
            try:
                headers = {
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": DEFAULT_GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": system or SYSTEM_PROMPT},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 300
                }
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        choices = data.get("choices", [])
                        if choices:
                            return choices[0].get("message", {}).get("content", "").strip()
            except Exception as ex:
                logger.warning(f"Groq generate failed: {ex}")

        # 2. Google Gemini Text
        if GEMINI_API_KEY:
            try:
                endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{DEFAULT_GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
                payload = {
                    "contents": [{"role": "user", "parts": [{"text": prompt}]}],
                    "system_instruction": {"parts": [{"text": system or SYSTEM_PROMPT}]},
                    "generationConfig": {"temperature": 0.2, "maxOutputTokens": 300}
                }
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(endpoint, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                return parts[0].get("text", "").strip()
            except Exception as ex:
                logger.warning(f"Gemini generate failed: {ex}")

        # 3. OpenAI / OpenRouter Fallback
        api_key = OPENAI_API_KEY or OPENROUTER_API_KEY
        base_url = "https://openrouter.ai/api/v1" if OPENROUTER_API_KEY else "https://api.openai.com/v1"
        if api_key:
            try:
                headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
                model_name = "gpt-4o-mini" if OPENAI_API_KEY else "meta-llama/llama-3.3-70b-instruct:free"
                payload = {
                    "model": model_name,
                    "messages": [
                        {"role": "system", "content": system or SYSTEM_PROMPT},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 300
                }
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(f"{base_url}/chat/completions", headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        choices = data.get("choices", [])
                        if choices:
                            return choices[0].get("message", {}).get("content", "").strip()
            except Exception as ex:
                logger.warning(f"OpenAI/OpenRouter generate failed: {ex}")

        return None

    # =========================================================================
    # MULTI-TURN CHAT CONVERSATION
    # =========================================================================
    @staticmethod
    async def chat(
        messages: List[Dict[str, str]],
        system: Optional[str] = None,
        timeout: float = 20.0
    ) -> Optional[str]:
        """
        Conversational chat completion for satellite copilot.
        """
        # 1. Groq Chat
        if GROQ_API_KEY:
            try:
                headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
                formatted_msgs = [{"role": "system", "content": system or SYSTEM_PROMPT}]
                formatted_msgs.extend(messages)
                payload = {
                    "model": DEFAULT_GROQ_MODEL,
                    "messages": formatted_msgs,
                    "temperature": 0.2,
                    "max_tokens": 350
                }
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        choices = data.get("choices", [])
                        if choices:
                            return choices[0].get("message", {}).get("content", "").strip()
            except Exception as ex:
                logger.warning(f"Groq chat failed: {ex}")

        # 2. Google Gemini Chat
        if GEMINI_API_KEY:
            try:
                endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{DEFAULT_GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
                gemini_contents = []
                for m in messages:
                    role = "user" if m.get("role") in ["user", "system"] else "model"
                    gemini_contents.append({"role": role, "parts": [{"text": m.get("content", "")}]})
                
                payload = {
                    "contents": gemini_contents,
                    "system_instruction": {"parts": [{"text": system or SYSTEM_PROMPT}]},
                    "generationConfig": {"temperature": 0.2, "maxOutputTokens": 350}
                }
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(endpoint, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts:
                                return parts[0].get("text", "").strip()
            except Exception as ex:
                logger.warning(f"Gemini chat failed: {ex}")

        return None
