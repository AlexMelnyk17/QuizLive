import { z } from 'zod'

import { gameStatusSchema } from '@modules/game/schemas'
import {
	JOIN_FORM_COPY,
	JOIN_NICKNAME_MAX_LENGTH
} from '@modules/join/constants'

// What a player sees before entering a nickname: the answer to GET /api/games/code/{code}.
export const gameLookupDtoSchema = z.object({
	code: z.string(),
	quizTitle: z.string(),
	status: gameStatusSchema
})

// The answer to joining a game. The token is returned only once and identifies the player on the hub.
export const joinGameResponseSchema = z.object({
	gameId: z.number(),
	playerId: z.number(),
	nickname: z.string(),
	token: z.string().min(1)
})

export const joinFormSchema = z.object({
	nickname: z
		.string()
		.trim()
		.min(1, JOIN_FORM_COPY.validation.nicknameRequired)
		.max(JOIN_NICKNAME_MAX_LENGTH, JOIN_FORM_COPY.validation.nicknameMax)
})
