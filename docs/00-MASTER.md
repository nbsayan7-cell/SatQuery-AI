# SatQuery AI — MASTER ENGINEERING DOCUMENT

**Version:** 2.0 · **Status:** Living master document · **Owner:** SatQuery Engineering
**Last updated:** 2026-09-04
**Supersedes:** individual doc summaries — this is the single integrated reference.
**Companion docs:** 01-PRD → 18-LICENSES, CODEBASE-MAP.md, BENCHMARK-RESULTS.md.

> **What this document is.** The one document that ties the entire project together:
> product, architecture, the deterministic change-analysis engine, the AI/VLM strategy,
> the training/fine-tuning plan (with an honest hardware reality check), the curated set
> of free open repos and datasets, evaluation, and the operating loop. Where a claim is
> unverified or a value undecided, it is marked <FILL> or TBD — never invented (RULE 005).

---

## PART 0 — THE HONEST FOUNDATION (read this first)

Three truths shape every decision in this document:

1. **Numeric accuracy comes from deterministic math, not from the model.** Change metrics
   (difference, change-vector magnitude, Mahalanobis distance, log-ratio, areas) are
   computed with classical, reproducible formulas. A wrong or hallucinating LLM cannot
   corrupt a number, because the LLM only *narrates* numbers it is handed — it never
   computes or edits them. This embeds NASA/ISRO-inspired scientific processing principles:
   calibrated data, spatial validation, reproducible processing, quantitative measurements,
   uncertainty bounds, and non-repudiable provenance.

2. **You cannot train a VLM from scratch on an RTX 4060 (8 GB) in a hackathon.** Full
   fine-tuning of a 7B VLM needs ~80–160 GB VRAM. What is real on your hardware:
   zero-shot use of pretrained RS models, and **QLoRA/LoRA** adaptation of a small
   (2–4B) VLM. Everything about "training with more free web data" below is scoped to
   what actually runs on your machine.

3. **cs249r_book is a curriculum, not a component.** The Harvard Machine Learning Systems
   book (harvard-edge/cs249r_book, `dev` branch) is integrated as your *engineering
   knowledge base* — it teaches data pipelines, training discipline, evaluation,
   deployment, and edge constraints. It is not code you import or data you train on.
   Its role is Part 7 below.

---

## PART 1 — EXECUTIVE SUMMARY

SatQuery AI analyzes Earth-observation imagery at the pixel level, computes quantitative
change metrics between co-registered image pairs, and produces rigorously grounded,
confidence-scored evidence. It ingests multispectral optical (Sentinel-2 L2A) and SAR
(Sentinel-1 GRD) imagery, applies radiometric/atmospheric correction and co-registration,
extracts per-pixel features (reflectance, spectral indices, SAR backscatter, texture),
then computes deterministic statistical change metrics with propagated uncertainty.
Specialist open VLMs (via GoldenEye / UniRS / DOFA features) handle interpretation and
question-answering; an orchestration agent routes each query; and an evidence engine
attaches confidence and a full audit trail to every result. All datasets and models are
free/open. The system satisfies the SIH requirements: single-image VQA, captioning and
grounding, bi-temporal change, optical+SAR fusion, agent orchestration, confidence, and
audit trail.

---

## PART 2 — SYSTEM ARCHITECTURE (integrated)

Three tiers, strictly separated:
a **presentation tier** (React, no inference), an **application tier** (FastAPI:
validation, routing, sessions), and an **intelligence tier** (the deterministic numeric
engine + the agent + models + evidence). Critically, the intelligence tier has **two
independent lanes** that meet only at the end:

```
                         ┌──────────────────────────────┐
   image pair ──────────►│  DETERMINISTIC NUMERIC LANE   │──► metrics, masks,
   (optical + SAR)       │  preprocess → features →      │    areas, uncertainty
                         │  change math → thresholding   │    (the TRUTH)
                         └───────────────┬──────────────┘
                                         │ numbers handed over, never edited
   question ────────────►┌───────────────▼──────────────┐
                         │  INTERPRETIVE VLM LANE        │──► natural-language
                         │  agent → VLM (VQA/caption/    │    answer + grounding
                         │  grounding) reads image+numbers│
                         └───────────────┬──────────────┘
                                         ▼
                              EVIDENCE ENGINE (confidence + audit trace)
                                         ▼
                              analysis_result JSON → UI
```

This separation is the single most important architectural idea in the project: **the LLM
can be wrong without making a number wrong.**

---

## PART 3 — DETERMINISTIC NUMERIC ENGINE SPECIFICATION

See detailed specification in `docs/SPEC-PIPELINE-ENGINE.md`.

---

## PART 4 — INTERPRETIVE VLM & QLORA TRAINING SPECIFICATION

See detailed specification in `docs/SPEC-QLORA-TRAINING.md`.

---

## PART 5 — VERIFIED REPO & RESOURCE INDEX (all free/open)

Engineering knowledge base: harvard-edge/cs249r_book (dev) — mlsysbook.ai.
Geospatial ML: torchgeo/torchgeo · isaaccorley/torchrs · isaaccorley/goldeneye.
Change detection: likyoo/open-cd (+ likyoo/BAN).
Foundation features: zhu-xlab/DOFA (HF: earthflow/DOFA).
Multi-temporal VLM reference: UniRS (arXiv 2412.20742).
SAR despeckling: emanueledalsasso/SAR2SAR (GPL-3.0).
RS foundation-model survey: Jack-bo1220/Awesome-Remote-Sensing-Foundation-Models.
Datasets: bigearth.net · lx709/VRSBench · rsvqa.sylvainlobry.com · CDVQA (arXiv 2112.06343)
· SEN12MS · LEVIR-CD · OSCD · xView2 · HF BIFOLD-BigEarthNetv2-0/BigEarthNet.txt.
Dev tooling: addyosmani/agent-skills · Graphify-Labs/graphify · Ponytail · GitHub MCP ·
Playwright MCP.

> Every license marked (verify)/<FILL> must be confirmed on its source before use and
> recorded in 18-LICENSES-AND-CREDITS.md. No license is stated here from memory as final.
