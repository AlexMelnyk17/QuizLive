import { useQuery } from '@tanstack/react-query'

import { fetchGameStats } from '@modules/statistics/api/statsApi'
import { gameStatsQueryKey } from '@modules/statistics/constants'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

export function useGameStats(gameId: number, enabled = true) {
	return useQuery({
		queryKey: gameStatsQueryKey(gameId),
		queryFn: () => fetchGameStats(gameId),
		enabled,
		retry: (failureCount, error) => {
			if (!(error instanceof ApiError)) {
				return failureCount < 1
			}

			if (
				error.status === HTTP_STATUS.NOT_FOUND ||
				error.status === HTTP_STATUS.CONFLICT
			) {
				return false
			}

			return failureCount < 1
		}
	})
}
