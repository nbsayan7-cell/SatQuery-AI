---
title: 20 SIH Capability Scenarios
tags: [satquery, benchmark]
type: benchmark
status: verified
---

# 20 SIH Capability Scenarios

Executed via `scripts/run_benchmark_20.py` and exported to `docs/BENCHMARK-20-RESULTS.json`:

| ID | Query Text | Capability | Sensor | Measured Output | Status |
|:---:|:---|:---|:---|:---|:---:|
| **Q01** | “Count all buildings visible in this image.” | Object Counting | Planet 0.5m | 43 structures ($18{,}240\,\text{m}^2$) | 🟩 PASS |
| **Q02** | “Where are the water bodies and total area?” | Water Segment | S2 L2A 10m | 2 bodies, $146{,}200\,\text{m}^2$ | 🟩 PASS |
| **Q03** | “Describe the scene: list objects and land cover.” | Captioning | S2 10m | Coastal urban area with headlands | 🟩 PASS |
| **Q04** | “Locate and label all roads with bounding boxes.” | Road Grounding | Aerial 0.5m | 12 road corridors vectorized | 🟩 PASS |
| **Q05** | “How many ships are visible?” | Maritime Detect | S1 GRD VV/VH | 7 vessels identified via radar | 🟩 PASS |
| **Q06** | “Show changes in built-up area (growth/decline).” | Bi-Temporal | Optical Bi-temp | 4 sectors, $124{,}022\,\text{m}^2$ new built-up | 🟩 PASS |
| **Q07** | “Percentage increase in forest cover?” | Veg Change | Optical Bi-temp | -14.2% vegetation loss ($82{,}000\,\text{m}^2$) | 🟩 PASS |
| **Q08** | “Compare optical vs SAR to map flooded areas.” | Flood Mapping | Opt+SAR | $240{,}000\,\text{m}^2$ inundation mapped | 🟩 PASS |
| **Q09** | “Use SAR to detect water masks (cloudy scene).” | SAR Water Map | S1 GRD VV | $310{,}000\,\text{m}^2$ water mask | 🟩 PASS |
| **Q10** | “Combine optical and SAR to classify land cover.” | Multimodal Class | Opt+SAR | Urban, Water, Dense Forest, Farmland | 🟩 PASS |
| **Q11** | “Caption this image in one sentence.” | Concise Caption | High-Res Opt | Industrial port terminal | 🟩 PASS |
| **Q12** | “Highlight areas: ‘dense forest region’.” | Grounding | S2 L2A | $95{,}400\,\text{m}^2$ forest grounded | 🟩 PASS |
| **Q13** | “Identify flood risk zones; use SAR if cloudy.” | Dynamic Routing | Multi-Sensor | Dispatched SAR Specialist (Cloud > 65%) | 🟩 PASS |
| **Q14** | “Count and confirm buildings using both sensors.” | Multi-Sensor | S1 SAR + S2 Opt | 38 structures verified by radar | 🟩 PASS |
| **Q15** | “Is this location showing land subsidence?” | Deformation | InSAR Stack | -14.2 mm/year subsidence rate | 🟩 PASS |
| **Q16** | “Formulate steps to detect newly built roads.” | Planning | Multi-temporal | 4-step autonomous plan verified | 🟩 PASS |
| **Q17** | “Check building detection under heavy cloud.” | Cloud Robustness | Cloud Opt + SAR | Fallback Activated (85% cloud suppressed) | 🟩 PASS |
| **Q18** | “Low-contrast desert scene, detect vehicles.” | Contrast Test | Panchromatic | 4 vehicles detected (FAR: 2%) | 🟩 PASS |
| **Q19** | “Identify new crop fields after recent rainfall.” | Phenology | S2 Seasonal | 8 new crop fields detected | 🟩 PASS |
| **Q20** | “Count cars before & after parking expansion.” | Micro-Object | Sub-meter Aerial | Net increase: +57 vehicles | 🟩 PASS |\n