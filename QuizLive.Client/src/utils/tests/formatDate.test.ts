import { describe, expect, it } from 'vitest'

import { formatDate } from '@utils/formatDate'

describe('formatDate', () => {
	it('formats yyyy-MM-dd in UTC with a short month and day', () => {
		expect(formatDate('2026-11-15')).toBe(
			new Date('2026-11-15T00:00:00Z').toLocaleDateString(undefined, {
				month: 'short',
				day: 'numeric',
				timeZone: 'UTC',
			})
		)
	})
})