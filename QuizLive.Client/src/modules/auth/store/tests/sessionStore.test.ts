import { beforeEach, describe, expect, it } from 'vitest'

import { SESSION_STORAGE_KEY } from '@modules/auth/constants'
import { authResponseSchema } from '@modules/auth/schemas'
import {
	readSession,
	signOut,
	useAuthStore,
} from '@modules/auth/store/sessionStore'

const validAuth = {
	token: 'jwt-token',
	expiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
	user: { id: '1', userName: 'quizzer' },
}

describe('sessionStore', () => {
	beforeEach(() => {
		sessionStorage.clear()
		signOut()
	})

	it('stores session from auth response', () => {
		useAuthStore.getState().setSessionFromAuthResponse(validAuth)
		expect(readSession()?.user.userName).toBe('quizzer')
		expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeTruthy()
	})

	it('clears expired session on read', () => {
		useAuthStore.getState().setSessionFromAuthResponse({
			...validAuth,
			expiresAtUtc: new Date(Date.now() - 1_000).toISOString(),
		})
		expect(readSession()).toBeNull()
	})

	it('validates auth response shape', () => {
		expect(() =>
			authResponseSchema.parse({ token: 'x', expiresAtUtc: 'y', user: {} })
		).toThrow()
	})
})
