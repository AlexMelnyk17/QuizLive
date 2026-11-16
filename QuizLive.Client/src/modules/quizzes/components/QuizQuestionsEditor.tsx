import { ArrowDown, ArrowUp } from 'lucide-react'
import { useState } from 'react'

import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Icon } from '@components/ui/Icon'
import { Modal } from '@components/ui/Modal'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

import { QuestionForm } from '@modules/quizzes/components/QuestionForm'
import { QuestionNotFound } from '@modules/quizzes/components/QuestionNotFound'
import { QuestionView } from '@modules/quizzes/components/QuestionView'
import {
	questionsSection,
	reorderActions,
	sectionHeader
} from '@modules/quizzes/components/QuizEditor.css'
import {
	QUESTION_FORM_COPY as COPY,
	QUIZ_DETAILS_COPY,
	QUIZ_FORM_COPY
} from '@modules/quizzes/constants'
import { useCreateQuestion } from '@modules/quizzes/hooks/useCreateQuestion'
import { useDeleteQuestion } from '@modules/quizzes/hooks/useDeleteQuestion'
import { useInvalidateQuizzes } from '@modules/quizzes/hooks/useInvalidateQuizzes'
import { useReorderQuestions } from '@modules/quizzes/hooks/useReorderQuestions'
import { useUpdateQuestion } from '@modules/quizzes/hooks/useUpdateQuestion'
import type { QuestionRequest, QuizDetailsDto } from '@modules/quizzes/types'

import { ApiError } from '@api/apiError'
import { isNotFoundError } from '@api/isNotFoundError'

export function QuizQuestionsEditor({
	quiz,
	onFormOpenChange,
	onBack
}: {
	quiz: QuizDetailsDto
	onFormOpenChange: (open: boolean) => void
	onBack: () => void
}) {
	const [adding, setAdding] = useState(false)
	const [editingId, setEditingId] = useState<number | null>(null)
	const [deletingId, setDeletingId] = useState<number | null>(null)
	const update = useUpdateQuestion(quiz.id)
	const remove = useDeleteQuestion(quiz.id)
	const create = useCreateQuestion(quiz.id)
	const reorder = useReorderQuestions(quiz.id)
	const invalidate = useInvalidateQuizzes()
	const handleMutationError = (error: unknown) => {
		if (!isNotFoundError(error)) return
		closeForm()
		void invalidate()
	}
	const actionsDisabled =
		adding ||
		editingId !== null ||
		deletingId !== null ||
		remove.isPending ||
		reorder.isPending
	const actionError = reorder.error ?? remove.error
	const moveQuestion = (index: number, direction: -1 | 1) => {
		const target = index + direction
		if (actionsDisabled || target < 0 || target >= quiz.questions.length) return
		const ids = quiz.questions.map(question => question.id)
		const [moved] = ids.splice(index, 1)
		if (moved === undefined) return
		ids.splice(target, 0, moved)
		onFormOpenChange(true)
		remove.reset()
		reorder.mutate(ids, {
			onError: handleMutationError,
			onSettled: () => onFormOpenChange(false)
		})
	}
	const closeForm = () => {
		setAdding(false)
		setEditingId(null)
		onFormOpenChange(false)
	}
	const addQuestion = async (request: QuestionRequest) => {
		await create.mutateAsync(request, { onError: handleMutationError })
		closeForm()
	}
	if (
		[create.error, update.error, remove.error, reorder.error].some(
			isNotFoundError
		)
	) {
		return (
			<QuestionNotFound
				onBack={onBack}
				onRefresh={() => {
					create.reset()
					update.reset()
					remove.reset()
					reorder.reset()
					closeForm()
					void invalidate()
				}}
			/>
		)
	}
	return (
		<Stack direction='column' align='stretch' className={questionsSection}>
			<div className={sectionHeader}>
				<Heading level={2}>{QUIZ_DETAILS_COPY.questionsTitle}</Heading>
				<Button
					size='sm'
					disabled={actionsDisabled}
					onClick={() => {
						setAdding(true)
						onFormOpenChange(true)
					}}
				>
					{QUIZ_DETAILS_COPY.addQuestions}
				</Button>
			</div>
			{adding ? (
				<QuestionForm
					kind={quiz.kind}
					onSubmit={addQuestion}
					onCancel={closeForm}
				/>
			) : null}
			{actionError ? (
				<Alert variant='danger' title={QUIZ_DETAILS_COPY.actionError.title}>
					{actionError instanceof ApiError
						? (actionError.detail ?? QUIZ_FORM_COPY.genericError)
						: QUIZ_FORM_COPY.genericError}
				</Alert>
			) : null}
			{quiz.questions.length ? (
				quiz.questions.map((question, index) =>
					editingId === question.id ? (
						<QuestionForm
							key={question.id}
							kind={quiz.kind}
							question={question}
							onSubmit={async request => {
								await update.mutateAsync(
									{ questionId: question.id, request },
									{ onError: handleMutationError }
								)
								closeForm()
							}}
							onCancel={closeForm}
						/>
					) : (
						<QuestionView
							key={question.id}
							question={question}
							kind={quiz.kind}
							footer={
								<div className={reorderActions}>
									<Button
										size='sm'
										variant='ghost'
										aria-label={COPY.moveUp}
										title={COPY.moveUp}
										disabled={actionsDisabled || index === 0}
										onClick={() => moveQuestion(index, -1)}
									>
										<Icon icon={ArrowUp} size='sm' />
									</Button>
									<Button
										size='sm'
										variant='ghost'
										aria-label={COPY.moveDown}
										title={COPY.moveDown}
										disabled={
											actionsDisabled || index === quiz.questions.length - 1
										}
										onClick={() => moveQuestion(index, 1)}
									>
										<Icon icon={ArrowDown} size='sm' />
									</Button>
								</div>
							}
							actions={
								<div className={sectionHeader}>
									<Button
										size='sm'
										variant='ghost'
										disabled={actionsDisabled}
										onClick={() => {
											setEditingId(question.id)
											onFormOpenChange(true)
										}}
									>
										{COPY.edit}
									</Button>
									<span
										title={
											quiz.questions.length === 1
												? COPY.lastQuestionDeleteReason
												: undefined
										}
									>
										<Button
											size='sm'
											variant='ghost'
											disabled={actionsDisabled || quiz.questions.length === 1}
											title={
												quiz.questions.length === 1
													? COPY.lastQuestionDeleteReason
													: undefined
											}
											onClick={() => {
												remove.reset()
												reorder.reset()
												setDeletingId(question.id)
											}}
										>
											{COPY.delete}
										</Button>
									</span>
								</div>
							}
						/>
					)
				)
			) : (
				<Text tone='muted'>{QUIZ_DETAILS_COPY.noQuestions}</Text>
			)}
			<Modal
				open={deletingId !== null}
				onClose={() => {
					if (!remove.isPending) setDeletingId(null)
				}}
				title={COPY.deleteTitle}
			>
				<Text>{COPY.deleteBody}</Text>
				<div className={sectionHeader}>
					<Button
						variant='outline'
						disabled={remove.isPending}
						onClick={() => setDeletingId(null)}
					>
						{COPY.cancel}
					</Button>
					<Button
						variant='danger'
						loading={remove.isPending}
						onClick={() => {
							if (deletingId !== null)
								remove.mutate(deletingId, {
									onError: handleMutationError,
									onSettled: () => setDeletingId(null)
								})
						}}
					>
						{COPY.delete}
					</Button>
				</div>
			</Modal>
		</Stack>
	)
}
