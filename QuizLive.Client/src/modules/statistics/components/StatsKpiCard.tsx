import { Card } from '@components/ui/Card'
import { Heading } from '@components/ui/Heading'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

export type StatsKpiCardProps = {
	label: string
	value: string
}

export function StatsKpiCard({ label, value }: StatsKpiCardProps) {
	return (
		<Card variant="outlined" padding="md" fullWidth>
			<Stack direction="column" align="stretch">
				<Text size="sm" tone="muted">
					{label}
				</Text>
				<Heading level={3}>{value}</Heading>
			</Stack>
		</Card>
	)
}
