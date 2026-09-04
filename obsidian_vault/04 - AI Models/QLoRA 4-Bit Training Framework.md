---
title: QLoRA 4-Bit Training Framework
tags: [satquery, ai, training]
type: architecture
status: verified
---

# QLoRA 4-Bit Training Framework

Implemented in `training/train_qlora.py`:
- Targets 2–4B Vision-Language Models (e.g. UniRS, Qwen-VL).
- Employs 4-bit NormalFloat (NF4) BitsAndBytes quantization with LoRA adapters ($r=16, \alpha=32$).
- Peak VRAM footprint: $<6.5$ GB, running comfortably on an 8 GB RTX 4060.
- Rejects impossible claims of training 7B+ models from scratch during a hackathon.\n