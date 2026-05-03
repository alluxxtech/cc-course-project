# Development Workflow Rules

## After completing any section from PLAN.MD

After finishing all tasks in a PLAN.MD section (e.g. "1.2 Backend Bootstrap", "Phase 4 — Categories"), always run the following checks before reporting the section as done:

### Backend checks (when backend files were changed)

```bash
cd backend
npx tsc --noEmit          # TypeScript — must pass with zero errors
npm run lint -- --fix     # ESLint — auto-fix what's fixable
npx prettier --write "src/**/*.ts"  # Prettier — format all changed files
```

### Frontend checks (when frontend files were changed)

```bash
cd frontend
npx tsc --noEmit          # TypeScript — must pass with zero errors
npm run lint -- --fix     # ESLint — auto-fix what's fixable
npx prettier --write "src/**/*.{ts,tsx}"  # Prettier — format all changed files
```

### Fix before marking done

- If `tsc --noEmit` reports errors — fix them before updating PLAN.MD checkboxes
- If `eslint --fix` leaves unfixed errors — fix them manually
- Only mark tasks ✅ in PLAN.MD after all checks pass cleanly
