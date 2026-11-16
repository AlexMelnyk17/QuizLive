import type { ReactElement } from 'react'
import { ResponsiveContainer } from 'recharts'

import { Card } from '@components/ui/Card'
import { Heading } from '@components/ui/Heading'
import { Stack } from '@components/ui/Stack'
import cn from 'clsx'

import {
	statsChartHeading,
	statsChartShell,
} from '@modules/statistics/components/StatisticsPage.css'

export type StatsChartCardProps = {
	title: string
	children: ReactElement
}

export function StatsChartCard({ title, children }: StatsChartCardProps) {
	return (
		<Card variant="outlined" padding="md" fullWidth>
			<Stack direction="column" align="stretch">
				<Heading level={4} className={cn(statsChartHeading)}>
					{title}
				</Heading>
				<div className={statsChartShell}>
					<ResponsiveContainer width="100%" height="100%">
						{children}
					</ResponsiveContainer>
				</div>
			</Stack>
		</Card>
	)
}