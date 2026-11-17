import { useMutation } from '@tanstack/react-query'

import { setQuizArchived } from '@modules/quizzes/api/quizzesApi'
import { useInvalidateQuizzes } from '@modules/quizzes/hooks/useInvalidateQuizzes'

export function useSetQuizArchived() {
	const invalidate = useInvalidateQuizzes()

	return useMutation({
		mutationFn: ({ quizId, archived }: { quizId: number; archived: boolean }) =>
			setQuizArchived(quizId, archived),
		onSuccess: invalidate
	})
}
