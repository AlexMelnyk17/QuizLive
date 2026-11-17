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
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DashboardLayout } from '@layout/DashboardLayout/DashboardLayout'

import { signOut } from '@modules/auth/store/sessionStore'

import { PATHS } from '@config/routes'

import { renderWithTheme } from '@src/test/testUtils'

vi.mock('@modules/auth/store/sessionStore', () => ({
	useSession: () => ({ user: { userName: 'quizzer' } }),
	signOut: vi.fn()
}))
afterEach(() => {
	cleanup()
	vi.clearAllMocks()
})

function renderDashboard() {
	const root = createRootRoute({
		component: () => (
			<DashboardLayout>
				<Outlet />
			</DashboardLayout>
		)
	})
	const routes = [
		PATHS.dashboard,
		PATHS.statistics,
		PATHS.quizCreate,
		PATHS.home
	].map(path =>
		createRoute({
			getParentRoute: () => root,
			path,
			component: () => <button>Outside action</button>
		})
	)
	const router = createRouter({
		routeTree: root.addChildren(routes),
		history: createMemoryHistory({ initialEntries: [PATHS.dashboard] })
	})
	renderWithTheme(<RouterProvider router={router} />)
	return router
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
	const trigger = await screen.findByRole('button', { name: 'Open navigation' })
	await user.click(trigger)
	return trigger
}

describe('Dashboard navigation', () => {
	it('opens from the keyboard, focuses navigation and returns focus on Escape', async () => {
		const user = userEvent.setup()
		renderDashboard()
		const trigger = await screen.findByRole('button', {
			name: 'Open navigation'
		})
		expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
		trigger.focus()
		await user.keyboard('{Enter}')
		expect(trigger).toHaveAttribute('aria-expanded', 'true')
		expect(screen.getByRole('link', { name: 'My quizzes' })).toHaveFocus()
		expect(screen.getByRole('link', { name: 'My quizzes' })).toHaveAttribute(
			'aria-current',
			'page'
		)
		expect(screen.getByText('quizzer')).toBeInTheDocument()
		expect(screen.getByRole('combobox', { name: 'Theme' })).toBeInTheDocument()
		await user.keyboard('{Escape}')
		expect(trigger).toHaveFocus()
		expect(trigger).toHaveAttribute('aria-expanded', 'false')
	})
	it('closes when clicking outside, tabbing out, or toggling the trigger', async () => {
		const user = userEvent.setup()
		renderDashboard()
		await openMenu(user)
		await user.click(screen.getByRole('button', { name: 'Outside action' }))
		expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
		await openMenu(user)
		await user.click(screen.getByRole('button', { name: 'Close navigation' }))
		expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
		await openMenu(user)
		await user.click(screen.getByRole('combobox', { name: 'Theme' }))
		await user.tab()
		expect(screen.getByRole('button', { name: 'Outside action' })).toHaveFocus()
		expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
	})
	it.each([['Statistics', PATHS.statistics]])(
		'navigates to %s and closes',
		async (label, path) => {
			const user = userEvent.setup()
			const router = renderDashboard()
			await openMenu(user)
			await user.click(screen.getByRole('link', { name: label }))
			expect(router.state.location.pathname).toBe(path)
			expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
		}
	)
	it('signs out from the account section', async () => {
		const user = userEvent.setup()
		const router = renderDashboard()
		await openMenu(user)
		await user.click(screen.getByRole('button', { name: 'Sign out' }))
		expect(signOut).toHaveBeenCalledOnce()
		expect(router.state.location.pathname).toBe(PATHS.home)
	})
})
