import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { PLAYER_TOKEN_STORAGE_KEY } from '@modules/game/constants'
import {
	usePlayerToken,
	usePlayerTokenStore
} from '@modules/game/store/playerTokenStore'

function storeInStorage(state: unknown) {
	sessionStorage.setItem(
		PLAYER_TOKEN_STORAGE_KEY,
		JSON.stringify({ state, version: 0 })
	)
}

describe('playerTokenStore', () => {
	beforeEach(() => {
		sessionStorage.clear()
		usePlayerTokenStore.setState({ playerToken: null })
	})

	it('has no token at first', () => {
		expect(usePlayerTokenStore.getState().playerToken).toBeNull()
	})

	it('keeps the token in sessionStorage', () => {
		usePlayerTokenStore.getState().setPlayerToken('token-1')

		expect(usePlayerTokenStore.getState().playerToken).toBe('token-1')
		expect(sessionStorage.getItem(PLAYER_TOKEN_STORAGE_KEY)).toContain(
			'token-1'
		)
	})

	it('replaces the token when the player joins another game', () => {
		usePlayerTokenStore.getState().setPlayerToken('token-1')
		usePlayerTokenStore.getState().setPlayerToken('token-2')

		expect(usePlayerTokenStore.getState().playerToken).toBe('token-2')
	})

	it('forgets the token', () => {
		usePlayerTokenStore.getState().setPlayerToken('token-1')
		usePlayerTokenStore.getState().clearPlayerToken()

		expect(usePlayerTokenStore.getState().playerToken).toBeNull()
		expect(sessionStorage.getItem(PLAYER_TOKEN_STORAGE_KEY)).not.toContain(
			'token-1'
		)
	})

	it('restores the token after a reload', async () => {
		storeInStorage({ playerToken: 'token-1' })

		await usePlayerTokenStore.persist.rehydrate()

		expect(usePlayerTokenStore.getState().playerToken).toBe('token-1')
	})

	it.each([
		['a token that is not text', { playerToken: 42 }],
		['an empty token', { playerToken: '' }],
		['no token field', {}]
	])('ignores damaged storage: %s', async (_name, state) => {
		storeInStorage(state)

		await usePlayerTokenStore.persist.rehydrate()

		expect(usePlayerTokenStore.getState().playerToken).toBeNull()
	})

	it('ignores storage that is not JSON', async () => {
		sessionStorage.setItem(PLAYER_TOKEN_STORAGE_KEY, '{not json')

		await usePlayerTokenStore.persist.rehydrate()

		expect(usePlayerTokenStore.getState().playerToken).toBeNull()
	})

	it('updates a component when the token changes', () => {
		const { result } = renderHook(() => usePlayerToken())

		expect(result.current).toBeNull()

		act(() => {
			usePlayerTokenStore.getState().setPlayerToken('token-1')
		})

		expect(result.current).toBe('token-1')
	})
})
