import { useMutation } from '@tanstack/react-query'

import { createGame } from '@modules/game/api/gamesApi'
import { useInvalidateQuizzes } from '@modules/quizzes/hooks/useInvalidateQuizzes'

// Creates a game for a quiz. The quiz now has an active game, which the server reports on its next read, so
// the cached quizzes are refreshed. The caller opens the host page with the id from the answer.
export function useCreateGame() {
	const invalidate = useInvalidateQuizzes()

	return useMutation({
		mutationFn: (quizId: number) => createGame(quizId),
		onSuccess: invalidate
	})
}
