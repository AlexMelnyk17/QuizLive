import { Treemap } from 'recharts'

import { Text } from '@components/ui/Text'

import { statsChartColors } from '@modules/statistics/chartColors'
import { OpenTextTreemapCell } from '@modules/statistics/components/charts/OpenTextTreemapCell'
import { StatsChartCard } from '@modules/statistics/components/charts/StatsChartCard'
import { openTextChartTitle } from '@modules/statistics/components/charts/StatsChartCard.css'
import {
	STATISTICS_CHART_COPY,
	STATISTICS_TREEMAP_ASPECT_RATIO
} from '@modules/statistics/constants'
import { useStatsChartAnimation } from '@modules/statistics/hooks/useStatsChartAnimation'
import type { OpenTextFrequencyPoint } from '@modules/statistics/types'

export type OpenTextFrequencyChartProps = {
	title: string
	points: OpenTextFrequencyPoint[]
}

export function OpenTextFrequencyChart({
	title,
	points
}: OpenTextFrequencyChartProps) {
	const chartAnimation = useStatsChartAnimation()

	if (points.length === 0) {
		return (
			<StatsChartCard
				title={title}
				titleClassName={openTextChartTitle}
				empty={<Text tone='muted'>{STATISTICS_CHART_COPY.noAnswerData}</Text>}
			/>
		)
	}

	return (
		<StatsChartCard title={title} titleClassName={openTextChartTitle}>
			<Treemap
				data={points}
				dataKey='size'
				nameKey='name'
				stroke={statsChartColors.stroke}
				aspectRatio={STATISTICS_TREEMAP_ASPECT_RATIO}
				{...chartAnimation}
				content={<OpenTextTreemapCell />}
			/>
		</StatsChartCard>
	)
}
