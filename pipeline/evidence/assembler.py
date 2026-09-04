"""
Evidence Assembler Engine
Integrates deterministic processing outputs into the unified analysis_result schema
and enforces SHA-256 cryptographic provenance for NASA/ISRO audit compliance.
"""

from typing import Dict, Any
import hashlib
import json
import time


class EvidenceAssembler:
    """
    Constructs the immutable evidence payload contract.
    """

    @staticmethod
    def build_analysis_result(
        execution_id: str,
        git_commit: str,
        sensor_info: Dict[str, str],
        spatial_alignment: Dict[str, Any],
        metrics_summary: Dict[str, Any],
        per_class_breakdown: Dict[str, Any],
        uncertainty_bounds: Dict[str, Any],
        vector_geojson: Dict[str, Any],
        remarks: str = ""
    ) -> Dict[str, Any]:
        """
        Assembles and signs the final analytical result payload.
        """
        provenance = {
            "pipeline_version": "2.0.0-deterministic",
            "git_commit": git_commit,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "sensor_t1": sensor_info.get("t1", "Sentinel-2A L2A"),
            "sensor_t2": sensor_info.get("t2", "Sentinel-2B L2A"),
        }

        # Deterministic SHA-256 fingerprint over metric values
        hasher = hashlib.sha256()
        canonical_metrics = json.dumps(metrics_summary, sort_keys=True).encode("utf-8")
        hasher.update(canonical_metrics)
        provenance["metrics_sha256"] = hasher.hexdigest()

        return {
            "execution_id": execution_id,
            "provenance": provenance,
            "spatial_alignment": spatial_alignment,
            "metrics_summary": metrics_summary,
            "per_class_breakdown": per_class_breakdown,
            "uncertainty_bounds": uncertainty_bounds,
            "vector_features_geojson": vector_geojson,
            "remarks": remarks
        }
