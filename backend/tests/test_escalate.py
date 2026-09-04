from fastapi.testclient import TestClient
from pathlib import Path
from backend.main import app

client = TestClient(app)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
SUITE_DIR = PROJECT_ROOT / "data" / "test_suite"

def upload_image(path: Path) -> str:
    with open(path, "rb") as f:
        res = client.post("/api/upload", files={"file": (path.name, f, "image/jpeg")})
    assert res.status_code == 200
    return res.json()["image_id"]

def test_escalation_pipeline_success():
    img_id = upload_image(SUITE_DIR / "01_same_place_different_time" / "levir_2020.jpg")
    
    payload = {
        "image_id": img_id,
        "question": "Are there any buildings or roads in this scene?",
        "force_high_precision": True
    }

    res = client.post("/api/analyze/escalate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    result = data["result"]

    assert result["is_escalated"] is True
    assert "escalation_trace" in result
    assert len(result["escalation_trace"]) >= 2
    assert "High-Precision Verified" in result["answer"]
    assert len(result["grounding"]) >= 1
    assert result["confidence"] >= 0.75

def test_escalation_with_sar_cross_check():
    opt_id = upload_image(SUITE_DIR / "04_same_place_optical_sar" / "sen12ms_optical.jpg")
    sar_id = upload_image(SUITE_DIR / "04_same_place_optical_sar" / "sen12ms_sar.jpg")

    payload = {
        "image_id": opt_id,
        "sar_image_id": sar_id,
        "question": "Assess structural density across optical and SAR modalities",
        "force_high_precision": True
    }


    res = client.post("/api/analyze/escalate", json=payload)
    assert res.status_code == 200
    result = res.json()["result"]
    assert result["is_escalated"] is True
    # Confirm stage 4 is in escalation trace
    stages = [s.get("stage") for s in result["escalation_trace"]]
    assert any("SAR Cross-Modal" in str(s) for s in stages)

def test_escalation_not_found():
    res = client.post("/api/analyze/escalate", json={"image_id": "nonexistent_id", "question": "test"})
    assert res.status_code == 404
