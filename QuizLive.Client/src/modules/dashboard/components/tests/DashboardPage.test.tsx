import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DASHBOARD_LAYOUT_COPY } from '@layout/constants'

import { DashboardPage } from '@modules/dashboard/components/DashboardPage'
import type { QuizListProps } from '@modules/quizzes/components/QuizList'

import { PATHS } from '@config/routes'

import { renderWithTheme } from '@src/test/testUtils'

const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
	Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
	useNavigate: () => navigateMock
}))

vi.mock('@modules/auth/store/sessionStore', () => ({
	useSession: () => ({
		token: 't',
		expiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
		user: { id: '1', userName: 'quizzer' }
	}),
	signOut: vi.fn()
}))

// The list itself is tested in the quizzes module; here only its wiring into the page.
vi.mock('@modules/quizzes/components/QuizList', () => ({
	QuizList: ({ onOpenQuiz, onCreateQuiz }: QuizListProps) => (
		<>
			<button type='button' onClick={() => onOpenQuiz?.(7)}>
				Open quiz 7
			</button>
			<button type='button' onClick={onCreateQuiz}>
				Create from the empty list
			</button>
		</>
	)
}))

describe('DashboardPage', () => {
	afterEach(() => {
		cleanup()
	})

	it('shows the quiz list inside the host layout', async () => {
		renderWithTheme(<DashboardPage />)

		expect(
			screen.getByRole('heading', { name: /My quizzes/i })
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Open quiz 7' })
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: DASHBOARD_LAYOUT_COPY.openMenu })
		).toBeEnabled()
		await userEvent
			.setup()
			.click(
				screen.getByRole('button', { name: DASHBOARD_LAYOUT_COPY.openMenu })
			)
		expect(
			screen.queryByRole('link', { name: DASHBOARD_LAYOUT_COPY.createQuiz })
		).not.toBeInTheDocument()
		expect(screen.getByRole('link', { name: /Statistics/i })).toHaveAttribute(
			'href',
			PATHS.statistics
		)
	})

	it.each([['the empty list', 'Create from the empty list']])(
		'opens the creation page from %s',
		async (_, buttonName) => {
			const user = userEvent.setup()
			renderWithTheme(<DashboardPage />)

			await user.click(screen.getByRole('button', { name: buttonName }))

			expect(navigateMock).toHaveBeenCalledWith({ to: PATHS.quizCreate })
		}
	)

	it('opens the details of a quiz', async () => {
		const user = userEvent.setup()
		renderWithTheme(<DashboardPage />)

		await user.click(screen.getByRole('button', { name: 'Open quiz 7' }))

		expect(navigateMock).toHaveBeenCalledWith({
			to: PATHS.quizDetails,
			params: { quizId: '7' }
		})
	})
})
