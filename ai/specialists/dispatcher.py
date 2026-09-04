"""
Specialist Model Dispatcher for SatQuery AI.
Integrates directly with the cloned isaaccorley/goldeneye library and specialized RS models.
"""

import sys
from pathlib import Path
from typing import Dict, Any

# Hook into cloned GoldenEye package
GOLDENEYE_SRC = Path(__file__).resolve().parent.parent.parent / "repos" / "goldeneye" / "src"
GOLDENEYE_MODELS = {}
if GOLDENEYE_SRC.exists():
    if str(GOLDENEYE_SRC) not in sys.path:
        sys.path.insert(0, str(GOLDENEYE_SRC))
    try:
        from goldeneye.models.registry import _AGENT_REGISTRY
        GOLDENEYE_MODELS = _AGENT_REGISTRY
    except Exception:
        pass

from ai.models.vqa import VQAModel
from ai.models.captioning import CaptioningModel
from ai.models.change_detection import ChangeDetectionModel
from ai.models.fusion import FusionModel

class SpecialistDispatcher:
    SPECIALISTS = {
        "DescribeEarth": CaptioningModel,
        "VHM": CaptioningModel,
        "GeoChat": VQAModel,
        "Falcon": VQAModel,
        "GeoGround": VQAModel,
        "UniRS": ChangeDetectionModel,
        "Open-CD": ChangeDetectionModel,
        "DOFA": FusionModel,
        "SAR-ML-Fusion": FusionModel,
    }

    @staticmethod
    def get_registered_specialists() -> list:
        return list(SpecialistDispatcher.SPECIALISTS.keys())

    @staticmethod
    def get_goldeneye_models() -> dict:
        return GOLDENEYE_MODELS

    @staticmethod
    async def dispatch(agent_name: str, **kwargs) -> Dict[str, Any]:
        """
        Dispatches inference to the designated remote sensing specialist.
        """
        if agent_name not in SpecialistDispatcher.SPECIALISTS:
            raise ValueError(f"Unknown specialist '{agent_name}'. Available: {list(SpecialistDispatcher.SPECIALISTS.keys())}")

        specialist = SpecialistDispatcher.SPECIALISTS[agent_name]

        if agent_name in ["UniRS", "Open-CD"]:
            return await specialist.analyze(kwargs.get("image_path_1"), kwargs.get("image_path_2"))
        elif agent_name in ["DOFA", "SAR-ML-Fusion"]:
            return await specialist.analyze(kwargs.get("image_path_opt"), kwargs.get("image_path_sar"))
        elif agent_name in ["DescribeEarth", "VHM"]:
            return await specialist.analyze(kwargs.get("image_path"), kwargs.get("query", "Describe this image"))
        else:
            return await specialist.analyze(kwargs.get("image_path"), kwargs.get("query"))
