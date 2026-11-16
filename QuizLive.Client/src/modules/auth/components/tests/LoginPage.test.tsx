import { screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { LoginPage } from '@modules/auth/components/LoginPage'
import { renderWithTheme } from '@src/test/testUtils'

vi.mock('@tanstack/react-router', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@tanstack/react-router')>()
	return {
		...actual,
		Link: ({ children, to }: { children: ReactNode; to: string }) => (
			<a href={to}>{children}</a>
		),
		useNavigate: () => vi.fn(),
		useSearch: () => ({}),
	}
})

vi.mock('@modules/auth/hooks/useLogin', () => ({
	useLogin: () => ({
		mutateAsync: vi.fn(),
		isPending: false,
	}),
}))

describe('LoginPage', () => {
	it('requires user name and password', async () => {
		const user = userEvent.setup()
		renderWithTheme(<LoginPage />)

		await user.click(screen.getByRole('button', { name: /Log in/i }))

		expect(screen.getByText(/User name is required/i)).toBeInTheDocument()
		expect(screen.getByText(/Password is required/i)).toBeInTheDocument()
	})
})
