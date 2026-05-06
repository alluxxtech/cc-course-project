---
name: review
description: Run the project code-reviewer agent on recent changes
model: claude-sonnet-4-6
argument-hint: "[phase name, e.g. 'Phase 7.1 — Alerts Backend']"
context:
  - .claude/rules/frontend.md
---

Spawn the `code-reviewer` subagent to review current changes.

1. **Subject** — use `$ARGUMENTS` if provided, otherwise derive from `git diff HEAD~1`.

2. **Build the agent prompt** in this order:
   - Intro: `Review $ARGUMENTS`
   - **What to check** — bullet points from the diff: authorization, ownership, input validation, error handling, edge cases
   - **Context** — NestJS + Prisma + Redis (backend), Next.js App Router + TypeScript strict (frontend); frontend rules from `.claude/rules/frontend.md` apply; any non-obvious decisions from the diff

3. **Spawn** — `Agent` with `subagent_type: code-reviewer` and the prompt above.

4. **Show** the full review output to the user. Do NOT auto-fix — wait for explicit approval.
