# 🗺️ CODEBASE MAP (Machine-Oriented Reference)

> Companion to `07-CODEBASE.md` and `docs/00-MASTER.md`. Structured for fast AI navigation, auditability, and automated tool dispatch (RULE 009).

---

## 1. PRIMARY SYSTEM ENTRYPOINTS

- **Frontend SPA**: `frontend/src/main.tsx` (React 19 + TypeScript + Vite)
- **Backend Server Core**: `backend/main.py` (FastAPI + Uvicorn)
- **Deterministic Pipeline Engine**: `pipeline/` (Subpixel Coregistration, Spectral/SAR Indices, CVM, Mahalanobis, Area $\text{m}^2$)
- **Agent Orchestrator**: `ai/orchestrator.py` & `ai/specialists/dispatcher.py`
- **Scientific Validation Gate**: `ai/pair_validator.py`

---

## 2. API ROUTES & HANDLER MATRIX

| HTTP Method & Endpoint | Route Handler File | Service / Engine Layer | Primary Purpose |
|---|---|---|---|
| `POST /api/upload` | `backend/routes/images.py` | `backend/services/image_service.py` | Validates & stores PNG/JPEG/TIFF; extracts spatial metadata |
| `POST /api/query` | `backend/routes/query.py` | `backend/services/query_service.py` | Dispatches NL queries to VQA, Captioning, or Grounding |
| `POST /api/caption` | `backend/routes/caption.py` | `ai/models/captioning.py` | Synthesizes scene descriptions & land-cover categories |
| `POST /api/analyze/region` | `backend/routes/region.py` | `backend/services/region_service.py` | High-precision ROI analysis, Lanczos upsampling (<256px) |
| `POST /api/analyze/change` | `backend/routes/change.py` | `backend/services/change_service.py` | Bi-temporal multi-part change segmentation & taxonomy |
| `POST /api/compare` | `backend/routes/compare.py` | `backend/services/change_service.py` | Aliased comparison route with validation gate |
| `POST /api/analyze/escalate` | `backend/routes/escalate.py` | `ai/escalation.py` | 2x2 spatial tiling + Test-Time Augmentation (TTA) |
| `POST /api/validate/pair` | `backend/routes/pair_validation.py` | `ai/pair_validator.py` | 8-level scientific validation gate; blocks invalid comparisons |
| `POST /api/fuse` | `backend/routes/fusion.py` | `ai/models/fusion.py` | Optical albedo + SAR microwave cross-modal fusion |
| `POST /api/chat` | `backend/routes/chat.py` | `ai/ollama_client.py` | Contextual interactive chat grounded in evidence |
| `GET /api/specialists` | `backend/routes/specialists.py` | `ai/specialists/dispatcher.py` | Lists registered remote-sensing models |
| `GET /api/audit` | `backend/routes/audit.py` | `backend/services/audit_service.py` | Retrieves immutable audit trail logs |
| `GET /api/benchmark/20` | `backend/routes/benchmark.py` | `scripts/run_benchmark_20.py` | Live execution of 20 NASA/ISRO benchmark test cases |
| `POST /api/tee/search` | `backend/routes/tee.py` | `backend/services/tee_service.py` | Live Copernicus STAC scene discovery (2016–2026) |
| `GET /api/tee/geocode` | `backend/routes/tee.py` | `backend/services/tee_service.py` | Nominatim place-name & coordinate geocoding |
| `POST /api/tee/extract` | `backend/routes/tee.py` | `backend/services/tee_service.py` | Extracts dated historical scenes into SatQuery Baseline |
| `GET /api/health` | `backend/main.py` | System Core | Health status check (`{"status": "ok"}`) |

---

## 3. COMPONENT & UI HIERARCHY

```text
App (frontend/src/App.tsx)
 ├── Header
 │    ├── Status Indicator Pill (Online / 54 Tests Verified)
 │    ├── Preset Buttons (Optical Baseline, Optical+SAR, Change T0+T1)
 │    └── GOD'S EYE 3D Button (Launches Full-Screen Explorer)
 ├── Main Grid Workspace
 │    ├── UploadPanel (Multi-channel drag-and-drop: Baseline T0, Current T1, SAR T2)
 │    ├── QueryPanel (Natural language input, Task selector, Escalation toggle, ROI trigger)
 │    ├── MapViewer (Split dual-view, interactive ROI drawing, colored bbox overlays)
 │    ├── ResultPanel (Answer display, Confidence meter, Changed Sectors Inventory)
 │    └── EvidencePanel (Step-by-step reasoning chain, statistical parameters)
 ├── AuditTrailModal (Historical execution queries, model fingerprints, timestamps)
 └── GodsEyeExplorer (Cesium 3D Globe, OSM Nominatim search, 10-Yr STAC timeline)
```

---

## 4. DETERMINISTIC ENGINE MODULE GRAPH (`pipeline/`)

```text
                   ┌──────────────────────────────────────────────┐
                   │               pipeline/                      │
                   └──────────────────────┬───────────────────────┘
                                          │
         ┌──────────────────┬─────────────┴────────────┬──────────────────┐
         ▼                  ▼                          ▼                  ▼
   preprocess/       feature_extract/           change_detect/       postprocess/
   ├── coregistration  ├── spectral_indices       ├── metrics         ├── thresholding
   │   (Phase-corr)    │   (NDVI/NDWI/NDBI/SAVI)  │   (CVM, LogRatio) │   (Otsu/Chi-sq)
   └── despeckle       ├── sar_features           └── statistical     ├── area_calc
       (Enhanced Lee)  │   (VV/VH dB, ratios)         (Mahalanobis)   │   (m² and ha)
                       └── texture                                    └── vectorization
                           (GLCM variance)                                (GeoJSON)
                                          │
                                          ▼
                                   evidence/assembler
                                   (SHA-256 Provenance)
```

---

## 5. DEPENDENCY & EXECUTION CALL CHAINS

1. **VQA Query Chain**:
   `QueryPanel` ➔ `client.executeQuery()` ➔ `POST /api/query` ➔ `query_service.py` ➔ `orchestrator.py` ➔ `vqa.py` ➔ `ollama_client.py` ➔ `audit_service.py` ➔ `ResultPanel`.
2. **Bi-Temporal Change Chain**:
   `UploadPanel (T0, T1)` ➔ `client.analyzeChange()` ➔ `POST /api/analyze/change` ➔ `pair_validator.py` (Validation Gate) ➔ `change_service.py` ➔ `pipeline/change_detect` ➔ `MapViewer` & `ResultPanel (Inventory)`.
3. **Escalation Chain**:
   `ResultPanel (Escalate)` ➔ `POST /api/analyze/escalate` ➔ `ai/escalation.py` ➔ 2x2 Tiling + TTA Augmentation ➔ `ResultPanel (Upgraded to VERIFIED)`.
4. **God's Eye 3D Handoff Chain**:
   `GodsEyeExplorer` (Timeline / Location) ➔ `POST /api/tee/extract` ➔ `image_service.py` ➔ Loaded directly into `Baseline (T0)`.
