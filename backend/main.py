from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import images, query, audit, caption, compare, fusion, chat, specialists, region, change, escalate, tee, pair_validation, benchmark

app = FastAPI(title="SatQuery AI Backend")

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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





@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "satquery-api"}
