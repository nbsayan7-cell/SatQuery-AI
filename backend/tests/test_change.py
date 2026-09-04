import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
SUITE_DIR = PROJECT_ROOT / "data" / "test_suite"

def upload_image(path: Path) -> str:
    with open(path, "rb") as f:
        res = client.post("/api/upload", files={"file": (path.name, f, "image/jpeg")})
    assert res.status_code == 200
    return res.json()["image_id"]

def test_fine_grained_change_success():
    # Use actual before/after pair
    id_pre = upload_image(SUITE_DIR / "03_disaster_before_after" / "joplin_pre.jpg")
    id_post = upload_image(SUITE_DIR / "03_disaster_before_after" / "joplin_post.jpg")

    payload = {
        "image_id_1": id_pre,
        "image_id_2": id_post
    }

    res = client.post("/api/analyze/change", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    result = data["result"]

    assert "changed_regions" in result
    changed_regions = result["changed_regions"]
    assert len(changed_regions) >= 1
    assert result["total_regions"] == len(changed_regions)

    # Validate per-region fields
    first_region = changed_regions[0]
    assert "region_id" in first_region
    assert "bbox" in first_region
    assert len(first_region["bbox"]) == 4
    assert "change_type" in first_region
    assert "area_px" in first_region
    assert first_region["area_px"] > 0
    assert "confidence" in first_region
    assert 0.0 < first_region["confidence"] <= 1.0

    # Validate grounding overlays
    assert "grounding" in result
    assert len(result["grounding"]) >= len(changed_regions)

def test_change_spatial_mismatch_rejection():
    # Non-corresponding images
    id_a = upload_image(SUITE_DIR / "06_different_place" / "location_a_kolkata.jpg")
    id_b = upload_image(SUITE_DIR / "06_different_place" / "location_b_delhi.jpg")

    res = client.post("/api/analyze/change", json={"image_id_1": id_a, "image_id_2": id_b})
    assert res.status_code == 200
    result = res.json()["result"]
    assert "TEMPORAL ANALYSIS REJECTED" in result["answer"]
    assert result["changed_regions"] == []

def test_change_stability_suppression():
    # Stable pair
    id_t0 = upload_image(SUITE_DIR / "02_same_place_no_major_change" / "hanoi_t0.jpg")
    id_t1 = upload_image(SUITE_DIR / "02_same_place_no_major_change" / "hanoi_t1_nochange.jpg")

    res = client.post("/api/analyze/change", json={"image_id_1": id_t0, "image_id_2": id_t1})
    assert res.status_code == 200
    result = res.json()["result"]
    assert "No significant structural changes" in result["answer"]
    assert result["changed_regions"] == []

def test_change_multi_temporal():
    id1 = upload_image(SUITE_DIR / "01_same_place_different_time" / "levir_2020.jpg")
    id2 = upload_image(SUITE_DIR / "01_same_place_different_time" / "levir_2024.jpg")
    id3 = upload_image(PROJECT_ROOT / "data" / "demo_images" / "change_2020.jpg")

    payload = {
        "image_id_1": id1,
        "image_id_2": id2,
        "timeline_image_ids": [id3]
    }


    res = client.post("/api/analyze/change", json=payload)
    assert res.status_code == 200
    result = res.json()["result"]
    assert result["multi_temporal_timeline"] is not None
    assert len(result["multi_temporal_timeline"]) == 1
    assert "T1 -> T2" in result["multi_temporal_timeline"][0]["interval"]

def test_change_not_found():
    res = client.post("/api/analyze/change", json={"image_id_1": "bad_id_1", "image_id_2": "bad_id_2"})
    assert res.status_code == 404
