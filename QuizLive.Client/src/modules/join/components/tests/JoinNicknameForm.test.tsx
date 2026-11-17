import { cleanup, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { JoinNicknameForm } from '@modules/join/components/JoinNicknameForm'
import {
	JOIN_FORM_COPY,
	JOIN_NICKNAME_MAX_LENGTH
} from '@modules/join/constants'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

import { renderWithTheme } from '@src/test/testUtils'

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
	const onBack = vi.fn()

	renderWithTheme(
		<JoinNicknameForm
			quizTitle='STEM basics'
			onSubmit={onSubmit}
			onBack={onBack}
		/>
	)

	return { onSubmit, onBack, user: userEvent.setup() }
}

function joinButton() {
	return screen.getByRole('button', { name: JOIN_FORM_COPY.submit })
}

describe('JoinNicknameForm', () => {
	afterEach(cleanup)

	it('shows the quiz the player is joining and asks for a nickname', () => {
		renderForm()

		expect(
			screen.getByText(JOIN_FORM_COPY.joining('STEM basics'))
		).toBeInTheDocument()
		expect(
			screen.getByLabelText(JOIN_FORM_COPY.nicknameLabel)
		).toBeInTheDocument()
	})

	it('joins with the nickname, without the spaces around it', async () => {
		const { onSubmit, user } = renderForm()

		await user.type(
			screen.getByLabelText(JOIN_FORM_COPY.nicknameLabel),
			'  Ann  '
		)
		await user.click(joinButton())

		expect(onSubmit).toHaveBeenCalledOnce()
		expect(onSubmit.mock.calls[0]?.[0]).toEqual({ nickname: 'Ann' })
	})

	it('does not join without a nickname', async () => {
		const { onSubmit, user } = renderForm()

		await user.click(joinButton())

		expect(
			await screen.findByText(JOIN_FORM_COPY.validation.nicknameRequired)
		).toBeInTheDocument()
		expect(onSubmit).not.toHaveBeenCalled()
	})

	it('does not join with a nickname that is too long', async () => {
		const { onSubmit, user } = renderForm()

		await user.type(
			screen.getByLabelText(JOIN_FORM_COPY.nicknameLabel),
			'a'.repeat(JOIN_NICKNAME_MAX_LENGTH + 1)
		)
		await user.click(joinButton())

		expect(
			await screen.findByText(JOIN_FORM_COPY.validation.nicknameMax)
		).toBeInTheDocument()
		expect(onSubmit).not.toHaveBeenCalled()
	})

	it('goes back to the code', async () => {
		const { onBack, user } = renderForm()

		await user.click(screen.getByRole('button', { name: JOIN_FORM_COPY.back }))

		expect(onBack).toHaveBeenCalledOnce()
	})

	it.each([
		[HTTP_STATUS.CONFLICT, 'The nickname "Ann" is already taken in this game.'],
		[HTTP_STATUS.CONFLICT, 'The game has already started.'],
		[HTTP_STATUS.NOT_FOUND, 'Game with code 283646 was not found.']
	])(
		'shows the text of the server for the error %i: %s',
		async (status, detail) => {
			const onSubmit = vi
				.fn()
				.mockRejectedValue(new ApiError(status, { status, detail }))
			const { user } = renderForm(onSubmit)

			await user.type(
				screen.getByLabelText(JOIN_FORM_COPY.nicknameLabel),
				'Ann'
			)
			await user.click(joinButton())

			expect(await screen.findByRole('alert')).toHaveTextContent(detail)
		}
	)

	it('shows a server error about the nickname next to the field', async () => {
		const onSubmit = vi.fn().mockRejectedValue(
			new ApiError(HTTP_STATUS.BAD_REQUEST, {
				status: HTTP_STATUS.BAD_REQUEST,
				errors: { nickname: ['Nickname is required.'] }
			})
		)
		const { user } = renderForm(onSubmit)

		await user.type(screen.getByLabelText(JOIN_FORM_COPY.nicknameLabel), 'Ann')
		await user.click(joinButton())

		expect(await screen.findByText('Nickname is required.')).toBeInTheDocument()
		expect(screen.getByLabelText(JOIN_FORM_COPY.nicknameLabel)).toBeInvalid()
	})

	it('shows a generic text when the connection fails', async () => {
		const onSubmit = vi.fn().mockRejectedValue(new Error('Failed to fetch'))
		const { user } = renderForm(onSubmit)

		await user.type(screen.getByLabelText(JOIN_FORM_COPY.nicknameLabel), 'Ann')
		await user.click(joinButton())

		expect(await screen.findByRole('alert')).toHaveTextContent(
			JOIN_FORM_COPY.genericError
		)
	})

	it('lets the player try again after an error', async () => {
		const onSubmit = vi
			.fn()
			.mockRejectedValueOnce(new Error('Failed to fetch'))
			.mockResolvedValue(undefined)
		const { user } = renderForm(onSubmit)
		await user.type(screen.getByLabelText(JOIN_FORM_COPY.nicknameLabel), 'Ann')
		await user.click(joinButton())
		await screen.findByRole('alert')

		await user.click(joinButton())

		expect(onSubmit).toHaveBeenCalledTimes(2)
	})
})
