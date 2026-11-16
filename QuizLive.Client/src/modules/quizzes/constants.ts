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

export const QUIZ_FORMAT_COPY = {
	questionSingular: 'question',
	questionPlural: 'questions',
	pointSingular: 'point',
	pointPlural: 'points',
	noTimeLimit: 'No time limit',
	secondsSuffix: 's'
} as const

export const QUIZZES_API = {
	base: '/quizzes',
	list: (archived: boolean) => `/quizzes?archived=${archived}`,
	byId: (quizId: number) => `/quizzes/${quizId}`,
	create: '/quizzes',
	archiveAction: 'archive',
	unarchiveAction: 'unarchive',
	questions: (quizId: number) => `/quizzes/${quizId}/questions`,
	questionById: (quizId: number, questionId: number) =>
		`/quizzes/${quizId}/questions/${questionId}`,
	reorder: (quizId: number) => `/quizzes/${quizId}/questions/order`
} as const

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

export const QUIZ_DETAILS_COPY = {
	pageTitle: 'Quiz details',
	viewStats: 'Statistics',
	edit: 'Edit',
	archive: 'Archive',
	unarchive: 'Unarchive',
	delete: 'Delete',
	archivedNotice: {
		title: 'This quiz is archived',
		body: 'Unarchive it to edit the quiz.'
	},
	questionsTitle: 'Questions',
	noQuestions: 'This quiz has no questions yet.',
	addQuestions: 'Add questions',
	questionLabel: (order: number) => `Question ${order}`,
	openTextHint: 'Players type their own answer.',
	correctOption: 'Correct',
	imageAlt: (order: number) => `Image for question ${order}`,
	notFound: {
		title: 'Quiz not found',
		body: 'It may have been deleted, or it belongs to another host.',
		back: 'Back to my quizzes'
	},
	loadError: {
		title: 'Could not load the quiz',
		body: 'Something went wrong while loading the quiz. Try again.',
		retry: 'Retry'
	},
	actionError: {
		title: 'Could not update the quiz',
		body: 'Something went wrong. Try again.'
	},
	archiveInstead: 'Archive instead',
	deleteDialog: {
		title: 'Delete quiz?',
		body: (title: string) =>
			`"${title}" and all its questions will be deleted. This cannot be undone.`,
		cancel: 'Cancel',
		confirm: 'Delete quiz'
	},
	deleted: 'The quiz was deleted.'
} as const

// Every quiz query starts with this key, so one invalidation refreshes lists and details.
export const QUIZZES_QUERY_KEY = ['quizzes'] as const

export const quizListQueryKey = (archived: boolean) =>
	[...QUIZZES_QUERY_KEY, 'list', { archived }] as const

export const quizDetailsQueryKey = (quizId: number) =>
	[...QUIZZES_QUERY_KEY, 'details', quizId] as const
