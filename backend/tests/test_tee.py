import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_tee_showcases_list():
    res = client.get("/api/tee/showcases")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert len(data["showcases"]) >= 3
    first = data["showcases"][0]
    assert "id" in first
    assert "name" in first
    assert "bbox" in first
    assert len(first["bbox"]) == 4
    assert len(first["available_dates"]) >= 2

def test_tee_extract_showcase_location():
    payload = {
        "bbox": [105.80, 20.98, 105.92, 21.08],
        "date": "2020-06-15",
        "location_id": "hanoi_red_river"
    }
    res = client.post("/api/tee/extract", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "image_id" in data
    assert data["image_id"].startswith("tee_")
    assert "open stac" in data["meta"]["license"].lower()

def test_tee_extract_bbox_too_large_rejected():
    payload = {
        "bbox": [0.0, 0.0, 10.0, 10.0],  # 10x10 degrees is too large
        "date": "2022-01-01"
    }
    res = client.post("/api/tee/extract", json=payload)
    assert res.status_code == 400
    assert "too large" in res.json()["detail"].lower()

def test_tee_geocode_placename():
    res = client.get("/api/tee/geocode?q=Hanoi")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert len(data["results"]) >= 1
    first = data["results"][0]
    assert "lat" in first
    assert "lon" in first
    assert "bbox" in first

def test_tee_geocode_coordinates():
    res = client.get("/api/tee/geocode?q=22.5726,88.3639")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert len(data["results"]) == 1
    assert abs(data["results"][0]["lat"] - 22.5726) < 0.001
    assert abs(data["results"][0]["lon"] - 88.3639) < 0.001

def test_tee_search_satellite_catalog():
    payload = {
        "bbox": [88.30, 22.50, 88.40, 22.60],
        "start_date": "2023-01-01",
        "end_date": "2023-01-15",
        "sensor": "SENTINEL-2",
        "cloud_max": 100.0,
        "limit": 5
    }
    res = client.post("/api/tee/search", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "catalog" in data
    assert "observations" in data["catalog"]

