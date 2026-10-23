import { QuizKind } from '@modules/dashboard/types'

export const QUIZ_KIND_LABELS: Record<number, string> = {
	[QuizKind.OpenText]: 'Open text',
	[QuizKind.PollChoice]: 'Poll',
	[QuizKind.QuizChoice]: 'Quiz',
}

export const QUIZZES_QUERY_KEY = ['quizzes', { archived: false }] as const

export const QUIZZES_LIST_COMING_SOON_MESSAGE =
	'Your quizzes will be listed here soon. Quiz management is not available in the app yet.'
