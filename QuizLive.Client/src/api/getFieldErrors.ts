import type { ApiError } from '@api/apiError'
import { toFieldPath } from '@api/toFieldPath'

export function getFieldErrors(
	error: ApiError,
	fields: readonly string[] = []
): Record<string, string> {
	const fieldErrors: Record<string, string> = {}
	const canonicalFields = new Map(
		fields.map(field => [toFieldPath(field).toLowerCase(), field])
	)
	const seen = new Set<string>()

	for (const [key, messages] of Object.entries(error.errors ?? {})) {
		const normalized = toFieldPath(key)
		const comparisonKey = normalized.toLowerCase()
		const path = canonicalFields.get(comparisonKey) ?? normalized

		if (messages[0] && !seen.has(comparisonKey)) {
			fieldErrors[path] = messages[0]
			seen.add(comparisonKey)
		}
	}

	return fieldErrors
}
