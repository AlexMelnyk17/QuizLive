import { statsChartGrid } from '@modules/statistics/components/StatisticsPage.css'
import { GamesByKindChart } from '@modules/statistics/components/charts/GamesByKindChart'
import { GamesOverTimeChart } from '@modules/statistics/components/charts/GamesOverTimeChart'
import type { GamesPerDay, KindCounts } from '@modules/statistics/types'

export type HostStatsChartsProps = {
	gamesPerDay: GamesPerDay[]
	byKind: KindCounts
}

export function HostStatsCharts({ gamesPerDay, byKind }: HostStatsChartsProps) {
	return (
		<div className={statsChartGrid}>
			<GamesOverTimeChart points={gamesPerDay} />
			<GamesByKindChart counts={byKind} />
		</div>
	)
}
