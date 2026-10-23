import { Text } from '@components/ui/Text'

import { DashboardLayout } from '@layout/DashboardLayout/DashboardLayout'
import { QUIZZES_LIST_COMING_SOON_MESSAGE } from '@modules/dashboard/constants'

export function DashboardPage() {
	return (
		<DashboardLayout>
			<Text tone="muted">{QUIZZES_LIST_COMING_SOON_MESSAGE}</Text>
		</DashboardLayout>
	)
}
