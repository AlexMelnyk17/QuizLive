import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ThemeProvider } from '@theme/ThemeProvider'

import App from '@src/App'

describe('App', () => {
	it('renders the heading', () => {
		render(
			<ThemeProvider>
				<App />
			</ThemeProvider>
		)
		expect(
			screen.getByRole('heading', { name: /QuizLive Game Server/i })
		).toBeInTheDocument()
	})
})
