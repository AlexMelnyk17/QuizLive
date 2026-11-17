# QuizLive.Client

React + TypeScript SPA built with [Vite](https://vite.dev/).

## Requirements

- Node.js **20.19+** or **22.12+** (required by Vite 8)

## Scripts

| Command                           | Description                                                              |
| --------------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                     | Vite dev server                                                          |
| `npm run build`                   | Typecheck (`tsc -b`) and production build into `QuizLive.Server/wwwroot` |
| `npm run preview`                 | Preview production build locally                                         |
| `npm run lint` / `lint:fix`       | ESLint (type-aware)                                                      |
| `npm run format` / `format:check` | Prettier + import sorting                                                |
| `npm run test` / `test:watch`     | Vitest + Testing Library                                                 |
| `npm run verify`                  | Lint + typecheck + test (same as pre-push)                               |

## Developer rules

Coding standards for this project live under [`docs/`](docs/):

| File                                                          | Topic                                         |
| ------------------------------------------------------------- | --------------------------------------------- |
| [01-api.md](docs/01-api.md)                                   | HTTP client, DTO validation, React Query      |
| [02-typescript.md](docs/02-typescript.md)                     | Strict TypeScript, types from Zod             |
| [03-code-style.md](docs/03-code-style.md)                     | Prettier, ESLint, naming, barrels             |
| [04-decomposition.md](docs/04-decomposition.md)               | Modules, boundaries, state placement          |
| [05-architecture.md](docs/05-architecture.md)                 | Runtime, data flow, Zustand, theming          |
| [06-testing.md](docs/06-testing.md)                           | Vitest, Testing Library, mocks                |
| [07-solid.md](docs/07-solid.md)                               | SOLID, SRP, one export per file               |
| [08-constants-and-routes.md](docs/08-constants-and-routes.md) | No magic literals, route SSOT, `constants.ts` |

If docs disagree with [`.prettierrc.json`](.prettierrc.json), [`eslint.config.js`](eslint.config.js), or [`tsconfig.app.json`](tsconfig.app.json), **config wins**.

## Architecture

Application code lives under `src/`. Use path aliases (no `./` or `../` imports).

### Feature modules

Each folder under `src/modules/` is a **vertical slice** for one domain area (e.g. `home`, `quizzes`, `statistics`). Keep feature code inside the module; use top-level `src/` folders only for **shared** concerns.

```
src/modules/<name>/
  api/           # HTTP calls and DTO mapping for this module only
  components/    # UI owned by this module
  hooks/         # React hooks for this module
  store/         # Client state for this module
  constants.ts
  types.ts
  schemas.ts
```

**Module rules**

- Import other modules via **concrete paths**, e.g. `@modules/auth/store/sessionStore`, `@modules/quizzes/api/quizzesApi`.
- Do not add `src/modules/<name>/index.ts`. Barrel `index.ts` files are allowed only under `components/`, `hooks/`, `utils/`, and `api/` (see [docs/04-decomposition.md](docs/04-decomposition.md)).
- `modules/<name>/store/` — Zustand (or other) state scoped to that feature; one store per domain, no global reducer folder.
- Add a module by copying `home/` or `quizzes/`; wire routes in `router.tsx` — no module root barrel.

### Shared `src/` layout

| Path                                                                | Purpose                                                  |
| ------------------------------------------------------------------- | -------------------------------------------------------- |
| `src/theme/`                                                        | Design tokens, light/dark themes, sprinkles (`@theme/*`) |
| `src/components/ui/`                                                | Reusable UI primitives (`@components/ui`)                |
| `src/api/`, `layout/`, `providers/`, `utils/`, `config/`, `assets/` | Cross-cutting concerns                                   |

### Path aliases

| Alias                                 | Purpose                                                 |
| ------------------------------------- | ------------------------------------------------------- |
| `@modules/*`                          | Feature modules (concrete file paths)                   |
| `@theme/*`                            | Theme contract, sprinkles, `ThemeProvider`              |
| `@components/ui` / `@components/ui/*` | Design-system components                                |
| `@api/*`                              | Shared HTTP client / base API utilities                 |
| `@layout/*`                           | App shells and route layouts                            |
| `@providers/*`                        | Global React providers                                  |
| `@config/*`                           | App configuration (`ENV` from `@config/env`)            |
| `@utils/*`                            | Pure utilities (redirect safety, date formatting, etc.) |
| `@assets/*`                           | Static assets                                           |
| `@src/*`                              | App entry and other top-level `src` files               |

Paths are defined in [`tsconfig.app.json`](tsconfig.app.json); Vite resolves them via `tsconfigPaths` in [`vite.config.ts`](vite.config.ts).

## Environment variables

Create **`.env`** in **`QuizLive.Client/`** (next to `vite.config.ts`). Vite does not read env from the repository root.

| Variable            | Required | Example            | Purpose                           |
| ------------------- | -------- | ------------------ | --------------------------------- |
| `VITE_API_BASE_URL` | Yes      | `/api` or full URL | Base URL for API calls in the app |

Do not read `import.meta.env` elsewhere — use `src/config/env.ts` only: `import { ENV } from '@config/env'` → `ENV.VITE_API_BASE_URL`.

## Git hooks

From the **repository root**, run `npm install` once so Husky is installed.

| Hook         | Command                                                                        |
| ------------ | ------------------------------------------------------------------------------ |
| `pre-commit` | `lint-staged --cwd QuizLive.Client` (Prettier + ESLint on staged client files) |
| `pre-push`   | `npm run verify` in `QuizLive.Client` (ESLint, `tsc -b`, Vitest)               |
