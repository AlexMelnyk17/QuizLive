import { describe, expect, it } from 'vitest'

import { ApiError, parseProblemResponse } from '@api/apiError'

describe('ApiError', () => {
	it('maps problem details and extensions', () => {
		const error = new ApiError(401, {
			title: 'Unauthorized',
			detail: 'Invalid user name or password.',
			remainingAttempts: 3,
		})
		expect(error.status).toBe(401)
		expect(error.detail).toBe('Invalid user name or password.')
		expect(error.remainingAttempts).toBe(3)
	})
})

describe('parseProblemResponse', () => {
	it('parses application/problem+json', async () => {
		const response = new Response(
			JSON.stringify({
				title: 'Validation failed',
				errors: { userName: ['Too short'] },
			}),
			{ headers: { 'content-type': 'application/problem+json' } }
		)
		const body = await parseProblemResponse(response)
		expect(body.errors?.userName).toEqual(['Too short'])
	})
})
