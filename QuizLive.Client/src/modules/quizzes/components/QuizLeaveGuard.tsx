import { useBlocker } from '@tanstack/react-router'

import { Button } from '@components/ui/Button'
import { Modal } from '@components/ui/Modal'
import { Text } from '@components/ui/Text'

import { deleteDialogActions } from '@modules/quizzes/components/QuizDetails.css'
import { QUIZ_FORM_COPY } from '@modules/quizzes/constants'

type QuizLeaveGuardProps = {
	signOutRequested?: boolean
	onCancelSignOut?: () => void
	onConfirmSignOut?: () => void
}

export function QuizLeaveGuard({
	signOutRequested = false,
	onCancelSignOut,
	onConfirmSignOut
}: QuizLeaveGuardProps) {
	const blocker = useBlocker({
		shouldBlockFn: ({ current, next }) => current.pathname !== next.pathname,
		withResolver: true,
		enableBeforeUnload: true
	})
	const cancel = () => {
		if (signOutRequested) onCancelSignOut?.()
		else blocker.reset?.()
	}
	const confirm = () => {
		if (signOutRequested) onConfirmSignOut?.()
		else blocker.proceed?.()
	}

	return (
		<Modal
			open={signOutRequested || blocker.status === 'blocked'}
			onClose={cancel}
			title={QUIZ_FORM_COPY.leaveTitle}
		>
			<Text>{QUIZ_FORM_COPY.leaveBody}</Text>
			<div className={deleteDialogActions}>
				<Button variant='outline' onClick={cancel}>
					{QUIZ_FORM_COPY.stay}
				</Button>
				<Button variant='primary' onClick={confirm}>
					{QUIZ_FORM_COPY.leave}
				</Button>
			</div>
		</Modal>
	)
}
