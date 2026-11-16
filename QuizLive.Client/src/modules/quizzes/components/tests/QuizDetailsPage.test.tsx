import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { QuizDetailsProps } from '@modules/quizzes/components/QuizDetails'
import { QuizDetailsPage } from '@modules/quizzes/components/QuizDetailsPage'
import { QUIZ_DETAILS_COPY } from '@modules/quizzes/constants'

import { renderWithTheme } from '@src/test/testUtils'

const navigateMock = vi.fn()
const paramsMock = vi.fn<() => { quizId: string }>()

vi.mock('@tanstack/react-router', () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
	useNavigate: () => navigateMock,
	useParams: () => paramsMock()
}))

vi.mock('@modules/auth', () => ({
	useSession: () => null,
	signOut: vi.fn()
}))

// QuizDetails is tested on its own; here only what the page passes to it.
vi.mock('@modules/quizzes/components/QuizDetails', () => ({
	QuizDetails: ({ quizId, onDeleted, onBack }: QuizDetailsProps) => (
		<div>
			<p>Details of quiz {quizId}</p>
			<button type='button' onClick={onDeleted}>
				Simulate delete
			</button>
			<button type='button' onClick={onBack}>
				Simulate back
			</button>
		</div>
	)
}))

describe('QuizDetailsPage', () => {
	beforeEach(() => {
		navigateMock.mockReset()
		paramsMock.mockReturnValue({ quizId: '7' })
	})

	afterEach(() => {
		cleanup()
	})

	it('shows the quiz from the URL inside the host layout', () => {
		renderWithTheme(<QuizDetailsPage />)

		expect(
			screen.getByRole('heading', { name: QUIZ_DETAILS_COPY.pageTitle })
		).toBeInTheDocument()
		expect(screen.getByText('Details of quiz 7')).toBeInTheDocument()
	})

	it.each(['delete', 'back'])(
		'returns to the list after "%s"',
		async action => {
			const user = userEvent.setup()
			renderWithTheme(<QuizDetailsPage />)

			await user.click(
				screen.getByRole('button', { name: `Simulate ${action}` })
			)

			expect(navigateMock).toHaveBeenCalledWith({ to: '/dashboard' })
		}
	)

	it.each(['abc', '0', '-1', '1.5'])(
		'shows not found for the id "%s" without loading it',
		async quizId => {
			const user = userEvent.setup()
			paramsMock.mockReturnValue({ quizId })
			renderWithTheme(<QuizDetailsPage />)

			await user.click(
				screen.getByRole('button', { name: QUIZ_DETAILS_COPY.notFound.back })
			)

			expect(
				screen.getByText(QUIZ_DETAILS_COPY.notFound.title)
			).toBeInTheDocument()
			expect(screen.queryByText(/Details of quiz/)).not.toBeInTheDocument()
			expect(navigateMock).toHaveBeenCalledWith({ to: '/dashboard' })
		}
	)
})
