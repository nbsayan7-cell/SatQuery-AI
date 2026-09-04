import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_chat_text_query():
    response = client.post(
        "/api/chat",
        json={"message": "Explain how SAR satellite imagery works."}
    )
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert len(data["reply"]) > 10
    assert "model_used" in data
    assert "timestamp" in data

def test_chat_empty_message():
    response = client.post(
        "/api/chat",
        json={"message": "   "}
    )
    assert response.status_code == 400
