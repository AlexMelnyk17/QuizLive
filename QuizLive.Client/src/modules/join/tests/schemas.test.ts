import { describe, expect, it } from 'vitest'

import { GameStatus } from '@modules/game/constants'
import {
	JOIN_FORM_COPY,
	JOIN_NICKNAME_MAX_LENGTH,
	gameByCodeQueryKey
} from '@modules/join/constants'
import {
	gameLookupDtoSchema,
	joinFormSchema,
	joinGameResponseSchema
} from '@modules/join/schemas'

describe('join schemas', () => {
	describe('gameLookupDtoSchema', () => {
		it('parses the game a code belongs to', () => {
			const parsed = gameLookupDtoSchema.parse({
				code: '283646',
				quizTitle: 'STEM basics',
				status: GameStatus.Lobby
			})

			expect(parsed.quizTitle).toBe('STEM basics')
			expect(parsed.status).toBe(GameStatus.Lobby)
		})

		it('rejects an unknown status', () => {
			expect(() =>
				gameLookupDtoSchema.parse({
					code: '283646',
					quizTitle: 'STEM basics',
					status: 9
				})
			).toThrow()
		})

		it('rejects an answer without a quiz title', () => {
			expect(() =>
				gameLookupDtoSchema.parse({ code: '283646', status: 0 })
			).toThrow()
		})
	})

	describe('joinGameResponseSchema', () => {
		const response = {
			gameId: 7,
			playerId: 1,
			nickname: 'Ann',
			token: 'a1b2c3'
		}

		it('parses the answer with the player token', () => {
			expect(joinGameResponseSchema.parse(response).token).toBe('a1b2c3')
		})

		it('rejects an empty token: the player could not connect with it', () => {
			expect(() =>
				joinGameResponseSchema.parse({ ...response, token: '' })
			).toThrow()
		})

		it('rejects an answer without a token', () => {
			expect(() =>
				joinGameResponseSchema.parse({
					gameId: 7,
					playerId: 1,
					nickname: 'Ann'
				})
			).toThrow()
		})
	})

	describe('joinFormSchema', () => {
		it('accepts a nickname and trims it', () => {
			expect(joinFormSchema.parse({ nickname: '  Ann  ' }).nickname).toBe('Ann')
		})

		it('accepts the longest nickname the server takes', () => {
			const nickname = 'a'.repeat(JOIN_NICKNAME_MAX_LENGTH)

			expect(joinFormSchema.parse({ nickname }).nickname).toBe(nickname)
		})

		it.each(['', '   '])('rejects an empty nickname: "%s"', nickname => {
			const result = joinFormSchema.safeParse({ nickname })

			expect(result.error?.issues[0]?.message).toBe(
				JOIN_FORM_COPY.validation.nicknameRequired
			)
		})

		it('rejects a nickname that is too long', () => {
			const result = joinFormSchema.safeParse({
				nickname: 'a'.repeat(JOIN_NICKNAME_MAX_LENGTH + 1)
			})

			expect(result.error?.issues[0]?.message).toBe(
				JOIN_FORM_COPY.validation.nicknameMax
			)
		})
	})

	describe('gameByCodeQueryKey', () => {
		it('differs for every code, so each code is cached on its own', () => {
			expect(gameByCodeQueryKey('111111')).not.toEqual(
				gameByCodeQueryKey('222222')
			)
		})
	})
})
