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

import { DASHBOARD_LAYOUT_COPY } from '@layout/constants'

import { signOut } from '@modules/auth/store/sessionStore'
import { QuizEditPage } from '@modules/quizzes/components/QuizEditPage'
import { QUIZ_FORM_COPY } from '@modules/quizzes/constants'

import { PATHS } from '@config/routes'

import { renderWithTheme } from '@src/test/testUtils'

vi.mock('@modules/auth/store/sessionStore', () => ({
	signOut: vi.fn(),
	useSession: () => ({ user: { userName: 'quizzer' } })
}))
vi.mock('@modules/quizzes/components/QuizEditor', () => ({
	QuizEditor: ({ onSaved }: { onSaved: () => void }) => (
		<button onClick={onSaved}>{QUIZ_FORM_COPY.submitEdit}</button>
	)
}))

function renderPage() {
	const root = createRootRoute({ component: Outlet })
	const edit = createRoute({
		getParentRoute: () => root,
		path: PATHS.quizEdit,
		component: QuizEditPage
	})
	const home = createRoute({
		getParentRoute: () => root,
		path: PATHS.home,
		component: () => <p>Home destination</p>
	})
	const details = createRoute({
		getParentRoute: () => root,
		path: PATHS.quizDetails,
		component: () => <p>Details destination</p>
	})
	const router = createRouter({
		routeTree: root.addChildren([edit, home, details]),
		history: createMemoryHistory({
			initialEntries: [PATHS.quizEdit.replace('$quizId', '7')]
		})
	})
	return renderWithTheme(<RouterProvider router={router} />)
}

describe('QuizEditPage sign out', () => {
	beforeEach(() => vi.clearAllMocks())
	afterEach(cleanup)
	it('keeps the session when sign out is cancelled, including after a later save', async () => {
		const user = userEvent.setup()
		renderPage()
		await user.click(
			await screen.findByRole('button', {
				name: DASHBOARD_LAYOUT_COPY.openMenu
			})
		)
		await user.click(
			await screen.findByRole('button', { name: DASHBOARD_LAYOUT_COPY.signOut })
		)
		expect(
			await screen.findByRole('dialog', { name: QUIZ_FORM_COPY.leaveTitle })
		).toBeInTheDocument()
		expect(signOut).not.toHaveBeenCalled()
		await user.click(screen.getByRole('button', { name: QUIZ_FORM_COPY.stay }))
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: DASHBOARD_LAYOUT_COPY.openMenu })
		).toBeInTheDocument()
		await user.click(
			screen.getByRole('button', { name: QUIZ_FORM_COPY.submitEdit })
		)
		expect(await screen.findByText('Details destination')).toBeInTheDocument()
		expect(signOut).not.toHaveBeenCalled()
	})
	it('signs out only after confirming the exit', async () => {
		const user = userEvent.setup()
		renderPage()
		await user.click(
			await screen.findByRole('button', {
				name: DASHBOARD_LAYOUT_COPY.openMenu
			})
		)
		await user.click(
			await screen.findByRole('button', { name: DASHBOARD_LAYOUT_COPY.signOut })
		)
		expect(signOut).not.toHaveBeenCalled()
		await user.click(
			await screen.findByRole('button', { name: QUIZ_FORM_COPY.leave })
		)
		expect(await screen.findByText('Home destination')).toBeInTheDocument()
		expect(signOut).toHaveBeenCalledTimes(1)
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
	})
})
