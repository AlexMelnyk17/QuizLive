import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@components/ui/Button'
import { Text } from '@components/ui/Text'
import { Textarea } from '@components/ui/Textarea'

import { answerForm } from '@modules/game/components/PlayerQuestionView.css'
import {
	OPEN_ANSWER_MAX_LENGTH,
	PLAYER_ANSWER_COPY
} from '@modules/game/constants'
import { openAnswerFormSchema } from '@modules/game/schemas'
import type { OpenAnswerFormValues } from '@modules/game/types'

export type PlayerOpenAnswerFormProps = {
	initialText?: string
	hasAnswered?: boolean
	disabled: boolean
	isSubmitting: boolean
	onSubmit: (text: string) => Promise<void>
}

export function PlayerOpenAnswerForm({
	initialText = '',
	hasAnswered = false,
	disabled,
	isSubmitting,
	onSubmit
}: PlayerOpenAnswerFormProps) {
	const id = useId()
	const {
		register,
		handleSubmit,
		formState: { errors }
	} = useForm<OpenAnswerFormValues>({
		resolver: zodResolver(openAnswerFormSchema),
		defaultValues: { text: initialText }
	})
	return (
		<form
			className={answerForm}
			onSubmit={event => {
				void handleSubmit(values => onSubmit(values.text))(event)
			}}
		>
			<label htmlFor={id}>{PLAYER_ANSWER_COPY.label}</label>
			<Textarea
				id={id}
				{...register('text')}
				maxLength={OPEN_ANSWER_MAX_LENGTH}
				disabled={disabled}
				aria-invalid={Boolean(errors.text)}
				aria-describedby={errors.text ? `${id}-error` : undefined}
			/>
			{errors.text ? (
				<Text id={`${id}-error`} tone='danger'>
					{errors.text.message}
				</Text>
			) : null}
			<Button type='submit' disabled={disabled} loading={isSubmitting}>
				{hasAnswered ? PLAYER_ANSWER_COPY.update : PLAYER_ANSWER_COPY.submit}
			</Button>
		</form>
	)
}
