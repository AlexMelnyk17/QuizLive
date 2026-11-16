import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	redirect,
} from '@tanstack/react-router'
import { z } from 'zod'

import { PATHS } from '@config/routes'

import { LoginPage } from '@modules/auth/components/LoginPage'
import { RegisterPage } from '@modules/auth/components/RegisterPage'
import { readSession } from '@modules/auth/store/sessionStore'
import { DashboardPage } from '@modules/dashboard/components/DashboardPage'
import { HomePage } from '@modules/home/components/HomePage'
import { QuizDetailsPage } from '@modules/quizzes/components/QuizDetailsPage'
import { GamePlayStatsPage } from '@modules/statistics/components/GamePlayStatsPage'
import { QuizPlayStatsPage } from '@modules/statistics/components/QuizPlayStatsPage'
import { StatisticsPage } from '@modules/statistics/components/StatisticsPage'
import { sanitizeRedirectPath } from '@utils/sanitizeRedirectPath'

const rootRoute = createRootRoute({
	component: () => <Outlet />,
})

const loginSearchSchema = z.object({
	redirect: z.string().optional(),
})

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.home,
	component: HomePage,
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
	component: LoginPage,
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
	component: RegisterPage,
})

const dashboardRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.dashboard,
	beforeLoad: () => {
		const session = readSession()
		if (!session) {
			throw redirect({
				to: PATHS.login,
				search: { redirect: PATHS.dashboard },
			})
		}
	},
	component: DashboardPage,
})

const statisticsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.statistics,
	beforeLoad: () => {
		const session = readSession()
		if (!session) {
			throw redirect({
				to: PATHS.login,
				search: { redirect: PATHS.statistics },
			})
		}
	},
	component: StatisticsPage,
})

const quizDetailsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.quizDetails,
	beforeLoad: ({ location }) => {
		const session = readSession()
		if (!session) {
			throw redirect({
				to: PATHS.login,
				search: { redirect: location.href },
			})
		}
	},
	component: QuizDetailsPage,
})

const quizStatsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.quizStats,
	beforeLoad: ({ location }) => {
		const session = readSession()
		if (!session) {
			throw redirect({
				to: PATHS.login,
				search: { redirect: location.href },
			})
		}
	},
	component: QuizPlayStatsPage,
})

const gameStatsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.gameStats,
	beforeLoad: ({ location }) => {
		const session = readSession()
		if (!session) {
			throw redirect({
				to: PATHS.login,
				search: { redirect: location.href },
			})
		}
	},
	component: GamePlayStatsPage,
})

const routeTree = rootRoute.addChildren([
	indexRoute,
	loginRoute,
	registerRoute,
	dashboardRoute,
	statisticsRoute,
	quizDetailsRoute,
	quizStatsRoute,
	gameStatsRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}