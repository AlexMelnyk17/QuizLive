import { useMutation } from '@tanstack/react-query'

import { usePlayerTokenStore } from '@modules/game/store/playerTokenStore'
import { joinGame } from '@modules/join/api/joinApi'
import type { JoinGameRequest } from '@modules/join/types'

// Joins the game of the code with a nickname. The server gives the player token only once, in this answer,
// so it is saved here, before the caller can do anything else: the player page connects with it.
export function useJoinGame(code: string) {
	return useMutation({
		mutationFn: (request: JoinGameRequest) => joinGame(code, request),
		onSuccess: response => {
			usePlayerTokenStore.getState().setPlayerToken(response.token)
		}
	})
}
