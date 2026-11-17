import { cleanup, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { PATHS, pathTo } from '@config/routes'

import { router } from '@src/router'
import { renderApp } from '@src/test/renderApp'

describe('App', () => {
	afterEach(() => {
		cleanup()
	})

	it('renders the home heading', async () => {
		await renderApp()
		expect(
			await screen.findByRole('heading', { name: /QuizLive Game Server/i })
		).toBeInTheDocument()
	})

	it('sends a signed-out visitor of a quiz to login and back afterwards', async () => {
		await renderApp(pathTo.quizDetails(7))

		expect(
			await screen.findByRole('heading', { name: /Log in/i })
		).toBeInTheDocument()
		await waitFor(() => {
			expect(router.state.location.search).toEqual({
				redirect: pathTo.quizDetails(7)
			})
		})
	})

	it('sends a signed-out visitor of the creation page to login and back afterwards', async () => {
		await renderApp(PATHS.quizCreate)

		expect(
			await screen.findByRole('heading', { name: /Log in/i })
		).toBeInTheDocument()
		await waitFor(() => {
			expect(router.state.location.search).toEqual({
				redirect: PATHS.quizCreate
			})
		})
	})
})
