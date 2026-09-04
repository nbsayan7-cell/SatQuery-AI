---
title: Confidence Escalation Engine
tags: [satquery, ai, escalation]
type: architecture
status: verified
---

# Confidence Escalation Engine

Implemented in `ai/escalation_engine.py`:
1. **Stage 1 — Spatial 2x2 Tiling:** Crops high-resolution sub-tiles to recover micro-structures lost in whole-scene downsampling.
2. **Stage 2 — Test-Time Augmentation (TTA):** Rotates and flips inputs to eliminate geometric orientation artifacts.
3. **Stage 3 — Radar Cross-Referencing:** Validates optical change against SAR backscatter deltas.
4. **Stage 4 — LLM Reconciliation:** Resolves cross-stage discrepancies into verified consensus.

See [[Empirical Escalation Benchmark]].\n