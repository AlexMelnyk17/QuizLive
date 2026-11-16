import { useNavigate } from '@tanstack/react-router'

import { DashboardLayout } from '@layout/DashboardLayout/DashboardLayout'

import { QuizList } from '@modules/quizzes/components/QuizList'

export function DashboardPage() {
	const navigate = useNavigate()

	return (
		<DashboardLayout>
			<QuizList
				onOpenQuiz={quizId =>
					void navigate({
						to: '/quizzes/$quizId',
						params: { quizId: String(quizId) }
					})
				}
			/>
		</DashboardLayout>
	)
}
