import { apiRequest } from '@api/client'

import {
	gamePlayStatsSchema,
	hostStatsSchema,
	quizPlayStatsSchema,
} from '@modules/statistics/schemas'
import { STATS_API } from '@modules/statistics/constants'
import type { GamePlayStats, HostStats, QuizPlayStats } from '@modules/statistics/types'

export async function fetchHostStats(): Promise<HostStats> {
	const data = await apiRequest<HostStats>(STATS_API.host)
	return hostStatsSchema.parse(data)
}

export async function fetchQuizStats(quizId: number): Promise<QuizPlayStats> {
	const data = await apiRequest<QuizPlayStats>(STATS_API.quizById(quizId))
	return quizPlayStatsSchema.parse(data)
}

export async function fetchGameStats(gameId: number): Promise<GamePlayStats> {
	const data = await apiRequest<GamePlayStats>(STATS_API.gameById(gameId))
	return gamePlayStatsSchema.parse(data)
}