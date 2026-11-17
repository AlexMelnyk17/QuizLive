import { beforeEach, describe, expect, it, vi } from 'vitest'

import { QuizKind } from '@modules/quizzes/constants'
import {
	fetchGameStats,
	fetchHostStats,
	fetchQuizStats
} from '@modules/statistics/api/statsApi'
import { STATS_API } from '@modules/statistics/constants'

import { apiRequest } from '@api/client'

vi.mock('@api/client', () => ({ apiRequest: vi.fn() }))

const apiRequestMock = vi.mocked(apiRequest)

const hostFixture = {
	quizzes: {
		total: 1,
		archived: 0,
		byKind: { openText: 1, pollChoice: 0, quizChoice: 0 }
	},
	questions: { total: 1, averagePerQuiz: 1 },
	games: {
		total: 0,
		finished: 0,
		byStatus: { lobby: 0, question: 0, results: 0, finished: 0 },
		byKind: { openText: 0, pollChoice: 0, quizChoice: 0 }
	},
	players: { totalJoins: 0, averagePerGame: 0, maxInOneGame: 0 },
	activity: {
		gamesLast7Days: 0,
		gamesLast30Days: 0,
		gamesPerDay: []
	}
}

const quizPlayBase = {
	quizId: 3,
	quizTitle: 'Sample poll quiz',
	kind: QuizKind.PollChoice,
	questionCount: 1,
	games: {
		total: 1,
		finished: 1,
		lastPlayedAtUtc: '2026-11-16T12:00:00Z',
		averageDurationSeconds: 120
	},
	players: { totalJoins: 2, averagePerGame: 2, maxInOneGame: 2 },
	activity: hostFixture.activity,
	runs: [
		{
			gameId: 9,
			createdAtUtc: '2026-11-16T12:00:00Z',
			endedAtUtc: '2026-11-16T12:02:00Z',
			durationSeconds: 120,
			playerCount: 2,
			averagePoints: null,
			correctPercent: null,
			answerCount: 1
		}
	],
	quizChoiceQuestions: null,
	pollQuestions: [
		{
			questionId: 1,
			order: 1,
			text: 'Favorite drink?',
			playerAnsweredCount: 1,
			possibleAnswers: 2,
			options: [{ optionId: 1, order: 1, text: 'Tea', count: 1 }]
		}
	],
	openQuestions: null
}

const gamePlayFixture = {
	gameId: 9,
	quizId: 3,
	quizTitle: 'Sample scored quiz',
	kind: QuizKind.QuizChoice,
	createdAtUtc: '2026-11-16T12:00:00Z',
	endedAtUtc: '2026-11-16T12:02:00Z',
	durationSeconds: 120,
	playerCount: 1,
	players: [
		{
			playerId: 1,
			nickname: 'Ace',
			joinedAtUtc: '2026-11-16T12:00:01Z',
			answerCount: 1,
			correctCount: 1,
			totalPoints: 50
		}
	],
	quizChoiceQuestions: [],
	pollQuestions: null,
	openQuestions: null
}

beforeEach(() => {
	apiRequestMock.mockReset()
})

describe('statsApi', () => {
	it('fetches host stats', async () => {
		apiRequestMock.mockResolvedValue(hostFixture)

		await fetchHostStats()

		expect(apiRequestMock).toHaveBeenCalledWith(STATS_API.host)
	})

	it('fetches quiz play stats', async () => {
		apiRequestMock.mockResolvedValue(quizPlayBase)

		await fetchQuizStats(3)

		expect(apiRequestMock).toHaveBeenCalledWith(STATS_API.quizById(3))
	})

	it('fetches game play stats', async () => {
		apiRequestMock.mockResolvedValue(gamePlayFixture)

		await fetchGameStats(9)

		expect(apiRequestMock).toHaveBeenCalledWith(STATS_API.gameById(9))
	})
})
