export const PATHS = {
	home: '/',
	login: '/login',
	register: '/register',
	dashboard: '/dashboard',
	statistics: '/statistics',
	quizzes: '/quizzes',
	quizCreate: '/quizzes/new',
	quizDetails: '/quizzes/$quizId',
	quizEdit: '/quizzes/$quizId/edit'
} as const

export const pathTo = {
	quizDetails: (quizId: number) => `/quizzes/${quizId}`
}
