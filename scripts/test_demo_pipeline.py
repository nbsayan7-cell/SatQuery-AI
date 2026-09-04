import os
import sys
import json
from pathlib import Path

# Force UTF-8 on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def print_header(title: str):
    print("\n" + "=" * 70)
    print(f">> [SATQUERY AI]  {title.upper()}")
    print("=" * 70)

def upload_image(file_path: str) -> str:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found: {file_path}")
    with open(path, "rb") as f:
        resp = client.post(
            "/api/upload",
            files={"file": (path.name, f, "image/jpeg")}
        )
    assert resp.status_code == 200, f"Upload failed: {resp.text}"
    image_id = resp.json()["image_id"]
    print(f"+ Uploaded {path.name} -> image_id: {image_id} (size: {path.stat().st_size} bytes)")
    return image_id

def run_all_demos():
    demo_dir = PROJECT_ROOT / "data" / "demo_images"
    print_header("SatQuery AI -- End-to-End Multimodal Remote Sensing Demo")
    print(f"Target Problem Statement: ISRO SIH26167")
    print(f"Working Directory: {PROJECT_ROOT}")

    # Verify Health
    health_resp = client.get("/api/health")
    print(f"+ Backend Health Check: {health_resp.json()}")

    # -------------------------------------------------------------
    # DEMO 1: Single-Image Visual Question Answering (VQA)
    # -------------------------------------------------------------
    print_header("Requirement 1: Single-Image VQA (Optical Satellite Scene)")
    img1_path = demo_dir / "demo_1.jpg"
    id1 = upload_image(str(img1_path))

    query1 = "Describe the land cover and dominant water bodies in this satellite scene."
    print(f"\n[Query]: {query1}")
    res1 = client.post("/api/query", json={"image_id": id1, "query": query1}).json()
    print(f"[Model]: {res1['result'].get('model_used')}")
    print(f"[Confidence]: {res1['result'].get('confidence') * 100:.1f}%")
    print(f"[Answer]:\n{res1['result'].get('answer')}")
    print(f"[Evidence Trail]:")
    for step in res1['result'].get('evidence', []):
        print(f"   * {step['step']} (confidence: {step['confidence'] * 100:.0f}%)")

    # -------------------------------------------------------------
    # DEMO 2: Automatic Scene Captioning
    # -------------------------------------------------------------
    print_header("Requirement 2a: Automatic Scene Captioning")
    img7_path = demo_dir / "demo_7.jpg"
    id7 = upload_image(str(img7_path))

    print(f"\n[Action]: Generating comprehensive scene overview for demo_7.jpg")
    res2 = client.post("/api/caption", json={"image_id": id7}).json()
    print(f"[Model]: {res2['result'].get('model_used')}")
    print(f"[Confidence]: {res2['result'].get('confidence') * 100:.1f}%")
    print(f"[Caption]:\n{res2['result'].get('answer')}")

    # -------------------------------------------------------------
    # DEMO 3: Text-Guided Visual Grounding
    # -------------------------------------------------------------
    print_header("Requirement 2b: Text-Guided Region Grounding (VRSBench Style)")
    img3_path = demo_dir / "demo_3.jpg"
    id3 = upload_image(str(img3_path))

    query3 = "Highlight the water bodies and urban infrastructure."
    print(f"\n[Query]: {query3}")
    res3 = client.post("/api/query", json={"image_id": id3, "query": query3}).json()
    print(f"[Grounding Bounding Boxes]:")
    for b in res3['result'].get('grounding', []):
        print(f"   - [{b['label']}]: bbox={b['bbox']}")

    # -------------------------------------------------------------
    # DEMO 4: Bi-Temporal Change Detection (CDVQA)
    # -------------------------------------------------------------
    print_header("Requirement 3: Multitemporal Change Detection (2020 vs 2024)")
    img_t0 = demo_dir / "change_2020.jpg"
    img_t1 = demo_dir / "change_2024.jpg"
    id_t0 = upload_image(str(img_t0))
    id_t1 = upload_image(str(img_t1))

    print(f"\n[Action]: Comparing Baseline (2020) vs Target (2024)")
    res4 = client.post("/api/compare", json={"image_id_1": id_t0, "image_id_2": id_t1}).json()
    print(f"[Model]: {res4['result'].get('model_used')}")
    print(f"[Confidence]: {res4['result'].get('confidence') * 100:.1f}%")
    print(f"[Change Analysis]:\n{res4['result'].get('answer')}")
    print(f"[Change Grounding]: {res4['result'].get('grounding')}")

    # -------------------------------------------------------------
    # DEMO 5: Multimodal Optical + SAR Fusion (BigEarthNet)
    # -------------------------------------------------------------
    print_header("Requirement 4: Cross-Modal Fusion (Optical + SAR Radar)")
    img_sar = demo_dir / "demo_2.jpg"
    id_sar = upload_image(str(img_sar))

    print(f"\n[Action]: Fusing Optical Image (Hanoi) with SAR Radar Scene")
    res5 = client.post("/api/fuse", json={"image_id_1": id1, "image_id_2": id_sar}).json()
    print(f"[Model]: {res5['result'].get('model_used')}")
    print(f"[Confidence]: {res5['result'].get('confidence') * 100:.1f}%")
    print(f"[Fusion Findings]:\n{res5['result'].get('answer')}")
    print(f"[Grounding Layers]: {res5['result'].get('grounding')}")

    # -------------------------------------------------------------
    # DEMO 6: Integrated Conversational Chatbot (Ollama Llama-3)
    # -------------------------------------------------------------
    print_header("Requirement 5 & Chatbot: Agentic Chatbot Interaction")
    chat_prompt = "Explain why SAR imagery is essential when optical satellite sensors are blocked by dense monsoonal cloud cover."
    print(f"\n[User Question]: {chat_prompt}")
    chat_res = client.post(
        "/api/chat",
        json={"message": chat_prompt, "image_id": id1}
    ).json()
    print(f"[Chatbot Model]: {chat_res.get('model_used')}")
    print(f"[SatQuery Copilot Reply]:\n{chat_res.get('reply')}")

    # -------------------------------------------------------------
    # DEMO 7: Audit Trail & Execution Summary
    # -------------------------------------------------------------
    print_header("Requirement 7: Immutable Audit Trail & Execution Summary")
    audit_res = client.get("/api/audit").json()
    print(f"+ Retrieved {len(audit_res)} logged execution traces from audit log:")
    for log in audit_res[:5]:
        print(f"   * [{log['timestamp']}] Target: {log['image_id'][:20]}... | Query: '{log['query']}' | Conf: {log.get('confidence')}")

    print("\n" + "=" * 70)
    print(">>  ALL DEMO TEST CASES COMPLETED SUCCESSFULLY WITHOUT ERRORS!")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    run_all_demos()
