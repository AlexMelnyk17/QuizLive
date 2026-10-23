import { z } from 'zod'

import { QuizKind } from '@modules/dashboard/types'

export const quizKindSchema = z.union([
	z.literal(QuizKind.OpenText),
	z.literal(QuizKind.PollChoice),
	z.literal(QuizKind.QuizChoice),
])

export const quizDtoSchema = z.object({
	id: z.number(),
	title: z.string(),
	description: z.string().nullable(),
	kind: quizKindSchema,
	isArchived: z.boolean(),
	createdAtUtc: z.string(),
	questionCount: z.number(),
})

export const quizDtoListSchema = z.array(quizDtoSchema)
