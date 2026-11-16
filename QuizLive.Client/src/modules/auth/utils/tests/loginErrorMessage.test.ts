import { describe, expect, it } from 'vitest'

import { ApiError } from '@api/apiError'
import { getLoginRootErrorMessage } from '@modules/auth/utils/loginErrorMessage'

describe('getLoginRootErrorMessage', () => {
	it('returns a generic message for non-ApiError', () => {
		expect(getLoginRootErrorMessage(new Error('network'))).toBe(
			'Login failed. Please try again.'
		)
	})

	it('appends remaining attempts on 401', () => {
		const error = new ApiError(401, {
			detail: 'Invalid user name or password.',
			remainingAttempts: 2,
		})
		expect(getLoginRootErrorMessage(error)).toBe(
			'Invalid user name or password. Remaining attempts: 2.'
		)
	})

	it('uses server detail on other ApiError statuses', () => {
		const error = new ApiError(500, { detail: 'Server busy.' })
		expect(getLoginRootErrorMessage(error)).toBe('Server busy.')
	})
})
