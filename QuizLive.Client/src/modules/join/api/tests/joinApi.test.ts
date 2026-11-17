import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchGameByCode, joinGame } from '@modules/join/api/joinApi'

import { ApiError } from '@api/apiError'
import { apiRequest } from '@api/client'
import { HTTP_STATUS } from '@api/httpStatus'

vi.mock('@api/client', () => ({ apiRequest: vi.fn() }))

const apiRequestMock = vi.mocked(apiRequest)

const lookup = { code: '283646', quizTitle: 'STEM basics', status: 0 }

const joined = { gameId: 7, playerId: 1, nickname: 'Ann', token: 'a1b2c3' }

describe('joinApi', () => {
	beforeEach(() => {
		apiRequestMock.mockReset()
	})

	describe('fetchGameByCode', () => {
		it('asks for the game of the code without sending a token', async () => {
			apiRequestMock.mockResolvedValue(lookup)

			const game = await fetchGameByCode('283646')

			expect(apiRequestMock).toHaveBeenCalledWith('/games/code/283646', {
				skipAuth: true
			})
			expect(game).toEqual(lookup)
		})

		it('writes the code safely into the URL', async () => {
			apiRequestMock.mockResolvedValue(lookup)

			await fetchGameByCode('12 /3')

			expect(apiRequestMock.mock.calls[0]?.[0]).toBe('/games/code/12%20%2F3')
		})

		it('rejects an answer that does not match the contract', async () => {
			apiRequestMock.mockResolvedValue({ code: '283646' })

			await expect(fetchGameByCode('283646')).rejects.toThrow()
		})

		it('passes on the error of an unknown code with its status', async () => {
			apiRequestMock.mockRejectedValue(
				new ApiError(HTTP_STATUS.NOT_FOUND, {
					status: HTTP_STATUS.NOT_FOUND,
					detail: 'Game with code 111111 was not found.'
				})
			)

			await expect(fetchGameByCode('111111')).rejects.toMatchObject({
				status: HTTP_STATUS.NOT_FOUND,
				message: 'Game with code 111111 was not found.'
			})
		})
	})

	describe('joinGame', () => {
		it('posts the nickname to the players of the game, without a token', async () => {
			apiRequestMock.mockResolvedValue(joined)

			const response = await joinGame('283646', { nickname: 'Ann' })

			expect(apiRequestMock).toHaveBeenCalledWith(
				'/games/code/283646/players',
				{
					method: 'POST',
					body: { nickname: 'Ann' },
					skipAuth: true
				}
			)
			expect(response.token).toBe('a1b2c3')
		})

		it('rejects an answer without a player token', async () => {
			apiRequestMock.mockResolvedValue({
				gameId: 7,
				playerId: 1,
				nickname: 'Ann'
			})

			await expect(joinGame('283646', { nickname: 'Ann' })).rejects.toThrow()
		})

		it.each([
			[
				HTTP_STATUS.CONFLICT,
				'The nickname "Ann" is already taken in this game.'
			],
			[HTTP_STATUS.CONFLICT, 'The game has already started.'],
			[HTTP_STATUS.NOT_FOUND, 'Game with code 283646 was not found.'],
			[HTTP_STATUS.BAD_REQUEST, 'Nickname is required.']
		])(
			'passes on the error %i with the text of the server: %s',
			async (status, detail) => {
				apiRequestMock.mockRejectedValue(
					new ApiError(status, { status, detail })
				)

				await expect(
					joinGame('283646', { nickname: 'Ann' })
				).rejects.toMatchObject({ status, message: detail })
			}
		)
	})
})
