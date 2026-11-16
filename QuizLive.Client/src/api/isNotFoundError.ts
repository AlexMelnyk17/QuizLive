import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

export function isNotFoundError(error: unknown): error is ApiError {
	return error instanceof ApiError && error.status === HTTP_STATUS.NOT_FOUND
}
