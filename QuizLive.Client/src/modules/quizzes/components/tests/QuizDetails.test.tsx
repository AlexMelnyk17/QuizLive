import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createGame } from '@modules/game/api/gamesApi'
import { GameStatus } from '@modules/game/constants'
import type { HostGameDto } from '@modules/game/types'
import {
	deleteQuiz,
	fetchQuiz,
	setQuizArchived
} from '@modules/quizzes/api/quizzesApi'
import {
	QuizDetails,
	type QuizDetailsProps
} from '@modules/quizzes/components/QuizDetails'
import { QUIZ_DETAILS_COPY } from '@modules/quizzes/constants'
import type { QuizDetailsDto } from '@modules/quizzes/types'

import { PATHS } from '@config/routes'

import { ApiError } from '@api/apiError'

import { renderWithTheme } from '@src/test/testUtils'

const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
	useNavigate: () => navigateMock
}))

vi.mock('@modules/quizzes/api/quizzesApi', () => ({
	fetchQuiz: vi.fn(),
	fetchMyQuizzes: vi.fn(),
	setQuizArchived: vi.fn(),
	deleteQuiz: vi.fn()
}))

vi.mock('@modules/game/api/gamesApi', () => ({ createGame: vi.fn() }))

const createGameMock = vi.mocked(createGame)
const createdGame: HostGameDto = {
	id: 41,
	code: '283646',
	quizId: 7,
	quizTitle: 'Math',
	quizKind: 2,
	status: GameStatus.Lobby,
	createdAtUtc: '2026-11-17T10:00:00Z',
	endedAtUtc: null,
	players: []
}

const fetchQuizMock = vi.mocked(fetchQuiz)
const setQuizArchivedMock = vi.mocked(setQuizArchived)
const deleteQuizMock = vi.mocked(deleteQuiz)

const mathQuiz: QuizDetailsDto = {
	hasGames: false,
	id: 7,
	title: 'Math',
	description: 'Numbers and shapes',
	kind: 2,
	isArchived: false,
	createdAtUtc: '2026-11-16T12:00:00',
	questions: [
		{
			id: 1,
			order: 1,
			text: 'What is 2 + 2?',
			timeLimitSeconds: 30,
			basePoints: 100,
			imageUrl: 'https://example.com/sum.png',
			options: [
				{ id: 1, order: 1, text: '4', isCorrect: true },
				{ id: 2, order: 2, text: '5', isCorrect: false }
			]
		},
		{
			id: 2,
			order: 2,
			text: 'What is 3 × 3?',
			timeLimitSeconds: null,
			basePoints: null,
			imageUrl: null,
			options: [
				{ id: 3, order: 1, text: '6', isCorrect: false },
				{ id: 4, order: 2, text: '9', isCorrect: true }
			]
		}
	]
}

function renderQuizDetails(props: Partial<QuizDetailsProps> = {}) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false, retryDelay: 0 } }
	})

	return renderWithTheme(
		<QueryClientProvider client={queryClient}>
			<QuizDetails quizId={7} {...props} />
		</QueryClientProvider>
	)
}

describe('QuizDetails', () => {
	it.each(['archive', 'delete'])(
		'shows not found when %s returns 404',
		async action => {
			const user = userEvent.setup()
			const onBack = vi.fn()
			fetchQuizMock.mockResolvedValue(mathQuiz)
			const missing = new ApiError(404, { detail: 'Quiz was deleted.' })
			setQuizArchivedMock.mockRejectedValue(missing)
			deleteQuizMock.mockRejectedValue(missing)
			renderQuizDetails({ onBack })
			await user.click(
				await screen.findByRole('button', {
					name:
						action === 'archive'
							? QUIZ_DETAILS_COPY.archive
							: QUIZ_DETAILS_COPY.delete
				})
			)
			if (action === 'delete')
				await user.click(
					screen.getByRole('button', {
						name: QUIZ_DETAILS_COPY.deleteDialog.confirm
					})
				)
			expect(
				await screen.findByText(QUIZ_DETAILS_COPY.notFound.title)
			).toBeInTheDocument()
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
			await user.click(
				screen.getByRole('button', { name: QUIZ_DETAILS_COPY.notFound.back })
			)
			expect(onBack).toHaveBeenCalled()
		}
	)
	beforeEach(() => {
		fetchQuizMock.mockReset()
		setQuizArchivedMock.mockReset()
		deleteQuizMock.mockReset()
		createGameMock.mockReset()
		navigateMock.mockReset()
	})

	afterEach(() => {
		cleanup()
	})

	it('shows skeletons while loading', () => {
		fetchQuizMock.mockReturnValue(new Promise(() => {}))

		renderQuizDetails()

		expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument()
	})

	it('navigates to quiz statistics', async () => {
		const user = userEvent.setup()
		fetchQuizMock.mockResolvedValue(mathQuiz)

		renderQuizDetails()

		await user.click(
			await screen.findByRole('button', { name: QUIZ_DETAILS_COPY.viewStats })
		)

		expect(navigateMock).toHaveBeenCalledWith({
			to: PATHS.quizStats,
			params: { quizId: '7' }
		})
	})

	it('shows the quiz and its questions in order', async () => {
		fetchQuizMock.mockResolvedValue(mathQuiz)

		renderQuizDetails()

		expect(
			await screen.findByRole('heading', { name: 'Math' })
		).toBeInTheDocument()
		expect(screen.getByText('Numbers and shapes')).toBeInTheDocument()
		expect(screen.getByText('Quiz')).toBeInTheDocument()

		const questions = screen
			.getAllByRole('listitem')
			.filter(item => item.textContent?.startsWith('Question'))
		expect(
			questions.map(q => within(q).getByText(/^What is/).textContent)
		).toEqual(['What is 2 + 2?', 'What is 3 × 3?'])
		expect(
			within(questions[0]).getByText('30 s · 100 points')
		).toBeInTheDocument()
		expect(within(questions[1]).getByText('No time limit')).toBeInTheDocument()
		expect(
			within(questions[0]).getByRole('img', { name: 'Image for question 1' })
		).toHaveAttribute('src', 'https://example.com/sum.png')
	})

	it('marks only the correct option of a quiz question', async () => {
		fetchQuizMock.mockResolvedValue(mathQuiz)

		renderQuizDetails()

		const correct = await screen.findAllByText(QUIZ_DETAILS_COPY.correctOption)
		expect(correct.map(badge => badge.closest('li')?.textContent)).toEqual([
			`4${QUIZ_DETAILS_COPY.correctOption}`,
			`9${QUIZ_DETAILS_COPY.correctOption}`
		])
	})

	it('shows poll options without a correct one and a hint for open text', async () => {
		fetchQuizMock.mockResolvedValueOnce({
			...mathQuiz,
			kind: 1,
			questions: [
				{
					...mathQuiz.questions[0],
					basePoints: null,
					options: [
						{ id: 1, order: 1, text: 'Tea', isCorrect: null },
						{ id: 2, order: 2, text: 'Coffee', isCorrect: null }
					]
				}
			]
		})
		renderQuizDetails()

		expect(await screen.findByText('Coffee')).toBeInTheDocument()
		expect(
			screen.queryByText(QUIZ_DETAILS_COPY.correctOption)
		).not.toBeInTheDocument()

		cleanup()
		fetchQuizMock.mockResolvedValueOnce({
			...mathQuiz,
			kind: 0,
			questions: [{ ...mathQuiz.questions[1], options: null }]
		})
		renderQuizDetails()

		expect(
			await screen.findByText(QUIZ_DETAILS_COPY.openTextHint)
		).toBeInTheDocument()
	})

	it('shows a not found state for a missing quiz', async () => {
		const user = userEvent.setup()
		const onBack = vi.fn()
		fetchQuizMock.mockRejectedValue(
			new ApiError(404, { detail: 'Quiz 7 was not found.' })
		)
		renderQuizDetails({ onBack })

		await user.click(
			await screen.findByRole('button', {
				name: QUIZ_DETAILS_COPY.notFound.back
			})
		)

		expect(
			screen.getByText(QUIZ_DETAILS_COPY.notFound.title)
		).toBeInTheDocument()
		expect(onBack).toHaveBeenCalled()
		expect(fetchQuizMock).toHaveBeenCalledTimes(1)
	})

	it('shows an error with retry when loading fails', async () => {
		const user = userEvent.setup()
		fetchQuizMock
			.mockRejectedValueOnce(new Error('Network error'))
			.mockRejectedValueOnce(new Error('Network error'))
			.mockResolvedValue(mathQuiz)
		renderQuizDetails()

		await user.click(
			await screen.findByRole('button', {
				name: QUIZ_DETAILS_COPY.loadError.retry
			})
		)

		expect(
			await screen.findByRole('heading', { name: 'Math' })
		).toBeInTheDocument()
	})

	it('opens the editor', async () => {
		const user = userEvent.setup()
		const onEdit = vi.fn()
		fetchQuizMock.mockResolvedValue(mathQuiz)
		renderQuizDetails({ onEdit })

		await user.click(
			await screen.findByRole('button', { name: QUIZ_DETAILS_COPY.edit })
		)

		expect(onEdit).toHaveBeenCalledWith(7)
	})

	it('hides editing for an archived quiz and lets the host unarchive it', async () => {
		const user = userEvent.setup()
		fetchQuizMock.mockResolvedValue({ ...mathQuiz, isArchived: true })
		setQuizArchivedMock.mockResolvedValue()
		renderQuizDetails({ onEdit: vi.fn() })

		await user.click(
			await screen.findByRole('button', { name: QUIZ_DETAILS_COPY.unarchive })
		)

		expect(
			screen.getByText(QUIZ_DETAILS_COPY.archivedNotice.title)
		).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: QUIZ_DETAILS_COPY.edit })
		).not.toBeInTheDocument()
		expect(setQuizArchivedMock).toHaveBeenCalledWith(7, false)
	})

	describe('starting a game', () => {
		it('creates a game for the quiz and opens the host page', async () => {
			const user = userEvent.setup()
			fetchQuizMock.mockResolvedValue(mathQuiz)
			createGameMock.mockResolvedValue(createdGame)
			renderQuizDetails()

			await user.click(
				await screen.findByRole('button', { name: QUIZ_DETAILS_COPY.startGame })
			)

			expect(createGameMock).toHaveBeenCalledWith(7)
			await waitFor(() =>
				expect(navigateMock).toHaveBeenCalledWith({
					to: PATHS.hostGame,
					params: { gameId: '41' }
				})
			)
		})

		it('explains that questions are needed, and does not create a game, for a quiz without questions', async () => {
			const user = userEvent.setup()
			fetchQuizMock.mockResolvedValue({ ...mathQuiz, questions: [] })
			renderQuizDetails()

			const start = await screen.findByRole('button', {
				name: QUIZ_DETAILS_COPY.startGame
			})
			await user.click(start)

			expect(start).toBeDisabled()
			expect(start).toHaveAccessibleDescription(
				QUIZ_DETAILS_COPY.startNeedsQuestions
			)
			expect(createGameMock).not.toHaveBeenCalled()
		})

		it('shows the text of the server when the game cannot be created, and stays on the page', async () => {
			const user = userEvent.setup()
			fetchQuizMock.mockResolvedValue(mathQuiz)
			createGameMock.mockRejectedValue(
				new ApiError(409, { detail: 'The quiz already has an active game.' })
			)
			renderQuizDetails()

			await user.click(
				await screen.findByRole('button', { name: QUIZ_DETAILS_COPY.startGame })
			)

			expect(
				await screen.findByText('The quiz already has an active game.')
			).toBeInTheDocument()
			expect(
				screen.getByText(QUIZ_DETAILS_COPY.startError.title)
			).toBeInTheDocument()
			expect(navigateMock).not.toHaveBeenCalled()
		})

		it('shows not found when the quiz is gone', async () => {
			const user = userEvent.setup()
			fetchQuizMock.mockResolvedValue(mathQuiz)
			createGameMock.mockRejectedValue(
				new ApiError(404, { detail: 'Quiz was deleted.' })
			)
			renderQuizDetails()

			await user.click(
				await screen.findByRole('button', { name: QUIZ_DETAILS_COPY.startGame })
			)

			expect(
				await screen.findByText(QUIZ_DETAILS_COPY.notFound.title)
			).toBeInTheDocument()
		})
	})

	it('disables deletion for archived quizzes and explains how to enable it', async () => {
		const user = userEvent.setup()
		fetchQuizMock.mockResolvedValue({ ...mathQuiz, isArchived: true })
		renderQuizDetails()
		const remove = await screen.findByRole('button', {
			name: QUIZ_DETAILS_COPY.delete
		})
		expect(remove).toBeDisabled()
		expect(remove).toHaveAttribute(
			'title',
			QUIZ_DETAILS_COPY.archivedDeleteReason
		)
		expect(
			screen.queryByRole('button', { name: QUIZ_DETAILS_COPY.startGame })
		).not.toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: QUIZ_DETAILS_COPY.edit })
		).not.toBeInTheDocument()
		expect(
			screen.getByText(QUIZ_DETAILS_COPY.archivedNotice.body)
		).toBeInTheDocument()
		await user.click(remove)
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
		expect(deleteQuizMock).not.toHaveBeenCalled()
	})

	it('disables deletion of a played quiz before sending any delete request', async () => {
		fetchQuizMock.mockResolvedValue({ ...mathQuiz, hasGames: true })
		renderQuizDetails()
		const remove = await screen.findByRole('button', {
			name: QUIZ_DETAILS_COPY.delete
		})
		expect(remove).toBeDisabled()
		expect(remove).toHaveAccessibleDescription(
			QUIZ_DETAILS_COPY.playedDeleteReason
		)
		expect(deleteQuizMock).not.toHaveBeenCalled()
	})

	it('deletes the quiz after confirmation', async () => {
		const user = userEvent.setup()
		const onDeleted = vi.fn()
		fetchQuizMock.mockResolvedValue(mathQuiz)
		deleteQuizMock.mockResolvedValue()
		renderQuizDetails({ onDeleted })

		await user.click(
			await screen.findByRole('button', { name: QUIZ_DETAILS_COPY.delete })
		)
		const dialog = screen.getByRole('dialog', {
			name: QUIZ_DETAILS_COPY.deleteDialog.title
		})
		await user.click(
			within(dialog).getByRole('button', {
				name: QUIZ_DETAILS_COPY.deleteDialog.confirm
			})
		)

		expect(deleteQuizMock).toHaveBeenCalledWith(7)
		expect(onDeleted).toHaveBeenCalled()
		expect(
			await screen.findByText(QUIZ_DETAILS_COPY.deleted)
		).toBeInTheDocument()
		expect(fetchQuizMock).toHaveBeenCalledTimes(1)
	})

	it('does not delete when the dialog is cancelled', async () => {
		const user = userEvent.setup()
		fetchQuizMock.mockResolvedValue(mathQuiz)
		renderQuizDetails()

		await user.click(
			await screen.findByRole('button', { name: QUIZ_DETAILS_COPY.delete })
		)
		await user.click(
			screen.getByRole('button', {
				name: QUIZ_DETAILS_COPY.deleteDialog.cancel
			})
		)

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
		expect(deleteQuizMock).not.toHaveBeenCalled()
	})

	it('offers to archive a played quiz that cannot be deleted', async () => {
		const user = userEvent.setup()
		const message =
			'The quiz has played games and cannot be deleted. Archive it instead.'
		fetchQuizMock.mockResolvedValue(mathQuiz)
		deleteQuizMock.mockRejectedValue(new ApiError(409, { detail: message }))
		setQuizArchivedMock.mockResolvedValue()
		renderQuizDetails()

		await user.click(
			await screen.findByRole('button', { name: QUIZ_DETAILS_COPY.delete })
		)
		await user.click(
			screen.getByRole('button', {
				name: QUIZ_DETAILS_COPY.deleteDialog.confirm
			})
		)
		const archiveInstead = await screen.findByRole('button', {
			name: QUIZ_DETAILS_COPY.archiveInstead
		})
		expect(screen.getByText(message)).toBeInTheDocument()

		await user.click(archiveInstead)

		expect(setQuizArchivedMock).toHaveBeenCalledWith(7, true)
		// Archiving replaces the failed deletion, so its error is cleared.
		expect(screen.queryByText(message)).not.toBeInTheDocument()
	})

	it('offers to add questions to an empty quiz', async () => {
		const user = userEvent.setup()
		const onEdit = vi.fn()
		fetchQuizMock.mockResolvedValue({ ...mathQuiz, questions: [] })
		renderQuizDetails({ onEdit })

		await user.click(
			await screen.findByRole('button', {
				name: QUIZ_DETAILS_COPY.addQuestions
			})
		)

		expect(screen.getByText(QUIZ_DETAILS_COPY.noQuestions)).toBeInTheDocument()
		expect(onEdit).toHaveBeenCalledWith(7)
	})
})
