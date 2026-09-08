import os
import json
import logging
import httpx
from typing import Optional, List, Dict
from ai.cloud_ai import CloudAI

logger = logging.getLogger("satquery.ai_client")

# Environment configurations with strict defaults
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_MODEL = os.environ.get("OLLAMA_MODEL", "llama3:latest")
DEFAULT_TIMEOUT = float(os.environ.get("OLLAMA_TIMEOUT", "25.0"))
DEFAULT_TEMPERATURE = float(os.environ.get("OLLAMA_TEMPERATURE", "0.2"))

SYSTEM_PROMPT = """You are SatQuery AI, an expert agentic remote-sensing and satellite imagery assistant built for ISRO Problem Statement SIH26167.
You analyze multimodal Earth-observation data (Optical, Multispectral, Sentinel-1 SAR, Sentinel-2, Landsat).

CRITICAL SCIENTIFIC INTEGRITY & NO-HALLUCINATION RULES:
1. Grounding in Upstream Observations: You receive verified observations from remote-sensing specialist models and computer vision pipelines. You must ONLY reason over and explain these verified observations.
2. Strictly No Inventions: NEVER invent geographic coordinates, sensor types, acquisition dates, object counts, area measurements, or change percentages.
3. Missing Data Policy: If information is not provided in the upstream observations, explicitly state: "Not available from the provided data." If uncertain, state: "Insufficient evidence to determine reliably."
4. Numerical Fidelity: Never round, guess, or modify quantitative metrics or confidence scores supplied by the upstream specialist models.
5. Tone & Structure: Deliver concise, authoritative, evidence-backed answers with explicit limitations.
"""

class OllamaClient:
    """
    Unified AI & Multimodal Client.
    Coordinates 24/7 cloud inference (Google Gemini VLM, Groq, OpenAI)
    with local Ollama fallback.
    """

    @staticmethod
    async def is_available(timeout: float = 2.0) -> bool:
        """Checks if either Cloud AI (Gemini/Groq/OpenAI) or local Ollama is reachable."""
        if CloudAI.is_available():
            return True
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                r = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
                return r.status_code == 200
        except Exception:
            return False

    @staticmethod
    def get_active_engine() -> str:
        """Identifies the current active inference engine."""
        if CloudAI.is_available():
            return CloudAI.get_active_provider()
        return "Ollama Local (http://localhost:11434)"

    @staticmethod
    async def get_available_models(timeout: float = 2.0) -> List[str]:
        """Returns list of installed Ollama models or active cloud models."""
        if CloudAI.is_available():
            return [CloudAI.get_active_provider()]
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                r = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
                if r.status_code == 200:
                    data = r.json()
                    return [m["name"] for m in data.get("models", [])]
        except Exception:
            pass
        return []

    @staticmethod
    async def generate(
        prompt: str,
        system: Optional[str] = None,
        model: str = DEFAULT_MODEL,
        timeout: Optional[float] = None
    ) -> Optional[str]:
        """
        Sends generation prompt to Cloud AI (Gemini/Groq) first, falling back to local Ollama.
        """
        # 1. Primary: 24/7 Cloud AI
        if CloudAI.is_available():
            cloud_res = await CloudAI.generate(prompt=prompt, system=system, timeout=timeout or 15.0)
            if cloud_res and len(cloud_res.strip()) > 5:
                return cloud_res

        # 2. Secondary: Local Ollama
        actual_timeout = timeout or DEFAULT_TIMEOUT
        payload = {
            "model": model,
            "prompt": prompt,
            "system": system or SYSTEM_PROMPT,
            "stream": False,
            "options": {
                "temperature": DEFAULT_TEMPERATURE,
                "num_predict": 200
            }
        }
        try:
            async with httpx.AsyncClient(timeout=actual_timeout) as client:
                r = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
                if r.status_code == 200:
                    data = r.json()
                    return data.get("response", "").strip()
        except Exception as e:
            logger.warning(f"Ollama generate failed or timed out: {e}")
        return None

    @staticmethod
    async def generate_vlm(
        prompt: str,
        image_path: str,
        system: Optional[str] = None,
        model: str = "moondream:latest",
        timeout: Optional[float] = 35.0
    ) -> Optional[str]:
        """
        Multimodal Visual-Language Model (VLM) generation.
        Uses Google Gemini Multimodal Vision API when deployed to cloud,
        falling back to local Moondream via Ollama.
        """
        # 1. Primary: 24/7 Cloud VLM (Google Gemini 2.0 / 1.5 Flash)
        if CloudAI.is_available():
            vlm_cloud_res = await CloudAI.generate_vlm(
                prompt=prompt,
                image_path=image_path,
                system=system,
                timeout=timeout or 25.0
            )
            if vlm_cloud_res and len(vlm_cloud_res.strip()) > 5:
                return vlm_cloud_res

        # 2. Secondary: Local Ollama VLM
        import base64
        if not os.path.exists(image_path):
            logger.warning(f"generate_vlm: image path does not exist: {image_path}")
            return None

        try:
            with open(image_path, "rb") as f:
                img_b64 = base64.b64encode(f.read()).decode("utf-8")
        except Exception as e:
            logger.error(f"Failed to read image for VLM: {e}")
            return None

        actual_timeout = timeout or DEFAULT_TIMEOUT
        payload = {
            "model": model,
            "prompt": prompt,
            "images": [img_b64],
            "stream": False,
            "options": {
                "temperature": DEFAULT_TEMPERATURE,
                "num_predict": 300
            }
        }
        if system:
            payload["system"] = system

        try:
            async with httpx.AsyncClient(timeout=actual_timeout) as client:
                r = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
                if r.status_code == 200:
                    data = r.json()
                    resp = data.get("response", "").strip()
                    if resp:
                        return resp
        except Exception as e:
            logger.warning(f"Ollama VLM generate failed or timed out: {e}")
            return None
        return None

    @staticmethod
    async def chat(
        messages: List[Dict[str, str]],
        system: Optional[str] = None,
        model: str = DEFAULT_MODEL,
        timeout: Optional[float] = None
    ) -> Optional[str]:
        """
        Multi-turn chat completion with Cloud AI or Ollama.
        """
        # 1. Primary: 24/7 Cloud AI Chat (Groq / Gemini)
        if CloudAI.is_available():
            chat_cloud_res = await CloudAI.chat(
                messages=messages,
                system=system,
                timeout=timeout or 20.0
            )
            if chat_cloud_res and len(chat_cloud_res.strip()) > 5:
                return chat_cloud_res

        # 2. Secondary: Local Ollama Chat
        actual_timeout = timeout or DEFAULT_TIMEOUT
        chat_messages = []
        if system:
            chat_messages.append({"role": "system", "content": system})
        else:
            chat_messages.append({"role": "system", "content": SYSTEM_PROMPT})
            
        chat_messages.extend(messages)

        payload = {
            "model": model,
            "messages": chat_messages,
            "stream": False,
            "options": {
                "temperature": DEFAULT_TEMPERATURE,
                "num_predict": 280
            }
        }
        try:
            async with httpx.AsyncClient(timeout=actual_timeout) as client:
                r = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
                if r.status_code == 200:
                    data = r.json()
                    msg = data.get("message", {})
                    return msg.get("content", "").strip()
        except Exception as e:
            logger.warning(f"Ollama chat failed or timed out: {e}")
            return None

# Export alias
AIClient = OllamaClient
