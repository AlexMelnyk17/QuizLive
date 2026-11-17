import { useMutation } from '@tanstack/react-query'

import { deleteQuestion } from '@modules/quizzes/api/questionsApi'
import { useInvalidateQuizzes } from '@modules/quizzes/hooks/useInvalidateQuizzes'

export function useDeleteQuestion(quizId: number) {
	const invalidate = useInvalidateQuizzes()

	return useMutation({
		mutationFn: (questionId: number) => deleteQuestion(quizId, questionId),
		onSuccess: invalidate
	})
}
