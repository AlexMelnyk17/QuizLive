import { useState } from 'react'

import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Skeleton } from '@components/ui/Skeleton'
import { Stack } from '@components/ui/Stack'

import { quizDetailsSkeletonHeader } from '@modules/quizzes/components/QuizDetails.css'
import { editor } from '@modules/quizzes/components/QuizEditor.css'
import { QuizForm } from '@modules/quizzes/components/QuizForm'
import { QuizNotFound } from '@modules/quizzes/components/QuizNotFound'
import { QuizQuestionsEditor } from '@modules/quizzes/components/QuizQuestionsEditor'
import { QUIZ_DETAILS_COPY, QUIZ_FORM_COPY } from '@modules/quizzes/constants'
import { useQuiz } from '@modules/quizzes/hooks/useQuiz'
import { useSetQuizArchived } from '@modules/quizzes/hooks/useSetQuizArchived'
import { useUpdateQuiz } from '@modules/quizzes/hooks/useUpdateQuiz'
import type { QuizFormValues } from '@modules/quizzes/types'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

type QuizEditorProps = {
	quizId: number
	onSaved: () => void
	onCancel: () => void
	onBack: () => void
}

export function QuizEditor({
	quizId,
	onSaved,
	onCancel,
	onBack
}: QuizEditorProps) {
	const quiz = useQuiz(quizId)
	const [questionFormOpen, setQuestionFormOpen] = useState(false)
	const updateQuiz = useUpdateQuiz(quizId)
	const setArchived = useSetQuizArchived()

	const save = async (values: QuizFormValues) => {
		if (!quiz.data?.questions.length) return
		await updateQuiz.mutateAsync({
			title: values.title,
			description: values.description === '' ? null : values.description
		})
		onSaved()
	}

	if (
		(quiz.error instanceof ApiError &&
			quiz.error.status === HTTP_STATUS.NOT_FOUND) ||
		(updateQuiz.error instanceof ApiError &&
			updateQuiz.error.status === HTTP_STATUS.NOT_FOUND)
	) {
		return <QuizNotFound onBack={onBack} />
	}
	if (quiz.isPending) {
		return (
			<div aria-busy='true'>
				<Skeleton variant='rect' className={quizDetailsSkeletonHeader} />
			</div>
		)
	}
	if (quiz.isError) {
		return (
			<Stack direction='column' align='start'>
				<Alert variant='danger' title={QUIZ_DETAILS_COPY.loadError.title}>
					{QUIZ_DETAILS_COPY.loadError.body}
				</Alert>
				<Button onClick={() => void quiz.refetch()} loading={quiz.isFetching}>
					{QUIZ_DETAILS_COPY.loadError.retry}
				</Button>
			</Stack>
		)
	}
	if (quiz.data.isArchived) {
		return (
			<Stack direction='column' align='start'>
				<Alert variant='info' title={QUIZ_DETAILS_COPY.archivedNotice.title}>
					{QUIZ_DETAILS_COPY.archivedNotice.body}
				</Alert>
				{setArchived.error ? (
					<Alert variant='danger' title={QUIZ_DETAILS_COPY.actionError.title}>
						{setArchived.error instanceof ApiError
							? (setArchived.error.detail ?? QUIZ_DETAILS_COPY.actionError.body)
							: QUIZ_DETAILS_COPY.actionError.body}
					</Alert>
				) : null}
				<Button
					loading={setArchived.isPending}
					onClick={() => setArchived.mutate({ quizId, archived: false })}
				>
					{QUIZ_DETAILS_COPY.unarchive}
				</Button>
			</Stack>
		)
	}
	return (
		<Stack direction='column' align='stretch' className={editor}>
			<QuizForm
				initialValues={{
					title: quiz.data.title,
					description: quiz.data.description ?? '',
					kind: quiz.data.kind
				}}
				kindReadOnly
				disabled={questionFormOpen}
				saveDisabledReason={
					quiz.data.questions.length === 0
						? QUIZ_FORM_COPY.questionRequired
						: undefined
				}
				submitLabel={QUIZ_FORM_COPY.submitEdit}
				onSubmit={save}
				onCancel={onCancel}
			>
				<QuizQuestionsEditor
					quiz={quiz.data}
					onFormOpenChange={setQuestionFormOpen}
				/>
			</QuizForm>
		</Stack>
	)
}
