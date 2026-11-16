import { useQuery } from '@tanstack/react-query'

import { fetchQuiz } from '@modules/quizzes/api/quizzesApi'
import { quizDetailsQueryKey } from '@modules/quizzes/constants'

import { ApiError } from '@api/apiError'

export function useQuiz(quizId: number, enabled = true) {
	return useQuery({
		queryKey: quizDetailsQueryKey(quizId),
		queryFn: () => fetchQuiz(quizId),
		enabled,
		// A missing quiz stays missing, so a 404 is shown right away instead of after a retry.
		retry: (failureCount, error) =>
			!(error instanceof ApiError && error.status === 404) && failureCount < 1
	})
}
