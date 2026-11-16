# Constants, literals, and routes

## Purpose

Avoid duplicated literals and drifting paths. **One named source of truth** for anything repeated or meaningful: copy, paths, domain numbers, and config keys. Inline literals are restricted to a small allowlist.

Rules apply to **new and changed** code. When touching a file, **SHOULD** move existing magic strings/numbers toward the patterns below.

## R-1. Allowed inline literals (MUST)

These **MAY** appear directly in code without a named constant:

| Kind | Allowed values | Typical use |
| --- | --- | --- |
| Numbers | `0`, `1`, `-1` only | Array index `0`, increment/decrement by `1`, “previous” index `-1`, empty length checks |
| Strings | `''`, `' '` only | Default empty value, intentional single-space separator or trim edge case |

**Everything else** — user-visible text, route paths, HTTP status codes, timeouts, limits, enum discriminators, storage keys, query-key segments beyond the shared factory, and business thresholds — **MUST NOT** be inline literals. Use a named constant (see R-2–R-4).

```ts
// Allowed
if (items.length === 0) { /* ... */ }
const next = index + 1
const label = parts.join(' ')

// Not allowed — use constants.ts or shared status map
if (error.status === 404) { /* ... */ }
void navigate({ to: '/dashboard' })
```

For HTTP status and API codes, use named constants (e.g. `HTTP_STATUS.NOT_FOUND` in shared `api/` or module `constants.ts`) even though they are not `0` / `1` / `-1`. ESLint enforces `@typescript-eslint/no-magic-numbers` with the same allowlist in `api/`, hooks, utils, and `router.tsx` (not in `*.css.ts` or UI primitives).

## R-2. Single source of truth (MUST)

If a string, number, or object shape is used **more than once** or defines **behavior** (navigation, API contract, copy, storage), it **MUST** live in exactly one module-level definition and be imported elsewhere.

| What | Where |
| --- | --- |
| User-facing copy (labels, errors, empty states) | `modules/<name>/constants.ts` as `*_COPY` with `as const` |
| Query keys, storage keys, feature flags | `constants.ts` (or `store` for persist key only) |
| Domain enums / maps (`QuizKind`, status labels) | `constants.ts` with `as const` / `satisfies` |
| HTTP paths and redirects | Route SSOT (R-3) |
| Pure numeric limits (page size, max length matching server) | `constants.ts` next to schema or API |

**MUST NOT** copy-paste the same object literal `{ ... }` or the same string in two files. Extract once, import many.

```ts
// Good — one definition
export const QUIZ_LIST_COPY = {
	empty: { title: 'No quizzes yet', body: '...' }
} as const

// Bad — duplicate title in component and test without shared constant
```

Use `satisfies` when the constant must match a type but stay narrow (see [02-typescript.md](./02-typescript.md)).

## R-3. Routes — no inline paths (MUST)

Route path strings **MUST NOT** be written inline in components, layouts, hooks, or tests. They **MUST** come from a **single route source of truth** used by the router and all navigation.

**Preferred layout**

- Define paths in one file, e.g. `src/config/routes.ts` or `src/router/paths.ts`:

```ts
export const PATHS = {
	home: '/',
	login: '/login',
	register: '/register',
	dashboard: '/dashboard',
	statistics: '/statistics',
	quizzes: '/quizzes',
	quizDetails: '/quizzes/$quizId'
} as const

export const pathTo = {
	quizDetails: (quizId: number) =>
		`/quizzes/${quizId}` as const
}
```

- `router.tsx` uses `PATHS.*` for `createRoute({ path: ... })` and for `redirect({ to: ... })` search targets where applicable.
- `Link`, `useNavigate`, and `redirect` in modules import the same symbols — **MUST NOT** use `to: '/dashboard'` literals.
- Tests that assert navigation **SHOULD** use the same `PATHS` / `pathTo` helpers.

**MUST NOT** introduce a second path string for the same screen (e.g. `/quizzzes` vs `/quizzes`). One canonical path per route.

TanStack Router’s typed `to` with route ids is encouraged once paths are centralized; until then, shared string constants are the minimum bar.

## R-4. Components and literals (MUST)

- UI copy in JSX **MUST** come from `constants.ts` (`*_COPY`), not hard-coded sentences (except allowlisted `''` / `' '`).
- `aria-label` and button labels **MUST** use the same copy constants as visible text where possible so tests and a11y stay aligned ([06-testing.md](./06-testing.md)).
- Zod `.min(1)` / similar validation messages **SHOULD** live in the schema in `schemas.ts` (single place), not duplicated in components.

## R-5. Legacy code (SHOULD)

Existing inline routes and literals (e.g. in `router.tsx`, `HomePage.tsx`) **SHOULD** be migrated to `PATHS` and module constants when those files are edited for other work. New code **MUST** comply without waiting for a full migration.

## See also

- [07-solid.md](./07-solid.md) — `constants.ts` ownership
- [01-api.md](./01-api.md) — query keys in `constants.ts`
- [05-architecture.md](./05-architecture.md) — router and navigation

## References

- [TanStack Router — Route trees](https://tanstack.com/router/latest/docs/framework/react/routing/route-trees)