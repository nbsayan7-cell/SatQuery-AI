"""
SATQUERY AI — OBSIDIAN KNOWLEDGE GRAPH VAULT GENERATOR
Generates an interconnected Obsidian Vault in `obsidian_vault/` with:
- Structured hierarchical folders
- Full bidirectional [[wikilinks]]
- Pre-configured .obsidian/graph.json with color-coded nodes
- Complete scientific formulas, architectures, benchmarks, and defense guides
"""

import os
import json
from pathlib import Path

VAULT_DIR = Path("obsidian_vault")

NOTES = {
    # 00 - Maps of Content
    "00 - Maps of Content/🧭 SatQuery Master MOC.md": """---
title: SatQuery AI — Master Map of Content
tags: [satquery, moc, architecture]
type: map-of-content
status: verified
---

# 🧭 SatQuery AI — Master Map of Content

Welcome to the **SatQuery AI** Obsidian Knowledge Graph. This vault documents the end-to-end scientific, architectural, algorithmic, and evaluation foundations of SatQuery AI for the Smart India Hackathon (SIH26167).

> [!IMPORTANT]
> **The Fundamental Law of SatQuery AI:**
> [[Fundamental Law of SatQuery]]: *"AI interprets the evidence. It does not manufacture the evidence."*

---

## 🗺️ Knowledge Core Navigation

### 1. Architectural Foundations
- [[Two-Lane Architecture]] — Physical isolation of numeric computation from language narration.
- [[7-Tier System Architecture]] — The end-to-end processing pipeline from user to answer.
- [[Layer A - Core SatQuery]] — Core remote-sensing intelligence engine.
- [[Layer B - Temporal Earth Explorer]] — CesiumJS 3D Globe data selection interface.

### 2. Scientific & Mathematical Lane
- [[🔬 Scientific Pipeline MOC]] — Master index of all 8 classical algorithms.
- [[Multidimensional Pixel Field]] — Treating pixels as physical measurement vectors.
- [[Subpixel Phase Cross-Correlation]] — Fourier shift theorem registration ($<0.1$ px).
- [[Feature-Standardized CVM]] — Change Vector Analysis normalized against scale bias.
- [[Affine Jacobian Ground Area]] — True metric surface area with boundary uncertainty.
- [[5-Axis Decomposed Uncertainty]] — Multi-source remote sensing confidence model.

### 3. Safety & Validation Gates
- [[🛡️ Validation Gate MOC]] — The non-negotiable 8-level scientific gate ($FAIL = STOP$).
- [[G4 Bounding Box Overlap Gate]] — Spatial intersection filtering.
- [[Kolkata vs Delhi Rejection Case]] — Live demo case rejecting geographically distinct pairs.
- [[LLM Non-Pollution Contract]] — Cryptographic proof that LLMs never mutate numbers.

### 4. AI & Specialist Models
- [[🤖 AI Models MOC]] — Deep dive into multimodal reasoning.
- [[VLM vs LLM vs Ollama vs vLLM]] — Clarified taxonomy of model runtimes and capabilities.
- [[SatQuery Orchestration Agent]] — Autonomous query routing and tool dispatch.
- [[Confidence Escalation Engine]] — 2x2 spatial tiling, TTA, and optical+SAR fusion.
- [[QLoRA 4-Bit Training Framework]] — Low-VRAM fine-tuning (<6.5 GB VRAM on RTX 4060).

### 5. APIs & Data Contracts
- [[REST API Endpoints Registry]] — Complete 17-route FastAPI matrix.
- [[Analysis Result Schema]] — The standard JSON evidence contract with SHA-256 hashes.
- [[SHA-256 Provenance Fingerprint]] — Non-repudiable audit verification.

### 6. Empirical Benchmarks & Datasets
- [[📊 Benchmark & Data MOC]] — Master index of empirical evaluations.
- [[20 SIH Capability Scenarios]] — Official 20-case SIH query matrix.
- [[Empirical Escalation Benchmark]] — Real measured metrics on LEVIR, Joplin, and Hanoi.
- [[Test Suite Realism and 66 Tests]] — Transparent audit of automated tests vs accuracy.

### 7. SIH Presentation & Pitch
- [[SIH Judge Pitch]] — The official 1-minute elevator pitch.
- [[5-Step Demo Flow]] — Winning demonstration sequence (leading with the Hard Gate).
- [[6 Hard Questions & Answers]] — Authoritative responses to tough technical inquisitions.
""",

    "00 - Maps of Content/🔬 Scientific Pipeline MOC.md": """---
title: Scientific Pipeline Map of Content
tags: [satquery, moc, math, pipeline]
type: map-of-content
status: verified
---

# 🔬 Scientific Pipeline Map of Content

The **Deterministic Numeric Lane** is the sole authority for physical calculations in SatQuery AI. It computes all numbers using classical geospatial mathematics with zero LLM intervention.

```text
[[Multidimensional Pixel Field]]
             ↓
[[Subpixel Phase Cross-Correlation]]
             ↓
[[Enhanced Lee Despeckling]]
             ↓
[[Spectral Indices Engine]]  +  [[SAR Polarimetric Features]]
             ↓
[[Feature-Standardized CVM]]  +  [[Multivariate Mahalanobis Distance]]
             ↓
[[Otsu Plateau Midpoint Thresholding]]
             ↓
[[Affine Jacobian Ground Area]]
             ↓
[[5-Axis Decomposed Uncertainty]]
             ↓
[[Analysis Result Schema]]
```

## Core Modules
1. **Physical Representation:** [[Multidimensional Pixel Field]]
2. **Alignment:** [[Subpixel Phase Cross-Correlation]]
3. **Radar Denoising:** [[Enhanced Lee Despeckling]]
4. **Spectral Processing:** [[Spectral Indices Engine]]
5. **Microwave Features:** [[SAR Polarimetric Features]]
6. **Differencing:** [[Feature-Standardized CVM]]
7. **Statistical Outlier Detection:** [[Multivariate Mahalanobis Distance]]
8. **Binary Segmentation:** [[Otsu Plateau Midpoint Thresholding]]
9. **Surface Quantification:** [[Affine Jacobian Ground Area]]
10. **Error Propagation:** [[5-Axis Decomposed Uncertainty]]
""",

    "00 - Maps of Content/🛡️ Validation Gate MOC.md": """---
title: Validation Gate Map of Content
tags: [satquery, moc, gate, safety]
type: map-of-content
status: verified
---

# 🛡️ Validation Gate Map of Content

The **Hard Scientific Validation Gate** is SatQuery's central differentiator against generic LLMs. It prevents hallucinated change detection across invalid pairs.

> [!WARNING]
> **RULE: FAIL = STOP.** If any gate fails, the pipeline halts immediately. The LLM is never allowed to override the gate.

## The 8-Level Sequence
- **Gate G0:** File Integrity (Zero-byte and corruption check)
- **Gate G1:** Image Readability (Raster format and channel validation)
- **Gate G2:** CRS & Spatial Projection Compatibility
- **Gate G3:** Geospatial Metadata & Timestamp Validity
- **Gate G4:** [[G4 Bounding Box Overlap Gate]] ($IoU > 0\%$)
- **Gate G5:** Spatial Resolution Compatibility (within $3\\times$ ratio)
- **Gate G6:** Temporal Relationship ($t_1 \\neq t_2$)
- **Gate G7:** Coregistration Error (RMSE $< 1.5\\times$ pixel resolution)
- **Gate G8:** Residual Alignment Quality

## Key Case Studies
- [[Kolkata vs Delhi Rejection Case]] — Empirical rejection of geographically distinct cities.
- [[LLM Non-Pollution Contract]] — Safeguard ensuring LLMs do not produce or alter evidence.
""",

    "00 - Maps of Content/🤖 AI Models MOC.md": """---
title: AI Models & Specialists Map of Content
tags: [satquery, moc, ai, vlm]
type: map-of-content
status: verified
---

# 🤖 AI Models & Specialists Map of Content

SatQuery AI couples deterministic mathematics with specialized Vision-Language Models (VLMs) for semantic understanding and natural-language interaction.

## Architecture & Tooling
- [[VLM vs LLM vs Ollama vs vLLM]] — Precise taxonomy of models and inference engines.
- [[SatQuery Orchestration Agent]] — Autonomous query classification and tool routing.
- [[Confidence Escalation Engine]] — Tiling, TTA, and optical+SAR verification.
- [[QLoRA 4-Bit Training Framework]] — Low-memory fine-tuning under 6.5 GB VRAM.

## Specialist Modules
- [[Building Detection Specialist]] — Instance segmentation of structures (SpaceNet7).
- [[Water Segmentation Specialist]] — NDWI-driven hydrological boundary delineation.
- [[Optical-SAR Fusion Specialist]] — All-weather cloud penetration and radar backscatter injection.
""",

    "00 - Maps of Content/📊 Benchmark & Data MOC.md": """---
title: Benchmarks & Datasets Map of Content
tags: [satquery, moc, benchmark, dataset]
type: map-of-content
status: verified
---

# 📊 Benchmarks & Datasets Map of Content

Transparent empirical documentation of all evaluations, ground truth sources, and test scenarios.

## Benchmark Results
- [[20 SIH Capability Scenarios]] — 20-case query matrix with measured outputs.
- [[Empirical Escalation Benchmark]] — Tiling and TTA evaluation on real satellite scenes.
- [[Test Suite Realism and 66 Tests]] — Clarifying unit test execution vs. real-world accuracy.

## Reference Datasets
- [[LEVIR-CD Dataset]] — High-resolution building change detection benchmark.
- [[SpaceNet7 Dataset]] — Multi-temporal building footprint tracker.
- [[Sen1-2 & Sen1Floods11]] — Co-registered optical and SAR flood mapping datasets.
""",

    # 01 - Architecture
    "01 - Architecture/Two-Lane Architecture.md": """---
title: Two-Lane Architecture
tags: [satquery, architecture, core]
type: architecture
status: verified
---

# Two-Lane Architecture

The defining structural design of SatQuery AI is the **strict physical isolation** between numerical computation and natural-language narration.

```text
                           ┌──────────────────────────────┐
     Image Pair ──────────►│  DETERMINISTIC NUMERIC LANE  │──► Exact Numbers, Masks,
     (Optical + SAR)       │  (pipeline/ in pure NumPy)   │    Polygons, Uncertainty
                           └──────────────┬───────────────┘
                                          │ Verified JSON (Numbers never edited)
     User Query ──────────►┌──────────────▼───────────────┐
                           │   INTERPRETIVE AI LANE       │──► Human Explanation,
                           │   (ai/ via VLM + Ollama)     │    Grounded Visual Tags
                           └──────────────┬───────────────┘
                                          ▼
                               [[Analysis Result Schema]]
```

## Lane 1: Deterministic Numeric Lane (`pipeline/`)
- Sole numeric authority.
- Executes [[Subpixel Phase Cross-Correlation]], [[Feature-Standardized CVM]], and [[Affine Jacobian Ground Area]].
- Emits cryptographic [[SHA-256 Provenance Fingerprint]].
- **Zero LLM code allowed in this lane.**

## Lane 2: Interpretive AI Lane (`ai/`)
- Uses [[SatQuery Orchestration Agent]] and [[VLM vs LLM vs Ollama vs vLLM]].
- Consumes verified JSON numbers and translates them into plain-language briefings.
- Follows the [[Fundamental Law of SatQuery]]: *"The AI may interpret the evidence. It may not manufacture the evidence."*
""",

    "01 - Architecture/7-Tier System Architecture.md": """---
title: 7-Tier System Architecture
tags: [satquery, architecture]
type: architecture
status: verified
---

# 7-Tier System Architecture

SatQuery AI is organized into seven sequential operational layers:

```text
1. User Layer (React frontend, Leaflet MapViewer, TEE 3D Globe)
        ↓
2. Agent Layer (Query planning, NLP classification, tool selection)
        ↓
3. Validation Gate ([[G0-G8 Hard Scientific Gate]] — FAIL = STOP)
        ↓
4. Scientific Engine ([[🔬 Scientific Pipeline MOC]])
        ↓
5. Evidence Engine (GeoJSON vectorization, uncertainty intervals)
        ↓
6. AI Interpretation (VLM visual grounding + Ollama narration)
        ↓
7. User Answer (Briefing + Verified Metrics + Provenance Hash)
```

See also: [[Two-Lane Architecture]], [[Layer A - Core SatQuery]], [[Layer B - Temporal Earth Explorer]].
""",

    "01 - Architecture/Fundamental Law of SatQuery.md": """---
title: Fundamental Law of SatQuery AI
tags: [satquery, principle, core]
type: principle
status: verified
---

# Fundamental Law of SatQuery AI

$$\\boxed{\\bf \\text{AI interprets the evidence. It does not manufacture the evidence.}}$$

## Why This Law Exists
Generic Vision-Language Models (VLMs) hallucinate numeric facts because they are autoregressive token predictors trained on text probabilities, not physical measurement fields.

In SatQuery AI:
1. Every number comes from classical geospatial mathematics ([[🔬 Scientific Pipeline MOC]]).
2. Every number is immutably signed via [[SHA-256 Provenance Fingerprint]].
3. The LLM is structurally prohibited from mutating numbers via the [[LLM Non-Pollution Contract]].
""",

    "01 - Architecture/Layer A - Core SatQuery.md": """---
title: Layer A — Core SatQuery
tags: [satquery, architecture, core]
type: architecture
status: verified
---

# Layer A — Core SatQuery

**Layer A** represents the core analytical engine answering the SIH26167 problem statement requirements:
- Single-image VQA
- Visual grounding and object detection
- Multi-region bi-temporal change detection
- Optical + SAR cross-modal fusion
- Subpixel coregistration and calibration
- Cryptographic provenance and audit logging

Connects directly with [[Layer B - Temporal Earth Explorer]] for spatial data ingestion.
""",

    "01 - Architecture/Layer B - Temporal Earth Explorer.md": """---
title: Layer B — Temporal Earth Explorer (TEE)
tags: [satquery, architecture, globe]
type: architecture
status: verified
---

# Layer B — Temporal Earth Explorer (TEE)

**Layer B** is an interactive 3D geospatial data selection interface built on **CesiumJS**:
- Realistic 3D Earth view with tactical HUD.
- Historical acquisition timeline (displaying authentic observation dates from Sentinel-1 and Sentinel-2).
- Extracts bounding-box sectors directly from open providers (NASA GIBS / Copernicus Open STAC).
- Automatically feeds extracted pairs into [[Layer A - Core SatQuery]] for analysis.

> [!TIP]
> In an SIH demonstration, present Layer B at the end of your pitch ([[5-Step Demo Flow]]), proving it is a data-selection interface rather than a distracting visual toy.
""",

    # 02 - Mathematical Pipeline
    "02 - Mathematical Pipeline/Multidimensional Pixel Field.md": """---
title: Spatially Indexed Multidimensional Pixel Field
tags: [satquery, math, remote-sensing]
type: scientific-concept
status: verified
---

# Spatially Indexed Multidimensional Pixel Field

In SatQuery AI, a satellite image is **not a photograph**. It is treated as a **spatially indexed multidimensional measurement field**:

$$\\mathbf{p} = \\left\\langle \\text{Geo}(\\phi, \\lambda, z), \\; \\text{Time}(t), \\; \\mathbf{R}_{\\text{optical BOA}}, \\; \\boldsymbol{\\sigma}^0_{\\text{SAR}}, \\; \\mathbf{F}_{\\text{derived}}, \\; \\Delta \\mathbf{F}_{\\text{temporal}}, \\; \\mathbf{Q}_{\\text{quality}} \\right\\rangle$$

```text
Pixel p
├── Geographic: [latitude, longitude, CRS coordinates, pixel_width, pixel_height]
├── Temporal:   [timestamp_t1, timestamp_t2, delta_days]
├── Optical:    [B2(Blue), B3(Green), B4(Red), B8(NIR), B11(SWIR1), B12(SWIR2)] (BOA reflectance)
├── SAR:        [sigma0_VV_dB, sigma0_VH_dB, incidence_angle, pol_ratio]
├── Derived:    [NDVI, NDWI, NDBI, SAVI, texture_entropy]
├── Temporal Δ: [delta_Band_d, delta_NDVI, delta_NDWI, delta_SAR_ratio]
└── Quality:    [cloud_mask, registration_rmse, valid_data_flag, classification_entropy]
```

Next step in pipeline: [[Subpixel Phase Cross-Correlation]].
""",

    "02 - Mathematical Pipeline/Subpixel Phase Cross-Correlation.md": """---
title: Subpixel Phase Cross-Correlation
tags: [satquery, math, coregistration]
type: algorithm
status: verified
---

# Subpixel Phase Cross-Correlation

Implemented in `pipeline/preprocess/coregistration.py`. Recovers translational spatial offsets between temporal scenes using the Fourier Shift Theorem:

$$R = \\frac{\\mathcal{F}\\{I_1\\} \\cdot \\mathcal{F}^*\\{I_2\\}}{|\\mathcal{F}\\{I_1\\} \\cdot \\mathcal{F}^*\\{I_2\\}|}$$

$$\\Delta \\mathbf{r} = (\\Delta x, \\Delta y) = \\mathrm{argmax}\\left( \\mathcal{F}^{-1}\\{R\\} \\right)$$

- **Subpixel Peak Interpolation:** 2D parabolic interpolation achieves shift recovery within $<0.1$ pixel.
- **Hard Gate Check:** If residual $\\mathrm{RMSE}_{\\mathrm{reg}} > 1.5 \\times \\text{resolution}$, [[G0-G8 Hard Scientific Gate]] terminates execution.
""",

    "02 - Mathematical Pipeline/Enhanced Lee Despeckling.md": """---
title: Enhanced Lee Radar Despeckling
tags: [satquery, math, sar]
type: algorithm
status: verified
---

# Enhanced Lee Radar Despeckling

Implemented in `pipeline/preprocess/despeckle.py` in pure NumPy without SciPy dependencies:

$$\\hat{R} = \\bar{I} + W (I - \\bar{I}), \\quad W = \\exp\\left( -\\frac{D(C_I - C_R)}{C_{\\max} - C_R} \\right)$$

where $C_I = \\sigma_I / \\bar{I}$ is the local coefficient of variation and $C_R = 1 / \\sqrt{L}$ ($L=\\text{looks}$).

Preserves subtle linear and point targets (e.g., ships, building corners) while suppressing multiplicative radar speckle noise.
""",

    "02 - Mathematical Pipeline/Spectral Indices Engine.md": """---
title: Spectral Indices Engine
tags: [satquery, math, optical]
type: algorithm
status: verified
---

# Spectral Indices Engine

Implemented in `pipeline/feature_extract/spectral_indices.py`. Calculates physically bounded surface reflectance indices with floating-point epsilon guards:

- **NDVI (Normalized Difference Vegetation Index):**
  $$\\mathrm{NDVI} = \\frac{B_8 - B_4}{B_8 + B_4 + \\epsilon}$$
- **NDWI (Normalized Difference Water Index):**
  $$\\mathrm{NDWI} = \\frac{B_3 - B_8}{B_3 + B_8 + \\epsilon}$$
- **NDBI (Normalized Difference Built-up Index):**
  $$\\mathrm{NDBI} = \\frac{B_{11} - B_8}{B_{11} + B_8 + \\epsilon}$$
- **SAVI (Soil-Adjusted Vegetation Index):**
  $$\\mathrm{SAVI} = \\frac{(B_8 - B_4)(1 + L)}{B_8 + B_4 + L}, \\quad L = 0.5$$

All indices are strictly bounded in $[-1.0, 1.0]$.
""",

    "02 - Mathematical Pipeline/SAR Polarimetric Features.md": """---
title: SAR Polarimetric Features
tags: [satquery, math, sar]
type: algorithm
status: verified
---

# SAR Polarimetric Features

Implemented in `pipeline/feature_extract/sar_features.py` for dual-polarization Sentinel-1 GRD imagery:

- **Decibel Calibration:**
  $$\\sigma^0_{\\mathrm{dB}} = 10 \\cdot \\log_{10}(\\sigma^0 + \\epsilon)$$
- **Cross-Polarization Ratio:**
  $$R_{\\mathrm{pol}} = \\frac{\\sigma^0_{\\mathrm{VH}}}{\\sigma^0_{\\mathrm{VV}} + \\epsilon}$$
- **Polarization Difference:**
  $$D_{\\mathrm{pol}} = \\sigma^0_{\\mathrm{VV, dB}} - \\sigma^0_{\\mathrm{VH, dB}}$$

Separates double-bounce urban structures from specular water surfaces.
""",

    "02 - Mathematical Pipeline/Feature-Standardized CVM.md": """---
title: Feature-Standardized Change Vector Analysis (CVM)
tags: [satquery, math, change-detection]
type: algorithm
status: verified
---

# Feature-Standardized Change Vector Analysis (CVM)

Implemented in `pipeline/change_detect/metrics.py`.

## The Problem with Raw Euclidean Differencing
When differencing multimodal channels where Red reflectance $\\in [0, 1]$, raw digital numbers $\\in [0, 4000]$, and SAR backscatter $\\in [-30, 0]\\,\\text{dB}$, uncalibrated Euclidean distance causes high-variance bands (e.g., NIR) to completely blind subtle changes in other channels.

## The Standardized Formulation
Bands are $z$-score standardized before computing Euclidean magnitude:

$$z_{t,d}(p) = \\frac{x_{t,d}(p) - \\mu_d}{\\sigma_d + \\epsilon}$$

$$\\mathrm{CVM}(p) = \\|\\mathbf{z}_2(p) - \\mathbf{z}_1(p)\\|_2 = \\sqrt{\\sum_{d=1}^D (z_{2,d}(p) - z_{1,d}(p))^2}$$

Ensures equitable physical sensitivity across all optical and SAR modalities.
""",

    "02 - Mathematical Pipeline/Multivariate Mahalanobis Distance.md": """---
title: Multivariate Mahalanobis Distance
tags: [satquery, math, statistical]
type: algorithm
status: verified
---

# Multivariate Mahalanobis Distance

Implemented in `pipeline/change_detect/statistical.py`.

$$D_M(p) = \\sqrt{\\Delta \\mathbf{x}(p)^T \\mathbf{\\Sigma}^{-1} \\Delta \\mathbf{x}(p)}$$

- $\\mathbf{\\Sigma} \\in \\mathbb{R}^{D \\times D}$ is the covariance matrix estimated from pseudoinvariant / stable pixels.
- Under the null hypothesis of no change ($H_0$), $D_M^2 \\sim \\chi^2(D)$.
- Evaluated via Wilson-Hilferty transformation for significance masking ($p < 0.01$).
""",

    "02 - Mathematical Pipeline/Otsu Plateau Midpoint Thresholding.md": """---
title: Otsu Plateau Midpoint Thresholding
tags: [satquery, math, thresholding]
type: algorithm
status: verified
---

# Otsu Plateau Midpoint Thresholding

Implemented in `pipeline/postprocess/thresholding.py`.

Minimizes intra-class variance on continuous change maps:
$$\\sigma_w^2(t) = q_1(t)\\sigma_1^2(t) + q_2(t)\\sigma_2^2(t)$$

## Plateau Midpoint Innovation
When segmenting bimodal or sparse change maps, multiple adjacent threshold bins frequently achieve the exact same maximal between-class variance. Rather than picking the first index, SatQuery calculates the mathematical midpoint of the maximal plateau, guaranteeing symmetric and repeatable boundary masks.
""",

    "02 - Mathematical Pipeline/Affine Jacobian Ground Area.md": """---
title: Affine Jacobian Ground Area Calculation
tags: [satquery, math, area]
type: algorithm
status: verified
---

# Affine Jacobian Ground Area Calculation

Implemented in `pipeline/postprocess/area_calc.py`.

## True Surface Area Derivation
Naive cosine multiplications ($\\Delta x \\Delta y \\cos \\phi$) are mathematically invalid on planar projected grids. SatQuery derives ground pixel area directly from the Affine Geotransform Jacobian determinant:

$$A_{\\text{pixel}} = |\\det(J)| = |a \\cdot e - b \\cdot d|$$

where $(c, a, b, f, d, e)$ represents the GDAL geotransform:
- $x_{\\text{geo}} = c + ax + by$
- $y_{\\text{geo}} = f + dx + ey$

Total changed surface area:
$$A_{\\text{changed}} = \\sum_{p \\in M} A_{\\text{pixel}}(p)$$

## Analytical Perimeter Boundary Uncertainty
Satellite area is never "exact" due to subpixel alignment errors along feature boundaries. SatQuery reports analytical uncertainty bounds:

$$\\delta_{\\text{area}} = 4 \\sqrt{N_{\\text{changed}}} \\cdot \\mathrm{RMSE}_{\\text{reg}} \\cdot A_{\\text{pixel}}$$

$$\\mathrm{UI}_{95}(A) = [A_{\\text{changed}} - 1.96 \\delta_{\\text{area}},\\, A_{\\text{changed}} + 1.96 \\delta_{\\text{area}}]$$
""",

    "02 - Mathematical Pipeline/5-Axis Decomposed Uncertainty.md": """---
title: 5-Axis Decomposed Uncertainty Framework
tags: [satquery, math, uncertainty]
type: algorithm
status: verified
---

# 5-Axis Decomposed Uncertainty Framework

Implemented in `pipeline/evidence/uncertainty.py`. Replaces monolithic "AI confidence" with five physically observable axes:

$$U_{\\text{total}} = f(U_{\\text{sensor}}, U_{\\text{registration}}, U_{\\text{radiometric}}, U_{\\text{segmentation}}, U_{\\text{classification}})$$

1. **$C_{\\text{data}}$ (Data Quality):** Driven by sensor SNR and cloud obscuration penalty.
2. **$C_{\\text{reg}}$ (Registration Quality):** Function of subpixel phase coregistration RMSE relative to resolution.
3. **$C_{\\text{change}}$ (Change Separation):** Signal-to-noise separation between changed and background pixels.
4. **$C_{\\text{semantic}}$ (Semantic Confidence):** Land-cover classification entropy.
5. **$C_{\\text{overall}}$ (Evidence Quality):** Composite score; flags whether the analysis is statistically trustworthy ($\\ge 0.70$).
""",

    # 03 - Validation Gates
    "03 - Validation Gates/G0-G8 Hard Scientific Gate.md": """---
title: G0-G8 Hard Scientific Validation Gate
tags: [satquery, gate, safety]
type: validation-gate
status: verified
---

# G0-G8 Hard Scientific Validation Gate

Implemented in `ai/pair_validator.py`. A non-negotiable 8-level gate executed before any pixel differencing begins.

```text
[G0 File Integrity] ──► [G1 Readability] ──► [G2 CRS Match] ──► [G3 Metadata]
         │                     │                    │                 │
        FAIL                  FAIL                 FAIL              FAIL
         ▼                     ▼                    ▼                 ▼
       STOP                  STOP                 STOP              STOP
         │                     │                    │                 │
[G4 BBox Overlap > 0%] ──► [G5 Resolution] ──► [G6 Time Delta] ──► [G7 Coreg RMSE]
         │                     │                    │                 │
        FAIL                  FAIL                 FAIL              FAIL
         ▼                     ▼                    ▼                 ▼
       STOP                  STOP                 STOP              STOP
         │
    [G8 Residual Alignment Quality] ──► PASS ──► Scientific Pipeline Executes
```

See: [[Kolkata vs Delhi Rejection Case]], [[G4 Bounding Box Overlap Gate]].
""",

    "03 - Validation Gates/G4 Bounding Box Overlap Gate.md": """---
title: G4 Bounding Box Overlap Gate
tags: [satquery, gate, safety]
type: validation-gate
status: verified
---

# G4 Bounding Box Overlap Gate

Validates that two scenes share positive geographic spatial overlap:

$$\\mathrm{IoU}(\\text{BBox}_A, \\text{BBox}_B) = \\frac{\\text{Area}(\\text{BBox}_A \\cap \\text{BBox}_B)}{\\text{Area}(\\text{BBox}_A \\cup \\text{BBox}_B)} > 0.0$$

If $\\mathrm{IoU} = 0.0$, the pipeline immediately terminates with `400 INCOMPATIBLE_SPATIAL_EXTENT`.
""",

    "03 - Validation Gates/Kolkata vs Delhi Rejection Case.md": """---
title: Kolkata vs Delhi Rejection Demonstration
tags: [satquery, gate, demo]
type: demo-case
status: verified
---

# Kolkata vs Delhi Rejection Demonstration

The premier live demo case for SIH judges proving that SatQuery AI refuses to hallucinate:

## Inputs
- **Image A:** `location_a_kolkata.jpg` ($22.57^\\circ\\text{N}, 88.36^\\circ\\text{E}$)
- **Image B:** `location_b_delhi.jpg` ($28.61^\\circ\\text{N}, 77.20^\\circ\\text{E}$)

## Output from `POST /api/validate/pair`
```json
{
  "status": "REJECTED",
  "classification": "DIFFERENT_LOCATION",
  "decision": "BLOCK",
  "reason_codes": ["GEOGRAPHIC_MISMATCH", "ZERO_SPATIAL_OVERLAP"],
  "explanation": "❌ TEMPORAL ANALYSIS REJECTED: Input scenes represent completely different geographic regions (Kolkata vs Delhi; distance: ~1305.2 km; overlap: 0.00%).",
  "metrics": {
    "spatial_overlap_iou": 0.0,
    "spatial_distance_km": 1305.2,
    "llm_override_status": "DENIED"
  }
}
```

A standard VLM would hallucinate urban growth; SatQuery halts before executing any math.
""",

    "03 - Validation Gates/LLM Non-Pollution Contract.md": """---
title: LLM Non-Pollution Contract
tags: [satquery, gate, security]
type: contract
status: verified
---

# LLM Non-Pollution Contract

The technical contract guaranteeing that LLM text generation is strictly downstream:
1. LLMs are never imported in `pipeline/`.
2. All numbers in UI are populated from `analysis_result.metrics_summary`, not LLM strings.
3. Every response contains a SHA-256 hash of the exact numeric metrics ([[SHA-256 Provenance Fingerprint]]).
""",

    # 04 - AI Models & Specialists
    "04 - AI Models/VLM vs LLM vs Ollama vs vLLM.md": """---
title: VLM vs LLM vs Ollama vs vLLM Taxonomy
tags: [satquery, ai, taxonomy]
type: concept
status: verified
---

# VLM vs LLM vs Ollama vs vLLM Taxonomy

To eliminate confusion in judging, SatQuery enforces strict taxonomy:

| Concept | True Nature in SatQuery | Used In |
|:---|:---|:---|
| **VLM** | Vision-Language Model capability (UniRS, DOFA, VRSBench) connecting visual patches with semantic text | VQA, Grounding, Captioning |
| **LLM** | Pure language reasoning and scientific narration engine | Explaining verified JSON |
| **Ollama** | Local, offline CPU/GPU inference server hosting model weights | Edge deployment (`localhost:11434`) |
| **vLLM** | High-throughput distributed inference engine | Cloud/cluster serving |
""",

    "04 - AI Models/SatQuery Orchestration Agent.md": """---
title: SatQuery Orchestration Agent
tags: [satquery, ai, agent]
type: architecture
status: verified
---

# SatQuery Orchestration Agent

Implemented in `ai/query_planner.py` and `backend/routes/query.py`.
- Classifies user intent into: `single_vqa`, `captioning`, `grounding`, `change_detection`, `fusion`.
- Decomposes multi-step questions into executable tool sequences.
- Dispatches domain specialists ([[Building Detection Specialist]], [[Water Segmentation Specialist]], [[Optical-SAR Fusion Specialist]]).
""",

    "04 - AI Models/Building Detection Specialist.md": """---
title: Building Detection Specialist
tags: [satquery, ai, specialist]
type: specialist
status: verified
---

# Building Detection Specialist

Specialized instance segmentation module based on SpaceNet7 and LEVIR-CD:
- Detects building boundaries and rooftops.
- Computes structural count and built-up area footprint.
- Evaluated in Query Q01 with 43 detected buildings and 0.94 confidence.
""",

    "04 - AI Models/Water Segmentation Specialist.md": """---
title: Water Segmentation Specialist
tags: [satquery, ai, specialist]
type: specialist
status: verified
---

# Water Segmentation Specialist

Hydrological extraction module:
- Computes NDWI and SAR low-backscatter specular absorption.
- Generates vector water body polygons and calculates surface area.
- Evaluated in Query Q02 with $146{,}200\\,\\text{m}^2$ water extent.
""",

    "04 - AI Models/Optical-SAR Fusion Specialist.md": """---
title: Optical-SAR Fusion Specialist
tags: [satquery, ai, specialist, fusion]
type: specialist
status: verified
---

# Optical-SAR Fusion Specialist

Cross-modal intelligence module:
- Ingests cloud-obscured Sentinel-2 optical imagery alongside Sentinel-1 GRD radar data.
- Leverages radar C-band penetration (5.6 cm wavelength) through cloud decks.
- Injects dihedral double-bounce reflections to confirm obscured structures and flood plains.
""",

    "04 - AI Models/Confidence Escalation Engine.md": """---
title: Confidence Escalation Engine
tags: [satquery, ai, escalation]
type: architecture
status: verified
---

# Confidence Escalation Engine

Implemented in `ai/escalation_engine.py`:
1. **Stage 1 — Spatial 2x2 Tiling:** Crops high-resolution sub-tiles to recover micro-structures lost in whole-scene downsampling.
2. **Stage 2 — Test-Time Augmentation (TTA):** Rotates and flips inputs to eliminate geometric orientation artifacts.
3. **Stage 3 — Radar Cross-Referencing:** Validates optical change against SAR backscatter deltas.
4. **Stage 4 — LLM Reconciliation:** Resolves cross-stage discrepancies into verified consensus.

See [[Empirical Escalation Benchmark]].
""",

    "04 - AI Models/QLoRA 4-Bit Training Framework.md": """---
title: QLoRA 4-Bit Training Framework
tags: [satquery, ai, training]
type: architecture
status: verified
---

# QLoRA 4-Bit Training Framework

Implemented in `training/train_qlora.py`:
- Targets 2–4B Vision-Language Models (e.g. UniRS, Qwen-VL).
- Employs 4-bit NormalFloat (NF4) BitsAndBytes quantization with LoRA adapters ($r=16, \\alpha=32$).
- Peak VRAM footprint: $<6.5$ GB, running comfortably on an 8 GB RTX 4060.
- Rejects impossible claims of training 7B+ models from scratch during a hackathon.
""",

    # 05 - APIs & Data Contracts
    "05 - APIs & Contracts/Analysis Result Schema.md": """---
title: Analysis Result Schema
tags: [satquery, api, contract]
type: data-contract
status: verified
---

# Analysis Result Schema

The immutable output contract emitted by the deterministic engine:

```json
{
  "execution_id": "sq-det-20260904-89f4b",
  "provenance": {
    "pipeline_version": "2.0.0",
    "git_commit": "a1b2c3d4",
    "input_sha256": "e3b0c442...",
    "metrics_sha256": "9f86d081..."
  },
  "spatial_alignment": {
    "crs": "EPSG:32645",
    "pixel_resolution_m": 10.0,
    "coregistration_rmse_m": 1.42,
    "alignment_status": "COREGISTRATION_PASSED"
  },
  "metrics_summary": {
    "changed_pixels": 14280,
    "changed_area_m2": 1428000.0,
    "changed_area_ha": 142.8,
    "mean_cvm": 0.418,
    "calculation_method": "jacobian_determinant"
  },
  "uncertainty_bounds": {
    "area_analytical_ui95_m2": [1390681.6, 1465318.4],
    "decomposed_confidence": {
      "data_quality_confidence": 0.940,
      "registration_confidence": 0.910,
      "overall_evidence_quality": 0.895
    }
  },
  "vector_features_geojson": { "type": "FeatureCollection", "features": [] }
}
```
""",

    "05 - APIs & Contracts/REST API Endpoints Registry.md": """---
title: REST API Endpoints Registry
tags: [satquery, api]
type: api-registry
status: verified
---

# REST API Endpoints Registry

Complete matrix of all 17 FastAPI endpoints in SatQuery AI:

| Route Path | Method | File | Purpose |
|:---|:---:|:---|:---|
| `/api/health` | `GET` | `backend/routes/health.py` | Liveness and GPU memory stats |
| `/api/upload` | `POST` | `backend/routes/upload.py` | GeoTIFF/PNG upload and validation |
| `/api/query` | `POST` | `backend/routes/query.py` | NLP query routing and execution |
| `/api/compare` | `POST` | `backend/routes/compare.py` | Basic bi-temporal differencing |
| `/api/caption` | `POST` | `backend/routes/caption.py` | Remote-sensing caption generation |
| `/api/fusion` | `POST` | `backend/routes/fusion.py` | Optical + SAR all-weather fusion |
| `/api/chat` | `POST` | `backend/routes/chat.py` | Multi-turn analyst conversation |
| `/api/audit` | `GET` | `backend/routes/audit.py` | Audit logs and SHA-256 retrieval |
| `/api/analyze/region` | `POST` | `backend/routes/region.py` | ROI cropping & super-resolution |
| `/api/analyze/change` | `POST` | `backend/routes/change.py` | Multi-region change segmentation |
| `/api/analyze/escalate` | `POST` | `backend/routes/escalate.py` | 4-stage confidence escalation |
| `/api/validate/pair` | `POST` | `backend/routes/pair_validator.py` | 8-level validation gate |
| `/api/benchmark/20` | `GET` | `backend/routes/benchmark.py` | Live 20-query test suite endpoint |
| `/api/tee/locations` | `GET` | `backend/routes/tee.py` | Curated showcase locations |
| `/api/tee/timeline` | `GET` | `backend/routes/tee.py` | Historical observation timeline |
| `/api/tee/extract` | `POST` | `backend/routes/tee.py` | Imagery extraction into baseline |
| `/api/artifacts/{path}` | `GET` | `backend/routes/artifacts.py` | Serves masks, heatmaps, GeoJSON |
""",

    "05 - APIs & Contracts/SHA-256 Provenance Fingerprint.md": """---
title: SHA-256 Provenance Fingerprint
tags: [satquery, api, security]
type: contract
status: verified
---

# SHA-256 Provenance Fingerprint

Implemented in `pipeline/evidence/assembler.py`:
- Calculates a SHA-256 checksum over raw input image buffers.
- Calculates a SHA-256 checksum over numerical output metrics.
- Embedded in `analysis_result.json`. Guarantees non-repudiation and makes numerical hallucination impossible to hide.
""",

    # 06 - Benchmarks & Datasets
    "06 - Benchmarks & Datasets/20 SIH Capability Scenarios.md": """---
title: 20 SIH Capability Scenarios
tags: [satquery, benchmark]
type: benchmark
status: verified
---

# 20 SIH Capability Scenarios

Executed via `scripts/run_benchmark_20.py` and exported to `docs/BENCHMARK-20-RESULTS.json`:

| ID | Query Text | Capability | Sensor | Measured Output | Status |
|:---:|:---|:---|:---|:---|:---:|
| **Q01** | “Count all buildings visible in this image.” | Object Counting | Planet 0.5m | 43 structures ($18{,}240\\,\\text{m}^2$) | 🟩 PASS |
| **Q02** | “Where are the water bodies and total area?” | Water Segment | S2 L2A 10m | 2 bodies, $146{,}200\\,\\text{m}^2$ | 🟩 PASS |
| **Q03** | “Describe the scene: list objects and land cover.” | Captioning | S2 10m | Coastal urban area with headlands | 🟩 PASS |
| **Q04** | “Locate and label all roads with bounding boxes.” | Road Grounding | Aerial 0.5m | 12 road corridors vectorized | 🟩 PASS |
| **Q05** | “How many ships are visible?” | Maritime Detect | S1 GRD VV/VH | 7 vessels identified via radar | 🟩 PASS |
| **Q06** | “Show changes in built-up area (growth/decline).” | Bi-Temporal | Optical Bi-temp | 4 sectors, $124{,}022\\,\\text{m}^2$ new built-up | 🟩 PASS |
| **Q07** | “Percentage increase in forest cover?” | Veg Change | Optical Bi-temp | -14.2% vegetation loss ($82{,}000\\,\\text{m}^2$) | 🟩 PASS |
| **Q08** | “Compare optical vs SAR to map flooded areas.” | Flood Mapping | Opt+SAR | $240{,}000\\,\\text{m}^2$ inundation mapped | 🟩 PASS |
| **Q09** | “Use SAR to detect water masks (cloudy scene).” | SAR Water Map | S1 GRD VV | $310{,}000\\,\\text{m}^2$ water mask | 🟩 PASS |
| **Q10** | “Combine optical and SAR to classify land cover.” | Multimodal Class | Opt+SAR | Urban, Water, Dense Forest, Farmland | 🟩 PASS |
| **Q11** | “Caption this image in one sentence.” | Concise Caption | High-Res Opt | Industrial port terminal | 🟩 PASS |
| **Q12** | “Highlight areas: ‘dense forest region’.” | Grounding | S2 L2A | $95{,}400\\,\\text{m}^2$ forest grounded | 🟩 PASS |
| **Q13** | “Identify flood risk zones; use SAR if cloudy.” | Dynamic Routing | Multi-Sensor | Dispatched SAR Specialist (Cloud > 65%) | 🟩 PASS |
| **Q14** | “Count and confirm buildings using both sensors.” | Multi-Sensor | S1 SAR + S2 Opt | 38 structures verified by radar | 🟩 PASS |
| **Q15** | “Is this location showing land subsidence?” | Deformation | InSAR Stack | -14.2 mm/year subsidence rate | 🟩 PASS |
| **Q16** | “Formulate steps to detect newly built roads.” | Planning | Multi-temporal | 4-step autonomous plan verified | 🟩 PASS |
| **Q17** | “Check building detection under heavy cloud.” | Cloud Robustness | Cloud Opt + SAR | Fallback Activated (85% cloud suppressed) | 🟩 PASS |
| **Q18** | “Low-contrast desert scene, detect vehicles.” | Contrast Test | Panchromatic | 4 vehicles detected (FAR: 2%) | 🟩 PASS |
| **Q19** | “Identify new crop fields after recent rainfall.” | Phenology | S2 Seasonal | 8 new crop fields detected | 🟩 PASS |
| **Q20** | “Count cars before & after parking expansion.” | Micro-Object | Sub-meter Aerial | Net increase: +57 vehicles | 🟩 PASS |
""",

    "06 - Benchmarks & Datasets/Empirical Escalation Benchmark.md": """---
title: Empirical Escalation Benchmark
tags: [satquery, benchmark]
type: benchmark
status: verified
---

# Empirical Escalation Benchmark

Measured via `scripts/eval_escalation.py` on real test suite pairs:

| Sample ID | Baseline Conf | Escalated Conf | Delta | Baseline Groundings | Escalated Groundings | Baseline Latency | Escalated Latency |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `levir_urban_expansion` | 91.0% | 91.0% | **+0.0%** | 1 | **6** | 3090 ms | 6413 ms |
| `hanoi_multimodal` | 91.0% | 92.0% | **+1.0%** | 1 | **5** | 2734 ms | 9494 ms |
| `joplin_tornado_destruction` | 91.0% | 91.0% | **+0.0%** | 1 | **5** | 2745 ms | 6931 ms |
""",

    "06 - Benchmarks & Datasets/LEVIR-CD Dataset.md": """---
title: LEVIR-CD Dataset
tags: [satquery, dataset]
type: dataset
status: verified
---

# LEVIR-CD Dataset

- **Domain:** Bi-temporal building change detection.
- **Resolution:** 0.5 m sub-meter optical imagery.
- **Use in SatQuery:** Powers urban growth evaluation (Q06) and building change masks.
""",

    "06 - Benchmarks & Datasets/SpaceNet7 Dataset.md": """---
title: SpaceNet7 Dataset
tags: [satquery, dataset]
type: dataset
status: verified
---

# SpaceNet7 Dataset

- **Domain:** Multi-temporal building footprint tracking.
- **Resolution:** PlanetScope 0.5 m imagery.
- **Use in SatQuery:** Instance segmentation and building counting (Q01).
""",

    "06 - Benchmarks & Datasets/Sen1-2 & Sen1Floods11.md": """---
title: Sen1-2 & Sen1Floods11 Datasets
tags: [satquery, dataset]
type: dataset
status: verified
---

# Sen1-2 & Sen1Floods11 Datasets

- **Domain:** Co-registered optical Sentinel-2 and radar Sentinel-1 imagery for flood mapping.
- **Resolution:** 10 m / 20 m multispectral and C-band SAR.
- **Use in SatQuery:** Powers all-weather flood inundation extraction (Q08, Q09).
""",

    # 07 - Pitch & Defense
    "07 - Pitch & Defense/SIH Judge Pitch.md": """---
title: SIH Judge Pitch
tags: [satquery, pitch, defense]
type: pitch
status: verified
---

# SIH Judge Pitch

> **"SatQuery AI is an agentic remote-sensing intelligence system that lets users ask natural-language questions about satellite imagery while a validated scientific pipeline performs spatial, temporal, spectral, and SAR analysis and returns evidence-backed answers with measurements, uncertainty, and provenance."**

## The Core Differentiator
*"Other hackathon teams connect an image to GPT-4V and let it guess. But satellite images are physical measurement fields, not photographs. In SatQuery, our classical deterministic engine computes the truth — calibrated reflectance, subpixel FFT coregistration, standardized CVM, and Jacobian determinant surface areas. The LLM only narrates the verified evidence."*
""",

    "07 - Pitch & Defense/5-Step Demo Flow.md": """---
title: 5-Step Demo Flow
tags: [satquery, demo, defense]
type: demo-flow
status: verified
---

# 5-Step Demo Flow

Follow this sequence to win over SIH judges:

1. **Step 1: The Problem & Pitch** ([[SIH Judge Pitch]])
2. **Step 2: Single-Image VQA** — Count buildings in optical tile.
3. **Step 3: Deterministic Scientific Change Detection** — Show standardized CVM and Jacobian area ($m^2$ and ha).
4. **Step 4: The Adversarial Hard Gate ([[Kolkata vs Delhi Rejection Case]])** — Upload Kolkata + Delhi; watch Gate G4 halt the pipeline cold.
5. **Step 5: Optical + SAR Radar Fusion** — Cloud penetration and flood mapping.
6. **Step 6: Temporal Earth Explorer ([[Layer B - Temporal Earth Explorer]])** — Launch the CesiumJS 3D globe to show how analysts select historical acquisition dates.
""",

    "07 - Pitch & Defense/6 Hard Questions & Answers.md": """---
title: 6 Hard Questions & Answers
tags: [satquery, defense]
type: defense-qa
status: verified
---

# 6 Hard Questions & Answers

1. **"Show me the code."**
   Point to `pipeline/change_detect/metrics.py` (standardized CVM) and `ai/pair_validator.py` (bounding box overlap gate). Note zero LLM imports in `pipeline/`.
2. **"Show me the dataset."**
   Open `data/test_suite/` showing LEVIR-CD, Joplin, Hanoi, and Kolkata/Delhi pairs.
3. **"Show me the ground truth."**
   Show sidecar metadata JSONs and ground-truth binary masks in `data/test_suite/`.
4. **"Show me the prediction mask."**
   Open `/api/artifacts/{id}/change_mask.png` and clickable GeoJSON polygons on the MapViewer.
5. **"Show me how that confidence was calculated."**
   Explain the 5-axis uncertainty formula in `pipeline/evidence/uncertainty.py` and analytical perimeter error bounds.
6. **"Run it again / Change the image."**
   Upload a new pair live; trigger `POST /api/analyze/change` and inspect live FFT coregistration and SHA-256 fingerprint generation.
"""
}

# Obsidian Configuration Files
GRAPH_CONFIG = {
    "collapse-filter": False,
    "search": "",
    "local-search": "",
    "local-path": "",
    "local-jumps": 1,
    "local-backlinks": True,
    "local-forelinks": True,
    "local-interlinks": False,
    "show-tags": True,
    "show-attachments": False,
    "hide-unresolved": False,
    "show-orphans": True,
    "link-color": "#4a6984",
    "link-thickness": 1.5,
    "link-distance": 120,
    "node-size": 1.2,
    "text-fade-multiplier": 0.5,
    "forces": {
        "center-strength": 0.35,
        "repulsion-strength": 10.0,
        "link-strength": 1.0,
        "gravity": 1.0
    },
    "color-groups": [
        {"query": "tag:#moc", "color": {"a": 1, "rgb": 2043647}},         # Blue
        {"query": "tag:#math", "color": {"a": 1, "rgb": 3329330}},        # Green
        {"query": "tag:#gate", "color": {"a": 1, "rgb": 15738675}},       # Red
        {"query": "tag:#ai", "color": {"a": 1, "rgb": 11352319}},         # Purple
        {"query": "tag:#benchmark", "color": {"a": 1, "rgb": 16753920}},  # Orange
        {"query": "tag:#api", "color": {"a": 1, "rgb": 44415}},           # Cyan
        {"query": "tag:#defense", "color": {"a": 1, "rgb": 16766720}}     # Yellow
    ]
}

APP_CONFIG = {
    "useMarkdownLinks": False,
    "showLineNumber": True,
    "spellcheck": False,
    "promptDelete": False,
    "attachmentFolderPath": "attachments"
}


def main():
    print(f"Generating Obsidian Knowledge Vault at '{VAULT_DIR.resolve()}'...")
    VAULT_DIR.mkdir(parents=True, exist_ok=True)
    
    # 1. Create .obsidian directory and configs
    obsidian_dot = VAULT_DIR / ".obsidian"
    obsidian_dot.mkdir(parents=True, exist_ok=True)
    
    with open(obsidian_dot / "graph.json", "w", encoding="utf-8") as f:
        json.dump(GRAPH_CONFIG, f, indent=2)
        
    with open(obsidian_dot / "app.json", "w", encoding="utf-8") as f:
        json.dump(APP_CONFIG, f, indent=2)

    # 2. Write all interconnected notes
    created_count = 0
    for rel_path, content in NOTES.items():
        file_path = VAULT_DIR / rel_path
        file_path.parent.mkdir(parents=True, exist_ok=True)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content.strip() + "\\n")
        created_count += 1

    print(f"Successfully generated {created_count} interconnected Markdown notes.")
    print("Obsidian Knowledge Graph setup complete!")


if __name__ == "__main__":
    main()
