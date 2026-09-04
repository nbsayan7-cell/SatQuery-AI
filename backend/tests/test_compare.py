import pytest
from fastapi.testclient import TestClient
from backend.main import app
import uuid

client = TestClient(app)

def test_compare_success(tmp_path, monkeypatch):
    # Mock UPLOAD_DIR for compare
    from backend.routes import compare
    monkeypatch.setattr(compare, "UPLOAD_DIR", tmp_path)
    
    from PIL import Image
    fake_image_id_1 = str(uuid.uuid4())
    fake_image_id_2 = str(uuid.uuid4())
    
    dummy_file_1 = tmp_path / f"{fake_image_id_1}.jpg"
    Image.new("RGB", (64, 64), color="red").save(dummy_file_1)
    
    dummy_file_2 = tmp_path / f"{fake_image_id_2}.jpg"
    Image.new("RGB", (64, 64), color="blue").save(dummy_file_2)

    # Monkeypatch pair validator to return valid for this legacy stub test
    async def fake_validate(*args, **kwargs):
        return {
            "status": "VALID",
            "classification": "VALID_SAME_AREA_DIFFERENT_TIME",
            "decision": "CONTINUE",
            "is_blocked": False,
            "direct_explanation": "Valid comparison",
            "reason_codes": [],
            "confidence_breakdown": {"overall_confidence": 0.95},
            "geographic_analysis": {}
        }
    monkeypatch.setattr("ai.pair_validator.ImagePairValidator.validate_pair", fake_validate)
    monkeypatch.setattr("ai.vision_utils.VisionUtils.compute_spatial_correlation", lambda *a: 0.85)

    response = client.post(

        "/api/compare",
        json={"image_id_1": fake_image_id_1, "image_id_2": fake_image_id_2}
    )

    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "result" in data
    assert "Significant structural changes" in data["result"]["answer"]
    assert "change-detection-stub" in data["result"]["model_used"]

def test_compare_not_found():
    response = client.post(
        "/api/compare",
        json={"image_id_1": "non_existent_1", "image_id_2": "non_existent_2"}
    )
    assert response.status_code == 404
