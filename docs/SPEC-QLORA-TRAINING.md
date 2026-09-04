# 🧠 SatQuery AI — QLoRA Training & Data-Prep Specification (`training/`)

**Version:** 1.0 · **Target Package:** `training/` · **Status:** Complete Technical Specification  
**Architecture Alignment:** [docs/00-MASTER.md](file:///c:/Users/Sayan%20Saha/Downloads/sih/SatQuery-AI/docs/00-MASTER.md), [docs/03-RULES.md](file:///c:/Users/Sayan%20Saha/Downloads/sih/SatQuery-AI/docs/03-RULES.md) (RULE 005)

---

## 1. Executive Summary & Hardware Budget

### Hardware Reality
- **Target GPU:** NVIDIA GeForce RTX 4060 Laptop/Desktop (8 GB GDDR6 VRAM).
- **Core Principle:** We do **not** train from scratch. Full fine-tuning of 7B+ VLMs requires 80–160 GB VRAM and is impossible on an 8 GB device.
- **Feasible & Winning Approach:** Parameter-Efficient Fine-Tuning (**PEFT / QLoRA**) of small instruction Vision-Language Models (e.g., **PaliGemma 3B**, **Qwen2-VL 2B/3B**, or **Phi-3.5-Vision 4B**) quantized to 4-bit NormalFloat (`nf4`).
- **Memory Footprint:** 4-bit base model consumes ~2.2 GB VRAM; low-rank adapter weights + gradients with gradient checkpointing and batch size 1 consume ~3.8 GB VRAM. Total peak memory: **< 6.5 GB VRAM** (fits comfortably within 8 GB).

---

## 2. Directory Layout & Pipeline Components

```
training/
├── README.md
├── requirements-train.txt       # peft, bitsandbytes, transformers, trl, accelerate
├── data_prep/
│   ├── __init__.py
│   ├── convert_rsvqa.py        # Converts RSVQA-LR / RSVQA-HR to JSONL instruction format
│   ├── convert_vrsbench.py     # Converts VRSBench (caption, grounding, QA) to instruction format
│   ├── convert_cdvqa.py        # Converts CDVQA change-detection triplets to instruction format
│   └── unify_dataset.py        # Deduplicates, validates, and stratifies train/val/test splits
├── configs/
│   ├── qlora_paligemma_3b.py   # Training hyperparameters & BitsAndBytes config
│   └── deepspeed_zero2.json    # Offload / memory optimization config (optional)
├── train_qlora.py              # Main training execution script with HF SFTTrainer / TRL
└── eval/
    ├── benchmark_eval.py       # Zero-shot vs QLoRA comparison harness
    └── compute_metrics.py      # RSVQA accuracy, CIDEr for captioning, IoU for grounding
```

---

## 3. Data Preparation & Standard Instruction Schema

### 3.1 Source Dataset Roles
1. **RSVQA (Remote Sensing VQA):** Optical scenes with object count, presence, and comparison questions.
2. **VRSBench:** 29,614 high-resolution RS images with detailed captions, object grounding bounding boxes `[ymin, xmin, ymax, xmax]`, and visual QA.
3. **CDVQA:** Multi-temporal bi-temporal pairs with change-reasoning queries (e.g., *"What changed in the northwest sector between date 1 and date 2?"*).

### 3.2 Unified Instruction JSONL Format
All datasets are parsed into the unified conversational format accepted by Hugging Face `TRL` / `SFTTrainer`:

```json
{
  "id": "satquery-inst-0004821",
  "source_dataset": "VRSBench",
  "task_type": "grounding_vqa",
  "images": [
    "data/training_images/vrsbench_004821.jpg"
  ],
  "conversations": [
    {
      "role": "user",
      "content": "<image>\nDetect and locate all industrial storage tanks in this satellite scene. Return bounding boxes normalized to [0, 1000]."
    },
    {
      "role": "assistant",
      "content": "{\"identified_objects\": [\"storage tank\"], \"bboxes\": [[120, 340, 210, 430], [225, 345, 315, 435]], \"count\": 2}"
    }
  ]
}
```

For bi-temporal change queries (CDVQA):
```json
{
  "id": "satquery-inst-0019234",
  "source_dataset": "CDVQA",
  "task_type": "bitemporal_change",
  "images": [
    "data/training_images/cdvqa_0019234_t1.tif",
    "data/training_images/cdvqa_0019234_t2.tif"
  ],
  "conversations": [
    {
      "role": "user",
      "content": "Image 1 (Time 1): <image>\nImage 2 (Time 2): <image>\nHas there been new building construction in the center clearing?"
    },
    {
      "role": "assistant",
      "content": "Yes, between Time 1 and Time 2, approximately 3 new residential structures have been constructed in the central clearing, replacing former bare soil."
    }
  ]
}
```

---

## 4. QLoRA Training Configuration (RTX 4060 8GB Certified)

### 4.1 Hyperparameters
```python
# training/configs/qlora_config.py
from peft import LoraConfig
from transformers import BitsAndBytesConfig
import torch

# 4-Bit NormalFloat Quantization Config
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,
)

# LoRA Adapter Configuration
peft_config = LoraConfig(
    r=16,                         # Rank dimension
    lora_alpha=32,                # Scaling factor
    lora_dropout=0.05,
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj"
    ],
    bias="none",
    task_type="CAUSAL_LM"
)

# Training Hyperparameters
TRAIN_ARGS = {
    "per_device_train_batch_size": 1,
    "gradient_accumulation_steps": 16,     # Effective batch size = 16
    "warmup_ratio": 0.03,
    "learning_rate": 2e-4,
    "lr_scheduler_type": "cosine",
    "fp16": False,
    "bf16": True,
    "max_steps": 1500,                    # ~3.5 hours on RTX 4060
    "gradient_checkpointing": True,
    "optim": "paged_adamw_8bit",          # Paged optimizer prevents OOM spikes
    "logging_steps": 10,
    "save_strategy": "steps",
    "save_steps": 250,
    "save_total_limit": 2,
    "report_to": "tensorboard"
}
```

---

## 5. Harvard cs249r_book Methodology Integration

We adhere to the engineering standards set out in `harvard-edge/cs249r_book`:
1. **Data Provenance & Leakage Prevention:** Data is split by geographical tile and region before slicing into patches. We never allow patches from the same satellite pass or overlapping coordinate tiles to exist across both train and test splits.
2. **Quantization Calibration:** Post-training evaluation inspects activation distributions to ensure 4-bit double quantization does not induce significant degradation in vision projection layers.
3. **Reproducibility & Experiment Artifacts:** Every training run automatically logs:
   - Git commit hash
   - Dataset manifest hash
   - Exact `config.json`
   - TensorBoard training loss, evaluation loss, and learning rate curves.

---

## 6. Evaluation Harness & Verification

The evaluation script (`training/eval/benchmark_eval.py`) benchmarks:
1. **Zero-Shot Base Model** vs **QLoRA Fine-Tuned Model** on unseen test splits of RSVQA and VRSBench.
2. **Evaluation Metrics:**
   - **VQA Accuracy:** Exact match and BLEU score for categorical/numerical answers.
   - **Grounding IoU:** Intersection over Union of predicted bounding box coordinates against ground truth annotations (Target: $\text{mIoU} \ge 0.60$).
   - **Hallucination Rate:** Measured using negative control pairs (querying objects known not to exist in the scene; target $< 3\%$).
3. **Execution Command:**
   ```powershell
   python training/eval/benchmark_eval.py --base_model "Qwen/Qwen2-VL-2B-Instruct" --adapter_path "training/artifacts/qlora_adapter_final" --eval_dataset "data/eval_manifest.json"
   ```
   Results are saved directly to `docs/BENCHMARK-RESULTS.md` without manual tampering or fabrication (enforcing RULE 005).
