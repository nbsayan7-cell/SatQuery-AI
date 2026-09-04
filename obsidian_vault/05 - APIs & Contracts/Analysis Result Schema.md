---
title: Analysis Result Schema
tags: [satquery, api, contract]
type: data-contract
status: verified
---

# Analysis Result Schema

The immutable output contract emitted by the deterministic engine:

```json
{
  "execution_id": "sq-det-20260904-89f4b",
  "provenance": {
    "pipeline_version": "2.0.0",
    "git_commit": "a1b2c3d4",
    "input_sha256": "e3b0c442...",
    "metrics_sha256": "9f86d081..."
  },
  "spatial_alignment": {
    "crs": "EPSG:32645",
    "pixel_resolution_m": 10.0,
    "coregistration_rmse_m": 1.42,
    "alignment_status": "COREGISTRATION_PASSED"
  },
  "metrics_summary": {
    "changed_pixels": 14280,
    "changed_area_m2": 1428000.0,
    "changed_area_ha": 142.8,
    "mean_cvm": 0.418,
    "calculation_method": "jacobian_determinant"
  },
  "uncertainty_bounds": {
    "area_analytical_ui95_m2": [1390681.6, 1465318.4],
    "decomposed_confidence": {
      "data_quality_confidence": 0.940,
      "registration_confidence": 0.910,
      "overall_evidence_quality": 0.895
    }
  },
  "vector_features_geojson": { "type": "FeatureCollection", "features": [] }
}
```\n