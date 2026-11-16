import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	redirect,
} from '@tanstack/react-router'
import { z } from 'zod'

import { LoginPage } from '@modules/auth/components/LoginPage'
import { RegisterPage } from '@modules/auth/components/RegisterPage'
import { readSession } from '@modules/auth/store/sessionStore'
import { DashboardPage } from '@modules/dashboard/components/DashboardPage'
import { HomePage } from '@modules/home/components/HomePage'
import { QuizDetailsPage } from '@modules/quizzes/components/QuizDetailsPage'
import { StatisticsPage } from '@modules/statistics/components/StatisticsPage'
import { sanitizeRedirectPath } from '@utils/sanitizeRedirectPath'

const rootRoute = createRootRoute({
	component: () => <Outlet />,
})

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/',
	component: HomePage,
})

const loginSearchSchema = z.object({
	redirect: z.string().optional(),
})

const loginRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/login',
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
	path: '/register',
	beforeLoad: () => {
		const session = readSession()
		if (session) {
			throw redirect({ to: '/dashboard' })
		}
	},
	component: RegisterPage,
})

const dashboardRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/dashboard',
	beforeLoad: () => {
		const session = readSession()
		if (!session) {
			throw redirect({
				to: '/login',
				search: { redirect: '/dashboard' },
			})
		}
	},
	component: DashboardPage,
})

const quizListRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/quizzzes',
	beforeLoad: () => {
		const session = readSession()
		if (!session) {
			throw redirect({
				to: '/login',
				search: { redirect: '/quizzes' },
			})
		}
	},
	component: StatisticsPage,
})

const statisticsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/statistics',
	beforeLoad: () => {
		const session = readSession()
		if (!session) {
			throw redirect({
				to: '/login',
				search: { redirect: '/statistics' },
			})
		}
	},
	component: StatisticsPage,
})

const quizDetailsRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/quizzes/$quizId',
	beforeLoad: ({ location }) => {
		const session = readSession()
		if (!session) {
			throw redirect({
				to: '/login',
				search: { redirect: location.href },
			})
		}
	},
	component: QuizDetailsPage,
})

const routeTree = rootRoute.addChildren([
	indexRoute,
	loginRoute,
	registerRoute,
	dashboardRoute,
	statisticsRoute,
	quizListRoute,
	quizDetailsRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}
