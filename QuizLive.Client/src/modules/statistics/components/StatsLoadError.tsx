import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Stack } from '@components/ui/Stack'

export type StatsLoadErrorProps = {
	title: string
	body: string
	retryLabel: string
	isFetching: boolean
	onRetry: () => void
}

export function StatsLoadError({
	title,
	body,
	retryLabel,
	isFetching,
	onRetry
}: StatsLoadErrorProps) {
	return (
		<Stack direction='column' align='stretch'>
			<Alert variant='danger' title={title}>
				{body}
			</Alert>
			<div>
				<Button
					variant='primary'
					size='sm'
					loading={isFetching}
					onClick={onRetry}
				>
					{retryLabel}
				</Button>
			</div>
		</Stack>
	)
}
