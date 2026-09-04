# 🧱 SatQuery AI — Build Phases

> **Purpose:** Control *how* the project is built. Never ask an AI to "build the whole
> thing." Give it one phase at a time. Each phase has a Definition of Done; you do not
> advance until it is met. This is the antidote to a giant broken codebase.

**Version:** 1.0 · **Last updated:** <FILL:date>

---

## Phase Template (every phase uses this)

- **Goal:** the one sentence outcome.
- **Inputs:** what must exist before starting.
- **Tasks:** the concrete steps.
- **Dependencies:** which phases must be complete.
- **Expected output:** artifacts produced.
- **Tests:** how we verify.
- **Definition of Done (DoD):** the checklist that ends the phase.
- **Rollback plan:** how to undo if it breaks.

---

## PHASE 0 — Environment
- **Goal:** every teammate can run the empty project.
- **Tasks:** repo init, Python venv, Node install, `.env.example`, pre-commit, CI stub.
- **DoD:** `uvicorn` and `vite` both start; `/api/health` returns `{status:"ok"}`.
- **Rollback:** delete branch; environment is reproducible from `README.md`.

## PHASE 1 — Project skeleton
- **Goal:** folder structure + empty modules matching `02-ARCHITECTURE.md`.
- **DoD:** every folder in `07-CODEBASE.md` §4 exists with a placeholder + docstring.

## PHASE 2 — Frontend shell
- **Goal:** dashboard renders all empty panels (no logic).
- **DoD:** dark theme applied; panels laid out per `05-DESIGN.md`.

## PHASE 3 — Image upload
- **Goal:** user uploads an image; backend stores it and returns metadata.
- **Tests:** PNG, JPEG, GeoTIFF accepted; invalid file rejected; loading + error states.
- **DoD:** ticket SQ-001 acceptance criteria all pass.

## PHASE 4 — Single-image VQA (R1)
- **Goal:** ask a question, get an answer.
- **Dependencies:** Phase 3.
- **DoD:** `/api/query` returns a plausible answer on a sample Sentinel image; test logged.

## PHASE 5 — Captioning (R2a)
## PHASE 6 — Grounding (R2b) — overlay a region on the map.
## PHASE 7 — Bi-temporal change analysis (R3)
## PHASE 8 — Optical + SAR fusion (R4)
## PHASE 9 — Agent orchestration (R5) — router chooses the tool automatically.
## PHASE 10 — Evidence + confidence engine (R6)
## PHASE 11 — Audit trail (R7) — trace viewer.
## PHASE 12 — God's Eye / 3D layer (P3/P4, only if R1–R7 are green)
## PHASE 13 — Testing — fill the SIH test matrix in `12-TESTING.md`.
## PHASE 14 — Demo — rehearse `13-DEMO-SCRIPT.md` on demo hardware.
## PHASE 15 — Final polish — bug bash, doc sync, submission package.

> Golden order for a beginner team under time pressure:
> **0 → 1 → 2 → 3 → 4 → 6 → 10 → 11 → 9 → 5 → 7 → 8 → 13 → 14 → 12 → 15.**
> This front-loads a demoable core (upload → VQA → grounding → evidence → trace) before
> the harder change/fusion work, so you always have something to show.