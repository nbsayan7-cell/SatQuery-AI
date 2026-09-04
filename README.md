# 🛰️ SatQuery AI: Autonomous Multimodal Remote Sensing Intelligence Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![React 19](https://img.shields.io/badge/frontend-React%2019-61dafb.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![CesiumJS](https://img.shields.io/badge/3D%20Globe-CesiumJS-499BEA.svg)](https://cesium.com/)
[![SIH 2026](https://img.shields.io/badge/Smart%20India%20Hackathon-R1--R7%20Compliant-orange.svg)](https://www.sih.gov.in/)

> **"The AI may interpret the evidence. It may not manufacture the evidence."**  
> SatQuery AI transforms complex satellite earth observation data into verifiable, actionable geospatial intelligence using a deterministic remote sensing pipeline, multimodal vision-language models, and cryptographic audit trails.

---

## 🖥️ UI Showcase & Interactive Dashboards

### 1. Main Multimodal Intelligence Command Center
The central command interface integrates satellite image uploads, natural language question routing, real-time spatial visualizers, deterministic metrics, and model reasoning chains.

![SatQuery Main Dashboard](docs/assets/main_dashboard.png)

* **Multi-Modal Query Bar**: Handles natural language queries for VQA, change detection, and disaster assessment.
* **Dual Layer Map Viewer**: Renders true-color optical, false-color IR, SAR amplitude, and segmentation overlays.
* **Evidence Panel**: Displays pixel-level calculations, sensor metadata, GSD (Ground Sampling Distance), and confidence bounds.

---

### 2. God's Eye 3D Earth Explorer
An interactive 3D virtual globe powered by CesiumJS providing planetary situational awareness, satellite trajectory tracking, and sector-level intelligence feeds.

![God's Eye 3D Earth Explorer](docs/assets/god_eye_3d_explorer.png)

* **Planetary Navigation**: Seamless zoom from whole-earth orbit down to sub-meter tactical targets.
* **Telemetry & Coordinates**: Live latitude, longitude, altitude, and sun-angle calculations.
* **Tactical Sectors**: Pre-configured regional monitoring presets for maritime, border security, and disaster response zones.

---

### 3. Bi-Temporal Change Detection & Damage Assessment
Deterministic pixel differencing, structural similarity (SSIM), and deep feature extraction comparing Baseline (T0) and Current (T1) satellite passes.

![Bi-Temporal Change Detection](docs/assets/change_detection_results.png)

* **Automated Image Co-Registration**: Align passes to sub-pixel accuracy before differencing.
* **Change Heatmaps**: Red-yellow-green delta masks highlighting newly constructed structures, collapsed infrastructure, or flood expansion.
* **Damage Categorization**: Quantified structural change ratio (%) with confidence statistics.

---

### 4. Natural Language Visual Question Answering (VQA)
Specialized vision-language intelligence providing grounded bounding boxes and object counts verified against spatial resolution limits.

![VQA Query Results](docs/assets/vqa_results.png)

* **Resolution Guardrails**: Automatically warns if target objects are smaller than the Nyquist spatial sampling limit.
* **Grounded Spatial Coordinates**: Precise bounding polygon extraction with normalized geo-coordinates.

---

### 5. Automated REST API & Benchmark Suite
Comprehensive OpenAPI / Swagger specification with 20 pre-validated SIH benchmark scenarios tested across optical, SAR, and bi-temporal modalities.

![Swagger OpenAPI Benchmarks](docs/assets/swagger_api.png)

---

## 📊 Live Analysis Data Examples

SatQuery AI strictly enforces deterministic scientific outputs. The LLM acts as an analyst-narrator, while all numbers, coordinates, and percentages originate from mathematical algorithms.

### Example 1: Bi-Temporal Change Detection Analysis Output

```json
{
  "query_id": "sat-query-cd-2026-0904",
  "modality": "optical_bi_temporal",
  "baseline_scene": {
    "sensor": "Sentinel-2 MSI",
    "timestamp": "2026-02-15T04:22:11Z",
    "cloud_cover_pct": 1.2,
    "gsd_meters": 10.0
  },
  "current_scene": {
    "sensor": "Sentinel-2 MSI",
    "timestamp": "2026-09-02T04:21:49Z",
    "cloud_cover_pct": 2.8,
    "gsd_meters": 10.0
  },
  "registration": {
    "algorithm": "ORB-RANSAC homography",
    "reprojection_error_px": 0.42,
    "status": "PASS_G1"
  },
  "metrics": {
    "structural_similarity_index_ssim": 0.7412,
    "normalized_difference_change_ratio_pct": 14.86,
    "affected_area_sq_km": 3.42,
    "confidence_interval_95": [13.91, 15.81]
  },
  "detected_clusters": [
    {
      "cluster_id": 1,
      "class": "destroyed_infrastructure",
      "bbox_normalized": [0.24, 0.31, 0.48, 0.62],
      "area_hectares": 12.4,
      "severity_score": 0.89
    },
    {
      "cluster_id": 2,
      "class": "debris_accumulation",
      "bbox_normalized": [0.55, 0.12, 0.68, 0.29],
      "area_hectares": 5.1,
      "severity_score": 0.67
    }
  ],
  "gate_verdict": {
    "scientific_gate": "G4_DETERMINISTIC_PASS",
    "requires_expert_escalation": false
  }
}
```

---

### Example 2: Visual Question Answering (VQA) with Object Detection

```json
{
  "query": "Detect and count naval vessels berthed in the drydock basin",
  "sensor_metadata": {
    "platform": "PlanetScope SuperDove",
    "native_resolution_m": 3.0,
    "off_nadir_angle_deg": 4.1
  },
  "nyquist_check": {
    "minimum_detectable_target_m": 6.0,
    "target_nominal_size_m": 85.0,
    "status": "PASS_SPATIAL_GATE"
  },
  "vqa_inference": {
    "detected_count": 4,
    "confidence_mean": 0.942,
    "detections": [
      { "id": "vessel_01", "class": "patrol_craft", "confidence": 0.96, "bbox": [114, 220, 198, 260] },
      { "id": "vessel_02", "class": "cargo_vessel", "confidence": 0.95, "bbox": [210, 310, 340, 375] },
      { "id": "vessel_03", "class": "tugboat", "confidence": 0.92, "bbox": [365, 410, 405, 435] },
      { "id": "vessel_04", "class": "auxiliary_support", "confidence": 0.94, "bbox": [420, 460, 490, 495] }
    ]
  },
  "explanation": "Four vessels were resolved within the defined basin perimeter. All detected hulls exceed the minimum 6.0m sampling threshold (2x GSD) required for deterministic identification."
}
```

---

### Example 3: Optical + SAR Sensor Fusion (Cloud Penetration)

```json
{
  "optical_input": { "sensor": "Sentinel-2 L2A", "cloud_obstruction": "78.4%" },
  "sar_input": { "sensor": "Sentinel-1 GRD", "polarization": "VV+VH", "orbit": "Descending" },
  "fusion_pipeline": {
    "despeckling": "Lee Sigma Filter (5x5)",
    "radiometric_calibration_db": true,
    "coherence_threshold": 0.65
  },
  "fusion_result": {
    "penetrated_cloud_cover": true,
    "sub_cloud_reflectance_recovered_pct": 91.2,
    "hidden_metallic_signatures_detected": 6,
    "confidence": 0.884
  }
}
```

---

## 🛡️ Scientific Validation Gates (G0–G8)

SatQuery AI guarantees mathematical rigor through an 8-level verification gate:

| Gate | Stage | Verification Criteria |
| :--- | :--- | :--- |
| **G0** | Input Validation | Validates CRS (Coordinate Reference System), GeoTIFF metadata, and bit depth. |
| **G1** | Image Co-Registration | Checks sub-pixel alignment using homography matrix with $<0.5$ px error. |
| **G2** | Resolution Limit (Nyquist) | Rejects queries where target feature size $<2 \times \text{GSD}$. |
| **G3** | Radiometric Quality | Checks cloud masking, shadow detection, and SNR (Signal-to-Noise Ratio). |
| **G4** | Deterministic Math Pass | Executes SSIM, NDVI, NDWI, or SAR amplitude changes without LLM intervention. |
| **G5** | Human Escalation Check | If confidence $<0.75$, flags result for human geospatial analyst review. |
| **G6** | XAI & Attribution | Generates heatmap attributions grounding LLM explanations in raw pixels. |
| **G7** | Cryptographic Audit | Generates tamper-proof SHA-256 hash in Trusted Execution Environment (TEE). |
| **G8** | Final Response Delivery | Dispatches JSON payload and interactive visual layers to frontend dashboard. |

---

## 🚀 Quick Start

### Prerequisites
* Python 3.10+
* Node.js 18+ and npm
* Git

### 1. Clone the Repository
```bash
git clone https://github.com/nbsayan7-cell/SatQuery-AI.git
cd SatQuery-AI
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate       # Windows
source .venv/bin/activate    # Linux / macOS

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
* Interactive Swagger API docs: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
* Access dashboard: `http://localhost:5173`

---

## 📂 Repository Architecture

```text
SatQuery-AI/
├── backend/                         # FastAPI application
│   ├── main.py                      # Application router and lifecycle
│   ├── routes/                      # API endpoints (vqa, change detection, audit, TEE)
│   └── models/                      # Pydantic data schemas and response contracts
├── frontend/                        # React 19 + TypeScript dashboard
│   ├── src/components/              # UI panels (Upload, Query, MapViewer, Results)
│   └── src/cesium/                  # God's Eye 3D Earth Explorer globe
├── pipeline/                        # Deterministic scientific engines
│   ├── preprocess/                  # Co-registration, radiometric normalization
│   ├── change_detect/               # SSIM, ratio diff, morphological filtering
│   └── evidence/                    # Scientific validation gates (G0-G8)
├── docs/                            # Comprehensive engineering and audit specifications
│   ├── assets/                      # UI screenshots and visual artifacts
│   ├── 01-PRD.md                    # Product requirements document
│   ├── 12-TESTING.md                # 66-scenario automated test suite
│   ├── 14-JUDGE-EXPLANATION.md      # SIH judging criteria defense
│   └── SATQUERY-MASTER-AUDIT.md     # Master scientific audit report
├── obsidian_vault/                  # Complete 42-note Obsidian knowledge graph
├── external-plugins/                # 17 multi-agent & design frameworks
└── tests/                           # Unit and integration test suites
```

---

## ⚖️ Built for the Smart India Hackathon (SIH)

SatQuery AI was designed specifically to address Problem Statement requirements with peer-review defensible remote sensing algorithms, zero hallucination tolerance, and production-ready geospatial engineering.