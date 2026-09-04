# SatQuery AI — Test Data Manifest

**Status:** Active Benchmark Specification  
**Location:** `data/test_suite/`  
**Purpose:** Fixed validation dataset for continuous regression and live SIH demonstrations.

---

## 1. Test Suite Architecture

```
data/test_suite/
├── 01_same_place_different_time/      # SET A: LEVIR-CD building & urban change
│   ├── levir_2020.jpg
│   └── levir_2024.jpg
├── 02_same_place_no_major_change/     # SET B: Illumination/temporal control (false-positive prevention)
│   ├── hanoi_t0.jpg
│   └── hanoi_t1_nochange.jpg
├── 03_disaster_before_after/          # SET C: xView2 pre/post disaster assessment
│   ├── joplin_pre.jpg                 # Joplin Tornado baseline
│   ├── joplin_post.jpg                # Joplin Tornado destruction
│   ├── wildfire_pre.jpg               # Santa Rosa Wildfire pre-event
│   └── wildfire_post.jpg              # Santa Rosa Wildfire burn scar
├── 04_same_place_optical_sar/         # SET D: SEN12MS co-registered cross-modal pair
│   ├── sen12ms_optical.jpg            # Optical Sentinel-2
│   └── sen12ms_sar.jpg                # Synthetic Aperture Radar Sentinel-1 (VV/VH)
├── 05_sar_only/                       # SET E: Microwave radar interpretation
│   └── sentinel1_sar.jpg              # Backscatter & specular absorption analysis
└── 06_different_place/                # SET F: Spatial mismatch rejection test
    ├── location_a_kolkata.jpg         # Geographic point 1 (Delta/River)
    └── location_b_delhi.jpg           # Geographic point 2 (Urban settlement grid)
```

---

## 2. Test Cases & Expected Behaviors

### Test Case 1: Spatial Mismatch Rejection (SET 06)
- **Input:** `location_a_kolkata.jpg` vs `location_b_delhi.jpg`
- **Query:** *"What changed between these two images?"*
- **Expected Outcome:**
  ```text
  ❌ TEMPORAL ANALYSIS REJECTED
  Reason: Input scenes cannot be verified as representing the same geographic location.
  Spatial cross-correlation and land-cover geometry do not match.
  Recommendation: Provide co-registered multi-temporal scenes.
  ```

### Test Case 2: Disaster Damage Assessment (SET 03 — xView2)
- **Input:** `joplin_pre.jpg` vs `joplin_post.jpg`
- **Query:** *"What happened after the disaster? Assess building damage."*
- **Expected Outcome:**
  - Detect high structural anomaly (> 40% difference index).
  - Highlight destroyed residential structures.
  - Return high confidence damage localization.

### Test Case 3: False-Positive Suppression (SET 02)
- **Input:** `hanoi_t0.jpg` vs `hanoi_t1_nochange.jpg`
- **Query:** *"Has the built-up area increased?"*
- **Expected Outcome:**
  - Detect change percentage < 2.0%.
  - Output: *"No significant structural change detected between T0 and T1."*

### Test Case 4: Multimodal Cross-Modal Fusion (SET 04 — SEN12MS)
- **Input:** `sen12ms_optical.jpg` + `sen12ms_sar.jpg`
- **Query:** *"Use both sensors to map water and built structures through clouds."*
- **Expected Outcome:**
  - Optical supplies spectral contextual boundaries.
  - SAR supplies double-bounce corner reflection and all-weather specular water absorption.
  - Output: *"Fusion analysis complete."* with > 94% confidence.
