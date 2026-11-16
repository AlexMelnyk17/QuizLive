import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
	createQuestion,
	deleteQuestion,
	reorderQuestions,
	updateQuestion
} from '@modules/quizzes/api/questionsApi'
import {
	createQuiz,
	deleteQuiz,
	fetchMyQuizzes,
	fetchQuiz,
	setQuizArchived,
	updateQuiz
} from '@modules/quizzes/api/quizzesApi'
import type { QuestionRequest } from '@modules/quizzes/types'

import { apiRequest } from '@api/client'

vi.mock('@api/client', () => ({ apiRequest: vi.fn() }))

const apiRequestMock = vi.mocked(apiRequest)

const quizFields = {
	id: 7,
	title: 'Math',
	description: null,
	kind: 2,
	isArchived: false,
	createdAtUtc: '2026-11-16T12:00:00Z'
}

const quiz = { ...quizFields, questionCount: 0 }

const question = {
	id: 3,
	order: 1,
	text: 'What did you like?',
	timeLimitSeconds: null,
	basePoints: null,
	imageUrl: null,
	options: null
}

const questionRequest: QuestionRequest = {
	text: 'What did you like?',
	timeLimitSeconds: null,
	basePoints: null,
	imageUrl: null,
	options: null
}

beforeEach(() => {
	apiRequestMock.mockReset()
})

describe('quizzesApi', () => {
	it('fetches active or archived quizzes', async () => {
		apiRequestMock.mockResolvedValue([quiz])

		await fetchMyQuizzes(true)

		expect(apiRequestMock).toHaveBeenCalledWith('/quizzes?archived=true')
	})

	it('fetches quiz details', async () => {
		apiRequestMock.mockResolvedValue({
			...quizFields,
			questions: [question],
			hasGames: false
		})

		const result = await fetchQuiz(7)

		expect(apiRequestMock).toHaveBeenCalledWith('/quizzes/7')
		expect(result.questions).toHaveLength(1)
	})

	it('creates and updates a quiz', async () => {
		apiRequestMock.mockResolvedValue(quiz)

		await createQuiz({ title: 'Math', description: null, kind: 2 })
		await updateQuiz(7, { title: 'Algebra', description: 'About' })

		expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/quizzes', {
			method: 'POST',
			body: { title: 'Math', description: null, kind: 2 }
		})
		expect(apiRequestMock).toHaveBeenNthCalledWith(2, '/quizzes/7', {
			method: 'PUT',
			body: { title: 'Algebra', description: 'About' }
		})
	})

	it.each([
		[true, '/quizzes/7/archive'],
		[false, '/quizzes/7/unarchive']
	])('sets archived=%s', async (archived, path) => {
		await setQuizArchived(7, archived)

		expect(apiRequestMock).toHaveBeenCalledWith(path, { method: 'POST' })
	})

	it('deletes a quiz', async () => {
		await deleteQuiz(7)

		expect(apiRequestMock).toHaveBeenCalledWith('/quizzes/7', {
			method: 'DELETE'
		})
	})

	it('rejects a response that does not match the schema', async () => {
		apiRequestMock.mockResolvedValue([{ ...quiz, kind: 3 }])

		await expect(fetchMyQuizzes(false)).rejects.toThrow()
	})
})

describe('questionsApi', () => {
	it('creates, updates and deletes a question', async () => {
		apiRequestMock.mockResolvedValue(question)

		await createQuestion(7, questionRequest)
		await updateQuestion(7, 3, questionRequest)
		await deleteQuestion(7, 3)

		expect(apiRequestMock).toHaveBeenNthCalledWith(1, '/quizzes/7/questions', {
			method: 'POST',
			body: questionRequest
		})
		expect(apiRequestMock).toHaveBeenNthCalledWith(
			2,
			'/quizzes/7/questions/3',
			{ method: 'PUT', body: questionRequest }
		)
		expect(apiRequestMock).toHaveBeenNthCalledWith(
			3,
			'/quizzes/7/questions/3',
			{ method: 'DELETE' }
		)
	})

	it('reorders questions', async () => {
		apiRequestMock.mockResolvedValue([question])

		await reorderQuestions(7, [3])

		expect(apiRequestMock).toHaveBeenCalledWith('/quizzes/7/questions/order', {
			method: 'PUT',
			body: { questionIds: [3] }
		})
	})
})
