# 23 — Remote Sensing Repository & Model Registry

**Status:** Living Document  
**Target:** ISRO / SIH26167 — SatQuery AI Specialist Ecosystem  
**Hardware Target:** NVIDIA RTX 4060 8GB / Local GPU + Edge Deployment  

> **Core Architecture Principle:** SatQuery AI does not rely on a single monolithic generic model. It operates as an **Agentic Specialist Ecosystem**: an orchestration layer routes user queries and multimodal imagery to domain-adapted remote-sensing specialist models (VQA, Captioning, Grounding, Change Detection, SAR Processing, and Cross-Modal Fusion).

---

## 1. Top 15 Core Specialist Repositories

| # | Repository | Category | Architecture / Backbone | SatQuery Role | License | Integration Status |
|---|------------|----------|-------------------------|---------------|---------|--------------------|
| 1 | [isaaccorley/goldeneye](https://github.com/isaaccorley/goldeneye) | Geospatial VLM | Multi-Agent Dispatch (DescribeEarth, GeoChat, GeoLLaVA) | Core VLM dispatcher for VQA & Scene Descriptions | Apache-2.0 | 🔥 Primary Candidate |
| 2 | [torchgeo/torchgeo](https://github.com/torchgeo/torchgeo) | Geospatial ML | PyTorch domain library, Sentinel-1/2 pretrained | Input transform, multispectral CRS projection & ingestion | MIT | 🔥 Core Dependency |
| 3 | [zhu-xlab/DOFA](https://github.com/zhu-xlab/DOFA) | Foundation Model | Multimodal Vision Transformer (Optical + SAR) | Optical + SAR joint representation backbone | Apache-2.0 | 🔥 Fusion Specialist |
| 4 | [IntelliSensing/UniRS](https://github.com/IntelliSensing/UniRS) | Multi-Temporal VLM | Dual-temporal vision-language framework | Bi-temporal change question answering & description | Apache-2.0 | 🔥 Change Specialist |
| 5 | [VisionXLab/GeoGround](https://github.com/VisionXLab/GeoGround) | RS Visual Grounding | LLaVA-based spatial reference model, refGeo | Natural language text-to-bbox grounding | Apache-2.0 | 🔥 Grounding Specialist |
| 6 | [opengeos/segment-geospatial](https://github.com/opengeos/segment-geospatial) | Geospatial SAM | Segment Anything (SAM / HQ-SAM) for GeoTIFF | Interactive mask extraction & polygon evidence | MIT | 🔥 Evidence Engine |
| 7 | [likyoo/open-cd](https://github.com/likyoo/open-cd) | Change Detection | Deep supervised change networks (IFN, ChangeFormer) | Normalized difference & change mask generation | Apache-2.0 | 🔥 Change Engine |
| 8 | [TianHuiLab/Falcon](https://github.com/TianHuiLab/Falcon) | Multi-task RS VLM | Compact 0.3B & 0.7B parameter foundation models | Low-latency local edge inference on RTX 4060 | MIT | 🔥 Lightweight VLM |
| 9 | [opendatalab/VHM](https://github.com/opendatalab/VHM) | RS VLM | CLIP-14-336 + Vicuna-7B (VersaD 1.4M captions) | High-fidelity satellite scene captioning | Apache-2.0 | Benchmark Candidate |
| 10 | [learncsai/SAR-ML-Fusion](https://github.com/learncsai/SAR-ML-Fusion) | Multimodal Fusion | Dual RGB + SAR Encoders | Feature concatenation & cloud-penetration segmentation | MIT | 🔥 Fusion Reference |
| 11 | [hi-paris/deepdespeckling](https://github.com/hi-paris/deepdespeckling) | SAR Preprocessing | MERLIN / SAR2SAR deep filter | Sentinel-1 SAR speckle reduction & noise filtering | GPL-3.0 | SAR Preprocessor |
| 12 | [nvhuynh16/Sentinel-Sat-SAR](https://github.com/nvhuynh16/Sentinel-Sat-SAR) | Sentinel-1 Pipeline | End-to-end SAR acquisition & analysis | Temporal radar backscatter change workflows | MIT | Workflow Reference |
| 13 | [ikhado/sattxt](https://github.com/ikhado/sattxt) | Modern VLM | DINOv3 ViT-L/16 + Llama-3-8B | Satellite representation learning & embeddings | MIT | Research Baseline |
| 14 | [earth-insights/ZoomEarth](https://github.com/earth-insights/ZoomEarth) | Active Perception | Multi-scale active high-resolution inspection | Large-scale gigapixel scene interrogation | MIT | Future Phase (P2) |
| 15 | [Jingtao-Li-CVer/AnomalyCD](https://github.com/Jingtao-Li-CVer/AnomalyCD) | Temporal Anomaly | Bi-temporal change + SAM | Unusual land modification & disaster anomaly detection | MIT | Disaster Extension |

---

## 2. Model Dispatch & Agent Routing Matrix

```
                          USER QUERY + IMAGERY
                                   │
                                   ▼
                         🧠 SATQUERY AGENT
                      (ai/orchestrator.py)
                                   │
            ┌──────────────────────┼──────────────────────┐
            ▼                      ▼                      ▼
    SINGLE-IMAGE           BI-TEMPORAL PAIR       CROSS-MODAL PAIR
   [Optical or SAR]          [T0 vs T1]            [Optical + SAR]
            │                      │                      │
   ┌────────┴────────┐             │                      │
   ▼                 ▼             ▼                      ▼
VQA / CAPTION     GROUNDING    CHANGE AGENT          FUSION AGENT
(GoldenEye/       (GeoGround/  (UniRS / Open-CD)    (DOFA / SAR-ML-Fusion)
 Falcon / Llama3)  segment-geo)   │                      │
   │                 │             │                      │
   └────────┬────────┴─────────────┴──────────────────────┘
            │
            ▼
     EVIDENCE ENGINE (ai/vision_utils.py + Ollama Copilot)
            │
            ├─► Natural Language Answer
            ├─► Bounding Box Overlays [x, y, w, h]
            ├─► Change & Backscatter Metrics
            └─► Auditable Trace Log & Confidence Score
```

---

## 3. Hardware & Memory Allocation (ASUS RTX 4060 8GB)

| Component | Target VRAM | Model Variant | Fallback / CPU Strategy |
|-----------|-------------|---------------|-------------------------|
| Local Orchestrator (Ollama) | ~4.5 GB | `llama3:latest` (4-bit quant) | Runs directly on GPU / CPU offload |
| Vision Extractor & CV Metrics | < 0.5 GB | PIL / NumPy / TorchGeo | Runs in system RAM (Fast CPU) |
| Lightweight Specialist (Falcon) | ~1.8 GB | Falcon 0.7B | Fits within remaining RTX 4060 VRAM |
| Bounding Box & Grounding | < 1.0 GB | GeoGround / Fast-SAM | Evaluated on demand |
| Total Concurrent Profile | **~6.8 GB / 8.0 GB** | **100% fits within demo hardware budget** |
