---
title: Two-Lane Architecture
tags: [satquery, architecture, core]
type: architecture
status: verified
---

# Two-Lane Architecture

The defining structural design of SatQuery AI is the **strict physical isolation** between numerical computation and natural-language narration.

```text
                           ┌──────────────────────────────┐
     Image Pair ──────────►│  DETERMINISTIC NUMERIC LANE  │──► Exact Numbers, Masks,
     (Optical + SAR)       │  (pipeline/ in pure NumPy)   │    Polygons, Uncertainty
                           └──────────────┬───────────────┘
                                          │ Verified JSON (Numbers never edited)
     User Query ──────────►┌──────────────▼───────────────┐
                           │   INTERPRETIVE AI LANE       │──► Human Explanation,
                           │   (ai/ via VLM + Ollama)     │    Grounded Visual Tags
                           └──────────────┬───────────────┘
                                          ▼
                               [[Analysis Result Schema]]
```

## Lane 1: Deterministic Numeric Lane (`pipeline/`)
- Sole numeric authority.
- Executes [[Subpixel Phase Cross-Correlation]], [[Feature-Standardized CVM]], and [[Affine Jacobian Ground Area]].
- Emits cryptographic [[SHA-256 Provenance Fingerprint]].
- **Zero LLM code allowed in this lane.**

## Lane 2: Interpretive AI Lane (`ai/`)
- Uses [[SatQuery Orchestration Agent]] and [[VLM vs LLM vs Ollama vs vLLM]].
- Consumes verified JSON numbers and translates them into plain-language briefings.
- Follows the [[Fundamental Law of SatQuery]]: *"The AI may interpret the evidence. It may not manufacture the evidence."*\n