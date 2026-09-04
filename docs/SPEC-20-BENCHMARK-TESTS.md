# 🎯 SatQuery AI — 20 Priority Benchmark Test Suite Specification

**Version:** 2.0 · **Target Standard:** Research-grade remote-sensing analysis pipeline adhering to NASA/ISRO-inspired scientific processing principles (SIH26167)  
**Execution Hardware:** ASUS NVIDIA GeForce RTX 4060 (8 GB GDDR6 VRAM)  
**Verification Harness:** `scripts/run_benchmark_20.py` & `backend/tests/test_benchmark_20.py`

---

## 1. Executive Overview & Prioritized Query Matrix

This suite formalizes the 20 benchmark test cases covering all SIH problem requirements: single-image VQA, scene captioning, visual grounding, bi-temporal change detection, optical+SAR cross-modal fusion, and multi-step agent orchestration.

| **ID** | **Query (Natural Language)** | **Capability** | **Priority** | **Modality / Sensor** | **Reference Dataset** | **Target Threshold** |
|:-----:|:---|:---|:---:|:---|:---|:---|
| **Q01** | “Count all buildings visible in this image.” | Object Counting | P0 | Optical (Planet / 0.5m) | SpaceNet7 / LEVIR-CD | Count Error < 10%, IoU ≥ 0.60 |
| **Q02** | “Where are the water bodies and what is their total area (m²)?” | Water Segmentation & Area | P0 | Optical (S2 L2A 10m) | SpaceNet7 / BigEarthNet | Area Error < 10%, IoU ≥ 0.65 |
| **Q03** | “Describe the scene: list major objects and land cover types.” | Scene Captioning | P0 | Optical (S2 10m) | BigEarthNet / WorldView | CIDEr > 0.85, Precision ≥ 0.80 |
| **Q04** | “Locate and label all roads with bounding boxes.” | Road Grounding | P1 | Optical (Aerial 0.5m) | SpaceNet Roads / MassRoads | IoU ≥ 0.55, F1 ≥ 0.80 |
| **Q05** | “How many ships are visible? Provide bounding boxes and confidence.” | Maritime Detection | P1 | SAR (S1 GRD VV/VH) | HRSID / OpenSARShip | Precision ≥ 0.85, Recall ≥ 0.80 |
| **Q06** | “Show changes in built-up area between 2015 and 2025 (growth/decline).” | Bi-Temporal Change | P0 | Optical Bi-temporal | LEVIR-CD / SpaceNet7 | Change F1 ≥ 0.85, Area Err < 10% |
| **Q07** | “What was the percentage increase in forest cover between 2018 and 2023?” | Vegetation Change | P0 | Optical Bi-temporal | DynamicWorld / BigEarthNet | Area % Err < 5%, Delta NDVI |
| **Q08** | “Compare these two images (optical vs SAR) to map flooded areas.” | Cross-Modal Flood Mapping| P1 | Optical (S2) + SAR (S1) | Sen1-2 / CD2021 Flood | Water IoU ≥ 0.70, ENL > 30 |
| **Q09** | “Use SAR to detect water masks (optical may be cloudy).” | All-Weather Water Mapping | P1 | SAR (S1 GRD VV) | Sen1-2 / RADARSAT | Specular IoU ≥ 0.75 |
| **Q10** | “Combine optical and SAR to classify land cover (vegetation vs urban).” | Multimodal Classification | P2 | Optical (S2) + SAR (S1) | BigEarthNet S1+S2 | Macro F1 ≥ 0.82 |
| **Q11** | “Caption this image in one sentence.” | Concise Captioning | P1 | Optical / High-Res | RSICAP / Skyscript | BLEU-4 > 0.35, Zero Hallucination |
| **Q12** | “In this image, highlight (ground) the areas described by: ‘dense forest region’.” | Text Visual Grounding | P2 | Optical (S2 L2A) | RSVG / Ref-SAT | Grounding IoU ≥ 0.60 |
| **Q13** | “Agentic task: Identify flood risk zones; use SAR if optical cloudy.” | Agent Dynamic Routing | P1 | Dynamic Multi-Sensor | Copernicus Sentinel Hub | Modality Selection = SAR |
| **Q14** | “Agentic task: Count and confirm buildings using both sensors.” | Multi-Sensor Verification | P2 | S1 SAR + S2 Optical | Sen1-2 / SpaceNet7 | Double-Bounce Inlier Check |
| **Q15** | “Is this location showing land subsidence from 2010 to 2020?” | Deformation Analysis | P3 | SAR InSAR Coherence | S1 Interferometry | Subsidence Trend Validation |
| **Q16** | “Automatically formulate the steps to detect newly built roads.” | Agent Autonomous Planning | P3 | Optical Multi-temporal | OSM / Planet | Trace Completeness = 100% |
| **Q17** | “Robustness: Check building detection under heavy cloud.” | Cloud Robustness Gate | P4 | Clouded S2 + S1 Fallback | Sentinel-2 QA Bands | Fallback Gate Activated |
| **Q18** | “Robustness: Low-contrast desert scene, detect vehicles.” | Low-Contrast Stress Test | P4 | High-Res Panchromatic | MDPI SAR-SPOT / PRISMA | False Alarm Rate < 5% |
| **Q19** | “Temporal: Identify new crop fields after recent rainfall.” | Phenological Agriculture | P2 | Seasonal Sentinel-2 | Copernicus Agro Series | CUSUM Trend Detected |
| **Q20** | “Count cars before & after parking lot expansion (multi-step).” | Micro-Object Multi-Date | P3 | Sub-meter Aerial | SpaceNet / Local High-Res | Temporal Count Difference |

---

## 2. Standardized JSON Output Contract

Every test execution emits a structured JSON object strictly conforming to the scientific verification audit standard:

```json
{
  "query_id": "Q01",
  "capability": "object_counting",
  "input_metadata": {
    "crs": "EPSG:32633",
    "pixel_resolution_m": 0.5,
    "sensor": "PlanetScope-PSScene",
    "timestamp": "2024-05-12T06:30:00Z"
  },
  "results": {
    "label": "building",
    "count": 42,
    "area_m2": 123456.0,
    "area_ha": 12.3456,
    "polygons": [
      [[345120.0, 4512300.0], [345140.0, 4512300.0], [345140.0, 4512320.0], [345120.0, 4512300.0]]
    ],
    "confidence_source": 0.945,
    "model_used": "BuildingDetector-v1-S2",
    "execution_trace": [
      "Loaded image into CRS EPSG:32633",
      "Applied bilateral speckle suppression",
      "Segmented building polygon instances",
      "Verified geometric bounds"
    ]
  },
  "metrics": {
    "iou": 0.724,
    "precision": 0.880,
    "recall": 0.850,
    "f1": 0.865,
    "count_error_pct": 4.76,
    "area_error_pct": 3.82
  },
  "pass": true
}
```

---

## 3. Mathematical Metric Formulations & Acceptance Gates

1. **Intersection over Union (Jaccard Index):**
   $$\mathrm{IoU} = \frac{|\mathcal{G} \cap \mathcal{P}|}{|\mathcal{G} \cup \mathcal{P}|} \ge 0.60$$
2. **Precision, Recall, & F1:**
   $$\mathrm{Precision} = \frac{TP}{TP + FP}, \quad \mathrm{Recall} = \frac{TP}{TP + FN}, \quad F_1 = \frac{2 \cdot \mathrm{Precision} \cdot \mathrm{Recall}}{\mathrm{Precision} + \mathrm{Recall}} \ge 0.80$$
3. **Relative Area Error:**
   $$\mathrm{Err}_{\text{area}} = \frac{|A_{\text{pred}} - A_{\text{true}}|}{A_{\text{true}}} \times 100\% < 10.0\%$$
4. **Relative Counting Error:**
   $$\mathrm{Err}_{\text{count}} = \frac{|N_{\text{pred}} - N_{\text{true}}|}{N_{\text{true}}} \times 100\% < 10.0\%$$
5. **SAR Equivalent Number of Looks (ENL):**
   $$\mathrm{ENL} = \frac{\mu^2}{\sigma^2} \ge 30.0$$
6. **Expected Calibration Error (ECE):**
   $$\mathrm{ECE} = \sum_{m=1}^M \frac{|B_m|}{N} \left| \mathrm{acc}(B_m) - \mathrm{conf}(B_m) \right| < 0.10$$
