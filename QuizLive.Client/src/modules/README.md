# Feature modules

Each folder under `modules/` is a **vertical slice** for one domain area (e.g. `home`, `lobby`, `game`). Keep feature code inside the module; use top-level folders only for **shared** concerns.

## Module layout

```
modules/<name>/
  api/           # HTTP calls and DTO mapping for this module only
  components/    # UI owned by this module
  hooks/         # React hooks for this module
  store/         # Client state for this module
  constants.ts
  types.ts
  index.ts       # Public API — other code imports from here only
```

## Rules

- **Import other modules** only via `@modules/<name>` (their `index.ts`), not deep paths into another module.
- **Do not** import from another module’s `api/`, `store/`, or `components/` directly.
- **Shared HTTP client**, design system, layouts, and cross-cutting helpers live in top-level `@api`, `@ui`, `@layout`, `@shared`, `@utils`, etc.
- **`modules/<name>/store/`** — Zustand (or other) state scoped to that feature; use a module-level store per domain, no global reducer folder.
- Add a new module by copying the structure of `home/` and exporting the entry from `index.ts`.
