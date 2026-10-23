import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderApp } from '@src/test/renderApp'

describe('App', () => {
	it('renders the home heading', async () => {
		await renderApp()
		expect(
			await screen.findByRole('heading', { name: /QuizLive Game Server/i })
		).toBeInTheDocument()
	})
})
