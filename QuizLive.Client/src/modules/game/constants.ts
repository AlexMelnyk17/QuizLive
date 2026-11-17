import type { GameState } from '@modules/game/types'

// The path is relative to ENV.VITE_API_BASE_URL: with "/api" it is /api/hubs/game.
export const GAME_HUB_PATH = '/hubs/game'

// REST endpoints of the host side of a game, relative to ENV.VITE_API_BASE_URL.
export const GAMES_API = {
	create: '/games'
} as const

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
	endGame: 'EndGame',
	submitAnswer: 'SubmitAnswer',
	addTime: 'AddTime'
} as const

// Names of the events the server sends to the client.
export const GAME_HUB_EVENTS = {
	answerProgress: 'AnswerProgress',
	hostResults: 'HostResults',
	playerResults: 'PlayerResults',
	leaderboard: 'Leaderboard',
	timeAdded: 'TimeAdded',
	playerPresenceChanged: 'PlayerPresenceChanged',
	playerLeft: 'PlayerLeft',
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

export const HOST_GAME_COPY = {
	pageTitle: 'Host a game',
	connecting: 'Connecting to the game…',
	invalidGame: 'This address does not lead to a game.',
	backToQuizzes: 'Back to my quizzes'
} as const

export const HOST_LOBBY_COPY = {
	codeLabel: 'Game code',
	joinHint: 'Players enter this code on the home page to join.',
	start: 'Start game'
} as const

export const HOST_QUESTION_COPY = {
	showResults: 'Show results',
	openText: 'Players type their own answer.',
	correct: 'Correct'
} as const

export const HOST_RESULTS_COPY = {
	heading: (number: number, total: number) =>
		`Question ${number} of ${total}: closed`,
	next: 'Next question',
	finish: 'Finish game'
} as const

export const HOST_END_GAME_COPY = {
	open: 'End game',
	title: 'End the game?',
	body: 'The game finishes for everyone and cannot be resumed. Its progress is kept in the statistics.',
	cancel: 'Keep playing',
	confirm: 'End the game'
} as const

export const HOST_FINISHED_COPY = {
	title: 'Game finished',
	body: 'The players have been told the game is over.',
	viewStats: 'View game statistics',
	back: 'Back to my quizzes'
} as const

export const PLAYER_PAGE_COPY = {
	connecting: 'Connecting to the game…',
	joined: (nickname: string) => `You joined as ${nickname}`,
	gameCode: (code: string) => `Game code: ${code}`,
	finished: 'Game finished',
	finishedBody: 'Thanks for playing!',
	backToStart: 'Back to start'
} as const

export const PLAYER_QUESTION_COPY = {
	heading: (number: number, total: number) => `Question ${number} of ${total}`,
	imageAlt: 'Illustration of the question',
	timeUp: 'Time is up',
	closed: 'The question is closed. Waiting for the next question…'
} as const

export const MS_PER_SECOND = 1000

export const OPEN_ANSWER_MAX_LENGTH = 200

export const HOST_ADD_TIME_SECONDS = 10

export const HOST_ADD_TIME_COPY = {
	button: `Add ${HOST_ADD_TIME_SECONDS} seconds`
} as const

export const PLAYER_ANSWER_COPY = {
	label: 'Your answer',
	submit: 'Submit answer',
	accepted: 'Answer saved. You can change it until the question closes.',
	update: 'Update answer',
	required: 'Enter an answer.',
	tooLong: `The answer can be at most ${OPEN_ANSWER_MAX_LENGTH} characters.`
} as const

// How often the countdown of a question is refreshed.
export const COUNTDOWN_TICK_MS = 1000

export const PLAYER_LOBBY_COPY = {
	waitingForHost: 'Wait for the host to start the game.',
	players: (count: number) => `Players (${count})`,
	noPlayers: 'Waiting for players…',
	you: 'you',
	reconnecting: 'The connection was lost. Reconnecting…',
	disconnected: 'You are disconnected from the game.',
	leave: 'Leave game'
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
	timeAdded: 'timeAdded',
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
