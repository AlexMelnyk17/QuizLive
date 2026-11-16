import { OpenTextFrequencyChart } from '@modules/statistics/components/charts/OpenTextFrequencyChart'
import { OpenTextFrequencyChartFooter } from '@modules/statistics/components/charts/OpenTextFrequencyChartFooter'
import {
	openTextStatsChartItem,
	openTextStatsCharts,
} from '@modules/statistics/components/OpenTextStatsCharts.css'
import type { OpenQuestionStats } from '@modules/statistics/types'

export type OpenTextStatsChartsProps = {
	questions: OpenQuestionStats[]
}

export function OpenTextStatsCharts({ questions }: OpenTextStatsChartsProps) {
	return (
		<div className={openTextStatsCharts}>
			{questions.map((question) => (
				<div key={question.questionId} className={openTextStatsChartItem}>
					<OpenTextFrequencyChart
						title={question.text}
						points={question.answers.map((answer) => ({
							name: answer.text,
							size: answer.count,
						}))}
					/>
					<OpenTextFrequencyChartFooter otherCount={question.otherCount} />
				</div>
			))}
		</div>
	)
}
