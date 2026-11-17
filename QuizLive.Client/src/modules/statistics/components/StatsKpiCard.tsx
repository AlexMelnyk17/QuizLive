import cn from 'clsx'
import type { ReactNode } from 'react'

import { Card } from '@components/ui/Card'
import { Heading } from '@components/ui/Heading'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

import { statsKpiEnter } from '@modules/statistics/components/StatsKpiCard.css'

export type StatsKpiCardProps = {
	label: string
	value: ReactNode
	className?: string
}

export function StatsKpiCard({ label, value, className }: StatsKpiCardProps) {
	return (
		<Card
			variant='outlined'
			padding='md'
			fullWidth
			className={cn(statsKpiEnter, className)}
		>
			<Stack direction='column' align='stretch'>
				<Text size='sm' tone='muted'>
					{label}
				</Text>
				<Heading level={3}>{value}</Heading>
			</Stack>
		</Card>
	)
}
