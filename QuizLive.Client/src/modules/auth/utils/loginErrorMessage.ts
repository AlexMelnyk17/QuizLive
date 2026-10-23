import { ApiError } from '@api/apiError'

const DEFAULT_LOGIN_FAILED = 'Login failed. Please try again.'
const DEFAULT_INVALID_CREDENTIALS = 'Invalid user name or password.'

export function getLoginRootErrorMessage(error: unknown): string {
	if (!(error instanceof ApiError)) {
		return DEFAULT_LOGIN_FAILED
	}

	if (error.status === 401) {
		const base = error.detail ?? DEFAULT_INVALID_CREDENTIALS
		if (error.remainingAttempts !== undefined) {
			return `${base} Remaining attempts: ${error.remainingAttempts}.`
		}
		if (error.lockoutEndUtc) {
			return `${base} Try again after ${new Date(error.lockoutEndUtc).toLocaleString()}.`
		}
		return base
	}

	return error.detail ?? DEFAULT_LOGIN_FAILED
}
