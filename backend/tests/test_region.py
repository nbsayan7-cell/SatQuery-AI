import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_analyze_region_success():
    # 1. Upload a sample test image
    file_content = b"fake-image-binary-stream-for-roi-test"
    # Use valid image if available from data or mock upload
    upload_res = client.post(
        "/api/upload",
        files={"file": ("test_roi_sample.jpg", b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xff\xc0\x00\x0b\x08\x00\x10\x00\x10\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9", "image/jpeg")}
    )
    assert upload_res.status_code == 200
    image_id = upload_res.json()["image_id"]

    # 2. Call /api/analyze/region with bbox geometry
    roi_payload = {
        "image_id": image_id,
        "roi_geometry": {
            "type": "bbox",
            "coordinates": [15, 20, 40, 35]  # percentage [x, y, w, h]
        },
        "question": "Are there buildings in this sector?",
        "task": "vqa"
    }

    res = client.post("/api/analyze/region", json=roi_payload)
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "success"
    assert "trace_id" in data
    assert "result" in data
    result = data["result"]
    assert "[ROI Analysis]" in result["answer"]
    assert "confidence" in result
    assert result["confidence"] > 0
    assert "grounding" in result
    assert len(result["grounding"]) >= 1

    # Verify ROI container overlay
    roi_container = result["grounding"][0]
    assert roi_container.get("is_roi_container") is True
    assert roi_container["label"] == "Selected ROI"

    # Verify ROI metadata
    assert "roi_metadata" in result
    assert "pct_bounds" in result["roi_metadata"]
    assert "was_upsampled" in result["roi_metadata"]

def test_analyze_region_polygon():
    # Upload test image
    upload_res = client.post(
        "/api/upload",
        files={"file": ("test_poly_sample.jpg", b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xff\xc0\x00\x0b\x08\x00\x10\x00\x10\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9", "image/jpeg")}
    )
    assert upload_res.status_code == 200
    image_id = upload_res.json()["image_id"]

    # Call with polygon
    roi_payload = {
        "image_id": image_id,
        "roi_geometry": {
            "type": "polygon",
            "coordinates": [[10, 10], [50, 10], [50, 60], [10, 60]]
        },
        "question": "Describe this parcel",
        "task": "caption"
    }

    res = client.post("/api/analyze/region", json=roi_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "result" in data

def test_analyze_region_not_found():
    res = client.post(
        "/api/analyze/region",
        json={
            "image_id": "nonexistent-image-id-9999",
            "roi_geometry": {"type": "bbox", "coordinates": [0, 0, 50, 50]},
            "question": "What is here?"
        }
    )
    assert res.status_code == 404
