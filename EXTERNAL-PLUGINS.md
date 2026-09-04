# 🔌 External Plugins & Toolkits — SatQuery AI

This directory contains the supplementary multi-agent frameworks, design libraries, and LLM development toolkits configured for the SatQuery AI platform.

---

## 📁 Architecture & Organization

```text
SatQuery-AI/
├── external-plugins/
│   ├── AI_PLUGINS.md                # Detailed guide for 17 AI plugins
│   ├── ai-tools.config.js           # Central plugin registry
│   ├── package.json                 # Command scripts and dependencies
│   ├── ai-toolkit/                  # Python AI environment definitions
│   │   ├── requirements.txt         # CrewAI, LangGraph, DSPy, Graphiti
│   │   └── setup.ps1                # Automated setup script
│   ├── design-plugins/              # Advanced 3D & UI libraries
│   │   ├── liquid-glass-js/         # Glassmorphism & optical simulation shaders
│   │   ├── liquid-logo/             # Interactive webgl branding
│   │   ├── magic-mcp/               # Model Context Protocol plugins
│   │   ├── react-three-fiber/       # 3D geospatial rendering pipeline
│   │   ├── shadergradient/          # GPU visual shaders
│   │   └── ui-ux-pro-max-skill/     # Production UI engineering design system
│   └── ai-plugins/                  # Multi-agent & evaluation frameworks
│       ├── agent-skills/            # 25 structured development lifecycle workflows
│       ├── ponytail/                # Minimalist senior developer rules
│       ├── OmniRoute/               # Unified AI model gateway (1200+ models)
│       ├── Flowise/                 # Drag-and-drop visual pipeline builder
│       ├── semgrep/                 # Automated AST security scanner
│       ├── langfuse/                # LLM observability and tracing
│       ├── crewAI/                  # Autonomous multi-agent coordination
│       ├── langgraph/               # Cyclic multi-agent graph workflows
│       ├── dspy/                    # Algorithmic prompt compiler
│       ├── ragflow/                 # Deep document OCR & RAG engine
│       ├── graphiti/                # Dynamic temporal knowledge graph
│       ├── giskard/                 # LLM adversarial security testing
│       ├── open-webui/              # Self-hosted conversational UI
│       ├── lobe-chat/               # Plugin-based multi-modal chat UI
│       ├── LibreChat/               # Enterprise LLM workspace
│       ├── anything-llm/            # Embedded local vector RAG
│       └── graphify/                # Knowledge graph visualizer
```

---

## ⚡ Integration with SatQuery AI Core

1. **Deterministic Scientific Gate (G0–G8)**:
   - SatQuery AI's core deterministic image processing and spatial pipelines remain the ground truth calculator.
   - External plugins (`crewAI`, `langgraph`) provide higher-order agent orchestration without compromising pixel calculations.

2. **UI & 3D Geospatial Enhancement**:
   - `react-three-fiber` and `shadergradient` supply the shaders and 3D rendering primitives used in the God's Eye 3D Earth Explorer.
   - `liquid-glass-js` powers the HUD glassmorphic overlays.

3. **Security & Quality**:
   - `semgrep` performs continuous automated scanning against code vulnerabilities.
   - `giskard` validates model outputs against hallucinations and prompt injections.
   - All credentials and API keys are strictly externalized via `.env` files (ignored from Git tracking).
