import { act, cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	GameStatus,
	PLAYER_LOBBY_COPY,
	PLAYER_PAGE_COPY
} from '@modules/game/constants'
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

	describe('while the game has not started', () => {
		const joinedPlayer = {
			gameId: 7,
			code: '283646',
			quizTitle: 'STEM basics',
			playerId: 1,
			nickname: 'Ann'
		}

		it('tells the player to wait for the host', async () => {
			playerGameMock.mockReturnValue(
				playerGame({ player: joinedPlayer, status: GameStatus.Lobby })
			)

			await renderApp(PATHS.play)

			expect(
				await screen.findByText(PLAYER_LOBBY_COPY.waitingForHost)
			).toBeInTheDocument()
		})

		it('lists the players in the lobby and lets the player leave', async () => {
			const leave = vi.fn()
			playerGameMock.mockReturnValue(
				playerGame({
					player: joinedPlayer,
					status: GameStatus.Lobby,
					players: [
						{ id: 1, nickname: 'Ann', joinedAtUtc: '2026-11-17T10:00:00Z' },
						{ id: 2, nickname: 'Bob', joinedAtUtc: '2026-11-17T10:00:10Z' }
					],
					connectionState: 'connected',
					leave
				})
			)

			await renderApp(PATHS.play)

			expect(await screen.findAllByRole('listitem')).toHaveLength(2)
			expect(screen.getByText('Bob')).toBeInTheDocument()

			await userEvent
				.setup()
				.click(screen.getByRole('button', { name: PLAYER_LOBBY_COPY.leave }))

			expect(leave).toHaveBeenCalledOnce()
		})

		it.each([
			['a question is open', GameStatus.Question],
			['the results are shown', GameStatus.Results],
			['the game is over', GameStatus.Finished]
		])('does not tell the player to wait when %s', async (_name, status) => {
			playerGameMock.mockReturnValue(
				playerGame({ player: joinedPlayer, status })
			)

			await renderApp(PATHS.play)

			await screen.findByRole('heading', {
				name: PLAYER_PAGE_COPY.joined('Ann')
			})
			expect(
				screen.queryByText(PLAYER_LOBBY_COPY.waitingForHost)
			).not.toBeInTheDocument()
		})
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
