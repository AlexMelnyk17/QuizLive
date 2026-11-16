import type { z } from 'zod'

import type {
	optionDtoSchema,
	questionDtoSchema,
	quizDetailsDtoSchema,
	quizDtoSchema,
	quizFormSchema,
	quizKindSchema
} from '@modules/quizzes/schemas'

export type QuizKindValue = z.infer<typeof quizKindSchema>

export type QuizFormValues = z.infer<typeof quizFormSchema>

export type QuizDto = z.infer<typeof quizDtoSchema>

export type QuizDetailsDto = z.infer<typeof quizDetailsDtoSchema>

export type QuestionDto = z.infer<typeof questionDtoSchema>

export type OptionDto = z.infer<typeof optionDtoSchema>

export type CreateQuizRequest = {
	title: string
	description: string | null
	kind: QuizKindValue
}

export type UpdateQuizRequest = {
	title: string
	description: string | null
}

// Which fields are allowed depends on the quiz kind; a field that is not allowed must be null.
export type QuestionRequest = {
	text: string
	timeLimitSeconds: number | null
	basePoints: number | null
	imageUrl: string | null
	options: OptionRequest[] | null
}

export type OptionRequest = {
	text: string
	isCorrect: boolean | null
}
