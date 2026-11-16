import type { ApiError } from '@api/apiError'
import { toFieldPath } from '@api/toFieldPath'

export function getFieldErrors(error: ApiError): Record<string, string> {
	const fieldErrors: Record<string, string> = {}

	for (const [key, messages] of Object.entries(error.errors ?? {})) {
		const path = toFieldPath(key)

		if (messages[0] && !(path in fieldErrors)) {
			fieldErrors[path] = messages[0]
		}
	}

	return fieldErrors
}