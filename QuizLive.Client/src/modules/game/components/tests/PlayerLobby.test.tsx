import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PlayerLobby } from '@modules/game/components/PlayerLobby'
import type { PlayerLobbyProps } from '@modules/game/components/PlayerLobby'
import {
	GAME_CONNECTION_STATE,
	PLAYER_LOBBY_COPY,
	PLAYER_PAGE_COPY
} from '@modules/game/constants'

import { renderWithTheme } from '@src/test/testUtils'

const ann = { id: 1, nickname: 'Ann', joinedAtUtc: '2026-11-17T10:00:00Z' }
const bob = { id: 2, nickname: 'Bob', joinedAtUtc: '2026-11-17T10:00:10Z' }

function lobby(overrides: Partial<PlayerLobbyProps> = {}): PlayerLobbyProps {
	return {
		nickname: 'Ann',
		quizTitle: 'STEM basics',
		code: '283646',
		selfPlayerId: 1,
		players: [ann],
		connectionState: GAME_CONNECTION_STATE.connected,
		onLeave: vi.fn(),
		...overrides
	}
}

describe('PlayerLobby', () => {
	afterEach(cleanup)

	it('shows who the player is, the quiz and the game code', () => {
		renderWithTheme(<PlayerLobby {...lobby()} />)

		expect(
			screen.getByRole('heading', { name: PLAYER_PAGE_COPY.joined('Ann') })
		).toBeInTheDocument()
		expect(screen.getByText('STEM basics')).toBeInTheDocument()
		expect(
			screen.getByText(PLAYER_PAGE_COPY.gameCode('283646'))
		).toBeInTheDocument()
	})

	it('tells the player to wait for the host', () => {
		renderWithTheme(<PlayerLobby {...lobby()} />)

		expect(
			screen.getByText(PLAYER_LOBBY_COPY.waitingForHost)
		).toBeInTheDocument()
	})

	describe('the players', () => {
		it('lists everyone in the lobby with their number, and marks the player', () => {
			renderWithTheme(<PlayerLobby {...lobby({ players: [ann, bob] })} />)

			expect(
				screen.getByRole('heading', { name: PLAYER_LOBBY_COPY.players(2) })
			).toBeInTheDocument()

			const items = screen.getAllByRole('listitem')

			expect(items).toHaveLength(2)
			expect(
				within(items[0]).getByText(`Ann (${PLAYER_LOBBY_COPY.you})`)
			).toBeInTheDocument()
			expect(within(items[1]).getByText('Bob')).toBeInTheDocument()
		})

		it('shows a player who joins later, without a reload', () => {
			const { rerender } = renderWithTheme(<PlayerLobby {...lobby()} />)
			expect(screen.getAllByRole('listitem')).toHaveLength(1)

			rerender(<PlayerLobby {...lobby({ players: [ann, bob] })} />)

			expect(screen.getAllByRole('listitem')).toHaveLength(2)
			expect(screen.getByText('Bob')).toBeInTheDocument()
		})

		it('says it is waiting when the list is empty', () => {
			renderWithTheme(<PlayerLobby {...lobby({ players: [] })} />)

			expect(screen.getByText(PLAYER_LOBBY_COPY.noPlayers)).toBeInTheDocument()
			expect(screen.queryByRole('list')).not.toBeInTheDocument()
		})
	})

	describe('the connection', () => {
		it('says nothing while it is alive', () => {
			renderWithTheme(<PlayerLobby {...lobby()} />)

			expect(
				screen.queryByText(PLAYER_LOBBY_COPY.reconnecting)
			).not.toBeInTheDocument()
			expect(
				screen.queryByText(PLAYER_LOBBY_COPY.disconnected)
			).not.toBeInTheDocument()
		})

		it('says it is reconnecting', () => {
			renderWithTheme(
				<PlayerLobby
					{...lobby({ connectionState: GAME_CONNECTION_STATE.reconnecting })}
				/>
			)

			expect(
				screen.getByText(PLAYER_LOBBY_COPY.reconnecting)
			).toBeInTheDocument()
		})

		it('says the player is disconnected', () => {
			renderWithTheme(
				<PlayerLobby
					{...lobby({ connectionState: GAME_CONNECTION_STATE.disconnected })}
				/>
			)

			expect(
				screen.getByText(PLAYER_LOBBY_COPY.disconnected)
			).toBeInTheDocument()
		})
	})

	it('lets the player leave the game', async () => {
		const onLeave = vi.fn()
		renderWithTheme(<PlayerLobby {...lobby({ onLeave })} />)

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: PLAYER_LOBBY_COPY.leave }))

		expect(onLeave).toHaveBeenCalledOnce()
	})
})
