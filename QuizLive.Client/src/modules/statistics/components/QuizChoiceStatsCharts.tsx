import { OptionDonutChart } from '@modules/statistics/components/charts/OptionDonutChart'
import { QuestionCorrectPercentChart } from '@modules/statistics/components/charts/QuestionCorrectPercentChart'
import {
	statsChartGrid,
	statsPage,
} from '@modules/statistics/components/StatisticsPage.css'
import type { QuizChoiceQuestionStats } from '@modules/statistics/types'
import { formatQuestionAxisLabel } from '@modules/statistics/utils/formatQuestionAxisLabel'
import { mapOptionDonutSlices } from '@modules/statistics/utils/mapOptionDonutSlices'

export type QuizChoiceStatsChartsProps = {
	questions: QuizChoiceQuestionStats[]
}

export function QuizChoiceStatsCharts({
	questions,
}: QuizChoiceStatsChartsProps) {
	const correctPoints = questions.map((question) => ({
		key: String(question.questionId),
		label: formatQuestionAxisLabel(question.text),
		correctPercent: question.correctPercent,
	}))

	return (
		<div className={statsPage}>
			<QuestionCorrectPercentChart points={correctPoints} />
			<div className={statsChartGrid}>
				{questions.map((question) => (
					<OptionDonutChart
						key={question.questionId}
						title={question.text}
						slices={mapOptionDonutSlices(question.options)}
					/>
				))}
			</div>
		</div>
	)
}
