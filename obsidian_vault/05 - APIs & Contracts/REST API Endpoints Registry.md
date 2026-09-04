---
title: REST API Endpoints Registry
tags: [satquery, api]
type: api-registry
status: verified
---

# REST API Endpoints Registry

Complete matrix of all 17 FastAPI endpoints in SatQuery AI:

| Route Path | Method | File | Purpose |
|:---|:---:|:---|:---|
| `/api/health` | `GET` | `backend/routes/health.py` | Liveness and GPU memory stats |
| `/api/upload` | `POST` | `backend/routes/upload.py` | GeoTIFF/PNG upload and validation |
| `/api/query` | `POST` | `backend/routes/query.py` | NLP query routing and execution |
| `/api/compare` | `POST` | `backend/routes/compare.py` | Basic bi-temporal differencing |
| `/api/caption` | `POST` | `backend/routes/caption.py` | Remote-sensing caption generation |
| `/api/fusion` | `POST` | `backend/routes/fusion.py` | Optical + SAR all-weather fusion |
| `/api/chat` | `POST` | `backend/routes/chat.py` | Multi-turn analyst conversation |
| `/api/audit` | `GET` | `backend/routes/audit.py` | Audit logs and SHA-256 retrieval |
| `/api/analyze/region` | `POST` | `backend/routes/region.py` | ROI cropping & super-resolution |
| `/api/analyze/change` | `POST` | `backend/routes/change.py` | Multi-region change segmentation |
| `/api/analyze/escalate` | `POST` | `backend/routes/escalate.py` | 4-stage confidence escalation |
| `/api/validate/pair` | `POST` | `backend/routes/pair_validator.py` | 8-level validation gate |
| `/api/benchmark/20` | `GET` | `backend/routes/benchmark.py` | Live 20-query test suite endpoint |
| `/api/tee/locations` | `GET` | `backend/routes/tee.py` | Curated showcase locations |
| `/api/tee/timeline` | `GET` | `backend/routes/tee.py` | Historical observation timeline |
| `/api/tee/extract` | `POST` | `backend/routes/tee.py` | Imagery extraction into baseline |
| `/api/artifacts/{path}` | `GET` | `backend/routes/artifacts.py` | Serves masks, heatmaps, GeoJSON |\n