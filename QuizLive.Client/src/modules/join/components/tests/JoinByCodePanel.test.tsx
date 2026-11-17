import { cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GameStatus } from '@modules/game/constants'
import { usePlayerTokenStore } from '@modules/game/store/playerTokenStore'
import { fetchGameByCode, joinGame } from '@modules/join/api/joinApi'
import { JoinByCodePanel } from '@modules/join/components/JoinByCodePanel'
import {
	JOIN_FORM_COPY,
	JOIN_GAME_CODE_LENGTH,
	JOIN_PANEL_COPY
} from '@modules/join/constants'
import type { GameLookupDto } from '@modules/join/types'

import { PATHS } from '@config/routes'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

import { renderWithQuery } from '@src/test/testUtils'

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }))

vi.mock('@tanstack/react-router', async importOriginal => {
	const actual = await importOriginal<typeof import('@tanstack/react-router')>()

	return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('@modules/join/api/joinApi', () => ({
	fetchGameByCode: vi.fn(),
	joinGame: vi.fn()
}))

const fetchMock = vi.mocked(fetchGameByCode)
const joinMock = vi.mocked(joinGame)

const lobbyGame: GameLookupDto = {
	code: '283646',
	quizTitle: 'STEM basics',
	status: GameStatus.Lobby
}

async function typeCode(code: string) {
	const user = userEvent.setup()

	await user.click(screen.getAllByRole('textbox')[0])
	await user.keyboard(code)

	return user
}

describe('JoinByCodePanel', () => {
	beforeEach(() => {
		fetchMock.mockReset()
		joinMock.mockReset()
		navigateMock.mockReset()
		sessionStorage.clear()
		usePlayerTokenStore.setState({ playerToken: null })
	})

	afterEach(cleanup)

	it('renders PinInput cells for the game code', () => {
		renderWithQuery(<JoinByCodePanel />)

		expect(
			screen.getByRole('group', { name: /game code/i })
		).toBeInTheDocument()
		expect(screen.getAllByRole('textbox')).toHaveLength(JOIN_GAME_CODE_LENGTH)
		expect(screen.getByRole('button', { name: /Join game/i })).toBeDisabled()
	})

	it('does not ask the server while the code is incomplete', async () => {
		renderWithQuery(<JoinByCodePanel />)

		await typeCode('28364')

		expect(fetchMock).not.toHaveBeenCalled()
		expect(screen.getByRole('button', { name: /Join game/i })).toBeDisabled()
	})

	it('says it is looking for the game while the server answers', async () => {
		fetchMock.mockReturnValue(new Promise(() => {}))
		renderWithQuery(<JoinByCodePanel />)

		await typeCode('283646')

		expect(
			await screen.findByRole('status', { name: JOIN_PANEL_COPY.looking })
		).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Join game/i })).toBeDisabled()
	})

	it('shows the game that the code belongs to', async () => {
		fetchMock.mockResolvedValue(lobbyGame)
		renderWithQuery(<JoinByCodePanel />)

		await typeCode('283646')

		expect(
			await screen.findByText(JOIN_PANEL_COPY.found('STEM basics'))
		).toBeInTheDocument()
		expect(fetchMock).toHaveBeenCalledWith('283646')
		expect(screen.getByRole('button', { name: /Join game/i })).toBeEnabled()
	})

	it('says so when no active game has the code', async () => {
		fetchMock.mockRejectedValue(
			new ApiError(HTTP_STATUS.NOT_FOUND, {
				status: HTTP_STATUS.NOT_FOUND,
				detail: 'Game with code 111111 was not found.'
			})
		)
		renderWithQuery(<JoinByCodePanel />)

		await typeCode('111111')

		expect(
			await screen.findByText(JOIN_PANEL_COPY.notFound)
		).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Join game/i })).toBeDisabled()
	})

	it('does not let the player go on with a game that has already started', async () => {
		fetchMock.mockResolvedValue({ ...lobbyGame, status: GameStatus.Question })
		renderWithQuery(<JoinByCodePanel />)

		await typeCode('283646')

		expect(await screen.findByText(JOIN_PANEL_COPY.started)).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Join game/i })).toBeDisabled()
	})

	it('says the game could not be looked up when the connection fails', async () => {
		fetchMock.mockRejectedValue(new Error('Failed to fetch'))
		renderWithQuery(<JoinByCodePanel />)

		await typeCode('283646')

		expect(
			await screen.findByText(JOIN_PANEL_COPY.lookupError)
		).toBeInTheDocument()
	})

	describe('joining the game', () => {
		async function goToNicknameStep() {
			fetchMock.mockResolvedValue(lobbyGame)
			renderWithQuery(<JoinByCodePanel />)
			const user = await typeCode('283646')
			await screen.findByText(JOIN_PANEL_COPY.found('STEM basics'))
			await user.click(screen.getByRole('button', { name: /Join game/i }))

			return user
		}

		async function enterNicknameAndJoin(
			user: ReturnType<typeof userEvent.setup>,
			nickname: string
		) {
			await user.type(
				await screen.findByLabelText(JOIN_FORM_COPY.nicknameLabel),
				nickname
			)
			await user.click(
				screen.getByRole('button', { name: JOIN_FORM_COPY.submit })
			)
		}

		it('asks for a nickname once the player goes on with the code', async () => {
			await goToNicknameStep()

			expect(
				await screen.findByText(JOIN_FORM_COPY.joining('STEM basics'))
			).toBeInTheDocument()
			expect(screen.queryAllByRole('textbox')).toHaveLength(1)
		})

		it('goes back to the code and keeps what was typed', async () => {
			const user = await goToNicknameStep()
			await screen.findByLabelText(JOIN_FORM_COPY.nicknameLabel)

			await user.click(
				screen.getByRole('button', { name: JOIN_FORM_COPY.back })
			)

			expect(screen.getAllByRole('textbox')).toHaveLength(JOIN_GAME_CODE_LENGTH)
			expect(
				await screen.findByText(JOIN_PANEL_COPY.found('STEM basics'))
			).toBeInTheDocument()
		})

		it('joins, keeps the player token and opens the player page', async () => {
			joinMock.mockResolvedValue({
				gameId: 7,
				playerId: 1,
				nickname: 'Ann',
				token: 'a1b2c3'
			})
			const user = await goToNicknameStep()

			await enterNicknameAndJoin(user, 'Ann')

			await waitFor(() =>
				expect(navigateMock).toHaveBeenCalledWith({ to: PATHS.play })
			)
			expect(joinMock).toHaveBeenCalledWith('283646', { nickname: 'Ann' })
			expect(usePlayerTokenStore.getState().playerToken).toBe('a1b2c3')
		})

		it('stays on the form with the text of the server when the nickname is taken', async () => {
			joinMock.mockRejectedValue(
				new ApiError(HTTP_STATUS.CONFLICT, {
					status: HTTP_STATUS.CONFLICT,
					detail: 'The nickname "Ann" is already taken in this game.'
				})
			)
			const user = await goToNicknameStep()

			await enterNicknameAndJoin(user, 'Ann')

			expect(await screen.findByRole('alert')).toHaveTextContent(
				'The nickname "Ann" is already taken in this game.'
			)
			expect(navigateMock).not.toHaveBeenCalled()
			expect(usePlayerTokenStore.getState().playerToken).toBeNull()
		})
	})

	it('forgets the game when the code is changed', async () => {
		fetchMock.mockResolvedValue(lobbyGame)
		renderWithQuery(<JoinByCodePanel />)
		const user = await typeCode('283646')
		await screen.findByText(JOIN_PANEL_COPY.found('STEM basics'))

		await user.keyboard('{Backspace}')

		expect(
			screen.queryByText(JOIN_PANEL_COPY.found('STEM basics'))
		).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Join game/i })).toBeDisabled()
	})
})
