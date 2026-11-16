import { Text } from '@components/ui/Text'

import { STATISTICS_CHART_COPY } from '@modules/statistics/constants'

export type OpenTextFrequencyChartFooterProps = {
	otherCount: number
}

export function OpenTextFrequencyChartFooter({
	otherCount,
}: OpenTextFrequencyChartFooterProps) {
	if (otherCount <= 0) {
		return null
	}

	return (
		<Text size="sm" tone="muted">
			{STATISTICS_CHART_COPY.otherAnswers(otherCount)}
		</Text>
	)
}