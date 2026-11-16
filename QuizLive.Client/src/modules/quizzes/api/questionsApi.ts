import {
	questionDtoListSchema,
	questionDtoSchema
} from '@modules/quizzes/schemas'
import type { QuestionDto, QuestionRequest } from '@modules/quizzes/types'
import { QUIZZES_API } from '@modules/quizzes/constants'

import { apiRequest } from '@api/client'

export async function createQuestion(
	quizId: number,
	request: QuestionRequest
): Promise<QuestionDto> {
	const data = await apiRequest<QuestionDto>(QUIZZES_API.questions(quizId), {
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
		QUIZZES_API.questionById(quizId, questionId),
		{ method: 'PUT', body: request }
	)
	return questionDtoSchema.parse(data)
}

export async function deleteQuestion(
	quizId: number,
	questionId: number
): Promise<void> {
	await apiRequest<void>(QUIZZES_API.questionById(quizId, questionId), {
		method: 'DELETE'
	})
}

export async function reorderQuestions(
	quizId: number,
	questionIds: number[]
): Promise<QuestionDto[]> {
	const data = await apiRequest<QuestionDto[]>(QUIZZES_API.reorder(quizId), {
		method: 'PUT',
		body: { questionIds }
	})
	return questionDtoListSchema.parse(data)
}