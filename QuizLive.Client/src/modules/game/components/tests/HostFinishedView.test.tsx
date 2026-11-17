import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { HostFinishedView } from '@modules/game/components/HostFinishedView'
import { HOST_FINISHED_COPY } from '@modules/game/constants'

import { PATHS } from '@config/routes'

import { renderWithTheme } from '@src/test/testUtils'

const navigateMock = vi.fn()

vi.mock('@tanstack/react-router', () => ({
	useNavigate: () => navigateMock
}))

describe('HostFinishedView', () => {
	beforeEach(() => {
		navigateMock.mockReset()
	})

	afterEach(cleanup)

	it('says the game is over', () => {
		renderWithTheme(<HostFinishedView quizId={3} gameId={7} onBack={vi.fn()} />)

		expect(
			screen.getByRole('heading', { name: HOST_FINISHED_COPY.title })
		).toBeInTheDocument()
	})

	it('opens the statistics of this game', async () => {
		renderWithTheme(<HostFinishedView quizId={3} gameId={7} onBack={vi.fn()} />)

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: HOST_FINISHED_COPY.viewStats }))

		expect(navigateMock).toHaveBeenCalledWith({
			to: PATHS.gameStats,
			params: { quizId: '3', gameId: '7' }
		})
	})

	it('lets the host go back to the quizzes', async () => {
		const onBack = vi.fn()
		renderWithTheme(<HostFinishedView quizId={3} gameId={7} onBack={onBack} />)

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: HOST_FINISHED_COPY.back }))

		expect(onBack).toHaveBeenCalledOnce()
	})
})
