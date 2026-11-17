import type { GameState } from '@modules/game/types'

// The path is relative to ENV.VITE_API_BASE_URL: with "/api" it is /api/hubs/game.
export const GAME_HUB_PATH = '/hubs/game'

// SignalR puts the text of a HubException after this marker in the message of a failed call:
// "An unexpected error occurred invoking 'X' on the server. HubException: <readable text>".
export const HUB_EXCEPTION_MARKER = 'HubException: '

export const GAME_ERROR_COPY = {
	generic: 'Something went wrong. Try again.',
	notConnected: 'Not connected to the game yet.'
} as const

// Names of the methods the client calls on the hub.
export const GAME_HUB_METHODS = {
	connectAsHost: 'ConnectAsHost',
	connectAsPlayer: 'ConnectAsPlayer',
	startGame: 'StartGame',
	showResults: 'ShowResults',
	nextQuestion: 'NextQuestion',
	endGame: 'EndGame'
} as const

// Names of the events the server sends to the client.
export const GAME_HUB_EVENTS = {
	playerJoined: 'PlayerJoined',
	questionShown: 'QuestionShown',
	hostQuestionShown: 'HostQuestionShown',
	questionClosed: 'QuestionClosed',
	gameEnded: 'GameEnded'
} as const

// Pauses before the automatic reconnect attempts. After the last one the connection is closed for good.
export const GAME_HUB_RECONNECT_DELAYS_MS = [0, 2000, 5000, 10000, 30000]

export const PLAYER_TOKEN_STORAGE_KEY = 'quizlive-player-token'

// The server sends enums as numbers.
export const GameStatus = {
	Lobby: 0,
	Question: 1,
	Results: 2,
	Finished: 3
} as const

export const PLAYER_PAGE_COPY = {
	connecting: 'Connecting to the game…',
	joined: (nickname: string) => `You joined as ${nickname}`,
	gameCode: (code: string) => `Game code: ${code}`
} as const

// Where the connection to the hub is. "failed" means it could not be started, or the game could not be
// joined (a wrong token, an ended game); the error text says which.
export const GAME_CONNECTION_STATE = {
	connecting: 'connecting',
	connected: 'connected',
	reconnecting: 'reconnecting',
	disconnected: 'disconnected',
	failed: 'failed'
} as const

// What can happen to the state of a game on the client; see gameReducer.
export const GAME_ACTION_TYPES = {
	snapshot: 'snapshot',
	playerJoined: 'playerJoined',
	questionShown: 'questionShown',
	questionClosed: 'questionClosed',
	gameEnded: 'gameEnded'
} as const

// Nothing is known until the connect response arrives (status is null).
export const INITIAL_GAME_STATE: GameState<never> = {
	status: null,
	players: [],
	currentQuestion: null,
	questionReceivedAtMs: null,
	closedQuestionNumber: null
}
