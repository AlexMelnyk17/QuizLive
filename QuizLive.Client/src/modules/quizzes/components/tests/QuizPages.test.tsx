import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	Outlet,
	RouterProvider,
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter
} from '@tanstack/react-router'
import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DashboardPage } from '@modules/dashboard/components/DashboardPage'
import {
	fetchMyQuizzes,
	fetchQuiz,
	updateQuiz
} from '@modules/quizzes/api/quizzesApi'
import { QuizCreatePage } from '@modules/quizzes/components/QuizCreatePage'
import { QuizDetailsPage } from '@modules/quizzes/components/QuizDetailsPage'
import { QuizEditPage } from '@modules/quizzes/components/QuizEditPage'
import {
	QUIZ_DETAILS_COPY,
	QUIZ_FORM_COPY,
	QUIZ_LIST_COPY,
	QuizKind
} from '@modules/quizzes/constants'
import type { QuizDetailsDto, QuizDto } from '@modules/quizzes/types'

import { PATHS } from '@config/routes'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

import { renderWithTheme } from '@src/test/testUtils'

vi.mock('@modules/auth/store/sessionStore', () => ({
	useSession: () => null,
	signOut: vi.fn()
}))
vi.mock('@modules/quizzes/api/quizzesApi', () => ({
	fetchQuiz: vi.fn(),
	fetchMyQuizzes: vi.fn(),
	updateQuiz: vi.fn(),
	createQuiz: vi.fn(),
	setQuizArchived: vi.fn(),
	deleteQuiz: vi.fn()
}))

const details: QuizDetailsDto = {
	id: 7,
	title: 'Math quiz',
	description: null,
	kind: QuizKind.OpenText,
	isArchived: false,
	hasGames: false,
	createdAtUtc: '2026-11-16T12:00:00',
	questions: [
		{
			id: 11,
			order: 1,
			text: 'First question',
			timeLimitSeconds: null,
			basePoints: null,
			imageUrl: null,
			options: null
		}
	]
}
const quiz: QuizDto = { ...details, questionCount: 1 }

function renderPage(path: string) {
	const root = createRootRoute({ component: Outlet })
	const routes = [
		createRoute({
			getParentRoute: () => root,
			path: PATHS.dashboard,
			component: DashboardPage
		}),
		createRoute({
			getParentRoute: () => root,
			path: PATHS.quizCreate,
			component: QuizCreatePage
		}),
		createRoute({
			getParentRoute: () => root,
			path: PATHS.quizDetails,
			component: QuizDetailsPage
		}),
		createRoute({
			getParentRoute: () => root,
			path: PATHS.quizEdit,
			component: QuizEditPage
		})
	]
	const router = createRouter({
		routeTree: root.addChildren(routes),
		history: createMemoryHistory({
			initialEntries: [path.replace('$quizId', '7')]
		})
	})
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false, retryDelay: 0 } }
	})
	return renderWithTheme(
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	)
}

beforeEach(() => {
	vi.resetAllMocks()
	vi.mocked(fetchQuiz).mockResolvedValue(details)
	vi.mocked(fetchMyQuizzes).mockResolvedValue([quiz])
})
afterEach(cleanup)

describe.each([
	{
		path: PATHS.dashboard,
		empty: QUIZ_LIST_COPY.empty.active.title,
		error: QUIZ_LIST_COPY.loadError.title,
		retry: QUIZ_LIST_COPY.loadError.retry
	},
	{
		path: PATHS.quizDetails,
		empty: QUIZ_DETAILS_COPY.noQuestions,
		error: QUIZ_DETAILS_COPY.loadError.title,
		retry: QUIZ_DETAILS_COPY.loadError.retry
	},
	{
		path: PATHS.quizEdit,
		empty: QUIZ_DETAILS_COPY.noQuestions,
		error: QUIZ_DETAILS_COPY.loadError.title,
		retry: QUIZ_DETAILS_COPY.loadError.retry
	}
])('$path page', ({ path, empty, error, retry }) => {
	it('shows skeletons while loading', async () => {
		vi.mocked(fetchQuiz).mockReturnValue(new Promise(() => {}))
		vi.mocked(fetchMyQuizzes).mockReturnValue(new Promise(() => {}))
		const { container } = renderPage(path)
		await vi.waitFor(() =>
			expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
		)
	})
	it('shows the empty state', async () => {
		vi.mocked(fetchQuiz).mockResolvedValue({ ...details, questions: [] })
		vi.mocked(fetchMyQuizzes).mockResolvedValue([])
		renderPage(path)
		expect(await screen.findByText(empty)).toBeInTheDocument()
		if (path === PATHS.quizEdit)
			expect(
				screen.getByRole('button', { name: QUIZ_FORM_COPY.submitEdit })
			).toBeDisabled()
	})
	it('recovers from a load error through retry', async () => {
		vi.mocked(fetchQuiz).mockRejectedValue(new Error('Offline'))
		vi.mocked(fetchMyQuizzes).mockRejectedValue(new Error('Offline'))
		const user = userEvent.setup()
		renderPage(path)
		expect(await screen.findByText(error)).toBeInTheDocument()
		vi.mocked(fetchQuiz).mockResolvedValue(details)
		vi.mocked(fetchMyQuizzes).mockResolvedValue([quiz])
		await user.click(screen.getByRole('button', { name: retry }))
		if (path === PATHS.quizEdit)
			expect(
				await screen.findByLabelText(QUIZ_FORM_COPY.fields.title)
			).toHaveValue(quiz.title)
		else
			expect(
				await screen.findByRole('heading', { name: quiz.title })
			).toBeInTheDocument()
	})
	it('loads quiz content successfully', async () => {
		renderPage(path)
		if (path === PATHS.quizEdit)
			expect(
				await screen.findByLabelText(QUIZ_FORM_COPY.fields.title)
			).toHaveValue(quiz.title)
		else
			expect(
				await screen.findByRole('heading', { name: quiz.title })
			).toBeInTheDocument()
	})
})

describe('QuizEditPage saving', () => {
	it('saves through the real page and opens refreshed quiz details without an exit warning', async () => {
		vi.mocked(updateQuiz).mockImplementation((_id, request) => {
			vi.mocked(fetchQuiz).mockResolvedValue({ ...details, ...request })
			return Promise.resolve({ ...quiz, ...request })
		})
		const user = userEvent.setup()
		renderPage(PATHS.quizEdit)
		const title = await screen.findByLabelText(QUIZ_FORM_COPY.fields.title)
		await user.clear(title)
		await user.type(title, 'Updated math')
		await user.click(
			screen.getByRole('button', { name: QUIZ_FORM_COPY.submitEdit })
		)
		expect(
			await screen.findByRole('heading', { name: 'Updated math' })
		).toBeInTheDocument()
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
	})
	it('shows not found if saving the quiz returns 404', async () => {
		vi.mocked(updateQuiz).mockRejectedValue(
			new ApiError(HTTP_STATUS.NOT_FOUND, {})
		)
		const user = userEvent.setup()
		renderPage(PATHS.quizEdit)
		await screen.findByLabelText(QUIZ_FORM_COPY.fields.title)
		await user.click(
			screen.getByRole('button', { name: QUIZ_FORM_COPY.submitEdit })
		)
		expect(
			await screen.findByText(QUIZ_DETAILS_COPY.notFound.title)
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: QUIZ_DETAILS_COPY.notFound.back })
		).toBeInTheDocument()
	})
})
