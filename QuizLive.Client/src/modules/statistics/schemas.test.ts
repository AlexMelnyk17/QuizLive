import { describe, expect, it } from 'vitest'

import { hostStatsSchema } from '@modules/statistics/schemas'

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