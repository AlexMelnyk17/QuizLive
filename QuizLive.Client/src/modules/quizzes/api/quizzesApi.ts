import { QUIZZES_API } from '@modules/quizzes/constants'
import {
	quizDetailsDtoSchema,
	quizDtoListSchema,
	quizDtoSchema
} from '@modules/quizzes/schemas'
import type {
	CreateQuizRequest,
	QuizDetailsDto,
	QuizDto,
	UpdateQuizRequest
} from '@modules/quizzes/types'

import { apiRequest } from '@api/client'

export async function fetchMyQuizzes(archived: boolean): Promise<QuizDto[]> {
	const data = await apiRequest<QuizDto[]>(QUIZZES_API.list(archived))
	return quizDtoListSchema.parse(data)
}

export async function fetchQuiz(quizId: number): Promise<QuizDetailsDto> {
	const data = await apiRequest<QuizDetailsDto>(QUIZZES_API.byId(quizId))
	return quizDetailsDtoSchema.parse(data)
}

export async function createQuiz(request: CreateQuizRequest): Promise<QuizDto> {
	const data = await apiRequest<QuizDto>(QUIZZES_API.create, {
		method: 'POST',
		body: request
	})
	return quizDtoSchema.parse(data)
}

export async function updateQuiz(
	quizId: number,
	request: UpdateQuizRequest
): Promise<QuizDto> {
	const data = await apiRequest<QuizDto>(QUIZZES_API.byId(quizId), {
		method: 'PUT',
		body: request
	})
	return quizDtoSchema.parse(data)
}

export async function setQuizArchived(
	quizId: number,
	archived: boolean
): Promise<void> {
	const action = archived
		? QUIZZES_API.archiveAction
		: QUIZZES_API.unarchiveAction
	await apiRequest<void>(`${QUIZZES_API.byId(quizId)}/${action}`, {
		method: 'POST'
	})
}

export async function deleteQuiz(quizId: number): Promise<void> {
	await apiRequest<void>(QUIZZES_API.byId(quizId), { method: 'DELETE' })
}
