import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = DATA_DIR / "uploads"

# Ensure upload directory exists
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Upload constraints
MAX_UPLOAD_MB = 50
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tif", ".tiff"}

# Precision Escalation Pipeline Constraints (SQ-037 / RULE 005)
ESCALATION_CONFIDENCE_THRESHOLD = float(os.environ.get("ESCALATION_CONFIDENCE_THRESHOLD", "0.75"))
ENABLE_TEST_TIME_AUGMENTATION = os.environ.get("ENABLE_TTA", "true").lower() == "true"
ENABLE_TILE_INFERENCE = os.environ.get("ENABLE_TILE_INFERENCE", "true").lower() == "true"
TILE_GRID_SIZE = int(os.environ.get("TILE_GRID_SIZE", "2"))  # 2x2 grid

