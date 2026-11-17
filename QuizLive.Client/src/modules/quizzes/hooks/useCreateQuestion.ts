import { useMutation } from '@tanstack/react-query'

import { createQuestion } from '@modules/quizzes/api/questionsApi'
import { useInvalidateQuizzes } from '@modules/quizzes/hooks/useInvalidateQuizzes'
import type { QuestionRequest } from '@modules/quizzes/types'

export function useCreateQuestion(quizId: number) {
	const invalidate = useInvalidateQuizzes()

	return useMutation({
		mutationFn: (request: QuestionRequest) => createQuestion(quizId, request),
		onSuccess: invalidate
	})
}
