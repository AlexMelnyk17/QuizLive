import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	fetchMyQuizzes,
	setQuizArchived
} from '@modules/quizzes/api/quizzesApi'
import {
	QuizList,
	type QuizListProps
} from '@modules/quizzes/components/QuizList'
import { QUIZ_LIST_COPY } from '@modules/quizzes/constants'
import type { QuizDto } from '@modules/quizzes/types'
import { formatQuizDate } from '@modules/quizzes/utils/formatQuizDate'

import { ApiError } from '@api/apiError'

import { renderWithTheme } from '@src/test/testUtils'

vi.mock('@modules/quizzes/api/quizzesApi', () => ({
	fetchMyQuizzes: vi.fn(),
	setQuizArchived: vi.fn()
}))

const fetchMyQuizzesMock = vi.mocked(fetchMyQuizzes)
const setQuizArchivedMock = vi.mocked(setQuizArchived)

const math: QuizDto = {
	id: 7,
	title: 'Math',
	description: 'Numbers and shapes',
	kind: 2,
	isArchived: false,
	createdAtUtc: '2026-11-16T12:00:00',
	questionCount: 1
}

function renderQuizList(props: QuizListProps = {}) {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } }
	})

	return renderWithTheme(
		<QueryClientProvider client={queryClient}>
			<QuizList {...props} />
		</QueryClientProvider>
	)
}

describe('QuizList', () => {
	beforeEach(() => {
		fetchMyQuizzesMock.mockReset()
		setQuizArchivedMock.mockReset()
	})

	afterEach(() => {
		cleanup()
	})

	it('shows skeletons while loading', () => {
		fetchMyQuizzesMock.mockReturnValue(new Promise(() => {}))

		renderQuizList()

		expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument()
	})

	it('shows active quizzes with their details', async () => {
		fetchMyQuizzesMock.mockResolvedValue([math])

		renderQuizList()

		expect(
			await screen.findByRole('heading', { name: 'Math' })
		).toBeInTheDocument()
		expect(screen.getByText('Numbers and shapes')).toBeInTheDocument()
		expect(screen.getByText('Quiz')).toBeInTheDocument()
		expect(
			screen.getByText(
				`1 question · Created ${formatQuizDate(math.createdAtUtc)}`
			)
		).toBeInTheDocument()
		expect(fetchMyQuizzesMock).toHaveBeenCalledWith(false)
	})

	it('switches to archived quizzes', async () => {
		const user = userEvent.setup()
		fetchMyQuizzesMock.mockResolvedValue([])
		renderQuizList({ onCreateQuiz: vi.fn() })
		const archivedTab = screen.getByRole('button', {
			name: QUIZ_LIST_COPY.tabs.archived
		})

		await user.click(archivedTab)

		expect(
			await screen.findByText(QUIZ_LIST_COPY.empty.archived.title)
		).toBeInTheDocument()
		expect(fetchMyQuizzesMock).toHaveBeenLastCalledWith(true)
		expect(archivedTab).toHaveAttribute('aria-pressed', 'true')
		expect(
			screen.queryByRole('button', { name: QUIZ_LIST_COPY.createQuiz })
		).not.toBeInTheDocument()
	})

	it('offers to create a quiz when there are no active quizzes', async () => {
		const user = userEvent.setup()
		const onCreateQuiz = vi.fn()
		fetchMyQuizzesMock.mockResolvedValue([])
		renderQuizList({ onCreateQuiz })

		await user.click(
			await screen.findByRole('button', { name: QUIZ_LIST_COPY.createQuiz })
		)

		expect(
			screen.getByText(QUIZ_LIST_COPY.empty.active.title)
		).toBeInTheDocument()
		expect(onCreateQuiz).toHaveBeenCalled()
	})

	it('archives a quiz and reloads the list', async () => {
		const user = userEvent.setup()
		fetchMyQuizzesMock.mockResolvedValueOnce([math]).mockResolvedValue([])
		setQuizArchivedMock.mockResolvedValue()
		renderQuizList()

		await user.click(
			await screen.findByRole('button', { name: 'Archive "Math"' })
		)

		expect(setQuizArchivedMock).toHaveBeenCalledWith(7, true)
		expect(
			await screen.findByText(QUIZ_LIST_COPY.empty.active.title)
		).toBeInTheDocument()
		expect(fetchMyQuizzesMock).toHaveBeenCalledTimes(2)
	})

	it('shows the server message when archiving fails', async () => {
		const user = userEvent.setup()
		fetchMyQuizzesMock.mockResolvedValue([math])
		setQuizArchivedMock.mockRejectedValue(
			new ApiError(404, { detail: 'Quiz 7 was not found.' })
		)
		renderQuizList()

		await user.click(
			await screen.findByRole('button', { name: 'Archive "Math"' })
		)

		expect(await screen.findByText('Quiz 7 was not found.')).toBeInTheDocument()
		expect(
			screen.getByText(QUIZ_LIST_COPY.updateError.title)
		).toBeInTheDocument()
	})

	it('shows an error with retry when loading fails', async () => {
		const user = userEvent.setup()
		fetchMyQuizzesMock
			.mockRejectedValueOnce(new Error('Network error'))
			.mockResolvedValue([math])
		renderQuizList()

		await user.click(
			await screen.findByRole('button', {
				name: QUIZ_LIST_COPY.loadError.retry
			})
		)

		expect(
			await screen.findByRole('heading', { name: 'Math' })
		).toBeInTheDocument()
	})

	it('opens a quiz from its title only when a handler is given', async () => {
		const user = userEvent.setup()
		const onOpenQuiz = vi.fn()
		fetchMyQuizzesMock.mockResolvedValue([math])
		renderQuizList({ onOpenQuiz })

		await user.click(await screen.findByRole('button', { name: 'Math' }))

		expect(onOpenQuiz).toHaveBeenCalledWith(7)

		cleanup()
		renderQuizList()

		await screen.findByRole('heading', { name: 'Math' })
		expect(
			screen.queryByRole('button', { name: 'Math' })
		).not.toBeInTheDocument()
	})
})
