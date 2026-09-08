from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import images, query, audit, caption, compare, fusion, chat, specialists, region, change, escalate, tee, pair_validation, benchmark
from backend.services.keepalive_service import start_keep_alive, stop_keep_alive

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start 24/7 background keep-alive ping loop for Render/Koyeb
    start_keep_alive()
    yield
    # Shutdown: Clean up background tasks
    stop_keep_alive()

app = FastAPI(title="SatQuery AI Backend", lifespan=lifespan)

# Allow frontend requests from any origin (e.g. Vercel, localhost, custom domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(images.router, prefix="/api", tags=["images"])
app.include_router(query.router, prefix="/api", tags=["query"])
app.include_router(audit.router, prefix="/api", tags=["audit"])
app.include_router(caption.router, prefix="/api", tags=["caption"])
app.include_router(compare.router, prefix="/api", tags=["compare"])
app.include_router(change.router, prefix="/api", tags=["change"])
app.include_router(fusion.router, prefix="/api", tags=["fusion"])
app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(specialists.router, prefix="/api", tags=["specialists"])
app.include_router(region.router, prefix="/api", tags=["region"])
app.include_router(escalate.router, prefix="/api", tags=["escalate"])
app.include_router(tee.router, prefix="/api", tags=["tee"])
app.include_router(pair_validation.router, prefix="/api", tags=["pair-validation"])
app.include_router(benchmark.router, prefix="/api", tags=["benchmark"])

@app.get("/")
def root():
    return {
        "service": "SatQuery AI Remote-Sensing Intelligence API",
        "docs": "/docs",
        "health": "/api/health"
    }

@app.get("/api/health")
def health_check():
    from ai.ollama_client import AIClient
    return {
        "status": "ok",
        "service": "satquery-api",
        "ai_engine": AIClient.get_active_engine()
    }
