import { apiRequest } from '@api/client'

import { quizDtoListSchema } from '@modules/dashboard/schemas'
import type { QuizDto } from '@modules/dashboard/types'

export async function fetchMyQuizzes(archived = false): Promise<QuizDto[]> {
	const data = await apiRequest<QuizDto[]>(`/quizzes?archived=${archived}`)
	return quizDtoListSchema.parse(data)
}
