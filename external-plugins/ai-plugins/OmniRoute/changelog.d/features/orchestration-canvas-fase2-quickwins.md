- **feat(dashboard):** Orchestration canvas quick wins — search box plus state/source/provider
  filter chips with a one-click clear, and per-source collapse/expand, all reflected in the URL
  so a filtered/collapsed view is shareable and survives a refresh; the detail drawer gained a
  "copy trace JSON" action and hardened error/empty-state and accessibility handling; the
  Agents-tab edges now animate traveling particles along active (running) connections; and the
  canvas node/edge status colors moved off fixed hex values onto theme-aware `--orch-status-*`
  CSS custom properties, so they adapt correctly to light/dark mode.
- **chore(dashboard):** Orchestration UI hardening pass and the missing component/model test
  coverage it called for — `OrchestratorNode`/`ActivityNode`/`OverflowNode` rendering, the
  `?node=`/overflow-click page routing, the Agents-tab orchestrator-click no-op and
  `showCompleted` toggle, and the overview kanban's done-column sort order (#12270, #12271).
