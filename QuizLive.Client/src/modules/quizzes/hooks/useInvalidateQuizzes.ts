import { useQueryClient } from '@tanstack/react-query'

import { QUIZZES_QUERY_KEY } from '@modules/quizzes/constants'

export function useInvalidateQuizzes() {
	const queryClient = useQueryClient()

	return () => queryClient.invalidateQueries({ queryKey: QUIZZES_QUERY_KEY })
}