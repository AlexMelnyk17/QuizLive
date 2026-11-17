import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { QuestionForm } from '@modules/quizzes/components/QuestionForm'
import {
	QUESTION_FORM_COPY as COPY,
	QuizKind
} from '@modules/quizzes/constants'
import { questionFormSchema } from '@modules/quizzes/questionFormSchema'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

import { renderWithTheme } from '@src/test/testUtils'

afterEach(cleanup)

describe('QuestionForm', () => {
	it('maps uppercase numeric and correctness errors to the matching fields', async () => {
		const save = vi.fn().mockRejectedValue(
			new ApiError(HTTP_STATUS.BAD_REQUEST, {
				errors: {
					TIMELIMITSECONDS: ['Invalid time'],
					BASEPOINTS: ['Invalid points'],
					'OPTIONS[0].ISCORRECT': ['Invalid correct answer']
				}
			})
		)
		const user = userEvent.setup()
		renderWithTheme(
			<QuestionForm
				kind={QuizKind.QuizChoice}
				onSubmit={save}
				onCancel={vi.fn()}
			/>
		)
		await user.type(screen.getByLabelText(COPY.text), 'Question')
		await user.type(screen.getByLabelText(COPY.option(0)), 'A')
		await user.type(screen.getByLabelText(COPY.option(1)), 'B')
		await user.type(screen.getByLabelText(COPY.time), '30')
		await user.type(screen.getByLabelText(COPY.points), '100')
		await user.click(screen.getByRole('radio', { name: COPY.correct(0) }))
		await user.click(screen.getByRole('button', { name: COPY.save }))
		expect(await screen.findByText('Invalid time')).toBeInTheDocument()
		expect(screen.getByText('Invalid points')).toBeInTheDocument()
		expect(screen.getByText('Invalid correct answer')).toBeInTheDocument()
		expect(screen.getByLabelText(COPY.time)).toHaveValue(30)
		expect(screen.getByLabelText(COPY.points)).toHaveValue(100)
	})

	it('keeps question input after a conflict', async () => {
		const save = vi.fn().mockRejectedValue(
			new ApiError(HTTP_STATUS.CONFLICT, {
				detail: 'This question has answers.'
			})
		)
		const user = userEvent.setup()
		renderWithTheme(
			<QuestionForm
				kind={QuizKind.OpenText}
				onSubmit={save}
				onCancel={vi.fn()}
			/>
		)
		await user.type(screen.getByLabelText(COPY.text), 'Question')
		await user.click(screen.getByRole('button', { name: COPY.save }))
		expect(
			await screen.findByText('This question has answers.')
		).toBeInTheDocument()
		expect(screen.getByLabelText(COPY.text)).toHaveValue('Question')
	})
	it.each([QuizKind.PollChoice, QuizKind.QuizChoice])(
		'requires at least two answer options for kind %s',
		kind => {
			const values = {
				text: 'Question',
				timeLimitSeconds: '',
				basePoints: '',
				imageUrl: '',
				correctIndex: '0',
				options: [{ text: 'Only answer' }]
			}
			expect(questionFormSchema(kind).safeParse(values).success).toBe(false)
			expect(
				questionFormSchema(kind).safeParse({
					...values,
					options: [...values.options, { text: 'Second answer' }]
				}).success
			).toBe(true)
		}
	)
	it('adds an open text question without options', async () => {
		const save = vi.fn().mockResolvedValue(undefined)
		const user = userEvent.setup()
		renderWithTheme(
			<QuestionForm
				kind={QuizKind.OpenText}
				onSubmit={save}
				onCancel={vi.fn()}
			/>
		)
		await user.type(screen.getByLabelText(COPY.text), 'Why?')
		await user.click(screen.getByRole('button', { name: COPY.save }))
		expect(save).toHaveBeenCalledWith({
			text: 'Why?',
			timeLimitSeconds: null,
			imageUrl: null,
			basePoints: null,
			options: null
		})
	})
	it.each([QuizKind.PollChoice, QuizKind.QuizChoice])(
		'adds options for kind %s with the right correctness values',
		async kind => {
			const save = vi.fn().mockResolvedValue(undefined)
			const user = userEvent.setup()
			renderWithTheme(
				<QuestionForm kind={kind} onSubmit={save} onCancel={vi.fn()} />
			)
			await user.type(screen.getByLabelText(COPY.text), 'Choose')
			await user.type(screen.getByLabelText(COPY.option(0)), 'A')
			await user.type(screen.getByLabelText(COPY.option(1)), 'B')
			if (kind === QuizKind.QuizChoice) {
				await user.click(screen.getByRole('button', { name: COPY.save }))
				expect(
					await screen.findByText(COPY.correctRequired)
				).toBeInTheDocument()
				expect(save).not.toHaveBeenCalled()
				await user.click(screen.getByRole('radio', { name: COPY.correct(1) }))
			}
			await user.click(screen.getByRole('button', { name: COPY.save }))
			expect(save).toHaveBeenCalledWith(
				expect.objectContaining({
					options: [
						{
							text: 'A',
							isCorrect: kind === QuizKind.QuizChoice ? false : null
						},
						{ text: 'B', isCorrect: kind === QuizKind.QuizChoice ? true : null }
					]
				})
			)
		}
	)
	it.each(['Options[1].Text', 'OPTIONS[1].TEXT', 'oPtIoNs[1].tExT'])(
		'shows server field error %s and preserves input',
		async key => {
			const save = vi.fn().mockRejectedValue(
				new ApiError(HTTP_STATUS.BAD_REQUEST, {
					errors: { [key]: ['Invalid option'] }
				})
			)
			const user = userEvent.setup()
			renderWithTheme(
				<QuestionForm
					kind={QuizKind.PollChoice}
					onSubmit={save}
					onCancel={vi.fn()}
				/>
			)
			await user.type(screen.getByLabelText(COPY.text), 'Choose')
			await user.type(screen.getByLabelText(COPY.option(0)), 'A')
			await user.type(screen.getByLabelText(COPY.option(1)), 'B')
			await user.click(screen.getByRole('button', { name: COPY.save }))
			expect(await screen.findByText('Invalid option')).toBeInTheDocument()
			expect(screen.getByLabelText(COPY.option(1))).toHaveValue('B')
		}
	)
})
