import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'
import { AUTH_COPY } from '@modules/auth/constants'

export function getLoginRootErrorMessage(error: unknown): string {
	if (!(error instanceof ApiError)) {
		return AUTH_COPY.errors.loginFailed
	}

	if (error.status === HTTP_STATUS.UNAUTHORIZED) {
		const base = error.detail ?? AUTH_COPY.errors.invalidCredentials
		if (error.remainingAttempts !== undefined) {
			return `${base} ${AUTH_COPY.errors.remainingAttempts(error.remainingAttempts)}`
		}
		if (error.lockoutEndUtc) {
			return `${base} ${AUTH_COPY.errors.lockoutRetry(new Date(error.lockoutEndUtc).toLocaleString())}`
		}
		return base
	}

	return error.detail ?? AUTH_COPY.errors.loginFailed
}