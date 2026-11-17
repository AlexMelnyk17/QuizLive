import { z } from 'zod'

import { quizKindSchema } from '@modules/quizzes/schemas'

const kindCountsSchema = z.object({
	openText: z.number(),
	pollChoice: z.number(),
	quizChoice: z.number()
})

const statusCountsSchema = z.object({
	lobby: z.number(),
	question: z.number(),
	results: z.number(),
	finished: z.number()
})

const gamesPerDaySchema = z.object({
	date: z.string(),
	count: z.number()
})

export const playerStatsSchema = z.object({
	totalJoins: z.number(),
	averagePerGame: z.number(),
	maxInOneGame: z.number()
})

export const activityStatsSchema = z.object({
	gamesLast7Days: z.number(),
	gamesLast30Days: z.number(),
	gamesPerDay: z.array(gamesPerDaySchema)
})

export const hostStatsSchema = z.object({
	quizzes: z.object({
		total: z.number(),
		archived: z.number(),
		byKind: kindCountsSchema
	}),
	questions: z.object({
		total: z.number(),
		averagePerQuiz: z.number()
	}),
	games: z.object({
		total: z.number(),
		finished: z.number(),
		byStatus: statusCountsSchema,
		byKind: kindCountsSchema
	}),
	players: playerStatsSchema,
	activity: activityStatsSchema
})

const quizPlayGameStatsSchema = z.object({
	total: z.number(),
	finished: z.number(),
	lastPlayedAtUtc: z.string().nullable(),
	averageDurationSeconds: z.number().nullable()
})

const quizRunSummarySchema = z.object({
	gameId: z.number(),
	createdAtUtc: z.string(),
	endedAtUtc: z.string(),
	durationSeconds: z.number(),
	playerCount: z.number(),
	averagePoints: z.number().nullable(),
	correctPercent: z.number().nullable(),
	answerCount: z.number().nullable()
})

const quizChoiceOptionStatsSchema = z.object({
	optionId: z.number(),
	order: z.number(),
	text: z.string(),
	count: z.number(),
	isCorrect: z.boolean()
})

const quizChoiceQuestionStatsSchema = z.object({
	questionId: z.number(),
	order: z.number(),
	text: z.string(),
	playerAnsweredCount: z.number(),
	possibleAnswers: z.number(),
	correctCount: z.number(),
	correctPercent: z.number(),
	averageElapsedMs: z.number().nullable(),
	averagePoints: z.number().nullable(),
	options: z.array(quizChoiceOptionStatsSchema)
})

const pollOptionStatsSchema = z.object({
	optionId: z.number(),
	order: z.number(),
	text: z.string(),
	count: z.number()
})

const pollQuestionStatsSchema = z.object({
	questionId: z.number(),
	order: z.number(),
	text: z.string(),
	playerAnsweredCount: z.number(),
	possibleAnswers: z.number(),
	options: z.array(pollOptionStatsSchema)
})

const openAnswerFrequencySchema = z.object({
	text: z.string(),
	count: z.number()
})

const openAnswerEntrySchema = z.object({
	playerId: z.number(),
	nickname: z.string(),
	text: z.string(),
	isHidden: z.boolean(),
	answeredAtUtc: z.string()
})

const openQuestionStatsSchema = z.object({
	questionId: z.number(),
	order: z.number(),
	text: z.string(),
	playerAnsweredCount: z.number(),
	possibleAnswers: z.number(),
	answerCount: z.number(),
	hiddenCount: z.number(),
	answers: z.array(openAnswerFrequencySchema),
	otherCount: z.number(),
	entries: z.array(openAnswerEntrySchema).nullable()
})

export const quizPlayStatsSchema = z.object({
	quizId: z.number(),
	quizTitle: z.string(),
	kind: quizKindSchema,
	questionCount: z.number(),
	games: quizPlayGameStatsSchema,
	players: playerStatsSchema,
	activity: activityStatsSchema,
	runs: z.array(quizRunSummarySchema),
	quizChoiceQuestions: z.array(quizChoiceQuestionStatsSchema).nullable(),
	pollQuestions: z.array(pollQuestionStatsSchema).nullable(),
	openQuestions: z.array(openQuestionStatsSchema).nullable()
})

const gamePlayerStatsSchema = z.object({
	playerId: z.number(),
	nickname: z.string(),
	joinedAtUtc: z.string(),
	answerCount: z.number(),
	correctCount: z.number().nullable(),
	totalPoints: z.number().nullable()
})

export const gamePlayStatsSchema = z.object({
	gameId: z.number(),
	quizId: z.number(),
	quizTitle: z.string(),
	kind: quizKindSchema,
	createdAtUtc: z.string(),
	endedAtUtc: z.string(),
	durationSeconds: z.number(),
	playerCount: z.number(),
	players: z.array(gamePlayerStatsSchema),
	quizChoiceQuestions: z.array(quizChoiceQuestionStatsSchema).nullable(),
	pollQuestions: z.array(pollQuestionStatsSchema).nullable(),
	openQuestions: z.array(openQuestionStatsSchema).nullable()
})
