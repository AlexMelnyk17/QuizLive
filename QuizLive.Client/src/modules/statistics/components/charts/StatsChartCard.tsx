import cn from 'clsx'
import type { ReactElement, ReactNode } from 'react'
import { ResponsiveContainer } from 'recharts'

import { Card } from '@components/ui/Card'
import { Heading } from '@components/ui/Heading'
import { Stack } from '@components/ui/Stack'

import {
	statsChartHeading,
	statsChartShell
} from '@modules/statistics/components/charts/StatsChartCard.css'
import { useStatsChartShellSize } from '@modules/statistics/hooks/useStatsChartShellSize'

export type StatsChartCardProps = {
	title: string
	children?: ReactElement
	empty?: ReactNode
	titleClassName?: string
	chartClassName?: string
}

export function StatsChartCard({
	title,
	children,
	empty,
	titleClassName,
	chartClassName
}: StatsChartCardProps) {
	const { shellRef, hasSize } = useStatsChartShellSize()

	const renderChart = () => {
		if (empty) {
			return empty
		}

		if (!children) {
			return null
		}

		return (
			<div ref={shellRef} className={cn(statsChartShell, chartClassName)}>
				{hasSize ? (
					<ResponsiveContainer width='100%' height='100%'>
						{children}
					</ResponsiveContainer>
				) : null}
			</div>
		)
	}

	return (
		<Card variant='outlined' padding='md' fullWidth>
			<Stack direction='column' align='stretch'>
				<Heading level={4} className={cn(statsChartHeading, titleClassName)}>
					{title}
				</Heading>
				{renderChart()}
			</Stack>
		</Card>
	)
}
