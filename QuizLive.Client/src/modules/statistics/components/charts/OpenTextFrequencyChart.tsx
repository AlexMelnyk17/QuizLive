import { Text } from '@components/ui/Text'
import { Treemap } from 'recharts'

import { statsChartColors } from '@modules/statistics/chartColors'
import { openTextChartTitle } from '@modules/statistics/components/charts/StatsChartCard.css'
import { OpenTextTreemapCell } from '@modules/statistics/components/charts/OpenTextTreemapCell'
import { StatsChartCard } from '@modules/statistics/components/charts/StatsChartCard'
import {
	STATISTICS_CHART_COPY,
	STATISTICS_TREEMAP_ASPECT_RATIO,
} from '@modules/statistics/constants'
import type { OpenTextFrequencyPoint } from '@modules/statistics/types'

export type OpenTextFrequencyChartProps = {
	title: string
	points: OpenTextFrequencyPoint[]
}

export function OpenTextFrequencyChart({
	title,
	points,
}: OpenTextFrequencyChartProps) {
	if (points.length === 0) {
		return (
			<StatsChartCard
				title={title}
				titleClassName={openTextChartTitle}
				empty={
					<Text tone="muted">{STATISTICS_CHART_COPY.noAnswerData}</Text>
				}
			/>
		)
	}

	return (
		<StatsChartCard title={title} titleClassName={openTextChartTitle}>
			<Treemap
				data={points}
				dataKey="size"
				nameKey="name"
				stroke={statsChartColors.stroke}
				aspectRatio={STATISTICS_TREEMAP_ASPECT_RATIO}
				isAnimationActive={false}
				content={<OpenTextTreemapCell />}
			/>
		</StatsChartCard>
	)
}
