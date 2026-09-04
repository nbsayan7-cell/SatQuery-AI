"""
Canonical Structured Observation Schema for SatQuery AI.
Fulfills Section 7 of docs/prompts/MASTER-PROJECT-AUDIT-AND-IMPLEMENTATION-PROMPT.md.
"""

import uuid
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class ImageInputMetadata(BaseModel):
    image_count: int = 1
    sensor: Optional[str] = "Unknown"
    modality: str = "Optical"
    format: str = "Raster Image"
    acquisition_date: Optional[str] = None
    crs: Optional[str] = None
    georeferenced: bool = False

class TaskDefinition(BaseModel):
    type: str
    question: Optional[str] = None

class ObservationItem(BaseModel):
    label: str
    value: Optional[Any] = None
    unit: Optional[str] = None
    region: Optional[str] = None
    source: str = "specialist_model"
    confidence: Optional[float] = None

class SpatialEvidenceItem(BaseModel):
    type: str = "bbox"
    coordinates: List[Any] = []
    label: Optional[str] = None

class StructuredObservation(BaseModel):
    analysis_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    input: ImageInputMetadata
    task: TaskDefinition
    observations: List[ObservationItem] = []
    spatial_evidence: List[SpatialEvidenceItem] = []
    measurements: List[Dict[str, Any]] = []
    change: Optional[Dict[str, Any]] = None
    cross_modal: Optional[Dict[str, Any]] = None
    models: List[str] = []
    warnings: List[str] = []
    limitations: List[str] = []
    execution_trace: List[Dict[str, Any]] = []

    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()
