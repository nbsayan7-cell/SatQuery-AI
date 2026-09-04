import sys
from pathlib import Path

# Force UTF-8 on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def upload(path_str: str) -> str:
    p = Path(path_str)
    with open(p, "rb") as f:
        r = client.post("/api/upload", files={"file": (p.name, f, "image/jpeg")})
    assert r.status_code == 200
    return r.json()["image_id"]

def run_tests():
    suite_dir = PROJECT_ROOT / "data" / "test_suite"
    print("\n" + "=" * 70)
    print("🛰️  SATQUERY AI — ADVANCED SPECIALIST & BENCHMARK SUITE")
    print("=" * 70)

    # 1. Spatial Mismatch Rejection
    print("\n[TEST 1] Spatial Mismatch Location Rejection (SET 06: Kolkata vs Delhi)")
    id_a = upload(str(suite_dir / "06_different_place" / "location_a_kolkata.jpg"))
    id_b = upload(str(suite_dir / "06_different_place" / "location_b_delhi.jpg"))
    res_mismatch = client.post("/api/compare", json={"image_id_1": id_a, "image_id_2": id_b}).json()
    print("Answer:", res_mismatch["result"]["answer"])
    print("Model:", res_mismatch["result"]["model_used"])
    assert "TEMPORAL ANALYSIS REJECTED" in res_mismatch["result"]["answer"], "Failed mismatch rejection test"
    print("✓ PASSED: Spatial mismatch correctly rejected!")

    # 2. xView2 Disaster Damage Assessment
    print("\n[TEST 2] xView2 Post-Disaster Damage Assessment (SET 03: Joplin Tornado)")
    id_pre = upload(str(suite_dir / "03_disaster_before_after" / "joplin_pre.jpg"))
    id_post = upload(str(suite_dir / "03_disaster_before_after" / "joplin_post.jpg"))
    res_disaster = client.post("/api/compare", json={"image_id_1": id_pre, "image_id_2": id_post}).json()
    print("Answer:", res_disaster["result"]["answer"])
    print("Model:", res_disaster["result"]["model_used"])
    print("Confidence:", res_disaster["result"]["confidence"])
    assert "Disaster Assessment Mode" in res_disaster["result"]["answer"], "Failed disaster mode test"
    print("✓ PASSED: xView2 Disaster damage successfully assessed!")

    # 3. False-Positive Suppression
    print("\n[TEST 3] False-Positive Suppression (SET 02: Same Place No Change)")
    id_t0 = upload(str(suite_dir / "02_same_place_no_major_change" / "hanoi_t0.jpg"))
    id_t1 = upload(str(suite_dir / "02_same_place_no_major_change" / "hanoi_t1_nochange.jpg"))
    res_nochange = client.post("/api/compare", json={"image_id_1": id_t0, "image_id_2": id_t1}).json()
    print("Answer:", res_nochange["result"]["answer"])
    assert "No significant structural changes detected" in res_nochange["result"]["answer"]
    print("✓ PASSED: False-positive suppressed on stable scene!")

    # 4. GoldenEye Specialist Dispatcher
    print("\n[TEST 4] GoldenEye Multi-Agent Specialist Dispatch")
    spec_list = client.get("/api/specialists").json()
    print("Registered Specialists:", spec_list["specialists"])
    
    # Dispatch DescribeEarth
    d_res = client.post("/api/specialists/dispatch", json={"specialist": "DescribeEarth", "image_id_1": id_a}).json()
    print("DescribeEarth Output:", d_res["result"]["answer"][:120], "...")
    assert d_res["status"] == "success"

    # Dispatch DOFA Fusion
    id_sar = upload(str(suite_dir / "04_same_place_optical_sar" / "sen12ms_sar.jpg"))
    f_res = client.post("/api/specialists/dispatch", json={"specialist": "DOFA", "image_id_1": id_a, "image_id_2": id_sar}).json()
    print("DOFA Fusion Output:", f_res["result"]["answer"][:120], "...")
    assert f_res["status"] == "success"

    print("\n" + "=" * 70)
    print("🎯 ALL 4 ADVANCED BENCHMARKS PASSED PERFECTLY!")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    run_tests()
