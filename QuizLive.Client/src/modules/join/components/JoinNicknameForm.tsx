import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Input } from '@components/ui/Input'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

import { codeLabel, panel } from '@modules/join/components/JoinByCodePanel.css'
import { JOIN_FORM_COPY, JOIN_FORM_FIELDS } from '@modules/join/constants'
import { joinFormSchema } from '@modules/join/schemas'
import type { JoinFormValues } from '@modules/join/types'

import { ApiError } from '@api/apiError'
import { getFieldErrors } from '@api/getFieldErrors'

export type JoinNicknameFormProps = {
	quizTitle: string
	// Joins the game. A rejected promise is shown in the form: the text of the server for an ApiError, a
	// generic one for anything else.
	onSubmit: (values: JoinFormValues) => Promise<unknown>
	onBack: () => void
}

export function JoinNicknameForm({
	quizTitle,
	onSubmit,
	onBack
}: JoinNicknameFormProps) {
	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting }
	} = useForm<JoinFormValues>({
		resolver: zodResolver(joinFormSchema),
		defaultValues: { nickname: '' }
	})

	const submit = async (values: JoinFormValues) => {
		try {
			await onSubmit(values)
		} catch (error) {
			if (!(error instanceof ApiError)) {
				setError('root', { message: JOIN_FORM_COPY.genericError })
				return
			}

			// A 400 belongs to the field; 404 and 409 (the nickname is taken, the game has started)
			// have only a message for the whole form.
			const fieldErrors = getFieldErrors(error, JOIN_FORM_FIELDS)

			if (fieldErrors.nickname) {
				setError('nickname', { message: fieldErrors.nickname })
				return
			}

			setError('root', { message: error.detail ?? JOIN_FORM_COPY.genericError })
		}
	}

	return (
		<form
			className={panel}
			noValidate
			onSubmit={event => void handleSubmit(submit)(event)}
		>
			<Heading level={3}>{JOIN_FORM_COPY.title}</Heading>
			<Text size='sm' tone='muted'>
				{JOIN_FORM_COPY.joining(quizTitle)}
			</Text>

			{errors.root?.message ? (
				<Alert variant='danger' title={JOIN_FORM_COPY.errorTitle}>
					{errors.root.message}
				</Alert>
			) : null}

			<label className={codeLabel} htmlFor='join-nickname'>
				{JOIN_FORM_COPY.nicknameLabel}
			</label>
			<Input
				id='join-nickname'
				autoFocus
				autoComplete='nickname'
				placeholder={JOIN_FORM_COPY.nicknamePlaceholder}
				invalid={Boolean(errors.nickname)}
				aria-invalid={Boolean(errors.nickname)}
				{...register('nickname')}
			/>
			{errors.nickname?.message ? (
				<Text size='sm' tone='danger' role='alert'>
					{errors.nickname.message}
				</Text>
			) : null}

			<Stack direction='row' align='stretch'>
				<Button variant='secondary' onClick={onBack} disabled={isSubmitting}>
					{JOIN_FORM_COPY.back}
				</Button>
				<Button type='submit' variant='primary' loading={isSubmitting}>
					{JOIN_FORM_COPY.submit}
				</Button>
			</Stack>
		</form>
	)
}
