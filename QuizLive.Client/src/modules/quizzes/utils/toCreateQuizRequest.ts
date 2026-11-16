import type { CreateQuizRequest, QuizFormValues } from '@modules/quizzes/types'

// The form keeps an empty description as '', the API expects null.
export function toCreateQuizRequest(values: QuizFormValues): CreateQuizRequest {
	return {
		title: values.title,
		description: values.description === '' ? null : values.description,
		kind: values.kind
	}
}
