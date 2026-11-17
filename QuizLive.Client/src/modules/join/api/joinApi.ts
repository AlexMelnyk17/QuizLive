import { JOIN_API } from '@modules/join/constants'
import {
	gameLookupDtoSchema,
	joinGameResponseSchema
} from '@modules/join/schemas'
import type {
	GameLookupDto,
	JoinGameRequest,
	JoinGameResponse
} from '@modules/join/types'

import { apiRequest } from '@api/client'

// What a player sees before entering a nickname. A code that belongs to no active game is a 404.
export async function fetchGameByCode(code: string): Promise<GameLookupDto> {
	const data = await apiRequest<GameLookupDto>(JOIN_API.byCode(code), {
		skipAuth: true
	})

	return gameLookupDtoSchema.parse(data)
}

// Joins a game that is in the lobby. The answer holds the player token, which the server gives only once.
// Errors: 404 no active game with this code, 409 the game has already started or the nickname is taken,
// 400 the nickname is empty or too long.
export async function joinGame(
	code: string,
	request: JoinGameRequest
): Promise<JoinGameResponse> {
	const data = await apiRequest<JoinGameResponse>(JOIN_API.players(code), {
		method: 'POST',
		body: request,
		skipAuth: true
	})

	return joinGameResponseSchema.parse(data)
}
