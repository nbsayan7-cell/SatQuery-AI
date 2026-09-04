# 📜 SatQuery AI — Changelog

## [1.0.0-alpha.1] - 2026-09-03
### Added
- Phase 0 & 1: Project Skeleton initialized with FastAPI and Vite.
- Phase 2: Frontend Shell designed using CSS grid, dark theme, and placeholder components.
- Phase 3 (SQ-001): Image upload pipeline implemented.
  - Backend: `POST /api/upload` endpoint created with file validation and metadata extraction using `Pillow`.
  - Frontend: `UploadPanel` component updated to use `apiClient` to upload images, preview them, and display success details.
- Phase 4 (SQ-002): Single-image VQA pipeline implemented.
  - Backend: `POST /api/query` endpoint and `QueryService` added to route queries.
  - Intelligence: `ai/models/vqa.py` stub created to provide mock deterministic VQA responses.
  - Frontend: `QueryPanel` and `ResultPanel` wired up with global state in `App.tsx` to execute queries and display confidence/model details.
- Phase 6 (Grounding - R2b):
  - Backend: Added `GET /api/images/{image_id}` to directly serve uploaded images.
  - Intelligence: Updated `vqa.py` stub to return geospatial `grounding` bounding boxes.
  - Frontend: Replaced `MapViewer.tsx` placeholder with an SVG overlay system that maps query results (bounding boxes) precisely over the uploaded satellite image.
- Phase 10 (Evidence + Confidence Engine - R6):
  - Intelligence: Updated `vqa.py` stub to return an `evidence` array containing reasoning steps and micro-confidence scores.
  - Frontend: Updated `EvidencePanel.tsx` to dynamically render reasoning steps with visual confidence bars based on the `queryResult` state.
- Phase 11 (Audit Trail - R7):
  - Backend: Created `AuditService` to log successful queries to a local JSON file (`audit_log.json`). Added `GET /api/audit` endpoint.
  - Frontend: Created a floating "Audit Trail" button and `AuditModal.tsx` to view the timestamped history of queries, models, and confidence scores.
- Phase 9 (Agent Orchestration - R5):
  - Intelligence: Created a basic `ModelRouter` in `orchestrator.py` to route queries based on intent heuristics. Added a secondary `CaptioningModel` stub.
  - Backend: Refactored `QueryService` to pass queries through the orchestration layer rather than hardcoding the VQA model.
- Phase 5 (Captioning - R2a):
  - Backend: Added a dedicated `POST /api/caption` endpoint that bypasses the orchestrator to guarantee a scene overview generation.
  - Frontend: Added a "Generate Scene Overview" button to the `QueryPanel` allowing users to instantly caption the image with one click.
- Phase 7 (Bi-temporal Change Analysis - R3):
  - Backend: Created `ai/models/change_detection.py` stub to return structural changes between two images. Added `POST /api/compare` endpoint to route the two images to this model.
  - Frontend: Updated the `UploadPanel` to accept a Baseline (T0) and Current (T1) image. Updated `MapViewer.tsx` to dynamically split the view and render both images side-by-side when present. Added a "Detect Changes" button to the `QueryPanel`.
- Phase 8 (Optical + SAR Fusion - R4):
  - Backend: Created `ai/models/fusion.py` stub to simulate multi-modal fusion. Added `POST /api/fuse` endpoint.
  - Frontend: Added "Run Data Fusion (Opt + SAR)" button to `QueryPanel` which executes fusion analysis when two images are uploaded.
- Phase 12-15 (Final Polish & God's Eye Integration):
  - Docs: Created `docs/12-TESTING.md` (SIH Test Matrix) and `docs/13-DEMO-SCRIPT.md` (Live Pitch Script). Updated root `README.md`.
  - Frontend: Added a "Launch God's Eye 3D ↗" button to the `MapViewer` header to launch the decoupled 3D globe visualization tool on port 3000.