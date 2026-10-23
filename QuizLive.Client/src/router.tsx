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
			// TanStack Router navigation
			// eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router redirect
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
			// eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router redirect
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
			// eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router redirect
			throw redirect({
				to: '/login',
				search: { redirect: '/dashboard' },
			})
		}
	},
	component: DashboardPage,
})

const routeTree = rootRoute.addChildren([
	indexRoute,
	loginRoute,
	registerRoute,
	dashboardRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}
