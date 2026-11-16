import { useMutation } from '@tanstack/react-query'

import {
	createQuestion,
	deleteQuestion,
	reorderQuestions,
	updateQuestion
} from '@modules/quizzes/api/questionsApi'
import { useInvalidateQuizzes } from '@modules/quizzes/hooks/useQuizMutations'
import type { QuestionRequest } from '@modules/quizzes/types'

// Questions change the quiz details and the question count in the lists, so all quiz queries are refreshed.

export function useCreateQuestion(quizId: number) {
	const invalidate = useInvalidateQuizzes()

	return useMutation({
		mutationFn: (request: QuestionRequest) => createQuestion(quizId, request),
		onSuccess: invalidate
	})
}

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

export function useDeleteQuestion(quizId: number) {
	const invalidate = useInvalidateQuizzes()

	return useMutation({
		mutationFn: (questionId: number) => deleteQuestion(quizId, questionId),
		onSuccess: invalidate
	})
}

export function useReorderQuestions(quizId: number) {
	const invalidate = useInvalidateQuizzes()

	return useMutation({
		mutationFn: (questionIds: number[]) =>
			reorderQuestions(quizId, questionIds),
		onSuccess: invalidate
	})
}
