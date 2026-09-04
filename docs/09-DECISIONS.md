# 🧩 SatQuery AI — Architecture Decision Records (ADRs)

> **Purpose:** Record *why* we chose what we chose, so six weeks later no agent randomly
> rewrites the backend. One entry per meaningful, hard-to-reverse decision.

---

## Decision #007 — Backend framework
Date: 2026-09-02 Status: Accepted Question: FastAPI (Python) vs Node.js/Express for the API? Decision: FastAPI. Reason: The entire remote-sensing AI/ML pipeline (PyTorch, transformers, rasterio) is Python. One language = no cross-process bridge, simpler for a beginner team. Alternatives considered: Node.js/Express. Rejected because: would require a second Python service just for inference, adding an IPC boundary, more deployment surface, and more failure modes. Consequences: Team must be comfortable with async Python; we get automatic OpenAPI docs. Reversible? Costly after Phase 4.