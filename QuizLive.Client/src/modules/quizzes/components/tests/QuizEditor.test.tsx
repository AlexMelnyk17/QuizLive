import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	createQuestion,
	deleteQuestion,
	updateQuestion
} from '@modules/quizzes/api/questionsApi'
import {
	fetchQuiz,
	setQuizArchived,
	updateQuiz
} from '@modules/quizzes/api/quizzesApi'
import { QuizEditor } from '@modules/quizzes/components/QuizEditor'
import {
	QUESTION_FORM_COPY,
	QUIZ_DETAILS_COPY,
	QUIZ_FORM_COPY,
	QuizKind
} from '@modules/quizzes/constants'
import type { QuizDetailsDto } from '@modules/quizzes/types'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

import { renderWithTheme } from '@src/test/testUtils'

vi.mock('@modules/quizzes/api/quizzesApi', () => ({
	fetchQuiz: vi.fn(),
	updateQuiz: vi.fn(),
	setQuizArchived: vi.fn()
}))

const quiz: QuizDetailsDto = {
	hasGames: false,
	id: 7,
	title: 'Math',
	description: null,
	kind: QuizKind.OpenText,
	isArchived: false,
	createdAtUtc: '2026-11-16T12:00:00',
	questions: []
}
vi.mock('@modules/quizzes/api/questionsApi', () => ({
	createQuestion: vi.fn(),
	updateQuestion: vi.fn(),
	deleteQuestion: vi.fn()
}))
const onSaved = vi.fn()

function renderEditor() {
	return renderWithTheme(
		<QueryClientProvider
			client={
				new QueryClient({
					defaultOptions: {
						queries: { retry: false },
						mutations: { retry: false }
					}
				})
			}
		>
			<QuizEditor
				quizId={7}
				onSaved={onSaved}
				onCancel={vi.fn()}
				onBack={vi.fn()}
			/>
		</QueryClientProvider>
	)
}

describe('QuizEditor', () => {
	it('edits an existing question then deletes it with confirmation', async () => {
		const question = {
			id: 11,
			order: 1,
			text: 'Old question',
			timeLimitSeconds: null,
			basePoints: null,
			imageUrl: null,
			options: null
		}
		vi.mocked(fetchQuiz).mockResolvedValue({ ...quiz, questions: [question] })
		vi.mocked(updateQuestion).mockImplementation(
			(_quizId, _questionId, request) => {
				const updated = { ...question, ...request, options: null }
				vi.mocked(fetchQuiz).mockResolvedValue({
					...quiz,
					questions: [updated]
				})
				return Promise.resolve(updated)
			}
		)
		vi.mocked(deleteQuestion).mockImplementation(() => {
			vi.mocked(fetchQuiz).mockResolvedValue(quiz)
			return Promise.resolve()
		})
		const user = userEvent.setup()
		renderEditor()
		await user.click(
			await screen.findByRole('button', { name: QUESTION_FORM_COPY.edit })
		)
		const input = screen.getByLabelText(QUESTION_FORM_COPY.text)
		expect(screen.getByLabelText(QUIZ_FORM_COPY.fields.title)).toBeDisabled()
		expect(
			screen.getByLabelText(QUIZ_FORM_COPY.fields.description)
		).toBeDisabled()
		expect(
			screen.getByRole('button', { name: QUIZ_FORM_COPY.submitEdit })
		).toBeDisabled()
		expect(input).toHaveValue(question.text)
		await user.clear(input)
		await user.type(input, 'Updated question')
		await user.click(
			screen.getByRole('button', { name: QUESTION_FORM_COPY.saveEdit })
		)
		expect(await screen.findByText('Updated question')).toBeInTheDocument()
		expect(screen.getByLabelText(QUIZ_FORM_COPY.fields.title)).toBeEnabled()
		await user.click(
			screen.getByRole('button', { name: QUESTION_FORM_COPY.delete })
		)
		expect(deleteQuestion).not.toHaveBeenCalled()
		const buttons = screen.getAllByRole('button', {
			name: QUESTION_FORM_COPY.delete
		})
		await user.click(buttons[buttons.length - 1])
		expect(
			await screen.findByText(QUIZ_DETAILS_COPY.noQuestions)
		).toBeInTheDocument()
		expect(deleteQuestion).toHaveBeenCalledWith(7, 11)
	})
	it('adds a question and displays it after refreshing the quiz', async () => {
		const question = {
			id: 11,
			order: 2,
			text: 'What is two plus two?',
			timeLimitSeconds: null,
			basePoints: null,
			imageUrl: null,
			options: null
		}
		const existing = {
			...question,
			id: 10,
			order: 1,
			text: 'Existing question'
		}
		vi.mocked(fetchQuiz).mockResolvedValue({ ...quiz, questions: [existing] })
		vi.mocked(createQuestion).mockImplementation(() => {
			vi.mocked(fetchQuiz).mockResolvedValue({
				...quiz,
				questions: [existing, question]
			})
			return Promise.resolve(question)
		})
		const user = userEvent.setup()
		renderEditor()
		await user.click(
			await screen.findByRole('button', {
				name: QUIZ_DETAILS_COPY.addQuestions
			})
		)
		expect(screen.getByLabelText(QUIZ_FORM_COPY.fields.title)).toBeDisabled()
		expect(
			screen.getByRole('button', { name: QUIZ_FORM_COPY.submitEdit })
		).toBeDisabled()
		expect(
			screen
				.getByLabelText(QUESTION_FORM_COPY.text)
				.compareDocumentPosition(screen.getByText(existing.text)) &
				Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy()
		await user.type(
			screen.getByLabelText(QUESTION_FORM_COPY.text),
			question.text
		)
		await user.click(
			screen.getByRole('button', { name: QUESTION_FORM_COPY.save })
		)
		expect(await screen.findByText(question.text)).toBeInTheDocument()
		expect(
			screen
				.getByText(existing.text)
				.compareDocumentPosition(screen.getByText(question.text)) &
				Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy()
		expect(screen.getByLabelText(QUIZ_FORM_COPY.fields.title)).toBeEnabled()
		expect(
			screen.queryByLabelText(QUESTION_FORM_COPY.text)
		).not.toBeInTheDocument()
		expect(onSaved).not.toHaveBeenCalled()
	})
	beforeEach(() => {
		vi.resetAllMocks()
		vi.mocked(fetchQuiz).mockResolvedValue(quiz)
	})
	afterEach(cleanup)

	it('shows loading skeletons while the quiz loads', () => {
		vi.mocked(fetchQuiz).mockReturnValue(new Promise(() => {}))
		const { container } = renderEditor()
		expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
	})

	it('edits an empty quiz with a fixed kind and saves the new title', async () => {
		vi.mocked(updateQuiz).mockResolvedValue({
			...quiz,
			title: 'Geometry',
			questionCount: 0
		})
		const user = userEvent.setup()
		renderEditor()
		const title = await screen.findByLabelText(QUIZ_FORM_COPY.fields.title)
		expect(title).toHaveValue('Math')
		expect(screen.queryByRole('radio')).not.toBeInTheDocument()
		await user.clear(title)
		await user.type(title, 'Geometry')
		await user.click(
			screen.getByRole('button', { name: QUIZ_FORM_COPY.submitEdit })
		)
		await vi.waitFor(() => expect(onSaved).toHaveBeenCalled())
		expect(updateQuiz).toHaveBeenCalledWith(7, {
			title: 'Geometry',
			description: null
		})
	})

	it('keeps input and shows the server conflict message', async () => {
		vi.mocked(updateQuiz).mockRejectedValue(
			new ApiError(HTTP_STATUS.CONFLICT, {
				detail: 'An active game prevents editing.'
			})
		)
		const user = userEvent.setup()
		renderEditor()
		await user.type(
			await screen.findByLabelText(QUIZ_FORM_COPY.fields.title),
			' updated'
		)
		await user.click(
			screen.getByRole('button', { name: QUIZ_FORM_COPY.submitEdit })
		)
		expect(
			await screen.findByText('An active game prevents editing.')
		).toBeInTheDocument()
		expect(screen.getByLabelText(QUIZ_FORM_COPY.fields.title)).toHaveValue(
			'Math updated'
		)
		expect(onSaved).not.toHaveBeenCalled()
	})

	it('shows not found for a missing quiz', async () => {
		vi.mocked(fetchQuiz).mockRejectedValue(
			new ApiError(HTTP_STATUS.NOT_FOUND, {})
		)
		renderEditor()
		expect(
			await screen.findByText(QUIZ_DETAILS_COPY.notFound.title)
		).toBeInTheDocument()
	})

	it('retries a failed load', async () => {
		vi.mocked(fetchQuiz).mockRejectedValue(
			new ApiError(HTTP_STATUS.NOT_FOUND, {})
		)
		// Non-404 failures offer a retry after the query retry is exhausted.
		vi.mocked(fetchQuiz).mockRejectedValue(new Error('Offline'))
		const user = userEvent.setup()
		renderEditor()
		await screen.findByText(
			QUIZ_DETAILS_COPY.loadError.title,
			{},
			{ timeout: 4000 }
		)
		vi.mocked(fetchQuiz).mockResolvedValue(quiz)
		await user.click(
			screen.getByRole('button', { name: QUIZ_DETAILS_COPY.loadError.retry })
		)
		expect(
			await screen.findByLabelText(QUIZ_FORM_COPY.fields.title)
		).toHaveValue('Math')
	})

	it('requires unarchiving before showing the form', async () => {
		vi.mocked(fetchQuiz).mockResolvedValue({ ...quiz, isArchived: true })
		vi.mocked(setQuizArchived).mockImplementation(() => {
			vi.mocked(fetchQuiz).mockResolvedValue(quiz)
			return Promise.resolve()
		})
		const user = userEvent.setup()
		renderEditor()
		await screen.findByText(QUIZ_DETAILS_COPY.archivedNotice.title)
		expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
		await user.click(
			screen.getByRole('button', { name: QUIZ_DETAILS_COPY.unarchive })
		)
		expect(
			await screen.findByLabelText(QUIZ_FORM_COPY.fields.title)
		).toHaveValue('Math')
	})
})
