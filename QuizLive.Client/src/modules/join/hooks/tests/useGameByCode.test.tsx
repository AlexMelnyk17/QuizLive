import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GameStatus } from '@modules/game/constants'
import { fetchGameByCode } from '@modules/join/api/joinApi'
import { useGameByCode } from '@modules/join/hooks/useGameByCode'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

vi.mock('@modules/join/api/joinApi', () => ({ fetchGameByCode: vi.fn() }))

const fetchMock = vi.mocked(fetchGameByCode)

const lookup = {
	code: '283646',
	quizTitle: 'STEM basics',
	status: GameStatus.Lobby
}

function wrapper({ children }: { children: ReactNode }) {
	// No pause between retries, so a test that expects a retry does not wait for it.
	const client = new QueryClient({
		defaultOptions: { queries: { retryDelay: 0 } }
	})

	return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useGameByCode', () => {
	beforeEach(() => {
		fetchMock.mockReset()
	})

	it.each(['', '1', '28364'])(
		'does not ask the server while the code is incomplete: "%s"',
		code => {
			const { result } = renderHook(() => useGameByCode(code), { wrapper })

			expect(fetchMock).not.toHaveBeenCalled()
			expect(result.current.fetchStatus).toBe('idle')
		}
	)

	it('finds the game when the code is complete', async () => {
		fetchMock.mockResolvedValue(lookup)

		const { result } = renderHook(() => useGameByCode('283646'), { wrapper })

		await waitFor(() => expect(result.current.isSuccess).toBe(true))
		expect(fetchMock).toHaveBeenCalledWith('283646')
		expect(result.current.data?.quizTitle).toBe('STEM basics')
	})

	it('asks again when the code changes', async () => {
		fetchMock.mockResolvedValue(lookup)
		const { result, rerender } = renderHook(({ code }) => useGameByCode(code), {
			wrapper,
			initialProps: { code: '111111' }
		})
		await waitFor(() => expect(result.current.isSuccess).toBe(true))

		rerender({ code: '222222' })

		await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('222222'))
		expect(fetchMock).toHaveBeenCalledTimes(2)
	})

	it('shows an unknown code at once, without a retry', async () => {
		fetchMock.mockRejectedValue(
			new ApiError(HTTP_STATUS.NOT_FOUND, {
				status: HTTP_STATUS.NOT_FOUND,
				detail: 'Game with code 111111 was not found.'
			})
		)

		const { result } = renderHook(() => useGameByCode('111111'), { wrapper })

		await waitFor(() => expect(result.current.isError).toBe(true))
		expect(fetchMock).toHaveBeenCalledTimes(1)
		expect(result.current.error).toMatchObject({
			status: HTTP_STATUS.NOT_FOUND
		})
	})

	it('tries once more after another failure, such as a lost connection', async () => {
		fetchMock.mockRejectedValue(new Error('Failed to fetch'))

		const { result } = renderHook(() => useGameByCode('283646'), { wrapper })

		await waitFor(() => expect(result.current.isError).toBe(true))
		expect(fetchMock).toHaveBeenCalledTimes(2)
	})
})
