import { describe, expect, it } from 'vitest'

import { sanitizeRedirectPath } from '@shared/redirect'

describe('sanitizeRedirectPath', () => {
	it('returns fallback for missing or unsafe paths', () => {
		expect(sanitizeRedirectPath(undefined)).toBe('/dashboard')
		expect(sanitizeRedirectPath('//evil.com')).toBe('/dashboard')
		expect(sanitizeRedirectPath('https://evil.com')).toBe('/dashboard')
	})

	it('allows same-app paths', () => {
		expect(sanitizeRedirectPath('/dashboard')).toBe('/dashboard')
		expect(sanitizeRedirectPath('/login')).toBe('/login')
	})
})
