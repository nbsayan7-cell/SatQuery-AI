---
title: 7-Tier System Architecture
tags: [satquery, architecture]
type: architecture
status: verified
---

# 7-Tier System Architecture

SatQuery AI is organized into seven sequential operational layers:

```text
1. User Layer (React frontend, Leaflet MapViewer, TEE 3D Globe)
        ↓
2. Agent Layer (Query planning, NLP classification, tool selection)
        ↓
3. Validation Gate ([[G0-G8 Hard Scientific Gate]] — FAIL = STOP)
        ↓
4. Scientific Engine ([[🔬 Scientific Pipeline MOC]])
        ↓
5. Evidence Engine (GeoJSON vectorization, uncertainty intervals)
        ↓
6. AI Interpretation (VLM visual grounding + Ollama narration)
        ↓
7. User Answer (Briefing + Verified Metrics + Provenance Hash)
```

See also: [[Two-Lane Architecture]], [[Layer A - Core SatQuery]], [[Layer B - Temporal Earth Explorer]].\n