import { describe, expect, it } from 'vitest'

import { formatQuestionCount, parseUtcDate } from '@modules/quizzes/utils'

describe('parseUtcDate', () => {
	it('reads a date without an offset as UTC', () => {
		expect(parseUtcDate('2026-11-16T23:30:00.1234567').toISOString()).toBe(
			'2026-11-16T23:30:00.123Z'
		)
	})

	it.each(['2026-11-16T23:30:00Z', '2026-11-17T01:30:00+02:00'])(
		'keeps the offset of "%s"',
		value => {
			expect(parseUtcDate(value).toISOString()).toBe('2026-11-16T23:30:00.000Z')
		}
	)
})

describe('formatQuestionCount', () => {
	it.each([
		[0, '0 questions'],
		[1, '1 question'],
		[3, '3 questions']
	])('formats %i', (count, text) => {
		expect(formatQuestionCount(count)).toBe(text)
	})
})
