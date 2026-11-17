import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HostQuestionView } from '@modules/game/components/HostQuestionView'
import {
	HOST_QUESTION_COPY,
	PLAYER_QUESTION_COPY
} from '@modules/game/constants'
import { useQuestionCountdown } from '@modules/game/hooks/useQuestionCountdown'
import type { HostQuestionDto } from '@modules/game/types'

import { renderWithTheme } from '@src/test/testUtils'

// The countdown has its own tests; here the view is tested with the seconds the hook says are left.
vi.mock('@modules/game/hooks/useQuestionCountdown', () => ({
	useQuestionCountdown: vi.fn()
}))

const countdownMock = vi.mocked(useQuestionCountdown)

function question(
	overrides: Partial<HostQuestionDto['question']> = {}
): HostQuestionDto {
	return {
		number: 2,
		total: 5,
		question: {
			id: 12,
			order: 2,
			text: 'What is 2 + 2?',
			timeLimitSeconds: 30,
			basePoints: 100,
			imageUrl: null,
			options: [
				{ id: 21, order: 1, text: '4', isCorrect: true },
				{ id: 22, order: 2, text: '5', isCorrect: false }
			],
			...overrides
		},
		timing: {
			startedAtUtc: '2026-11-17T10:00:00Z',
			endsAtUtc: '2026-11-17T10:00:30Z',
			serverNowUtc: '2026-11-17T10:00:05Z'
		}
	}
}

function renderView(
	props: Partial<Parameters<typeof HostQuestionView>[0]> = {}
) {
	countdownMock.mockReturnValue(25)

	return renderWithTheme(
		<HostQuestionView
			question={question()}
			receivedAtMs={0}
			onShowResults={vi.fn().mockResolvedValue(null)}
			{...props}
		/>
	)
}

describe('HostQuestionView', () => {
	afterEach(cleanup)

	it('shows the number of the question, out of how many, and its text', () => {
		renderView()

		expect(
			screen.getByRole('heading', { name: PLAYER_QUESTION_COPY.heading(2, 5) })
		).toBeInTheDocument()
		expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument()
	})

	it('marks the correct option, and only that one', () => {
		renderView()

		const [first, second] = screen.getAllByRole('listitem')

		expect(
			within(first).getByText(HOST_QUESTION_COPY.correct)
		).toBeInTheDocument()
		expect(
			within(second).queryByText(HOST_QUESTION_COPY.correct)
		).not.toBeInTheDocument()
	})

	it('says players type their own answer for an open text question, and shows no options', () => {
		renderView({ question: question({ options: null }) })

		expect(screen.queryByRole('list')).not.toBeInTheDocument()
		expect(screen.getByText(HOST_QUESTION_COPY.openText)).toBeInTheDocument()
	})

	it('shows the image of the question', () => {
		renderView({
			question: question({ imageUrl: 'https://example.com/a.png' })
		})

		expect(
			screen.getByRole('img', { name: PLAYER_QUESTION_COPY.imageAlt })
		).toHaveAttribute('src', 'https://example.com/a.png')
	})

	it('gives the countdown the timing and when the question arrived', () => {
		const current = question()

		renderView({ question: current, receivedAtMs: 1234 })

		expect(countdownMock).toHaveBeenCalledWith(current.timing, 1234)
	})

	it('shows the seconds left', () => {
		countdownMock.mockReturnValue(17)

		renderWithTheme(
			<HostQuestionView
				question={question()}
				receivedAtMs={0}
				onShowResults={vi.fn()}
			/>
		)

		expect(screen.getByText('17')).toBeInTheDocument()
	})

	it('says the time is up at zero', () => {
		countdownMock.mockReturnValue(0)

		renderWithTheme(
			<HostQuestionView
				question={question()}
				receivedAtMs={0}
				onShowResults={vi.fn()}
			/>
		)

		expect(screen.getByText(PLAYER_QUESTION_COPY.timeUp)).toBeInTheDocument()
	})

	it('shows no countdown for a question without a time limit', () => {
		countdownMock.mockReturnValue(null)

		renderWithTheme(
			<HostQuestionView
				question={question({ timeLimitSeconds: null })}
				receivedAtMs={0}
				onShowResults={vi.fn()}
			/>
		)

		expect(
			screen.queryByText(PLAYER_QUESTION_COPY.timeUp)
		).not.toBeInTheDocument()
	})

	it('shows the results with the button', async () => {
		const onShowResults = vi.fn().mockResolvedValue(null)
		renderView({ onShowResults })

		await userEvent
			.setup()
			.click(
				screen.getByRole('button', { name: HOST_QUESTION_COPY.showResults })
			)

		expect(onShowResults).toHaveBeenCalledOnce()
		expect(screen.queryByRole('alert')).not.toBeInTheDocument()
	})

	it('shows the text of the server when it refuses, and lets the host try again', async () => {
		const user = userEvent.setup()
		const onShowResults = vi
			.fn()
			.mockResolvedValueOnce('The question is already closed.')
			.mockResolvedValueOnce(null)
		renderView({ onShowResults })
		const button = screen.getByRole('button', {
			name: HOST_QUESTION_COPY.showResults
		})

		await user.click(button)

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'The question is already closed.'
		)
		expect(button).toBeEnabled()

		await user.click(button)

		expect(onShowResults).toHaveBeenCalledTimes(2)
	})
})
