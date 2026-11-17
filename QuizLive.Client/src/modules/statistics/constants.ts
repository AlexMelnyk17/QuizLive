export const STATS_QUERY_KEY = ['stats', 'host'] as const

export const quizStatsQueryKey = (quizId: number) =>
	['stats', 'quiz', quizId] as const

export const gameStatsQueryKey = (gameId: number) =>
	['stats', 'game', gameId] as const

export const STATS_API = {
	host: '/stats',
	quizById: (quizId: number) => `/stats/quizzes/${quizId}`,
	gameById: (gameId: number) => `/stats/games/${gameId}`
} as const

export const STAT_FORMAT_FRACTION_DIGITS = 1

export const STAT_DURATION_SECONDS_PER_MINUTE = 60
export const STAT_DURATION_SECONDS_PER_HOUR = 3600

export const STATISTICS_DONUT_INNER_RADIUS = 64
export const STATISTICS_DONUT_OUTER_RADIUS = 108
export const STATISTICS_DONUT_LABEL_MIN_PERCENT = 4
export const STATISTICS_DONUT_LABEL_TRUNCATE = 28
export const STATISTICS_DONUT_LABEL_FONT_SIZE = 13
export const STATISTICS_CHART_PERCENT_FONT_SIZE = 11
export const STATISTICS_DONUT_LABEL_LINE_HEIGHT = 16
export const STATISTICS_DONUT_LABEL_OFFSET = 14
export const STATISTICS_DONUT_LABEL_LINE_OUTSET = 10
export const STATISTICS_DONUT_LABEL_DEGREES_IN_RADIAN = 180
export const STATISTICS_PERCENT_SCALE = 100
export const STATISTICS_CHART_STROKE_WIDTH = 1
export const STATISTICS_LINE_STROKE_WIDTH = 3
export const STATISTICS_LINE_DOT_RADIUS = 6
export const STATISTICS_LINE_LABEL_OFFSET = 10
export const STATISTICS_LINE_Y_AXIS_WIDTH = 40
export const STATISTICS_AREA_FILL_OPACITY = 0.28
export const STATISTICS_TREEMAP_LABEL_TRUNCATE = 48
export const STATISTICS_TREEMAP_MIN_LABEL_WIDTH = 36
export const STATISTICS_TREEMAP_MIN_LABEL_HEIGHT = 28
export const STATISTICS_TREEMAP_ASPECT_RATIO = 4
export const STATISTICS_TREEMAP_CELL_PADDING = 4
export const STATISTICS_TREEMAP_MIN_CELL_SIZE = 2
export const STATISTICS_TREEMAP_LABEL_LINES = 3
export const STATISTICS_CHART_MIN_TICK_GAP = 16
export const STATISTICS_BAR_Y_AXIS_WIDTH = 32
export const STATISTICS_QUESTION_AXIS_LABEL_MAX = 40
export const STATISTICS_EMPTY_VALUE = '—'

export const PREFERS_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

export const HOST_STAT_FORMAT = {
	integer: 'integer',
	decimal: 'decimal',
	text: 'text'
} as const

export const STATISTICS_MOTION = {
	cardDurationMs: 280,
	cardStaggerMs: 50,
	numberDurationMs: 400,
	chartDurationMs: 400
} as const
export const QUIZ_RUNS_HEADING_ID = 'quiz-runs-heading'
export const STATISTICS_QUESTION_AXIS_EMPTY_LABEL = 'Question'

export const STATISTICS_PAGE_COPY = {
	title: 'Statistics',
	noActivity:
		'No activity yet. Your totals and charts will fill in once you create quizzes and host games.',
	loadError: {
		title: 'Could not load statistics',
		body: 'Something went wrong while loading your activity overview. Try again.',
		retry: 'Retry'
	}
} as const

export const QUIZ_STATS_PAGE_COPY = {
	title: 'Quiz statistics',
	backToQuiz: 'Back to quiz',
	noFinishedRuns:
		'No finished games yet. Host a game and end it to see run history and question breakdowns here.',
	loadError: {
		title: 'Could not load quiz statistics',
		body: 'Something went wrong while loading play statistics for this quiz. Try again.',
		retry: 'Retry'
	},
	activityChart: 'Games hosted (last 30 days)',
	runsTitle: 'Finished runs',
	runsEmpty: 'No finished runs to show.',
	viewRun: 'View run details'
} as const

export const GAME_STATS_PAGE_COPY = {
	title: 'Run statistics',
	backToQuizStats: 'Back to quiz statistics',
	hiddenAnswerLabel: '(hidden)',
	playersTitle: 'Players',
	playerAnswers: (count: number) => `${count} answers`,
	playerPoints: (points: number) => `${points} points`,
	playerNameSeparator: ' — ',
	playerMetaSeparator: ' · ',
	notFinished: {
		title: 'This game has not finished',
		body: 'Statistics are available only after you end the game in the host view.'
	},
	loadError: {
		title: 'Could not load run statistics',
		body: 'Something went wrong while loading this game run. Try again.',
		retry: 'Retry'
	}
} as const

export const STATISTICS_KPI_LABELS = {
	quizzes: 'Quizzes',
	games: 'Games',
	playerJoins: 'Player joins',
	averagePlayersPerGame: 'Average players per game'
} as const

export const QUIZ_STATS_KPI_LABELS = {
	gamesHosted: 'Games hosted',
	playerJoins: 'Player joins',
	averagePlayersPerGame: 'Average players per game',
	lastPlayed: 'Last played',
	averageDuration: 'Average run duration'
} as const

export const GAME_STATS_KPI_LABELS = {
	players: 'Players',
	duration: 'Run duration',
	joinedAt: 'Started',
	endedAt: 'Ended'
} as const

export const STATISTICS_CHART_COPY = {
	gamesOverTime: 'Games created (last 30 days)',
	gamesByKind: 'Games by quiz type',
	seriesGames: 'Games',
	questionCorrectPercent: 'Correct answers by question',
	playerScores: 'Total points by player',
	seriesPercent: 'Correct %',
	seriesPoints: 'Points',
	otherAnswers: (count: number) => `Other answers (${count})`,
	noAnswerData: 'No answers to chart yet.'
} as const

export const QUIZ_RUN_COPY = {
	players: 'Players',
	duration: 'Duration',
	correctPercent: 'Correct',
	averagePoints: 'Avg points',
	answers: 'Answers'
} as const
