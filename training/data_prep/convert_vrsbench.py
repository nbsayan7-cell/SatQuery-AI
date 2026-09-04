"""
VRSBench Dataset Parser
Converts VRSBench remote sensing visual grounding, captioning, and QA annotations
into standard conversation instruction JSONL format.
"""

from typing import List, Dict, Any
import json
import os


class VRSBenchConverter:
    """
    Parses VRSBench captioning and object grounding into structured instructions.
    """

    @staticmethod
    def convert_grounding_record(
        sample_id: str,
        image_path: str,
        target_class: str,
        bboxes_xyxy: List[List[int]],
        image_size: tuple = (512, 512)
    ) -> Dict[str, Any]:
        """
        Formats object grounding bounding box coordinates normalized to [0, 1000].
        """
        w, h = image_size
        normalized_boxes = []
        for box in bboxes_xyxy:
            xmin, ymin, xmax, ymax = box
            n_xmin = int((xmin / w) * 1000)
            n_ymin = int((ymin / h) * 1000)
            n_xmax = int((xmax / w) * 1000)
            n_ymax = int((ymax / h) * 1000)
            normalized_boxes.append([n_ymin, n_xmin, n_ymax, n_xmax])

        content_out = {
            "identified_objects": [target_class],
            "count": len(normalized_boxes),
            "bboxes": normalized_boxes
        }

        return {
            "id": f"vrsbench-ground-{sample_id}",
            "source_dataset": "VRSBench",
            "task_type": "grounding_vqa",
            "images": [image_path],
            "conversations": [
                {
                    "role": "user",
                    "content": f"<image>\nDetect and locate all instances of '{target_class}' in this satellite scene. Return bounding boxes normalized to [0, 1000]."
                },
                {
                    "role": "assistant",
                    "content": json.dumps(content_out)
                }
            ]
        }
