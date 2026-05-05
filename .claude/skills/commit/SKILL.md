---
name: commit
description: Quality checks then git commit with a conventional message
model: claude-haiku-4-5-20251001
allowed-tools: Bash(git *) Bash(cd backend && *) Bash(cd frontend && *)
argument-hint: "[optional commit message]"
---

Commit current changes. Steps:

1. **Context** — run `git status`, `git diff`, `git diff --staged`, `git log --oneline -5` in parallel.

2. **Checks** — based on what changed:
   - `backend/`: `cd backend && ./node_modules/.bin/tsc --noEmit && npm run lint -- --fix && ./node_modules/.bin/prettier --write "src/**/*.ts"`
   - `frontend/`: `cd frontend && ./node_modules/.bin/tsc --noEmit && npm run lint -- --fix && ./node_modules/.bin/prettier --write "src/**/*.{ts,tsx}"`
   - If `tsc` fails — stop and report errors, do NOT commit.
   - If lint/prettier modified files — re-stage them.

3. **Stage** — if nothing staged, run `git add -u`. Never use `git add -A`.

4. **Message** — use `$ARGUMENTS` if provided, otherwise derive from diff:
   `<type>: <imperative summary>` (max 72 chars), types: `feat` `fix` `refactor` `test` `docs` `chore` `style`.
   Never mention Claude, Anthropic, or any AI tool in the commit message. No `Co-Authored-By` trailers.

5. **Commit** — `git commit -m "<message>"`, then show `git log --oneline -3`.
