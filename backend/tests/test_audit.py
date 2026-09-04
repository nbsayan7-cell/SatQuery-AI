import pytest
from fastapi.testclient import TestClient
from backend.main import app
import uuid
from backend.services.audit_service import AuditService

client = TestClient(app)

def test_audit_logging_and_retrieval(tmp_path, monkeypatch):
    # Mock AUDIT_LOG_FILE in backend.services.audit_service
    from backend.services import audit_service
    monkeypatch.setattr(audit_service, "AUDIT_LOG_FILE", tmp_path / "test_audit.json")
    
    # Mock UPLOAD_DIR for query
    from backend.services import query_service
    monkeypatch.setattr(query_service, "UPLOAD_DIR", tmp_path)
    
    fake_image_id = str(uuid.uuid4())
    dummy_file = tmp_path / f"{fake_image_id}.jpg"
    dummy_file.write_bytes(b"fake image data")

    # 1. Execute a query
    response = client.post(
        "/api/query",
        json={"image_id": fake_image_id, "query": "Test audit ship"}
    )
    assert response.status_code == 200

    # 2. Retrieve logs
    audit_resp = client.get("/api/audit")
    assert audit_resp.status_code == 200
    
    logs = audit_resp.json()
    assert len(logs) == 1
    assert logs[0]["image_id"] == fake_image_id
    assert logs[0]["query"] == "Test audit ship"
    assert "confidence" in logs[0]
