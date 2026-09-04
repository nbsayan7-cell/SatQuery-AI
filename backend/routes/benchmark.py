"""
Benchmark Route for 20 Priority NASA/ISRO Queries
Provides live execution and status retrieval endpoints for the SIH benchmark suite.
"""

from fastapi import APIRouter
from scripts.run_benchmark_20 import Benchmark20Harness

router = APIRouter()


@router.get("/benchmark/20")
def get_benchmark_results():
    """
    Executes and returns the 20 priority benchmark test suite evaluation.
    """
    report = Benchmark20Harness.run_all()
    return {
        "status": "success",
        "benchmark_report": report
    }
