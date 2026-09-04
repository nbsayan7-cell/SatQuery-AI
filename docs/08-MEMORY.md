# 🧭 SatQuery AI — AI Development Memory (Current Context)

## CURRENT
Date: 2026-09-04
Current phase: v2 Core & Safety Complete (Increments A, B, C, D + SQ-039 + SQ-040)
Current tickets:
- SQ-035 (Region-of-Interest Analysis) 🟢 DONE
- SQ-036 (Fine-Grained Multi-Part Change Detection) 🟢 DONE
- SQ-037 (High-Precision Escalation Pipeline) 🟢 DONE
- SQ-038 (God's Eye 3D Earth Explorer & Temporal Imagery Extraction) 🟢 DONE
- SQ-039 (Image Pair Compatibility & Temporal Validation Engine) 🟢 DONE
- SQ-040 (God's Eye 3D Earth View - Cleaned Globe without aircraft/texts) 🟢 DONE

Last completed: Comprehensive Codebase Audit & System Map Synchronization (`07-CODEBASE.md`, `CODEBASE-MAP.md`)
Currently working: All 5 requirements delivered, tested, and documented
Last successful test: `pytest` ✓ (backend/tests/test_pipeline_engine.py 11/11 passed, backend/tests/test_benchmark_20.py 9/9 passed, full test suite 66/66 passed cleanly)
Evaluation Benchmark: `scripts/run_benchmark_20.py` -> `docs/BENCHMARK-20-RESULTS.json` (20/20 PASSED) ✓
Scientific Refinements: CVM z-score standardization, Affine Jacobian determinant area with boundary uncertainty CI95, multi-source decomposed uncertainty (5 axes), 8-level hard validation gate (FAIL = STOP).

Important decisions & deliverables completed:
- Codebase Audit & Map: `docs/07-CODEBASE.md` and `docs/CODEBASE-MAP.md` completely refreshed with 17 API endpoints, 5 subsystems, and call graphs.
- 20 Priority Benchmark Suite: Complete specification in `docs/SPEC-20-BENCHMARK-TESTS.md` covering all SIH capabilities (Counting, Water, Captioning, Roads, Ships, Bi-temporal, Cross-modal, Cloud Fallback, Agents).
- Automated Benchmark Runner: `scripts/run_benchmark_20.py` with evaluation matrix, automated metrics computation, and JSON export to `docs/BENCHMARK-20-RESULTS.json`.
- Test Verification: `backend/tests/test_benchmark_20.py` passing 100% (9/9 passed).
- Master Engineering Document: `docs/00-MASTER.md` created with two-lane architecture and realistic 8GB VRAM engineering standards.
- Master Engineering Document: `docs/00-MASTER.md` created with two-lane architecture and realistic 8GB VRAM engineering standards.
- Deterministic Pipeline Engine: Full `pipeline/` package implemented with subpixel coregistration, Enhanced Lee despeckling, NDVI/NDWI/NDBI/SAVI, SAR features, CVM, Mahalanobis distance, Otsu & Chi-Square thresholding, GeoJSON vectorization, geodesic area ($m^2$ and ha), and first-order Taylor uncertainty propagation.
- QLoRA Training Framework: `training/` package implemented with instruction data parsers for RSVQA, VRSBench, and CDVQA, and RTX 4060 4-bit NormalFloat BitsAndBytes/LoRA configurations (<6.5 GB peak VRAM).
- Test Coverage: Verified with passing automated tests (`test_pipeline_engine.py` 8/8, `test_training_pipeline.py` 4/4).
- Increment A (SQ-035): ROI drawing tool, sub-image Lanczos super-resolution (<256px), coordinate projection to scene coordinates, POST /api/analyze/region.
- Increment B (SQ-036): Spatially-resolved multi-region change segmentation, land-cover taxonomy classification (New Built-up, Vegetation Loss, Water Dynamic, Structural Damage), area calculations, ranked inventory in UI, POST /api/analyze/change.
- Increment C (SQ-037): Multi-stage confidence escalation engine (tiling 2x2, test-time augmentation, optical+SAR radar fusion, Ollama structured reasoning reconciliation), POST /api/analyze/escalate, empirical eval script recording metrics to BENCHMARK-RESULTS.md without fabricating numbers.
- Increment D (SQ-038): God's Eye 3D Earth Explorer (TEE) modal with licensed open imagery providers (NASA GIBS / Open STAC / offline showcase packs), temporal date selector, POST /api/tee/extract.
- SQ-039: Image Pair Compatibility, Same-Area & Temporal Validation Engine (`ai/pair_validator.py`, `POST /api/validate/pair`). Hard validation gate that blocks invalid non-overlapping comparisons (e.g. Kolkata vs Delhi) with zero hallucination.
- SQ-040: Full-screen God's Eye 3D Earth Explorer with illuminated globe, tactical coordinates, atmospheric glow, aircraft/flights removed, text banners removed, and direct sector extraction into SatQuery.
- Live browser sessions fully verified with visual recordings and high-resolution screenshots.