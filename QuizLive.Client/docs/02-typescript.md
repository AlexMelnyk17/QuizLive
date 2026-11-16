# TypeScript Rules

## Purpose

We use TypeScript as a safety net: strict compiler options, type-aware ESLint, and runtime validation at boundaries. Types describe the app; Zod proves external data.

## R-1. Strict compiler options (MUST)

From `tsconfig.app.json`:

- `strict: true`
- `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`

**MUST** fix reported issues. **MUST NOT** use `@ts-ignore` / `@ts-expect-error` without a short comment explaining why.

Run `npm run typecheck` (`tsc -b`) before pushing.

## R-2. `import type` for types only (MUST)

`verbatimModuleSyntax` is enabled. Type-only imports **MUST** use `import type`.

```ts
// Good
import type { QuizDto } from '@modules/quizzes/types'

// Bad — may emit invalid runtime imports
import { QuizDto } from '@modules/quizzes/types'
```

## R-3. No `any` and no lying casts (MUST)

- ESLint uses `typescript-eslint` **recommendedTypeChecked** — unsafe `any` flows are errors.
- At **untrusted** boundaries (API, `JSON.parse`, storage), narrow with Zod — **MUST NOT** use `as` to silence the compiler.
- **AVOID** non-null assertion (`!`); prefer guards, optional chaining, and nullish coalescing.

```ts
// Bad
const user = (await res.json()) as UserDto

// Good
const user = userDtoSchema.parse(await res.json())
```

## R-4. Types from schemas (MUST)

For API and form DTOs:

1. Define `*Schema` in `schemas.ts`.
2. Export types as `export type Foo = z.infer<typeof fooSchema>` in `types.ts`.

**MUST NOT** hand-write duplicate interfaces for the same shape unless there is no schema.

## R-5. Annotate public surfaces (SHOULD)

- **SHOULD** type component props (`type XxxProps = { ... }`) and exported hook return shapes when not obvious.
- **MAY** let locals infer when the initializer is clear.

## R-6. Modern patterns (SHOULD)

- **SHOULD** use discriminated unions for variants (`type` + literal `kind` / `status`).
- **SHOULD** use `satisfies` to check object literals without widening (e.g. const maps).
- **SHOULD** use `readonly` on data that must not be mutated in place.
- **SHOULD** end exhaustive `switch` on unions with `assertNever` or a `default` that satisfies `never`.

## R-7. Path aliases only (MUST)

ESLint `no-restricted-imports` forbids `../` and `./` in application code. Use aliases from `tsconfig.app.json` (`@modules/*`, `@api/*`, `@utils/*`, etc.).

## R-8. Optional hardening (SHOULD consider)

Not enabled today; consider enabling incrementally:

- `noUncheckedIndexedAccess` — index access includes `| undefined`
- `exactOptionalPropertyTypes` — `prop?: T` vs `prop: T | undefined`

## See also

- [01-api.md](./01-api.md) — Zod at API boundary
- [03-code-style.md](./03-code-style.md) — naming conventions

## References

- [TypeScript `strict`](https://www.typescriptlang.org/tsconfig/strict)
- [React — TypeScript](https://react.dev/learn/typescript)