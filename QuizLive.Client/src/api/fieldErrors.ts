import type { ApiError } from '@api/apiError'

// Model validation reports keys like "Options[1].Text", the services like "options[1].text".
// Both become react-hook-form paths: "options.1.text".
export function toFieldPath(key: string): string {
	return key
		.replace(/\[(\d+)\]/g, '.$1')
		.split('.')
		.map(part => part.charAt(0).toLowerCase() + part.slice(1))
		.join('.')
}

// The first message for each field, keyed by form path.
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
