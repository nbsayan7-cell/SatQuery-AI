---
title: LLM Non-Pollution Contract
tags: [satquery, gate, security]
type: contract
status: verified
---

# LLM Non-Pollution Contract

The technical contract guaranteeing that LLM text generation is strictly downstream:
1. LLMs are never imported in `pipeline/`.
2. All numbers in UI are populated from `analysis_result.metrics_summary`, not LLM strings.
3. Every response contains a SHA-256 hash of the exact numeric metrics ([[SHA-256 Provenance Fingerprint]]).\n