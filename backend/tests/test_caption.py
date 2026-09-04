import pytest
from fastapi.testclient import TestClient
from backend.main import app
import uuid

client = TestClient(app)

def test_caption_success(tmp_path, monkeypatch):
    # Mock UPLOAD_DIR for caption
    from backend.routes import caption
    monkeypatch.setattr(caption, "UPLOAD_DIR", tmp_path)
    
    fake_image_id = str(uuid.uuid4())
    dummy_file = tmp_path / f"{fake_image_id}.jpg"
    dummy_file.write_bytes(b"fake image data")

    response = client.post(
        "/api/caption",
        json={"image_id": fake_image_id}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "result" in data
    assert "coastal region" in data["result"]["answer"]
    assert "captioning-stub" in data["result"]["model_used"]

def test_caption_not_found():
    response = client.post(
        "/api/caption",
        json={"image_id": "non_existent_id"}
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]
