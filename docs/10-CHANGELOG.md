# 📜 SatQuery AI — Changelog

> **Purpose:** Every meaningful change, newest first. Updated after every completed
> feature (RULE 010). Format inspired by Keep a Changelog.

## [Unreleased]

## 2026-09-04 — Scientific Pipeline Refinements & Rigorous Error Propagation
### Added & Fixed
- **CVM Feature Normalization (`pipeline/change_detect/metrics.py`)**: Added $z$-score feature standardization ($z_{t,d} = \frac{x_{t,d} - \mu_d}{\sigma_d + \epsilon}$) prior to differencing, preventing high-magnitude channels (e.g. NIR counts $\sim 3000$) from drowning out physical bands (e.g. Red reflectance $\sim 0.2$, SAR backscatter $\sim -12\,\text{dB}$).
- **Affine Jacobian Determinant Area (`pipeline/postprocess/area_calc.py`)**: Derived ground surface area from the Affine Geotransform Jacobian determinant $A_p = |\det(J)| = |a\cdot e - b\cdot d|$ for planar projected CRS (UTM) and ellipsoidal geodesic integration for EPSG:4326. Added explicit boundary perimeter uncertainty bounds $\delta_{\text{area}} = 4\sqrt{N_{\text{changed}}} \cdot \mathrm{RMSE}_{\mathrm{reg}} \cdot A_p$ and 95% confidence intervals, dropping naive cosine approximations and "exact area" claims.
- **Decomposed Multi-Source Uncertainty (`pipeline/evidence/uncertainty.py`)**: Implemented `compute_multi_source_uncertainty()` reporting decomposed confidence scores across five distinct physical axes: Data Quality, Registration, Change Detection, Semantic Classification, and Overall Evidence Quality.
- **Scientific Tone & Scope Calibration**: Replaced overclaiming "NASA/ISRO-grade" language with "NASA/ISRO-inspired scientific processing principles" and "Research-grade remote-sensing pipeline designed around reproducibility, validation, and uncertainty" across `00-MASTER.md`, `07-CODEBASE.md`, `SPEC-PIPELINE-ENGINE.md`, and `SPEC-20-BENCHMARK-TESTS.md`.
- **Unit & Integration Test Coverage**: Added 3 new dedicated unit tests (`test_cvm_feature_standardization`, `test_area_jacobian_determinant_and_bounds`, `test_decomposed_multi_source_uncertainty`) in `backend/tests/test_pipeline_engine.py`. Full test suite: 66/66 passed cleanly (100% pass rate).
### Files Changed
- `pipeline/change_detect/metrics.py`
- `pipeline/postprocess/area_calc.py`
- `pipeline/evidence/uncertainty.py`
- `backend/tests/test_pipeline_engine.py`
- `docs/SPEC-PIPELINE-ENGINE.md`
- `docs/00-MASTER.md`
- `docs/07-CODEBASE.md`
- `docs/SPEC-20-BENCHMARK-TESTS.md`
- `docs/08-MEMORY.md`
- `docs/10-CHANGELOG.md`

## 2026-09-04 — Comprehensive Codebase Audit & System Map Synchronization
### Added
- Synchronized `docs/07-CODEBASE.md` with exhaustive file-by-file explanations, architecture diagrams, data flows, and ownership boundaries across `backend/`, `ai/`, `pipeline/`, `training/`, and `frontend/`.
- Updated `docs/CODEBASE-MAP.md` with machine-readable route matrix (17 endpoints), component hierarchies, deterministic engine module graph, and dependency execution call chains.
- Verified test health across all modules: 63 automated tests passing (100% pass rate).
### Files Changed
- `docs/07-CODEBASE.md`
- `docs/CODEBASE-MAP.md`
- `docs/10-CHANGELOG.md`
- `docs/08-MEMORY.md`
### Added
- Specification document `docs/SPEC-20-BENCHMARK-TESTS.md` formalizing all 20 prioritized test cases across single-image VQA, scene captioning, visual grounding, bi-temporal change detection, optical+SAR cross-modal fusion, and multi-step agent orchestration.
- Automated evaluation script `scripts/run_benchmark_20.py` executing all 20 benchmark queries and exporting structured JSON audit reports to `docs/BENCHMARK-20-RESULTS.json`.
- Pytest suite in `backend/tests/test_benchmark_20.py` verifying full test pass across all 20 cases and key query individual validations (9/9 passed).
### Files Changed
- `docs/SPEC-20-BENCHMARK-TESTS.md`
- `scripts/run_benchmark_20.py`
- `backend/tests/test_benchmark_20.py`
- `docs/BENCHMARK-20-RESULTS.json`
- `docs/10-CHANGELOG.md`
- `docs/08-MEMORY.md`
### Added
- Implemented `pipeline/preprocess/coregistration.py`: subpixel Phase Cross-Correlation registration using 2D FFT and parabolic peak refinement.
- Implemented `pipeline/preprocess/despeckle.py`: Enhanced Lee filter using sliding box filter integral image.
- Implemented `pipeline/feature_extract/spectral_indices.py`: normalized NDVI, NDWI, NDBI, and SAVI with floating-point guards.
- Implemented `pipeline/feature_extract/sar_features.py`: dual-pol Sentinel-1 GRD sigma-naught (dB), cross-pol ratio, and differences.
- Implemented `pipeline/feature_extract/texture.py`: local spatial variance and entropy proxy.
- Implemented `pipeline/change_detect/metrics.py`: band difference, Euclidean Change Vector Magnitude (CVM), percent change, normalized change, and SAR log-ratio.
- Implemented `pipeline/change_detect/statistical.py`: multivariate Mahalanobis distance with covariance estimation from pseudoinvariant pixels, and Z-score normalized differences.
- Implemented `pipeline/postprocess/thresholding.py`: Otsu inter-class variance minimization with plateau midpoint selection, and Chi-Square significance thresholds.
- Implemented `pipeline/postprocess/area_calc.py`: geodesic and projected surface area calculations in $m^2$ and hectares.
- Implemented `pipeline/postprocess/vectorization.py`: raster connected component labeling and polygonization to GeoJSON FeatureCollections.
- Implemented `pipeline/evidence/uncertainty.py`: first-order analytical Taylor expansion on CVM and perimeter-based area boundary uncertainty.
- Implemented `pipeline/evidence/assembler.py`: schema assembly with SHA-256 cryptographic provenance.
- Implemented `training/data_prep/convert_rsvqa.py`, `convert_vrsbench.py`, and `convert_cdvqa.py`: standard instruction conversation parsers.
- Implemented `training/configs/qlora_config.py`: BitsAndBytes NF4 4-bit config and LoRA rank configuration budgeted for RTX 4060 (<6.5 GB peak VRAM).
- Test suites in `backend/tests/test_pipeline_engine.py` (8/8 passed) and `backend/tests/test_training_pipeline.py` (4/4 passed).
### Files Changed
- `pipeline/preprocess/coregistration.py`
- `pipeline/preprocess/despeckle.py`
- `pipeline/feature_extract/spectral_indices.py`
- `pipeline/feature_extract/sar_features.py`
- `pipeline/feature_extract/texture.py`
- `pipeline/change_detect/metrics.py`
- `pipeline/change_detect/statistical.py`
- `pipeline/postprocess/thresholding.py`
- `pipeline/postprocess/area_calc.py`
- `pipeline/postprocess/vectorization.py`
- `pipeline/evidence/uncertainty.py`
- `pipeline/evidence/assembler.py`
- `training/data_prep/convert_rsvqa.py`
- `training/data_prep/convert_vrsbench.py`
- `training/data_prep/convert_cdvqa.py`
- `training/configs/qlora_config.py`
- `backend/tests/test_pipeline_engine.py`
- `backend/tests/test_training_pipeline.py`
- `docs/10-CHANGELOG.md`
- `docs/08-MEMORY.md`


### Added
- Google-Earth-grade 3D Earth exploration layer with full camera navigation cluster: Reset North (🧭 N), Zoom In (+), Zoom Out (−), and Fly Home (🏠).
- Live geographic search bar supporting OpenStreetMap Nominatim and direct coordinate pairs (`lat, lon`) with smooth camera fly-to animations.
- 10-Year Continuous Earth Observation Timeline (2016–2026) powered by live Copernicus Data Space Ecosystem (CDSE) STAC API (`sentinel-2-l2a`, `sentinel-1-grd`) and USGS Landsat.
- Discrete verified observation strip displaying authentic acquisition scenes, modality, cloud cover percentage, polarizations, and ground resolution.
- Honest satellite availability gate: clearly informs the user when no exact imagery exists for a requested date and indicates the nearest authentic observation (never faking daily coverage).
- Direct SatQuery integration: "🚀 ANALYZE THIS VIEW IN SATQUERY" and "⚡ COMPARE IN SATQUERY" for instantaneous hand-off to the main analysis workspace.
- Backend geocoding (`GET /api/tee/geocode`) and STAC catalog discovery (`POST /api/tee/search`).
### Files Changed
- `frontend/src/components/GodsEyeExplorer.tsx`
- `frontend/src/App.tsx`
- `frontend/src/api/client.ts`
- `backend/services/tee_service.py`
- `backend/routes/tee.py`
- `backend/tests/test_tee.py`
- `docs/3D-EARTH-AUDIT.md`
- `docs/10-CHANGELOG.md`
- `docs/20-AI-CHANGE-RECORD.md`

## 2026-09-04 — SQ-040 God's Eye 3D Earth Explorer (Cleaned Globe)
### Added
- Full-screen God's Eye 3D Earth Explorer (`GodsEyeExplorer.tsx`) featuring realistic atmospheric glow, tactical rotation telemetry, coordinate crosshairs, and curated analysis sectors (Hanoi, Joplin, Dubai, Amazon, Aral Sea, Gangotri Glacier).
- Complete removal of aircraft models, flight markers, tracking paths, and cluttered text banners.
- Direct scene extraction into SatQuery Baseline (T0) from open public domain providers.
### Files Changed
- `frontend/src/components/GodsEyeExplorer.tsx`
- `frontend/src/App.tsx`
- `frontend/src/api/client.ts`

## 2026-09-04 — SQ-039 Image Pair Compatibility & Validation Engine
### Added
- Hierarchical geospatial and feature validation engine (`ai/pair_validator.py`) enforcing non-negotiable scientific safety gates before running change detection or multimodal fusion.
- Evaluates 8 levels of truth: metadata, geolocation coordinates, CRS, bounding-box IoU, center distance, spatial cross-correlation, and modality compatibility.
- Hard-blocks non-corresponding image pairs (e.g. Kolkata vs Delhi) with zero hallucination and explicit scientific explanations.
- API route `POST /api/validate/pair` in `backend/routes/pair_validation.py`.
- Automated test suite in `backend/tests/test_pair_validator.py` (8/8 tests passing).
- Blocked-analysis UI banner and confidence breakdown in `ResultPanel.tsx`.
### Files Changed
- `ai/pair_validator.py`
- `backend/routes/pair_validation.py`
- `backend/services/change_service.py`
- `backend/main.py`
- `backend/tests/test_pair_validator.py`
- `frontend/src/components/ResultPanel.tsx`
- `frontend/src/api/client.ts`

### Added
- Interactive 3D Earth Explorer modal (`GlobeModal.tsx`) with global showcase sectors (Hanoi, Joplin, Dubai).
- Historical multi-date imagery extraction engine (`TeeService` & `POST /api/tee/extract`) accessing open licensed providers (NASA GIBS / USGS Open STAC) and offline showcase cache packs.
- Direct scene loading into Baseline (T0) without illegal scraping (RULE 013).
- Automated test suite in `backend/tests/test_tee.py` (3 tests passing).
### Files Changed
- `backend/services/tee_service.py`
- `backend/routes/tee.py`
- `backend/main.py`
- `backend/tests/test_tee.py`
- `frontend/src/api/client.ts`
- `frontend/src/components/GlobeModal.tsx`
- `frontend/src/App.tsx`
### Ticket
- SQ-038 (Phase 1D)

## 2026-09-04 — SQ-037 High-Precision Escalation Pipeline
### Added
- Multi-stage confidence escalation engine (`ai/escalation.py`) with spatial 2x2 tiling, test-time augmentation (TTA), optical+SAR radar cross-checking, and Ollama structured reconciliation.
- Backend endpoint `POST /api/analyze/escalate`.
- Empirical benchmark script (`scripts/eval_escalation.py`) generating verified metrics in `docs/BENCHMARK-RESULTS.md` without fabricating numbers (RULE 005).
- Frontend escalation trigger in `QueryPanel.tsx` with dedicated UI indicators.
- Automated test suite in `backend/tests/test_escalate.py` (3 tests passing).
### Files Changed
- `backend/config.py`
- `ai/escalation.py`
- `backend/routes/escalate.py`
- `backend/main.py`
- `backend/tests/test_escalate.py`
- `scripts/eval_escalation.py`
- `docs/BENCHMARK-RESULTS.md`
- `frontend/src/api/client.ts`
- `frontend/src/components/QueryPanel.tsx`
### Ticket
- SQ-037 (Phase 1C)

### Added
- Multi-region change segmentation (`VisionUtils.segment_fine_grained_change`) with flood-fill clustering and taxonomy classification.
- Per-region metadata: region ID (`CR-XX`), change type (New Built-up, Vegetation Loss, Water Dynamic, Structural Damage), area in pixels and $m^2$, and confidence.
- Backend service `ChangeService` and route `POST /api/analyze/change` supporting bi-temporal and multi-temporal timeline progression.
- Frontend ranked Changed Sectors inventory table and multi-temporal trajectory in `ResultPanel.tsx`.
- Comprehensive test suite in `backend/tests/test_change.py` (5 tests covering multi-region extraction, mismatch rejection, stability suppression, multi-temporal timeline, 404).
### Files Changed
- `ai/vision_utils.py`
- `ai/models/change_detection.py`
- `backend/services/change_service.py`
- `backend/routes/change.py`
- `backend/routes/compare.py`
- `backend/main.py`
- `backend/tests/test_change.py`
- `frontend/src/api/client.ts`
- `frontend/src/components/ResultPanel.tsx`
### Tests
- `backend/tests/test_change.py` (5/5 passed)
- Full backend suite (25/25 passed)
- Full browser verification of 4 distinct changed sectors
### Ticket
- SQ-036 (Phase 1B)

### Added
- Interactive ROI drawing tool on MapViewer allowing drag-and-drop sub-region selection.
- Region-of-Interest processing engine (`ai/preprocessing.py`) with Lanczos upsampling for fine details (<256px) and spatial coordinate re-projection.
- Backend endpoint `POST /api/analyze/region` (`backend/routes/region.py` and `backend/services/region_service.py`).
- Frontend ROI precision mode in `QueryPanel.tsx` with dedicated targeted query triggers.
- Unit and integration tests in `backend/tests/test_region.py`.
### Files Changed
- `ai/preprocessing.py`
- `backend/routes/region.py`
- `backend/services/region_service.py`
- `backend/main.py`
- `backend/tests/test_region.py`
- `frontend/src/api/client.ts`
- `frontend/src/components/MapViewer.tsx`
- `frontend/src/components/QueryPanel.tsx`
- `frontend/src/App.tsx`
### Tests
- `backend/tests/test_region.py` (3 passed: bbox, polygon, 404 handling)
- Full backend suite (20 passed)
- Full browser interactive verification with screenshot recording
### Ticket
- SQ-035 (Phase 1A)

## 2026-09-03
### Added
- Image upload component (UploadPanel.tsx)
- Image validation + format handling (image_service.py)
### Changed
- API response structure for /api/upload to include metadata
### Fixed
- Large image upload timeout (raised limit + streaming read)
### Files changed
- frontend/src/components/UploadPanel.tsx
- backend/routes/images.py
- backend/services/image_service.py
- backend/config.py
### Tests
- JPEG ✓ · PNG ✓ · invalid file ✓ · oversized file ✓
### Ticket
- SQ-001

## 2026-09-02
### Added
- Project scaffolding (Phases 0–2), FastAPI + Vite skeleton, /api/health
### Ticket
- (setup)