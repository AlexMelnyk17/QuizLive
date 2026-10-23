import { useQuery } from '@tanstack/react-query'

import { fetchMyQuizzes } from '@modules/dashboard/api/quizzesApi'
import { QUIZZES_QUERY_KEY } from '@modules/dashboard/constants'

export function useMyQuizzes() {
	return useQuery({
		queryKey: QUIZZES_QUERY_KEY,
		queryFn: () => fetchMyQuizzes(false),
	})
}
