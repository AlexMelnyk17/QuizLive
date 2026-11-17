# Testing Rules

## Purpose

Tests prove **observable behavior**: what users see and do. Stack: Vitest 4, jsdom, Testing Library, `@testing-library/jest-dom` (see `vite.config.ts` and `src/test/setup.ts`).

## R-1. Test behavior, not implementation (MUST)

**MUST** assert:

- Rendered text, roles, enabled/disabled controls
- Outcomes of clicks and typing (via `userEvent`)
- Loading, error, empty, and success states

**MUST NOT** assert:

- Internal React state, hook call counts, or private functions
- CSS class names as the primary selector
- Snapshot-only coverage for UI

## R-2. Query priority (MUST)

Prefer queries in this order (Testing Library):

1. `getByRole` (with accessible name)
2. `getByLabelText` (form fields)
3. `getByPlaceholderText` (only if no label)
4. `getByText` (static copy)
5. `getByTestId` — **last resort**

| Variant    | When                                    |
| ---------- | --------------------------------------- |
| `getBy*`   | Present now                             |
| `queryBy*` | Assert absence                          |
| `findBy*`  | Appears after async (`await findBy...`) |

**AVOID** fixed `setTimeout` / sleeps. Use `findBy*` or `waitFor`.

## R-3. userEvent over fireEvent (MUST)

```ts
const user = userEvent.setup()
await user.click(screen.getByRole('button', { name: /save/i }))
await user.type(screen.getByLabelText(/title/i), 'My quiz')
```

Use `fireEvent` only for events users do not produce.

## R-4. File placement and naming (MUST)

- Colocate: `tests/` folder next to the code under test.
  - `modules/quizzes/components/tests/QuizList.test.tsx`
  - `modules/quizzes/api/tests/quizzesApi.test.ts`
  - `utils/tests/formatDate.test.ts`
- File name: `<unit>.test.ts` or `.test.tsx`.
- Describe block: unit under test; `it` strings read like behavior.

## R-5. Shared helpers (SHOULD)

- `renderWithTheme` — components that need theme (`src/test/testUtils.tsx`)
- `renderApp` — full router + providers (`src/test/renderApp.tsx`)
- `setup.ts` — jest-dom, `ResizeObserver` / `matchMedia` mocks

Wrap router-dependent UI with `MemoryRouter` or `renderApp` as appropriate.

## R-6. What to test (SHOULD)

| Layer         | Approach                                               |
| ------------- | ------------------------------------------------------ |
| Zod `schemas` | Valid/invalid payloads                                 |
| `utils.ts`    | Pure functions, edge cases                             |
| `*Api.ts`     | Mock `fetch` / `apiRequest`; assert URL, parse, errors |
| Zustand store | Call store API directly (`sessionStore.test.ts`)       |
| Components    | User flows with mocked hooks/API modules               |

**AVOID** testing trivial re-exports and duplicate schema/type-only files.

## R-7. Mocking modules (MUST)

Mock **the path the code imports**:

```ts
// Good
vi.mock('@modules/auth/store/sessionStore', () => ({
	useSession: () => null,
}))

// Bad — no module entry at @modules/auth
vi.mock('@modules/auth', () => ({ ... }))
```

Prefer mocking `api` functions or hooks over deep component trees when that matches the contract under test.

## R-8. Running tests (MUST)

| Command              | Use                                |
| -------------------- | ---------------------------------- |
| `npm run test`       | CI-style single run                |
| `npm run test:watch` | Local iteration                    |
| `npm run verify`     | Lint + typecheck + test (pre-push) |

## See also

- [01-api.md](./01-api.md) — API tests
- [03-code-style.md](./03-code-style.md) — test naming

## References

- [Vitest — Component testing](https://vitest.dev/guide/browser/component-testing)
- [Testing Library — queries](https://testing-library.com/docs/queries/about)
- [Testing Library — user-event](https://testing-library.com/docs/user-event/intro)
