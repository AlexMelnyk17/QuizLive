import { QuizKind } from '@modules/quizzes/constants'
import type { QuizKindValue } from '@modules/quizzes/types'
import { OpenTextStatsCharts } from '@modules/statistics/components/OpenTextStatsCharts'
import { PollChoiceStatsCharts } from '@modules/statistics/components/PollChoiceStatsCharts'
import { QuizChoiceStatsCharts } from '@modules/statistics/components/QuizChoiceStatsCharts'
import type {
	OpenQuestionStats,
	PollQuestionStats,
	QuizChoiceQuestionStats,
} from '@modules/statistics/types'
import { assertNever } from '@utils/assertNever'

type KindStatsChartData = {
	quizChoiceQuestions: QuizChoiceQuestionStats[] | null
	pollQuestions: PollQuestionStats[] | null
	openQuestions: OpenQuestionStats[] | null
}

export function renderKindStatsCharts(
	kind: QuizKindValue,
	data: KindStatsChartData,
) {
	switch (kind) {
		case QuizKind.QuizChoice:
			if (!data.quizChoiceQuestions) {
				return null
			}
			return (
				<QuizChoiceStatsCharts questions={data.quizChoiceQuestions} />
			)
		case QuizKind.PollChoice:
			if (!data.pollQuestions) {
				return null
			}
			return <PollChoiceStatsCharts questions={data.pollQuestions} />
		case QuizKind.OpenText:
			if (!data.openQuestions) {
				return null
			}
			return <OpenTextStatsCharts questions={data.openQuestions} />
		default: {
			return assertNever(kind)
		}
	}
}
