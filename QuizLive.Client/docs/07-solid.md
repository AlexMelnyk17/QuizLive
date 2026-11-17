# SOLID and Single Responsibility

## Purpose

SOLID here is not academic OO — it is how we **split files and exports** so each unit has one reason to change. This doc makes that explicit, especially **one primary export per file** where the file name already names that export.

Rules apply to **new and changed** code. Older files that bundle several exports (e.g. `utils.ts`, `useQuizMutations.ts`) **SHOULD** be split when you touch them for a non-trivial change.

## S — Single Responsibility Principle

**One file = one primary responsibility.** The file name should tell you what lives inside.

### File export matrix (MUST for new code)

| File pattern                                  | Allowed exports                                                                                                                | Must not export                                                                                                                                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PascalCase.tsx` (component)                  | The component matching the filename (`QuizList`), and **optional** `QuizListProps`                                             | Hooks, fetchers, Zustand store, unrelated helpers, constants used outside this UI, second components, **non-props exported types** (those belong in `types.ts` — [02-typescript.md](./02-typescript.md) R-5) |
| `useXxx.ts` (hook)                            | **One** `useXxx` hook whose name matches the filename                                                                          | Components, multiple unrelated hooks, API functions                                                                                                                                                          |
| `camelCase.ts` in `utils/` (shared or module) | **One** primary function whose name matches the filename (e.g. `formatDate.ts` → `formatDate`)                                 | Second public functions — use another file or a non-exported local helper                                                                                                                                    |
| `*Api.ts`                                     | One async function per endpoint (see [01-api.md](./01-api.md))                                                                 | React, hooks, UI                                                                                                                                                                                             |
| `schemas.ts`                                  | Zod schemas and schema-only helpers                                                                                            | Components, hooks                                                                                                                                                                                            |
| `types.ts`                                    | Schema-inferred DTOs, chart/hook/view-model aliases, any named type used outside one file                                      | Runtime values, React components                                                                                                                                                                             |
| `constants.ts`                                | Constants, copy objects, query-key factories (no inline copy — see [08-constants-and-routes.md](./08-constants-and-routes.md)) | Components, side effects                                                                                                                                                                                     |
| `store/*Store.ts`                             | Store hook + store-specific selectors/actions tied to that store                                                               | Unrelated domain logic, components                                                                                                                                                                           |

### Component files (MUST)

`QuizList.tsx` **MUST** export only:

1. `QuizList` (function component), and
2. `QuizListProps` (or equivalent) if needed by parents/tests.

```tsx
// Good — QuizList.tsx
export type QuizListProps = { onOpenQuiz: (id: number) => void }

export function QuizList({ onOpenQuiz }: QuizListProps) {
	return /* ... */
}

// Bad — same file
export function formatQuizTitle(title: string) {
	/* ... */
}
export const QUIZ_PAGE_SIZE = 10
```

Move formatting to `utils.ts` or `formatQuizTitle.ts`, constants to `constants.ts`, child-only UI to `QuizListItem.tsx`.

**Styles:** `QuizList.css.ts` stays beside the component; it does not change the export rule for `QuizList.tsx`.

**Subcomponents:** If `QuizListItem` is only used inside the list, it **MAY** live in `QuizListItem.tsx` as its own PascalCase file (each with the same export rule), not as a second export from `QuizList.tsx`.

### Hook files (MUST)

`useQuiz.ts` exports **only** `useQuiz`. Related but separate hooks use separate files:

- `useCreateQuiz.ts`, `useDeleteQuiz.ts`, not five hooks in `useQuizMutations.ts` for new work.

**SHOULD** extract shared invalidation into `useInvalidateQuizzes.ts` when more than one mutation needs it — still one named hook per file.

Exception (narrow): a file **MAY** export a private non-hook helper only if it is **not** exported (`function helper()` without `export`). No extra **exported** symbols.

### Util files (MUST)

**Shared** (`src/utils/`): **one exported function per file**; filename = function name in camelCase.

```
src/utils/formatDate.ts      → export function formatDate
src/utils/sanitizeRedirectPath.ts → export function sanitizeRedirectPath
```

**Module** `utils.ts`: **SHOULD NOT** be used for new helpers — prefer `src/modules/<name>/utils/formatQuizDate.ts` etc. Legacy `utils.ts` with multiple exports **MAY** remain until refactored; **MUST NOT** add unrelated new exports to a bloated `utils.ts` — add a new single-purpose file instead.

### API, schemas, types (MUST)

Already covered in [01-api.md](./01-api.md) and [02-typescript.md](./02-typescript.md): API = one endpoint function; schemas vs types vs constants stay in their named files without UI. Chart row shapes and similar view-models live in the module’s `types.ts`, not in chart components.

## O — Open / Closed Principle

- **SHOULD** extend behavior via new components, variants (`recipes`), or new hooks — not by editing shared primitives for one feature.
- **SHOULD** add module-specific wrappers (e.g. `QuizList`) instead of forking `Button` for one screen.
- **SHOULD** add Zod fields / new endpoints as new schema functions or API functions, not by overloading one function with optional “modes”.

## L — Liskov Substitution Principle

Mostly applies to **shared UI** and **generic props**:

- Components that accept `children` or variant props **MUST** honor the same contract as siblings (e.g. all buttons remain focusable/disabled consistently).
- **SHOULD** type props so narrower variants are assignable where the parent expects the base shape (`ButtonProps` extended, not replaced).

## I — Interface Segregation Principle

- **MUST NOT** force consumers to import a “god” module; use concrete paths (see [04-decomposition.md](./04-decomposition.md)).
- Hooks **MUST** return only what callers need — avoid returning huge objects “for future use”.
- Zustand: **MUST** use narrow selectors (`s => s.field`), not pass the whole store into children.

## D — Dependency Inversion Principle

High-level UI **depends on** abstractions at module boundaries, not on transport details:

- Components depend on **hooks** and **props**, not on `apiRequest` or `fetch`.
- Hooks depend on **`*Api.ts` functions**, not on raw `fetch`.
- `*Api.ts` depends on **`apiRequest`** and **Zod schemas**.

```text
Component → hook → *Api.ts → apiRequest
```

**MUST NOT** import `@api/client` from `components/`.

## Checklist before PR

- [ ] Component file exports only component + props type.
- [ ] New hook file exports one `use*` matching the filename.
- [ ] New util is a single named file under `utils/` (shared or module).
- [ ] No new business logic in `components/` that belongs in `hooks/`, `utils/`, or `store/`.
- [ ] No new cross-layer shortcuts (component → API).

## See also

- [03-code-style.md](./03-code-style.md) — naming, React hygiene
- [04-decomposition.md](./04-decomposition.md) — where logic lives (R-7)
- [01-api.md](./01-api.md) — one function per endpoint

## References

- [React — Keeping components pure](https://react.dev/learn/keeping-components-pure)
- [Feature-Sliced Design — slices and segments](https://feature-sliced.design/docs/reference/slices-segments)
