import pytest
from fastapi.testclient import TestClient
from backend.main import app
import uuid

client = TestClient(app)

def test_list_specialists():
    response = client.get("/api/specialists")
    assert response.status_code == 200
    data = response.json()
    assert "specialists" in data
    assert "GeoChat" in data["specialists"]
    assert "DescribeEarth" in data["specialists"]
    assert "UniRS" in data["specialists"]
    assert "DOFA" in data["specialists"]
    assert "categories" in data

def test_dispatch_specialist_not_found():
    response = client.post(
        "/api/specialists/dispatch",
        json={"specialist": "GeoChat", "image_id_1": "non_existent"}
    )
    assert response.status_code == 404
