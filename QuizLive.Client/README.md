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

**Feature modules** live under `src/modules/<name>/` (api, components, hooks, store, `constants.ts`, `types.ts`, `index.ts`). **Shared** code uses top-level aliases. See [src/modules/README.md](src/modules/README.md).

| Alias          | Purpose                                                           |
| -------------- | ----------------------------------------------------------------- |
| `@modules/*`   | Feature modules (import public API from each module’s `index.ts`) |
| `@api/*`       | Shared HTTP client / base API utilities (not feature endpoints)   |
| `@ui/*`        | Generic design-system components                                  |
| `@layout/*`    | App shells and route layouts                                      |
| `@providers/*` | Global React providers                                            |
| `@shared/*`    | Cross-module constants/helpers (non-React)                        |
| `@config`      | App configuration barrel (`ENV` from `config/env.ts`)             |
| `@config/*`    | Other config modules under `src/config/`                          |
| `@utils/*`     | Pure utilities                                                    |
| `@typings/*`   | Shared FE types (not npm `@types`)                                |
| `@assets/*`    | Imported static assets                                            |

Vite resolves aliases via `resolve.tsconfigPaths` in [`vite.config.ts`](vite.config.ts); paths are defined in [`tsconfig.app.json`](tsconfig.app.json).

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
