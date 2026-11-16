import { zodResolver } from '@hookform/resolvers/zod'
import cn from 'clsx'
import { useId } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Radio } from '@components/ui/Radio'
import { Text } from '@components/ui/Text'
import { Textarea } from '@components/ui/Textarea'

import { formPanel } from '@modules/quizzes/components/QuizEditor.css'
import {
	field,
	fieldError,
	fieldLabel,
	formActions,
	kindOption,
	kindOptionSelected,
	kindOptions,
	quizForm
} from '@modules/quizzes/components/QuizForm.css'
import {
	QUIZ_FORM_COPY,
	QUIZ_KIND_DESCRIPTIONS,
	QUIZ_KIND_LABELS,
	QUIZ_KIND_ORDER,
	QuizKind
} from '@modules/quizzes/constants'
import { quizFormSchema } from '@modules/quizzes/schemas'
import type { QuizFormValues } from '@modules/quizzes/types'

import { ApiError } from '@api/apiError'
import { getFieldErrors } from '@api/getFieldErrors'

const FORM_FIELDS = ['title', 'description', 'kind'] as const

const DEFAULT_VALUES: QuizFormValues = {
	title: '',
	description: '',
	kind: QuizKind.OpenText
}

export type QuizFormProps = {
	submitLabel: string
	onSubmit: (values: QuizFormValues) => Promise<unknown>
	onCancel: () => void
	initialValues?: QuizFormValues
	kindReadOnly?: boolean
	children?: ReactNode
	disabled?: boolean
	saveDisabledReason?: string
}

export function QuizForm({
	submitLabel,
	onSubmit,
	onCancel,
	initialValues,
	kindReadOnly = false,
	children,
	disabled = false,
	saveDisabledReason
}: QuizFormProps) {
	const formId = useId()
	const {
		register,
		handleSubmit,
		control,
		setValue,
		setError,
		formState: { errors, isSubmitting }
	} = useForm<QuizFormValues>({
		resolver: zodResolver(quizFormSchema),
		defaultValues: initialValues ?? DEFAULT_VALUES
	})
	const kind = useWatch({ control, name: 'kind' })

	const submit = async (values: QuizFormValues) => {
		try {
			await onSubmit(values)
		} catch (error) {
			if (!(error instanceof ApiError)) {
				setError('root', { message: QUIZ_FORM_COPY.genericError })
				return
			}

			// 400 errors belong to fields; 409 and the rest have only a message for the whole form.
			const fieldErrors = getFieldErrors(error)
			const fieldsWithErrors = FORM_FIELDS.filter(name => fieldErrors[name])

			for (const name of fieldsWithErrors) {
				setError(name, { message: fieldErrors[name] })
			}

			if (fieldsWithErrors.length === 0) {
				setError('root', {
					message: error.detail ?? QUIZ_FORM_COPY.genericError
				})
			}
		}
	}

	const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
		if (disabled || saveDisabledReason) {
			event.preventDefault()
			return
		}
		void handleSubmit(submit)(event)
	}

	return (
		<div className={cn(quizForm, formPanel)}>
			<form id={formId} onSubmit={onFormSubmit} noValidate className={quizForm}>
				<fieldset disabled={disabled} className={cn(field, quizForm)}>
					{errors.root?.message ? (
						<Alert variant='danger' title={QUIZ_FORM_COPY.errorTitle}>
							{errors.root.message}
						</Alert>
					) : null}

					<div className={field}>
						<label className={fieldLabel} htmlFor='quiz-title'>
							{QUIZ_FORM_COPY.fields.title}
						</label>
						<Input
							id='quiz-title'
							placeholder={QUIZ_FORM_COPY.placeholders.title}
							invalid={Boolean(errors.title)}
							fullWidth
							{...register('title')}
						/>
						{errors.title?.message ? (
							<p className={fieldError} role='alert'>
								{errors.title.message}
							</p>
						) : null}
					</div>

					<div className={field}>
						<label className={fieldLabel} htmlFor='quiz-description'>
							{QUIZ_FORM_COPY.fields.description}
						</label>
						<Textarea
							id='quiz-description'
							placeholder={QUIZ_FORM_COPY.placeholders.description}
							rows={4}
							invalid={Boolean(errors.description)}
							{...register('description')}
						/>
						{errors.description?.message ? (
							<p className={fieldError} role='alert'>
								{errors.description.message}
							</p>
						) : null}
					</div>

					<fieldset className={field}>
						<legend className={fieldLabel}>{QUIZ_FORM_COPY.fields.kind}</legend>
						{kindReadOnly ? (
							<Text>{QUIZ_KIND_LABELS[kind]}</Text>
						) : (
							<div className={kindOptions}>
								{QUIZ_KIND_ORDER.map(value => (
									<div
										key={value}
										className={cn(
											kindOption,
											kind === value && kindOptionSelected
										)}
									>
										<Radio
											id={`quiz-kind-${value}`}
											name='kind'
											label={QUIZ_KIND_LABELS[value]}
											checked={kind === value}
											onChange={() => setValue('kind', value)}
											aria-describedby={`quiz-kind-${value}-hint`}
										/>
										<Text size='sm' tone='muted' id={`quiz-kind-${value}-hint`}>
											{QUIZ_KIND_DESCRIPTIONS[value]}
										</Text>
									</div>
								))}
							</div>
						)}
						<Text size='sm' tone='muted'>
							{QUIZ_FORM_COPY.kindFixedNote}
						</Text>
						{errors.kind?.message ? (
							<p className={fieldError} role='alert'>
								{errors.kind.message}
							</p>
						) : null}
					</fieldset>
				</fieldset>
			</form>
			{children}
			{saveDisabledReason ? (
				<Text id={`${formId}-save-hint`} size='sm' tone='muted'>
					{saveDisabledReason}
				</Text>
			) : null}
			<div className={formActions}>
				<Button
					form={formId}
					type='submit'
					variant='primary'
					loading={isSubmitting}
					disabled={disabled || Boolean(saveDisabledReason)}
					aria-describedby={
						saveDisabledReason ? `${formId}-save-hint` : undefined
					}
				>
					{submitLabel}
				</Button>
				<Button
					type='button'
					variant='outline'
					disabled={disabled}
					onClick={onCancel}
				>
					{QUIZ_FORM_COPY.cancel}
				</Button>
			</div>
		</div>
	)
}
