# 🔍 3D Earth Exploration & Historical Timeline Audit (`docs/3D-EARTH-AUDIT.md`)

> **Mandated by Section 4 of MASTER PROMPT — 3D EARTH / GOOGLE-EARTH-STYLE EXPLORATION LAYER**  
> **Project**: SatQuery AI (SIH26167)  
> **Date**: 2026-09-04  
> **Author**: Lead Frontend Architect, Geospatial Visualization & Remote Sensing Engineer  

---

## 1. Executive Summary & Philosophy

SatQuery AI's primary mission is **agentic multimodal remote-sensing image analysis** (ISRO SIH26167). The core capabilities—single-image VQA, captioning, grounding, temporal change analysis, optical/SAR cross-checking, pair validation safety gate, and evidence logging—form the **P0–P4 core**. 

The **3D Earth Exploration Experience** is an **enhancement layer (P5–P7)** designed to provide:
1. Intuitive Google-Earth-style navigation (smooth mouse/trackpad drag, tilt, rotate, zoom, home, compass, coordinate HUD).
2. Live geographic search (geocoding via OpenStreetMap Nominatim with coordinate parsing).
3. Continuous timeline slider with **discrete verified observations** (never pretending daily data exists).
4. Direct integration with **Copernicus Data Space Ecosystem (CDSE) STAC API** for open Sentinel-1 (SAR) and Sentinel-2 (optical) catalogs, with historical Landsat and NASA GIBS fallback.
5. Strict honesty: if no imagery exists for a requested date or location, state it clearly, find the nearest true observation, or present verified offline demo scenes.
6. Seamless bridge back into SatQuery's scientific analysis workspace without disrupting any existing functionality.

---

## 2. Current System Inventory

### 2.1 Current 3D System
- **Component**: `frontend/src/components/GodsEyeExplorer.tsx` (mounted via `App.tsx` header button `🌍 3D Earth Explorer (TEE)`).
- **Engine**: CesiumJS 1.119+ running in client browser (`window.Cesium`).
- **Base Assets**: Local Cesium build located at `frontend/public/cesium` (`Cesium.js`, `Widgets/widgets.css`, `Assets`, `Workers`, `ThirdParty`).
- **Current Imagery**: Keyless Esri World Imagery MapServer (`https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer`) with automatic fallback to OpenStreetMap tiles (`https://tile.openstreetmap.org/`).
- **Atmosphere & Lighting**: Atmospheric glow, sun lighting, and sky atmosphere configured.
- **Entities**: Clean showcase sectors (Dubai, Hanoi, Joplin, Amazon, Aral Sea, Gangotri Glacier) rendered as coordinate pins without aircraft, flight tracks, or watermarks.

### 2.2 Map System (2D)
- **Component**: `frontend/src/components/MapViewer.tsx`.
- **Purpose**: Displays the active uploaded imagery (Optical / SAR / Bitemporal / Fused), provides interactive bounding box (ROI) drawing, and overlays scientific grounding bounding boxes and change detection masks.
- **Relationship**: Must remain the primary focused scientific inspection canvas when an image is actively under analysis.

### 2.3 Imagery & Catalog Backend Services
- **Service**: `backend/services/tee_service.py` (`TeeService`).
- **Routes**: `backend/routes/tee.py` (`GET /api/tee/showcases`, `POST /api/tee/extract`).
- **Data Stores**: Curated offline-safe demo scenes (`SHOWCASE_LOCATIONS`), NASA GIBS open WMTS endpoints, and local storage in `data/uploads/`.
- **Safety Gate**: `backend/services/change_service.py` & `ai/pair_validator.py` strictly enforcing 8-level geographic correspondence before permitting change detection.

### 2.4 Dependencies
- **Frontend**: React 19, TypeScript, Vite 8, Lucide React, CesiumJS (standalone bundle).
- **Backend**: Python 3.14, FastAPI, Uvicorn, httpx (async HTTP), Pillow, NumPy, Pytest.
- **Zero Heavy Extra Dependencies Needed**: Both Copernicus STAC and OSM Nominatim are open REST APIs consumable via `httpx` in Python and typed in TypeScript.

---

## 3. Technology Research & Live API Verification

| Source / Provider | Endpoint | Live Test Status | License / Terms | Authenticated? |
| :--- | :--- | :--- | :--- | :--- |
| **Copernicus Data Space STAC** | `https://stac.dataspace.copernicus.eu/v1/search` | **VERIFIED 200 OK** (Tested with Kolkata BBox & Sentinel-2/Sentinel-1) | Open Access (EU Copernicus Regulation) | **No auth required for STAC metadata & catalog search** |
| **OpenStreetMap Nominatim** | `https://nominatim.openstreetmap.org/search` | **VERIFIED 200 OK** (Tested with "Kolkata", returns coords + bounding box) | Open Database License (ODbL) with User-Agent header | **No auth required** (rate-limited to 1 req/sec) |
| **NASA GIBS WMTS** | `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/...` | **VERIFIED** (Integrated in `tee_service.py`) | Public Domain (US Gov) | **No auth required** |
| **Esri World Imagery** | `https://services.arcgisonline.com/.../MapServer` | **VERIFIED** (Active default Cesium basemap) | Free for visualization with attribution | **Keyless** |
| **Local Showcase Cache** | `data/uploads/` & `data/sample/` | **VERIFIED** (Hanoi, Joplin, Dubai, Kolkata demo packs) | Bundled open data | **100% Offline Capable** |

---

## 4. Keep, Extend, Refactor, Replace Decisions

### KEEP (Protected Core)
- `frontend/src/components/MapViewer.tsx`: Keep untouched as the 2D scientific inspection canvas.
- `backend/services/change_service.py` & `ai/pair_validator.py`: Keep strictly intact. Under no circumstances may temporal comparison from the globe bypass pair validation.
- `ai/specialists/dispatcher.py` & all specialist models: Core analysis pipeline remains untouched.
- `frontend/src/components/QueryPanel.tsx`, `UploadPanel.tsx`, `ResultPanel.tsx`, `EvidencePanel.tsx`: Keep intact and reactive.

### EXTEND
- `backend/services/tee_service.py`:
  - Extend with `search_catalog(bbox, date_range, sensor, cloud_max)` querying Copernicus STAC (`sentinel-2-l2a`, `sentinel-1-grd`).
  - Extend with `geocode(query)` supporting city names ("Kolkata", "Dubai", "Howrah") and coordinate inputs (`22.57, 88.36`).
  - Add fallback to offline showcase scenes when offline or network fails.
- `backend/routes/tee.py`:
  - Add `POST /api/tee/search` (temporal catalog search).
  - Add `GET /api/tee/geocode` (geocoding & location resolution).
- `frontend/src/api/client.ts`:
  - Add `searchCatalog(params)` and `geocodeLocation(query)`.
- `frontend/src/components/GodsEyeExplorer.tsx`:
  - Extend into full Google-Earth-style exploration suite:
    1. Search bar with auto-suggestions & fly-to confirmation.
    2. Google-Earth navigation controls (zoom in/out, pitch/tilt, reset North, reset home).
    3. Bottom temporal timeline (2015–2026) with discrete observation markers.
    4. Observation metadata HUD (Sensor, Date, Platform, Cloud Cover, Modality, License).
    5. Direct "Analyze This View" and "Compare Date A vs Date B" buttons triggering SatQuery.
- Documentation:
  - `docs/07-CODEBASE.md`, `docs/CODEBASE-MAP.md`, `docs/10-CHANGELOG.md`, `docs/18-LICENSES-AND-CREDITS.md`, `docs/20-AI-CHANGE-RECORD.md`.

### REFACTOR
- None required. Clean additive extension preserving all existing architectural contracts.

### REPLACE
- None. No existing functionality or code will be replaced or discarded.
