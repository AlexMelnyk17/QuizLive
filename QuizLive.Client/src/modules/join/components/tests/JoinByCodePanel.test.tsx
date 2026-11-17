import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GameStatus } from '@modules/game/constants'
import { fetchGameByCode } from '@modules/join/api/joinApi'
import { JoinByCodePanel } from '@modules/join/components/JoinByCodePanel'
import { JOIN_GAME_CODE_LENGTH, JOIN_PANEL_COPY } from '@modules/join/constants'
import type { GameLookupDto } from '@modules/join/types'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

import { renderWithQuery } from '@src/test/testUtils'

vi.mock('@modules/join/api/joinApi', () => ({ fetchGameByCode: vi.fn() }))

const fetchMock = vi.mocked(fetchGameByCode)

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

	it('shows the game that the code belongs to and lets the player go on', async () => {
		fetchMock.mockResolvedValue(lobbyGame)
		const onContinue = vi.fn()
		renderWithQuery(<JoinByCodePanel onContinue={onContinue} />)

		const user = await typeCode('283646')

		expect(
			await screen.findByText(JOIN_PANEL_COPY.found('STEM basics'))
		).toBeInTheDocument()
		expect(fetchMock).toHaveBeenCalledWith('283646')

		await user.click(screen.getByRole('button', { name: /Join game/i }))

		expect(onContinue).toHaveBeenCalledWith(lobbyGame)
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
