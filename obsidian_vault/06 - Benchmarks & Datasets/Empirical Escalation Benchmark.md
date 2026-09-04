---
title: Empirical Escalation Benchmark
tags: [satquery, benchmark]
type: benchmark
status: verified
---

# Empirical Escalation Benchmark

Measured via `scripts/eval_escalation.py` on real test suite pairs:

| Sample ID | Baseline Conf | Escalated Conf | Delta | Baseline Groundings | Escalated Groundings | Baseline Latency | Escalated Latency |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `levir_urban_expansion` | 91.0% | 91.0% | **+0.0%** | 1 | **6** | 3090 ms | 6413 ms |
| `hanoi_multimodal` | 91.0% | 92.0% | **+1.0%** | 1 | **5** | 2734 ms | 9494 ms |
| `joplin_tornado_destruction` | 91.0% | 91.0% | **+0.0%** | 1 | **5** | 2745 ms | 6931 ms |\n