import type { z } from 'zod'

import type { GAME_ACTION_TYPES } from '@modules/game/constants'
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

// How far a game has got, as far as one side knows: used to tell a stale message from a fresh one.
// Both are null while nothing is known; questionNumber is null in the lobby.
export type GameProgress = {
	status: GameStatusValue | null
	questionNumber: number | null
}

// The game as one client sees it. The question is a PlayerQuestionDto for a player and a HostQuestionDto
// for the host, so the state is generic. questionReceivedAtMs is the device time when the question arrived,
// which getRemainingMs needs to count down by the server clock.
export type GameState<TQuestion extends { number: number }> = {
	status: GameStatusValue | null
	players: GamePlayerDto[]
	currentQuestion: TQuestion | null
	questionReceivedAtMs: number | null
	closedQuestionNumber: number | null
}

export type GameAction<TQuestion extends { number: number }> =
	| {
			type: typeof GAME_ACTION_TYPES.snapshot
			status: GameStatusValue
			players: GamePlayerDto[]
			currentQuestion: TQuestion | null
			receivedAtMs: number
	  }
	| { type: typeof GAME_ACTION_TYPES.playerJoined; player: GamePlayerDto }
	| {
			type: typeof GAME_ACTION_TYPES.questionShown
			question: TQuestion
			receivedAtMs: number
	  }
	| { type: typeof GAME_ACTION_TYPES.questionClosed; number: number }
	| { type: typeof GAME_ACTION_TYPES.gameEnded }

// Every handler is optional: the host listens to some events, a player to others.
export type GameEventHandlers = {
	onPlayerJoined?: (player: GamePlayerDto) => void
	onQuestionShown?: (question: PlayerQuestionDto) => void
	onHostQuestionShown?: (question: HostQuestionDto) => void
	onQuestionClosed?: (number: number) => void
	onGameEnded?: () => void
}
