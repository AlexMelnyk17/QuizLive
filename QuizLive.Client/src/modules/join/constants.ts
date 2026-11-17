export const JOIN_GAME_CODE_LENGTH = 6

export const JOIN_GAME_CODE_LABEL = 'Game code'

export const JOIN_NOT_AVAILABLE_MESSAGE =
	'Joining with a code is not available yet. You can still enter a code to get ready for when it ships.'

// Both endpoints are public: a player has no account, so no token is sent.
export const JOIN_API = {
	byCode: (code: string) => `/games/code/${encodeURIComponent(code)}`,
	players: (code: string) => `/games/code/${encodeURIComponent(code)}/players`
}

// The server accepts a nickname of 1 to 40 characters.
export const JOIN_NICKNAME_MAX_LENGTH = 40

export const JOIN_FORM_COPY = {
	validation: {
		nicknameRequired: 'Enter a nickname.',
		nicknameMax: `The nickname can be at most ${JOIN_NICKNAME_MAX_LENGTH} characters.`
	}
} as const

// A game found by its code. The code is part of the key, so each code is cached on its own.
export const GAME_BY_CODE_QUERY_KEY = ['games', 'by-code'] as const

export const gameByCodeQueryKey = (code: string) =>
	[...GAME_BY_CODE_QUERY_KEY, code] as const
