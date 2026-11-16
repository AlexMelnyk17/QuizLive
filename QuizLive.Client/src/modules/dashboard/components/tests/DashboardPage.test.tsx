import { screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { QUIZZES_LIST_COMING_SOON_MESSAGE } from '@modules/dashboard/constants'
import { DashboardPage } from '@modules/dashboard/components/DashboardPage'
import { renderWithTheme } from '@src/test/testUtils'

vi.mock('@tanstack/react-router', () => ({
	Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
	useNavigate: () => vi.fn(),
}))

vi.mock('@modules/auth', () => ({
	useSession: () => ({
		token: 't',
		expiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
		user: { id: '1', userName: 'quizzer' },
	}),
	signOut: vi.fn(),
}))

describe('DashboardPage', () => {
	it('shows coming soon message without loading quizzes', () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch')
		renderWithTheme(<DashboardPage />)

		expect(
			screen.getByRole('heading', { name: /My quizzes/i })
		).toBeInTheDocument()
		expect(screen.getByText(QUIZZES_LIST_COMING_SOON_MESSAGE)).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /Create quiz \(not available yet\)/i })
		).toBeDisabled()
		expect(screen.getByRole('link', { name: /Statistics/i })).toHaveAttribute(
			'href',
			'/statistics'
		)
		expect(fetchSpy).not.toHaveBeenCalled()
		fetchSpy.mockRestore()
	})
})
