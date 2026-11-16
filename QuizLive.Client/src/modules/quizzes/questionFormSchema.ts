import { z } from 'zod'

import {
	QUESTION_FORM_COPY as COPY,
	QUESTION_LIMITS as LIMITS,
	QuizKind
} from '@modules/quizzes/constants'
import type { QuizKindValue } from '@modules/quizzes/types'

const optionalNumber = (min: number, max: number) =>
	z
		.string()
		.refine(
			value =>
				value === '' ||
				(Number.isInteger(Number(value)) &&
					Number(value) >= min &&
					Number(value) <= max),
			`Enter a whole number from ${min} to ${max}.`
		)

export const questionFormSchema = (kind: QuizKindValue) =>
	z
		.object({
			text: z
				.string()
				.trim()
				.min(1, COPY.required)
				.max(LIMITS.text, COPY.tooLong),
			timeLimitSeconds: optionalNumber(LIMITS.minTime, LIMITS.maxTime),
			basePoints: optionalNumber(0, LIMITS.maxPoints),
			imageUrl: z
				.string()
				.trim()
				.max(LIMITS.imageUrl, COPY.tooLong)
				.refine(value => {
					if (!value) return true
					try {
						const url = new URL(value)
						return url.protocol === 'http:' || url.protocol === 'https:'
					} catch {
						return false
					}
				}, COPY.invalidUrl),
			options: z
				.array(
					z.object({
						text: z
							.string()
							.trim()
							.min(1, COPY.optionRequired)
							.max(LIMITS.option, COPY.tooLong)
					})
				)
				.max(LIMITS.maxOptions),
			correctIndex: z.string()
		})
		.superRefine((values, context) => {
			if (
				kind !== QuizKind.OpenText &&
				values.options.length < LIMITS.minOptions
			)
				context.addIssue({
					code: 'custom',
					path: ['options'],
					message: `Add at least ${LIMITS.minOptions} options.`
				})
			if (
				kind === QuizKind.QuizChoice &&
				(values.correctIndex === '' ||
					!values.options[Number(values.correctIndex)])
			)
				context.addIssue({
					code: 'custom',
					path: ['correctIndex'],
					message: COPY.correctRequired
				})
		})

export type QuestionFormValues = z.infer<ReturnType<typeof questionFormSchema>>
