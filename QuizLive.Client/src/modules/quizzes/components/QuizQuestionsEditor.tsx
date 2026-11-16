import { useState } from 'react'

import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Modal } from '@components/ui/Modal'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

import { QuestionForm } from '@modules/quizzes/components/QuestionForm'
import { QuestionView } from '@modules/quizzes/components/QuestionView'
import {
	questionsSection,
	sectionHeader
} from '@modules/quizzes/components/QuizEditor.css'
import {
	QUESTION_FORM_COPY as COPY,
	QUIZ_DETAILS_COPY,
	QUIZ_FORM_COPY
} from '@modules/quizzes/constants'
import { useCreateQuestion } from '@modules/quizzes/hooks/useCreateQuestion'
import { useDeleteQuestion } from '@modules/quizzes/hooks/useDeleteQuestion'
import { useUpdateQuestion } from '@modules/quizzes/hooks/useUpdateQuestion'
import type { QuestionRequest, QuizDetailsDto } from '@modules/quizzes/types'

import { ApiError } from '@api/apiError'

export function QuizQuestionsEditor({
	quiz,
	onFormOpenChange
}: {
	quiz: QuizDetailsDto
	onFormOpenChange: (open: boolean) => void
}) {
	const [adding, setAdding] = useState(false)
	const [editingId, setEditingId] = useState<number | null>(null)
	const [deletingId, setDeletingId] = useState<number | null>(null)
	const update = useUpdateQuestion(quiz.id)
	const remove = useDeleteQuestion(quiz.id)
	const create = useCreateQuestion(quiz.id)
	const closeForm = () => {
		setAdding(false)
		setEditingId(null)
		onFormOpenChange(false)
	}
	const addQuestion = async (request: QuestionRequest) => {
		await create.mutateAsync(request)
		closeForm()
	}
	return (
		<Stack direction='column' align='stretch' className={questionsSection}>
			<div className={sectionHeader}>
				<Heading level={2}>{QUIZ_DETAILS_COPY.questionsTitle}</Heading>
				<Button
					size='sm'
					disabled={adding || editingId !== null}
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
			{remove.error ? (
				<Alert variant='danger' title={QUIZ_DETAILS_COPY.actionError.title}>
					{remove.error instanceof ApiError
						? (remove.error.detail ?? QUIZ_FORM_COPY.genericError)
						: QUIZ_FORM_COPY.genericError}
				</Alert>
			) : null}
			{quiz.questions.length ? (
				quiz.questions.map(question =>
					editingId === question.id ? (
						<QuestionForm
							key={question.id}
							kind={quiz.kind}
							question={question}
							onSubmit={async request => {
								await update.mutateAsync({ questionId: question.id, request })
								closeForm()
							}}
							onCancel={closeForm}
						/>
					) : (
						<QuestionView
							key={question.id}
							question={question}
							kind={quiz.kind}
							actions={
								<div className={sectionHeader}>
									<Button
										size='sm'
										variant='ghost'
										disabled={adding || editingId !== null}
										onClick={() => {
											setEditingId(question.id)
											onFormOpenChange(true)
										}}
									>
										{COPY.edit}
									</Button>
									<Button
										size='sm'
										variant='ghost'
										disabled={adding || editingId !== null || remove.isPending}
										onClick={() => {
											remove.reset()
											setDeletingId(question.id)
										}}
									>
										{COPY.delete}
									</Button>
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
