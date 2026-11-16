import { describe, expect, it } from 'vitest'

import { ApiError } from '@api/apiError'
import { getFieldErrors } from '@api/getFieldErrors'
import { toFieldPath } from '@api/toFieldPath'

describe('toFieldPath', () => {
	it.each([
		['Title', 'title'],
		['TimeLimitSeconds', 'timeLimitSeconds'],
		['basePoints', 'basePoints'],
		['Options[1].Text', 'options.1.text'],
		['options[1].isCorrect', 'options.1.isCorrect'],
		['options', 'options']
	])('maps "%s" to "%s"', (key, path) => {
		expect(toFieldPath(key)).toBe(path)
	})
})

describe('getFieldErrors', () => {
	it('returns the first message of each field by form path', () => {
		const error = new ApiError(400, {
			errors: {
				Title: ['The Title field is required.', 'Second message'],
				'options[0].isCorrect': ['Specify whether the option is correct.']
			}
		})

		expect(getFieldErrors(error)).toEqual({
			title: 'The Title field is required.',
			'options.0.isCorrect': 'Specify whether the option is correct.'
		})
	})

	it('keeps the first message when two keys map to the same field', () => {
		const error = new ApiError(400, {
			errors: { Options: ['Too many options.'], options: ['Too few options.'] }
		})

		expect(getFieldErrors(error)).toEqual({ options: 'Too many options.' })
	})

	it('returns an empty object without field errors', () => {
		expect(getFieldErrors(new ApiError(409, { detail: 'Conflict' }))).toEqual(
			{}
		)
	})
})
