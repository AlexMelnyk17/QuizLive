import { useNavigate } from '@tanstack/react-router'

import { PATHS } from '@config/routes'

import { DashboardLayout } from '@layout/DashboardLayout/DashboardLayout'

import { QuizList } from '@modules/quizzes/components/QuizList'

export function DashboardPage() {
	const navigate = useNavigate()

	return (
		<DashboardLayout>
			<QuizList
				onOpenQuiz={quizId =>
					void navigate({
						to: PATHS.quizDetails,
						params: { quizId: String(quizId) }
					})
				}
			/>
		</DashboardLayout>
	)
}
