// The path is relative to ENV.VITE_API_BASE_URL: with "/api" it is /api/hubs/game.
export const GAME_HUB_PATH = '/hubs/game'

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

// The server sends enums as numbers.
export const GameStatus = {
	Lobby: 0,
	Question: 1,
	Results: 2,
	Finished: 3
} as const
