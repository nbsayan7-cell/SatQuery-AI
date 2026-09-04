# SIH Test Matrix

This document outlines the testing matrix for the Smart India Hackathon judging panel to evaluate the SatQuery AI platform against the core problem statement requirements.

## Testing Protocol

For each capability, upload the provided sample images and execute the listed steps. Verify the expected output is generated.

| Requirement | Capability | Test Steps | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| **R2a** | Scene Captioning | 1. Upload `sample_coast.jpg` (Baseline).<br>2. Click **Generate Scene Overview (T0)**. | Result panel displays a broad summary (e.g., "coastal region"). Evidence panel shows bounding boxes and confidence scores > 0.90. | 🟩 PASS |
| **R1** | Natural Language VQA | 1. Upload `sample_base.jpg` (Baseline).<br>2. Type: `"Are there any ships?"`<br>3. Click **Execute Query (T0)**. | Result panel answers the specific query. Evidence panel shows the reasoning steps (e.g., "Ran object detection"). | 🟩 PASS |
| **R3** | Bi-temporal Change Detection | 1. Upload `sample_base.jpg` (Baseline).<br>2. Upload `sample_current.jpg` (Current).<br>3. Click **Detect Changes (T0 vs T1)**. | MapViewer splits side-by-side. Result panel indicates "Significant structural changes". Bounding boxes highlight new infrastructure. | 🟩 PASS |
| **R4** | Optical + SAR Fusion | 1. Upload `opt_cloudy.jpg` (Baseline).<br>2. Upload `sar_clear.jpg` (Current).<br>3. Click **Run Data Fusion (Opt + SAR)**. | Result panel confirms cloud penetration via SAR. Concealed vessels are identified with bounding boxes. | 🟩 PASS |
| **R5** | Agent Orchestration | 1. Upload any image.<br>2. Query: `"Describe this area."`<br>3. Query: `"Count buildings."` | The system dynamically routes the first query to the `CaptioningModel` and the second to the `VQAModel`. The `model_used` badge reflects this. | 🟩 PASS |
| **R6** | Explainable AI (XAI) | 1. Execute any AI operation (Caption, Query, Compare). | The **Intelligence Evidence** panel populates with step-by-step reasoning and probabilistic confidence bars for each step. | 🟩 PASS |
| **R7** | Audit Trail | 1. Execute multiple queries.<br>2. Click the floating **Audit Trail** button in the bottom right. | A modal appears showing a timestamped table of all queries executed, the model utilized, and the overall confidence score. | 🟩 PASS |
| **Bonus** | God's Eye 3D Integration | 1. Click **Launch God's Eye 3D** in the MapViewer header. | Opens the decoupled 3D globe visualization tool in a new tab. | 🟩 PASS |

## Current Testing & Verification Status (2026-09-04)

- **Automated Regression Suite:** 🟢 **66/66 tests passing (100% green)** via `pytest backend/tests`.
- **SIH Priority Benchmark:** 🟢 **20/20 test queries passing** via `scripts/run_benchmark_20.py` and `GET /api/benchmark/20`.
- **Deterministic Pipeline Engine:** Fully implemented in `pipeline/` with subpixel Fourier coregistration, Enhanced Lee radar despeckling, feature-standardized CVM, Mahalanobis distance, Otsu/Chi-square thresholding, Affine Jacobian area derivation ($m^2$ and ha), and 5-axis decomposed multi-source uncertainty.
- **Detailed Audit Document:** See [docs/24-POST-TEST-SCIENTIFIC-VERIFICATION-REPORT.md](file:///c:/Users/Sayan%20Saha/Downloads/sih/SatQuery-AI/docs/24-POST-TEST-SCIENTIFIC-VERIFICATION-REPORT.md) for full mathematical validations and test breakdowns.