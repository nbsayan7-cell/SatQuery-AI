import pytest
from fastapi.testclient import TestClient
from backend.main import app
import uuid

client = TestClient(app)

# We need to test the /api/query endpoint.
# However, the endpoint depends on the image actually existing in UPLOAD_DIR
# because QueryService uses UPLOAD_DIR.glob(f"{image_id}.*")
# To make this robust, we'll create a dummy file in the test.

def test_execute_query_success(tmp_path, monkeypatch):
    # Mock UPLOAD_DIR in backend.services.query_service
    from backend.services import query_service
    monkeypatch.setattr(query_service, "UPLOAD_DIR", tmp_path)
    
    # Create a dummy image file
    fake_image_id = str(uuid.uuid4())
    dummy_file = tmp_path / f"{fake_image_id}.jpg"
    dummy_file.write_bytes(b"fake image data")

    # Now make the request
    response = client.post(
        "/api/query",
        json={"image_id": fake_image_id, "query": "Are there any ships?"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["image_id"] == fake_image_id
    assert data["query"] == "Are there any ships?"
    
    # VQA result check (from the stub)
    assert "result" in data
    assert "answer" in data["result"]
    assert "Yes, I can identify 3 vessels" in data["result"]["answer"]
    assert "confidence" in data["result"]
    assert "evidence" in data["result"]
    assert len(data["result"]["evidence"]) > 0

def test_execute_query_not_found():
    response = client.post(
        "/api/query",
        json={"image_id": "non_existent_id", "query": "Hello?"}
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]

def test_orchestration_routing(tmp_path, monkeypatch):
    # Mock UPLOAD_DIR in backend.services.query_service
    from backend.services import query_service
    monkeypatch.setattr(query_service, "UPLOAD_DIR", tmp_path)
    
    fake_image_id = str(uuid.uuid4())
    dummy_file = tmp_path / f"{fake_image_id}.jpg"
    dummy_file.write_bytes(b"fake image data")

    # 1. Test VQA Routing
    response_vqa = client.post(
        "/api/query",
        json={"image_id": fake_image_id, "query": "Are there any ships?"}
    )
    assert response_vqa.status_code == 200
    assert "vqa-stub" in response_vqa.json()["result"]["model_used"]

    # 2. Test Captioning Routing
    response_cap = client.post(
        "/api/query",
        json={"image_id": fake_image_id, "query": "Can you describe this image?"}
    )
    assert response_cap.status_code == 200
    assert "captioning-stub" in response_cap.json()["result"]["model_used"]
