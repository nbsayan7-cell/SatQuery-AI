import os
import json
import logging
import httpx
from typing import Optional, List, Dict

logger = logging.getLogger("satquery.ollama")

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
    @staticmethod
    async def is_available(timeout: float = 2.0) -> bool:
        """Checks if the local Ollama instance is reachable."""
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                r = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
                return r.status_code == 200
        except Exception:
            return False

    @staticmethod
    async def get_available_models(timeout: float = 2.0) -> List[str]:
        """Returns list of installed Ollama models."""
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
        Sends a single generation prompt to Ollama with strict temperature and safety timeout.
        Returns the text response or None if offline/timed out.
        """
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
    async def chat(
        messages: List[Dict[str, str]],
        system: Optional[str] = None,
        model: str = DEFAULT_MODEL,
        timeout: Optional[float] = None
    ) -> Optional[str]:
        """
        Multi-turn chat completion with Ollama.
        """
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
