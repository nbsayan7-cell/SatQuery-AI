# 🛰️ SatQuery AI

**An Intelligent, Multi-Modal Satellite Analytics Platform**

SatQuery AI is a modern intelligence platform designed to parse terabytes of satellite imagery using natural language. Built for defense and disaster response, it reduces hours of manual analysis to seconds by leveraging an Agent Orchestrator to route queries to specialized AI models.

## Features (SIH R1-R7 Capabilities)
- 🗣️ **Natural Language VQA (R1)**: Ask specific questions ("Count ships") and get grounded answers.
- 📝 **Scene Captioning (R2a)**: Instantly generate broad, comprehensive overviews of new imagery.
- ⏳ **Bi-temporal Change Detection (R3)**: Upload a Baseline (T0) and Current (T1) image to detect structural changes automatically.
- ☁️ **Optical + SAR Fusion (R4)**: Fuse optical and radar imagery to penetrate cloud cover and find concealed assets.
- 🧠 **Agent Orchestration (R5)**: Intelligent query routing to the most appropriate AI model.
- 📊 **Explainable AI (XAI) (R6)**: Step-by-step reasoning and confidence metrics for every action.
- 📜 **Audit Trail (R7)**: A complete, timestamped history of all queries, models used, and confidence scores.
- 🌍 **God's Eye 3D Layer (Phase 12 Bonus)**: Deep integration with 3D geospatial globes.

## Architecture

Our stack is designed for hackathon velocity and future production scaling:
- **Backend**: FastAPI (Python)
- **Frontend**: React (Vite, TypeScript)
- **Intelligence**: Stubbed modular AI pipeline ready for real model weights (LLaVA/Gemini).
- **Data**: Lightweight JSON Audit logging.

## Setup Instructions

1. **Install Dependencies**
```bash
# Backend
pip install -r requirements.txt
# Frontend
cd frontend && npm install
```

2. **Run Services**
```bash
# Backend
uvicorn backend.main:app --reload

# Frontend
cd frontend && npm run dev
```

3. **(Optional) Run God's Eye 3D Viewer**
Ensure the separate `gods-eye-view-main` Vite app is running on port 3000 to use the 3D map integration.

## Testing & Demo
- Read `docs/12-TESTING.md` for the SIH Test Matrix.
- Read `docs/13-DEMO-SCRIPT.md` for the live pitch walkthrough.

---
*Built for the Smart India Hackathon*