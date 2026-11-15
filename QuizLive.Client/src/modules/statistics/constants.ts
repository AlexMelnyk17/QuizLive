export const STATS_QUERY_KEY = ['stats', 'host'] as const

export const STATISTICS_PAGE_COPY = {
	title: 'Statistics',
	noActivity:
		'No activity yet. Your totals and charts will fill in once you create quizzes and host games.',
	loadError: {
		title: 'Could not load statistics',
		body: 'Something went wrong while loading your activity overview. Try again.',
		retry: 'Retry',
	},
} as const

export const STATISTICS_KPI_LABELS = {
	quizzes: 'Quizzes',
	games: 'Games',
	playerJoins: 'Player joins',
	averagePlayersPerGame: 'Average players per game',
} as const

export const STATISTICS_CHART_COPY = {
	gamesOverTime: 'Games created (last 30 days)',
	gamesByKind: 'Games by quiz type',
	gamesByStatus: 'Games by status',
	seriesGames: 'Games',
} as const

export const GAME_STATUS_LABELS = {
	lobby: 'Lobby',
	question: 'Question',
	results: 'Results',
	finished: 'Finished',
} as const