import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HostEndGameButton } from '@modules/game/components/HostEndGameButton'
import { HOST_END_GAME_COPY } from '@modules/game/constants'

import { renderWithTheme } from '@src/test/testUtils'

function renderButton(onEndGame = vi.fn().mockResolvedValue(null)) {
	renderWithTheme(<HostEndGameButton onEndGame={onEndGame} />)

	return onEndGame
}

describe('HostEndGameButton', () => {
	afterEach(cleanup)

	it('asks before ending the game, and ends nothing yet', async () => {
		const onEndGame = renderButton()

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: HOST_END_GAME_COPY.open }))

		expect(screen.getByRole('dialog')).toHaveAccessibleName(
			HOST_END_GAME_COPY.title
		)
		expect(onEndGame).not.toHaveBeenCalled()
	})

	it('ends the game when the host confirms', async () => {
		const user = userEvent.setup()
		const onEndGame = renderButton()

		await user.click(
			screen.getByRole('button', { name: HOST_END_GAME_COPY.open })
		)
		await user.click(
			screen.getByRole('button', { name: HOST_END_GAME_COPY.confirm })
		)

		expect(onEndGame).toHaveBeenCalledOnce()
	})

	it('keeps the game when the host changes their mind', async () => {
		const user = userEvent.setup()
		const onEndGame = renderButton()

		await user.click(
			screen.getByRole('button', { name: HOST_END_GAME_COPY.open })
		)
		await user.click(
			screen.getByRole('button', { name: HOST_END_GAME_COPY.cancel })
		)

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
		expect(onEndGame).not.toHaveBeenCalled()
	})

	it('shows the text of the server when it refuses, and lets the host try again', async () => {
		const user = userEvent.setup()
		const onEndGame = vi
			.fn()
			.mockResolvedValueOnce('Game was not found.')
			.mockResolvedValueOnce(null)
		renderButton(onEndGame)

		await user.click(
			screen.getByRole('button', { name: HOST_END_GAME_COPY.open })
		)
		const confirm = screen.getByRole('button', {
			name: HOST_END_GAME_COPY.confirm
		})
		await user.click(confirm)

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Game was not found.'
		)
		expect(confirm).toBeEnabled()

		await user.click(confirm)

		expect(onEndGame).toHaveBeenCalledTimes(2)
	})
})
