import { useState } from 'react'

import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Modal } from '@components/ui/Modal'
import { Text } from '@components/ui/Text'

import {
	dialogActions,
	dialogBody
} from '@modules/game/components/HostGame.css'
import { HOST_END_GAME_COPY } from '@modules/game/constants'
import { useHostCommand } from '@modules/game/hooks/useHostCommand'

export type HostEndGameButtonProps = {
	// Gives the readable error text, or null when the server accepted the command.
	onEndGame: () => Promise<string | null>
}

// Ends the game for everyone from any state. It cannot be undone, so it asks first.
export function HostEndGameButton({ onEndGame }: HostEndGameButtonProps) {
	const [isConfirming, setIsConfirming] = useState(false)
	const { run: endGame, error, isRunning } = useHostCommand(onEndGame)

	return (
		<>
			<Button variant='outline' onClick={() => setIsConfirming(true)}>
				{HOST_END_GAME_COPY.open}
			</Button>

			<Modal
				open={isConfirming}
				onClose={() => setIsConfirming(false)}
				title={HOST_END_GAME_COPY.title}
			>
				<div className={dialogBody}>
					<Text>{HOST_END_GAME_COPY.body}</Text>

					{error ? <Alert variant='danger'>{error}</Alert> : null}

					<div className={dialogActions}>
						<Button
							variant='outline'
							disabled={isRunning}
							onClick={() => setIsConfirming(false)}
						>
							{HOST_END_GAME_COPY.cancel}
						</Button>
						<Button
							variant='danger'
							loading={isRunning}
							onClick={() => void endGame()}
						>
							{HOST_END_GAME_COPY.confirm}
						</Button>
					</div>
				</div>
			</Modal>
		</>
	)
}
