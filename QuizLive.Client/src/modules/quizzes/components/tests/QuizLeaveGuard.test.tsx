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
import { afterEach, describe, expect, it } from 'vitest'

import { DashboardLayout } from '@layout/DashboardLayout/DashboardLayout'

import { QuizLeaveGuard } from '@modules/quizzes/components/QuizLeaveGuard'
import { QUIZ_FORM_COPY } from '@modules/quizzes/constants'

import { PATHS } from '@config/routes'

import { renderWithTheme } from '@src/test/testUtils'

afterEach(cleanup)

function renderEditor() {
	const root = createRootRoute({ component: Outlet })
	const edit = createRoute({
		getParentRoute: () => root,
		path: PATHS.quizEdit,
		component: () => (
			<DashboardLayout>
				<QuizLeaveGuard />
			</DashboardLayout>
		)
	})
	const dashboard = createRoute({
		getParentRoute: () => root,
		path: PATHS.dashboard,
		component: () => <p>Quiz list destination</p>
	})
	const create = createRoute({
		getParentRoute: () => root,
		path: PATHS.quizCreate,
		component: () => <p>Quiz creation destination</p>
	})
	const statistics = createRoute({
		getParentRoute: () => root,
		path: PATHS.statistics,
		component: () => <p>Statistics destination</p>
	})
	const router = createRouter({
		routeTree: root.addChildren([edit, dashboard, create, statistics]),
		history: createMemoryHistory({
			initialEntries: [PATHS.quizEdit.replace('$quizId', '7')]
		})
	})
	return renderWithTheme(<RouterProvider router={router} />)
}

describe('QuizLeaveGuard', () => {
	it.each([
		['My quizzes', 'Quiz list destination'],
		['Statistics', 'Statistics destination']
	])(
		'confirms leaving through %s and lets the user stay',
		async (link, destination) => {
			const user = userEvent.setup()
			renderEditor()
			await user.click(
				await screen.findByRole('button', { name: 'Open navigation' })
			)
			await user.click(screen.getByRole('link', { name: link }))
			expect(
				await screen.findByRole('dialog', { name: QUIZ_FORM_COPY.leaveTitle })
			).toBeInTheDocument()
			expect(screen.queryByText(destination)).not.toBeInTheDocument()
			await user.click(
				screen.getByRole('button', { name: QUIZ_FORM_COPY.stay })
			)
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
			await user.click(screen.getByRole('button', { name: 'Open navigation' }))
			await user.click(screen.getByRole('link', { name: link }))
			await user.click(
				await screen.findByRole('button', { name: QUIZ_FORM_COPY.leave })
			)
			expect(await screen.findByText(destination)).toBeInTheDocument()
		}
	)
})
