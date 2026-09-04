# 🛰️ SatQuery AI — Datasets Knowledge Base



> **Purpose:** One entry per dataset: what it is, why we use it, its modalities, license,

> and how it maps to an SIH requirement. The SIH problem statement specifically names

> BigEarthNet, VRSBench, RSVQA, and CDVQA for different purposes — this file preserves that

> mapping so we never lose it.



---



## Dataset → SIH purpose mapping (the key table)

| Dataset | Modalities | SIH purpose | Maps to |

|---------|-----------|-------------|---------|

| BigEarthNet v2.0 | Sentinel-1 SAR + Sentinel-2 optical | representation / adaptation + fusion eval | R4 |

| VRSBench | optical RS imagery | captioning + grounding + VQA eval | R2 |

| RSVQA | optical RS imagery | single-image VQA eval | R1 |

| CDVQA | multi-temporal RS imagery | change-detection VQA eval | R3 |



---



## BigEarthNet v2.0

Purpose: Multimodal RS representation + optical/SAR fusion. Modalities: Sentinel-1 (SAR), Sentinel-2 (multispectral). Size: 549,488 co-registered patch pairs. Used for: R4 fusion adaptation & evaluation. License: <FILL — verify at bigearth.net; has specific terms>. Download: https://bigearth.net/ Preprocessing: band selection, normalization, co-registration already provided. Known limits: patch-level (not scene-level); class taxonomy is land-cover focused.

## TEE Historical Imagery Sources (for the Temporal Earth Explorer)

> These feed the globe's timeline. Verify each license before use and record in
> 18-LICENSES-AND-CREDITS.md. Do NOT redistribute cached tiles unless the license permits.

### NASA GIBS (Global Imagery Browse Services)
- Purpose: date-stamped daily global tiles — the timeline scrubber's primary source.
- Access: date-parameterized tile URLs (WMTS/tile pyramid). URL: https://nasa-gibs.github.io/gibs-api-docs/
- History: broad daily coverage for many layers. License: <FILL — verify (NASA imagery is
  generally open, but confirm the specific layer's terms)>.

### Landsat archive (USGS / AWS Open Data)
- Purpose: deep history (decades) for "20 years ago" views. Free since 2008.
- Access: STAC temporal search over bbox + date range, then read bands. URL: https://www.usgs.gov/landsat-missions/landsat-data-access
- License: <FILL — verify (public domain / open, confirm)>.

### Sentinel-2 (optical) / Sentinel-1 (SAR)
- Purpose: recent optical and optional SAR for fusion (R4) from the globe.
- Access: STAC. URL: https://stacspec.org/ (and Copernicus/AWS endpoints).
- License: <FILL — verify Copernicus terms>.
