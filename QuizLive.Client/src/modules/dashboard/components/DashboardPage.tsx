import { useNavigate } from '@tanstack/react-router'

import { DashboardLayout } from '@layout/DashboardLayout/DashboardLayout'

import { QuizList } from '@modules/quizzes/components/QuizList'

import { PATHS } from '@config/routes'

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
				onCreateQuiz={() => void navigate({ to: PATHS.quizCreate })}
			/>
		</DashboardLayout>
	)
}
