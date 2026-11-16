import { describe, expect, it } from 'vitest'

import { QuizKind } from '@modules/quizzes/constants'
import {
	gamePlayStatsSchema,
	hostStatsSchema,
	quizPlayStatsSchema,
} from '@modules/statistics/schemas'

const fixture = {
	quizzes: {
		total: 3,
		archived: 0,
		byKind: { openText: 1, pollChoice: 1, quizChoice: 1 },
	},
	questions: { total: 9, averagePerQuiz: 3.0 },
	games: {
		total: 2,
		finished: 1,
		byStatus: { lobby: 0, question: 0, results: 0, finished: 1 },
		byKind: { openText: 1, pollChoice: 1, quizChoice: 0 },
	},
	players: { totalJoins: 5, averagePerGame: 2.5, maxInOneGame: 3 },
	activity: {
		gamesLast7Days: 1,
		gamesLast30Days: 2,
		gamesPerDay: [{ date: '2026-11-15', count: 1 }],
	},
}

describe('hostStatsSchema', () => {
	it('parses a host stats payload', () => {
		const parsed = hostStatsSchema.parse(fixture)
		expect(parsed.quizzes.total).toBe(3)
		expect(parsed.players.averagePerGame).toBe(2.5)
		expect(parsed.activity.gamesPerDay).toHaveLength(1)
	})
})

const quizPlayFixture = {
	quizId: 1,
	quizTitle: 'Open reflection',
	kind: QuizKind.OpenText,
	questionCount: 1,
	games: {
		total: 0,
		finished: 0,
		lastPlayedAtUtc: null,
		averageDurationSeconds: null,
	},
	players: { totalJoins: 0, averagePerGame: 0, maxInOneGame: 0 },
	activity: fixture.activity,
	runs: [],
	quizChoiceQuestions: null,
	pollQuestions: null,
	openQuestions: [
		{
			questionId: 1,
			order: 1,
			text: 'What went well?',
			playerAnsweredCount: 0,
			possibleAnswers: 0,
			answerCount: 0,
			hiddenCount: 0,
			answers: [],
			otherCount: 0,
			entries: null,
		},
	],
}

describe('quizPlayStatsSchema', () => {
	it('parses quiz play stats with kind-specific null lists', () => {
		const parsed = quizPlayStatsSchema.parse(quizPlayFixture)
		expect(parsed.kind).toBe(QuizKind.OpenText)
		expect(parsed.openQuestions).toHaveLength(1)
		expect(parsed.pollQuestions).toBeNull()
	})

	it('rejects missing games block', () => {
		expect(() =>
			quizPlayStatsSchema.parse({
				...quizPlayFixture,
				games: undefined,
			}),
		).toThrow()
	})
})

describe('gamePlayStatsSchema', () => {
	it('parses finished game stats', () => {
		const parsed = gamePlayStatsSchema.parse({
			gameId: 2,
			quizId: 1,
			quizTitle: 'Demo quiz',
			kind: QuizKind.QuizChoice,
			createdAtUtc: '2026-11-16T12:00:00Z',
			endedAtUtc: '2026-11-16T12:05:00Z',
			durationSeconds: 300,
			playerCount: 0,
			players: [],
			quizChoiceQuestions: null,
			pollQuestions: null,
			openQuestions: null,
		})
		expect(parsed.durationSeconds).toBe(300)
	})
})