import { DashboardLayout } from '@layout/DashboardLayout/DashboardLayout'

import { Text } from '@components/ui/Text'

import { HostStatValue } from '@modules/statistics/components/HostStatValue'
import { HostStatsCharts } from '@modules/statistics/components/HostStatsCharts'
import {
	statsEmptyBanner,
	statsKpiGrid,
	statsPage
} from '@modules/statistics/components/StatisticsPage.css'
import { StatsKpiCard } from '@modules/statistics/components/StatsKpiCard'
import { StatsLoadError } from '@modules/statistics/components/StatsLoadError'
import { StatsPageSkeleton } from '@modules/statistics/components/StatsPageSkeleton'
import {
	HOST_STAT_FORMAT,
	STATISTICS_KPI_LABELS,
	STATISTICS_PAGE_COPY
} from '@modules/statistics/constants'
import { useHostStats } from '@modules/statistics/hooks/useHostStats'
import type { HostStats } from '@modules/statistics/types'
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
					value={
						<HostStatValue
							value={data.quizzes.total}
							format={HOST_STAT_FORMAT.integer}
						/>
					}
				/>
				<StatsKpiCard
					label={STATISTICS_KPI_LABELS.games}
					value={
						<HostStatValue
							value={data.games.total}
							format={HOST_STAT_FORMAT.integer}
						/>
					}
				/>
				<StatsKpiCard
					label={STATISTICS_KPI_LABELS.playerJoins}
					value={
						<HostStatValue
							value={data.players.totalJoins}
							format={HOST_STAT_FORMAT.integer}
						/>
					}
				/>
				<StatsKpiCard
					label={STATISTICS_KPI_LABELS.averagePlayersPerGame}
					value={
						<HostStatValue
							value={data.players.averagePerGame}
							format={HOST_STAT_FORMAT.decimal}
						/>
					}
				/>
			</div>
			<HostStatsCharts
				gamesPerDay={data.activity.gamesPerDay}
				byKind={data.games.byKind}
			/>
		</div>
	)
}

function renderEmptyBanner(data: HostStats) {
	if (!isHostStatsEmpty(data)) {
		return null
	}

	return (
		<div className={statsEmptyBanner}>
			<Text tone='muted'>{STATISTICS_PAGE_COPY.noActivity}</Text>
		</div>
	)
}
