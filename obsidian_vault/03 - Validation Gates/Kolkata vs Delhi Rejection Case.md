---
title: Kolkata vs Delhi Rejection Demonstration
tags: [satquery, gate, demo]
type: demo-case
status: verified
---

# Kolkata vs Delhi Rejection Demonstration

The premier live demo case for SIH judges proving that SatQuery AI refuses to hallucinate:

## Inputs
- **Image A:** `location_a_kolkata.jpg` ($22.57^\circ\text{N}, 88.36^\circ\text{E}$)
- **Image B:** `location_b_delhi.jpg` ($28.61^\circ\text{N}, 77.20^\circ\text{E}$)

## Output from `POST /api/validate/pair`
```json
{
  "status": "REJECTED",
  "classification": "DIFFERENT_LOCATION",
  "decision": "BLOCK",
  "reason_codes": ["GEOGRAPHIC_MISMATCH", "ZERO_SPATIAL_OVERLAP"],
  "explanation": "❌ TEMPORAL ANALYSIS REJECTED: Input scenes represent completely different geographic regions (Kolkata vs Delhi; distance: ~1305.2 km; overlap: 0.00%).",
  "metrics": {
    "spatial_overlap_iou": 0.0,
    "spatial_distance_km": 1305.2,
    "llm_override_status": "DENIED"
  }
}
```

A standard VLM would hallucinate urban growth; SatQuery halts before executing any math.\n