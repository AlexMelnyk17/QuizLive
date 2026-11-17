import { useQuery } from '@tanstack/react-query'

import { fetchGameByCode } from '@modules/join/api/joinApi'
import {
	JOIN_GAME_CODE_LENGTH,
	gameByCodeQueryKey
} from '@modules/join/constants'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

// Finds the game a code belongs to. Nothing is requested until the code is complete, so typing a code
// digit by digit does not send a request for every digit.
export function useGameByCode(code: string) {
	return useQuery({
		queryKey: gameByCodeQueryKey(code),
		queryFn: () => fetchGameByCode(code),
		enabled: code.length === JOIN_GAME_CODE_LENGTH,
		// A code that belongs to no active game stays unknown, so the 404 is shown right away.
		retry: (failureCount, error) =>
			!(error instanceof ApiError && error.status === HTTP_STATUS.NOT_FOUND) &&
			failureCount < 1
	})
}
