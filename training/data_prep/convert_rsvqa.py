"""
RSVQA Dataset Parser
Converts RSVQA Low-Resolution (LR) and High-Resolution (HR) JSON dumps
into standard conversation instruction JSONL format.
"""

from typing import List, Dict, Any
import json
import os


class RSVQAConverter:
    """
    Parses RSVQA datasets into instruction fine-tuning JSONL pairs.
    """

    @staticmethod
    def convert_record(
        question_id: str,
        image_path: str,
        question: str,
        answer: str,
        question_type: str = "presence"
    ) -> Dict[str, Any]:
        """
        Creates a single unified conversational instruction entry.
        """
        return {
            "id": f"rsvqa-{question_id}",
            "source_dataset": "RSVQA",
            "task_type": f"vqa_{question_type}",
            "images": [image_path],
            "conversations": [
                {
                    "role": "user",
                    "content": f"<image>\n{question}"
                },
                {
                    "role": "assistant",
                    "content": str(answer)
                }
            ]
        }

    @classmethod
    def convert_file(cls, input_json_path: str, output_jsonl_path: str, img_dir_prefix: str = "data/rsvqa/"):
        """
        Converts full RSVQA JSON dataset to standard instruction JSONL.
        """
        if not os.path.exists(input_json_path):
            return 0

        with open(input_json_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)

        questions = raw_data.get("questions", [])
        answers = {a["id"]: a["answer"] for a in raw_data.get("answers", [])}
        images = {img["id"]: img["image"] for img in raw_data.get("images", [])}

        records_written = 0
        with open(output_jsonl_path, "w", encoding="utf-8") as out:
            for q in questions:
                qid = str(q.get("id"))
                ans = answers.get(q.get("answers_ids", [None])[0], "")
                img_name = images.get(q.get("img_id"), f"{q.get('img_id')}.tif")
                img_full_path = os.path.join(img_dir_prefix, img_name).replace("\\", "/")

                rec = cls.convert_record(
                    question_id=qid,
                    image_path=img_full_path,
                    question=q.get("question", ""),
                    answer=ans,
                    question_type=q.get("type", "presence")
                )
                out.write(json.dumps(rec) + "\n")
                records_written += 1

        return records_written
