import { GAMES_API } from '@modules/game/constants'
import { hostGameDtoSchema } from '@modules/game/schemas'
import type { HostGameDto } from '@modules/game/types'

import { apiRequest } from '@api/client'

// Creates a game in the lobby for a quiz of the current host. The answer holds the code the players enter.
// Errors: 404 the quiz is not the host's, 409 the quiz is archived, has no questions or already has an
// active game.
export async function createGame(quizId: number): Promise<HostGameDto> {
	const data = await apiRequest<HostGameDto>(GAMES_API.create, {
		method: 'POST',
		body: { quizId }
	})

	return hostGameDtoSchema.parse(data)
}
