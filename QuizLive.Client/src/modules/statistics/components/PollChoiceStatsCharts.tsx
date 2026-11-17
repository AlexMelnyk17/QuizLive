import { statsChartGrid } from '@modules/statistics/components/StatisticsPage.css'
import { OptionDonutChart } from '@modules/statistics/components/charts/OptionDonutChart'
import type { PollQuestionStats } from '@modules/statistics/types'
import { mapOptionDonutSlices } from '@modules/statistics/utils/mapOptionDonutSlices'

export type PollChoiceStatsChartsProps = {
	questions: PollQuestionStats[]
}

export function PollChoiceStatsCharts({
	questions
}: PollChoiceStatsChartsProps) {
	return (
		<div className={statsChartGrid}>
			{questions.map(question => (
				<OptionDonutChart
					key={question.questionId}
					title={question.text}
					slices={mapOptionDonutSlices(question.options)}
				/>
			))}
		</div>
	)
}
