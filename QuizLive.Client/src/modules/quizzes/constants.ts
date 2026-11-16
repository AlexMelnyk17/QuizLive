import type { QuizKindValue } from '@modules/quizzes/types'

export const QuizKind = {
	OpenText: 0,
	PollChoice: 1,
	QuizChoice: 2
} as const

export const QUIZ_KIND_LABELS: Record<QuizKindValue, string> = {
	[QuizKind.OpenText]: 'Open text',
	[QuizKind.PollChoice]: 'Poll',
	[QuizKind.QuizChoice]: 'Quiz'
}

// Every quiz query starts with this key, so one invalidation refreshes lists and details.
export const QUIZZES_QUERY_KEY = ['quizzes'] as const

export const quizListQueryKey = (archived: boolean) =>
	[...QUIZZES_QUERY_KEY, 'list', { archived }] as const

export const quizDetailsQueryKey = (quizId: number) =>
	[...QUIZZES_QUERY_KEY, 'details', quizId] as const
