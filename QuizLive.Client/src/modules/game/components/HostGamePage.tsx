import { useNavigate, useParams } from '@tanstack/react-router'

import { DashboardLayout } from '@layout/DashboardLayout/DashboardLayout'

import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'

import { buttonRow, hostScreen } from '@modules/game/components/HostGame.css'
import { HostGameScreen } from '@modules/game/components/HostGameScreen'
import { HOST_GAME_COPY } from '@modules/game/constants'

import { PATHS } from '@config/routes'

// The page of the host of a game (route /games/$gameId/host, for a logged-in host).
export function HostGamePage() {
	const navigate = useNavigate()
	const gameId = Number(useParams({ from: PATHS.hostGame }).gameId)

	const backToQuizzes = () => {
		void navigate({ to: PATHS.dashboard })
	}

	return (
		<DashboardLayout title={HOST_GAME_COPY.pageTitle}>
			{/* An id like "/games/abc/host" is not sent to the hub: it cannot match a game. */}
			{Number.isInteger(gameId) && gameId > 0 ? (
				<HostGameScreen key={gameId} gameId={gameId} onBack={backToQuizzes} />
			) : (
				<div className={hostScreen}>
					<Alert variant='danger'>{HOST_GAME_COPY.invalidGame}</Alert>
					<div className={buttonRow}>
						<Button variant='secondary' onClick={backToQuizzes}>
							{HOST_GAME_COPY.backToQuizzes}
						</Button>
					</div>
				</div>
			)}
		</DashboardLayout>
	)
}
