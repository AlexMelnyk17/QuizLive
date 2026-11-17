import { useRef, useState } from 'react'

import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'

import {
	HOST_ADD_TIME_COPY,
	HOST_ADD_TIME_SECONDS
} from '@modules/game/constants'
import { getHubErrorMessage } from '@modules/game/utils/getHubErrorMessage'

export type HostAddTimeButtonProps = {
	disabled: boolean
	onAddTime: (seconds: number) => Promise<string | null>
}

export function HostAddTimeButton({
	disabled,
	onAddTime
}: HostAddTimeButtonProps) {
	const [isRunning, setIsRunning] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const sending = useRef(false)

	async function extend() {
		if (disabled || sending.current) return
		sending.current = true
		setIsRunning(true)
		setError(null)
		try {
			setError(await onAddTime(HOST_ADD_TIME_SECONDS))
		} catch (failure) {
			setError(getHubErrorMessage(failure))
		} finally {
			sending.current = false
			setIsRunning(false)
		}
	}

	return (
		<>
			<Button
				variant='secondary'
				disabled={disabled}
				loading={isRunning}
				onClick={() => void extend()}
			>
				{HOST_ADD_TIME_COPY.button}
			</Button>
			{error ? <Alert variant='danger'>{error}</Alert> : null}
		</>
	)
}
