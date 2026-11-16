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

// Quiz kinds in the order they are offered; the first one is the default.
export const QUIZ_KIND_ORDER = [
	QuizKind.OpenText,
	QuizKind.PollChoice,
	QuizKind.QuizChoice
] as const

export const QUIZ_KIND_DESCRIPTIONS: Record<QuizKindValue, string> = {
	[QuizKind.OpenText]:
		'Players type their own answer. There is no correct answer.',
	[QuizKind.PollChoice]:
		'Players pick one option. There is no correct answer.',
	[QuizKind.QuizChoice]:
		'Players pick one option, and exactly one is correct. Correct answers earn points.'
}

// Limits match the server (CreateQuizRequest).
export const QUIZ_FIELD_LIMITS = {
	titleMax: 200,
	descriptionMax: 2000
} as const

export const QUIZ_FORM_COPY = {
	createPageTitle: 'Create quiz',
	fields: {
		title: 'Title',
		description: 'Description (optional)',
		kind: 'Quiz type'
	},
	kindFixedNote: 'The type cannot be changed after the quiz is created.',
	submitCreate: 'Save quiz',
	cancel: 'Cancel',
	errorTitle: 'Could not save the quiz',
	genericError: 'Something went wrong. Try again.',
	validation: {
		titleRequired: 'Enter a title.',
		titleMax: `The title can be at most ${QUIZ_FIELD_LIMITS.titleMax} characters.`,
		descriptionMax: `The description can be at most ${QUIZ_FIELD_LIMITS.descriptionMax} characters.`
	}
} as const

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
