import { act, renderHook, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createGameHubConnection } from '@modules/game/api/createGameHubConnection'
import { GAME_CONNECTION_STATE, GAME_HUB_EVENTS } from '@modules/game/constants'
import { useGameHubConnection } from '@modules/game/hooks/useGameHubConnection'
import { FakeHubConnection } from '@modules/game/tests/fakeHubConnection'
import type { GameHubConnectionOptions } from '@modules/game/types'

vi.mock('@modules/game/api/createGameHubConnection', () => ({
	createGameHubConnection: vi.fn()
}))

let created: FakeHubConnection[]
// Lets a test prepare each connection before the hook starts it.
let prepare: (fake: FakeHubConnection) => void

function options(
	overrides: Partial<GameHubConnectionOptions> = {}
): GameHubConnectionOptions {
	return {
		enabled: true,
		handlers: {},
		join: vi.fn().mockResolvedValue(undefined),
		...overrides
	}
}

function strictMode({ children }: { children: ReactNode }) {
	return <StrictMode>{children}</StrictMode>
}

describe('useGameHubConnection', () => {
	beforeEach(() => {
		created = []
		prepare = () => {}
		vi.mocked(createGameHubConnection).mockImplementation(() => {
			const fake = new FakeHubConnection()

			prepare(fake)
			created.push(fake)

			return fake.asHubConnection()
		})
	})

	it('starts the connection and joins the game', async () => {
		const join = vi.fn().mockResolvedValue(undefined)
		const { result } = renderHook(() => useGameHubConnection(options({ join })))

		await waitFor(() =>
			expect(result.current.connectionState).toBe(
				GAME_CONNECTION_STATE.connected
			)
		)

		expect(created).toHaveLength(1)
		expect(created[0]?.startCalls).toBe(1)
		expect(join).toHaveBeenCalledOnce()
		expect(join).toHaveBeenCalledWith(created[0]?.asHubConnection())
		expect(result.current.connection).toBe(created[0]?.asHubConnection())
		expect(result.current.error).toBeNull()
	})

	it('is connecting until the connection has started', async () => {
		let gate: ReturnType<FakeHubConnection['holdStart']> | undefined
		prepare = fake => {
			gate = fake.holdStart()
		}

		const { result } = renderHook(() => useGameHubConnection(options()))

		expect(result.current.connectionState).toBe(
			GAME_CONNECTION_STATE.connecting
		)
		expect(result.current.connection).toBeNull()

		await act(() => {
			gate?.release()

			return Promise.resolve()
		})

		await waitFor(() =>
			expect(result.current.connectionState).toBe(
				GAME_CONNECTION_STATE.connected
			)
		)
	})

	it('listens to the events before the connection starts', () => {
		prepare = fake => {
			fake.holdStart()
		}

		renderHook(() => useGameHubConnection(options()))

		expect(created[0]?.startCalls).toBe(1)
		expect(created[0]?.handlerCount(GAME_HUB_EVENTS.questionShown)).toBe(1)
	})

	it('connects nothing while it is not enabled', () => {
		const { result } = renderHook(() =>
			useGameHubConnection(options({ enabled: false }))
		)

		expect(created).toHaveLength(0)
		expect(result.current.connectionState).toBe(
			GAME_CONNECTION_STATE.disconnected
		)
	})

	it('connects when it becomes enabled', async () => {
		const { result, rerender } = renderHook(
			({ enabled }) => useGameHubConnection(options({ enabled })),
			{ initialProps: { enabled: false } }
		)

		rerender({ enabled: true })

		await waitFor(() =>
			expect(result.current.connectionState).toBe(
				GAME_CONNECTION_STATE.connected
			)
		)
		expect(created).toHaveLength(1)
	})

	it('gives the events to the latest handlers without restarting the connection', async () => {
		const first = vi.fn()
		const second = vi.fn()
		const { result, rerender } = renderHook(
			({ onGameEnded }) =>
				useGameHubConnection(options({ handlers: { onGameEnded } })),
			{ initialProps: { onGameEnded: first } }
		)
		await waitFor(() =>
			expect(result.current.connectionState).toBe(
				GAME_CONNECTION_STATE.connected
			)
		)

		rerender({ onGameEnded: second })
		created[0]?.emit(GAME_HUB_EVENTS.gameEnded)

		expect(first).not.toHaveBeenCalled()
		expect(second).toHaveBeenCalledOnce()
		expect(created).toHaveLength(1)
	})

	it('passes the access token function to the connection', () => {
		const accessTokenFactory = () => 'jwt'

		renderHook(() => useGameHubConnection(options({ accessTokenFactory })))

		expect(createGameHubConnection).toHaveBeenCalledWith(accessTokenFactory)
	})

	describe('when the network drops', () => {
		it('shows that it is reconnecting', async () => {
			const { result } = renderHook(() => useGameHubConnection(options()))
			await waitFor(() =>
				expect(result.current.connectionState).toBe(
					GAME_CONNECTION_STATE.connected
				)
			)

			act(() => created[0]?.simulateReconnecting())

			expect(result.current.connectionState).toBe(
				GAME_CONNECTION_STATE.reconnecting
			)
		})

		it('joins the game again after the reconnect', async () => {
			const join = vi.fn().mockResolvedValue(undefined)
			const { result } = renderHook(() =>
				useGameHubConnection(options({ join }))
			)
			await waitFor(() =>
				expect(result.current.connectionState).toBe(
					GAME_CONNECTION_STATE.connected
				)
			)
			act(() => created[0]?.simulateReconnecting())

			act(() => created[0]?.simulateReconnected())

			await waitFor(() =>
				expect(result.current.connectionState).toBe(
					GAME_CONNECTION_STATE.connected
				)
			)
			expect(join).toHaveBeenCalledTimes(2)
			expect(created).toHaveLength(1)
		})

		it('is disconnected when the connection is closed for good', async () => {
			const { result } = renderHook(() => useGameHubConnection(options()))
			await waitFor(() =>
				expect(result.current.connectionState).toBe(
					GAME_CONNECTION_STATE.connected
				)
			)

			act(() => created[0]?.simulateClose())

			expect(result.current.connectionState).toBe(
				GAME_CONNECTION_STATE.disconnected
			)
		})
	})

	describe('when something fails', () => {
		it('fails with the generic text when the connection cannot start', async () => {
			prepare = fake => fake.failStartWith(new Error('Failed to fetch'))

			const { result } = renderHook(() => useGameHubConnection(options()))

			await waitFor(() =>
				expect(result.current.connectionState).toBe(
					GAME_CONNECTION_STATE.failed
				)
			)
			expect(result.current.error).toBe('Something went wrong. Try again.')
			expect(result.current.connection).toBeNull()
		})

		it('fails with the text of the server when the game cannot be joined', async () => {
			const join = vi
				.fn()
				.mockRejectedValue(
					new Error(
						"An unexpected error occurred invoking 'ConnectAsPlayer' on the server. HubException: Player was not found."
					)
				)

			const { result } = renderHook(() =>
				useGameHubConnection(options({ join }))
			)

			await waitFor(() =>
				expect(result.current.connectionState).toBe(
					GAME_CONNECTION_STATE.failed
				)
			)
			expect(result.current.error).toBe('Player was not found.')
		})

		it('clears the error when a later join works', async () => {
			const join = vi
				.fn()
				.mockRejectedValueOnce(new Error('HubException: Try again.'))
				.mockResolvedValue(undefined)
			const { result } = renderHook(() =>
				useGameHubConnection(options({ join }))
			)
			await waitFor(() =>
				expect(result.current.connectionState).toBe(
					GAME_CONNECTION_STATE.failed
				)
			)

			act(() => created[0]?.simulateReconnected())

			await waitFor(() =>
				expect(result.current.connectionState).toBe(
					GAME_CONNECTION_STATE.connected
				)
			)
			expect(result.current.error).toBeNull()
		})
	})

	describe('when the component goes away', () => {
		it('stops the connection and stops listening', async () => {
			const { result, unmount } = renderHook(() =>
				useGameHubConnection(options())
			)
			await waitFor(() =>
				expect(result.current.connectionState).toBe(
					GAME_CONNECTION_STATE.connected
				)
			)

			unmount()

			expect(created[0]?.stopCalls).toBe(1)
			expect(created[0]?.handlerCount(GAME_HUB_EVENTS.questionShown)).toBe(0)
		})

		it('does not join if it goes away while the connection is starting', async () => {
			const join = vi.fn().mockResolvedValue(undefined)
			let gate: ReturnType<FakeHubConnection['holdStart']> | undefined
			prepare = fake => {
				gate = fake.holdStart()
			}
			const { unmount } = renderHook(() =>
				useGameHubConnection(options({ join }))
			)

			unmount()
			await act(() => {
				gate?.release()

				return Promise.resolve()
			})

			expect(join).not.toHaveBeenCalled()
		})

		it('ignores a start that fails because the connection was stopped', async () => {
			let gate: ReturnType<FakeHubConnection['holdStart']> | undefined
			prepare = fake => {
				gate = fake.holdStart()
			}
			const { result, unmount } = renderHook(() =>
				useGameHubConnection(options())
			)

			unmount()
			await act(() => {
				gate?.reject(
					new Error('The connection was stopped during negotiation.')
				)

				return Promise.resolve()
			})

			expect(result.current.error).toBeNull()
		})
	})

	it('ends up with one working connection in Strict Mode, which mounts twice in development', async () => {
		const join = vi.fn().mockResolvedValue(undefined)

		const { result } = renderHook(
			() => useGameHubConnection(options({ join })),
			{
				wrapper: strictMode
			}
		)

		await waitFor(() =>
			expect(result.current.connectionState).toBe(
				GAME_CONNECTION_STATE.connected
			)
		)

		const stopped = created.filter(fake => fake.stopCalls > 0)
		const working = created.filter(fake => fake.stopCalls === 0)

		expect(working).toHaveLength(1)
		expect(stopped.length).toBe(created.length - 1)
		expect(result.current.connection).toBe(working[0]?.asHubConnection())
		expect(result.current.error).toBeNull()
	})
})
