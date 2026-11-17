import { act, cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
	GameStatus,
	PLAYER_LOBBY_COPY,
	PLAYER_PAGE_COPY,
	PLAYER_QUESTION_COPY
} from '@modules/game/constants'
import { usePlayerGame } from '@modules/game/hooks/usePlayerGame'
import { usePlayerTokenStore } from '@modules/game/store/playerTokenStore'
import type { PlayerGameResult, PlayerQuestionDto } from '@modules/game/types'

import { PATHS } from '@config/routes'

import { router } from '@src/router'
import { renderApp } from '@src/test/renderApp'
import { LAZY_UI_TIMEOUT_MS } from '@src/test/testUtils'

// The hook would open a real connection; the page is tested with what the hook says.
vi.mock('@modules/game/hooks/usePlayerGame', () => ({
	usePlayerGame: vi.fn()
}))

const playerGameMock = vi.mocked(usePlayerGame)

const joinedPlayer = {
	gameId: 7,
	code: '283646',
	quizTitle: 'STEM basics',
	playerId: 1,
	nickname: 'Ann'
}

// A question without a time limit, so no countdown timer runs in these tests.
const question: PlayerQuestionDto = {
	number: 2,
	total: 5,
	text: 'What is 2 + 2?',
	imageUrl: null,
	timeLimitSeconds: null,
	options: [
		{ id: 21, order: 1, text: '4' },
		{ id: 22, order: 2, text: '5' }
	],
	timing: {
		startedAtUtc: '2026-11-17T10:00:00Z',
		endsAtUtc: null,
		serverNowUtc: '2026-11-17T10:00:05Z'
	}
}

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

	describe('while the game has not started', () => {
		it('shows the lobby with who the player is, the quiz and the game code', async () => {
			playerGameMock.mockReturnValue(
				playerGame({ player: joinedPlayer, status: GameStatus.Lobby })
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
	})

	describe('while a question is open', () => {
		it('shows the question with its options, and no waiting message', async () => {
			playerGameMock.mockReturnValue(
				playerGame({
					player: joinedPlayer,
					status: GameStatus.Question,
					currentQuestion: question,
					questionReceivedAtMs: 1000
				})
			)

			await renderApp(PATHS.play)

			expect(
				await screen.findByRole('heading', {
					name: PLAYER_QUESTION_COPY.heading(2, 5)
				})
			).toBeInTheDocument()
			expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument()
			expect(screen.getAllByRole('listitem')).toHaveLength(2)
			expect(
				screen.queryByText(PLAYER_LOBBY_COPY.waitingForHost)
			).not.toBeInTheDocument()
		})
	})

	describe('while the results are shown', () => {
		it('tells the player to wait for the next question', async () => {
			playerGameMock.mockReturnValue(
				playerGame({
					player: joinedPlayer,
					status: GameStatus.Results,
					currentQuestion: question,
					closedQuestionNumber: 2
				})
			)

			await renderApp(PATHS.play)

			expect(
				await screen.findByText(PLAYER_QUESTION_COPY.closed)
			).toBeInTheDocument()
			expect(
				screen.queryByText(PLAYER_LOBBY_COPY.waitingForHost)
			).not.toBeInTheDocument()
		})
	})

	describe('when the game is over', () => {
		it('says so and lets the player go back to the start', async () => {
			const leave = vi.fn()
			playerGameMock.mockReturnValue(
				playerGame({ player: joinedPlayer, status: GameStatus.Finished, leave })
			)

			await renderApp(PATHS.play)

			expect(
				await screen.findByRole('heading', { name: PLAYER_PAGE_COPY.finished })
			).toBeInTheDocument()

			await userEvent
				.setup()
				.click(
					screen.getByRole('button', { name: PLAYER_PAGE_COPY.backToStart })
				)

			expect(leave).toHaveBeenCalledOnce()
		})
	})

	describe('when the player cannot be connected', () => {
		it('shows the text of the server', async () => {
			playerGameMock.mockReturnValue(
				playerGame({ error: 'Player was not found.' })
			)

			await renderApp(PATHS.play)

			expect(await screen.findByRole('alert')).toHaveTextContent(
				'Player was not found.'
			)
			expect(
				screen.queryByText(PLAYER_PAGE_COPY.connecting)
			).not.toBeInTheDocument()
		})

		it('lets the player go back to the start', async () => {
			const leave = vi.fn()
			playerGameMock.mockReturnValue(
				playerGame({ error: 'Player was not found.', leave })
			)

			await renderApp(PATHS.play)
			await userEvent.setup().click(
				await screen.findByRole('button', {
					name: PLAYER_PAGE_COPY.backToStart
				})
			)

			expect(leave).toHaveBeenCalledOnce()
		})
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
