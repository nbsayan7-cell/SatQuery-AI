# 🛠️ SatQuery AI — Troubleshooting Log

> **Purpose:** Every significant bug and its fix (RULE 011). For a beginner team this
> becomes a personal engineering textbook — future you (and future agents) search here
> first before re-solving a solved problem.

---

## BUG #004
Date: 2026-09-03 Problem: VQA endpoint returned HTTP 500. Symptoms: Frontend showed "Analysis failed." No answer rendered. Cause: The VQA model expected a 3-channel RGB image, but Sentinel-2 uploads arrived as multi-band GeoTIFF; the raw array shape (13, H, W) broke the model input. Fix: Added RGB conversion + band selection in ai/preprocessing.py; models now always receive a normalized 3-channel tensor. Files: ai/preprocessing.py, ai/models/vqa.py How to detect: run tests/test_vqa.py with a multi-band sample; before the fix it 500s. Prevention: preprocessing is now the single entry point for all model inputs. Status: FIXED