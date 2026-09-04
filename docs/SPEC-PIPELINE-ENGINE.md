# 🔬 SatQuery AI — Deterministic Pipeline Engine Specification (`pipeline/`)

**Version:** 1.0 · **Target Package:** `pipeline/` · **Status:** Complete Technical Specification  
**Architecture Alignment:** [docs/00-MASTER.md](file:///c:/Users/Sayan%20Saha/Downloads/sih/SatQuery-AI/docs/00-MASTER.md), [docs/02-ARCHITECTURE.md](file:///c:/Users/Sayan%20Saha/Downloads/sih/SatQuery-AI/docs/02-ARCHITECTURE.md)

---

## 1. Executive Summary & Design Principle

The **Deterministic Pipeline Engine** is the sole numeric source of truth for SatQuery AI. Built upon **NASA/ISRO-inspired scientific processing principles**, it treats satellite imagery not as photographs, but as a **spatially indexed multidimensional measurement field**. It computes all pixel-level changes, surface areas, confidence bounds, and categorical classifications using classical, verifiable physical & statistical mathematics.

### The Anatomy of a Pixel ($p$)
In SatQuery AI, each pixel $p$ is a structured multi-parameter physical measurement vector:
```text
Pixel p
├── Geographic: [latitude, longitude, CRS coordinates, pixel_width, pixel_height]
├── Temporal:   [acquisition_timestamp_t1, acquisition_timestamp_t2, delta_days]
├── Optical:    [B2 (Blue), B3 (Green), B4 (Red), B8 (NIR), B11 (SWIR1), B12 (SWIR2)] (BOA reflectance)
├── SAR:        [sigma0_VV_dB, sigma0_VH_dB, incidence_angle, pol_ratio]
├── Derived:    [NDVI, NDWI, NDBI, SAVI, texture_entropy]
├── Temporal Δ: [delta_Band_d, delta_NDVI, delta_NDWI, delta_SAR_ratio]
└── Quality:    [cloud_mask, registration_rmse, valid_data_flag, classification_entropy]
```

### Strict Non-Pollution & Architectural Taxonomy
To eliminate hallucinations, SatQuery strictly enforces a two-lane architecture:
- **VLM (Vision-Language Model):** Vision-language semantic capability (UniRS, DOFA, VRSBench) for image captioning, VQA, and open-vocabulary grounding.
- **LLM (Large Language Model):** Pure natural-language reasoning, task decomposition, and scientific narration.
- **Ollama:** Local, privacy-preserving CPU/GPU model runtime.
- **vLLM:** Optional high-throughput production serving runtime.
- **Cardinal Rule:** Machine Learning and Large Language Models **never** compute, modify, or manufacture numeric evidence. The deterministic scientific engine produces the numbers; the LLM only narrates the verified JSON evidence. LLM output must **never** become upstream evidence.

### The 8-Level Hard Validation Gate (FAIL = STOP)
Before executing any scientific change detection or cross-temporal comparison, the pair must pass an 8-stage gate:
```text
[G0 File integrity] ──► [G1 Image readability] ──► [G2 CRS projection match] ──► [G3 Geospatial metadata]
         │                       │                         │                          │
        FAIL                    FAIL                      FAIL                       FAIL
         ▼                       ▼                         ▼                          ▼
       STOP                    STOP                      STOP                       STOP
         │                       │                         │                          │
[G4 BBox overlap > 0%] ──► [G5 Resolution check] ──► [G6 Temporal delta] ──► [G7 Coregistration RMSE]
         │                       │                         │                          │
        FAIL                    FAIL                      FAIL                       FAIL
         ▼                       ▼                         ▼                          ▼
       STOP                    STOP                      STOP                       STOP
         │
    [G8 Residual Quality Check] ──► PASS ──► Execute Scientific Pipeline
```
If any gate fails, analysis is halted immediately with a structured rejection code (e.g. `400 INCOMPATIBLE_SPATIAL_EXTENT`). The LLM is never permitted to override the gate.

---

## 2. Directory Layout & Module Responsibilities

```
pipeline/
├── __init__.py
├── data_ingest/
│   ├── __init__.py
│   ├── stac_client.py         # Open STAC catalogs (Planetary Computer, Earth Search)
│   └── loaders.py             # GeoTIFF / multi-band numpy array loaders
├── preprocess/
│   ├── __init__.py
│   ├── coregistration.py      # Phase cross-correlation subpixel alignment
│   ├── radiometric.py         # S2 L2A BOA reflectance, S1 sigma0 (dB)
│   └── despeckle.py           # Enhanced Lee Filter & SAR2SAR subprocess wrapper
├── feature_extract/
│   ├── __init__.py
│   ├── spectral_indices.py    # NDVI, NDWI, NDBI, SAVI
│   ├── sar_features.py        # Polarization ratio (VV/VH), Cross-pol diff
│   └── texture.py             # Local variance & Gray-Level Co-occurrence Matrix (GLCM)
├── change_detect/
│   ├── __init__.py
│   ├── metrics.py             # Band diff, Standardized CVM, Log-ratio, Normalized diff
│   ├── statistical.py         # Mahalanobis distance, Z-score, PCA difference
│   └── multi_temporal.py      # CUSUM & Linear slope for N > 2 dates
├── postprocess/
│   ├── __init__.py
│   ├── thresholding.py        # Otsu, Triangle, Chi-Square significance
│   ├── vectorization.py       # Raster to GeoJSON polygons + Shapely topology
│   └── area_calc.py           # Affine Jacobian determinant & geodesic area calculation
└── evidence/
    ├── __init__.py
    ├── uncertainty.py         # Multi-source decomposed uncertainty & first-order Taylor bounds
    └── assembler.py           # Final JSON contract builder & cryptographic SHA-256 fingerprint
```

---

## 3. Detailed Module Specifications & Mathematical Formulations

### 3.1 `pipeline.preprocess`
#### Coregistration (`coregistration.py`)
- **Method:** Phase Cross-Correlation (Fourier Shift Theorem) on gradient magnitude maps.
- **Formulation:** Given reference band $I_1(x, y)$ and sensed band $I_2(x, y)$:
  $$R = \frac{\mathcal{F}\{I_1\} \cdot \mathcal{F}^*\{I_2\}}{|\mathcal{F}\{I_1\} \cdot \mathcal{F}^*\{I_2\}|}$$
  Locate peak coordinates $(\Delta x, \Delta y) = \mathrm{argmax}(\mathcal{F}^{-1}\{R\})$.
- **Subpixel Refinement:** Matrix multiply DFT around the cross-correlation peak.
- **Residual Error:** Logged as $\mathrm{RMSE}_{\mathrm{reg}} = \sqrt{\Delta x^2 + \Delta y^2}$ in ground meters.
- **Fail Condition:** If $\mathrm{RMSE}_{\mathrm{reg}} > 1.5 \times \text{resolution}$, reject pair with `400 INCOMPATIBLE_ALIGNMENT`.

#### Despeckling (`despeckle.py`)
- **Method:** Enhanced Lee Filter (kernel $7 \times 7$) implemented via 2D summed-area box filter tables in pure NumPy.
  $$\hat{R} = \bar{I} + W (I - \bar{I})$$
  Where weighting factor:
  $$W = \exp\left( -\frac{D (C_I - C_R)}{C_{\max} - C_R} \right)$$
  $C_I = \sigma_I / \bar{I}$ is the local variation coefficient, $C_R = 1 / \sqrt{L}$ ($L=\text{looks}$).
- **Deep SAR Alternative:** Isolated subprocess call to SAR2SAR PyTorch wrapper (preserving GPL-3.0 boundary).

---

### 3.2 `pipeline.feature_extract`
Constructs normalized feature tensor $\mathbf{X}_t \in \mathbb{R}^{H \times W \times D}$ for $t \in \{1, 2\}$:

1. **Spectral Reflectance:** Surface BOA reflectance $B_2(\text{Blue}), B_3(\text{Green}), B_4(\text{Red}), B_8(\text{NIR}), B_{11}(\text{SWIR}_1), B_{12}(\text{SWIR}_2)$ scaled $[0, 1]$.
2. **Spectral Indices:**
   - $\mathrm{NDVI} = \frac{B_8 - B_4}{B_8 + B_4 + \epsilon}$
   - $\mathrm{NDWI} = \frac{B_3 - B_8}{B_3 + B_8 + \epsilon}$
   - $\mathrm{NDBI} = \frac{B_{11} - B_8}{B_{11} + B_8 + \epsilon}$
   - $\mathrm{SAVI} = \frac{(B_8 - B_4)(1 + L)}{B_8 + B_4 + L}, \quad L = 0.5$
3. **SAR Features:**
   - Backscatter coefficient: $\sigma^0_{\mathrm{dB}} = 10 \cdot \log_{10}(\sigma^0 + \epsilon)$
   - Cross-Polarization Ratio: $R_{\mathrm{pol}} = \frac{\sigma^0_{\mathrm{VH}}}{\sigma^0_{\mathrm{VV}} + \epsilon}$
   - Polarization Difference: $D_{\mathrm{pol}} = \sigma^0_{\mathrm{VV, dB}} - \sigma^0_{\mathrm{VH, dB}}$
4. **Texture Heterogeneity:**
   - Local standard deviation over window $k=5$: $\sigma_k(x, y)$
   - GLCM Contrast: $\sum_{i,j} |i - j|^2 P_{i,j}$
   - GLCM Entropy: $-\sum_{i,j} P_{i,j} \log_2(P_{i,j} + \epsilon)$

---

### 3.3 `pipeline.change_detect`
Given feature vectors $\mathbf{x}_1, \mathbf{x}_2 \in \mathbb{R}^D$ per pixel:

1. **Feature-Standardized Change Vector Analysis (CVA / CVM):**
   *Scientific Precondition:* Raw multi-sensor channels span different orders of magnitude (e.g. Red reflectance $\in [0, 1]$, raw counts $\in [0, 4000]$, SAR backscatter $\in [-30, 0]\,\text{dB}$). Uncalibrated Euclidean distance causes high-variance channels to blind lower-scale physical bands.
   Therefore, bands are z-score standardized prior to differencing:
   $$z_{t,d} = \frac{x_{t,d} - \mu_d}{\sigma_d + \epsilon}$$
   $$\Delta \mathbf{z} = \mathbf{z}_2 - \mathbf{z}_1$$
   $$\mathrm{CVM} = \|\Delta \mathbf{z}\|_2 = \sqrt{\sum_{d=1}^D (\Delta z_d)^2}$$

2. **Mahalanobis Distance:**
   $$D_M = \sqrt{\Delta \mathbf{x}^T \mathbf{\Sigma}^{-1} \Delta \mathbf{x}}$$
   where $\mathbf{\Sigma} \in \mathbb{R}^{D \times D}$ is the covariance matrix estimated from pseudoinvariant / stable pixels (computed iteratively via robust minimum covariance determinant). Under the null hypothesis of no change, $D_M^2 \sim \chi^2(D)$.

3. **SAR Log-Ratio Change:**
   $$L_R = \ln\left( \frac{\sigma^0_2 + \epsilon}{\sigma^0_1 + \epsilon} \right)$$

4. **Z-Score Normalized Change:**
   $$Z_d = \frac{x_{2,d} - x_{1,d} - \mu_d}{\sigma_d}$$

---

### 3.4 `pipeline.postprocess`
1. **Statistical Thresholding:**
   - **Otsu Global Minimization:** Minimizes intra-class variance on CVM map:
     $$\sigma_w^2(t) = q_1(t)\sigma_1^2(t) + q_2(t)\sigma_2^2(t)$$
     *(With plateau midpoint averaging to guarantee exact thresholds on bimodal/sparse distributions)*.
   - **Chi-Square p-value Significance:** Mask pixel if $p(D_M^2 > \tau) < 0.01$ using the Wilson-Hilferty transformation.

2. **Morphological Filtering:** Binary opening and closing (structuring element disk $r=1$) to remove single-pixel speckle false positives.

3. **Polygonization & Topological Simplification:**
   - Convert binary change mask into vector polygons using connected component labeling and contour simplification.
   - Filter small islands below minimum mapping unit ($A < 100\,\text{m}^2$).

4. **Rigorously Calibrated Ground Area Calculation:**
   *Scientific Correction:* Naive cosine latitude multiplications ($\Delta x \cdot \Delta y \cdot \cos \phi$) are mathematically invalid for planar projected grids and approximate for geographic ellipsoids. SatQuery computes pixel ground area directly from the Affine Geotransform Jacobian determinant:
   $$A_{\text{pixel}} = |\det(J)| = |a \cdot e - b \cdot d|$$
   where $\begin{pmatrix} a & b \\ d & e \end{pmatrix}$ represents the spatial coordinate transformation matrix ($x_{\text{geo}} = c + ax + by, y_{\text{geo}} = f + dx + ey$).
   For geographic CRS (EPSG:4326), ellipsoidal geodesic integration scales with $\cos \phi$.
   Total changed area:
   $$A_{\text{changed}} = \sum_{p \in M} A_{\text{pixel}}(p)$$
   **Boundary Perimeter Uncertainty Bounds:** Rather than claiming "exact area", SatQuery reports area uncertainty bounds derived from registration RMSE and perimeter edge pixels:
   $$\delta_{\text{area}} = 4 \sqrt{N_{\text{changed}}} \cdot \mathrm{RMSE}_{\text{reg}} \cdot A_{\text{pixel}}$$
   $$\mathrm{CI}_{95}(A) = [A_{\text{changed}} - 1.96 \delta_{\text{area}},\, A_{\text{changed}} + 1.96 \delta_{\text{area}}]$$

---

### 3.5 `pipeline.evidence` & Multi-Source Uncertainty Propagation
Remote-sensing uncertainty is multifaceted. SatQuery decomposes confidence across five observable dimensions rather than reporting a monolithic "AI confidence":
$$U_{\text{total}} = f(U_{\text{sensor}}, U_{\text{registration}}, U_{\text{radiometric}}, U_{\text{segmentation}}, U_{\text{classification}})$$

1. **Data Quality Confidence ($C_{\text{data}}$):** Driven by sensor SNR and cloud obscuration.
2. **Registration Confidence ($C_{\text{reg}}$):** Function of subpixel phase cross-correlation RMSE relative to spatial resolution.
3. **Change Detection Confidence ($C_{\text{change}}$):** Signal-to-noise separation between changed and invariant background distributions.
4. **Semantic Classification Confidence ($C_{\text{semantic}}$):** Entropy of VLM / spectral land-cover class assignment.
5. **Overall Evidence Quality ($C_{\text{overall}}$):** Calibrated composite score; flags whether analysis is statistically trustworthy ($\ge 0.70$).
6. **First-Order Taylor Propagation on CVM:**
   $$\sigma_{\mathrm{CVM}}^2 \approx \sum_{d=1}^D \left( \frac{\partial \mathrm{CVM}}{\partial x_{2,d}} \right)^2 \sigma_{x_{2,d}}^2 + \left( \frac{\partial \mathrm{CVM}}{\partial x_{1,d}} \right)^2 \sigma_{x_{1,d}}^2$$
   $$\mathrm{CI}_{95}(\mathrm{CVM}) = [\overline{\mathrm{CVM}} - 1.96\sigma_{\mathrm{CVM}},\, \overline{\mathrm{CVM}} + 1.96\sigma_{\mathrm{CVM}}]$$
7. **Deterministic Cryptographic Fingerprint:** SHA-256 hash of all input arrays, metrics summary, and vector GeoJSON ensures non-repudiation and complete audit reproducibility.

---

## 4. Input & Output Contract (Schema)

### Output JSON Payload (`analysis_result`)
```json
{
  "execution_id": "sq-det-20260904-89f4b",
  "provenance": {
    "pipeline_version": "2.0.0",
    "git_commit": "a1b2c3d4",
    "timestamp": "2026-09-04T14:30:00Z",
    "sensor_t1": "Sentinel-2A L2A",
    "sensor_t2": "Sentinel-2B L2A",
    "input_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  "spatial_alignment": {
    "crs": "EPSG:32645",
    "pixel_resolution_m": 10.0,
    "coregistration_rmse_m": 1.42,
    "alignment_status": "COREGISTRATION_PASSED"
  },
  "metrics_summary": {
    "total_scene_pixels": 262144,
    "changed_pixels": 14280,
    "change_percentage": 5.447,
    "changed_area_m2": 1428000.0,
    "changed_area_ha": 142.8,
    "mean_cvm": 0.418,
    "mean_mahalanobis": 3.12
  },
  "per_class_breakdown": {
    "vegetation_loss": {
      "pixel_count": 8200,
      "area_m2": 820000.0,
      "mean_ndvi_delta": -0.42
    },
    "new_built_up": {
      "pixel_count": 4800,
      "area_m2": 480000.0,
      "mean_ndbi_delta": 0.38
    },
    "water_dynamic": {
      "pixel_count": 1280,
      "area_m2": 128000.0,
      "mean_ndwi_delta": 0.51
    }
  },
  "uncertainty_bounds": {
    "area_uncertainty_pct": 2.85,
    "area_95ci_m2": [1387200.0, 1468800.0],
    "cvm_95ci": [0.395, 0.441]
  },
  "vector_features_geojson": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": { "type": "Polygon", "coordinates": "..." },
        "properties": {
          "feature_id": 1,
          "class": "vegetation_loss",
          "area_m2": 45200.0,
          "confidence_score": 0.94
        }
      }
    ]
  },
  "mask_artifacts": {
    "binary_mask_url": "/api/artifacts/sq-det-20260904-89f4b/change_mask.png",
    "cvm_heatmap_url": "/api/artifacts/sq-det-20260904-89f4b/cvm_heatmap.png"
  }
}
```

---

## 5. Verification & Unit Testing Strategy

The engine includes rigorous synthetic and benchmark unit tests in `tests/pipeline/`:
- `test_coregistration.py`: Synthetically shift an image by known $(\Delta x, \Delta y)$ with Gaussian noise; assert recovered shift matches true offset within $\pm 0.1$ pixel.
- `test_indices.py`: Test boundary conditions for NDVI/NDWI (e.g., zero denominators, edge reflectance); assert strict $[-1.0, 1.0]$ bounds.
- `test_change_math.py`: Run identical inputs $X_1 = X_2$; assert $\mathrm{CVM} \equiv 0$, $D_M \equiv 0$, and changed area is strictly 0.
- `test_area_conservation.py`: Create synthetic geometric shapes (100 px square at 10m res); assert computed area equals exactly $10{,}000\,\text{m}^2 \pm 0.1\%$.
- `test_llm_number_drift.py`: Feed `analysis_result` to Ollama LLM client for text narration; run regex assertion confirming that every numerical claim in narration matches `metrics_summary` verbatim.
