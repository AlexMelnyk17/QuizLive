import { Text } from '@components/ui/Text'

import { DashboardLayout } from '@layout/DashboardLayout/DashboardLayout'
import { GamesByKindChart } from '@modules/statistics/components/charts/GamesByKindChart'
import { GamesOverTimeChart } from '@modules/statistics/components/charts/GamesOverTimeChart'
import { StatsKpiCard } from '@modules/statistics/components/StatsKpiCard'
import { StatsLoadError } from '@modules/statistics/components/StatsLoadError'
import { StatsPageSkeleton } from '@modules/statistics/components/StatsPageSkeleton'
import {
	statsChartGrid,
	statsEmptyBanner,
	statsKpiGrid,
	statsPage,
} from '@modules/statistics/components/StatisticsPage.css'
import {
	STATISTICS_KPI_LABELS,
	STATISTICS_PAGE_COPY,
} from '@modules/statistics/constants'
import { useHostStats } from '@modules/statistics/hooks/useHostStats'
import type { HostStats } from '@modules/statistics/types'
import { formatStatDecimal } from '@modules/statistics/utils/formatStatDecimal'
import { formatStatInteger } from '@modules/statistics/utils/formatStatInteger'
import { isHostStatsEmpty } from '@modules/statistics/utils/isHostStatsEmpty'

export function StatisticsPage() {
	const { data, isPending, isError, refetch, isFetching } = useHostStats()

	const renderMain = () => {
		if (isPending) {
			return <StatsPageSkeleton kpiCount={4} chartCount={2} />
		}

		if (isError || !data) {
			return (
				<StatsLoadError
					title={STATISTICS_PAGE_COPY.loadError.title}
					body={STATISTICS_PAGE_COPY.loadError.body}
					retryLabel={STATISTICS_PAGE_COPY.loadError.retry}
					isFetching={isFetching}
					onRetry={() => void refetch()}
				/>
			)
		}

		return renderReady(data)
	}

	return (
		<DashboardLayout title={STATISTICS_PAGE_COPY.title}>
			{renderMain()}
		</DashboardLayout>
	)
}

function renderReady(data: HostStats) {
	return (
		<div className={statsPage}>
			{renderEmptyBanner(data)}
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
	)
}

function renderEmptyBanner(data: HostStats) {
	if (!isHostStatsEmpty(data)) {
		return null
	}

	return (
		<div className={statsEmptyBanner}>
			<Text tone="muted">{STATISTICS_PAGE_COPY.noActivity}</Text>
		</div>
	)
}
