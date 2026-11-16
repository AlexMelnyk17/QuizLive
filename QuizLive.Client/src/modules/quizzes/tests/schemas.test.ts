import { describe, expect, it } from 'vitest'

import {
	quizDetailsDtoSchema,
	quizDtoListSchema
} from '@modules/quizzes/schemas'

const quizFields = {
	id: 1,
	title: 'Math',
	description: null,
	kind: 2,
	isArchived: false,
	createdAtUtc: '2026-11-16T12:00:00Z'
}

const quiz = { ...quizFields, questionCount: 1 }

describe('quiz API schemas', () => {
	it('parses GET /api/quizzes response', () => {
		const parsed = quizDtoListSchema.parse([quiz])

		expect(parsed[0]?.questionCount).toBe(1)
	})

	it('rejects an unknown quiz kind', () => {
		expect(() => quizDtoListSchema.parse([{ ...quiz, kind: 3 }])).toThrow()
	})

	it('parses quiz details with questions of every kind', () => {
		const parsed = quizDetailsDtoSchema.parse({
			...quizFields,
			questions: [
				{
					id: 1,
					order: 1,
					text: 'What did you like?',
					timeLimitSeconds: null,
					basePoints: null,
					imageUrl: null,
					options: null
				},
				{
					id: 2,
					order: 2,
					text: 'Tea or coffee?',
					timeLimitSeconds: 30,
					basePoints: null,
					imageUrl: null,
					options: [
						{ id: 1, order: 1, text: 'Tea', isCorrect: null },
						{ id: 2, order: 2, text: 'Coffee', isCorrect: null }
					]
				},
				{
					id: 3,
					order: 3,
					text: 'What is 2 + 2?',
					timeLimitSeconds: 20,
					basePoints: 1000,
					imageUrl: 'https://example.com/image.png',
					options: [
						{ id: 3, order: 1, text: '4', isCorrect: true },
						{ id: 4, order: 2, text: '5', isCorrect: false }
					]
				}
			]
		})

		expect(parsed.questions.map(q => q.order)).toEqual([1, 2, 3])
		expect(parsed.questions[2]?.options?.[0]?.isCorrect).toBe(true)
	})
})
