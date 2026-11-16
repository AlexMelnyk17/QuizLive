import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { JOIN_GAME_CODE_LENGTH } from '@modules/join/constants'
import { JoinByCodePanel } from '@modules/join/components/JoinByCodePanel'
import { renderWithTheme } from '@src/test/testUtils'

describe('JoinByCodePanel', () => {
	it('renders PinInput cells for the game code', () => {
		renderWithTheme(<JoinByCodePanel />)

		expect(screen.getByRole('group', { name: /game code/i })).toBeInTheDocument()
		const cells = screen.getAllByRole('textbox')
		expect(cells).toHaveLength(JOIN_GAME_CODE_LENGTH)
		expect(screen.getByRole('button', { name: /Join game/i })).toBeDisabled()
	})
})
