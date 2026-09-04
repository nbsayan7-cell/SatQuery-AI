# ⚖️ SatQuery AI — Agent & Team Constitution (RULES)

> **Purpose:** These are non-negotiable constraints that every AI coding agent and every
> human contributor must obey. When you start an AI agent, its very first instruction is
> "Read and comply with docs/03-RULES.md." Violations are grounds for rejecting a change.

**Version:** 1.0 · **Last updated:** <FILL:date>

---

## Hard Rules

**RULE 001 — No unapproved architecture changes.**
Do not alter the architecture in `02-ARCHITECTURE.md` without an entry in
`09-DECISIONS.md` and explicit human sign-off in the ticket.

**RULE 002 — Justify every new dependency.**
Never add a package without stating (a) why it's needed, (b) what it replaces, (c) its
license, in the PR description and `18-LICENSES-AND-CREDITS.md`.

**RULE 003 — Never delete working code to fix a minor problem.**
Prefer the smallest surgical change. If deletion seems necessary, explain why in the PR
and confirm tests still pass.

**RULE 004 — Never expose secrets.**
No API keys, tokens, or credentials in code, commits, logs, or docs. Use environment
variables only (see `07-CODEBASE.md` §12).

**RULE 005 — Never fabricate model accuracy.**
Report only measured numbers with the eval script and dataset that produced them. "TBD"
is acceptable; a made-up number is not.

**RULE 006 — Never claim a feature works unless it is tested.**
A feature is "done" only with a passing test recorded in `12-TESTING.md`.

**RULE 007 — Stay within requested scope.**
Change only what the ticket asks. Out-of-scope improvements go in a new ticket.

**RULE 008 — Read before you write.**
Before coding, read the relevant sections of `07-CODEBASE.md`, the ticket, and
`08-MEMORY.md`. Do not start from zero.

**RULE 009 — Update CODEBASE.md after structural changes.**
New files, moved files, new components, or new APIs → update `07-CODEBASE.md` and
`CODEBASE-MAP.md` in the same commit.

**RULE 010 — Update CHANGELOG.md after every completed feature.**

**RULE 011 — Update TROUBLESHOOTING.md when a significant bug is fixed.**

**RULE 012 — Keep every SIH requirement traceable.**
Never make a change that breaks a row in the PRD Compliance Matrix without updating it.

**RULE 013 — No fabricated citations or datasets.**
Every paper/repo/model referenced must have a real, verifiable URL in `15-RESEARCH.md`.

**RULE 014 — Prefer simplicity (anti-over-engineering).**
If a task can be done in one file, do not create ten. Question every abstraction.

**RULE 015 — One ticket, one focused change.**
Do not bundle unrelated work into a single PR.

---

## The Mandatory Post-Change Ritual (every agent, every time)