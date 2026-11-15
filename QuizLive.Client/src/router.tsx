import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	redirect,
} from '@tanstack/react-router'
import { z } from 'zod'

import { LoginPage, readSession, RegisterPage } from '@modules/auth'
import { DashboardPage } from '@modules/dashboard'
import { HomePage } from '@modules/home'
import { StatisticsPage } from '@modules/statistics'
import { sanitizeRedirectPath } from '@shared/redirect'

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

const routeTree = rootRoute.addChildren([
	indexRoute,
	loginRoute,
	registerRoute,
	dashboardRoute,
	statisticsRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}
