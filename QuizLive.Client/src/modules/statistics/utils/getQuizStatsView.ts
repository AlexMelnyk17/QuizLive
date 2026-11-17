import type { QuizStatsView } from '@modules/statistics/types'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

export function getQuizStatsView(input: {
	validId: boolean
	isPending: boolean
	isError: boolean
	hasData: boolean
	error: unknown
}): QuizStatsView {
	if (!input.validId) {
		return 'invalid'
	}

	if (input.isPending) {
		return 'pending'
	}

	if (input.hasData && !input.isError) {
		return 'ready'
	}

	if (
		input.error instanceof ApiError &&
		input.error.status === HTTP_STATUS.NOT_FOUND
	) {
		return 'not-found'
	}

	return 'error'
}
