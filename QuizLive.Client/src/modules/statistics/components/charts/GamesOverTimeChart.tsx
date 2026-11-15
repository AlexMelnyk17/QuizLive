import {
	Bar,
	BarChart,
	CartesianGrid,
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
	statsChartColors,
} from '@modules/statistics/chartColors'
import {
	statsChartHeading,
	statsChartShell,
} from '@modules/statistics/components/StatisticsPage.css'
import { STATISTICS_CHART_COPY } from '@modules/statistics/constants'
import type { GamesPerDay } from '@modules/statistics/types'

export type GamesOverTimeChartProps = {
	points: GamesPerDay[]
}

function formatDayLabel(isoDate: string) {
	const parsed = new Date(`${isoDate}T00:00:00Z`)
	return parsed.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC',
	})
}

export function GamesOverTimeChart({ points }: GamesOverTimeChartProps) {
	const data = points.map((point) => ({
		...point,
		label: formatDayLabel(point.date),
	}))

	return (
		<Card variant="outlined" padding="md" fullWidth>
			<Stack direction="column" align="stretch">
				<Heading level={4} className={cn(statsChartHeading)}>
					{STATISTICS_CHART_COPY.gamesOverTime}
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
								tick={{ fill: statsChartColors.axis, fontSize: 11 }}
								interval="preserveStartEnd"
								minTickGap={16}
							/>
							<YAxis
								allowDecimals={false}
								tick={{ fill: statsChartColors.axis, fontSize: 11 }}
								width={32}
							/>
							<Tooltip />
							<Bar
								dataKey="count"
								name={STATISTICS_CHART_COPY.seriesGames}
								fill={statsChartColors.primary}
								isAnimationActive={false}
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</Stack>
		</Card>
	)
}