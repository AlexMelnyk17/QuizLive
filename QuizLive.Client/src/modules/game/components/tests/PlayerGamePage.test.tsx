import { act, cleanup, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PLAYER_PAGE_COPY } from '@modules/game/constants'
import { usePlayerGame } from '@modules/game/hooks/usePlayerGame'
import { usePlayerTokenStore } from '@modules/game/store/playerTokenStore'
import type { PlayerGameResult } from '@modules/game/types'

import { PATHS } from '@config/routes'

import { router } from '@src/router'
import { renderApp } from '@src/test/renderApp'
import { LAZY_UI_TIMEOUT_MS } from '@src/test/testUtils'

// The hook would open a real connection; the page is tested with what the hook says.
vi.mock('@modules/game/hooks/usePlayerGame', () => ({
	usePlayerGame: vi.fn()
}))

const playerGameMock = vi.mocked(usePlayerGame)

function playerGame(
	overrides: Partial<PlayerGameResult> = {}
): PlayerGameResult {
	return {
		hasToken: true,
		player: null,
		status: null,
		players: [],
		currentQuestion: null,
		questionReceivedAtMs: null,
		closedQuestionNumber: null,
		connectionState: 'connecting',
		error: null,
		leave: vi.fn(),
		...overrides
	}
}

describe('the player page', () => {
	beforeEach(() => {
		sessionStorage.clear()
		usePlayerTokenStore.setState({ playerToken: 'token-1' })
		playerGameMock.mockReset()
		playerGameMock.mockReturnValue(playerGame())
	})

	afterEach(cleanup)

	it('sends a visitor without a player token to the home page', async () => {
		usePlayerTokenStore.setState({ playerToken: null })

		await renderApp(PATHS.play)

		expect(
			await screen.findByRole('heading', { name: /QuizLive Game Server/i })
		).toBeInTheDocument()
		expect(router.state.location.pathname).toBe(PATHS.home)
		expect(playerGameMock).not.toHaveBeenCalled()
	})

	it('says it is connecting until the player has joined the game', async () => {
		await renderApp(PATHS.play)

		expect(
			await screen.findByText(PLAYER_PAGE_COPY.connecting)
		).toBeInTheDocument()
	})

	it('confirms the join with the nickname, the quiz and the game code', async () => {
		playerGameMock.mockReturnValue(
			playerGame({
				player: {
					gameId: 7,
					code: '283646',
					quizTitle: 'STEM basics',
					playerId: 1,
					nickname: 'Ann'
				}
			})
		)

		await renderApp(PATHS.play)

		expect(
			await screen.findByRole('heading', {
				name: PLAYER_PAGE_COPY.joined('Ann')
			})
		).toBeInTheDocument()
		expect(screen.getByText('STEM basics')).toBeInTheDocument()
		expect(
			screen.getByText(PLAYER_PAGE_COPY.gameCode('283646'))
		).toBeInTheDocument()
	})

	it('shows the text of the server when the player cannot be connected', async () => {
		playerGameMock.mockReturnValue(
			playerGame({ error: 'Player was not found.' })
		)

		await renderApp(PATHS.play)

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Player was not found.'
		)
	})

	it('goes home when the player token is gone, e.g. the player left', async () => {
		playerGameMock.mockReturnValue(playerGame({ hasToken: false }))

		// The router is shared between tests and may still be on the player page from the last one,
		// so the visit starts from the home page, like a real one.
		await renderApp(PATHS.home)
		await act(() => router.navigate({ href: PATHS.play }))

		// The home page is loaded lazily, so it may take longer than the default wait to appear.
		expect(
			await screen.findByRole(
				'heading',
				{ name: /QuizLive Game Server/i },
				{ timeout: LAZY_UI_TIMEOUT_MS }
			)
		).toBeInTheDocument()
		expect(router.state.location.pathname).toBe(PATHS.home)
	})
})
