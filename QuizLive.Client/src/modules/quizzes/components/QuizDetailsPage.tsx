import { useNavigate, useParams } from '@tanstack/react-router'

import { PATHS } from '@config/routes'

import { DashboardLayout } from '@layout/DashboardLayout/DashboardLayout'

import { QuizDetails } from '@modules/quizzes/components/QuizDetails'
import { QuizNotFound } from '@modules/quizzes/components/QuizNotFound'
import { QUIZ_DETAILS_COPY } from '@modules/quizzes/constants'

export function QuizDetailsPage() {
	const navigate = useNavigate()
	const quizId = Number(useParams({ from: PATHS.quizDetails }).quizId)

	const backToList = () => {
		void navigate({ to: PATHS.dashboard })
	}

	return (
		<DashboardLayout title={QUIZ_DETAILS_COPY.pageTitle}>
			{/* An id like "/quizzes/abc" is not sent to the API: it cannot match a quiz. */}
			{Number.isInteger(quizId) && quizId > 0 ? (
				<QuizDetails
					quizId={quizId}
					onDeleted={backToList}
					onBack={backToList}
				/>
			) : (
				<QuizNotFound onBack={backToList} />
			)}
		</DashboardLayout>
	)
}
