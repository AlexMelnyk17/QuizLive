import { useNavigate, useParams } from '@tanstack/react-router'

import { DashboardLayout } from '@layout/DashboardLayout/DashboardLayout'

import { Text } from '@components/ui/Text'

import { QuizNotFound } from '@modules/quizzes/components/QuizNotFound'
import { formatQuizDate } from '@modules/quizzes/utils/formatQuizDate'
import { HostStatValue } from '@modules/statistics/components/HostStatValue'
import { KindStatsCharts } from '@modules/statistics/components/KindStatsCharts'
import { QuizRunsList } from '@modules/statistics/components/QuizRunsList'
import {
	statsEmptyBanner,
	statsKpiGrid,
	statsPage
} from '@modules/statistics/components/StatisticsPage.css'
import { StatsKpiCard } from '@modules/statistics/components/StatsKpiCard'
import { StatsLoadError } from '@modules/statistics/components/StatsLoadError'
import { StatsPageSkeleton } from '@modules/statistics/components/StatsPageSkeleton'
import { StatsPlayPageToolbar } from '@modules/statistics/components/StatsPlayPageToolbar'
import { GamesOverTimeChart } from '@modules/statistics/components/charts/GamesOverTimeChart'
import {
	HOST_STAT_FORMAT,
	QUIZ_STATS_KPI_LABELS,
	QUIZ_STATS_PAGE_COPY,
	STATISTICS_EMPTY_VALUE
} from '@modules/statistics/constants'
import { useQuizStats } from '@modules/statistics/hooks/useQuizStats'
import type { QuizPlayStats } from '@modules/statistics/types'
import { formatStatDuration } from '@modules/statistics/utils/formatStatDuration'
import { getQuizStatsView } from '@modules/statistics/utils/getQuizStatsView'

import { PATHS } from '@config/routes'

export function QuizPlayStatsPage() {
	const navigate = useNavigate()
	const quizId = Number(useParams({ from: PATHS.quizStats }).quizId)
	const validQuizId = Number.isInteger(quizId) && quizId > 0
	const stats = useQuizStats(quizId, validQuizId)
	const view = getQuizStatsView({
		validId: validQuizId,
		isPending: stats.isPending,
		isError: stats.isError,
		hasData: Boolean(stats.data),
		error: stats.error
	})

	const backToQuiz = () => {
		void navigate({
			to: PATHS.quizDetails,
			params: { quizId: String(quizId) }
		})
	}

	const renderMain = () => {
		if (view === 'pending') {
			return <StatsPageSkeleton kpiCount={5} chartCount={1} />
		}

		if (view === 'not-found') {
			return <QuizNotFound onBack={backToQuiz} />
		}

		if (view === 'error') {
			return (
				<StatsLoadError
					title={QUIZ_STATS_PAGE_COPY.loadError.title}
					body={QUIZ_STATS_PAGE_COPY.loadError.body}
					retryLabel={QUIZ_STATS_PAGE_COPY.loadError.retry}
					isFetching={stats.isFetching}
					onRetry={() => void stats.refetch()}
				/>
			)
		}

		if (view !== 'ready' || !stats.data) {
			return null
		}

		return renderReady(stats.data, quizId)
	}

	if (view === 'invalid') {
		return (
			<DashboardLayout title={QUIZ_STATS_PAGE_COPY.title}>
				<QuizNotFound
					onBack={() => {
						void navigate({ to: PATHS.dashboard })
					}}
				/>
			</DashboardLayout>
		)
	}

	return (
		<DashboardLayout title={QUIZ_STATS_PAGE_COPY.title}>
			<div>
				<StatsPlayPageToolbar
					backLabel={QUIZ_STATS_PAGE_COPY.backToQuiz}
					onBack={backToQuiz}
					quizTitle={stats.data?.quizTitle}
					showTitleSkeleton={stats.isPending}
				/>
				{renderMain()}
			</div>
		</DashboardLayout>
	)
}

function renderReady(data: QuizPlayStats, quizId: number) {
	const lastPlayed = formatOptionalDate(data.games.lastPlayedAtUtc)
	const averageDuration = formatOptionalDuration(
		data.games.averageDurationSeconds
	)

	return (
		<div className={statsPage}>
			{renderEmptyBanner(data.runs.length === 0)}
			<div className={statsKpiGrid}>
				<StatsKpiCard
					label={QUIZ_STATS_KPI_LABELS.gamesHosted}
					value={
						<HostStatValue
							value={data.games.total}
							format={HOST_STAT_FORMAT.integer}
						/>
					}
				/>
				<StatsKpiCard
					label={QUIZ_STATS_KPI_LABELS.playerJoins}
					value={
						<HostStatValue
							value={data.players.totalJoins}
							format={HOST_STAT_FORMAT.integer}
						/>
					}
				/>
				<StatsKpiCard
					label={QUIZ_STATS_KPI_LABELS.averagePlayersPerGame}
					value={
						<HostStatValue
							value={data.players.averagePerGame}
							format={HOST_STAT_FORMAT.decimal}
						/>
					}
				/>
				<StatsKpiCard
					label={QUIZ_STATS_KPI_LABELS.lastPlayed}
					value={
						<HostStatValue value={lastPlayed} format={HOST_STAT_FORMAT.text} />
					}
				/>
				<StatsKpiCard
					label={QUIZ_STATS_KPI_LABELS.averageDuration}
					value={
						<HostStatValue
							value={averageDuration}
							format={HOST_STAT_FORMAT.text}
						/>
					}
				/>
			</div>
			<GamesOverTimeChart
				points={data.activity.gamesPerDay}
				title={QUIZ_STATS_PAGE_COPY.activityChart}
			/>
			<KindStatsCharts
				kind={data.kind}
				quizChoiceQuestions={data.quizChoiceQuestions}
				pollQuestions={data.pollQuestions}
				openQuestions={data.openQuestions}
			/>
			<QuizRunsList quizId={quizId} kind={data.kind} runs={data.runs} />
		</div>
	)
}

function renderEmptyBanner(isEmpty: boolean) {
	if (!isEmpty) {
		return null
	}

	return (
		<div className={statsEmptyBanner}>
			<Text tone='muted'>{QUIZ_STATS_PAGE_COPY.noFinishedRuns}</Text>
		</div>
	)
}

function formatOptionalDate(iso: string | null) {
	if (!iso) {
		return STATISTICS_EMPTY_VALUE
	}

	return formatQuizDate(iso)
}

function formatOptionalDuration(seconds: number | null) {
	if (seconds === null) {
		return STATISTICS_EMPTY_VALUE
	}

	return formatStatDuration(seconds)
}
