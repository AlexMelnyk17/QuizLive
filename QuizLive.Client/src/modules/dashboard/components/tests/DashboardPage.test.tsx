import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DashboardPage } from '@modules/dashboard/components/DashboardPage'
import type { QuizListProps } from '@modules/quizzes/components/QuizList'

import { renderWithTheme } from '@src/test/testUtils'

const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
	Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
	useNavigate: () => navigateMock
}))

vi.mock('@modules/auth', () => ({
	useSession: () => ({
		token: 't',
		expiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
		user: { id: '1', userName: 'quizzer' }
	}),
	signOut: vi.fn()
}))

// The list itself is tested in the quizzes module; here only its wiring into the page.
vi.mock('@modules/quizzes/components/QuizList', () => ({
	QuizList: ({ onOpenQuiz }: QuizListProps) => (
		<button type='button' onClick={() => onOpenQuiz?.(7)}>
			Open quiz 7
		</button>
	)
}))

describe('DashboardPage', () => {
	afterEach(() => {
		cleanup()
	})

	it('shows the quiz list inside the host layout', () => {
		renderWithTheme(<DashboardPage />)

		expect(
			screen.getByRole('heading', { name: /My quizzes/i })
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: 'Open quiz 7' })
		).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: /Create quiz \(not available yet\)/i })
		).toBeDisabled()
		expect(screen.getByRole('link', { name: /Statistics/i })).toHaveAttribute(
			'href',
			'/statistics'
		)
	})

	it('opens the details of a quiz', async () => {
		const user = userEvent.setup()
		renderWithTheme(<DashboardPage />)

		await user.click(screen.getByRole('button', { name: 'Open quiz 7' }))

		expect(navigateMock).toHaveBeenCalledWith({
			to: '/quizzes/$quizId',
			params: { quizId: '7' }
		})
	})
})
