from fastapi import APIRouter
from backend.services.audit_service import AuditService

router = APIRouter()

@router.get("/audit")
async def get_audit_logs(limit: int = 50):
    """
    Retrieves the history of executed queries.
    """
    return AuditService.get_logs(limit)
