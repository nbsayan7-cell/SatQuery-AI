---
title: VLM vs LLM vs Ollama vs vLLM Taxonomy
tags: [satquery, ai, taxonomy]
type: concept
status: verified
---

# VLM vs LLM vs Ollama vs vLLM Taxonomy

To eliminate confusion in judging, SatQuery enforces strict taxonomy:

| Concept | True Nature in SatQuery | Used In |
|:---|:---|:---|
| **VLM** | Vision-Language Model capability (UniRS, DOFA, VRSBench) connecting visual patches with semantic text | VQA, Grounding, Captioning |
| **LLM** | Pure language reasoning and scientific narration engine | Explaining verified JSON |
| **Ollama** | Local, offline CPU/GPU inference server hosting model weights | Edge deployment (`localhost:11434`) |
| **vLLM** | High-throughput distributed inference engine | Cloud/cluster serving |\n