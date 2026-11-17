import { useNavigate, useParams } from '@tanstack/react-router'

import { DashboardLayout } from '@layout/DashboardLayout/DashboardLayout'

import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

import { QuizKind } from '@modules/quizzes/constants'
import { formatQuizDate } from '@modules/quizzes/utils/formatQuizDate'
import { GameOpenTextEntries } from '@modules/statistics/components/GameOpenTextEntries'
import { HostStatValue } from '@modules/statistics/components/HostStatValue'
import { KindStatsCharts } from '@modules/statistics/components/KindStatsCharts'
import {
	statsKpiGrid,
	statsPage
} from '@modules/statistics/components/StatisticsPage.css'
import { StatsKpiCard } from '@modules/statistics/components/StatsKpiCard'
import { StatsLoadError } from '@modules/statistics/components/StatsLoadError'
import { StatsPageSkeleton } from '@modules/statistics/components/StatsPageSkeleton'
import { StatsPlayPageToolbar } from '@modules/statistics/components/StatsPlayPageToolbar'
import { PlayerScoresChart } from '@modules/statistics/components/charts/PlayerScoresChart'
import {
	GAME_STATS_KPI_LABELS,
	GAME_STATS_PAGE_COPY,
	HOST_STAT_FORMAT
} from '@modules/statistics/constants'
import { useGameStats } from '@modules/statistics/hooks/useGameStats'
import type { GamePlayStats } from '@modules/statistics/types'
import { formatGamePlayerLine } from '@modules/statistics/utils/formatGamePlayerLine'
import { formatStatDuration } from '@modules/statistics/utils/formatStatDuration'
import { getGameStatsView } from '@modules/statistics/utils/getGameStatsView'

import { PATHS } from '@config/routes'

export function GamePlayStatsPage() {
	const navigate = useNavigate()
	const { quizId: quizIdParam, gameId: gameIdParam } = useParams({
		from: PATHS.gameStats
	})
	const quizId = Number(quizIdParam)
	const gameId = Number(gameIdParam)
	const validIds =
		Number.isInteger(quizId) &&
		quizId > 0 &&
		Number.isInteger(gameId) &&
		gameId > 0
	const stats = useGameStats(gameId, validIds)
	const view = getGameStatsView({
		validIds,
		isPending: stats.isPending,
		isError: stats.isError,
		hasData: Boolean(stats.data),
		error: stats.error
	})

	const backToQuizStats = () => {
		void navigate({
			to: PATHS.quizStats,
			params: { quizId: String(quizId) }
		})
	}

	const renderToolbar = () => {
		if (!validIds) {
			return null
		}

		return (
			<StatsPlayPageToolbar
				backLabel={GAME_STATS_PAGE_COPY.backToQuizStats}
				onBack={backToQuizStats}
				quizTitle={stats.data?.quizTitle}
				showTitleSkeleton={stats.isPending}
			/>
		)
	}

	const renderMain = () => {
		if (view === 'invalid' || view === 'not-found') {
			return (
				<Alert variant='danger' title={GAME_STATS_PAGE_COPY.loadError.title}>
					{GAME_STATS_PAGE_COPY.loadError.body}
				</Alert>
			)
		}

		if (view === 'pending') {
			return <StatsPageSkeleton kpiCount={3} />
		}

		if (view === 'not-finished') {
			return (
				<Stack direction='column' align='stretch'>
					<Alert variant='info' title={GAME_STATS_PAGE_COPY.notFinished.title}>
						{GAME_STATS_PAGE_COPY.notFinished.body}
					</Alert>
					<Button variant='primary' size='sm' onClick={backToQuizStats}>
						{GAME_STATS_PAGE_COPY.backToQuizStats}
					</Button>
				</Stack>
			)
		}

		if (view === 'error') {
			return (
				<StatsLoadError
					title={GAME_STATS_PAGE_COPY.loadError.title}
					body={GAME_STATS_PAGE_COPY.loadError.body}
					retryLabel={GAME_STATS_PAGE_COPY.loadError.retry}
					isFetching={stats.isFetching}
					onRetry={() => void stats.refetch()}
				/>
			)
		}

		if (view !== 'ready' || !stats.data) {
			return null
		}

		return renderReady(stats.data)
	}

	return (
		<DashboardLayout title={GAME_STATS_PAGE_COPY.title}>
			<Stack direction='column' align='stretch'>
				{renderToolbar()}
				{renderMain()}
			</Stack>
		</DashboardLayout>
	)
}

function renderReady(data: GamePlayStats) {
	return (
		<div className={statsPage}>
			<div className={statsKpiGrid}>
				<StatsKpiCard
					label={GAME_STATS_KPI_LABELS.players}
					value={
						<HostStatValue
							value={data.playerCount}
							format={HOST_STAT_FORMAT.integer}
						/>
					}
				/>
				<StatsKpiCard
					label={GAME_STATS_KPI_LABELS.duration}
					value={
						<HostStatValue
							value={formatStatDuration(data.durationSeconds)}
							format={HOST_STAT_FORMAT.text}
						/>
					}
				/>
				<StatsKpiCard
					label={GAME_STATS_KPI_LABELS.joinedAt}
					value={
						<HostStatValue
							value={formatQuizDate(data.createdAtUtc)}
							format={HOST_STAT_FORMAT.text}
						/>
					}
				/>
				<StatsKpiCard
					label={GAME_STATS_KPI_LABELS.endedAt}
					value={
						<HostStatValue
							value={formatQuizDate(data.endedAtUtc)}
							format={HOST_STAT_FORMAT.text}
						/>
					}
				/>
			</div>
			{data.kind === QuizKind.QuizChoice ? (
				<PlayerScoresChart players={data.players} />
			) : null}
			<KindStatsCharts
				kind={data.kind}
				quizChoiceQuestions={data.quizChoiceQuestions}
				pollQuestions={data.pollQuestions}
				openQuestions={data.openQuestions}
			/>
			{renderOpenTextEntries(data)}
			<section>
				<Heading level={3}>{GAME_STATS_PAGE_COPY.playersTitle}</Heading>
				<ul>
					{data.players.map(player => (
						<li key={player.playerId}>
							<Text size='sm'>{formatGamePlayerLine(player)}</Text>
						</li>
					))}
				</ul>
			</section>
		</div>
	)
}

function renderOpenTextEntries(data: GamePlayStats) {
	if (data.kind !== QuizKind.OpenText || !data.openQuestions) {
		return null
	}

	return <GameOpenTextEntries questions={data.openQuestions} />
}
