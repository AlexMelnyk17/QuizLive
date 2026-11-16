import { describe, expect, it } from 'vitest'

import { authResponseSchema, userDtoSchema } from '@modules/auth/schemas'

describe('auth API schemas', () => {
	it('parses login/register response', () => {
		const parsed = authResponseSchema.parse({
			token: 'jwt',
			expiresAtUtc: '2026-10-23T19:24:56.957Z',
			user: { id: '1', userName: 'artemk' },
		})
		expect(parsed.user.userName).toBe('artemk')
	})

	it('parses GET /api/auth/me response', () => {
		const parsed = userDtoSchema.parse({
			id: '1',
			userName: 'artemk',
		})
		expect(parsed.id).toBe('1')
	})
})
