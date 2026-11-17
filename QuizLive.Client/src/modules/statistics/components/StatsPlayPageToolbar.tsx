import { Button } from '@components/ui/Button'
import { Skeleton } from '@components/ui/Skeleton'
import { Text } from '@components/ui/Text'

import {
	statsBackButton,
	statsPlayPageToolbar,
	statsPlayPageToolbarTitle,
	statsPlayPageToolbarTitleSkeleton,
} from '@modules/statistics/components/StatsPlayPageToolbar.css'

export type StatsPlayPageToolbarProps = {
	backLabel: string
	onBack: () => void
	quizTitle?: string
	showTitleSkeleton?: boolean
}

export function StatsPlayPageToolbar({
	backLabel,
	onBack,
	quizTitle,
	showTitleSkeleton,
}: StatsPlayPageToolbarProps) {
	const renderTitle = () => {
		if (showTitleSkeleton) {
			return (
				<Skeleton
					variant="text"
					className={statsPlayPageToolbarTitleSkeleton}
				/>
			)
		}

		if (!quizTitle) {
			return null
		}

		return (
			<Text size="lg" weight="medium" className={statsPlayPageToolbarTitle}>
				{quizTitle}
			</Text>
		)
	}

	return (
		<div className={statsPlayPageToolbar}>
			<Button
				variant="outline"
				size="sm"
				className={statsBackButton}
				onClick={onBack}
			>
				{backLabel}
			</Button>
			{renderTitle()}
		</div>
	)
}
