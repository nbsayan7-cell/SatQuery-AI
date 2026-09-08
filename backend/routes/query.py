from fastapi import APIRouter, Body
from backend.services.query_service import QueryService
from backend.services.audit_service import AuditService
from pydantic import BaseModel, Field
from typing import Optional

router = APIRouter()

class QueryRequest(BaseModel):
    image_id: str
    query: str
    image_id_2: Optional[str] = Field(None, description="Optional second image ID for dual-scene comparative query")

@router.post("/query")
async def execute_query(payload: QueryRequest):
    """
    Accepts an image_id, query, and optional image_id_2.
    Enforces scientific pair validation when two images are provided.
    """
    result = await QueryService.process_query(payload.image_id, payload.query, payload.image_id_2)
    
    # Log to audit trail
    AuditService.log(
        f"{payload.image_id}" + (f" + {payload.image_id_2}" if payload.image_id_2 else ""),
        payload.query,
        result.get("result", {})
    )
    
    return result
