import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	createQuestion,
	deleteQuestion,
	reorderQuestions,
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
	deleteQuestion: vi.fn(),
	reorderQuestions: vi.fn()
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
	it.each([QUESTION_FORM_COPY.moveUp, QUESTION_FORM_COPY.moveDown])(
		'saves question order with %s',
		async action => {
			const first = {
				id: 11,
				order: 1,
				text: 'First question',
				timeLimitSeconds: null,
				basePoints: null,
				imageUrl: null,
				options: null
			}
			const second = { ...first, id: 12, order: 2, text: 'Second question' }
			vi.mocked(fetchQuiz).mockResolvedValue({
				...quiz,
				questions: [first, second]
			})
			vi.mocked(reorderQuestions).mockImplementation(() => {
				const questions = [
					{ ...second, order: 1 },
					{ ...first, order: 2 }
				]
				vi.mocked(fetchQuiz).mockResolvedValue({ ...quiz, questions })
				return Promise.resolve(questions)
			})
			const user = userEvent.setup()
			renderEditor()
			await screen.findByText(first.text)
			expect(
				screen.getAllByRole('button', { name: QUESTION_FORM_COPY.moveUp })[0]
			).toBeDisabled()
			expect(
				screen.getAllByRole('button', { name: QUESTION_FORM_COPY.moveDown })[1]
			).toBeDisabled()
			await user.click(
				screen.getAllByRole('button', { name: action })[
					action === QUESTION_FORM_COPY.moveUp ? 1 : 0
				]
			)
			await vi.waitFor(() =>
				expect(reorderQuestions).toHaveBeenCalledWith(quiz.id, [
					second.id,
					first.id
				])
			)
			await vi.waitFor(() =>
				expect(
					screen
						.getByText(second.text)
						.compareDocumentPosition(screen.getByText(first.text)) &
						Node.DOCUMENT_POSITION_FOLLOWING
				).toBeTruthy()
			)
			expect(
				screen.getByRole('button', { name: QUIZ_FORM_COPY.submitEdit })
			).toBeEnabled()
		}
	)

	it('keeps the order and displays the server message when reordering fails', async () => {
		const first = {
			id: 11,
			order: 1,
			text: 'First question',
			timeLimitSeconds: null,
			basePoints: null,
			imageUrl: null,
			options: null
		}
		const second = { ...first, id: 12, order: 2, text: 'Second question' }
		vi.mocked(fetchQuiz).mockResolvedValue({
			...quiz,
			questions: [first, second]
		})
		vi.mocked(reorderQuestions).mockRejectedValue(
			new ApiError(HTTP_STATUS.CONFLICT, {
				detail: 'Cannot reorder during an active game.'
			})
		)
		const user = userEvent.setup()
		renderEditor()
		await screen.findByText(first.text)
		await user.click(
			screen.getAllByRole('button', { name: QUESTION_FORM_COPY.moveDown })[0]
		)
		expect(
			await screen.findByText('Cannot reorder during an active game.')
		).toBeInTheDocument()
		expect(
			screen
				.getByText(first.text)
				.compareDocumentPosition(screen.getByText(second.text)) &
				Node.DOCUMENT_POSITION_FOLLOWING
		).toBeTruthy()
		expect(
			screen.getByRole('button', { name: QUIZ_FORM_COPY.submitEdit })
		).toBeEnabled()
	})
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
		const remaining = {
			...question,
			id: 12,
			order: 2,
			text: 'Remaining question'
		}
		vi.mocked(fetchQuiz).mockResolvedValue({
			...quiz,
			questions: [question, remaining]
		})
		vi.mocked(updateQuestion).mockImplementation(
			(_quizId, _questionId, request) => {
				const updated = { ...question, ...request, options: null }
				vi.mocked(fetchQuiz).mockResolvedValue({
					...quiz,
					questions: [updated, remaining]
				})
				return Promise.resolve(updated)
			}
		)
		vi.mocked(deleteQuestion).mockImplementation(() => {
			vi.mocked(fetchQuiz).mockResolvedValue({
				...quiz,
				questions: [remaining]
			})
			return Promise.resolve()
		})
		const user = userEvent.setup()
		renderEditor()
		await user.click(
			(
				await screen.findAllByRole('button', { name: QUESTION_FORM_COPY.edit })
			)[0]
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
			screen.getAllByRole('button', { name: QUESTION_FORM_COPY.delete })[0]
		)
		expect(deleteQuestion).not.toHaveBeenCalled()
		const buttons = screen.getAllByRole('button', {
			name: QUESTION_FORM_COPY.delete
		})
		await user.click(buttons[buttons.length - 1])
		await vi.waitFor(() =>
			expect(screen.queryByText('Updated question')).not.toBeInTheDocument()
		)
		expect(
			screen.getByRole('button', { name: QUESTION_FORM_COPY.delete })
		).toBeDisabled()
		expect(
			screen.getByRole('button', { name: QUESTION_FORM_COPY.delete })
		).toHaveAttribute('title', QUESTION_FORM_COPY.lastQuestionDeleteReason)
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

	it('requires a saved question before saving the quiz', async () => {
		const user = userEvent.setup()
		renderEditor()
		const save = await screen.findByRole('button', {
			name: QUIZ_FORM_COPY.submitEdit
		})
		expect(save).toBeDisabled()
		expect(save).toHaveAccessibleDescription(QUIZ_FORM_COPY.questionRequired)
		expect(screen.getByLabelText(QUIZ_FORM_COPY.fields.title)).toBeEnabled()
		await user.click(save)
		expect(updateQuiz).not.toHaveBeenCalled()
		const question = {
			id: 13,
			order: 1,
			text: 'First saved question',
			timeLimitSeconds: null,
			basePoints: null,
			imageUrl: null,
			options: null
		}
		vi.mocked(createQuestion).mockImplementation(() => {
			vi.mocked(fetchQuiz).mockResolvedValue({ ...quiz, questions: [question] })
			return Promise.resolve(question)
		})
		await user.click(
			screen.getByRole('button', { name: QUIZ_DETAILS_COPY.addQuestions })
		)
		await user.type(
			screen.getByLabelText(QUESTION_FORM_COPY.text),
			question.text
		)
		expect(save).toBeDisabled()
		await user.click(
			screen.getByRole('button', { name: QUESTION_FORM_COPY.save })
		)
		await screen.findByText(question.text)
		expect(save).toBeEnabled()
		expect(
			screen.queryByText(QUIZ_FORM_COPY.questionRequired)
		).not.toBeInTheDocument()
	})

	it('edits a quiz with a fixed kind and saves the new title', async () => {
		vi.mocked(fetchQuiz).mockResolvedValue({
			...quiz,
			questions: [
				{
					id: 13,
					order: 1,
					text: 'Question',
					timeLimitSeconds: null,
					basePoints: null,
					imageUrl: null,
					options: null
				}
			]
		})
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
		vi.mocked(fetchQuiz).mockResolvedValue({
			...quiz,
			questions: [
				{
					id: 13,
					order: 1,
					text: 'Question',
					timeLimitSeconds: null,
					basePoints: null,
					imageUrl: null,
					options: null
				}
			]
		})
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
