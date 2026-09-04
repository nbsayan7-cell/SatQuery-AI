"""
CDVQA Dataset Parser
Converts Change Detection Visual Question Answering bi-temporal triplets
into standard multi-image conversation instruction JSONL format.
"""

from typing import List, Dict, Any
import json
import os


class CDVQAConverter:
    """
    Parses bi-temporal change reasoning triplets into unified instruction format.
    """

    @staticmethod
    def convert_change_record(
        sample_id: str,
        image_t1_path: str,
        image_t2_path: str,
        question: str,
        answer: str,
        change_category: str = "urban_expansion"
    ) -> Dict[str, Any]:
        """
        Formats bi-temporal change conversation.
        """
        return {
            "id": f"cdvqa-{sample_id}",
            "source_dataset": "CDVQA",
            "task_type": "bitemporal_change_vqa",
            "images": [image_t1_path, image_t2_path],
            "conversations": [
                {
                    "role": "user",
                    "content": f"Image 1 (Time 1): <image>\nImage 2 (Time 2): <image>\nQuestion: {question}"
                },
                {
                    "role": "assistant",
                    "content": answer
                }
            ],
            "metadata": {
                "change_category": change_category
            }
        }
