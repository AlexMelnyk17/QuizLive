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

// Every handler is optional: the host listens to some events, a player to others.
export type GameEventHandlers = {
	onPlayerJoined?: (player: GamePlayerDto) => void
	onQuestionShown?: (question: PlayerQuestionDto) => void
	onHostQuestionShown?: (question: HostQuestionDto) => void
	onQuestionClosed?: (number: number) => void
	onGameEnded?: () => void
}
