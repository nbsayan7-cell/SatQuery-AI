---
title: 6 Hard Questions & Answers
tags: [satquery, defense]
type: defense-qa
status: verified
---

# 6 Hard Questions & Answers

1. **"Show me the code."**
   Point to `pipeline/change_detect/metrics.py` (standardized CVM) and `ai/pair_validator.py` (bounding box overlap gate). Note zero LLM imports in `pipeline/`.
2. **"Show me the dataset."**
   Open `data/test_suite/` showing LEVIR-CD, Joplin, Hanoi, and Kolkata/Delhi pairs.
3. **"Show me the ground truth."**
   Show sidecar metadata JSONs and ground-truth binary masks in `data/test_suite/`.
4. **"Show me the prediction mask."**
   Open `/api/artifacts/{id}/change_mask.png` and clickable GeoJSON polygons on the MapViewer.
5. **"Show me how that confidence was calculated."**
   Explain the 5-axis uncertainty formula in `pipeline/evidence/uncertainty.py` and analytical perimeter error bounds.
6. **"Run it again / Change the image."**
   Upload a new pair live; trigger `POST /api/analyze/change` and inspect live FFT coregistration and SHA-256 fingerprint generation.\n