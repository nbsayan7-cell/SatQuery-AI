import json
from pathlib import Path
from datetime import datetime, timezone
from backend.config import DATA_DIR

AUDIT_LOG_FILE = DATA_DIR / "audit_log.json"

class AuditService:
    @staticmethod
    def _ensure_file():
        if not AUDIT_LOG_FILE.exists():
            AUDIT_LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
            with open(AUDIT_LOG_FILE, "w") as f:
                json.dump([], f)

    @staticmethod
    def log(image_id: str, query: str, result: dict):
        AuditService._ensure_file()
        
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "image_id": image_id,
            "query": query,
            "answer": result.get("answer"),
            "confidence": result.get("confidence"),
            "model_used": result.get("model_used")
        }
        
        with open(AUDIT_LOG_FILE, "r+") as f:
            try:
                logs = json.load(f)
            except json.JSONDecodeError:
                logs = []
                
            logs.insert(0, log_entry) # Insert at top
            
            f.seek(0)
            f.truncate()
            json.dump(logs, f, indent=2)

    @staticmethod
    def get_logs(limit: int = 50):
        AuditService._ensure_file()
        with open(AUDIT_LOG_FILE, "r") as f:
            try:
                logs = json.load(f)
                return logs[:limit]
            except json.JSONDecodeError:
                return []
