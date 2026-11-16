import { useState } from 'react'

import { Alert } from '@components/ui/Alert'
import { Badge } from '@components/ui/Badge'
import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Modal } from '@components/ui/Modal'
import { Skeleton } from '@components/ui/Skeleton'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

import { QuestionView } from '@modules/quizzes/components/QuestionView'
import {
	actionWithHint,
	deleteDialogActions,
	questionList,
	quizDetails,
	quizDetailsActions,
	quizDetailsEmpty,
	quizDetailsHeader,
	quizDetailsInfo,
	quizDetailsMeta,
	quizDetailsSkeletonHeader,
	quizDetailsSkeletonQuestion,
	quizDetailsText,
	quizDetailsTitle,
	startGameButton
} from '@modules/quizzes/components/QuizDetails.css'
import { QuizNotFound } from '@modules/quizzes/components/QuizNotFound'
import {
	QUIZ_DETAILS_COPY,
	QUIZ_KIND_LABELS,
	QUIZ_LIST_COPY
} from '@modules/quizzes/constants'
import { useDeleteQuiz } from '@modules/quizzes/hooks/useDeleteQuiz'
import { useQuiz } from '@modules/quizzes/hooks/useQuiz'
import { useSetQuizArchived } from '@modules/quizzes/hooks/useSetQuizArchived'
import { formatQuestionCount } from '@modules/quizzes/utils/formatQuestionCount'
import { formatQuizDate } from '@modules/quizzes/utils/formatQuizDate'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

export type QuizDetailsProps = {
	quizId: number
	onEdit?: (quizId: number) => void
	onDeleted?: () => void
	onBack?: () => void
}

export function QuizDetails({
	quizId,
	onEdit,
	onDeleted,
	onBack
}: QuizDetailsProps) {
	const deleteQuiz = useDeleteQuiz()
	// After deletion the quiz is gone, so it must not be fetched again into a 404.
	const quiz = useQuiz(quizId, !deleteQuiz.isSuccess)
	const setQuizArchived = useSetQuizArchived()
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

	if (deleteQuiz.isSuccess) {
		return <Text tone='muted'>{QUIZ_DETAILS_COPY.deleted}</Text>
	}

	if (quiz.isPending) {
		return (
			<div className={quizDetails} aria-busy='true'>
				<Skeleton variant='rect' className={quizDetailsSkeletonHeader} />
				{Array.from({ length: 3 }, (_, index) => (
					<Skeleton
						key={index}
						variant='rect'
						className={quizDetailsSkeletonQuestion}
					/>
				))}
			</div>
		)
	}

	if (quiz.isError) {
		if (
			quiz.error instanceof ApiError &&
			quiz.error.status === HTTP_STATUS.NOT_FOUND
		) {
			return <QuizNotFound onBack={onBack} />
		}

		return (
			<Stack direction='column' align='stretch'>
				<Alert variant='danger' title={QUIZ_DETAILS_COPY.loadError.title}>
					{QUIZ_DETAILS_COPY.loadError.body}
				</Alert>
				<div>
					<Button
						variant='primary'
						size='sm'
						loading={quiz.isFetching}
						onClick={() => void quiz.refetch()}
					>
						{QUIZ_DETAILS_COPY.loadError.retry}
					</Button>
				</div>
			</Stack>
		)
	}

	const data = quiz.data
	const deleteReason = data.hasGames
		? QUIZ_DETAILS_COPY.playedDeleteReason
		: data.isArchived
			? QUIZ_DETAILS_COPY.archivedDeleteReason
			: undefined
	const actionError = setQuizArchived.error ?? deleteQuiz.error
	// A played quiz cannot be deleted (409); archiving keeps its games and hides it from the active list.
	const canArchiveInstead =
		deleteQuiz.error instanceof ApiError &&
		deleteQuiz.error.status === HTTP_STATUS.CONFLICT &&
		!data.isArchived

	const changeArchived = (archived: boolean) => {
		deleteQuiz.reset()
		setQuizArchived.mutate({ quizId, archived })
	}

	const confirmDelete = () => {
		if (data.isArchived || data.hasGames) return
		setQuizArchived.reset()
		deleteQuiz.mutate(quizId, {
			onSuccess: () => onDeleted?.(),
			onSettled: () => setIsConfirmingDelete(false)
		})
	}

	return (
		<div className={quizDetails}>
			<div className={quizDetailsHeader}>
				<div className={quizDetailsInfo}>
					<Heading level={2} className={quizDetailsTitle}>
						{data.title}
					</Heading>
					<div className={quizDetailsMeta}>
						<Badge variant='primary'>{QUIZ_KIND_LABELS[data.kind]}</Badge>
						{data.isArchived ? (
							<Badge variant='warning'>{QUIZ_LIST_COPY.archivedBadge}</Badge>
						) : null}
						<Text size='sm' tone='muted'>
							{formatQuestionCount(data.questions.length)} · Created{' '}
							{formatQuizDate(data.createdAtUtc)}
						</Text>
					</div>
					{data.description ? (
						<Text tone='muted' className={quizDetailsText}>
							{data.description}
						</Text>
					) : null}
				</div>

				<div className={quizDetailsActions}>
					{!data.isArchived ? (
						<div
							className={actionWithHint}
							title={QUIZ_DETAILS_COPY.comingSoon}
							tabIndex={0}
						>
							<Button
								className={startGameButton}
								size='sm'
								disabled
								title={QUIZ_DETAILS_COPY.comingSoon}
							>
								{QUIZ_DETAILS_COPY.startGame}
							</Button>
						</div>
					) : null}
					{onEdit && !data.isArchived ? (
						<Button variant='primary' size='sm' onClick={() => onEdit(quizId)}>
							{QUIZ_DETAILS_COPY.edit}
						</Button>
					) : null}
					<Button
						variant='outline'
						size='sm'
						loading={setQuizArchived.isPending}
						onClick={() => changeArchived(!data.isArchived)}
					>
						{data.isArchived
							? QUIZ_DETAILS_COPY.unarchive
							: QUIZ_DETAILS_COPY.archive}
					</Button>
					<div
						className={actionWithHint}
						title={deleteReason}
						tabIndex={deleteReason ? 0 : undefined}
					>
						<Button
							variant='danger'
							disabled={Boolean(deleteReason)}
							title={deleteReason}
							aria-describedby={
								data.isArchived
									? 'archived-quiz-notice'
									: data.hasGames
										? 'played-quiz-notice'
										: undefined
							}
							size='sm'
							onClick={() => setIsConfirmingDelete(true)}
						>
							{QUIZ_DETAILS_COPY.delete}
						</Button>
					</div>
				</div>
			</div>

			{data.isArchived ? (
				<div id='archived-quiz-notice'>
					<Alert variant='info' title={QUIZ_DETAILS_COPY.archivedNotice.title}>
						{QUIZ_DETAILS_COPY.archivedNotice.body}
					</Alert>
				</div>
			) : null}
			{data.hasGames ? (
				<div id='played-quiz-notice'>
					<Alert variant='info' title={QUIZ_DETAILS_COPY.playedDeleteReason} />
				</div>
			) : null}

			{actionError ? (
				<Alert variant='danger' title={QUIZ_DETAILS_COPY.actionError.title}>
					<Stack direction='column' align='start'>
						<span>
							{actionError instanceof ApiError && actionError.detail
								? actionError.detail
								: QUIZ_DETAILS_COPY.actionError.body}
						</span>
						{canArchiveInstead ? (
							<Button
								variant='outline'
								size='sm'
								loading={setQuizArchived.isPending}
								onClick={() => changeArchived(true)}
							>
								{QUIZ_DETAILS_COPY.archiveInstead}
							</Button>
						) : null}
					</Stack>
				</Alert>
			) : null}

			<Heading level={3}>{QUIZ_DETAILS_COPY.questionsTitle}</Heading>

			{data.questions.length === 0 ? (
				<div className={quizDetailsEmpty}>
					<Text tone='muted'>{QUIZ_DETAILS_COPY.noQuestions}</Text>
					{onEdit && !data.isArchived ? (
						<Button variant='primary' onClick={() => onEdit(quizId)}>
							{QUIZ_DETAILS_COPY.addQuestions}
						</Button>
					) : null}
				</div>
			) : (
				<ol className={questionList}>
					{data.questions.map(question => (
						<li key={question.id}>
							<QuestionView question={question} kind={data.kind} />
						</li>
					))}
				</ol>
			)}

			<Modal
				open={isConfirmingDelete}
				onClose={() => setIsConfirmingDelete(false)}
				title={QUIZ_DETAILS_COPY.deleteDialog.title}
			>
				<Text>{QUIZ_DETAILS_COPY.deleteDialog.body(data.title)}</Text>
				<div className={deleteDialogActions}>
					<Button
						variant='outline'
						onClick={() => setIsConfirmingDelete(false)}
					>
						{QUIZ_DETAILS_COPY.deleteDialog.cancel}
					</Button>
					<Button
						variant='danger'
						loading={deleteQuiz.isPending}
						onClick={confirmDelete}
					>
						{QUIZ_DETAILS_COPY.deleteDialog.confirm}
					</Button>
				</div>
			</Modal>
		</div>
	)
}
