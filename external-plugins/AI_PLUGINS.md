# 🤖 AI Plugins — God's Eye View

> 17 AI plugins configured and ready. This doc is the single reference for what's installed, where it lives, and how to use it.

---

## ⚡ Quick Reference

| Command | What It Does |
|---------|-------------|
| `npm run ai:gateway` | Start OmniRoute — unified AI gateway (1200+ models) |
| `npm run ai:scan` | Run Semgrep security scan on `src/` |
| `npm run ai:flowise` | Start Flowise visual AI pipeline builder |
| `npm run ai:toolkit:setup` | Install Python AI toolkit (CrewAI, LangGraph, DSPy, etc.) |

---

## 📁 Where Everything Lives

```
gods-eye-view-main/
├── .agents/
│   ├── rules/
│   │   ├── ponytail.md          ← Lazy senior dev rules (always active)
│   │   └── agent-quality.md     ← Structured dev lifecycle (always active)
│   └── skills/                  ← 25 development workflow skills
│       ├── spec-driven-development/
│       ├── debugging-and-error-recovery/
│       ├── code-review-and-quality/
│       ├── security-and-hardening/
│       ├── performance-optimization/
│       └── ... (20 more)
├── ai-tools.config.js           ← Central plugin registry
├── ai-toolkit/
│   ├── requirements.txt         ← Python dependencies
│   └── setup.ps1                ← One-command Python setup
└── AI_PLUGINS.md                ← This file

../sih/ai-plugins/               ← Downloaded plugin repos
├── ponytail/                    ← Source: Ponytail rules
├── agent-skills/                ← Source: 25 dev workflow skills
├── OmniRoute/                   ← AI gateway (350+ providers)
├── Flowise/                     ← Visual AI pipeline builder
├── semgrep/                     ← Code security scanner
├── langfuse/                    ← LLM observability
├── crewAI/                      ← Multi-agent framework
├── langgraph/                   ← Workflow orchestration
├── dspy/                        ← Prompt optimization
├── ragflow/                     ← Document RAG engine
├── graphiti/                    ← Temporal knowledge graphs
├── giskard/                     ← AI security testing
├── open-webui/                  ← Self-hosted chat UI
├── lobe-chat/                   ← Plugin-based chat UI
├── LibreChat/                   ← Enterprise chat platform
├── anything-llm/                ← Local document RAG
└── graphify/                    ← Graph data visualization
```

---

## 🟢 Mode A — Always Active (Agent Rules & Skills)

These are loaded automatically by Antigravity every time you chat.

### Ponytail Rules
- **File:** `.agents/rules/ponytail.md`
- **Effect:** AI writes minimal, efficient code. Reuses existing patterns. Deletes over adds.
- **Source:** [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail)

### Agent Quality Rules
- **File:** `.agents/rules/agent-quality.md`
- **Effect:** AI follows structured development lifecycle (DEFINE → PLAN → BUILD → VERIFY → REVIEW → SHIP)
- **Source:** [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)

### 25 Development Skills
- **Location:** `.agents/skills/`
- **Available skills:**

| Skill | When It's Used |
|-------|---------------|
| `spec-driven-development` | New features — write spec before code |
| `planning-and-task-breakdown` | Complex tasks — structured planning |
| `incremental-implementation` | Building features step-by-step |
| `test-driven-development` | Writing tests first |
| `debugging-and-error-recovery` | Bug fixes — root cause analysis |
| `code-review-and-quality` | Reviewing code changes |
| `code-simplification` | Refactoring & cleanup |
| `api-and-interface-design` | Designing APIs |
| `frontend-ui-engineering` | UI/UX work |
| `security-and-hardening` | Security improvements |
| `performance-optimization` | Speed & efficiency |
| `shipping-and-launch` | Release readiness |
| `context-engineering` | Managing AI context |
| `observability-and-instrumentation` | Logging & monitoring |
| `documentation-and-adrs` | Writing docs & ADRs |
| `browser-testing-with-devtools` | Browser testing |
| `ci-cd-and-automation` | CI/CD pipelines |
| `constraint-driven-development` | Working within constraints |
| `deprecation-and-migration` | Deprecating old code |
| `doubt-driven-development` | Questioning assumptions |
| `git-workflow-and-versioning` | Git best practices |
| `idea-refine` | Refining ideas |
| `interview-me` | Clarifying requirements |
| `source-driven-development` | Source-first development |
| `using-agent-skills` | Meta: how to use skills |

---

## 🔧 Mode B — On-Demand Tools

### OmniRoute — AI Gateway
```bash
npm run ai:gateway
```
- **What:** Single endpoint for 1200+ AI models from 350+ providers
- **Port:** `http://localhost:20128/v1`
- **Features:** Auto-failover, token compression (15-95% savings), free-tier aggregation
- **Setup:** Needs `npm install` in `../sih/ai-plugins/OmniRoute/` first
- **Config:** Set API keys via OmniRoute's built-in dashboard

### Semgrep — Code Scanner
```bash
npm run ai:scan
```
- **What:** Static analysis scan on `src/` for security vulnerabilities
- **Languages:** JavaScript, Python, and 15+ more
- **Output:** Terminal report with findings and fix suggestions

### Flowise — Visual AI Builder
```bash
npm run ai:flowise
```
- **What:** Drag-and-drop visual builder for LLM chains and RAG pipelines
- **Port:** `http://localhost:3000`
- **Use for:** Prototyping complex AI workflows without code

---

## 🐍 Mode C — Python AI Toolkit

### Setup (one time)
```bash
npm run ai:toolkit:setup
```
This creates a virtual environment and installs all Python AI tools.

### Available Tools

| Tool | Import | Use For |
|------|--------|---------|
| **CrewAI** | `from crewai import Agent, Task, Crew` | Multi-agent task execution |
| **LangGraph** | `from langgraph.graph import StateGraph` | Complex workflow orchestration |
| **DSPy** | `import dspy` | Systematic prompt optimization |
| **Graphiti** | `from graphiti_core import Graphiti` | Temporal knowledge graphs |
| **Giskard** | `import giskard` | AI/LLM security testing |
| **LangChain** | `from langchain import *` | Core AI framework |

---

## 📚 Mode D — Reference Repos

These are full applications available at `../sih/ai-plugins/`. Components will be pulled from them when you request specific features.

| Repo | Stars | Use When You Want |
|------|-------|------------------|
| **Open WebUI** | 80k+ | Self-hosted ChatGPT UI with RAG |
| **LobeChat** | 60k+ | Modern chat UI with plugins & TTS |
| **LibreChat** | 25k+ | Enterprise multi-provider chat |
| **AnythingLLM** | 35k+ | Private local document chat |
| **Graphify** | — | Graph-based data visualization |

---

## 🔑 API Keys (Optional)

To use OmniRoute or the Python toolkit with cloud AI providers, add keys to your `.env`:

```bash
# OmniRoute will auto-detect these
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# Or use OmniRoute's free-tier aggregation (no keys needed for 150+ providers)
```
