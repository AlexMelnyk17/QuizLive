# Working with the API

## Purpose

All backend communication follows one HTTP pipeline: typed module functions, Zod validation at the boundary, React Query for server state, and `ApiError` for failures. UI code never calls `fetch` directly.

When this doc disagrees with enforced config, **config wins**: [`.prettierrc.json`](../.prettierrc.json), [`eslint.config.js`](../eslint.config.js), and [`tsconfig.app.json`](../tsconfig.app.json).

## R-1. Single HTTP entry point (MUST)

- **MUST** use `apiRequest` from `@api/client`.
- **MUST NOT** use raw `fetch`, axios, or ad hoc clients in modules.
- **MUST** read the API base URL only via `import { ENV } from '@config/env'`. `import.meta.env` is allowed **only** inside `src/config/env.ts`.

```ts
// Good
import { apiRequest } from '@api/client'

export async function fetchQuiz(quizId: number): Promise<QuizDetailsDto> {
	const data = await apiRequest<QuizDetailsDto>(`/quizzes/${quizId}`)
	return quizDetailsDtoSchema.parse(data)
}

// Bad — bypasses auth, errors, and base URL rules
const res = await fetch('/api/quizzes/1')
```

## R-2. Module API files (MUST)

- Place endpoints in `src/modules/<name>/api/*Api.ts`.
- **One exported async function per endpoint**; explicit return type `Promise<T>`.
- **MUST NOT** import React, hooks, or UI from `api/`.
- Request bodies use types from the module’s `types.ts` (usually inferred from Zod).

## R-3. Validate responses with Zod (MUST)

Untrusted JSON **MUST** be validated before it leaves the API layer.

- **MUST** use `.parse()` on API responses (contract mismatch is exceptional — same as a broken backend).
- **MUST NOT** use `as SomeDto` on `response.json()` results.
- **SHOULD** use `safeParse` only where invalid input is routine (e.g. optional user paste), not for normal GET/POST responses.

Schemas live in `schemas.ts`; DTO types in `types.ts` via `z.infer<typeof schema>`.

## R-4. Errors and auth (MUST)

- Failed responses throw `ApiError` (`@api/apiError`) with RFC 7807 problem details when available.
- **MUST** handle domain logic with `error instanceof ApiError` and `error.status`, not string matching.
- Field validation from the server: use `getFieldErrors` / `toFieldPath` (`@api/getFieldErrors`, `@api/toFieldPath`) for React Hook Form paths.
- `skipAuth: true` only for intentionally public endpoints.
- On **401** with a sent bearer token, the client calls `onUnauthorized` from `configureApiClient` (session clear) — **MUST NOT** duplicate that in each caller.

## R-5. UI never calls API functions (MUST)

Components and pages **MUST** load and mutate data through hooks in `modules/<name>/hooks/` that wrap TanStack Query.

```ts
// Good — component uses a hook
const { data, isPending, error } = useQuiz(quizId)

// Bad — component calls api directly
useEffect(() => { fetchQuiz(quizId).then(setQuiz) }, [quizId])
```

## R-6. Query keys (MUST)

Query keys are defined in the module’s `constants.ts`. They **MUST** be:

1. **Hierarchical** — shared prefix, then list vs detail (e.g. `['quizzes']`, `['quizzes', 'list', { archived }]`, `['quizzes', 'details', id]`).
2. **Serializable** — strings, numbers, plain objects; **no** functions, class instances, or `Date` in keys.
3. **Complete** — every variable the `queryFn` depends on **MUST** appear in the key.

See `QUIZZES_QUERY_KEY`, `quizListQueryKey`, `quizDetailsQueryKey` in `@modules/quizzes/constants`.

## R-7. Mutations and cache updates (MUST)

- **MUST** invalidate only caches affected by the mutation (targeted invalidation, not “invalidate everything”).
- **SHOULD** `return` the promise from `invalidateQueries` in `onSuccess` so `isPending` stays true until refetch finishes (see `useInvalidateQuizzes`).
- After delete, **SHOULD** `removeQueries` for the deleted detail key before invalidating lists (see `useDeleteQuiz`).
- **MAY** use `setQueryData` when an instant detail update is required; still invalidate lists when the entity appears in lists.

## R-8. Retry policy (SHOULD)

Configure `retry` per query. **SHOULD NOT** retry permanent client errors (e.g. **404** on a missing quiz — see `useQuiz`).

## R-9. Forms and API (MUST)

- Client validation: React Hook Form + `zodResolver` with the **same** Zod schema as the module (`schemas.ts`).
- **MUST NOT** duplicate validation rules in `register()` options.
- Server field errors: map `ApiError.errors` through `getFieldErrors` into `setError` on the form.

## See also

- [02-typescript.md](./02-typescript.md) — `z.infer`, `import type`
- [04-decomposition.md](./04-decomposition.md) — where `api/` lives
- [06-testing.md](./06-testing.md) — mocking `fetch` for `*Api.test.ts`

## References

- [TanStack Query — Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [TanStack Query — Invalidations from Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)
- [React Hook Form — Zod](https://react-hook-form.com/integrations/zod)