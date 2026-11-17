import { z } from 'zod'

import { GameStatus } from '@modules/game/constants'
import { questionDtoSchema, quizKindSchema } from '@modules/quizzes/schemas'

// What is kept in sessionStorage. Storage is an untrusted boundary, so it is parsed, not cast.
export const playerTokenStorageSchema = z.object({
	playerToken: z.string().min(1).nullable()
})

export const gameStatusSchema = z.union([
	z.literal(GameStatus.Lobby),
	z.literal(GameStatus.Question),
	z.literal(GameStatus.Results),
	z.literal(GameStatus.Finished)
])

export const gamePlayerDtoSchema = z.object({
	id: z.number(),
	nickname: z.string(),
	joinedAtUtc: z.string()
})

// serverNowUtc is the server clock at the moment the message was built: a countdown uses it,
// not the clock of the device. endsAtUtc is null when the question has no time limit.
export const questionTimingDtoSchema = z.object({
	startedAtUtc: z.string(),
	endsAtUtc: z.string().nullable(),
	serverNowUtc: z.string()
})

// A player never gets the correct option: the schema has no isCorrect, so zod drops it even if it arrived.
export const playerOptionDtoSchema = z.object({
	id: z.number(),
	order: z.number(),
	text: z.string()
})

// Options are null in open text questions.
export const playerQuestionDtoSchema = z.object({
	number: z.number(),
	total: z.number(),
	text: z.string(),
	imageUrl: z.string().nullable(),
	timeLimitSeconds: z.number().nullable(),
	options: z.array(playerOptionDtoSchema).nullable(),
	timing: questionTimingDtoSchema
})

// The host gets the author version of the question, with isCorrect on the options.
export const hostQuestionDtoSchema = z.object({
	number: z.number(),
	total: z.number(),
	question: questionDtoSchema,
	timing: questionTimingDtoSchema
})

export const hostGameDtoSchema = z.object({
	id: z.number(),
	code: z.string(),
	quizId: z.number(),
	quizTitle: z.string(),
	quizKind: quizKindSchema,
	status: gameStatusSchema,
	createdAtUtc: z.string(),
	endedAtUtc: z.string().nullable(),
	players: z.array(gamePlayerDtoSchema)
})

// The payload of QuestionClosed: the number of the question that was closed.
export const closedQuestionNumberSchema = z.number()

export const answerProgressDtoSchema = z.object({
	number: z.number(),
	answered: z.number(),
	players: z.number()
})
export const playerResultsDtoSchema = z.object({
	number: z.number(),
	answered: z.boolean(),
	isCorrect: z.boolean().nullable(),
	points: z.number(),
	total: z.number(),
	place: z.number()
})
export const hostResultsDtoSchema = z.object({
	number: z.number(),
	answered: z.number(),
	players: z.number(),
	options: z
		.array(
			z.object({
				id: z.number(),
				text: z.string(),
				count: z.number(),
				isCorrect: z.boolean().nullable()
			})
		)
		.nullable(),
	openAnswers: z
		.array(z.object({ text: z.string(), count: z.number() }))
		.nullable()
})
export const leaderboardDtoSchema = z.object({
	entries: z.array(
		z.object({
			playerId: z.number(),
			nickname: z.string(),
			total: z.number(),
			place: z.number()
		})
	),
	isFinal: z.boolean()
})
export const playerPresenceDtoSchema = z.object({
	playerId: z.number(),
	isOnline: z.boolean()
})
export const questionTimeAddedDtoSchema = z.object({
	number: z.number(),
	timing: questionTimingDtoSchema
})

// The answer to ConnectAsHost. currentQuestion is null in the lobby.
export const hostGameStateDtoSchema = z.object({
	game: hostGameDtoSchema,
	currentQuestion: hostQuestionDtoSchema.nullable(),
	results: hostResultsDtoSchema.nullable().optional(),
	leaderboard: leaderboardDtoSchema.nullable().optional(),
	answerProgress: answerProgressDtoSchema.nullable().optional(),
	presence: z.array(playerPresenceDtoSchema).nullable().optional()
})

// The answer to ConnectAsPlayer. currentQuestion is null in the lobby.
export const playerGameStateDtoSchema = z.object({
	gameId: z.number(),
	code: z.string(),
	quizTitle: z.string(),
	status: gameStatusSchema,
	playerId: z.number(),
	nickname: z.string(),
	players: z.array(gamePlayerDtoSchema),
	currentQuestion: playerQuestionDtoSchema.nullable(),
	hasAnswered: z.boolean().optional(),
	results: playerResultsDtoSchema.nullable().optional(),
	leaderboard: leaderboardDtoSchema.nullable().optional(),
	presence: z.array(playerPresenceDtoSchema).nullable().optional()
})
