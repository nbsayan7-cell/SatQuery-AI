"""
Automated Pytest Suite for the 20 Priority NASA/ISRO Benchmark Queries
Verifies all 20 test cases pass metric thresholds (IoU, F1, counting, area %, cloud fallback).
"""

import pytest
from scripts.run_benchmark_20 import Benchmark20Harness


def test_benchmark_20_complete_suite():
    """Verify all 20 priority test queries execute and pass acceptance gates."""
    summary = Benchmark20Harness.run_all()
    assert summary["total_queries"] == 20
    assert summary["passed_queries"] == 20
    assert summary["overall_pass"] is True


@pytest.mark.parametrize("query_id,expected_cap", [
    ("Q01", "Object Counting"),
    ("Q02", "Water Segmentation"),
    ("Q03", "Scene Captioning"),
    ("Q06", "Bi-Temporal Change"),
    ("Q08", "Cross-Modal Flood Mapping"),
    ("Q09", "SAR Water Mapping"),
    ("Q13", "Agent Dynamic Routing"),
    ("Q17", "Cloud Robustness Gate")
])
def test_benchmark_individual_key_queries(query_id, expected_cap):
    """Verify critical queries independently satisfy NASA/ISRO scientific standards."""
    res = Benchmark20Harness.evaluate_case(query_id, "Test Query", expected_cap, "P0")
    assert res["pass"] is True
    assert res["capability"] == expected_cap
    assert "execution_trace" in res["results"] or "status" in res["results"] or "decision" in res["results"]
