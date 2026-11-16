import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Skeleton } from '@components/ui/Skeleton'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

import { DashboardLayout } from '@layout/DashboardLayout/DashboardLayout'
import {
	STATISTICS_KPI_LABELS,
	STATISTICS_PAGE_COPY,
} from '@modules/statistics/constants'
import { useHostStats } from '@modules/statistics/hooks/useHostStats'
import { formatStatDecimal } from '@modules/statistics/utils/formatStatDecimal'
import { formatStatInteger } from '@modules/statistics/utils/formatStatInteger'
import { isHostStatsEmpty } from '@modules/statistics/utils/isHostStatsEmpty'
import { StatsKpiCard } from '@modules/statistics/components/StatsKpiCard'
import { GamesByKindChart } from '@modules/statistics/components/charts/GamesByKindChart'
import { GamesOverTimeChart } from '@modules/statistics/components/charts/GamesOverTimeChart'
import {
	statsChartGrid,
	statsEmptyBanner,
	statsKpiGrid,
	statsPage,
	statsSkeletonChartGrid,
	statsSkeletonGrid,
} from '@modules/statistics/components/StatisticsPage.css'

function StatisticsLoadingState() {
	return (
		<div className={statsPage}>
			<div className={statsSkeletonGrid}>
				{Array.from({ length: 4 }, (_, index) => (
					<Skeleton key={index} variant="rect" style={{ height: '5.5rem' }} />
				))}
			</div>
			<div className={statsSkeletonChartGrid}>
				{Array.from({ length: 2 }, (_, index) => (
					<Skeleton key={index} variant="rect" style={{ height: '320px' }} />
				))}
			</div>
		</div>
	)
}

export function StatisticsPage() {
	const { data, isPending, isError, refetch, isFetching } = useHostStats()

	return (
		<DashboardLayout title={STATISTICS_PAGE_COPY.title}>
			{isPending ? (
				<StatisticsLoadingState />
			) : isError || !data ? (
				<Stack direction="column" align="stretch">
					<Alert variant="danger" title={STATISTICS_PAGE_COPY.loadError.title}>
						{STATISTICS_PAGE_COPY.loadError.body}
					</Alert>
					<div>
						<Button
							variant="primary"
							size="sm"
							loading={isFetching}
							onClick={() => void refetch()}
						>
							{STATISTICS_PAGE_COPY.loadError.retry}
						</Button>
					</div>
				</Stack>
			) : (
				<div className={statsPage}>
					{isHostStatsEmpty(data) ? (
						<div className={statsEmptyBanner}>
							<Text tone="muted">{STATISTICS_PAGE_COPY.noActivity}</Text>
						</div>
					) : null}

					<div className={statsKpiGrid}>
						<StatsKpiCard
							label={STATISTICS_KPI_LABELS.quizzes}
							value={formatStatInteger(data.quizzes.total)}
						/>
						<StatsKpiCard
							label={STATISTICS_KPI_LABELS.games}
							value={formatStatInteger(data.games.total)}
						/>
						<StatsKpiCard
							label={STATISTICS_KPI_LABELS.playerJoins}
							value={formatStatInteger(data.players.totalJoins)}
						/>
						<StatsKpiCard
							label={STATISTICS_KPI_LABELS.averagePlayersPerGame}
							value={formatStatDecimal(data.players.averagePerGame)}
						/>
					</div>

					<div className={statsChartGrid}>
						<GamesOverTimeChart points={data.activity.gamesPerDay} />
						<GamesByKindChart counts={data.games.byKind} />
					</div>
				</div>
			)}
		</DashboardLayout>
	)
}