import { useMutation } from '@tanstack/react-query'

import { createQuiz } from '@modules/quizzes/api/quizzesApi'
import { useInvalidateQuizzes } from '@modules/quizzes/hooks/useInvalidateQuizzes'
import type { CreateQuizRequest } from '@modules/quizzes/types'

export function useCreateQuiz() {
	const invalidate = useInvalidateQuizzes()

	return useMutation({
		mutationFn: (request: CreateQuizRequest) => createQuiz(request),
		onSuccess: invalidate
	})
}
