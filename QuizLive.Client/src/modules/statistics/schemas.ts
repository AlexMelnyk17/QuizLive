import { z } from 'zod'

const kindCountsSchema = z.object({
	openText: z.number(),
	pollChoice: z.number(),
	quizChoice: z.number(),
})

const statusCountsSchema = z.object({
	lobby: z.number(),
	question: z.number(),
	results: z.number(),
	finished: z.number(),
})

const gamesPerDaySchema = z.object({
	date: z.string(),
	count: z.number(),
})

export const hostStatsSchema = z.object({
	quizzes: z.object({
		total: z.number(),
		archived: z.number(),
		byKind: kindCountsSchema,
	}),
	questions: z.object({
		total: z.number(),
		averagePerQuiz: z.number(),
	}),
	games: z.object({
		total: z.number(),
		finished: z.number(),
		byStatus: statusCountsSchema,
		byKind: kindCountsSchema,
	}),
	players: z.object({
		totalJoins: z.number(),
		averagePerGame: z.number(),
		maxInOneGame: z.number(),
	}),
	activity: z.object({
		gamesLast7Days: z.number(),
		gamesLast30Days: z.number(),
		gamesPerDay: z.array(gamesPerDaySchema),
	}),
})