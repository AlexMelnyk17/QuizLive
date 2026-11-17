import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PlayerQuestionView } from '@modules/game/components/PlayerQuestionView'
import {
	PLAYER_ANSWER_COPY,
	PLAYER_QUESTION_COPY
} from '@modules/game/constants'
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
	it('sends the chosen option with the current question number', async () => {
		countdownMock.mockReturnValue(25)
		const submit = vi.fn().mockResolvedValue(null)
		renderWithTheme(
			<PlayerQuestionView
				question={question()}
				receivedAtMs={0}
				connected
				onSubmitAnswer={submit}
			/>
		)
		await userEvent.setup().click(screen.getByRole('button', { name: /4/ }))
		expect(submit).toHaveBeenCalledWith({ questionNumber: 2, optionId: 21 })
	})

	it('validates and trims a free text answer before sending it', async () => {
		countdownMock.mockReturnValue(null)
		const submit = vi.fn().mockResolvedValue(null)
		renderWithTheme(
			<PlayerQuestionView
				question={question({ options: null })}
				receivedAtMs={0}
				connected
				onSubmitAnswer={submit}
			/>
		)
		const user = userEvent.setup()
		await user.click(
			screen.getByRole('button', { name: PLAYER_ANSWER_COPY.submit })
		)
		expect(
			await screen.findByText(PLAYER_ANSWER_COPY.required)
		).toBeInTheDocument()
		expect(submit).not.toHaveBeenCalled()
		await user.type(
			screen.getByLabelText(PLAYER_ANSWER_COPY.label),
			'  Hello  '
		)
		await user.click(
			screen.getByRole('button', { name: PLAYER_ANSWER_COPY.submit })
		)
		expect(submit).toHaveBeenCalledWith({ questionNumber: 2, text: 'Hello' })
	})

	it.each([{ isSubmitting: true }, { connected: false }])(
		'locks choices when %j',
		props => {
			countdownMock.mockReturnValue(25)
			renderWithTheme(
				<PlayerQuestionView
					question={question()}
					receivedAtMs={0}
					connected
					onSubmitAnswer={vi.fn()}
					{...props}
				/>
			)
			expect(screen.getByRole('button', { name: /4/ })).toBeDisabled()
		}
	)

	it('locks choices when the deadline passes', () => {
		countdownMock.mockReturnValue(0)
		renderWithTheme(
			<PlayerQuestionView
				question={question()}
				receivedAtMs={0}
				connected
				onSubmitAnswer={vi.fn()}
			/>
		)
		expect(screen.getByRole('button', { name: /4/ })).toBeDisabled()
	})

	it('highlights the saved choice and lets the player choose a different option', async () => {
		countdownMock.mockReturnValue(25)
		const submit = vi.fn().mockResolvedValue(null)
		renderWithTheme(
			<PlayerQuestionView
				question={question()}
				receivedAtMs={0}
				connected
				hasAnswered
				selectedAnswer={{ questionNumber: 2, optionId: 21 }}
				onSubmitAnswer={submit}
			/>
		)
		expect(screen.getByRole('button', { name: /4/ })).toHaveAttribute(
			'aria-pressed',
			'true'
		)
		expect(screen.getByRole('button', { name: /5/ })).toHaveAttribute(
			'aria-pressed',
			'false'
		)
		await userEvent.setup().click(screen.getByRole('button', { name: /5/ }))
		expect(submit).toHaveBeenCalledWith({ questionNumber: 2, optionId: 22 })
	})

	it('restores the saved open text and lets the player update it', async () => {
		countdownMock.mockReturnValue(null)
		const submit = vi.fn().mockResolvedValue(null)
		renderWithTheme(
			<PlayerQuestionView
				question={question({ options: null })}
				receivedAtMs={0}
				connected
				hasAnswered
				selectedAnswer={{ questionNumber: 2, text: 'Kyiv' }}
				onSubmitAnswer={submit}
			/>
		)
		const user = userEvent.setup()
		const field = screen.getByLabelText(PLAYER_ANSWER_COPY.label)
		expect(field).toHaveValue('Kyiv')
		await user.clear(field)
		await user.type(field, 'Lviv')
		await user.click(
			screen.getByRole('button', { name: PLAYER_ANSWER_COPY.update })
		)
		expect(submit).toHaveBeenCalledWith({ questionNumber: 2, text: 'Lviv' })
	})

	it('shows a server rejection and permits another attempt', async () => {
		countdownMock.mockReturnValue(25)
		const submit = vi.fn().mockResolvedValue('The question is closed.')
		renderWithTheme(
			<PlayerQuestionView
				question={question()}
				receivedAtMs={0}
				connected
				onSubmitAnswer={submit}
			/>
		)
		await userEvent.setup().click(screen.getByRole('button', { name: /4/ }))
		expect(await screen.findByRole('alert')).toHaveTextContent(
			'The question is closed.'
		)
		expect(screen.getByRole('button', { name: /4/ })).toBeEnabled()
	})
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
