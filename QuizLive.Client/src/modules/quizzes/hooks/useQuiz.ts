import { useQuery } from '@tanstack/react-query'

import { fetchQuiz } from '@modules/quizzes/api/quizzesApi'
import { quizDetailsQueryKey } from '@modules/quizzes/constants'

export function useQuiz(quizId: number) {
	return useQuery({
		queryKey: quizDetailsQueryKey(quizId),
		queryFn: () => fetchQuiz(quizId)
	})
}
