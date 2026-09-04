from fastapi import APIRouter, Body
from backend.services.query_service import QueryService
from backend.services.audit_service import AuditService
from pydantic import BaseModel

router = APIRouter()

class QueryRequest(BaseModel):
    image_id: str
    query: str

@router.post("/query")
async def execute_query(payload: QueryRequest):
    """
    Accepts an image_id and a text query, routes it to the VQA model, and returns the answer.
    """
    result = await QueryService.process_query(payload.image_id, payload.query)
    
    # Log to audit trail
    AuditService.log(payload.image_id, payload.query, result["result"])
    
    return result
