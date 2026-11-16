export const PATHS = {
	home: '/',
	login: '/login',
	register: '/register',
	dashboard: '/dashboard',
	statistics: '/statistics',
	quizzes: '/quizzes',
	quizDetails: '/quizzes/$quizId',
	quizStats: '/quizzes/$quizId/stats',
	gameStats: '/quizzes/$quizId/games/$gameId/stats',
} as const

export const pathTo = {
	quizDetails: (quizId: number) => `/quizzes/${quizId}`,
	quizStats: (quizId: number) => `/quizzes/${quizId}/stats`,
	gameStats: (quizId: number, gameId: number) =>
		`/quizzes/${quizId}/games/${gameId}/stats`,
}