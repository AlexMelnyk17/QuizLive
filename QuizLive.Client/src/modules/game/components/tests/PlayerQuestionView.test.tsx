import { cleanup, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PlayerQuestionView } from '@modules/game/components/PlayerQuestionView'
import { PLAYER_QUESTION_COPY } from '@modules/game/constants'
import { useQuestionCountdown } from '@modules/game/hooks/useQuestionCountdown'
import type { PlayerQuestionDto } from '@modules/game/types'

import { renderWithTheme } from '@src/test/testUtils'

// The countdown has its own tests; here the view is tested with the seconds the hook says are left.
vi.mock('@modules/game/hooks/useQuestionCountdown', () => ({
	useQuestionCountdown: vi.fn()
}))

const countdownMock = vi.mocked(useQuestionCountdown)

function question(
	overrides: Partial<PlayerQuestionDto> = {}
): PlayerQuestionDto {
	return {
		number: 2,
		total: 5,
		text: 'What is 2 + 2?',
		imageUrl: null,
		timeLimitSeconds: 30,
		options: [
			{ id: 21, order: 1, text: '4' },
			{ id: 22, order: 2, text: '5' }
		],
		timing: {
			startedAtUtc: '2026-11-17T10:00:00Z',
			endsAtUtc: '2026-11-17T10:00:30Z',
			serverNowUtc: '2026-11-17T10:00:05Z'
		},
		...overrides
	}
}

describe('PlayerQuestionView', () => {
	afterEach(cleanup)

	it('shows the number of the question, out of how many, and its text', () => {
		countdownMock.mockReturnValue(25)

		renderWithTheme(
			<PlayerQuestionView question={question()} receivedAtMs={0} />
		)

		expect(
			screen.getByRole('heading', { name: PLAYER_QUESTION_COPY.heading(2, 5) })
		).toBeInTheDocument()
		expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument()
	})

	it('shows the options, which cannot be chosen yet', () => {
		countdownMock.mockReturnValue(25)

		renderWithTheme(
			<PlayerQuestionView question={question()} receivedAtMs={0} />
		)

		const items = screen.getAllByRole('listitem')

		expect(items).toHaveLength(2)
		expect(screen.getByRole('button', { name: /4/ })).toBeDisabled()
		expect(screen.getByRole('button', { name: /5/ })).toBeDisabled()
	})

	it('shows no options for an open text question', () => {
		countdownMock.mockReturnValue(25)

		renderWithTheme(
			<PlayerQuestionView
				question={question({ options: null })}
				receivedAtMs={0}
			/>
		)

		expect(screen.queryByRole('list')).not.toBeInTheDocument()
		expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument()
	})

	it('shows the image of the question', () => {
		countdownMock.mockReturnValue(25)

		renderWithTheme(
			<PlayerQuestionView
				question={question({ imageUrl: 'https://example.com/a.png' })}
				receivedAtMs={0}
			/>
		)

		expect(
			screen.getByRole('img', { name: PLAYER_QUESTION_COPY.imageAlt })
		).toHaveAttribute('src', 'https://example.com/a.png')
	})

	it('shows no image when the question has none', () => {
		countdownMock.mockReturnValue(25)

		renderWithTheme(
			<PlayerQuestionView question={question()} receivedAtMs={0} />
		)

		expect(screen.queryByRole('img')).not.toBeInTheDocument()
	})

	describe('the countdown', () => {
		it('gives the hook the timing and when the question arrived', () => {
			countdownMock.mockReturnValue(25)
			const current = question()

			renderWithTheme(
				<PlayerQuestionView question={current} receivedAtMs={1234} />
			)

			expect(countdownMock).toHaveBeenCalledWith(current.timing, 1234)
		})

		it('shows the seconds left', () => {
			countdownMock.mockReturnValue(17)

			renderWithTheme(
				<PlayerQuestionView question={question()} receivedAtMs={0} />
			)

			expect(screen.getByText('17')).toBeInTheDocument()
		})

		it('says the time is up at zero', () => {
			countdownMock.mockReturnValue(0)

			renderWithTheme(
				<PlayerQuestionView question={question()} receivedAtMs={0} />
			)

			expect(screen.getByText(PLAYER_QUESTION_COPY.timeUp)).toBeInTheDocument()
		})

		it('shows nothing for a question without a time limit', () => {
			countdownMock.mockReturnValue(null)

			renderWithTheme(
				<PlayerQuestionView
					question={question({ timeLimitSeconds: null })}
					receivedAtMs={0}
				/>
			)

			expect(
				screen.queryByText(PLAYER_QUESTION_COPY.timeUp)
			).not.toBeInTheDocument()
			expect(screen.queryByText('0')).not.toBeInTheDocument()
		})
	})
})
