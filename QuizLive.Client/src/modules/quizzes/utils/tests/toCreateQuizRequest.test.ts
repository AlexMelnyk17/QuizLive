import { describe, expect, it } from 'vitest'

import { QuizKind } from '@modules/quizzes/constants'
import { toCreateQuizRequest } from '@modules/quizzes/utils/toCreateQuizRequest'

describe('toCreateQuizRequest', () => {
	it('keeps the title and kind and a filled description', () => {
		expect(
			toCreateQuizRequest({
				title: 'Math',
				description: 'About numbers',
				kind: QuizKind.QuizChoice
			})
		).toEqual({
			title: 'Math',
			description: 'About numbers',
			kind: QuizKind.QuizChoice
		})
	})

	it('sends an empty description as null', () => {
		expect(
			toCreateQuizRequest({
				title: 'Math',
				description: '',
				kind: QuizKind.OpenText
			}).description
		).toBeNull()
	})
})
