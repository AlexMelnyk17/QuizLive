import {
	Outlet,
	createRootRoute,
	createRoute,
	createRouter,
	lazyRouteComponent,
	redirect
} from '@tanstack/react-router'
import { z } from 'zod'

import { readSession } from '@modules/auth/store/sessionStore'

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
	component: lazyRouteComponent(
		() => import('@modules/home/components/HomePage'),
		'HomePage'
	)
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
	component: lazyRouteComponent(
		() => import('@modules/auth/components/LoginPage'),
		'LoginPage'
	)
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
	component: lazyRouteComponent(
		() => import('@modules/auth/components/RegisterPage'),
		'RegisterPage'
	)
})

const dashboardRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.dashboard,
	beforeLoad: () => {
		if (!readSession()) {
			throw redirect({
				to: PATHS.login,
				search: { redirect: PATHS.dashboard }
			})
		}
	},
	component: lazyRouteComponent(
		() => import('@modules/dashboard/components/DashboardPage'),
		'DashboardPage'
	)
})

const statisticsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.statistics,
	beforeLoad: () => {
		if (!readSession()) {
			throw redirect({
				to: PATHS.login,
				search: { redirect: PATHS.statistics }
			})
		}
	},
	component: lazyRouteComponent(
		() => import('@modules/statistics/components/StatisticsPage'),
		'StatisticsPage'
	)
})

const quizCreateRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.quizCreate,
	beforeLoad: () => {
		if (!readSession()) {
			throw redirect({
				to: PATHS.login,
				search: { redirect: PATHS.quizCreate }
			})
		}
	},
	component: lazyRouteComponent(
		() => import('@modules/quizzes/components/QuizCreatePage'),
		'QuizCreatePage'
	)
})

const quizDetailsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.quizDetails,
	beforeLoad: ({ location }) => {
		if (!readSession()) {
			throw redirect({
				to: PATHS.login,
				search: { redirect: location.href }
			})
		}
	},
	component: lazyRouteComponent(
		() => import('@modules/quizzes/components/QuizDetailsPage'),
		'QuizDetailsPage'
	)
})

const quizEditRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.quizEdit,
	beforeLoad: ({ location }) => {
		if (!readSession()) {
			throw redirect({ to: PATHS.login, search: { redirect: location.href } })
		}
	},
	component: lazyRouteComponent(
		() => import('@modules/quizzes/components/QuizEditPage'),
		'QuizEditPage'
	)
})

const quizStatsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.quizStats,
	beforeLoad: ({ location }) => {
		if (!readSession()) {
			throw redirect({
				to: PATHS.login,
				search: { redirect: location.href }
			})
		}
	},
	component: lazyRouteComponent(
		() => import('@modules/statistics/components/QuizPlayStatsPage'),
		'QuizPlayStatsPage'
	)
})

const gameStatsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: PATHS.gameStats,
	beforeLoad: ({ location }) => {
		if (!readSession()) {
			throw redirect({
				to: PATHS.login,
				search: { redirect: location.href }
			})
		}
	},
	component: lazyRouteComponent(
		() => import('@modules/statistics/components/GamePlayStatsPage'),
		'GamePlayStatsPage'
	)
})

const routeTree = rootRoute.addChildren([
	indexRoute,
	loginRoute,
	registerRoute,
	dashboardRoute,
	statisticsRoute,
	quizCreateRoute,
	quizDetailsRoute,
	quizStatsRoute,
	gameStatsRoute,
	quizEditRoute
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}
