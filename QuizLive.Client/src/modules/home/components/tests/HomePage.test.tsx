import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { HomePage } from '@modules/home/components/HomePage'
import { renderWithTheme } from '@src/test/testUtils'

vi.mock('@tanstack/react-router', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@tanstack/react-router')>()
	return {
		...actual,
		Link: ({ children, to }: { children: ReactNode; to: string }) => (
			<a href={to}>{children}</a>
		),
		useNavigate: () => vi.fn(),
	}
})

vi.mock('@modules/auth', () => ({
	useSession: () => null,
}))

describe('HomePage', () => {
	it('shows join note and auth links without fetching', () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch')
		renderWithTheme(<HomePage />)

		expect(
			screen.getByRole('heading', { name: /QuizLive Game Server/i })
		).toBeInTheDocument()
		expect(
			screen.getByText(/Joining with a code is not available yet/i)
		).toBeInTheDocument()
		expect(screen.getByRole('group', { name: /game code/i })).toBeInTheDocument()
		expect(screen.getByRole('link', { name: /Log in/i })).toHaveAttribute(
			'href',
			'/login'
		)
		expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute(
			'href',
			'/register'
		)
		expect(fetchSpy).not.toHaveBeenCalled()
		fetchSpy.mockRestore()
	})
})
