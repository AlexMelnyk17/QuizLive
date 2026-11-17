# Code Style Rules

## Purpose

Formatting and linting are automated. Consistency comes from Prettier and ESLint, not from review debates.

## R-1. Prettier owns formatting (MUST)

From [`.prettierrc.json`](../.prettierrc.json):

| Setting        | Value                           |
| -------------- | ------------------------------- |
| Indent         | Tabs, `tabWidth: 2`             |
| Semicolons     | No                              |
| Quotes         | Single (`jsxSingleQuote: true`) |
| `arrowParens`  | `avoid`                         |
| Trailing comma | `none`                          |

Run `npm run format` or let lint-staged format on commit. **MUST NOT** hand-format to match taste.

## R-2. Import order (MUST)

`@trivago/prettier-plugin-sort-imports` groups imports (blank line between groups):

1. Third-party packages
2. `@layout/*`
3. `@theme/*` (no bare `@theme` — see barrels rule)
4. `@components/ui/*` (prefer `@components/ui/Button`, not the mega-barrel in new code if importing one symbol)
5. `@providers/*`
6. `@modules/*`
7. `@assets/*`
8. `@config/*`
9. `@utils/*`
10. `@api/*`
11. `@src/*`

Specifiers within a group are sorted alphabetically.

## R-3. ESLint (MUST)

- Type-aware `recommendedTypeChecked`
- `eslint-plugin-react-hooks` — [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- `eslint-plugin-react-refresh` — compatible with Vite HMR
- `@typescript-eslint/no-magic-numbers` — in `api/`, module `api/`, `hooks/`, `utils/`, `router.tsx`, and shared `utils/` only; allows `0`, `1`, `-1` (see [08-constants-and-routes.md](./08-constants-and-routes.md) R-1)
- `no-restricted-imports` — no relative `../` imports; components/layout **MUST NOT** import `@api/client`
- `@typescript-eslint/only-throw-error` is **off** only because TanStack Router `throw redirect(...)` is intentional. **MUST NOT** throw non-Error values elsewhere.

`npm run lint` must pass. Pre-commit: Prettier + ESLint on staged files; pre-push: `npm run verify`.

## R-4. Naming (MUST)

| Kind                     | Convention                   | Example                                                        |
| ------------------------ | ---------------------------- | -------------------------------------------------------------- |
| React component file     | PascalCase = export name     | `QuizList.tsx` → `QuizList`                                    |
| Hook file                | `use` prefix                 | `useQuiz.ts`                                                   |
| API module               | `*Api.ts`                    | `quizzesApi.ts`                                                |
| Styles (vanilla-extract) | `*.css.ts` next to component | `QuizList.css.ts`                                              |
| Test file                | `*.test.ts` / `*.test.tsx`   | `QuizList.test.tsx`                                            |
| Query key constants      | `SCREAMING_SNAKE` or factory | `QUIZZES_QUERY_KEY`                                            |
| Functions / variables    | camelCase                    | `formatDate`                                                   |
| Route paths              | Central `PATHS` / `pathTo`   | See [08-constants-and-routes.md](./08-constants-and-routes.md) |

## R-5. Components and exports (MUST)

- **MUST** use function components only (React 19; no new class components).
- **SHOULD** use named exports. UI primitives expose named symbols from their folder `index.ts` where allowed.
- Props: `export type ComponentProps = { ... }` above the component; destructure in the parameter list with that type — `export function Foo({ a, b }: FooProps)`. **MUST NOT** inline object types in the signature (`({ a }: { a: string })`) or take an unused `props` bag when fields can be destructured.
- **MUST** follow file export rules (component-only exports, one hook/util per file): [07-solid.md](./07-solid.md).

## R-6. React hygiene (MUST)

- Components **MUST** stay pure during render (no side effects in render body).
- Effects **MUST** clean up subscriptions, timers, and listeners when needed.
- **MUST NOT** store state that can be derived from props or existing state during render.
- List keys **MUST** be stable — **AVOID** array index keys for lists that reorder or mutate.

## R-7. Barrel exports (MUST)

Barrel files (`index.ts` that re-export other modules) are **only** allowed inside:

- `**/components/**`
- `**/hooks/**`
- `**/utils/**`
- `**/api/**`

**FORBIDDEN:** `src/modules/<name>/index.ts`, `src/theme/index.ts`, `src/config/index.ts`, `store/index.ts`, etc.

Cross-module imports **MUST** target concrete paths, e.g. `@modules/auth/store/sessionStore`, `@modules/quizzes/api/quizzesApi`.

Allowed barrels **MUST** use explicit named re-exports — **MUST NOT** use `export *` (except legacy `src/components/ui/index.ts` until trimmed; prefer direct `@components/ui/Button` imports).

Details: [04-decomposition.md](./04-decomposition.md#r-2-barrel-exports-must).

## See also

- [04-decomposition.md](./04-decomposition.md) — module boundaries
- [07-solid.md](./07-solid.md) — SOLID, SRP, exports per file
- [08-constants-and-routes.md](./08-constants-and-routes.md) — literals and paths
- [06-testing.md](./06-testing.md) — test file placement and naming

## References

- [Prettier](https://prettier.io/docs/en/options)
- [React — Keeping components pure](https://react.dev/learn/keeping-components-pure)
