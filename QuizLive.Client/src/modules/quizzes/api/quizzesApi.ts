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
	const data = await apiRequest<QuizDto[]>(`/quizzes?archived=${archived}`)
	return quizDtoListSchema.parse(data)
}

export async function fetchQuiz(quizId: number): Promise<QuizDetailsDto> {
	const data = await apiRequest<QuizDetailsDto>(`/quizzes/${quizId}`)
	return quizDetailsDtoSchema.parse(data)
}

export async function createQuiz(request: CreateQuizRequest): Promise<QuizDto> {
	const data = await apiRequest<QuizDto>('/quizzes', {
		method: 'POST',
		body: request
	})
	return quizDtoSchema.parse(data)
}

export async function updateQuiz(
	quizId: number,
	request: UpdateQuizRequest
): Promise<QuizDto> {
	const data = await apiRequest<QuizDto>(`/quizzes/${quizId}`, {
		method: 'PUT',
		body: request
	})
	return quizDtoSchema.parse(data)
}

export async function setQuizArchived(
	quizId: number,
	archived: boolean
): Promise<void> {
	await apiRequest<void>(
		`/quizzes/${quizId}/${archived ? 'archive' : 'unarchive'}`,
		{ method: 'POST' }
	)
}

export async function deleteQuiz(quizId: number): Promise<void> {
	await apiRequest<void>(`/quizzes/${quizId}`, { method: 'DELETE' })
}
