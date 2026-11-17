import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createGame } from '@modules/game/api/gamesApi'
import { GameStatus } from '@modules/game/constants'

import { ApiError } from '@api/apiError'
import { apiRequest } from '@api/client'
import { HTTP_STATUS } from '@api/httpStatus'

vi.mock('@api/client', () => ({ apiRequest: vi.fn() }))

const apiRequestMock = vi.mocked(apiRequest)

const created = {
	id: 7,
	code: '283646',
	quizId: 3,
	quizTitle: 'STEM basics',
	quizKind: 0,
	status: GameStatus.Lobby,
	createdAtUtc: '2026-11-17T10:00:00Z',
	endedAtUtc: null,
	players: []
}

describe('createGame', () => {
	beforeEach(() => {
		apiRequestMock.mockReset()
	})

	it('creates a game for the quiz as the logged-in host', async () => {
		apiRequestMock.mockResolvedValue(created)

		const game = await createGame(3)

		expect(apiRequestMock).toHaveBeenCalledWith('/games', {
			method: 'POST',
			body: { quizId: 3 }
		})
		expect(game).toEqual(created)
	})

	it('rejects an answer that does not match the contract', async () => {
		apiRequestMock.mockResolvedValue({ id: 7 })

		await expect(createGame(3)).rejects.toThrow()
	})

	it('passes on the error of a quiz that cannot be played, with its status and text', async () => {
		apiRequestMock.mockRejectedValue(
			new ApiError(HTTP_STATUS.CONFLICT, {
				status: HTTP_STATUS.CONFLICT,
				detail: 'The quiz already has an active game.'
			})
		)

		await expect(createGame(3)).rejects.toMatchObject({
			status: HTTP_STATUS.CONFLICT,
			message: 'The quiz already has an active game.'
		})
	})
})
