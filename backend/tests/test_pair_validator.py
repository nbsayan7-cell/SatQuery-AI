"""
Test suite for Image Pair Compatibility & Validation Engine (SQ-039).
Covers 8 mandatory test scenarios from the master prompt specification.
"""

import asyncio
from pathlib import Path
from fastapi.testclient import TestClient
from backend.main import app
from backend.config import UPLOAD_DIR
from ai.pair_validator import ImagePairValidator

client = TestClient(app)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
SUITE_DIR = PROJECT_ROOT / "data" / "test_suite"


def test_valid_same_area_different_time():
    """TEST 01: Same location / different time → VALID"""
    path_a = str(SUITE_DIR / "01_same_place_different_time" / "levir_2020.jpg")
    path_b = str(SUITE_DIR / "01_same_place_different_time" / "levir_2024.jpg")

    report = asyncio.run(ImagePairValidator.validate_pair(path_a, path_b, task="change_detection"))
    assert report["status"] == "VALID"
    assert report["classification"] == "VALID_SAME_AREA_DIFFERENT_TIME"
    assert report["decision"] == "CONTINUE"
    assert report["is_blocked"] is False
    assert report["confidence_breakdown"]["geographic_confidence"] >= 0.90


def test_different_cities_rejected(tmp_path):
    """TEST 03: Different cities (Kolkata vs Delhi) → REJECTED & BLOCKED"""
    from PIL import Image
    import numpy as np

    img_k = Image.fromarray(np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8))
    p_k = tmp_path / "kolkata_2024.png"
    img_k.save(str(p_k))

    img_d = Image.fromarray(np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8))
    p_d = tmp_path / "delhi_2024.png"
    img_d.save(str(p_d))

    report = asyncio.run(ImagePairValidator.validate_pair(str(p_k), str(p_d), task="change_detection"))
    assert report["status"] == "REJECTED"
    assert report["classification"] == "DIFFERENT_LOCATION"
    assert report["decision"] == "BLOCK"
    assert report["is_blocked"] is True
    assert "GEOGRAPHIC_MISMATCH" in report["reason_codes"]
    assert report["confidence_breakdown"]["geographic_confidence"] == 0.0


def test_cross_modal_optical_sar():
    """TEST 07: Same location / Optical + SAR → VALID_CROSS_MODAL"""
    path_opt = str(SUITE_DIR / "04_same_place_optical_sar" / "sen12ms_optical.jpg")
    path_sar = str(SUITE_DIR / "04_same_place_optical_sar" / "sen12ms_sar.jpg")

    report = asyncio.run(ImagePairValidator.validate_pair(path_opt, path_sar, task="change_detection"))
    assert report["classification"] == "VALID_CROSS_MODAL_SAME_AREA"
    assert report["decision"] in ("CONTINUE", "CONTINUE_WITH_WARNING")
    assert report["is_blocked"] is False


def test_validation_blocks_change_endpoint(tmp_path):
    """TEST: Change detection route hard-blocks geographically mismatched pair (e.g. Kolkata vs Delhi)"""
    from PIL import Image
    import numpy as np

    img_k = Image.fromarray(np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8))
    p_k = tmp_path / "kolkata_2024.png"
    img_k.save(str(p_k))

    img_d = Image.fromarray(np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8))
    p_d = tmp_path / "delhi_2024.png"
    img_d.save(str(p_d))

    # Upload both
    with open(p_k, "rb") as f:
        res1 = client.post("/api/upload", files={"file": ("kolkata_2024.png", f, "image/png")})
    id_k = res1.json()["image_id"]

    with open(p_d, "rb") as f:
        res2 = client.post("/api/upload", files={"file": ("delhi_2024.png", f, "image/png")})
    id_d = res2.json()["image_id"]

    # Request change detection
    res = client.post("/api/analyze/change", json={
        "image_id_1": id_k,
        "image_id_2": id_d
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "blocked"
    assert data["result"]["total_regions"] == 0
    assert "DIFFERENT_LOCATION" in data["result"]["validation_report"]["classification"]
    assert "GEOGRAPHIC_MISMATCH" in data["result"]["validation_report"]["reason_codes"]



def test_corrupt_file_rejected(tmp_path):
    """TEST 13: Corrupt file → REJECTED"""
    from PIL import Image
    import numpy as np

    valid_p = tmp_path / "dubai_2020.png"
    Image.fromarray(np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8)).save(str(valid_p))

    corrupt_p = tmp_path / "corrupt.png"
    corrupt_p.write_bytes(b"NOT_A_REAL_IMAGE")

    report = asyncio.run(ImagePairValidator.validate_pair(str(corrupt_p), str(valid_p)))
    assert report["status"] == "REJECTED"
    assert report["classification"] == "INVALID_INPUT"
    assert report["is_blocked"] is True
    assert "INVALID_INPUT_FILE" in report["reason_codes"]


def test_missing_file_rejected(tmp_path):
    """TEST 20: Missing file → REJECTED"""
    valid_p = tmp_path / "dubai_2020.png"
    from PIL import Image
    import numpy as np
    Image.fromarray(np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8)).save(str(valid_p))

    report = asyncio.run(ImagePairValidator.validate_pair(str(tmp_path / "nonexistent.png"), str(valid_p)))
    assert report["status"] == "REJECTED"
    assert report["classification"] == "INVALID_INPUT"
    assert report["is_blocked"] is True


def test_confidence_breakdown_has_all_scores():
    """Verify confidence metrics breakdown integrity"""
    path_a = str(SUITE_DIR / "01_same_place_different_time" / "levir_2020.jpg")
    path_b = str(SUITE_DIR / "01_same_place_different_time" / "levir_2024.jpg")

    report = asyncio.run(ImagePairValidator.validate_pair(path_a, path_b))
    cb = report["confidence_breakdown"]
    assert "geographic_confidence" in cb
    assert "registration_confidence" in cb
    assert "temporal_confidence" in cb
    assert "modality_confidence" in cb
    assert "overall_confidence" in cb
    for k, v in cb.items():
        assert 0.0 <= v <= 1.0, f"{k} out of range: {v}"


def test_validate_pair_api_endpoint():
    """Verify POST /api/validate/pair HTTP route"""
    # Upload two test images
    with open(SUITE_DIR / "01_same_place_different_time" / "levir_2020.jpg", "rb") as f:
        res1 = client.post("/api/upload", files={"file": ("levir_2020.jpg", f, "image/jpeg")})
    id1 = res1.json()["image_id"]

    with open(SUITE_DIR / "01_same_place_different_time" / "levir_2024.jpg", "rb") as f:
        res2 = client.post("/api/upload", files={"file": ("levir_2024.jpg", f, "image/jpeg")})
    id2 = res2.json()["image_id"]

    res = client.post("/api/validate/pair", json={
        "image_id_1": id1,
        "image_id_2": id2,
        "task": "change_detection"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "validation_report" in data
    assert data["validation_report"]["is_blocked"] is False
