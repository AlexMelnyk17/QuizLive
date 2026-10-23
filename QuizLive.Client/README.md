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

## Architecture

Application code lives under `src/`. Use path aliases (no `./` or `../` imports).

### Feature modules

Each folder under `src/modules/` is a **vertical slice** for one domain area (e.g. `home`, `lobby`, `game`). Keep feature code inside the module; use top-level `src/` folders only for **shared** concerns.

```
src/modules/<name>/
  api/           # HTTP calls and DTO mapping for this module only
  components/    # UI owned by this module
  hooks/         # React hooks for this module
  store/         # Client state for this module
  constants.ts
  types.ts
  index.ts       # Public API — other code imports from here only
```

**Module rules**

- Import other modules only via `@modules/<name>` (their `index.ts`), not deep paths into another module.
- Do not import from another module’s `api/`, `store/`, or `components/` directly.
- `modules/<name>/store/` — Zustand (or other) state scoped to that feature; one store per domain, no global reducer folder.
- Add a module by copying `home/` and exporting the entry from `index.ts`.

### Shared `src/` layout

| Path | Purpose |
| ---- | ------- |
| `src/theme/` | Design tokens, light/dark themes, sprinkles (`@theme`) |
| `src/components/ui/` | Reusable UI primitives (`@components/ui`) |
| `src/api/`, `layout/`, `providers/`, `shared/`, `utils/`, `config/`, `assets/` | Cross-cutting concerns |

### Path aliases

| Alias | Purpose |
| ----- | ------- |
| `@modules/*` | Feature modules (public `index.ts` only) |
| `@theme` / `@theme/*` | Theme contract, sprinkles, `ThemeProvider` |
| `@components/ui` / `@components/ui/*` | Design-system components |
| `@api/*` | Shared HTTP client / base API utilities |
| `@layout/*` | App shells and route layouts |
| `@providers/*` | Global React providers |
| `@shared/*` | Cross-module constants/helpers (non-React) |
| `@config` / `@config/*` | App configuration (`ENV` from `config/env.ts`) |
| `@utils/*` | Pure utilities |
| `@assets/*` | Static assets |
| `@src/*` | App entry and other top-level `src` files |

Paths are defined in [`tsconfig.app.json`](tsconfig.app.json); Vite resolves them via `tsconfigPaths` in [`vite.config.ts`](vite.config.ts).

## Environment variables

Create **`.env`** in **`QuizLive.Client/`** (next to `vite.config.ts`). Vite does not read env from the repository root.

| Variable            | Required | Example            | Purpose                           |
| ------------------- | -------- | ------------------ | --------------------------------- |
| `VITE_API_BASE_URL` | Yes      | `/api` or full URL | Base URL for API calls in the app |

Do not read `import.meta.env` elsewhere — use `src/config/env.ts` only: `import { ENV } from '@config'` → `ENV.VITE_API_BASE_URL`.

## Git hooks

From the **repository root**, run `npm install` once so Husky is installed.

| Hook         | Command                                                                        |
| ------------ | ------------------------------------------------------------------------------ |
| `pre-commit` | `lint-staged --cwd QuizLive.Client` (Prettier + ESLint on staged client files) |
| `pre-push`   | `npm run verify` in `QuizLive.Client` (ESLint, `tsc -b`, Vitest)               |
