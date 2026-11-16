import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { QuizForm } from '@modules/quizzes/components/QuizForm'
import {
	QUIZ_FIELD_LIMITS,
	QUIZ_FORM_COPY,
	QUIZ_KIND_DESCRIPTIONS,
	QUIZ_KIND_LABELS,
	QUIZ_KIND_ORDER,
	QuizKind
} from '@modules/quizzes/constants'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

import { renderWithTheme } from '@src/test/testUtils'

const SUBMIT_LABEL = QUIZ_FORM_COPY.submitCreate

function renderQuizForm(
	onSubmit: (values: unknown) => Promise<unknown> = () => Promise.resolve(),
	onCancel = vi.fn()
) {
	renderWithTheme(
		<QuizForm
			submitLabel={SUBMIT_LABEL}
			onSubmit={onSubmit}
			onCancel={onCancel}
		/>
	)
}

describe('QuizForm', () => {
	afterEach(() => {
		cleanup()
	})

	it('offers every quiz kind with its description and selects the first one', () => {
		renderQuizForm()

		for (const kind of QUIZ_KIND_ORDER) {
			expect(
				screen.getByRole('radio', { name: QUIZ_KIND_LABELS[kind] })
			).toHaveAccessibleDescription(QUIZ_KIND_DESCRIPTIONS[kind])
		}
		expect(
			screen.getByRole('radio', { name: QUIZ_KIND_LABELS[QuizKind.OpenText] })
		).toBeChecked()
		expect(screen.getByText(QUIZ_FORM_COPY.kindFixedNote)).toBeInTheDocument()
	})

	it('requires a title and does not submit without it', async () => {
		const user = userEvent.setup()
		const onSubmit = vi.fn()
		renderQuizForm(onSubmit)

		await user.type(screen.getByLabelText(QUIZ_FORM_COPY.fields.title), '   ')
		await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }))

		expect(
			await screen.findByText(QUIZ_FORM_COPY.validation.titleRequired)
		).toBeInTheDocument()
		expect(onSubmit).not.toHaveBeenCalled()
	})

	it('rejects a title and a description that are too long', async () => {
		const user = userEvent.setup()
		const onSubmit = vi.fn()
		renderQuizForm(onSubmit)

		await user.click(screen.getByLabelText(QUIZ_FORM_COPY.fields.title))
		await user.paste('a'.repeat(QUIZ_FIELD_LIMITS.titleMax + 1))
		await user.click(screen.getByLabelText(QUIZ_FORM_COPY.fields.description))
		await user.paste('b'.repeat(QUIZ_FIELD_LIMITS.descriptionMax + 1))
		await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }))

		expect(
			await screen.findByText(QUIZ_FORM_COPY.validation.titleMax)
		).toBeInTheDocument()
		expect(
			screen.getByText(QUIZ_FORM_COPY.validation.descriptionMax)
		).toBeInTheDocument()
		expect(onSubmit).not.toHaveBeenCalled()
	})

	it('submits the trimmed values and the chosen kind', async () => {
		const user = userEvent.setup()
		const onSubmit = vi.fn().mockResolvedValue(undefined)
		renderQuizForm(onSubmit)

		await user.type(
			screen.getByLabelText(QUIZ_FORM_COPY.fields.title),
			'  Math  '
		)
		await user.type(
			screen.getByLabelText(QUIZ_FORM_COPY.fields.description),
			'  Numbers  '
		)
		await user.click(
			screen.getByRole('radio', { name: QUIZ_KIND_LABELS[QuizKind.QuizChoice] })
		)
		await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }))

		await vi.waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith({
				title: 'Math',
				description: 'Numbers',
				kind: QuizKind.QuizChoice
			})
		})
	})

	it('shows server field errors next to the fields, ignoring key case', async () => {
		const user = userEvent.setup()
		const onSubmit = vi.fn().mockRejectedValue(
			new ApiError(HTTP_STATUS.BAD_REQUEST, {
				errors: { Title: ['The title is not allowed.'] }
			})
		)
		renderQuizForm(onSubmit)

		await user.type(screen.getByLabelText(QUIZ_FORM_COPY.fields.title), 'Math')
		await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }))

		expect(
			await screen.findByText('The title is not allowed.')
		).toBeInTheDocument()
	})

	it('shows the server message for the whole form and keeps the values', async () => {
		const user = userEvent.setup()
		const onSubmit = vi
			.fn()
			.mockRejectedValue(
				new ApiError(HTTP_STATUS.CONFLICT, { detail: 'The quiz is archived.' })
			)
		renderQuizForm(onSubmit)

		await user.type(screen.getByLabelText(QUIZ_FORM_COPY.fields.title), 'Math')
		await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }))

		expect(await screen.findByText('The quiz is archived.')).toBeInTheDocument()
		expect(screen.getByText(QUIZ_FORM_COPY.errorTitle)).toBeInTheDocument()
		expect(screen.getByLabelText(QUIZ_FORM_COPY.fields.title)).toHaveValue(
			'Math'
		)
	})

	it('shows a generic message for an unexpected error', async () => {
		const user = userEvent.setup()
		renderQuizForm(() => Promise.reject(new Error('Network error')))

		await user.type(screen.getByLabelText(QUIZ_FORM_COPY.fields.title), 'Math')
		await user.click(screen.getByRole('button', { name: SUBMIT_LABEL }))

		expect(
			await screen.findByText(QUIZ_FORM_COPY.genericError)
		).toBeInTheDocument()
	})

	it('calls onCancel', async () => {
		const user = userEvent.setup()
		const onCancel = vi.fn()
		renderQuizForm(undefined, onCancel)

		await user.click(
			screen.getByRole('button', { name: QUIZ_FORM_COPY.cancel })
		)

		expect(onCancel).toHaveBeenCalled()
	})
})
