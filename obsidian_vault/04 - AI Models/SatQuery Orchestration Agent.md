---
title: SatQuery Orchestration Agent
tags: [satquery, ai, agent]
type: architecture
status: verified
---

# SatQuery Orchestration Agent

Implemented in `ai/query_planner.py` and `backend/routes/query.py`.
- Classifies user intent into: `single_vqa`, `captioning`, `grounding`, `change_detection`, `fusion`.
- Decomposes multi-step questions into executable tool sequences.
- Dispatches domain specialists ([[Building Detection Specialist]], [[Water Segmentation Specialist]], [[Optical-SAR Fusion Specialist]]).\n