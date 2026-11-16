import { QUIZ_KIND_LABELS, QuizKind } from '@modules/quizzes/constants'
import { StatsBarChart } from '@modules/statistics/components/charts/StatsBarChart'
import { STATISTICS_CHART_COPY } from '@modules/statistics/constants'
import type { KindCounts } from '@modules/statistics/types'

export type GamesByKindChartProps = {
	counts: KindCounts
}

export function GamesByKindChart({ counts }: GamesByKindChartProps) {
	const data = [
		{
			key: 'openText',
			label: QUIZ_KIND_LABELS[QuizKind.OpenText],
			value: counts.openText,
		},
		{
			key: 'pollChoice',
			label: QUIZ_KIND_LABELS[QuizKind.PollChoice],
			value: counts.pollChoice,
		},
		{
			key: 'quizChoice',
			label: QUIZ_KIND_LABELS[QuizKind.QuizChoice],
			value: counts.quizChoice,
		},
	]

	return (
		<StatsBarChart
			title={STATISTICS_CHART_COPY.gamesByKind}
			data={data}
			dataKey="value"
			name={STATISTICS_CHART_COPY.seriesGames}
			colorByIndex
		/>
	)
}
