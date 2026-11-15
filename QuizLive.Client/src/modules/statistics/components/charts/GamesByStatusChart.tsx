import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'

import { Card } from '@components/ui/Card'
import { Heading } from '@components/ui/Heading'
import { Stack } from '@components/ui/Stack'
import cn from 'clsx'

import {
	gamesByStatusColors,
	statsChartColors,
} from '@modules/statistics/chartColors'
import {
	GAME_STATUS_LABELS,
	STATISTICS_CHART_COPY,
} from '@modules/statistics/constants'
import {
	statsChartHeading,
	statsChartShell,
} from '@modules/statistics/components/StatisticsPage.css'
import type { StatusCounts } from '@modules/statistics/types'

export type GamesByStatusChartProps = {
	counts: StatusCounts
}

const STATUS_KEYS = [
	'lobby',
	'question',
	'results',
	'finished',
] as const satisfies readonly (keyof StatusCounts)[]

export function GamesByStatusChart({ counts }: GamesByStatusChartProps) {
	const data = STATUS_KEYS.map((key) => ({
		key,
		label: GAME_STATUS_LABELS[key],
		value: counts[key],
	}))

	return (
		<Card variant="outlined" padding="md" fullWidth>
			<Stack direction="column" align="stretch">
				<Heading level={4} className={cn(statsChartHeading)}>
					{STATISTICS_CHART_COPY.gamesByStatus}
				</Heading>
				<div className={statsChartShell}>
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
							<CartesianGrid
								stroke={statsChartColors.grid}
								strokeDasharray="3 3"
								vertical={false}
							/>
							<XAxis
								dataKey="label"
								tick={{ fill: statsChartColors.axis, fontSize: 12 }}
							/>
							<YAxis
								allowDecimals={false}
								tick={{ fill: statsChartColors.axis, fontSize: 11 }}
								width={32}
							/>
							<Tooltip />
							<Bar
								dataKey="value"
								name={STATISTICS_CHART_COPY.seriesGames}
								isAnimationActive={false}
							>
								{data.map((entry, index) => (
									<Cell
										key={entry.key}
										fill={gamesByStatusColors[index % gamesByStatusColors.length]}
									/>
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</Stack>
		</Card>
	)
}