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

export const QUIZ_LIST_COPY = {
	filterLabel: 'Show quizzes',
	tabs: { active: 'Active', archived: 'Archived' },
	empty: {
		active: {
			title: 'No quizzes yet',
			body: 'Create your first quiz to host a game.'
		},
		archived: {
			title: 'No archived quizzes',
			body: 'Quizzes you archive will appear here.'
		}
	},
	createQuiz: 'Create quiz',
	loadError: {
		title: 'Could not load quizzes',
		body: 'Something went wrong while loading your quizzes. Try again.',
		retry: 'Retry'
	},
	updateError: {
		title: 'Could not update the quiz',
		body: 'Something went wrong. Try again.'
	},
	archivedBadge: 'Archived',
	archive: 'Archive',
	unarchive: 'Unarchive'
} as const

// Every quiz query starts with this key, so one invalidation refreshes lists and details.
export const QUIZZES_QUERY_KEY = ['quizzes'] as const

export const quizListQueryKey = (archived: boolean) =>
	[...QUIZZES_QUERY_KEY, 'list', { archived }] as const

export const quizDetailsQueryKey = (quizId: number) =>
	[...QUIZZES_QUERY_KEY, 'details', quizId] as const
