import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { usePlayerTokenStore } from '@modules/game/store/playerTokenStore'
import { joinGame } from '@modules/join/api/joinApi'
import { useJoinGame } from '@modules/join/hooks/useJoinGame'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

vi.mock('@modules/join/api/joinApi', () => ({ joinGame: vi.fn() }))

const joinMock = vi.mocked(joinGame)

const joined = { gameId: 7, playerId: 1, nickname: 'Ann', token: 'a1b2c3' }

function wrapper({ children }: { children: ReactNode }) {
	return (
		<QueryClientProvider client={new QueryClient()}>
			{children}
		</QueryClientProvider>
	)
}

describe('useJoinGame', () => {
	beforeEach(() => {
		joinMock.mockReset()
		sessionStorage.clear()
		usePlayerTokenStore.setState({ playerToken: null })
	})

	it('joins the game of the code with the nickname', async () => {
		joinMock.mockResolvedValue(joined)
		const { result } = renderHook(() => useJoinGame('283646'), { wrapper })

		act(() => result.current.mutate({ nickname: 'Ann' }))

		await waitFor(() => expect(result.current.isSuccess).toBe(true))
		expect(joinMock).toHaveBeenCalledWith('283646', { nickname: 'Ann' })
		expect(result.current.data?.playerId).toBe(1)
	})

	it('saves the player token when the player has joined', async () => {
		joinMock.mockResolvedValue(joined)
		const { result } = renderHook(() => useJoinGame('283646'), { wrapper })

		act(() => result.current.mutate({ nickname: 'Ann' }))

		await waitFor(() => expect(result.current.isSuccess).toBe(true))
		expect(usePlayerTokenStore.getState().playerToken).toBe('a1b2c3')
	})

	it('replaces the token of an earlier game', async () => {
		usePlayerTokenStore.setState({ playerToken: 'old-token' })
		joinMock.mockResolvedValue(joined)
		const { result } = renderHook(() => useJoinGame('283646'), { wrapper })

		act(() => result.current.mutate({ nickname: 'Ann' }))

		await waitFor(() => expect(result.current.isSuccess).toBe(true))
		expect(usePlayerTokenStore.getState().playerToken).toBe('a1b2c3')
	})

	it.each([
		[HTTP_STATUS.CONFLICT, 'The nickname "Ann" is already taken in this game.'],
		[HTTP_STATUS.CONFLICT, 'The game has already started.'],
		[HTTP_STATUS.NOT_FOUND, 'Game with code 283646 was not found.']
	])(
		'gives the text of the server for the error %i and keeps the old token: %s',
		async (status, detail) => {
			usePlayerTokenStore.setState({ playerToken: 'old-token' })
			joinMock.mockRejectedValue(new ApiError(status, { status, detail }))
			const { result } = renderHook(() => useJoinGame('283646'), { wrapper })

			act(() => result.current.mutate({ nickname: 'Ann' }))

			await waitFor(() => expect(result.current.isError).toBe(true))
			expect(result.current.error).toMatchObject({ status, message: detail })
			expect(usePlayerTokenStore.getState().playerToken).toBe('old-token')
		}
	)

	it('does not try again after a failure: a join is not repeated by itself', async () => {
		joinMock.mockRejectedValue(new Error('Failed to fetch'))
		const { result } = renderHook(() => useJoinGame('283646'), { wrapper })

		act(() => result.current.mutate({ nickname: 'Ann' }))

		await waitFor(() => expect(result.current.isError).toBe(true))
		expect(joinMock).toHaveBeenCalledTimes(1)
	})

	it('joins the game of the code it has now', async () => {
		joinMock.mockResolvedValue(joined)
		const { result, rerender } = renderHook(({ code }) => useJoinGame(code), {
			wrapper,
			initialProps: { code: '111111' }
		})

		rerender({ code: '222222' })
		act(() => result.current.mutate({ nickname: 'Ann' }))

		await waitFor(() => expect(result.current.isSuccess).toBe(true))
		expect(joinMock).toHaveBeenCalledWith('222222', { nickname: 'Ann' })
	})
})
