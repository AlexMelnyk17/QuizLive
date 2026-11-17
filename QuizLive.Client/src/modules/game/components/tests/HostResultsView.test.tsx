import { cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HostResultsView } from '@modules/game/components/HostResultsView'
import { HOST_QUESTION_COPY, HOST_RESULTS_COPY } from '@modules/game/constants'
import type { HostQuestionDto } from '@modules/game/types'

import { renderWithTheme } from '@src/test/testUtils'

function question(number = 2, total = 5): HostQuestionDto {
	return {
		number,
		total,
		question: {
			id: 12,
			order: number,
			text: 'What is 2 + 2?',
			timeLimitSeconds: null,
			basePoints: null,
			imageUrl: null,
			options: [
				{ id: 21, order: 1, text: '4', isCorrect: true },
				{ id: 22, order: 2, text: '5', isCorrect: false }
			]
		},
		timing: {
			startedAtUtc: '2026-11-17T10:00:00Z',
			endsAtUtc: null,
			serverNowUtc: '2026-11-17T10:00:05Z'
		}
	}
}

function renderView(
	props: Partial<Parameters<typeof HostResultsView>[0]> = {}
) {
	return renderWithTheme(
		<HostResultsView
			question={question()}
			onNextQuestion={vi.fn().mockResolvedValue(null)}
			{...props}
		/>
	)
}

describe('HostResultsView', () => {
	afterEach(cleanup)

	it('shows which question was closed, its text and its correct option', () => {
		renderView()

		expect(
			screen.getByRole('heading', { name: HOST_RESULTS_COPY.heading(2, 5) })
		).toBeInTheDocument()
		expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument()

		const [first, second] = screen.getAllByRole('listitem')

		expect(
			within(first).getByText(HOST_QUESTION_COPY.correct)
		).toBeInTheDocument()
		expect(
			within(second).queryByText(HOST_QUESTION_COPY.correct)
		).not.toBeInTheDocument()
	})

	it('moves on to the next question with the button', async () => {
		const onNextQuestion = vi.fn().mockResolvedValue(null)
		renderView({ onNextQuestion })

		await userEvent
			.setup()
			.click(screen.getByRole('button', { name: HOST_RESULTS_COPY.next }))

		expect(onNextQuestion).toHaveBeenCalledOnce()
		expect(screen.queryByRole('alert')).not.toBeInTheDocument()
	})

	it('offers to finish the game after the last question', () => {
		renderView({ question: question(5, 5) })

		expect(
			screen.getByRole('button', { name: HOST_RESULTS_COPY.finish })
		).toBeInTheDocument()
		expect(
			screen.queryByRole('button', { name: HOST_RESULTS_COPY.next })
		).not.toBeInTheDocument()
	})

	it('shows the text of the server when it refuses, and lets the host try again', async () => {
		const user = userEvent.setup()
		const onNextQuestion = vi
			.fn()
			.mockResolvedValueOnce('The game has already moved on.')
			.mockResolvedValueOnce(null)
		renderView({ onNextQuestion })
		const button = screen.getByRole('button', { name: HOST_RESULTS_COPY.next })

		await user.click(button)

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'The game has already moved on.'
		)
		expect(button).toBeEnabled()

		await user.click(button)

		expect(onNextQuestion).toHaveBeenCalledTimes(2)
	})
})
