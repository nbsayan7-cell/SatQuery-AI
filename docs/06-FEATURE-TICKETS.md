# SatQuery AI — Feature Tickets (Complete Backlog)



**Version:** 1.0 · **Last updated:** <FILL: date>



> **How to use this backlog.** One ticket equals one controlled task for one AI agent.

> You never hand an agent a whole phase — you hand it a single ticket, it does exactly

> that ticket, and you verify the result against the acceptance criteria before moving on.

> Every ticket carries the docs it must update, so the post-change ritual (RULE 016) is

> built into the task rather than remembered separately. Priorities: P0 blocker · P1 core ·

> P2 optional · P3/P4 God's Eye. Status: 🔴 not started · 🟡 in progress · 🟢 done.



---



## SQ-001 — Image Upload

Phase: 3 · Priority: P0 · Status: 🔴 · Requirement: (enables all) Goal: Allow the user to upload a satellite image and have the backend store it. Files: frontend/src/components/UploadPanel.tsx frontend/src/api/client.ts backend/routes/images.py backend/services/image_service.py backend/config.py Dependencies: None Acceptance criteria: ✓ PNG uploads and previews in the UI ✓ JPEG uploads and previews ✓ GeoTIFF accepted; metadata parsed (width, height, bands) or gracefully skipped ✓ Invalid file type rejected with a clear error message ✓ File over MAX_UPLOAD_MB rejected with a clear error ✓ Loading state shown during upload ✓ Error state shown on failure ✓ Backend returns { image_id, meta } on success Test: tests/test_upload.py — upload sample Sentinel-2 JPEG from data/samples/, assert 200 + image_id. Docs to update: CODEBASE.md §5 & §17, CHANGELOG.md, MEMORY.md

## SQ-026 — TEE: 3D Globe Shell
Phase: 12 · Priority: P3 · Status: 🔴 · Requirement: (enhancement only)
Goal: Render an interactive 3D globe on an isolated /tee route.
Files: frontend/src/tee/Globe.tsx, frontend/src/tee/index.ts, App.tsx (lazy route)
Dependencies: R1–R7 all 🟢 (do not start otherwise)
Library: CesiumJS (time-dynamic) OR MapLibre globe projection — decide in DECISIONS.md.
Acceptance criteria:
  ✓ Globe renders, rotates, and zooms smoothly on demo hardware
  ✓ Route is lazy-loaded; disabling tee/ leaves the core app fully working
  ✓ Uses DESIGN.md color tokens (dark space theme)
Test: manual — toggle /tee on/off, confirm core unaffected.
Docs: CODEBASE.md §4/§5, DECISIONS.md (library choice), CHANGELOG.md

## SQ-027 — TEE: Location Search & Fly-To
Phase: 12 · Priority: P3 · Status: 🔴
Goal: Search a place name and fly the camera to it.
Files: frontend/src/tee/LocationSearch.tsx
Dependencies: SQ-026
Acceptance criteria:
  ✓ Typing a place name flies the globe to those coordinates
  ✓ Graceful "not found" state
Test: manual — search a known city, camera arrives.
Docs: CODEBASE.md §5, CHANGELOG.md

## SQ-028 — TEE: Time-Stamped Imagery Layer
Phase: 12 · Priority: P3 · Status: 🔴 · Requirement: (history feature core)
Goal: Drape date-parameterized satellite tiles on the globe.
Files: frontend/src/tee/imageryLayer.ts
Dependencies: SQ-026
Source: NASA GIBS date-templated tiles (start here — simplest historical time layer).
Acceptance criteria:
  ✓ Globe shows imagery for a given date
  ✓ Changing the date re-drapes with that date's imagery
  ✓ Attribution shown per source license (18-LICENSES-AND-CREDITS.md)
Test: manual — set two different dates, imagery visibly differs.
Docs: CODEBASE.md §5, DATASETS.md, LICENSES-AND-CREDITS.md, CHANGELOG.md

## SQ-029 — TEE: Timeline Scrubber (1 / 10 / 20 years)
Phase: 12 · Priority: P3 · Status: 🔴 · Requirement: (history feature UX)
Goal: A slider/date control to travel through time.
Files: frontend/src/tee/TimelineControl.tsx
Dependencies: SQ-028
Acceptance criteria:
  ✓ Slider covers the source's available history range
  ✓ Presets: "1 year ago", "10 years ago", "20 years ago"
  ✓ Moving it updates the imagery layer (SQ-028)
  ✓ Shows the currently selected date clearly
Test: manual — jump to a 20-years-ago preset, imagery updates.
Docs: CODEBASE.md §5, CHANGELOG.md

## SQ-030 — TEE: Area Selector (draw rectangle → bbox)
Phase: 12 · Priority: P3 · Status: 🔴 · Requirement: (extract enabler)
Goal: Let the user draw a rectangle on the globe and capture its bbox.
Files: frontend/src/tee/AreaSelector.tsx
Dependencies: SQ-026
Acceptance criteria:
  ✓ User draws/edits a rectangle over the globe
  ✓ Produces [minLon, minLat, maxLon, maxLat]
  ✓ Rejects an over-large area with a clear message (matches backend limit)
Test: manual — draw a box, bbox values printed/logged.
Docs: CODEBASE.md §5, CHANGELOG.md

## SQ-031 — TEE: Extract Endpoint (backend)
Phase: 12 · Priority: P3 · Status: 🔴 · Requirement: (bridge to core pipeline)
Goal: Fetch imagery for {bbox, date, source} and store it as a normal image.
Files: backend/routes/tee.py, backend/services/tee_service.py
Dependencies: SQ-001 (reuses image store), SQ-028 sources decided
Acceptance criteria:
  ✓ POST /api/tee/extract returns { image_id, meta } using the EXISTING image store
  ✓ Handles NO_IMAGERY_FOR_DATE, BBOX_TOO_LARGE, SOURCE_UNAVAILABLE
  ✓ Stored image is indistinguishable from an uploaded one (works with /api/query)
  ✓ No secrets/keys in code (RULE 004)
Test: tests/test_tee_extract.py — extract a known bbox+date, assert image_id resolves.
Docs: CODEBASE.md §5/§10, DECISIONS.md (source), CHANGELOG.md, MEMORY.md

## SQ-032 — TEE: Extract & Analyze (wire to existing pipeline)
Phase: 12 · Priority: P3 · Status: 🔴 · Requirement: (the payoff)
Goal: One click: extract the selected view and run it through /api/query.
Files: frontend/src/tee/extract.ts, frontend/src/tee/Globe.tsx (button)
Dependencies: SQ-030, SQ-031, SQ-002
Acceptance criteria:
  ✓ "Extract & Analyze" produces an image_id then calls the existing query flow
  ✓ Answer + confidence + grounding overlay come back through the normal path
  ✓ No new analysis code — reuses agent/models/evidence unchanged
Test: E2E — draw box, pick date, analyze, assert an answer renders.
Docs: CODEBASE.md §5, CHANGELOG.md, MEMORY.md

## SQ-033 — TEE: Two-Date Change from the Globe
Phase: 12 · Priority: P3 · Status: 🔴 · Requirement: (supercharges R3 demo)
Goal: Extract the same rectangle at two dates and run change analysis.
Files: frontend/src/tee/extract.ts, frontend/src/tee/TimelineControl.tsx
Dependencies: SQ-032, SQ-013
Acceptance criteria:
  ✓ User picks date A and date B for the same bbox
  ✓ TEE extracts both (already co-registered by shared bbox — see ARCH §15.4)
  ✓ Calls existing /api/analyze/change; change map + answer render
Test: E2E — same box, two dates, assert change overlay appears.
Docs: CODEBASE.md §5, CHANGELOG.md, MEMORY.md

## SQ-034 — TEE: Demo Caching / Offline Pack
Phase: 14 · Priority: P3 · Status: 🔴 · Requirement: (demo safety)
Goal: Pre-cache dated tiles for 2–3 showcase locations so TEE works offline.
Files: scripts/cache_tee_tiles.py, data/tee_cache/
Dependencies: SQ-028, SQ-031
Acceptance criteria:
  ✓ Chosen showcase locations render at their showcase dates with Wi-Fi OFF
  ✓ preflight.sh (SQ-025) verifies the cache is present
Test: run preflight with networking off; TEE showcase works.
Docs: DEMO-SCRIPT.md, LICENSES-AND-CREDITS.md, CHANGELOG.md
Note: only cache/redistribute tiles whose license permits it (RULE 013 spirit).

## SQ-035 — Region-of-Interest (ROI) Analysis
Phase: 16 (v2 Increments) · Priority: P1 · Status: 🟢 done · Requirement: R8 (Spatial Precision)
Goal: Allow the user to draw/select a region in MapViewer and execute high-precision analysis on that region only.
Files:
  - ai/preprocessing.py (crop, upsample, normalize)
  - backend/routes/region.py (/api/analyze/region)
  - backend/services/region_service.py
  - backend/main.py
  - backend/tests/test_region.py
  - frontend/src/api/client.ts
  - frontend/src/components/MapViewer.tsx (interactive drawing tool)
  - frontend/src/components/QueryPanel.tsx (ROI trigger & clear)
Acceptance criteria:
  ✓ User can draw/drag a bounding box on MapViewer to define an ROI
  ✓ Backend endpoint POST /api/analyze/region accepts { image_id, roi_geometry, question, task }
  ✓ Preprocessor crops image to ROI and upsamples if small (<256px)
  ✓ Dispatches to specialist model and offsets detections back to scene coordinate space
  ✓ Returns { answer, confidence, per_region_overlay, trace_id }
  ✓ Test in backend/tests/test_region.py passes with valid ROI cropping and coordinate alignment
Docs: 07-CODEBASE.md, CODEBASE-MAP.md, 08-MEMORY.md, 10-CHANGELOG.md, 20-AI-CHANGE-RECORD.md

## SQ-036 — Fine-Grained, Multi-Part Change Detection
Phase: 16 (v2 Increments) · Priority: P1 · Status: 🟢 done · Requirement: R3 (Bi-temporal Change)
Goal: Spatially-resolved change detection producing a dense tile/region change probability map, multi-region segmentation, change taxonomy classification, and ranked change inventory.
Files:
  - ai/vision_utils.py (multi-region change clustering & taxonomy)
  - ai/models/change_detection.py (fine-grained multi-part change analysis)
  - backend/routes/change.py (POST /api/analyze/change and aliased /api/compare)
  - backend/services/change_service.py
  - backend/tests/test_change.py
  - frontend/src/api/client.ts
  - frontend/src/components/MapViewer.tsx (multi-part colored overlays)
  - frontend/src/components/ResultPanel.tsx (ranked "what changed where" table)
Acceptance criteria:
  ✓ Identifies and segments multiple distinct changed regions (not just a single binary verdict)
  ✓ Each region reports location (bbox), change type (vegetation loss, new built-up, water dynamic, structural change), area (pixels/m²), and confidence
  ✓ POST /api/analyze/change returns structured response with ranked list of changed regions
  ✓ Backend tests in backend/tests/test_change.py verify multiple region extraction, area calculation, and taxonomy classification
Docs: 07-CODEBASE.md, CODEBASE-MAP.md, 08-MEMORY.md, 10-CHANGELOG.md, 20-AI-CHANGE-RECORD.md

## SQ-037 — High-Precision Escalation Pipeline
Phase: 16 (v2 Increments) · Priority: P1 · Status: 🟢 done · Requirement: R6 / R5 (Measured Precision Escalation)
Goal: Build a multi-stage confidence escalation engine (tiling, test-time augmentation, optical+SAR cross-check, Ollama structured reasoning reconciliation) triggered automatically on low confidence (<0.75) or on user request ("high precision mode").
Files:
  - backend/config.py (configurable confidence thresholds)
  - ai/escalation.py (escalation pipeline coordinator)
  - backend/routes/escalate.py (POST /api/analyze/escalate)
  - backend/services/query_service.py (escalation integration)
  - backend/tests/test_escalate.py
  - scripts/eval_escalation.py (empirical evaluation script)
  - frontend/src/components/QueryPanel.tsx (precision toggle)
Acceptance criteria:
  ✓ Configurable threshold in backend/config.py (ESCALATION_CONFIDENCE_THRESHOLD = 0.75)
  ✓ Tiling: partitions image into overlapping 2x2 / 3x3 tiles for fine-detail detection
  ✓ TTA (Test-Time Augmentation): horizontal/vertical flip inference aggregation
  ✓ SAR Cross-Check: if SAR counterpart available, cross-references microwave reflection
  ✓ Ollama synthesis: LLM only reconciles structured vision outputs, never invents measurements
  ✓ Measurable eval script scripts/eval_escalation.py recording baseline vs escalated confidence/IoU
  ✓ 100% test pass in backend/tests/test_escalate.py
Docs: 07-CODEBASE.md, CODEBASE-MAP.md, 08-MEMORY.md, 10-CHANGELOG.md, 17-MODEL-CARD.md, 20-AI-CHANGE-RECORD.md

## SQ-038 — God's Eye 3D Earth Explorer & Temporal Imagery Extraction
Phase: 16 (v2 Increments) · Priority: P1 · Status: 🟢 done · Requirement: R1 / R3 (Licensed Temporal Exploration)
Goal: Interactive 3D Earth Explorer modal allowing geographic sector selection, historical date picking, and imagery extraction from properly-licensed providers (NASA GIBS / open STAC) into the core SatQuery pipeline.
Files:
  - backend/services/tee_service.py (GIBS / STAC retrieval & offline showcase cache)
  - backend/routes/tee.py (/api/tee/showcases, /api/tee/extract)
  - backend/tests/test_tee.py
  - frontend/src/api/client.ts (getTeeShowcases, extractTeeImagery)
  - frontend/src/components/GlobeModal.tsx
  - frontend/src/App.tsx (integrated header launcher)
Acceptance criteria:
  ✓ Renders 3D Earth Explorer modal with curated global showcase sectors (Hanoi, Joplin, Dubai)
  ✓ Allows picking historical dates across multi-year temporal timelines
  ✓ Fetches from licensed open providers (NASA GIBS / Open STAC) with public domain compliance (RULE 013)
  ✓ Integrates extracted scenes directly into Baseline (T0) for full core pipeline processing
  ✓ 100% test pass in backend/tests/test_tee.py
Docs: 07-CODEBASE.md, CODEBASE-MAP.md, 08-MEMORY.md, 10-CHANGELOG.md, 20-AI-CHANGE-RECORD.md

## SQ-039 — Image Pair Compatibility, Same-Area & Temporal Validation Engine
Phase: 17 · Priority: P0 (Scientific Safety Gate) · Status: 🟢 done · Requirement: R3 / R6 / R8
Goal: Build a non-negotiable validation gate before change detection or cross-modal comparison to prevent hallucinated changes between unrelated images.
Files:
  - ai/pair_validator.py (hierarchical geospatial & feature validation)
  - backend/routes/pair_validation.py (POST /api/validate/pair)
  - backend/services/change_service.py (hard-block gate integration)
  - backend/tests/test_pair_validator.py
  - frontend/src/api/client.ts
Acceptance criteria:
  ✓ Implements 8-level evidence hierarchy (Metadata > Geolocation > Overlap > Registration > Modality > Temporal > Visual)
  ✓ Computes IoU, center distance, spatial cross-correlation, and feature inlier metrics
  ✓ Classifies pair into 9 discrete statuses (e.g. VALID_SAME_AREA_DIFFERENT_TIME, DIFFERENT_LOCATION, REGISTRATION_FAILED)
  ✓ Hard blocks change detection when validation fails (e.g. Kolkata vs Delhi -> BLOCK CHANGE DETECTION)
  ✓ Provides separate confidence scores (Geographic, Registration, Temporal, Modality)
  ✓ Automated tests in backend/tests/test_pair_validator.py pass 100% (8/8)
Docs: 07-CODEBASE.md, CODEBASE-MAP.md, 08-MEMORY.md, 10-CHANGELOG.md, 20-AI-CHANGE-RECORD.md

## SQ-040 — God's Eye 3D Earth View Integration (Cleaned Globe, Planes/Aircrafts & Texts Stripped)
Phase: 18 · Priority: P1 · Status: 🟢 done · Requirement: R1 / R3
Goal: Embed the immersive Cesium 3D Globe from God's Eye View with aircraft/flights tracking stripped out and text banners removed, featuring globe navigation, lighting, and direct ROI selection into SatQuery.
Files:
  - frontend/src/components/GodsEyeExplorer.tsx
  - frontend/src/App.tsx
  - frontend/src/styles/components.css
Acceptance criteria:
  ✓ Full-screen interactive 3D Globe with Earth terrain and atmospheric glow
  ✓ Aircraft, flight markers, and tracking paths completely removed
  ✓ Cluttering title texts and watermarks removed for clean professional tactical HUD
  ✓ Area selection tool enabling direct extraction into SatQuery Baseline (T0)
  ✓ Fully verified in browser with screenshot proof
Docs: 07-CODEBASE.md, CODEBASE-MAP.md, 08-MEMORY.md, 10-CHANGELOG.md, 20-AI-CHANGE-RECORD.md



