import {
	questionDtoListSchema,
	questionDtoSchema
} from '@modules/quizzes/schemas'
import type { QuestionDto, QuestionRequest } from '@modules/quizzes/types'

import { apiRequest } from '@api/client'

const questionsPath = (quizId: number) => `/quizzes/${quizId}/questions`

export async function createQuestion(
	quizId: number,
	request: QuestionRequest
): Promise<QuestionDto> {
	const data = await apiRequest<QuestionDto>(questionsPath(quizId), {
		method: 'POST',
		body: request
	})
	return questionDtoSchema.parse(data)
}

export async function updateQuestion(
	quizId: number,
	questionId: number,
	request: QuestionRequest
): Promise<QuestionDto> {
	const data = await apiRequest<QuestionDto>(
		`${questionsPath(quizId)}/${questionId}`,
		{ method: 'PUT', body: request }
	)
	return questionDtoSchema.parse(data)
}

export async function deleteQuestion(
	quizId: number,
	questionId: number
): Promise<void> {
	await apiRequest<void>(`${questionsPath(quizId)}/${questionId}`, {
		method: 'DELETE'
	})
}

// questionIds must list every question of the quiz exactly once, in the new order.
export async function reorderQuestions(
	quizId: number,
	questionIds: number[]
): Promise<QuestionDto[]> {
	const data = await apiRequest<QuestionDto[]>(
		`${questionsPath(quizId)}/order`,
		{ method: 'PUT', body: { questionIds } }
	)
	return questionDtoListSchema.parse(data)
}
