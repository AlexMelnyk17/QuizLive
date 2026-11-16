import type { GameStatsView } from '@modules/statistics/types'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

export function getGameStatsView(input: {
	validIds: boolean
	isPending: boolean
	isError: boolean
	hasData: boolean
	error: unknown
}): GameStatsView {
	if (!input.validIds) {
		return 'invalid'
	}

	if (input.isPending) {
		return 'pending'
	}

	if (input.hasData && !input.isError) {
		return 'ready'
	}

	if (!(input.error instanceof ApiError)) {
		return 'error'
	}

	if (input.error.status === HTTP_STATUS.CONFLICT) {
		return 'not-finished'
	}

	if (input.error.status === HTTP_STATUS.NOT_FOUND) {
		return 'not-found'
	}

	return 'error'
}
