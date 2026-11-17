import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HostGamePage } from '@modules/game/components/HostGamePage'
import { GameStatus, HOST_GAME_COPY } from '@modules/game/constants'
import { useHostGame } from '@modules/game/hooks/useHostGame'
import type { HostGameResult } from '@modules/game/types'

import { PATHS } from '@config/routes'

import { renderWithTheme } from '@src/test/testUtils'

const navigateMock = vi.fn()
const paramsMock = vi.fn<() => { gameId: string }>()

vi.mock('@tanstack/react-router', () => ({
	Link: ({ children, to }: { children: ReactNode; to: string }) => (
		<a href={to}>{children}</a>
	),
	useNavigate: () => navigateMock,
	useParams: () => paramsMock()
}))

vi.mock('@modules/auth/store/sessionStore', () => ({
	useSession: () => null,
	signOut: vi.fn()
}))

// The hook would open a real connection; the page is tested with what the hook says.
vi.mock('@modules/game/hooks/useHostGame', () => ({
	useHostGame: vi.fn()
}))

const hostGameMock = vi.mocked(useHostGame)

function hostGame(overrides: Partial<HostGameResult> = {}): HostGameResult {
	return {
		game: null,
		status: null,
		players: [],
		currentQuestion: null,
		questionReceivedAtMs: null,
		closedQuestionNumber: null,
		connectionState: 'connecting',
		error: null,
		commands: {
			startGame: vi.fn(),
			showResults: vi.fn(),
			nextQuestion: vi.fn(),
			endGame: vi.fn()
		},
		...overrides
	}
}

describe('the host page', () => {
	beforeEach(() => {
		navigateMock.mockReset()
		hostGameMock.mockReset()
		paramsMock.mockReturnValue({ gameId: '7' })
		hostGameMock.mockReturnValue(hostGame())
	})

	afterEach(cleanup)

	it('connects to the game from the address', () => {
		renderWithTheme(<HostGamePage />)

		expect(hostGameMock).toHaveBeenCalledWith(7)
	})

	it('says it is connecting until the host has joined the game', () => {
		renderWithTheme(<HostGamePage />)

		expect(screen.getByText(HOST_GAME_COPY.connecting)).toBeInTheDocument()
	})

	it('shows the quiz of the game once the host has joined it', () => {
		hostGameMock.mockReturnValue(
			hostGame({
				game: {
					id: 7,
					code: '283646',
					quizId: 3,
					quizTitle: 'STEM basics',
					quizKind: 0
				},
				status: GameStatus.Lobby
			})
		)

		renderWithTheme(<HostGamePage />)

		expect(
			screen.getByRole('heading', { name: 'STEM basics' })
		).toBeInTheDocument()
		expect(
			screen.queryByText(HOST_GAME_COPY.connecting)
		).not.toBeInTheDocument()
	})

	it('shows the text of the server when the host cannot be connected, and lets the host go back', async () => {
		hostGameMock.mockReturnValue(hostGame({ error: 'Game was not found.' }))
		renderWithTheme(<HostGamePage />)

		expect(screen.getByRole('alert')).toHaveTextContent('Game was not found.')
		expect(
			screen.queryByText(HOST_GAME_COPY.connecting)
		).not.toBeInTheDocument()

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: HOST_GAME_COPY.backToQuizzes }))

		expect(navigateMock).toHaveBeenCalledWith({ to: PATHS.dashboard })
	})

	it('does not connect for an address that is not a game id, and lets the host go back', async () => {
		paramsMock.mockReturnValue({ gameId: 'abc' })
		renderWithTheme(<HostGamePage />)

		expect(screen.getByRole('alert')).toHaveTextContent(
			HOST_GAME_COPY.invalidGame
		)
		expect(hostGameMock).not.toHaveBeenCalled()

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: HOST_GAME_COPY.backToQuizzes }))

		expect(navigateMock).toHaveBeenCalledWith({ to: PATHS.dashboard })
	})
})
