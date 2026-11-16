import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createQuiz } from '@modules/quizzes/api/quizzesApi'
import { QuizCreatePage } from '@modules/quizzes/components/QuizCreatePage'
import {
	QUIZ_FORM_COPY,
	QUIZ_KIND_LABELS,
	QuizKind
} from '@modules/quizzes/constants'
import type { QuizDto } from '@modules/quizzes/types'

import { PATHS } from '@config/routes'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

import { renderWithTheme } from '@src/test/testUtils'

const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
	useNavigate: () => navigateMock
}))

vi.mock('@modules/auth/store/sessionStore', () => ({
	useSession: () => null,
	signOut: vi.fn()
}))

vi.mock('@modules/quizzes/api/quizzesApi', () => ({
	createQuiz: vi.fn()
}))

const createQuizMock = vi.mocked(createQuiz)

const createdQuiz: QuizDto = {
	id: 9,
	title: 'Math',
	description: null,
	kind: QuizKind.PollChoice,
	isArchived: false,
	createdAtUtc: '2026-11-16T12:00:00',
	questionCount: 0
}

function renderQuizCreatePage() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } }
	})

	return renderWithTheme(
		<QueryClientProvider client={queryClient}>
			<QuizCreatePage />
		</QueryClientProvider>
	)
}

describe('QuizCreatePage', () => {
	beforeEach(() => {
		createQuizMock.mockReset()
		navigateMock.mockReset()
	})

	afterEach(() => {
		cleanup()
	})

	it('creates the quiz and opens it', async () => {
		const user = userEvent.setup()
		createQuizMock.mockResolvedValue(createdQuiz)
		renderQuizCreatePage()

		await user.type(screen.getByLabelText(QUIZ_FORM_COPY.fields.title), 'Math')
		await user.click(
			screen.getByRole('radio', { name: QUIZ_KIND_LABELS[QuizKind.PollChoice] })
		)
		await user.click(
			screen.getByRole('button', { name: QUIZ_FORM_COPY.submitCreate })
		)

		await vi.waitFor(() => {
			expect(navigateMock).toHaveBeenCalledWith({
				to: PATHS.quizDetails,
				params: { quizId: '9' }
			})
		})
		expect(createQuizMock).toHaveBeenCalledWith({
			title: 'Math',
			description: null,
			kind: QuizKind.PollChoice
		})
	})

	it('stays on the page and shows the server message when creating fails', async () => {
		const user = userEvent.setup()
		createQuizMock.mockRejectedValue(
			new ApiError(HTTP_STATUS.CONFLICT, { detail: 'Please try again later.' })
		)
		renderQuizCreatePage()

		await user.type(screen.getByLabelText(QUIZ_FORM_COPY.fields.title), 'Math')
		await user.click(
			screen.getByRole('button', { name: QUIZ_FORM_COPY.submitCreate })
		)

		expect(
			await screen.findByText('Please try again later.')
		).toBeInTheDocument()
		expect(navigateMock).not.toHaveBeenCalled()
	})

	it('returns to the list on cancel', async () => {
		const user = userEvent.setup()
		renderQuizCreatePage()

		await user.click(
			screen.getByRole('button', { name: QUIZ_FORM_COPY.cancel })
		)

		expect(navigateMock).toHaveBeenCalledWith({ to: PATHS.dashboard })
	})
})
