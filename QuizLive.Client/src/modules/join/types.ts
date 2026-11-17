import type { z } from 'zod'

import type {
	gameLookupDtoSchema,
	joinFormSchema,
	joinGameResponseSchema
} from '@modules/join/schemas'

export type JoinModuleId = 'join'

export type GameLookupDto = z.infer<typeof gameLookupDtoSchema>

export type JoinGameResponse = z.infer<typeof joinGameResponseSchema>

export type JoinFormValues = z.infer<typeof joinFormSchema>

export type JoinGameRequest = {
	nickname: string
}
