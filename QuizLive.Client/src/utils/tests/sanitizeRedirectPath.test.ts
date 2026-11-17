import { describe, expect, it } from 'vitest'

import { PATHS } from '@config/routes'

import { sanitizeRedirectPath } from '@utils/sanitizeRedirectPath'

describe('sanitizeRedirectPath', () => {
	it('returns fallback for missing or unsafe paths', () => {
		expect(sanitizeRedirectPath(undefined)).toBe(PATHS.dashboard)
		expect(sanitizeRedirectPath('//evil.com')).toBe(PATHS.dashboard)
		expect(sanitizeRedirectPath('https://evil.com')).toBe(PATHS.dashboard)
	})

	it('allows same-app paths', () => {
		expect(sanitizeRedirectPath(PATHS.dashboard)).toBe(PATHS.dashboard)
		expect(sanitizeRedirectPath(PATHS.login)).toBe(PATHS.login)
	})
})
