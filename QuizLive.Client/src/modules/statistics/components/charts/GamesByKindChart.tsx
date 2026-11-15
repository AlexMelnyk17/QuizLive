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

import { QUIZ_KIND_LABELS } from '@modules/dashboard/constants'
import { QuizKind } from '@modules/dashboard/types'
import {
	gamesByKindColors,
	statsChartColors,
} from '@modules/statistics/chartColors'
import {
	statsChartHeading,
	statsChartShell,
} from '@modules/statistics/components/StatisticsPage.css'
import { STATISTICS_CHART_COPY } from '@modules/statistics/constants'
import type { KindCounts } from '@modules/statistics/types'

export type GamesByKindChartProps = {
	counts: KindCounts
}

export function GamesByKindChart({ counts }: GamesByKindChartProps) {
	const data = [
		{ key: 'openText', label: QUIZ_KIND_LABELS[QuizKind.OpenText], value: counts.openText },
		{ key: 'pollChoice', label: QUIZ_KIND_LABELS[QuizKind.PollChoice], value: counts.pollChoice },
		{ key: 'quizChoice', label: QUIZ_KIND_LABELS[QuizKind.QuizChoice], value: counts.quizChoice },
	]

	return (
		<Card variant="outlined" padding="md" fullWidth>
			<Stack direction="column" align="stretch">
				<Heading level={4} className={cn(statsChartHeading)}>
					{STATISTICS_CHART_COPY.gamesByKind}
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
										fill={gamesByKindColors[index % gamesByKindColors.length]}
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