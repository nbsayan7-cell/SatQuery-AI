/**
 * AI Plugins Configuration — SIH Project
 * Central registry of all AI tools and their locations.
 * Used by npm scripts and referenced by the AI assistant.
 */
export default {
  // Base path to all downloaded plugins
  pluginsRoot: './ai-plugins',

  // ── Always Active (Antigravity Agent Rules) ──────────────────────
  rules: {
    ponytail: '.agents/rules/ponytail.md',
    agentQuality: '.agents/rules/agent-quality.md',
  },
  skills: '.agents/skills/', // 25 skills from addyosmani/agent-skills

  // ── On-Demand Tools ──────────────────────────────────────────────
  tools: {
    omniroute: {
      name: 'OmniRoute',
      path: './ai-plugins/OmniRoute',
      description: 'AI gateway — 1200+ models, 350+ providers, auto-fallback',
      command: 'npm start',
      port: 20128,
      endpoint: 'http://localhost:20128/v1',
    },
    flowise: {
      name: 'Flowise',
      path: './ai-plugins/Flowise',
      description: 'Visual LLM & RAG workflow builder',
      command: 'npx flowise start',
      port: 3000,
    },
    semgrep: {
      name: 'Semgrep',
      path: './ai-plugins/semgrep',
      description: 'AI-powered static analysis (17+ languages)',
      command: 'semgrep scan --config auto .',
    },
    langfuse: {
      name: 'Langfuse',
      path: './ai-plugins/langfuse',
      description: 'LLM observability & prompt versioning',
      command: 'docker compose up -d',
      port: 3000,
    },
  },

  // ── Python AI Toolkit ────────────────────────────────────────────
  pythonTools: {
    crewai: {
      name: 'CrewAI',
      path: './ai-plugins/crewAI',
      description: 'Multi-agent collaboration framework',
      pip: 'crewai',
    },
    langgraph: {
      name: 'LangGraph',
      path: './ai-plugins/langgraph',
      description: 'Agent workflow orchestration',
      pip: 'langgraph',
    },
    dspy: {
      name: 'DSPy',
      path: './ai-plugins/dspy',
      description: 'Systematic prompt optimization',
      pip: 'dspy',
    },
    ragflow: {
      name: 'RAGFlow',
      path: './ai-plugins/ragflow',
      description: 'Document analysis & intelligent retrieval',
      pip: 'ragflow-sdk',
    },
    graphiti: {
      name: 'Graphiti',
      path: './ai-plugins/graphiti',
      description: 'Temporal context graphs',
      pip: 'graphiti-core',
    },
    giskard: {
      name: 'Giskard',
      path: './ai-plugins/giskard',
      description: 'LLM security testing',
      pip: 'giskard',
    },
  },

  // ── Reference Repos (pull components when needed) ────────────────
  references: {
    openWebUI: {
      name: 'Open WebUI',
      path: './ai-plugins/open-webui',
      description: 'Self-hosted ChatGPT-like UI with RAG',
      useFor: 'Adding chat interface to the project',
    },
    lobeChat: {
      name: 'LobeChat',
      path: './ai-plugins/lobe-chat',
      description: 'Modern chat UI with plugin system',
      useFor: 'Plugin-based chat with TTS/STT',
    },
    libreChat: {
      name: 'LibreChat',
      path: '../sih/ai-plugins/LibreChat',
      description: 'Unified chat platform',
      useFor: 'Enterprise chat features',
    },
    anythingLLM: {
      name: 'AnythingLLM',
      path: '../sih/ai-plugins/anything-llm',
      description: 'Private local document chat & RAG',
      useFor: 'Local document analysis',
    },
    graphify: {
      name: 'Graphify',
      path: '../sih/ai-plugins/graphify',
      description: 'Graph-based data visualization',
      useFor: 'Interactive data relationship graphs',
    },
  },
};
