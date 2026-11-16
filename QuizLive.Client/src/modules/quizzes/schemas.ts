import { z } from 'zod'

import {
	QUIZ_FIELD_LIMITS,
	QUIZ_FORM_COPY,
	QuizKind
} from '@modules/quizzes/constants'

export const quizKindSchema = z.union([
	z.literal(QuizKind.OpenText),
	z.literal(QuizKind.PollChoice),
	z.literal(QuizKind.QuizChoice)
])

export const quizFormSchema = z.object({
	title: z
		.string()
		.trim()
		.min(1, QUIZ_FORM_COPY.validation.titleRequired)
		.max(QUIZ_FIELD_LIMITS.titleMax, QUIZ_FORM_COPY.validation.titleMax),
	description: z
		.string()
		.trim()
		.max(
			QUIZ_FIELD_LIMITS.descriptionMax,
			QUIZ_FORM_COPY.validation.descriptionMax
		),
	kind: quizKindSchema
})

export const quizDtoSchema = z.object({
	id: z.number(),
	title: z.string(),
	description: z.string().nullable(),
	kind: quizKindSchema,
	isArchived: z.boolean(),
	createdAtUtc: z.string(),
	questionCount: z.number()
})

export const quizDtoListSchema = z.array(quizDtoSchema)

// isCorrect is null in polls; options are null in open text questions.
export const optionDtoSchema = z.object({
	id: z.number(),
	order: z.number(),
	text: z.string(),
	isCorrect: z.boolean().nullable()
})

export const questionDtoSchema = z.object({
	id: z.number(),
	order: z.number(),
	text: z.string(),
	timeLimitSeconds: z.number().nullable(),
	basePoints: z.number().nullable(),
	imageUrl: z.string().nullable(),
	options: z.array(optionDtoSchema).nullable()
})

export const questionDtoListSchema = z.array(questionDtoSchema)

export const quizDetailsDtoSchema = quizDtoSchema
	.omit({ questionCount: true })
	.extend({ questions: questionDtoListSchema })
