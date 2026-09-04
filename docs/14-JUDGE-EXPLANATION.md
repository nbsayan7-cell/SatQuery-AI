# 🧑⚖️ SatQuery AI — Judge Explanation Guide

> **Purpose:** The demo *shows*; this doc *teaches you to explain*. For each technology,
> a beginner explanation and a judge-level explanation, plus the tough questions.

---

## Per-technology explanations

### Vision-Language Model (VLM)
- **What it does:** Connects image understanding with natural language.
- **Why we use it:** Lets scientists ask questions in plain language instead of writing GIS scripts.
- **Beginner:** "A visual brain that looks at satellite imagery and understands questions."
- **Judge-level:** "A transformer that jointly embeds image patches and text tokens, so it can condition a language answer on visual evidence. We adapt one pretrained on remote-sensing imagery (UniRS/VRSBench-style data) rather than natural photos, because RS physical band statistics differ sharply from web RGB photos."

### The Two-Lane Architecture
- **What it does:** Strictly physically isolates numerical computation from language generation.
- **Beginner:** "The AI reads the numbers, but the numbers come from a real scientific calculator."
- **Judge-level:** "The deterministic numeric lane (`pipeline/`) executes subpixel Fourier phase cross-correlation, Enhanced Lee filtering, spectral and SAR indices, z-score standardized CVM, Mahalanobis distance, Otsu thresholding, and Affine Jacobian area calculations. The LLM only narrates the verified JSON evidence. The LLM is never allowed to compute, modify, or manufacture numeric evidence."

### The 8-Level Hard Validation Gate (FAIL = STOP)
- **What it does:** Validates spatial, temporal, and resolution compatibility before pixel analysis runs.
- **Beginner:** "If you try to compare Kolkata with Delhi, the system stops you before doing any fake math."
- **Judge-level:** "Generic multimodal LLMs hallucinate changes between unrelated scenes. SatQuery enforces an 8-level gate (G0 File Integrity → G1 Readability → G2 CRS Match → G3 Metadata → G4 Bbox Overlap > 0% → G5 Resolution Ratio → G6 Temporal Delta → G7 Coregistration RMSE → G8 Residual Quality). If any gate fails, analysis halts immediately with a structured rejection (`400 INCOMPATIBLE_SPATIAL_EXTENT`)."

---

## Tough Questions & Authoritative Answers

### 1. "Why don't you just ask GPT-4V or Llama-Vision to count the buildings and measure change?"
> **Answer:** *"LLMs are autoregressive token predictors, not physical measurement instruments. If you give two satellite images to a standard VLM, it generates qualitative descriptions and hallucinates plausible-sounding numbers. SatQuery AI treats satellite imagery as a spatially indexed multidimensional measurement field. The deterministic pipeline computes physical quantities at the pixel level, and the LLM merely translates the verified evidence schema into a human-readable report."*

### 2. "Why do you report area uncertainty rather than calling your area exact?"
> **Answer:** *"Calling satellite-derived surface area 'exact' is scientifically indefensible due to subpixel coregistration residual error and mixed boundary pixels. We derive the nominal ground area directly from the geotransform Jacobian determinant, and we compute analytical boundary perimeter uncertainty ($\delta_{\text{area}} = 4\sqrt{N} \cdot \mathrm{RMSE}_{\text{reg}} \cdot A_p$) to report a genuine 95% confidence interval."*

### 3. "How did you solve the problem of high-magnitude bands drowning out subtle changes?"
> **Answer:** *"In multispectral and SAR fusion, raw numerical ranges differ by orders of magnitude (Red reflectance $\in [0, 1]$, raw DN $\in [0, 4000]$, SAR backscatter $\in [-30, 0]\,\text{dB}$). An uncalibrated Euclidean distance is blinded by the highest-scale channel. SatQuery applies $z$-score feature standardization ($z_d = \frac{x_d - \mu_d}{\sigma_d + \epsilon}$) to each band before differencing, ensuring equal physical sensitivity across all modalities."*

### 4. "Is this a prototype with mocked backends?"
> **Answer:** *"No. We have an automated regression suite with 66 tests passing at 100% via Pytest, an automated 20-query SIH benchmark harness with live execution at `GET /api/benchmark/20`, and a live FastAPI backend serving genuine subpixel coregistration, Enhanced Lee filtering, and vector polygonization."*