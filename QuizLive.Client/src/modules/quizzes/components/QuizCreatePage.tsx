import { useNavigate } from '@tanstack/react-router'

import { DashboardLayout } from '@layout/DashboardLayout/DashboardLayout'

import { QuizForm } from '@modules/quizzes/components/QuizForm'
import { QUIZ_FORM_COPY } from '@modules/quizzes/constants'
import { useCreateQuiz } from '@modules/quizzes/hooks/useCreateQuiz'
import type { QuizFormValues } from '@modules/quizzes/types'
import { toCreateQuizRequest } from '@modules/quizzes/utils/toCreateQuizRequest'

import { PATHS } from '@config/routes'

export function QuizCreatePage() {
	const navigate = useNavigate()
	const createQuiz = useCreateQuiz()

	const handleSubmit = async (values: QuizFormValues) => {
		const quiz = await createQuiz.mutateAsync(toCreateQuizRequest(values))

		void navigate({
			to: PATHS.quizEdit,
			params: { quizId: String(quiz.id) }
		})
	}

	return (
		<DashboardLayout title={QUIZ_FORM_COPY.createPageTitle}>
			<QuizForm
				submitLabel={QUIZ_FORM_COPY.submitCreate}
				onSubmit={handleSubmit}
				onCancel={() => void navigate({ to: PATHS.dashboard })}
			/>
		</DashboardLayout>
	)
}
