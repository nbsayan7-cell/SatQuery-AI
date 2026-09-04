# SatQuery AI — Architecture



**Version:** 1.0 · **Owner:** <FILL> · **Last updated:** <FILL:date>

**Related:** 01-PRD.md · 07-CODEBASE.md · 09-DECISIONS.md · CODEBASE-MAP.md



> **How to read this document.** This explains how the software works end to end. When

> the architecture changes, this file and 09-DECISIONS.md must be updated in the same

> commit (RULE 001, RULE 009). The layering rules stated here are not suggestions — they

> are enforced in code review: handlers call services, services call the agent, the agent

> calls models, and nothing skips a layer.



---



## 1. System Overview



SatQuery is a three-tier system. The **presentation tier** (a React single-page app) is

deliberately "dumb": it captures input and renders output and performs no intelligence of

any kind. The **application tier** (a FastAPI server) is the traffic controller: it

validates input, enforces limits, manages sessions, and routes requests, but it does not

itself reason about imagery. The **intelligence tier** (the `ai/` package) contains the

agent, the models, the fusion pipeline, and the evidence engine — this is where all

reasoning happens. Keeping these tiers strictly separated is what lets a beginner team

reason about the system one box at a time, and it is what lets an AI agent modify one box

without accidentally breaking another.

## 15. Temporal Earth Explorer (TEE) Architecture — Enhancement Layer

> Isolated enhancement (God's Eye). Lives in `frontend/src/tee/` and a thin backend
> `tee_service`. It reuses the *existing* upload/query/change endpoints — it adds a data
> source, not a parallel pipeline. Removable without touching the core.

### 15.1 Component overview

```
        ┌───────────────────────────────────────────┐
        │  TEE (frontend/src/tee/)                    │
        │                                             │
        │  Globe (CesiumJS or MapLibre globe)         │
        │    ├── imagery layer (time-stamped tiles)   │
        │    ├── TimelineControl (date scrubber)      │
        │    ├── LocationSearch (place → lat/lon)      │
        │    └── AreaSelector (draw rectangle → bbox) │
        │                                             │
        │  ExtractButton → tee/extract.ts             │
        └───────────────┬─────────────────────────────┘
                        │ bbox + date + layer
        ┌───────────────▼─────────────────────────────┐
        │  Backend  tee_service.py                     │
        │   fetch tiles/scene for {bbox, date, source} │
        │   compose into a single image (GeoTIFF/PNG)  │
        └───────────────┬─────────────────────────────┘
                        │ produces an image
        ┌───────────────▼─────────────────────────────┐
        │  EXISTING pipeline (unchanged)               │
        │   POST /api/upload  → image_id               │
        │   POST /api/query   → VQA/grounding/evidence │
        │   POST /api/analyze/change (two dates)       │
        └──────────────────────────────────────────────┘
```

### 15.2 Where the imagery comes from

TEE does not host imagery. It requests time-stamped tiles or scenes from open sources and
composes the selected rectangle into an image. Candidate sources (final choice recorded in
09-DECISIONS.md, licenses in 18-LICENSES-AND-CREDITS.md):
- **NASA GIBS** — time-stamped daily global tiles via a date-parameterized tile URL; simplest
  for the timeline scrubber; broad historical coverage of daily layers.
- **Landsat archive (USGS/AWS open data)** — for deep history (decades); accessed by STAC
  temporal search over a bbox + date range, then reading the relevant bands.
- **Sentinel-2** (recent optical) and **Sentinel-1** (SAR, optional) via STAC.

### 15.3 The one new backend endpoint

TEE needs exactly one new endpoint; everything after it reuses the existing API.

```
POST /api/tee/extract
Request:
{
  "bbox": [minLon, minLat, maxLon, maxLat],   // the drawn rectangle
  "date": "YYYY-MM-DD",                        // the timeline position
  "source": "gibs" | "landsat" | "sentinel2",  // which archive
  "bands": "rgb" | "multispectral"             // what to fetch
}
Response 200:
{
  "image_id": "string",   // ALREADY stored via the normal image store — reuses SQ-001 path
  "meta": { "width", "height", "bands", "date", "source", "bbox" }
}
Errors:
  400 NO_IMAGERY_FOR_DATE   // archive has no scene for that bbox+date (e.g. cloud gap)
  400 BBOX_TOO_LARGE        // area exceeds extract limit
  502 SOURCE_UNAVAILABLE    // upstream archive failed
```

The returned `image_id` is a normal image in the existing store, so `POST /api/query` and
`POST /api/analyze/change` work on it with zero changes. For change mode, TEE calls
`/api/tee/extract` twice (same bbox, two dates) then calls the existing change endpoint.

### 15.4 Co-registration (why change "just works" from the globe)

Because both extractions use the *same bbox* projected on the *same tile grid*, the two dated
images are already spatially aligned. This removes the manual co-registration step that
normally makes change detection hard — a concrete demo advantage worth stating to judges.

### 15.5 Isolation & offline-safety

TEE is lazy-loaded on its own route (`/tee`); disabling it cannot break the core (RULE 001).
For the demo, pre-fetch and cache a small set of dated tiles for two or three showcase
locations so TEE works with networking off (extends ticket SQ-025). Live archive fetching is
the online path; cached tiles are the demo-safe path.
