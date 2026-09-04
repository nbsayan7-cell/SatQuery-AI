# SatQuery AI — Product Requirements Document



**Version:** 1.0

**Status:** Living document — updated whenever product scope changes

**Owner:** <FILL: product lead name>

**Contributors:** <FILL: team members>

**Last updated:** <FILL: date>

**Related docs:** 02-ARCHITECTURE.md · 04-PHASES.md · 06-FEATURE-TICKETS.md · 12-TESTING.md



> **How to read this document.** This is the product *contract*. Every feature, ticket,

> and test in this repository must trace back to a statement made here. If you find

> yourself building something that isn't described in this PRD, stop — either the thing

> is out of scope, or the PRD needs updating first. The single most load-bearing section

> is §10, the SIH Compliance Matrix; before submission, every row in it must be green

> and demonstrable.



---



## 1. Project Overview



SatQuery AI is a web application that lets people ask questions about satellite imagery in

plain English and get trustworthy, evidence-backed answers. Today, extracting information

from Earth-observation data — how much of an area is flooded, how many buildings appear in

a scene, what changed between two dates, whether a region is under cloud cover — requires a

trained remote-sensing analyst working with specialized GIS software. That expertise is

scarce and slow, and it is the real bottleneck between the enormous volume of satellite data

being collected and the decisions that data could inform.



SatQuery removes that bottleneck by putting a natural-language interface in front of a set of

remote-sensing AI capabilities: single-image visual question answering, automatic image

captioning, visual grounding (identifying *where* in an image an answer applies), bi-temporal

change detection, and fusion of optical and radar (SAR) imagery. These capabilities are

coordinated by an orchestration agent that interprets each question and decides which

capability or sequence of capabilities to invoke. Critically, every answer the system

produces is accompanied by a confidence score, the visual evidence behind it, and a complete

audit trail of the steps the agent took — so the user is never asked to trust a black box.



The product is built as a hackathon deliverable for problem statement SIH26167, but it is

architected so that the same core could grow into an operational tool for disaster response,

agricultural monitoring, and environmental analysis after the hackathon.



## 2. Official SIH Problem Statement



**Problem Statement ID:** SIH26167

**Title:** <FILL: exact official title — paste verbatim>

**Organization / Ministry:** <FILL>

**Category:** Software

**Theme:** <FILL>



**Verbatim problem statement:**



> <FILL: Paste the complete official problem statement text here, word for word. Do not

> paraphrase or summarize it. This exact text is the authority against which §10 (the

> Compliance Matrix) is checked. If the official statement is updated, update it here and

> re-verify every row of §10.>



**Interpretation note.** Where the official statement names specific datasets — BigEarthNet,

VRSBench, RSVQA, and CDVQA — we treat each as authoritative for the purpose it is associated

with in the statement, and we preserve that mapping in 16-DATASETS.md. We do not substitute

other datasets for the named ones without recording a decision in 09-DECISIONS.md and noting

the deviation against this PRD.



## 3. Problem Explanation



A single modern optical satellite scene, such as one from Sentinel-2, carries thirteen

spectral bands — far more than the three (red, green, blue) that a normal photograph has,

and including bands the human eye cannot see, like near-infrared and shortwave infrared,

which are exactly the bands most useful for measuring vegetation, water, and burn scars.

Radar imagery, from sensors like Sentinel-1, looks nothing like a photograph at all; it

measures how radio waves bounce off surfaces, and reading it correctly is a specialist skill.



Because of this complexity, turning a question like "how much of this region flooded between

March and June?" into an answer today involves several manual steps: acquiring the right

scenes for both dates, ensuring they cover the same ground, choosing the right spectral bands

or radar processing, running a change-detection or classification workflow in GIS software,

and interpreting the result. Each step needs expertise, and the whole chain can take hours.



SatQuery collapses this chain. The *question* is expressed in ordinary language, the *answer*

is returned in ordinary language, and every technical decision in between — which band, which

model, which comparison — is made by the system on the user's behalf. The user does not lose

control, because each answer arrives with a confidence score and the evidence behind it, so

they can accept it, question it, or dig into the audit trail to see exactly how it was

produced.



## 4. Why This Problem Matters



Earth observation is foundational to a wide range of high-stakes activities. Disaster response

teams use it to map floods, wildfires, and landslides while events are still unfolding.

Agricultural agencies use it to monitor crop health and predict yields across entire regions.

Urban planners use it to track construction and land use. Environmental bodies use it to

measure deforestation and water resources. In every one of these domains, the data already

exists — satellites are collecting it continuously — but the ability to interrogate that data

quickly is limited by the number of trained analysts available.



This matters most precisely when time matters most. During an active flood, the difference

between an answer in five minutes and an answer in five hours is measured in lives and

property. A natural-language interface that lowers the expertise barrier — while keeping the

output auditable and confidence-scored so it remains trustworthy for real decisions — directly

addresses the gap between data availability and decision-making speed. Lowering the barrier

without lowering the trustworthiness is the specific contribution SatQuery aims to make.



## 5. Target Users



The primary user is the **remote-sensing scientist or analyst**: someone technically literate

in the domain who wants to move faster and test more hypotheses without repetitive scripting.

The secondary users are **disaster-response coordinators**, who need fast, actionable answers

under pressure and care more about the map and the confidence than the model internals;

**government and policy analysts**, who need defensible, auditable outputs they can cite in

reports; and **students and researchers**, for whom SatQuery is an accessible on-ramp into

remote-sensing AI. The system is designed so that the same interface serves all four, with the

evidence and audit-trail features carrying the trust requirements of the more demanding users.



## 6. User Personas



**Dr. Anjali Rao — Remote-Sensing Scientist (primary).** Anjali holds a PhD in geospatial

science and analyzes dozens of scenes per week. Her goal is to test hypotheses quickly across

many images. Her frustration is the repetitive GIS scripting each analysis demands. She needs

fast VQA, reliable grounding so she can visually verify claims, and a confidence figure she is

comfortable citing. She is skeptical of black-box AI and will trust SatQuery only if it shows

its work.



**Ravi Menon — Disaster-Response Coordinator (secondary).** Ravi coordinates field teams

during floods and cyclones. His goal during an event is a fast answer to "which areas flooded,

how badly, since last week?" His frustration is waiting for a specialist to become available.

He needs bi-temporal change detection presented as a clear map with a confidence he can act on

immediately; he does not care how the model works, only whether he can rely on it.



**Meera Iyer — Policy Analyst (secondary).** Meera writes reports that inform funding and

regulation. Her goal is defensible evidence. Her frustration is outputs she cannot explain to a

committee. She needs the audit trail and evidence engine so that every figure in her report can

be traced to how the system produced it.



## 7. Product Vision



Any decision-maker should be able to ask the Earth a question and receive a trustworthy,

evidence-backed answer in seconds, regardless of their GIS expertise. The long-term vision is a

system where the interface is language, the intelligence is a coordinated set of

remote-sensing specialists, and the trust comes from confidence and auditability being

first-class features rather than afterthoughts.



## 8. Product Goals



The product must be able to answer natural-language questions about a single satellite image;

describe imagery automatically and localize the objects or regions a question refers to;

detect and quantify change between two co-registered images from different dates; fuse optical

and SAR modalities so that answers remain robust when one modality is degraded (for example,

when clouds obscure the optical view); orchestrate all of these capabilities through a single

agent so the user asks only once; attach a confidence score and supporting evidence to every

answer; and maintain a complete audit trail of every decision the agent makes and every tool

it calls. Each of these goals corresponds to a requirement in §10 and, ultimately, to code and

tests elsewhere in the repository.



## 9. Non-Goals



SatQuery is deliberately not a general-purpose GIS suite; it will not attempt to replicate a

full raster-editing toolkit. It will not train a foundation model from scratch; within the

hackathon window we adapt and orchestrate existing open models rather than incurring the cost

and risk of training. It will not control satellite tasking or data acquisition; it works with

imagery the user provides or that is fetched from open sources. It will not be a

production-hardened, multi-tenant SaaS during the hackathon; concerns like horizontal scaling,

billing, and enterprise authentication are explicitly deferred. And the three-dimensional

"God's Eye" visualization layer is explicitly an enhancement, not a core deliverable — it

exists to make the demo memorable, not to satisfy any requirement.



## 10. Mandatory SIH Requirements — Compliance Matrix



This is the most important table in the document. Status legend: 🔴 not started · 🟡 in

progress · 🟢 done, tested, and demonstrable. A row may only be marked 🟢 when there is a

passing test recorded in 12-TESTING.md *and* a moment in 13-DEMO-SCRIPT.md that shows it live.

Feeling "done" is not "done."



| # | SIH Requirement | Our Feature | Implementation (files) | Test / Evidence | Demo moment | Status |

|---|-----------------|-------------|------------------------|-----------------|-------------|--------|

| R1 | Single-image VQA | Remote-sensing VLM | `ai/models/vqa.py`, `/api/query` | `scripts/eval_vqa.py` (RSVQA sample) | 0:45–1:15 | 🔴 |

| R2a | Captioning | Captioning module | `ai/models/caption.py` | `tests/test_caption.py` | 1:15–1:30 | 🔴 |

| R2b | Visual grounding | Grounding module + overlay | `ai/models/grounding.py`, `MapViewer.tsx` | `scripts/eval_grounding.py` (VRSBench) | 1:30–1:45 | 🔴 |

| R3 | Bi-temporal change | Change-detection module | `ai/models/change.py`, `/api/analyze/change` | `tests/test_change.py` (CDVQA) | 2:00–2:30 | 🔴 |

| R4 | Optical + SAR | Fusion pipeline | `ai/fusion/` | `tests/test_fusion.py` (BigEarthNet) | 2:30–3:00 | 🔴 |

| R5 | Agent orchestration | SatQuery Agent | `ai/agent.py` | `tests/test_agent_routing.py` | 3:00–3:30 | 🔴 |

| R6 | Confidence | Evidence engine | `ai/evidence/` | `tests/test_evidence.py` | 3:30–4:00 | 🔴 |

| R7 | Audit trail | Agent execution log | `ai/agent/trace.py`, `/api/trace/{id}` | `tests/test_trace.py` | 3:00–3:30 | 🔴 |

| R8 | <FILL: any further PS requirement> | <FILL> | <FILL> | <FILL> | <FILL> | 🔴 |



This matrix must always agree with the SIH Requirement Test Matrix in 12-TESTING.md and the

SIH Requirement → Code Mapping in 07-CODEBASE.md §18. If any of the three disagree, the project

is in an inconsistent state and the disagreement must be resolved before further work.



## 11. MVP



The minimum viable product is the smallest build that is still worth demonstrating: a user

uploads one image, asks one visual-question-answering question, and receives a natural-language

answer accompanied by a confidence score and a highlighted region on the map. Concretely, this

means requirements R1, R2b (grounding), R6 (confidence), and R7 (audit trail) reach a

demonstrable state. If time collapses and only the MVP is built, the team still has a coherent,

defensible, honest submission — a working remote-sensing assistant that answers, points, scores

its confidence, and shows its reasoning. Everything beyond the MVP is additive, and the build

order in 04-PHASES.md is deliberately arranged to reach this MVP early.



## 12. Core Features



The core feature set, targeted at priority levels P0 and P1, comprises image upload with proper

handling of PNG, JPEG, and GeoTIFF formats; single-image visual question answering; automatic

captioning; visual grounding that renders the referenced region as a map overlay; agent

system produced an answer and how confident it is, so that I can cite the result responsibly in

a report. As an SIH judge, I want to inspect the agent's reasoning trace and see that answers are

confidence-scored, so that I can trust the pipeline is real rather than staged. Each of these

stories has a home in the Compliance Matrix and a corresponding acceptance criterion in the

feature tickets.



## 14. God's Eye — Temporal Earth Explorer (TEE)

> This section replaces the old "launch an external site" idea with an original feature
> built by us. It remains P3/P4: an enhancement, never a core SIH requirement. Nothing
> in R1–R7 may depend on it. But unlike a decorative globe, TEE is functional — it is a
> *data source* that feeds imagery directly into our existing analysis pipeline.

**What it is.** An interactive 3D globe with a time dimension. The user flies to any
location, scrubs a timeline to pick a moment in history — the same place as it looked one
year ago, ten years ago, twenty years ago — draws a rectangle over the exact area of
interest, and clicks "Analyze this view." TEE captures that historical satellite view as an
image of that specific area and hands it straight to the existing SatQuery pipeline
(upload → agent → VQA / grounding / change / evidence). The globe becomes the front door to
our own analysis engine.

**The core idea in one line.** *Browse the planet through time → select a place and a date →
extract that view as an image → analyze it with the tools we already built.*

**Why this is powerful for our project.** It solves the "where do I get imagery?" problem.
Instead of the user needing to find and upload a GeoTIFF, they navigate visually and let TEE
fetch the right historical scene. It also makes our change-detection feature (R3) dramatically
more compelling: the user extracts the *same* rectangle at two different dates from the globe
and runs change analysis on the pair — no manual co-registration, because the tiles are
already aligned to the same geographic grid.

**Data types TEE exposes (all from open, licensed sources — see 16-DATASETS.md):**
- **Recent / near-live optical** — recent Sentinel-2 or daily NASA GIBS layers.
- **Historical optical** — Landsat archive (imagery back decades; free since 2008), for the
  "20 years old" views.
- **Time-stamped daily layers** — NASA GIBS pre-generated tiles with a date parameter, ideal
  for the timeline scrubber.
- (Optional, post-hackathon) **SAR layers** — Sentinel-1, to feed the optical+SAR fusion (R4).

**User flow inside TEE:**
1. Open the Temporal Earth Explorer (a separate, isolated route — the core app is unaffected).
2. Fly to a location (search a place name or drag the globe).
3. Move the timeline slider to a date; the globe re-drapes with imagery from that date.
4. Draw a bounding rectangle over the area of interest.
5. Click "Extract & Analyze" → TEE renders that rectangle at the chosen date into an image →
   pushes it into the normal `POST /api/upload` + `POST /api/query` flow.
6. (Change mode) Pick a second date for the same rectangle → TEE extracts both →
   `POST /api/analyze/change`.

**What TEE is NOT (scope guardrails).** It is not a Google Earth clone; it does not embed or
launch any third-party site; it does not need to be photorealistic; and it is only built once
R1–R7 are green (PRD §10). If TEE is unfinished at the deadline, the submission is unaffected
because the core pipeline stands alone and imagery can still be uploaded manually.

**TEE success criteria (demo-level, not scored):** the globe renders and rotates smoothly; the
timeline changes the draped imagery; a drawn rectangle can be extracted to an image; and that
image flows into the existing analysis pipeline and returns a real answer.

## 17. Success Metrics



Success is measured against concrete, honestly-reported targets. VQA answer plausibility should

reach at least eighty percent on a held-out RSVQA sample, measured by a combination of automatic

and manual evaluation in `scripts/eval_vqa.py`. Grounding accuracy should reach an

intersection-over-union of at least 0.5 on a VRSBench sample, measured by

`scripts/eval_grounding.py`. Change-detection results should qualitatively agree with CDVQA

references on a curated sample, with the review logged in 12-TESTING.md. End-to-end latency

should stay under ten seconds per query on the demo hardware. And demo completeness — the number

of the eight requirements shown live in a full dry run of the demo script — should reach eight

out of eight. Every one of these numbers is measured, never invented; an unmeasured metric is

reported as "TBD," per RULE 005.



## 18. Constraints



The project operates under several hard constraints. Time is limited to the hackathon window,

which pushes every choice toward adapting existing models rather than training new ones. Compute

is limited to <FILL: the specific hardware available>, and every model choice must run on it

within the latency target. The team is a beginner team working through AI coding agents, which

makes simplicity a hard requirement rather than a preference — an elegant-but-complex solution

that the team cannot maintain or explain is a failure. Data must come from openly licensed

sources, documented in 16-DATASETS.md and 18-LICENSES-AND-CREDITS.md. And the demo venue may

have poor or no connectivity, so the system must be able to run entirely offline during the

demonstration, with models cached locally and sample data committed to the repository.



## 19. Hackathon Scope



For the purpose of judging, the team commits to the following scope: requirements R1, R2, R5,

R6, and R7 fully working end to end; requirements R3 and R4 working on curated sample data; and

the God's Eye layer present as a polished visual accent. This scope is the promise the team makes

to itself and to the judges. Anything delivered beyond it is a bonus, and anything that threatens

this scope takes priority over new work. The build order in 04-PHASES.md is arranged so that this

committed scope is reached with margin before the deadline rather than in a final scramble.



## 20. Post-Hackathon Vision



After the hackathon, the natural evolution is cloud deployment for multi-user access; live

ingestion of satellite data from open catalogs, most likely through a remote-sensing MCP such as

MCP4RS, so that users no longer need to supply their own imagery; domain-specific fine-tuning of

the underlying models on the datasets documented in 16-DATASETS.md to push past the plausibility

and IoU targets; multi-user session management with proper authentication; and an operational

disaster-response mode with alerting and continuous monitoring of designated regions. None of

this is in scope for the hackathon, but the architecture in 02-ARCHITECTURE.md is deliberately

kept clean enough that each of these is an extension rather than a rewrite.