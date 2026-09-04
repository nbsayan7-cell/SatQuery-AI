from fastapi.testclient import TestClient
from backend.main import app
import io
from PIL import Image

client = TestClient(app)

def test_upload_image():
    # Create a dummy image in memory
    file_obj = io.BytesIO()
    img = Image.new("RGB", (100, 100), color="red")
    img.save(file_obj, format="JPEG")
    file_obj.seek(0)
    
    # Upload via the API
    response = client.post(
        "/api/upload",
        files={"file": ("test_image.jpg", file_obj, "image/jpeg")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "image_id" in data
    assert "meta" in data
    assert data["meta"]["filename"] == "test_image.jpg"
    assert data["meta"]["width"] == 100
    assert data["meta"]["height"] == 100
    assert data["meta"]["format"] == "JPEG"

def test_upload_invalid_extension():
    response = client.post(
        "/api/upload",
        files={"file": ("test.txt", b"hello", "text/plain")}
    )
    assert response.status_code == 400
    assert "not allowed" in response.json()["detail"]
