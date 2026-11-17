import { Suspense, lazy } from 'react'

import { QuizKind } from '@modules/quizzes/constants'
import type { QuizKindValue } from '@modules/quizzes/types'
import { StatsPageSkeleton } from '@modules/statistics/components/StatsPageSkeleton'
import type {
	OpenQuestionStats,
	PollQuestionStats,
	QuizChoiceQuestionStats
} from '@modules/statistics/types'

import { assertNever } from '@utils/assertNever'

const QuizChoiceStatsCharts = lazy(async () => {
	const module =
		await import('@modules/statistics/components/QuizChoiceStatsCharts')
	return { default: module.QuizChoiceStatsCharts }
})

const PollChoiceStatsCharts = lazy(async () => {
	const module =
		await import('@modules/statistics/components/PollChoiceStatsCharts')
	return { default: module.PollChoiceStatsCharts }
})

const OpenTextStatsCharts = lazy(async () => {
	const module =
		await import('@modules/statistics/components/OpenTextStatsCharts')
	return { default: module.OpenTextStatsCharts }
})

export type KindStatsChartsProps = {
	kind: QuizKindValue
	quizChoiceQuestions: QuizChoiceQuestionStats[] | null
	pollQuestions: PollQuestionStats[] | null
	openQuestions: OpenQuestionStats[] | null
}

export function KindStatsCharts({
	kind,
	quizChoiceQuestions,
	pollQuestions,
	openQuestions
}: KindStatsChartsProps) {
	return (
		<Suspense fallback={<StatsPageSkeleton kpiCount={0} chartCount={1} />}>
			{renderKind(kind, {
				quizChoiceQuestions,
				pollQuestions,
				openQuestions
			})}
		</Suspense>
	)
}

function renderKind(
	kind: QuizKindValue,
	data: Omit<KindStatsChartsProps, 'kind'>
) {
	switch (kind) {
		case QuizKind.QuizChoice:
			if (!data.quizChoiceQuestions) {
				return null
			}
			return <QuizChoiceStatsCharts questions={data.quizChoiceQuestions} />
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
