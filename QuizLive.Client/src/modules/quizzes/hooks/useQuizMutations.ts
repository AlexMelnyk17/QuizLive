import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
	createQuiz,
	deleteQuiz,
	setQuizArchived,
	updateQuiz
} from '@modules/quizzes/api/quizzesApi'
import {
	QUIZZES_QUERY_KEY,
	quizDetailsQueryKey
} from '@modules/quizzes/constants'
import type {
	CreateQuizRequest,
	UpdateQuizRequest
} from '@modules/quizzes/types'

// Returning the promise makes the mutation wait until the lists and details are refetched.
export function useInvalidateQuizzes() {
	const queryClient = useQueryClient()

	return () => queryClient.invalidateQueries({ queryKey: QUIZZES_QUERY_KEY })
}

export function useCreateQuiz() {
	const invalidate = useInvalidateQuizzes()

	return useMutation({
		mutationFn: (request: CreateQuizRequest) => createQuiz(request),
		onSuccess: invalidate
	})
}

export function useUpdateQuiz(quizId: number) {
	const invalidate = useInvalidateQuizzes()

	return useMutation({
		mutationFn: (request: UpdateQuizRequest) => updateQuiz(quizId, request),
		onSuccess: invalidate
	})
}

export function useSetQuizArchived() {
	const invalidate = useInvalidateQuizzes()

	return useMutation({
		mutationFn: ({ quizId, archived }: { quizId: number; archived: boolean }) =>
			setQuizArchived(quizId, archived),
		onSuccess: invalidate
	})
}

export function useDeleteQuiz() {
	const queryClient = useQueryClient()
	const invalidate = useInvalidateQuizzes()

	return useMutation({
		mutationFn: (quizId: number) => deleteQuiz(quizId),
		// The deleted quiz is removed first, so its open details page does not refetch it into a 404.
		onSuccess: (_, quizId) => {
			queryClient.removeQueries({ queryKey: quizDetailsQueryKey(quizId) })
			return invalidate()
		}
	})
}
