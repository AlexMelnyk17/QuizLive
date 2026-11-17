import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createGame } from '@modules/game/api/gamesApi'
import { GameStatus } from '@modules/game/constants'
import { useCreateGame } from '@modules/game/hooks/useCreateGame'
import { QUIZZES_QUERY_KEY } from '@modules/quizzes/constants'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

vi.mock('@modules/game/api/gamesApi', () => ({ createGame: vi.fn() }))

const createGameMock = vi.mocked(createGame)

const created = {
	id: 7,
	code: '283646',
	quizId: 3,
	quizTitle: 'STEM basics',
	quizKind: 0,
	status: GameStatus.Lobby,
	createdAtUtc: '2026-11-17T10:00:00Z',
	endedAtUtc: null,
	players: []
} as const

describe('useCreateGame', () => {
	let client: QueryClient

	function wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={client}>{children}</QueryClientProvider>
	}

	beforeEach(() => {
		createGameMock.mockReset()
		client = new QueryClient()
	})

	it('creates a game for the quiz and gives its id and code', async () => {
		createGameMock.mockResolvedValue({ ...created, players: [] })
		const { result } = renderHook(() => useCreateGame(), { wrapper })

		act(() => result.current.mutate(3))

		await waitFor(() => expect(result.current.isSuccess).toBe(true))
		expect(createGameMock).toHaveBeenCalledWith(3)
		expect(result.current.data).toMatchObject({ id: 7, code: '283646' })
	})

	it('refreshes the cached quizzes, because the quiz now has an active game', async () => {
		createGameMock.mockResolvedValue({ ...created, players: [] })
		client.setQueryData([...QUIZZES_QUERY_KEY, 'details', 3], { id: 3 })
		const { result } = renderHook(() => useCreateGame(), { wrapper })

		act(() => result.current.mutate(3))

		await waitFor(() => expect(result.current.isSuccess).toBe(true))
		expect(
			client.getQueryState([...QUIZZES_QUERY_KEY, 'details', 3])?.isInvalidated
		).toBe(true)
	})

	it('gives the text of the server when the quiz cannot be played, and refreshes nothing', async () => {
		createGameMock.mockRejectedValue(
			new ApiError(HTTP_STATUS.CONFLICT, {
				status: HTTP_STATUS.CONFLICT,
				detail: 'The quiz has no questions.'
			})
		)
		client.setQueryData([...QUIZZES_QUERY_KEY, 'details', 3], { id: 3 })
		const { result } = renderHook(() => useCreateGame(), { wrapper })

		act(() => result.current.mutate(3))

		await waitFor(() => expect(result.current.isError).toBe(true))
		expect(result.current.error).toMatchObject({
			status: HTTP_STATUS.CONFLICT,
			message: 'The quiz has no questions.'
		})
		expect(
			client.getQueryState([...QUIZZES_QUERY_KEY, 'details', 3])?.isInvalidated
		).toBe(false)
	})

	it('does not try again after a failure: creating a game is not repeated by itself', async () => {
		createGameMock.mockRejectedValue(new Error('Failed to fetch'))
		const { result } = renderHook(() => useCreateGame(), { wrapper })

		act(() => result.current.mutate(3))

		await waitFor(() => expect(result.current.isError).toBe(true))
		expect(createGameMock).toHaveBeenCalledTimes(1)
	})
})
