import { useMutation } from '@tanstack/react-query'

import { updateQuestion } from '@modules/quizzes/api/questionsApi'
import { useInvalidateQuizzes } from '@modules/quizzes/hooks/useInvalidateQuizzes'
import type { QuestionRequest } from '@modules/quizzes/types'

export function useUpdateQuestion(quizId: number) {
	const invalidate = useInvalidateQuizzes()

	return useMutation({
		mutationFn: ({
			questionId,
			request
		}: {
			questionId: number
			request: QuestionRequest
		}) => updateQuestion(quizId, questionId, request),
		onSuccess: invalidate
	})
}