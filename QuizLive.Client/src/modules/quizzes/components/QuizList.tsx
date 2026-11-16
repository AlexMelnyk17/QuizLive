import { useState } from 'react'

import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Skeleton } from '@components/ui/Skeleton'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

import {
	quizEmptyState,
	quizGrid,
	quizList,
	quizListFilter,
	quizSkeletonCard
} from '@modules/quizzes/components/QuizList.css'
import { QuizListItem } from '@modules/quizzes/components/QuizListItem'
import { QUIZ_LIST_COPY } from '@modules/quizzes/constants'
import { useMyQuizzes } from '@modules/quizzes/hooks/useMyQuizzes'
import { useSetQuizArchived } from '@modules/quizzes/hooks/useQuizMutations'
import type { QuizDto } from '@modules/quizzes/types'

import { ApiError } from '@api/apiError'

export type QuizListProps = {
	onOpenQuiz?: (quizId: number) => void
	onCreateQuiz?: () => void
}

export function QuizList({ onOpenQuiz, onCreateQuiz }: QuizListProps) {
	const [archived, setArchived] = useState(false)
	const quizzes = useMyQuizzes(archived)
	const setQuizArchived = useSetQuizArchived()

	const toggleArchived = (quiz: QuizDto) => {
		setQuizArchived.mutate({ quizId: quiz.id, archived: !quiz.isArchived })
	}

	const showTab = (showArchived: boolean) => {
		setArchived(showArchived)
		setQuizArchived.reset()
	}

	const updatingQuizId = setQuizArchived.isPending
		? setQuizArchived.variables.quizId
		: null

	return (
		<div className={quizList}>
			<div
				role='group'
				aria-label={QUIZ_LIST_COPY.filterLabel}
				className={quizListFilter}
			>
				<Button
					size='sm'
					variant={archived ? 'outline' : 'primary'}
					aria-pressed={!archived}
					onClick={() => showTab(false)}
				>
					{QUIZ_LIST_COPY.tabs.active}
				</Button>
				<Button
					size='sm'
					variant={archived ? 'primary' : 'outline'}
					aria-pressed={archived}
					onClick={() => showTab(true)}
				>
					{QUIZ_LIST_COPY.tabs.archived}
				</Button>
			</div>

			{setQuizArchived.isError ? (
				<Alert variant='danger' title={QUIZ_LIST_COPY.updateError.title}>
					{setQuizArchived.error instanceof ApiError &&
					setQuizArchived.error.detail
						? setQuizArchived.error.detail
						: QUIZ_LIST_COPY.updateError.body}
				</Alert>
			) : null}

			{quizzes.isPending ? (
				<div className={quizGrid} aria-busy='true'>
					{Array.from({ length: 3 }, (_, index) => (
						<Skeleton key={index} variant='rect' className={quizSkeletonCard} />
					))}
				</div>
			) : quizzes.isError ? (
				<Stack direction='column' align='stretch'>
					<Alert variant='danger' title={QUIZ_LIST_COPY.loadError.title}>
						{QUIZ_LIST_COPY.loadError.body}
					</Alert>
					<div>
						<Button
							variant='primary'
							size='sm'
							loading={quizzes.isFetching}
							onClick={() => void quizzes.refetch()}
						>
							{QUIZ_LIST_COPY.loadError.retry}
						</Button>
					</div>
				</Stack>
			) : quizzes.data.length === 0 ? (
				<QuizListEmptyState archived={archived} onCreateQuiz={onCreateQuiz} />
			) : (
				<div className={quizGrid}>
					{quizzes.data.map(quiz => (
						<QuizListItem
							key={quiz.id}
							quiz={quiz}
							isUpdating={updatingQuizId === quiz.id}
							onToggleArchived={toggleArchived}
							onOpen={onOpenQuiz}
						/>
					))}
				</div>
			)}
		</div>
	)
}

function QuizListEmptyState({
	archived,
	onCreateQuiz
}: {
	archived: boolean
	onCreateQuiz?: () => void
}) {
	const copy = archived
		? QUIZ_LIST_COPY.empty.archived
		: QUIZ_LIST_COPY.empty.active

	return (
		<div className={quizEmptyState}>
			<Heading level={3}>{copy.title}</Heading>
			<Text tone='muted'>{copy.body}</Text>
			{!archived && onCreateQuiz ? (
				<Button variant='primary' onClick={onCreateQuiz}>
					{QUIZ_LIST_COPY.createQuiz}
				</Button>
			) : null}
		</div>
	)
}
