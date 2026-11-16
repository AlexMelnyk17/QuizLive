import { useMutation } from '@tanstack/react-query'

import { reorderQuestions } from '@modules/quizzes/api/questionsApi'
import { useInvalidateQuizzes } from '@modules/quizzes/hooks/useInvalidateQuizzes'

export function useReorderQuestions(quizId: number) {
	const invalidate = useInvalidateQuizzes()

	return useMutation({
		mutationFn: (questionIds: number[]) =>
			reorderQuestions(quizId, questionIds),
		onSuccess: invalidate
	})
}