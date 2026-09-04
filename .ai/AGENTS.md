# 🤖 SatQuery AI — AGENTS.md

> The first file every AI coding agent reads. It points the agent at the rules and the
> ritual. Compatible with agent tooling that auto-loads AGENTS.md.

## You must, before writing any code:
1. Read `docs/03-RULES.md` and comply with every rule.
2. Read `docs/08-MEMORY.md` to load current context.
3. Read the relevant sections of `docs/07-CODEBASE.md`.
4. Read the specific ticket in `docs/06-FEATURE-TICKETS.md` you were assigned.

## You must, after writing code (the ritual — RULE 016):
1. Run tests. 2. Update CODEBASE.md (+ CODEBASE-MAP.md if structure changed).
3. Update MEMORY.md. 4. Update CHANGELOG.md. 5. Update DECISIONS/TROUBLESHOOTING if applicable.
6. Commit referencing the ticket id.

## Hard limits
- Never exceed ticket scope (RULE 007).
- Never add a dependency without justification + license (RULE 002).
- Never fabricate accuracy or citations (RULES 005, 013).
- Never expose secrets (RULE 004).
- Prefer the simplest solution (RULE 014).

## Skills, prompts, workflows
- `.ai/skills/`    — installed via `npx skills add addyosmani/agent-skills` (25 skills).
- `.ai/prompts/`   — reusable prompt templates (spec, plan, build, review).
- `.ai/workflows/` — multi-step routines (e.g., "new feature = spec→plan→build→test→review→ship").
