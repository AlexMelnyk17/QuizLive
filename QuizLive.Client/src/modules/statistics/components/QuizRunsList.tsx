import { useNavigate } from '@tanstack/react-router'

import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Text } from '@components/ui/Text'

import { QuizKind } from '@modules/quizzes/constants'
import type { QuizKindValue } from '@modules/quizzes/types'
import { formatQuizDate } from '@modules/quizzes/utils/formatQuizDate'
import {
	quizRunMeta,
	quizRunRow,
	quizRunsHeading,
	quizRunsList
} from '@modules/statistics/components/QuizRunsList.css'
import {
	QUIZ_RUNS_HEADING_ID,
	QUIZ_RUN_COPY,
	QUIZ_STATS_PAGE_COPY
} from '@modules/statistics/constants'
import type { QuizRunSummary } from '@modules/statistics/types'
import { formatStatDecimal } from '@modules/statistics/utils/formatStatDecimal'
import { formatStatDuration } from '@modules/statistics/utils/formatStatDuration'
import { formatStatInteger } from '@modules/statistics/utils/formatStatInteger'
import { formatStatPercent } from '@modules/statistics/utils/formatStatPercent'

import { PATHS } from '@config/routes'

export type QuizRunsListProps = {
	quizId: number
	kind: QuizKindValue
	runs: QuizRunSummary[]
}

export function QuizRunsList({ quizId, kind, runs }: QuizRunsListProps) {
	const navigate = useNavigate()

	if (runs.length === 0) {
		return <Text tone='muted'>{QUIZ_STATS_PAGE_COPY.runsEmpty}</Text>
	}

	return (
		<section aria-labelledby={QUIZ_RUNS_HEADING_ID}>
			<Heading level={3} id={QUIZ_RUNS_HEADING_ID} className={quizRunsHeading}>
				{QUIZ_STATS_PAGE_COPY.runsTitle}
			</Heading>
			<ul className={quizRunsList}>
				{runs.map(run => (
					<li key={run.gameId} className={quizRunRow}>
						<div className={quizRunMeta}>
							<Text size='sm' weight='medium'>
								{formatQuizDate(run.createdAtUtc)}
							</Text>
							<Text size='sm' tone='muted'>
								{QUIZ_RUN_COPY.players}: {formatStatInteger(run.playerCount)}
							</Text>
							<Text size='sm' tone='muted'>
								{QUIZ_RUN_COPY.duration}:{' '}
								{formatStatDuration(run.durationSeconds)}
							</Text>
							<QuizRunKindMeta kind={kind} run={run} />
						</div>
						<Button
							variant='outline'
							size='sm'
							onClick={() =>
								void navigate({
									to: PATHS.gameStats,
									params: {
										quizId: String(quizId),
										gameId: String(run.gameId)
									}
								})
							}
						>
							{QUIZ_STATS_PAGE_COPY.viewRun}
						</Button>
					</li>
				))}
			</ul>
		</section>
	)
}

type QuizRunKindMetaProps = {
	kind: QuizKindValue
	run: QuizRunSummary
}

function QuizRunKindMeta({ kind, run }: QuizRunKindMetaProps) {
	if (kind === QuizKind.QuizChoice) {
		return (
			<>
				<QuizRunCorrectPercent run={run} />
				<QuizRunAveragePoints run={run} />
			</>
		)
	}

	if (run.answerCount === null) {
		return null
	}

	return (
		<Text size='sm' tone='muted'>
			{QUIZ_RUN_COPY.answers}: {formatStatInteger(run.answerCount)}
		</Text>
	)
}

type QuizRunFieldProps = {
	run: QuizRunSummary
}

function QuizRunCorrectPercent({ run }: QuizRunFieldProps) {
	if (run.correctPercent === null) {
		return null
	}

	return (
		<Text size='sm' tone='muted'>
			{QUIZ_RUN_COPY.correctPercent}: {formatStatPercent(run.correctPercent)}
		</Text>
	)
}

function QuizRunAveragePoints({ run }: QuizRunFieldProps) {
	if (run.averagePoints === null) {
		return null
	}

	return (
		<Text size='sm' tone='muted'>
			{QUIZ_RUN_COPY.averagePoints}: {formatStatDecimal(run.averagePoints)}
		</Text>
	)
}
