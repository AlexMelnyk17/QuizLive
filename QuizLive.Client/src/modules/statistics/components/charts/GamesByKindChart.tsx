import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'

import { QUIZ_KIND_LABELS } from '@modules/dashboard/constants'
import { QuizKind } from '@modules/dashboard/types'
import { gamesByKindColors } from '@modules/statistics/chartColors'
import { StatsChartCard } from '@modules/statistics/components/charts/StatsChartCard'
import {
	statsBarChartMargin,
	statsCartesianGridProps,
	statsXAxisTickDefault,
	statsYAxisProps,
} from '@modules/statistics/components/charts/statsChartLayout'
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
		<StatsChartCard title={STATISTICS_CHART_COPY.gamesByKind}>
			<BarChart data={data} margin={statsBarChartMargin}>
				<CartesianGrid {...statsCartesianGridProps} />
				<XAxis dataKey="label" tick={statsXAxisTickDefault} />
				<YAxis {...statsYAxisProps} />
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
		</StatsChartCard>
	)
}