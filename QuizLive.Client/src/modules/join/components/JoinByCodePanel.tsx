import { Button } from '@components/ui/Button'
import { Card } from '@components/ui/Card'
import { PinInput } from '@components/ui/PinInput'
import { Text } from '@components/ui/Text'

import {
	JOIN_GAME_CODE_LABEL,
	JOIN_GAME_CODE_LENGTH,
	JOIN_NOT_AVAILABLE_MESSAGE,
} from '@modules/join/constants'
import {
	codeLabel,
	panel,
} from '@modules/join/components/JoinByCodePanel.css'
import { useJoinByCode } from '@modules/join/hooks/useJoinByCode'

export type JoinByCodePanelProps = {
	autoFocus?: boolean
}

export function JoinByCodePanel({ autoFocus = false }: JoinByCodePanelProps) {
	const { code, setCode, isComplete, join } = useJoinByCode()

	return (
		<Card variant="outlined" padding="lg" fullWidth>
			<div className={panel}>
				<Text size="sm" tone="muted">
					Enter the game code to join as a player.
				</Text>

				<span className={codeLabel} id="join-game-code-label">
					{JOIN_GAME_CODE_LABEL}
				</span>
				<PinInput
					value={code}
					onChange={setCode}
					length={JOIN_GAME_CODE_LENGTH}
					autoFocus={autoFocus}
					aria-labelledby="join-game-code-label"
				/>

				<Button variant="primary" disabled={!isComplete} onClick={join}>
					Join game
				</Button>

				<Text size="sm" tone="muted">{JOIN_NOT_AVAILABLE_MESSAGE}</Text>
			</div>
		</Card>
	)
}
