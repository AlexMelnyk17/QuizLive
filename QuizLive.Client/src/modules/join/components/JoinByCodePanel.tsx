import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Card } from '@components/ui/Card'
import { PinInput } from '@components/ui/PinInput'
import { Spinner } from '@components/ui/Spinner'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

import { codeLabel, panel } from '@modules/join/components/JoinByCodePanel.css'
import {
	JOIN_GAME_CODE_LABEL,
	JOIN_GAME_CODE_LENGTH,
	JOIN_LOOKUP,
	JOIN_PANEL_COPY
} from '@modules/join/constants'
import { useJoinByCode } from '@modules/join/hooks/useJoinByCode'
import type { GameLookupDto } from '@modules/join/types'

export type JoinByCodePanelProps = {
	autoFocus?: boolean
	// Called with the game when the player goes on with a code that belongs to a game that can be joined.
	onContinue?: (game: GameLookupDto) => void
}

export function JoinByCodePanel({
	autoFocus = false,
	onContinue
}: JoinByCodePanelProps) {
	const { code, setCode, lookup } = useJoinByCode()

	return (
		<Card variant='outlined' padding='lg' fullWidth>
			<div className={panel}>
				<Text size='sm' tone='muted'>
					{JOIN_PANEL_COPY.intro}
				</Text>

				<span className={codeLabel} id='join-game-code-label'>
					{JOIN_GAME_CODE_LABEL}
				</span>
				<PinInput
					value={code}
					onChange={setCode}
					length={JOIN_GAME_CODE_LENGTH}
					autoFocus={autoFocus}
					invalid={
						lookup.kind === JOIN_LOOKUP.notFound ||
						lookup.kind === JOIN_LOOKUP.started
					}
					aria-labelledby='join-game-code-label'
				/>

				{lookup.kind === JOIN_LOOKUP.loading ? (
					<Stack direction='row' align='center'>
						<Spinner size='sm' label={JOIN_PANEL_COPY.looking} />
						<Text size='sm' tone='muted'>
							{JOIN_PANEL_COPY.looking}
						</Text>
					</Stack>
				) : null}

				{lookup.kind === JOIN_LOOKUP.found ? (
					<Alert variant='success'>
						{JOIN_PANEL_COPY.found(lookup.game.quizTitle)}
					</Alert>
				) : null}

				{lookup.kind === JOIN_LOOKUP.started ? (
					<Alert variant='danger'>{JOIN_PANEL_COPY.started}</Alert>
				) : null}

				{lookup.kind === JOIN_LOOKUP.notFound ? (
					<Alert variant='danger'>{JOIN_PANEL_COPY.notFound}</Alert>
				) : null}

				{lookup.kind === JOIN_LOOKUP.error ? (
					<Alert variant='danger'>{JOIN_PANEL_COPY.lookupError}</Alert>
				) : null}

				<Button
					variant='primary'
					disabled={lookup.kind !== JOIN_LOOKUP.found}
					onClick={() => {
						if (lookup.kind === JOIN_LOOKUP.found) onContinue?.(lookup.game)
					}}
				>
					{JOIN_PANEL_COPY.join}
				</Button>
			</div>
		</Card>
	)
}
