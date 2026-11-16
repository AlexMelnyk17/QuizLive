import { useQuery } from '@tanstack/react-query'

import { fetchMyQuizzes } from '@modules/quizzes/api/quizzesApi'
import { quizListQueryKey } from '@modules/quizzes/constants'

export function useMyQuizzes(archived: boolean) {
	return useQuery({
		queryKey: quizListQueryKey(archived),
		queryFn: () => fetchMyQuizzes(archived)
	})
}
