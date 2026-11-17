import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HostLobby } from '@modules/game/components/HostLobby'
import {
	GAME_CONNECTION_STATE,
	HOST_LOBBY_COPY,
	PLAYER_LOBBY_COPY
} from '@modules/game/constants'
import type { GamePlayerDto } from '@modules/game/types'

import { renderWithTheme } from '@src/test/testUtils'

const ann: GamePlayerDto = {
	id: 1,
	nickname: 'Ann',
	joinedAtUtc: '2026-11-17T10:00:00Z'
}
const bob: GamePlayerDto = {
	id: 2,
	nickname: 'Bob',
	joinedAtUtc: '2026-11-17T10:00:10Z'
}

function renderLobby(props: Partial<Parameters<typeof HostLobby>[0]> = {}) {
	return renderWithTheme(
		<HostLobby
			quizTitle='STEM basics'
			code='283646'
			players={[ann]}
			connectionState={GAME_CONNECTION_STATE.connected}
			onStart={vi.fn().mockResolvedValue(null)}
			{...props}
		/>
	)
}

describe('HostLobby', () => {
	afterEach(cleanup)

	it('shows the quiz and the code the players enter to join', () => {
		renderLobby()

		expect(
			screen.getByRole('heading', { name: 'STEM basics' })
		).toBeInTheDocument()
		expect(screen.getByText('283646')).toBeInTheDocument()
		expect(screen.getByText(HOST_LOBBY_COPY.joinHint)).toBeInTheDocument()
	})

	it('lists the players who have joined, and how many they are', () => {
		renderLobby({ players: [ann, bob] })

		expect(
			screen.getByRole('heading', { name: PLAYER_LOBBY_COPY.players(2) })
		).toBeInTheDocument()
		expect(screen.getAllByRole('listitem')).toHaveLength(2)
		expect(screen.getByText('Bob')).toBeInTheDocument()
	})

	it('waits for players, and does not let the game start without one', () => {
		renderLobby({ players: [] })

		expect(screen.getByText(PLAYER_LOBBY_COPY.noPlayers)).toBeInTheDocument()
		expect(
			screen.getByRole('button', { name: HOST_LOBBY_COPY.start })
		).toBeDisabled()
	})

	it('starts the game with the button', async () => {
		const onStart = vi.fn().mockResolvedValue(null)
		renderLobby({ onStart })

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: HOST_LOBBY_COPY.start }))

		expect(onStart).toHaveBeenCalledOnce()
		expect(screen.queryByRole('alert')).not.toBeInTheDocument()
	})

	it('shows the text of the server when it refuses to start, and lets the host try again', async () => {
		const user = userEvent.setup()
		const onStart = vi
			.fn()
			.mockResolvedValueOnce('The quiz has no questions.')
			.mockResolvedValueOnce(null)
		renderLobby({ onStart })
		const start = screen.getByRole('button', { name: HOST_LOBBY_COPY.start })

		await user.click(start)

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'The quiz has no questions.'
		)
		expect(start).toBeEnabled()

		await user.click(start)

		expect(onStart).toHaveBeenCalledTimes(2)
		expect(screen.queryByRole('alert')).not.toBeInTheDocument()
	})

	it('warns while the connection is lost', () => {
		renderLobby({ connectionState: GAME_CONNECTION_STATE.reconnecting })

		expect(screen.getByRole('alert')).toHaveTextContent(
			PLAYER_LOBBY_COPY.reconnecting
		)
	})

	it('says so when the connection is closed for good', () => {
		renderLobby({ connectionState: GAME_CONNECTION_STATE.disconnected })

		expect(screen.getByRole('alert')).toHaveTextContent(
			PLAYER_LOBBY_COPY.disconnected
		)
	})
})
