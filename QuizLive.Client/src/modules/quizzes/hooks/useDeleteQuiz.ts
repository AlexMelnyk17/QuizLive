import { useMutation, useQueryClient } from '@tanstack/react-query'

import { deleteQuiz } from '@modules/quizzes/api/quizzesApi'
import { quizDetailsQueryKey } from '@modules/quizzes/constants'
import { useInvalidateQuizzes } from '@modules/quizzes/hooks/useInvalidateQuizzes'

export function useDeleteQuiz() {
	const queryClient = useQueryClient()
	const invalidate = useInvalidateQuizzes()

	return useMutation({
		mutationFn: (quizId: number) => deleteQuiz(quizId),
		onSuccess: (_, quizId) => {
			queryClient.removeQueries({ queryKey: quizDetailsQueryKey(quizId) })
			return invalidate()
		}
	})
}
