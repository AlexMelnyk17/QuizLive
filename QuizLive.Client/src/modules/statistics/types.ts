import type { z } from 'zod'

import type {
	gamePlayStatsSchema,
	hostStatsSchema,
	quizPlayStatsSchema
} from '@modules/statistics/schemas'

export type HostStats = z.infer<typeof hostStatsSchema>

export type KindCounts = HostStats['quizzes']['byKind']

export type GamesPerDay = HostStats['activity']['gamesPerDay'][number]

export type PlayerStats = HostStats['players']

export type ActivityStats = HostStats['activity']

export type QuizPlayStats = z.infer<typeof quizPlayStatsSchema>

export type QuizRunSummary = QuizPlayStats['runs'][number]

export type QuizChoiceQuestionStats = NonNullable<
	QuizPlayStats['quizChoiceQuestions']
>[number]

export type PollQuestionStats = NonNullable<
	QuizPlayStats['pollQuestions']
>[number]

export type OpenQuestionStats = NonNullable<
	QuizPlayStats['openQuestions']
>[number]

export type GamePlayStats = z.infer<typeof gamePlayStatsSchema>

export type GamePlayerStats = GamePlayStats['players'][number]

export type QuizStatsView =
	'invalid' | 'pending' | 'not-found' | 'error' | 'ready'

export type GameStatsView =
	'invalid' | 'pending' | 'not-found' | 'not-finished' | 'error' | 'ready'

/** Chart view-models (mapped from DTOs in components; not props types). */

export type StatsBarRow = {
	key: string
	label: string
} & Record<string, string | number>

export type OpenTextFrequencyPoint = {
	name: string
	size: number
}

export type OptionDonutSlice = {
	key: string
	label: string
	value: number
}

export type QuestionCorrectPoint = {
	key: string
	label: string
	correctPercent: number
}
