import type { z } from 'zod'

import type {
	gamePlayerDtoSchema,
	gameStatusSchema,
	hostGameDtoSchema,
	hostGameStateDtoSchema,
	hostQuestionDtoSchema,
	playerGameStateDtoSchema,
	playerOptionDtoSchema,
	playerQuestionDtoSchema,
	questionTimingDtoSchema
} from '@modules/game/schemas'

export type GameStatusValue = z.infer<typeof gameStatusSchema>

export type GamePlayerDto = z.infer<typeof gamePlayerDtoSchema>

export type QuestionTimingDto = z.infer<typeof questionTimingDtoSchema>

export type PlayerOptionDto = z.infer<typeof playerOptionDtoSchema>

export type PlayerQuestionDto = z.infer<typeof playerQuestionDtoSchema>

export type HostQuestionDto = z.infer<typeof hostQuestionDtoSchema>

export type HostGameDto = z.infer<typeof hostGameDtoSchema>

export type HostGameStateDto = z.infer<typeof hostGameStateDtoSchema>

export type PlayerGameStateDto = z.infer<typeof playerGameStateDtoSchema>
