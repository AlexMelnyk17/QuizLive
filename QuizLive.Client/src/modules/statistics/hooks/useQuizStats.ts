import { useQuery } from '@tanstack/react-query'

import { fetchQuizStats } from '@modules/statistics/api/statsApi'
import { quizStatsQueryKey } from '@modules/statistics/constants'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

export function useQuizStats(quizId: number, enabled = true) {
	return useQuery({
		queryKey: quizStatsQueryKey(quizId),
		queryFn: () => fetchQuizStats(quizId),
		enabled,
		retry: (failureCount, error) =>
			!(error instanceof ApiError && error.status === HTTP_STATUS.NOT_FOUND) &&
			failureCount < 1,
	})
}