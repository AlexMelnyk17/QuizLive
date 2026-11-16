import { useMutation } from '@tanstack/react-query'

import { updateQuiz } from '@modules/quizzes/api/quizzesApi'
import { useInvalidateQuizzes } from '@modules/quizzes/hooks/useInvalidateQuizzes'
import type { UpdateQuizRequest } from '@modules/quizzes/types'

export function useUpdateQuiz(quizId: number) {
	const invalidate = useInvalidateQuizzes()

	return useMutation({
		mutationFn: (request: UpdateQuizRequest) => updateQuiz(quizId, request),
		onSuccess: invalidate
	})
}