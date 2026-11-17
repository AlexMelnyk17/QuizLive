import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { HomePage } from '@modules/home/components/HomePage'
import { JOIN_PANEL_COPY } from '@modules/join/constants'

import { PATHS } from '@config/routes'

import { renderWithQuery } from '@src/test/testUtils'

vi.mock('@tanstack/react-router', async importOriginal => {
	const actual = await importOriginal<typeof import('@tanstack/react-router')>()
	return {
		...actual,
		Link: ({ children, to }: { children: ReactNode; to: string }) => (
			<a href={to}>{children}</a>
		),
		useNavigate: () => vi.fn()
	}
})

vi.mock('@modules/auth/store/sessionStore', () => ({
	useSession: () => null
}))

describe('HomePage', () => {
	it('shows the game code form and auth links without fetching', () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch')
		renderWithQuery(<HomePage />)

		expect(
			screen.getByRole('heading', { name: /QuizLive Game Server/i })
		).toBeInTheDocument()
		expect(screen.getByText(JOIN_PANEL_COPY.intro)).toBeInTheDocument()
		expect(
			screen.getByRole('group', { name: /game code/i })
		).toBeInTheDocument()
		expect(screen.getByRole('link', { name: /Log in/i })).toHaveAttribute(
			'href',
			PATHS.login
		)
		expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute(
			'href',
			PATHS.register
		)
		expect(fetchSpy).not.toHaveBeenCalled()
		fetchSpy.mockRestore()
	})
})
