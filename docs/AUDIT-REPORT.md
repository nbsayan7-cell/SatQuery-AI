# 🛰️ SatQuery AI — Comprehensive Codebase Audit & Gap Report (Phase 0)

> **Document:** `docs/AUDIT-REPORT.md`  
> **Author:** Senior Full-Stack & Remote-Sensing ML Engineering Agent  
> **Status:** Phase 0 Deliverable — Complete. Awaiting User Approval before Phase 1.  
> **Mandatory Constraint:** Governed strictly by `docs/03-RULES.md` (RULES 001–015).  

---

## 1. Confirmation of Loaded Governance Documents

The following foundation documents have been loaded and read in full:
1. `docs/03-RULES.md` — Agent & Team Constitution (Rules 001 to 015, including non-negotiable prohibitions on unmeasured accuracy claims, unauthorized dependency additions, and scope creep).
2. `docs/08-MEMORY.md` — Active development context and state tracking.
3. `docs/07-CODEBASE.md` — Machine-oriented codebase knowledge model, entry points, and component status classifications.
4. `docs/02-ARCHITECTURE.md` — Three-tier architecture (Presentation, Application, Intelligence) and Section 15 Temporal Earth Explorer specifications.
5. `docs/06-FEATURE-TICKETS.md` — Complete feature backlog (SQ-001 through SQ-034).
6. `docs/01-PRD.md` — Product Requirements Document, specifically Section 10 (SIH Compliance Matrix R1–R8).
7. `docs/16-DATASETS.md` — Dataset knowledge base and license mapping.
8. `docs/18-LICENSES-AND-CREDITS.md` — Third-party asset licensing inventory.
9. `docs/17-MODEL-CARD.md` — Model card templates and accuracy reporting criteria.
10. `docs/12-TESTING.md` — SIH test matrix and known hackathon scope limitations.

---

## 2. Complete Repository Tree Walk & Inventory

Every folder and source file in the repository has been analyzed from content:

### 2.1 Backend (`backend/`)
| Path | Type | Purpose | Key Functions / Classes | Call Graph (Imports / Imported By) | Status | Risk Flags |
|---|---|---|---|---|---|---|
| `backend/config.py` | config | Application constants, path resolution, upload limits | `BASE_DIR`, `DATA_DIR`, `UPLOAD_DIR`, `MAX_UPLOAD_BYTES`, `ALLOWED_EXTENSIONS` | Imports `os`, `pathlib`. Imported by `image_service.py`, `images.py`, `query_service.py`, `compare.py`, `fusion.py`, `chat.py`, `specialists.py` | Working | None. Upload limits set to 50MB. |
| `backend/main.py` | backend | FastAPI application entry point, CORS middleware, router registration | `app`, `health_check()` | Imports FastAPI, routes (`images`, `query`, `audit`, `caption`, `compare`, `fusion`, `chat`, `specialists`). Imported by test suite | Working | Wildcard CORS enabled for development (`allow_origins=["*"]`). |
| `backend/requirements.txt` | config | Backend Python package declarations | None | Declares `fastapi`, `uvicorn`, `python-multipart`, `pydantic`, `pytest`, `httpx` | Working | Minimal set; heavy ML libs (torch, gdal) not listed. |
| `backend/routes/images.py` | backend | Image upload and raw image file serving endpoint | `upload_image()`, `get_image()` | Imports `ImageService`, `UPLOAD_DIR`. Registered in `main.py` | Working | Direct file streaming from disk via `FileResponse`. |
| `backend/routes/query.py` | backend | Single-image VQA query route | `execute_query()`, `QueryRequest` | Imports `QueryService`, `AuditService`. Registered in `main.py` | Working | Fully hooked to audit trail logging. |
| `backend/routes/caption.py` | backend | Scene description / captioning route | `generate_caption()`, `CaptionPayload` | Imports `CaptioningModel`, `AuditService`, `UPLOAD_DIR`. Registered in `main.py` | Working | Tested in `test_caption.py`. |
| `backend/routes/compare.py` | backend | Bi-temporal image change detection route | `compare_images()`, `ComparePayload` | Imports `ChangeDetectionModel`, `AuditService`, `UPLOAD_DIR`. Registered in `main.py` | Working | Tested in `test_compare.py`. |
| `backend/routes/fusion.py` | backend | Optical + SAR cross-modal fusion route | `fuse_images()`, `FusePayload` | Imports `FusionModel`, `AuditService`, `UPLOAD_DIR`. Registered in `main.py` | Working | Tested in `test_fusion.py`. |
| `backend/routes/chat.py` | backend | Conversational remote-sensing copilot route | `chat_interaction()`, `ChatMessage`, `ChatRequest` | Imports `OllamaClient`, `VisionUtils`, `UPLOAD_DIR`. Registered in `main.py` | Working | Fallback knowledge engine active when Ollama is offline. |
| `backend/routes/specialists.py` | backend | Specialized model registry listing and dynamic dispatch route | `list_specialists()`, `dispatch_specialist()`, `DispatchRequest` | Imports `SpecialistDispatcher`, `AuditService`, `UPLOAD_DIR`. Registered in `main.py` | Working | Hooks into 9 remote sensing specialists. |
| `backend/routes/audit.py` | backend | Audit trail retrieval route | `fetch_audit_trail()` | Imports `AuditService`. Registered in `main.py` | Working | Returns up to 50 logged transactions. |
| `backend/services/image_service.py` | backend | File storage, extension validation, PIL metadata extraction | `ImageService.process_upload()` | Imports `UPLOAD_DIR`, `ALLOWED_EXTENSIONS`, `MAX_UPLOAD_BYTES`, PIL. Imported by `images.py` | Working | Complex GeoTIFF unhandled tags handled gracefully. |
| `backend/services/query_service.py` | backend | Orchestration router bridge for image queries | `QueryService.process_query()` | Imports `UPLOAD_DIR`, `ModelRouter`. Imported by `query.py` | Working | Clean decoupling between route and agent router. |
| `backend/services/audit_service.py` | backend | Persistent JSON logging of all agent queries and decisions | `AuditService.log()`, `AuditService.get_logs()`, `AUDIT_LOG_FILE` | Imports `DATA_DIR`, `json`, `datetime`. Imported by all routes | Working | File-based JSON lockless storage (sufficient for hackathon/demo). |

### 2.2 Intelligence Tier (`ai/`)
| Path | Type | Purpose | Key Functions / Classes | Call Graph (Imports / Imported By) | Status | Risk Flags |
|---|---|---|---|---|---|---|
| `ai/observation.py` | ai | Canonical structured observation Pydantic schema | `StructuredObservation`, `ImageInputMetadata`, `TaskDefinition`, `ObservationItem`, `SpatialEvidenceItem` | Imports `pydantic`, `uuid`. Imported by agent and models | Working | Core anti-hallucination contract. |
| `ai/ollama_client.py` | ai | Local LLM inference client for structured reasoning and explanation | `OllamaClient.is_available()`, `OllamaClient.generate()`, `OllamaClient.chat()` | Imports `httpx`, `os`, `json`. Imported by `vqa.py`, `captioning.py`, `change_detection.py`, `fusion.py`, `chat.py` | Working | Strict timeouts (25s) and temperature (0.2). Graceful fallback when unreachable. |
| `ai/orchestrator.py` | ai | Intent classification and query routing | `ModelRouter.route_query()` | Imports `VQAModel`, `CaptioningModel`. Imported by `query_service.py` | Working | Keyword-heuristic based routing. |
| `ai/specialists/dispatcher.py` | ai | Unified dispatcher for 9 remote-sensing models | `SpecialistDispatcher.dispatch()`, `SpecialistDispatcher.get_registered_specialists()` | Imports models, dynamically hooks `repos/goldeneye/src`. Imported by `specialists.py` | Working | Direct hook into Isaac Corley's GoldenEye library. |
| `ai/vision_utils.py` | ai | Computer vision, spatial heuristics, radar filtering algorithms | `VisionUtils.apply_lee_speckle_filter()`, `VisionUtils.compute_sar_log_ratio()`, `VisionUtils.classify_xview2_damage()`, `VisionUtils.extract_image_features()`, `VisionUtils.analyze_change()`, `VisionUtils.analyze_fusion()` | Imports PIL, `numpy`. Imported by all specialist models | Working | Real mathematical algorithms (Lee filter, log ratio, normalized diff). |
| `ai/models/vqa.py` | ai | Visual question answering engine | `VQAModel.analyze()` | Imports `VisionUtils`, `OllamaClient`. Imported by `orchestrator.py`, `dispatcher.py` | Working | Uses CV feature extraction + optional Ollama synthesis. Returns bounding boxes. |
| `ai/models/captioning.py` | ai | Earth-observation scene description | `CaptioningModel.analyze()` | Imports `VisionUtils`, `OllamaClient`. Imported by `caption.py`, `dispatcher.py`, `orchestrator.py` | Working | Synthesizes spectral taxonomy with edge complexity. |
| `ai/models/change_detection.py` | ai | Bi-temporal change detection & damage assessment | `ChangeDetectionModel.analyze()` | Imports `VisionUtils`, `OllamaClient`. Imported by `compare.py`, `dispatcher.py` | Working | Rejects non-corresponding locations via spatial correlation. Suppresses false positives. |
| `ai/models/fusion.py` | ai | Optical + SAR multimodal analysis | `FusionModel.analyze()` | Imports `VisionUtils`, `OllamaClient`. Imported by `fusion.py`, `dispatcher.py` | Working | Isolates radar microwave backscatter under simulated optical cloud cover. |
| `ai/evidence/` | ai | Empty directory | None | None | Orphaned | Empty directory. Intended in v1 PRD for standalone evidence engine. |
| `ai/fusion/` | ai | Empty directory | None | None | Orphaned | Empty directory. Logic lives in `ai/models/fusion.py`. |

### 2.3 Frontend (`frontend/src/`)
| Path | Type | Purpose | Key Functions / Components | Call Graph | Status | Risk Flags |
|---|---|---|---|---|---|---|
| `frontend/src/main.tsx` | frontend | React 19 application root bootstrap | `createRoot` | Imports `React`, `App`, `index.css` | Working | StrictMode enabled. |
| `frontend/src/App.tsx` | frontend | Master dashboard shell, semantic layout, state coordination | `App()` | Imports panels, `App.css`, `apiClient` | Working | Full semantic HTML (`<header>`, `<main>`, `<aside>`, `<section>`). |
| `frontend/src/api/client.ts` | frontend | Typed HTTP client for all backend REST endpoints | `apiClient.uploadImage()`, `executeQuery()`, `generateCaption()`, `compareImages()`, `fuseImages()`, `getAuditLogs()`, `sendChatMessage()` | Uses native `fetch()`. Imported by all panels | Working | Clean error wrapping. |
| `frontend/src/styles/design-tokens.css` | config | Central design system tokens | Custom properties for color, typography, space, radius, shadow, motion | Imported by `index.css` | Working | 18 semantic color tokens, 9 typography scales, 4px grid. |
| `frontend/src/styles/components.css` | frontend | Component stylesheet replacing inline styles | Classes for panels, buttons, badges, inputs, drawers, empty states | Imported by `index.css` | Working | 0 inline styles remaining in JSX. |
| `frontend/src/styles/utilities.css` | frontend | Utility classes | Flex, text, spacing, and accessibility classes | Imported by `index.css` | Working | Clean and minimal. |
| `frontend/src/components/UploadPanel.tsx` | frontend | Preset demo loader and file upload zones | `UploadPanel()` | Imports `apiClient`. Used in `App.tsx` | Working | 6 one-click demo presets, ARIA labels. |
| `frontend/src/components/QueryPanel.tsx` | frontend | Analysis query input and capability action buttons | `QueryPanel()` | Imports `apiClient`. Used in `App.tsx` | Working | Keyboard `Enter` submission supported. |
| `frontend/src/components/MapViewer.tsx` | frontend | Image display and SVG spatial grounding overlay | `MapViewer()` | Used in `App.tsx` | Working | Split view support for T0 and T1; SVG bounding box rendering. |
| `frontend/src/components/ResultPanel.tsx` | frontend | AI answer, detection confidence bar, and engine telemetry | `ResultPanel()` | Used in `App.tsx` | Working | Meaningful empty state and confidence bar. |
| `frontend/src/components/EvidencePanel.tsx` | frontend | Multi-step reasoning trace and per-step confidence cards | `EvidencePanel()` | Used in `App.tsx` | Working | Renders horizontal scrollable step cards. |
| `frontend/src/components/AuditModal.tsx` | frontend | Fullscreen modal table of timestamped query audit records | `AuditModal()` | Imports `apiClient`. Used in `App.tsx` | Working | Escape key and backdrop click dismiss support. |
| `frontend/src/components/ChatBot.tsx` | frontend | Conversational Copilot drawer connected to Ollama/fallback | `ChatBot()` | Imports `apiClient`. Used in `App.tsx` | Working | Multi-turn dialogue, auto-scrolling, quick suggestions. |

### 2.4 Tests & Scripts (`backend/tests/` & `scripts/`)
| Path | Type | Purpose | Key Assertions / Classes | Call Graph | Status | Risk Flags |
|---|---|---|---|---|---|---|
| `backend/tests/test_audit.py` | test | Verifies audit service logging and retrieval | `test_audit_logging_and_retrieval()` | Uses FastAPI `TestClient` | Working | Passes 100%. |
| `backend/tests/test_caption.py` | test | Verifies scene captioning endpoint | `test_caption_success()`, `test_caption_not_found()` | Uses `TestClient` | Working | Passes 100%. |
| `backend/tests/test_chat.py` | test | Verifies conversational copilot endpoint | `test_chat_text_query()`, `test_chat_empty_message()` | Uses `TestClient` | Working | Passes 100%. |
| `backend/tests/test_compare.py` | test | Verifies bi-temporal change detection endpoint | `test_compare_success()`, `test_compare_not_found()` | Uses `TestClient` | Working | Passes 100%. |
| `backend/tests/test_fusion.py` | test | Verifies optical+SAR fusion endpoint | `test_fusion_success()`, `test_fusion_not_found()` | Uses `TestClient` | Working | Passes 100%. |
| `backend/tests/test_health.py` | test | Verifies backend health probe | `test_health_check()` | Uses `TestClient` | Working | Passes 100%. |
| `backend/tests/test_query.py` | test | Verifies VQA query execution and model routing | `test_execute_query_success()`, `test_execute_query_not_found()`, `test_orchestration_routing()` | Uses `TestClient` | Working | Passes 100%. |
| `backend/tests/test_specialists.py` | test | Verifies specialist listing and dispatch | `test_list_specialists()`, `test_dispatch_specialist_not_found()` | Uses `TestClient` | Working | Passes 100%. |
| `backend/tests/test_upload.py` | test | Verifies image upload validation | `test_upload_image()`, `test_upload_invalid_extension()` | Uses `TestClient` | Working | Passes 100%. |
| `scripts/test_demo_pipeline.py` | script | End-to-end command-line demo verifying all 4 demo scenarios | `run_all_demos()` | Uses `TestClient`, reads `data/demo_images/` | Working | Automated demo validator. |
| `scripts/test_specialist_suite.py` | script | Regression suite verifying spatial mismatch, damage, and no-change | `run_tests()` | Uses `TestClient`, reads `data/test_suite/` | Working | Validates algorithmic assertions. |

### 2.5 Data & External Repositories (`data/` & `repos/`)
| Path | Type | Purpose | Content Summary | Status | Risk Flags |
|---|---|---|---|---|---|
| `data/demo_images/` | data | Sample satellite imagery for demo presets | 14 JPEG images (Sentinel-2, Sentinel-1, Joplin disaster, urban before/after) | Working | Committed in repo. |
| `data/test_suite/` | data | Curated test sets for spatial mismatch, change, fusion | 6 subdirectories with corresponding and non-corresponding image pairs | Working | Used by `test_specialist_suite.py`. |
| `repos/goldeneye/` | code/repo | Cloned GoldenEye library (Isaac Corley) | Full Python package with models (`geochat`, `geollava`, `describe_earth`) | Partially integrated | Hooked via `ai/specialists/dispatcher.py`. Heavy PyTorch dependencies not installed in main venv. |
| `repos/SAR-ML-Fusion/` | code/repo | SAR+Optical fusion research notebooks & scripts | Lovasz loss, Swin SAR segmentation, notebooks | Reference only | Uncalled directly by backend. |
| `repos/Sentinel-Sat-SAR/` | code/repo | Sentinel-1 SAR change detection algorithms | Log-ratio change algorithm, notebooks | Reference only | Algorithm ported to `ai/vision_utils.py`. |
| `repos/deepdespeckling/` | code/repo | Deep despeckling models for SAR | Contains MERLIN and SAR2SAR `.pth` checkpoints | Checkpoints present | Ported filter concept used in `ai/vision_utils.py`. |
| `repos/xView2_baseline/` | code/repo | xView2 disaster damage baseline | 4-tier damage classification taxonomy | Reference only | Taxonomy ported to `ai/vision_utils.py`. |
| `repos/LEVIR/` | code/repo | LEVIR-CD building change detection dataset documentation | Website and image samples | Reference only | Uncalled directly. |
| `repos/sentinel-pipeline/` | code/repo | Sentinel ingestion and processing pipeline | Processing utilities | Reference only | Uncalled directly. |

---

## 3. Inventory of AI/ML Assets

### 3.1 Python Files Loading/Calling Models
- **`ai/models/vqa.py`**: Invokes `OllamaClient.generate()` over visual feature prompt when Ollama is available. Falls back to deterministic CV feature matching. Does not load local PyTorch weights.
- **`ai/models/captioning.py`**: Invokes `OllamaClient.generate()` for scene description. Falls back to spectral classification synthesis.
- **`ai/models/change_detection.py`**: Invokes `OllamaClient.generate()` for disaster and change narrative synthesis. Core difference calculation is performed by `VisionUtils.analyze_change()` using NumPy.
- **`ai/models/fusion.py`**: Invokes `OllamaClient.generate()` for optical/radar synergy explanation. Core fusion metrics are calculated by `VisionUtils.analyze_fusion()` using NumPy.
- **`backend/routes/chat.py`**: Invokes `OllamaClient.chat()` for conversational remote-sensing dialogue. Falls back to keyword-based knowledge engine.
- **`ai/specialists/dispatcher.py`**: Dynamically hooks `repos/goldeneye/src/goldeneye/models/registry.py` if present; otherwise dispatches to native specialist stubs.
- **`repos/deepdespeckling/`**: Contains PyTorch model files (`denoiser.py`, `model.py`) that load `.pth` files. *Note: These are in the cloned reference repo, not invoked by default FastAPI routes.*

### 3.2 Ollama Model References
- **Configured Model**: `llama3:latest` (configured in `ai/ollama_client.py` via `os.environ.get("OLLAMA_MODEL", "llama3:latest")`).
- **Endpoint**: `http://localhost:11434` (configurable via `OLLAMA_BASE_URL`).
- **Invocation Pattern**: Local HTTP REST call using `httpx.AsyncClient`. Temperature is locked at `0.2` with timeout of `25.0s`.
- **System Prompt**: Enforces strict scientific grounding — explicitly forbids inventing coordinates, sensors, dates, object counts, or change percentages.

### 3.3 Dataset References & Licenses (Cross-Check against `16-DATASETS.md` & `18-LICENSES-AND-CREDITS.md`)
| Dataset | Purpose in Docs | File Reference | Documented License | Actual Code Status |
|---|---|---|---|---|
| **BigEarthNet v2.0** | R4 Optical+SAR fusion | `16-DATASETS.md`, `18-LICENSES-AND-CREDITS.md` | CDLA-Permissive-1.0 (marked `<FILL>` in docs) | Referenced in docs; not present as a downloaded dataset in repo. |
| **VRSBench** | R2 Captioning & Grounding | `16-DATASETS.md`, `18-LICENSES-AND-CREDITS.md` | Research only (marked `<FILL>` in docs) | Referenced in docs; sample crops in `data/demo_images/`. |
| **RSVQA** | R1 Single-image VQA | `16-DATASETS.md`, `18-LICENSES-AND-CREDITS.md` | Open access (marked `<FILL>` in docs) | Referenced in docs; no local RSVQA parquet/HDF5 dataset files. |
| **CDVQA** | R3 Bi-temporal change | `16-DATASETS.md`, `18-LICENSES-AND-CREDITS.md` | Academic use (marked `<FILL>` in docs) | Referenced in docs; no full dataset downloaded. |
| **LEVIR-CD** | Building change detection | `repos/LEVIR/` | Academic use | Repository clone present in `repos/LEVIR/`. |
| **xView2** | Disaster damage | `repos/xView2_baseline/` | CC BY-NC-SA 4.0 | Sample images in `data/demo_images/` and `data/test_suite/`. |
| **NASA GIBS** | TEE globe time tiles | `16-DATASETS.md` | NASA Open Data | Candidate source for TEE; not yet integrated. |
| **Landsat / Sentinel STAC**| Historical optical/SAR | `16-DATASETS.md` | Public domain / Copernicus open access | Candidate source for TEE; not yet integrated. |

### 3.4 Model Weights / Checkpoint Paths
- `repos/deepdespeckling/deepdespeckling/merlin/saved_models/sentinel_tops.pth` (1.8 MB)
- `repos/deepdespeckling/deepdespeckling/merlin/saved_models/spotlight.pth` (1.8 MB)
- `repos/deepdespeckling/deepdespeckling/merlin/saved_models/stripmap.pth` (1.8 MB)
- `repos/deepdespeckling/deepdespeckling/sar2sar/saved_model/sar2sar.pth` (1.8 MB)
- **Active Backend Pipeline**: Operates with zero required local PyTorch checkpoint downloads, ensuring immediate out-of-the-box execution on any CPU or laptop.

### 3.5 Device & Hardware Assumptions
- **CPU**: Default and fully supported. All active endpoints run on CPU via PIL, NumPy, and standard FastAPI async handlers.
- **GPU (CUDA)**: Optional. GoldenEye and deepdespeckling scripts in `repos/` can utilize CUDA if available, but the core SatQuery application does not assume or require a CUDA GPU to start or pass tests.

---

## 4. GAP REPORT: Current Code vs. `01-PRD.md` §10 (SIH Compliance Matrix)

The following table maps the exact implementation status against the mandatory requirements R1–R8 defined in `01-PRD.md` §10:

| # | SIH Requirement | PRD Specified Target | Current Implementation | Status | Specific Gap / Delta |
|---|---|---|---|---|---|
| **R1** | **Single-image VQA** | `ai/models/vqa.py`, `/api/query`, eval on RSVQA sample via `scripts/eval_vqa.py` | `ai/models/vqa.py`, `backend/routes/query.py` (`POST /api/query`) | **Implemented (Hybrid CV + Ollama)** | `scripts/eval_vqa.py` does not exist. Benchmark accuracy on RSVQA test split is unmeasured. |
| **R2a** | **Captioning** | `ai/models/caption.py`, `/api/caption`, `tests/test_caption.py` | `ai/models/captioning.py`, `backend/routes/caption.py` (`POST /api/caption`) | **Implemented** | File name is `captioning.py` instead of `caption.py`. No quantitative BLEU/CIDEr script on VRSBench. |
| **R2b** | **Visual Grounding** | `ai/models/grounding.py`, `MapViewer.tsx`, eval via `scripts/eval_grounding.py` | `ai/vision_utils.py` (candidate extraction), `MapViewer.tsx` (SVG overlay) | **Partially Implemented** | Grounding logic is embedded in `VisionUtils` rather than a standalone `ai/models/grounding.py`. `scripts/eval_grounding.py` missing. |
| **R3** | **Bi-temporal Change** | `ai/models/change.py`, `/api/analyze/change`, `tests/test_change.py` | `ai/models/change_detection.py`, `backend/routes/compare.py` (`POST /api/compare`) | **Implemented** | Endpoint is `/api/compare` instead of `/api/analyze/change`. Test file is `test_compare.py` instead of `test_change.py`. `scripts/eval_change.py` missing. |
| **R4** | **Optical + SAR** | `ai/fusion/`, `/api/fuse`, `tests/test_fusion.py` | `ai/models/fusion.py`, `backend/routes/fusion.py` (`POST /api/fuse`) | **Implemented** | Logic lives in `ai/models/fusion.py`; the directory `ai/fusion/` is empty/orphaned. BigEarthNet evaluation script missing. |
| **R5** | **Agent Orchestration** | `ai/agent.py`, `tests/test_agent_routing.py` | `ai/orchestrator.py` (`ModelRouter`), `ai/specialists/dispatcher.py` | **Implemented** | Split between `orchestrator.py` and `dispatcher.py` rather than a single `ai/agent.py`. Routing test lives in `test_query.py::test_orchestration_routing`. |
| **R6** | **Confidence** | `ai/evidence/`, `tests/test_evidence.py` | Inline in all model responses, `ResultPanel.tsx`, `EvidencePanel.tsx` | **Implemented** | `ai/evidence/` directory is empty/orphaned; confidence calculation is handled inline within each model file. |
| **R7** | **Audit Trail** | `ai/agent/trace.py`, `/api/trace/{id}`, `tests/test_trace.py` | `backend/services/audit_service.py`, `backend/routes/audit.py` (`GET /api/audit`), `AuditModal.tsx` | **Implemented** | Route is `GET /api/audit` (table of all logs) rather than `GET /api/trace/{id}` (single query trace lookup). Test file is `test_audit.py`. |
| **R8** | **Additional Requirement** | `<FILL>` in original PRD | Currently unfilled in v1 PRD | **Missing / Open** | Perfect candidate for v2 Increment A (Region-of-Interest Analysis) or STAC Data Ingest. |

---

## 5. ACCURACY REALITY CHECK

In strict compliance with **RULE 005** (*"Never fabricate model accuracy. Report only measured numbers with the eval script and dataset that produced them. 'TBD' is acceptable; a made-up number is not"*):

| Location | Claimed Metric / Statement | Reality Classification | Verifiable Script & Dataset | Reality Assessment |
|---|---|---|---|---|
| `ai/models/vqa.py` L19 | `confidence: 0.85` | **(b) Unverified / Fallback stub** | None | Hardcoded stub response for dummy maritime query. |
| `ai/models/vqa.py` L35 | `confidence: 0.92` | **(b) Unverified / Fallback stub** | None | Hardcoded stub response for cloud cover query. |
| `ai/models/vqa.py` L85 | `confidence: 0.91` | **(b) Heuristic estimate** | None | Heuristic score returned whenever Ollama provides an answer. |
| `ai/models/vqa.py` L90, L93, L96 | `0.93`, `0.89`, `0.94` | **(b) Heuristic estimate** | None | Rule-based scores derived from CV feature presence. |
| `ai/models/captioning.py` L15 | `confidence: 0.88` | **(b) Unverified / Fallback stub** | None | Hardcoded stub response for dummy image input. |
| `ai/models/captioning.py` L43 | `confidence: 0.92` | **(b) Heuristic estimate** | None | Heuristic score for Ollama captioning. |
| `ai/models/change_detection.py` L22 | `confidence: 0.94` | **(b) Unverified / Fallback stub** | None | Hardcoded stub response for dummy change test. |
| `ai/models/change_detection.py` L54 | `"Surface stability index is 99.2%"` | **(b) Heuristic formula** | None | Formatted string based on inverted pixel difference; not a benchmark stability score. |
| `ai/models/change_detection.py` L41 | `confidence: 0.98` | **(a) Measured algorithmic assertion** | `scripts/test_specialist_suite.py` on `data/test_suite/06_different_place/` | True algorithmic threshold: Spatial cross-correlation `< 0.150` triggers definitive rejection. |
| `ai/models/fusion.py` L16 | `confidence: 0.98` | **(b) Unverified / Fallback stub** | None | Hardcoded stub response for dummy fusion test. |
| `ai/models/fusion.py` L46 | `confidence: 0.96` | **(b) Heuristic estimate** | None | Fixed heuristic score for Ollama fusion. |
| `docs/12-TESTING.md` | All R1–R7 listed as 🟩 PASS | **(a) Functional verification** | `.venv\Scripts\pytest.exe` (17/17 tests passing) | The tests accurately verify HTTP contract compliance, schema shapes, and endpoint stability. They do **NOT** assert benchmark accuracy (mIoU, F1). |
| `docs/17-MODEL-CARD.md` | Accuracy: `<metric = value...>` | **(b) Unfilled template (TBD)** | None | Template has not yet been populated with measured benchmark metrics. |

### Summary of Reality Check:
1. There are **zero** verified ML benchmark numbers (e.g. mIoU on LEVIR-CD, Accuracy on RSVQA, BLEU-4 on VRSBench) currently produced by an automated evaluation script.
2. All current confidence figures are **heuristic algorithmic scores** or **stub values**.
3. Under RULE 005, all model accuracy metrics in documentation must remain **"TBD (Heuristic Baseline Active)"** until actual evaluation scripts (`scripts/eval_*.py`) are written and executed on named datasets.

---

## 6. Structural & Architectural Anomalies to Rectify in v2

1. **Empty Directories**: `ai/evidence/` and `ai/fusion/` exist on disk but contain no files. The logic currently resides in `ai/models/fusion.py` and inline inside each model file.
2. **Endpoint Naming Alignment**: PRD §10 lists `/api/analyze/change`, while backend implements `/api/compare`. Both can be supported via route aliasing to maintain backwards compatibility while satisfying PRD naming.
3. **Trace Route**: PRD §10 lists `/api/trace/{id}`, while backend implements `/api/audit`. Supporting `/api/trace/{id}` will allow individual query inspection.
4. **Standalone Grounding**: Visual grounding is currently handled within `vqa.py` and `vision_utils.py`. Splitting out an explicit `ai/models/grounding.py` will cleanly satisfy requirement R2b.

---

## 7. Audit Conclusion & Phase 1 Readiness

- **Current Repository Health**: Excellent. 17/17 unit/integration tests pass. Frontend compiles with 0 errors. Redesigned Apple-grade UI is live and responsive.
- **Next Step**: Awaiting user approval of this `docs/AUDIT-REPORT.md` before proceeding to Phase 1 (creating tickets SQ-026 through SQ-030 for Region-of-Interest Analysis, Fine-Grained Change Detection, High-Precision Escalation, and God's Eye 3D Globe).
