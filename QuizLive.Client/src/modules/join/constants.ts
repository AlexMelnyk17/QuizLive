export const JOIN_GAME_CODE_LENGTH = 6

export const JOIN_GAME_CODE_LABEL = 'Game code'

export const JOIN_PANEL_COPY = {
	intro: 'Enter the game code to join as a player.',
	join: 'Join game',
	looking: 'Looking for the game…',
	found: (quizTitle: string) => `Game found: ${quizTitle}`,
	notFound:
		'There is no active game with this code. Check the code and try again.',
	started: 'This game has already started, so it cannot be joined.',
	lookupError:
		'Could not look the game up. Check your connection and try again.'
} as const

// What the game code form knows about the code that was typed.
export const JOIN_LOOKUP = {
	idle: 'idle',
	loading: 'loading',
	found: 'found',
	started: 'started',
	notFound: 'notFound',
	error: 'error'
} as const

// Both endpoints are public: a player has no account, so no token is sent.
export const JOIN_API = {
	byCode: (code: string) => `/games/code/${encodeURIComponent(code)}`,
	players: (code: string) => `/games/code/${encodeURIComponent(code)}/players`
}

// The server accepts a nickname of 1 to 40 characters.
export const JOIN_NICKNAME_MAX_LENGTH = 40

export const JOIN_FORM_COPY = {
	title: 'Choose a nickname',
	joining: (quizTitle: string) => `Joining: ${quizTitle}`,
	nicknameLabel: 'Nickname',
	nicknamePlaceholder: 'Your nickname',
	submit: 'Join game',
	back: 'Back',
	errorTitle: 'Could not join the game',
	genericError: 'Could not join the game. Check your connection and try again.',
	validation: {
		nicknameRequired: 'Enter a nickname.',
		nicknameMax: `The nickname can be at most ${JOIN_NICKNAME_MAX_LENGTH} characters.`
	}
} as const

// The fields of the nickname form; the server names its field errors after them.
export const JOIN_FORM_FIELDS = ['nickname'] as const

// A game found by its code. The code is part of the key, so each code is cached on its own.
export const GAME_BY_CODE_QUERY_KEY = ['games', 'by-code'] as const

export const gameByCodeQueryKey = (code: string) =>
	[...GAME_BY_CODE_QUERY_KEY, code] as const
