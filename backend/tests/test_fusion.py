import pytest
from fastapi.testclient import TestClient
from backend.main import app
import uuid

client = TestClient(app)

def test_fusion_success(tmp_path, monkeypatch):
    # Mock UPLOAD_DIR for fusion
    from backend.routes import fusion
    monkeypatch.setattr(fusion, "UPLOAD_DIR", tmp_path)
    
    from pathlib import Path
    import shutil
    project_root = Path(__file__).resolve().parent.parent.parent
    suite_dir = project_root / "data" / "test_suite" / "04_same_place_optical_sar"
    
    fake_image_id_1 = str(uuid.uuid4())
    fake_image_id_2 = str(uuid.uuid4())
    
    dummy_file_1 = tmp_path / f"{fake_image_id_1}.jpg"
    shutil.copyfile(suite_dir / "sen12ms_optical.jpg", dummy_file_1)
    
    dummy_file_2 = tmp_path / f"{fake_image_id_2}.jpg"
    shutil.copyfile(suite_dir / "sen12ms_sar.jpg", dummy_file_2)

    response = client.post(
        "/api/fuse",
        json={"image_id_1": fake_image_id_1, "image_id_2": fake_image_id_2}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "result" in data
    assert "Fusion analysis complete" in data["result"]["answer"]
    assert "fusion-stub" in data["result"]["model_used"]

def test_fusion_not_found():
    response = client.post(
        "/api/fuse",
        json={"image_id_1": "non_existent_1", "image_id_2": "non_existent_2"}
    )
    assert response.status_code == 404
