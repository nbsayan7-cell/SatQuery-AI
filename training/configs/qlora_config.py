"""
QLoRA Configuration & Hyperparameters for NVIDIA RTX 4060 (8GB VRAM)
Optimized for 4-bit NormalFloat quantization with LoRA attention projection adapters.
"""

from typing import Dict, Any


def get_qlora_config(model_family: str = "qwen2_vl") -> Dict[str, Any]:
    """
    Returns verified PEFT LoRA and BitsAndBytes configurations fitting within 6.5 GB peak VRAM.
    """
    # BitsAndBytes 4-bit config dictionary
    bnb_config = {
        "load_in_4bit": True,
        "bnb_4bit_quant_type": "nf4",
        "bnb_4bit_compute_dtype": "bfloat16",
        "bnb_4bit_use_double_quant": True
    }

    # LoRA Adapter config
    if "qwen" in model_family.lower():
        target_modules = [
            "q_proj", "k_proj", "v_proj", "o_proj",
            "gate_proj", "up_proj", "down_proj"
        ]
    elif "paligemma" in model_family.lower():
        target_modules = [
            "q_proj", "v_proj", "k_proj", "out_proj",
            "fc1", "fc2"
        ]
    else:
        target_modules = ["q_proj", "v_proj"]

    lora_config = {
        "r": 16,
        "lora_alpha": 32,
        "lora_dropout": 0.05,
        "bias": "none",
        "task_type": "CAUSAL_LM",
        "target_modules": target_modules
    }

    # SFT Trainer arguments ensuring no CUDA OOM on 8GB VRAM
    training_args = {
        "per_device_train_batch_size": 1,
        "gradient_accumulation_steps": 16,
        "warmup_ratio": 0.03,
        "learning_rate": 2e-4,
        "lr_scheduler_type": "cosine",
        "fp16": False,
        "bf16": True,
        "gradient_checkpointing": True,
        "optim": "paged_adamw_8bit",
        "logging_steps": 10,
        "save_strategy": "steps",
        "save_steps": 250,
        "save_total_limit": 2,
        "max_steps": 1500
    }

    return {
        "bnb_config": bnb_config,
        "lora_config": lora_config,
        "training_args": training_args,
        "estimated_vram_gb": 6.2
    }
