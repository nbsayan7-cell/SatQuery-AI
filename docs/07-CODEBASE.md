# 📘 SatQuery AI — Comprehensive Codebase Knowledge Model (`07-CODEBASE.md`)

**Version:** 2.0 · **Target Standard:** Research-grade remote-sensing analysis pipeline adhering to NASA/ISRO-inspired scientific processing principles (SIH26167)  
**Companion Documents:** `docs/00-MASTER.md`, `docs/CODEBASE-MAP.md`, `docs/SPEC-PIPELINE-ENGINE.md`, `docs/SPEC-QLORA-TRAINING.md`

---

## 1. System Overview & Architectural Mandate

SatQuery AI is an agentic, multimodal remote-sensing AI system built for Smart India Hackathon Problem Statement SIH26167.

### The Two-Lane System Architecture
As defined in `docs/00-MASTER.md`, the system maintains a strict physical separation between two lanes:
1. **Deterministic Numeric Lane (`pipeline/`)**: The sole numeric source of truth. Handles subpixel phase cross-correlation alignment, Enhanced Lee radar filtering, spectral and SAR index computation (NDVI, NDWI, NDBI, SAVI, VV/VH dB ratios), Change Vector Analysis (CVM), Mahalanobis distance, Otsu/Chi-square thresholding, and polygon area calculations ($m^2$ and ha). **No LLM or VLM computes or mutates numbers in this lane.**
2. **Interpretive Vision-Language Lane (`ai/`)**: Ingests the validated imagery and numeric outputs to produce natural-language explanations, object groundings, and contextual chat. Local LLMs (Ollama Llama 3 / Mistral) are strictly constrained to narrate the numeric facts.

---

## 2. Exhaustive Directory & File-by-File Inventory

### 2.1 Backend Server (`backend/`)
- `backend/main.py`: Primary application entrypoint. Configures FastAPI, CORS middleware, registers all API routes, and serves `/api/health`.
- `backend/config.py`: Environment configurations, file upload size limits (`MAX_UPLOAD_MB`), confidence escalation thresholds, and storage paths (`UPLOAD_DIR`).
- `backend/routes/images.py`: Handles `POST /api/upload` (accepts PNG, JPEG, GeoTIFF; stores image and returns image ID + metadata) and `GET /api/images/{image_id}`.
- `backend/routes/query.py`: Handles `POST /api/query`. Validates requests and calls `QueryService` for natural language VQA, captioning, or grounding.
- `backend/routes/caption.py`: Handles `POST /api/caption`. Direct endpoint for high-level scene description and land-cover estimation.
- `backend/routes/region.py`: Handles `POST /api/analyze/region`. Implements Phase 1A Region-of-Interest (ROI) spatial cropping, Lanczos upsampling (<256px), and coordinate re-projection.
- `backend/routes/change.py` & `backend/routes/compare.py`: Handles `POST /api/analyze/change`. Connects with `ChangeService` and `ImagePairValidator` to perform multi-region change segmentation and taxonomy classification.
- `backend/routes/escalate.py`: Handles `POST /api/analyze/escalate`. Triggers the multi-stage confidence escalation engine (2x2 tiling + Test-Time Augmentation).
- `backend/routes/pair_validation.py`: Handles `POST /api/validate/pair`. Evaluates pair compatibility across 8 levels of truth to hard-block invalid comparisons (e.g., Kolkata vs Delhi).
- `backend/routes/fusion.py`: Handles `POST /api/fuse`. Fuses Optical multispectral albedo with SAR microwave backscatter.
- `backend/routes/chat.py`: Handles `POST /api/chat`. Conversational interface grounded strictly in upstream observations.
- `backend/routes/specialists.py`: Handles `GET /api/specialists`. Lists all available remote-sensing specialist models.
- `backend/routes/audit.py`: Handles `GET /api/audit`. Returns the immutable chronological execution trace.
- `backend/routes/benchmark.py`: Handles `GET /api/benchmark/20`. Live execution endpoint for the 20 NASA/ISRO benchmark queries.
- `backend/routes/tee.py`: Handles God's Eye 3D Earth Explorer routes (`POST /api/tee/search`, `GET /api/tee/geocode`, `POST /api/tee/extract`, `GET /api/tee/showcases`).
- `backend/services/image_service.py`: Image storage, format validation, GeoTIFF band extraction, and caching.
- `backend/services/query_service.py`: Query orchestration and model dispatching.
- `backend/services/change_service.py`: High-level service coordinating change segmentation and validation gating.
- `backend/services/region_service.py`: ROI cropping, coordinate offset projection, and specialist routing.
- `backend/services/audit_service.py`: Persistent audit logging (`data/audit_log.json`) with timestamps and confidence records.
- `backend/services/tee_service.py`: Integrates Copernicus Data Space Ecosystem (CDSE) STAC API, OSM Nominatim geocoding, and historical tile retrieval.

### 2.2 Intelligence & AI Engine (`ai/`)
- `ai/orchestrator.py`: Classifies incoming user prompts and selects appropriate execution pipelines.
- `ai/specialists/dispatcher.py`: Registry for domain-specific remote-sensing models (GeoChat, DescribeEarth, UniRS, DOFA, Open-CD).
- `ai/pair_validator.py`: The non-negotiable scientific validation gate. Computes geographic coordinates, IoU, center distance, spatial cross-correlation, and feature inliers. Blocks non-overlapping pairs.
- `ai/observation.py`: Canonical Pydantic schema enforcing structured observation contracts (bounding boxes, class labels, measurements).
- `ai/ollama_client.py`: Local LLM interface with strict system instructions prohibiting fabrication of coordinates, dates, or numerical values.
- `ai/preprocessing.py`: Spatial cropping, Lanczos interpolation for low-resolution sub-patches, and normalization.
- `ai/vision_utils.py`: Enhanced Lee filtering, SAR log-ratio, flood-fill region clustering, change taxonomy classification, and xView2 disaster tiers.
- `ai/escalation.py`: Coordinates 2x2 spatial partitioning, Test-Time Augmentation (flips), and optical+SAR cross-verification.
- `ai/models/vqa.py`: Specialist model wrapper for remote-sensing question answering.
- `ai/models/captioning.py`: Specialist model wrapper for scene description.
- `ai/models/change_detection.py`: Fine-grained multi-part change detection model.
- `ai/models/fusion.py`: Multimodal Optical + SAR fusion model.

### 2.3 Deterministic Pipeline Engine (`pipeline/`)
- `pipeline/preprocess/coregistration.py`: Phase Cross-Correlation subpixel alignment using 2D FFT and parabolic refinement; computes RMSE in ground meters.
- `pipeline/preprocess/despeckle.py`: Enhanced Lee filter implemented via 2D summed-area tables (integral images).
- `pipeline/feature_extract/spectral_indices.py`: Computes NDVI, NDWI, NDBI, and SAVI with numerical bounds $[-1.0, 1.0]$.
- `pipeline/feature_extract/sar_features.py`: Computes calibrated sigma0 (dB), cross-pol ratio (VH/VV), and polarimetric differences.
- `pipeline/feature_extract/texture.py`: Computes sliding-window spatial variance and entropy proxy.
- `pipeline/change_detect/metrics.py`: Computes band differences, Euclidean Change Vector Magnitude (CVM), percent change, and SAR log-ratio.
- `pipeline/change_detect/statistical.py`: Multivariate Mahalanobis distance with covariance estimation over pseudoinvariant pixels, and Z-score normalized differences.
- `pipeline/postprocess/thresholding.py`: Otsu inter-class variance minimization with maximal variance plateau averaging, and Chi-Square significance thresholds.
- `pipeline/postprocess/area_calc.py`: Planar and spherical geodesic surface area calculations in $m^2$ and hectares.
- `pipeline/postprocess/vectorization.py`: Converts raster change masks into GeoJSON FeatureCollections with minimum mapping unit filtering.
- `pipeline/evidence/uncertainty.py`: First-order analytical Taylor error propagation on CVM and perimeter-based area boundary uncertainty.
- `pipeline/evidence/assembler.py`: Assembles final analysis JSON and computes SHA-256 cryptographic provenance.

### 2.4 QLoRA Fine-Tuning & Data-Prep (`training/`)
- `training/data_prep/convert_rsvqa.py`: Converts optical presence and counting questions into standard conversation JSONL format.
- `training/data_prep/convert_vrsbench.py`: Formats high-resolution satellite scene captions and object bounding boxes normalized to $[0, 1000]$.
- `training/data_prep/convert_cdvqa.py`: Formats bi-temporal change reasoning triplets with dual `<image>` tags.
- `training/configs/qlora_config.py`: BitsAndBytes 4-bit NormalFloat (`nf4`) and LoRA adapter configurations budgeted for RTX 4060 (<6.5 GB peak VRAM).

### 2.5 Frontend SPA (`frontend/`)
- `frontend/src/main.tsx`: React DOM root mounting and application startup.
- `frontend/src/App.tsx`: Central dashboard containing layout grids, state management, and modal controllers.
- `frontend/src/api/client.ts`: Typed HTTP client communicating with backend endpoints.
- `frontend/src/components/UploadPanel.tsx`: Multi-channel drag-and-drop file uploader (Baseline T0, Current T1, SAR T2).
- `frontend/src/components/QueryPanel.tsx`: Natural language prompt input, task selector, escalation toggle, and ROI mode trigger.
- `frontend/src/components/MapViewer.tsx`: Split dual-view image viewer, interactive drag-and-drop ROI drawing box, and colored bounding box overlays.
- `frontend/src/components/ResultPanel.tsx`: Displays natural language answer, confidence score meter, model badge, and ranked Changed Sectors Inventory table.
- `frontend/src/components/EvidencePanel.tsx`: Renders step-by-step reasoning chain with individual probabilistic confidence bars.
- `frontend/src/components/GodsEyeExplorer.tsx`: Full-screen 3D Earth Explorer (CesiumJS) with OSM Nominatim search, 10-year Copernicus STAC timeline, and sector extraction.

---

## 3. Automated Test Suites & Verification

All automated tests in `backend/tests/` verify system health:
1. `test_pipeline_engine.py` (8/8 PASSED): Subpixel coregistration, spectral boundaries, SAR backscatter, CVM, Mahalanobis distance, Otsu thresholding, area calculation, uncertainty propagation, and SHA-256 hashing.
2. `test_training_pipeline.py` (4/4 PASSED): RSVQA, VRSBench grounding, CDVQA formatting, and 8GB VRAM configuration constraints.
3. `test_benchmark_20.py` (9/9 PASSED): Full automated execution of the 20 NASA/ISRO benchmark queries.
4. `test_pair_validator.py` (8/8 PASSED): 8-level validation gate and mismatch blocking.
5. `test_change.py` & `test_compare.py` (6/6 PASSED): Multi-region change segmentation and taxonomy classification.
6. `test_escalate.py` (3/3 PASSED): Confidence escalation, 2x2 tiling, and Test-Time Augmentation.
7. `test_fusion.py` (2/2 PASSED): Multimodal optical + SAR cross-sensor fusion.
8. `test_tee.py` (6/6 PASSED): 3D Earth Explorer geocoding, showcase extraction, and STAC search.
9. `test_query.py`, `test_caption.py`, `test_region.py`, `test_specialists.py`, `test_upload.py`, `test_audit.py`, `test_health.py` (17/17 PASSED).

**Total Test Count:** **63/63 Tests Passing (100% Pass Rate)**.
