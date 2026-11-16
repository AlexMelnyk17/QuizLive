import { useNavigate, useParams } from '@tanstack/react-router'
import { useState } from 'react'

import { DashboardLayout } from '@layout/DashboardLayout/DashboardLayout'

import { signOut } from '@modules/auth/store/sessionStore'
import { QuizEditor } from '@modules/quizzes/components/QuizEditor'
import { QuizLeaveGuard } from '@modules/quizzes/components/QuizLeaveGuard'
import { QuizNotFound } from '@modules/quizzes/components/QuizNotFound'
import { QUIZ_FORM_COPY } from '@modules/quizzes/constants'

import { PATHS } from '@config/routes'

export function QuizEditPage() {
	const navigate = useNavigate()
	const [signOutRequested, setSignOutRequested] = useState(false)
	const confirmSignOut = () => {
		signOut()
		void navigate({ to: PATHS.home, ignoreBlocker: true })
	}
	const quizId = Number(useParams({ from: PATHS.quizEdit }).quizId)
	const backToList = () => void navigate({ to: PATHS.dashboard })
	const backToDetails = () =>
		void navigate({ to: PATHS.quizDetails, params: { quizId: String(quizId) } })
	const afterSaved = () =>
		void navigate({
			to: PATHS.quizDetails,
			params: { quizId: String(quizId) },
			ignoreBlocker: true
		})

	return (
		<DashboardLayout
			title={QUIZ_FORM_COPY.editPageTitle}
			onSignOut={() => setSignOutRequested(true)}
		>
			<QuizLeaveGuard
				signOutRequested={signOutRequested}
				onCancelSignOut={() => setSignOutRequested(false)}
				onConfirmSignOut={confirmSignOut}
			/>
			{Number.isInteger(quizId) && quizId > 0 ? (
				<QuizEditor
					key={quizId}
					quizId={quizId}
					onSaved={afterSaved}
					onCancel={backToDetails}
					onBack={backToList}
				/>
			) : (
				<QuizNotFound onBack={backToList} />
			)}
		</DashboardLayout>
	)
}
