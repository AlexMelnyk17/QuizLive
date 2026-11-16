import {
	Outlet,
	createRootRoute,
	createRoute,
	createRouter,
	redirect
} from '@tanstack/react-router'
import { z } from 'zod'

import { LoginPage } from '@modules/auth/components/LoginPage'
import { RegisterPage } from '@modules/auth/components/RegisterPage'
import { readSession } from '@modules/auth/store/sessionStore'
import { DashboardPage } from '@modules/dashboard/components/DashboardPage'
import { HomePage } from '@modules/home/components/HomePage'
import { QuizCreatePage } from '@modules/quizzes/components/QuizCreatePage'
import { QuizDetailsPage } from '@modules/quizzes/components/QuizDetailsPage'
import { QuizEditPage } from '@modules/quizzes/components/QuizEditPage'
import { StatisticsPage } from '@modules/statistics/components/StatisticsPage'

import { PATHS } from '@config/routes'

import { sanitizeRedirectPath } from '@utils/sanitizeRedirectPath'

const rootRoute = createRootRoute({
	component: () => <Outlet />
})

const loginSearchSchema = z.object({
	redirect: z.string().optional()
})

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.home,
	component: HomePage
})

const loginRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.login,
	validateSearch: loginSearchSchema,
	beforeLoad: ({ search }) => {
		const session = readSession()
		if (session) {
			throw redirect({ to: sanitizeRedirectPath(search.redirect) })
		}
	},
	component: LoginPage
})

const registerRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.register,
	beforeLoad: () => {
		const session = readSession()
		if (session) {
			throw redirect({ to: PATHS.dashboard })
		}
	},
	component: RegisterPage
})

const dashboardRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.dashboard,
	beforeLoad: () => {
		const session = readSession()
		if (!session) {
			throw redirect({
				to: PATHS.login,
				search: { redirect: PATHS.dashboard }
			})
		}
	},
	component: DashboardPage
})

const statisticsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.statistics,
	beforeLoad: () => {
		const session = readSession()
		if (!session) {
			throw redirect({
				to: PATHS.login,
				search: { redirect: PATHS.statistics }
			})
		}
	},
	component: StatisticsPage
})

const quizCreateRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.quizCreate,
	beforeLoad: () => {
		const session = readSession()
		if (!session) {
			throw redirect({
				to: PATHS.login,
				search: { redirect: PATHS.quizCreate }
			})
		}
	},
	component: QuizCreatePage
})

const quizDetailsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.quizDetails,
	beforeLoad: ({ location }) => {
		const session = readSession()
		if (!session) {
			throw redirect({
				to: PATHS.login,
				search: { redirect: location.href }
			})
		}
	},
	component: QuizDetailsPage
})

const quizEditRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.quizEdit,
	beforeLoad: ({ location }) => {
		if (!readSession()) {
			throw redirect({ to: PATHS.login, search: { redirect: location.href } })
		}
	},
	component: QuizEditPage
})

const routeTree = rootRoute.addChildren([
	indexRoute,
	loginRoute,
	registerRoute,
	dashboardRoute,
	statisticsRoute,
	quizCreateRoute,
	quizDetailsRoute,
	quizEditRoute
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}
