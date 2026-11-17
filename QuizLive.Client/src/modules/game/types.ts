import type { HubConnection } from '@microsoft/signalr'
import type { z } from 'zod'

import type {
	GAME_ACTION_TYPES,
	GAME_CONNECTION_STATE
} from '@modules/game/constants'
import type {
	answerProgressDtoSchema,
	gamePlayerDtoSchema,
	gameStatusSchema,
	hostGameDtoSchema,
	hostGameStateDtoSchema,
	hostQuestionDtoSchema,
	hostResultsDtoSchema,
	leaderboardDtoSchema,
	playerGameStateDtoSchema,
	playerOptionDtoSchema,
	playerPresenceDtoSchema,
	playerQuestionDtoSchema,
	playerResultsDtoSchema,
	questionTimeAddedDtoSchema,
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

export type GameConnectionStateValue =
	(typeof GAME_CONNECTION_STATE)[keyof typeof GAME_CONNECTION_STATE]

export type GameHubConnectionOptions = {
	// Nothing is connected while this is false, e.g. a player who has no token yet.
	enabled: boolean
	// The host gives its JWT; a player gives nothing.
	accessTokenFactory?: () => string
	handlers: GameEventHandlers
	// Joins the game on the hub (ConnectAs*). It runs after the connection starts and after every reconnect.
	join: (connection: HubConnection) => Promise<void>
}

export type GameHubConnectionResult = {
	// Null until the connection has started.
	connection: HubConnection | null
	connectionState: GameConnectionStateValue
	error: string | null
}

// What stays the same during a game. The status and the players change and live in the game state.
export type HostGameInfo = Pick<
	HostGameDto,
	'id' | 'code' | 'quizId' | 'quizTitle' | 'quizKind'
>

// A host command gives back the readable error text, or null when the server accepted it. What the command
// does arrives as an event, not as a result.
export type HostGameCommands = {
	startGame: () => Promise<string | null>
	showResults: () => Promise<string | null>
	nextQuestion: () => Promise<string | null>
	endGame: () => Promise<string | null>
}

export type HostGameResult = {
	// Null until the host has joined the game.
	game: HostGameInfo | null
	status: GameStatusValue | null
	players: GamePlayerDto[]
	currentQuestion: HostQuestionDto | null
	// When the current question arrived, on the device clock; getRemainingMs needs it.
	questionReceivedAtMs: number | null
	// The number of the question whose results are shown.
	closedQuestionNumber: number | null
	connectionState: GameConnectionStateValue
	error: string | null
	commands: HostGameCommands
}

// What stays the same during a game for one player. The status and the players change and live in the game state.
export type PlayerGameInfo = Pick<
	PlayerGameStateDto,
	'gameId' | 'code' | 'quizTitle' | 'playerId' | 'nickname'
>

export type PlayerGameResult = {
	// Without a player token nothing connects: the player has not joined a game in this tab.
	hasToken: boolean
	// Null until the player has joined the game on the hub.
	player: PlayerGameInfo | null
	status: GameStatusValue | null
	players: GamePlayerDto[]
	// The question without the correct option.
	currentQuestion: PlayerQuestionDto | null
	// When the current question arrived, on the device clock; getRemainingMs needs it.
	questionReceivedAtMs: number | null
	// The number of the question whose results are shown.
	closedQuestionNumber: number | null
	connectionState: GameConnectionStateValue
	error: string | null
	// Forgets the player token and disconnects: the player leaves the game on this device.
	leave: () => void
}

export type SubmitAnswerRequest = {
	questionNumber: number
	optionId?: number
	text?: string
}

// Every handler is optional: the host listens to some events, a player to others.
export type GameEventHandlers = {
	onAnswerProgress?: (payload: z.infer<typeof answerProgressDtoSchema>) => void
	onHostResults?: (payload: z.infer<typeof hostResultsDtoSchema>) => void
	onPlayerResults?: (payload: z.infer<typeof playerResultsDtoSchema>) => void
	onLeaderboard?: (payload: z.infer<typeof leaderboardDtoSchema>) => void
	onTimeAdded?: (payload: z.infer<typeof questionTimeAddedDtoSchema>) => void
	onPlayerPresenceChanged?: (
		payload: z.infer<typeof playerPresenceDtoSchema>
	) => void
	onPlayerLeft?: (payload: number) => void
	onPlayerJoined?: (player: GamePlayerDto) => void
	onQuestionShown?: (question: PlayerQuestionDto) => void
	onHostQuestionShown?: (question: HostQuestionDto) => void
	onQuestionClosed?: (number: number) => void
	onGameEnded?: () => void
}
