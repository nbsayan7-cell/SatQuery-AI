"""
SatQuery AI - 24/7 Server Keep-Alive Service.
Prevents free cloud hosting (Render, Koyeb, Hugging Face) from spinning down
due to inactivity (Render spins down after 15 minutes of silence).

Mechanisms:
1. Self-Ping: Periodically pings the public URL (/api/health) every 10 minutes.
2. Render Native Detection: Automatically reads RENDER_EXTERNAL_URL if set.
"""

import os
import asyncio
import logging
import httpx
from typing import Optional

logger = logging.getLogger("satquery.keepalive")

_keep_alive_task: Optional[asyncio.Task] = None

async def _ping_loop(target_url: str, interval: int):
    """Background loop that sends a lightweight GET request to keep the server warm."""
    health_endpoint = f"{target_url.rstrip('/')}/api/health"
    logger.info(f"[KeepAlive] Initiating 24/7 server keep-alive loop targeting: {health_endpoint} (interval: {interval}s)")
    
    # Startup grace period before first ping
    await asyncio.sleep(45)

    while True:
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(health_endpoint)
                if resp.status_code == 200:
                    logger.info(f"[KeepAlive] Keep-alive ping successful (HTTP 200) -> {health_endpoint}")
                else:
                    logger.warning(f"[KeepAlive] Keep-alive ping returned status: {resp.status_code}")
        except Exception as ex:
            logger.warning(f"[KeepAlive] Keep-alive ping exception (retrying in {interval}s): {ex}")

        await asyncio.sleep(interval)

def start_keep_alive():
    """Starts the background keep-alive task if a public URL is configured."""
    global _keep_alive_task
    url = os.environ.get("SELF_PING_URL", os.environ.get("RENDER_EXTERNAL_URL", "")).strip()
    interval = int(os.environ.get("KEEP_ALIVE_INTERVAL_SEC", "600"))

    if not url:
        logger.info("[KeepAlive] No SELF_PING_URL or RENDER_EXTERNAL_URL configured. Self-ping loop disabled (set SELF_PING_URL to enable).")
        return None

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        logger.debug("[KeepAlive] No active event loop found. Keep-alive task will start once the server loop is running.")
        return None

    if _keep_alive_task is None or _keep_alive_task.done():
        _keep_alive_task = loop.create_task(_ping_loop(url, interval))
        return _keep_alive_task
    return _keep_alive_task

def stop_keep_alive():
    """Cancels the keep-alive task on shutdown."""
    global _keep_alive_task
    if _keep_alive_task and not _keep_alive_task.done():
        _keep_alive_task.cancel()
        logger.info("[KeepAlive] Keep-alive background loop stopped.")
