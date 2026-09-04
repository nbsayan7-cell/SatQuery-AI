# SIH Demo Pitch Script (5 Minutes)

## Setup
1. Have the frontend running (`npm run dev`).
2. Have the backend running (`uvicorn backend.main:app`).
3. Open `http://localhost:5173` in a full-screen browser window.
4. Have the separate "God's Eye" Vite app running on `http://localhost:3000`.

---

## 0:00 - 0:30 | The Hook & Problem
**Speaker:** "Good morning Judges. We are here to present SatQuery AI. In defense and disaster response, analysts face a massive bottleneck: parsing terabytes of satellite imagery to find actionable intelligence. It takes hours. We've reduced it to seconds using natural language."

## 0:30 - 1:30 | Scene Captioning & Explainability (R2a, R6)
**Action:** Upload an image into the Baseline (T0) slot.
**Speaker:** "Let's start with a new acquisition. An analyst simply uploads the image and clicks 'Generate Scene Overview'."
**Action:** Click the "Generate Scene Overview" button.
**Speaker:** "Instantly, our system routes this to a specialized captioning model. Notice on the right—this isn't a black box. Our Intelligence Evidence panel provides step-by-step explainability, showing exactly how the AI arrived at this conclusion, complete with confidence scores."

## 1:30 - 2:30 | Visual Question Answering (R1, R5)
**Action:** Type "Are there any ships?" in the terminal and click Execute.
**Speaker:** "But analysts need specific answers. Using our natural language interface, they can ask direct questions. Under the hood, our Agent Orchestrator intercepts this query, realizes it's a specific extraction task, and dynamically routes it to a dedicated VQA model rather than the captioning model."

## 2:30 - 3:30 | Bi-temporal Change Detection (R3)
**Action:** Upload a second image into the Current (T1) slot.
**Speaker:** "Intelligence is often about what changed. Let's upload a current image."
**Action:** Point out the split-screen view. Click "Detect Changes".
**Speaker:** "The dashboard instantly reconfigures for side-by-side analysis. By clicking 'Detect Changes', our pipeline compares the two temporal states and automatically highlights new infrastructure developments."

## 3:30 - 4:15 | Multi-modal Fusion & Audit (R4, R7)
**Speaker:** "What if the target is hiding under cloud cover? Optical sensors fail here. But by fusing Optical and SAR data..."
**Action:** Point to the "Run Data Fusion" button. (Click if time permits).
**Speaker:** "...our system can penetrate weather conditions to find concealed assets."
**Action:** Click the floating "Audit Trail" button.
**Speaker:** "Every single action is logged. Our Audit Trail ensures military-grade accountability, tracking the timestamp, query, model used, and confidence."

## 4:15 - 5:00 | God's Eye & Closing (Phase 12)
**Action:** Click "Launch God's Eye 3D" in the Map Viewer.
**Speaker:** "Finally, for geospatial grounding, we integrate directly with our 'God's Eye' 3D globe visualization layer. In conclusion, SatQuery AI is a modular, scalable, and explainable intelligence platform. Thank you."