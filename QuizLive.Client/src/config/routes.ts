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
	play: '/play',
	hostGame: '/games/$gameId/host',
	quizCreate: '/quizzes/new',
	quizEdit: '/quizzes/$quizId/edit'
} as const

export const pathTo = {
	quizDetails: (quizId: number) => `/quizzes/${quizId}`,
	quizStats: (quizId: number) => `/quizzes/${quizId}/stats`,
	gameStats: (quizId: number, gameId: number) =>
		`/quizzes/${quizId}/games/${gameId}/stats`,
	hostGame: (gameId: number) => `/games/${gameId}/host`
}
