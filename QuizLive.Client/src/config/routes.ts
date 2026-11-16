export const PATHS = {
	home: '/',
	login: '/login',
	register: '/register',
	dashboard: '/dashboard',
	statistics: '/statistics',
	quizzes: '/quizzes',
	quizDetails: '/quizzes/$quizId'
} as const

export const pathTo = {
	quizDetails: (quizId: number) => `/quizzes/${quizId}`
}