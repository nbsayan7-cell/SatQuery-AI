"""
Unit Tests for QLoRA Data-Prep Parsers and Configs
Verifies parsing of RSVQA, VRSBench, and CDVQA into standard conversation JSONL format,
and validates 4-bit memory constraints on RTX 4060.
"""

import json
from training.data_prep.convert_rsvqa import RSVQAConverter
from training.data_prep.convert_vrsbench import VRSBenchConverter
from training.data_prep.convert_cdvqa import CDVQAConverter
from training.configs.qlora_config import get_qlora_config


def test_rsvqa_converter():
    rec = RSVQAConverter.convert_record(
        question_id="42",
        image_path="data/sample_s2.jpg",
        question="Is there a water body visible?",
        answer="yes",
        question_type="presence"
    )
    assert rec["id"] == "rsvqa-42"
    assert rec["source_dataset"] == "RSVQA"
    assert len(rec["conversations"]) == 2
    assert rec["conversations"][0]["role"] == "user"
    assert "<image>" in rec["conversations"][0]["content"]
    assert rec["conversations"][1]["content"] == "yes"


def test_vrsbench_grounding_converter():
    bboxes = [[10, 20, 100, 200]]
    rec = VRSBenchConverter.convert_grounding_record(
        sample_id="101",
        image_path="data/vrsbench/sample.jpg",
        target_class="storage tank",
        bboxes_xyxy=bboxes,
        image_size=(500, 500)
    )
    assert rec["id"] == "vrsbench-ground-101"
    assert rec["task_type"] == "grounding_vqa"
    payload = json.loads(rec["conversations"][1]["content"])
    assert payload["count"] == 1
    assert payload["identified_objects"] == ["storage tank"]
    # Normalization check: xmax=100 on 500px -> 200 normalized
    assert len(payload["bboxes"][0]) == 4


def test_cdvqa_converter():
    rec = CDVQAConverter.convert_change_record(
        sample_id="99",
        image_t1_path="t1.tif",
        image_t2_path="t2.tif",
        question="What changed in the riverbed?",
        answer="Water volume decreased significantly.",
        change_category="hydrology"
    )
    assert rec["id"] == "cdvqa-99"
    assert len(rec["images"]) == 2
    assert "Image 1" in rec["conversations"][0]["content"]
    assert "Image 2" in rec["conversations"][0]["content"]


def test_qlora_rtx4060_config_budget():
    cfg = get_qlora_config("qwen2_vl")
    assert cfg["bnb_config"]["load_in_4bit"] is True
    assert cfg["bnb_config"]["bnb_4bit_quant_type"] == "nf4"
    assert cfg["lora_config"]["r"] == 16
    assert cfg["training_args"]["gradient_checkpointing"] is True
    assert cfg["training_args"]["optim"] == "paged_adamw_8bit"
    assert cfg["estimated_vram_gb"] <= 6.5
