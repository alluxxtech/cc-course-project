# Frontend Code Rules — Next.js / React / TypeScript

## TypeScript

- `strict: true` is required. Also enable `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.
- Never use `any`. Use `unknown` for unknown values and narrow with `instanceof` or type guards.
- In `catch` blocks, treat the error as `unknown`: `if (error instanceof Error) { ... }`.
- Don't annotate what TypeScript can infer. Annotate explicitly: function parameters, return types of public functions, component props.
- Don't use `React.FC` / `React.FunctionComponent`. Define props as a separate `type` above the component and type the function directly.
- Use discriminated unions for complex state: `type State = { status: 'loading' } | { status: 'success'; data: T[] } | { status: 'error'; message: string }`.
- Use utility types (`Partial`, `Pick`, `Omit`, `Required`) to avoid type duplication and casting.

## React Components

- Functional components only. Class components only for error boundaries.
- Declare props as a named `type` above the component, not inline in the signature.
- `children` must be typed explicitly as `React.ReactNode`.
- No `defaultProps` — use ES6 default destructuring: `function Btn({ size = 'md' }: Props)`.
- One component, one responsibility. If a component fetches data, renders a form, and manages a modal — split it.
- Prefer composition via `children` and props over prop drilling or inheritance.

## Next.js App Router

**Server Component (default) when:**
- Fetching data (DB, API, ORM)
- Using env vars without `NEXT_PUBLIC_` prefix
- Importing heavy libraries not needed in the browser

**Client Component (`'use client'`) when:**
- Using `useState`, `useReducer`, `useEffect`, `useContext`
- Handling events (`onClick`, `onChange`, `onSubmit`)
- Accessing browser APIs (`localStorage`, `window`)

**Rules:**
- Put `'use client'` as deep in the tree as possible — on the interactive leaf, not on layouts.
- Install and import `server-only` in modules that must never reach the client bundle.
- Wrap third-party libs that lack `'use client'` in your own Client Component re-export.
- A Server Component passed as `children` to a Client Component does NOT become a client component — use this pattern for modals with server data.
- Props passed from Server to Client Components must be serializable (no functions, no class instances).

**Special files:**
- `loading.tsx` — Suspense fallback for the entire segment
- `error.tsx` — error boundary for the segment, must be `'use client'`
- `not-found.tsx` — 404 UI, triggered by `notFound()`
- `global-error.tsx` — catches errors in root layout, must contain `<html><body>`

## React Hooks

- All dependencies in `useEffect` / `useMemo` / `useCallback` must be in the dependency array. Use `eslint-plugin-react-hooks` with `exhaustive-deps`.
- If a dependency is an object or function created during render — it's new every render. Fix by: moving it outside the component, using `useRef`, or memoizing it.
- Do not use `useEffect` to sync derived state. If a value is derived from existing state/props — compute it directly during render.
- Never call hooks conditionally or inside loops.
- Always return a cleanup function from `useEffect` when cleaning up resources.

## State Management

| State type | Tool |
|-----------|------|
| Local UI (open/closed, input value) | `useState` / `useReducer` |
| Server data (fetch, cache, sync) | TanStack Query |
| URL params (`?tab=1&search=foo`) | `useSearchParams` + `nuqs` |
| Global client state (filters, selections) | Zustand |
| Theme, auth, locale — 1-2 global values | Context API |

- Don't put unrelated data in a single Context — every consumer re-renders on any change.
- TanStack Query replaces `useEffect + useState + loading/error flags` for any async server state.
- Don't sync URL params with `useState` manually.

## Data Fetching

- In Server Components, fetch with `async/await` directly in the component body. No `useEffect`.
- For parallel independent requests, initiate all before the first `await`, then `Promise.all`.
- For sequential dependent requests, wrap the dependent component in `<Suspense>` and pass the first result as props.
- Prefer `<Suspense>` over `loading.tsx` when you need granular loading states within a page.
- Use `React.cache` to memoize data-fetching functions called by multiple Server Components in the same request.

## Performance — Memoization

Only use `useMemo` if:
1. The computation takes ≥1ms (measure with `console.time`).
2. The value is passed as a prop to a `React.memo`-wrapped component.
3. The value is a dependency of `useEffect` and is an object or array.

Only use `useCallback` if:
1. The function is passed as a prop to a `React.memo`-wrapped component.
2. The function is a dependency of `useEffect`.

Only use `React.memo` if profiling shows the component re-renders are costly.

**Never** use `useMemo` / `useCallback` "just in case" — memoization has its own cost.

**Before memoizing, try:**
- Move the object/function outside the component if it doesn't depend on props/state.
- Pass `children` instead of a component to prevent re-renders.
- Move state down to minimize the affected subtree.

## Error Handling

- **Expected errors** (validation, 404, failed request) — **return** as values, do not throw:
  ```ts
  if (!post) notFound()
  if (!res.ok) return { error: 'Failed to load' }
  ```
- **Unexpected errors** (bugs, unhandled states) — throw and let the error boundary catch them.
- `error.tsx` must be `'use client'`. It does NOT catch errors in `layout.tsx` of the same level.
- Log unexpected errors to an error tracking service inside `useEffect` in the `error.tsx` component.
- In `catch` blocks always check `error instanceof Error` before accessing `.message`.

## File and Folder Structure

```
src/
  app/                    # App Router — routing files only
    (group)/              # Route group — does not affect URL
      _components/        # Private components for this route only
      _lib/               # Private utils for this route only
  components/
    ui/                   # Base UI components (Button, Input, Modal)
    features/             # Feature components (UserProfile, BudgetWidget)
  lib/                    # Shared utilities, helpers, configs
  hooks/                  # Shared custom hooks
  types/                  # Global TypeScript types
```

- Components used only by one route stay next to that route in `_components/`, not in the global folder.
- Do not mix routing files (`page`, `layout`, `error`) with feature components without the `_` prefix.

## Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Component (function) | PascalCase | `UserProfile`, `CartButton` |
| Component file | kebab-case | `user-profile.tsx` |
| Custom hook (function) | camelCase with `use` | `useUserData` |
| Hook file | kebab-case | `use-user-data.ts` |
| Type / Interface | PascalCase | `UserProps`, `ApiResponse<T>` |
| Utility function | camelCase | `formatDate`, `parseAmount` |
| Utility file | kebab-case | `format-date.ts` |
| Constant | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Route group | `(camelCase)` | `(dashboard)` |
| Private folder | `_kebab-case` | `_components` |

- Boolean props: prefix with `is` / `has` / `should` — `isLoading`, `hasError`.
- Event handler props: `onEventName` — `onSubmit`, `onUserSelect`.
- Event handler functions: `handleEventName` — `handleSubmit`, `handleUserSelect`.
- Always export the props type of a component alongside the component.
