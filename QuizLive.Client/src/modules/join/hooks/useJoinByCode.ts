import { useState } from 'react'

import { GameStatus } from '@modules/game/constants'
import { JOIN_LOOKUP } from '@modules/join/constants'
import { useGameByCode } from '@modules/join/hooks/useGameByCode'
import type { GameLookupDto } from '@modules/join/types'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

type JoinLookup =
	| { kind: typeof JOIN_LOOKUP.idle }
	| { kind: typeof JOIN_LOOKUP.loading }
	| { kind: typeof JOIN_LOOKUP.found; game: GameLookupDto }
	| { kind: typeof JOIN_LOOKUP.started; game: GameLookupDto }
	| { kind: typeof JOIN_LOOKUP.notFound }
	| { kind: typeof JOIN_LOOKUP.error }

// The state of the game code form: the code that is typed and what is known about the game it belongs to.
export function useJoinByCode() {
	const [code, setCode] = useState('')
	const query = useGameByCode(code)

	return { code, setCode, lookup: toLookup(query) }
}

function toLookup(query: ReturnType<typeof useGameByCode>): JoinLookup {
	if (query.data) {
		// A game that is not in the lobby cannot be joined: the server refuses with a 409.
		return query.data.status === GameStatus.Lobby
			? { kind: JOIN_LOOKUP.found, game: query.data }
			: { kind: JOIN_LOOKUP.started, game: query.data }
	}

	if (query.isError) {
		return query.error instanceof ApiError &&
			query.error.status === HTTP_STATUS.NOT_FOUND
			? { kind: JOIN_LOOKUP.notFound }
			: { kind: JOIN_LOOKUP.error }
	}

	return query.isFetching
		? { kind: JOIN_LOOKUP.loading }
		: { kind: JOIN_LOOKUP.idle }
}
