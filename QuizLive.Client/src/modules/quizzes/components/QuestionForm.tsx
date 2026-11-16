import { zodResolver } from '@hookform/resolvers/zod'
import cn from 'clsx'
import { Plus, X } from 'lucide-react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import type { FieldPath } from 'react-hook-form'

import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Icon } from '@components/ui/Icon'
import { Input } from '@components/ui/Input'
import { Radio } from '@components/ui/Radio'
import { Textarea } from '@components/ui/Textarea'

import {
	compactAction,
	formPanel,
	optionInput,
	optionRow
} from '@modules/quizzes/components/QuizEditor.css'
import {
	field,
	fieldError,
	fieldLabel,
	formActions,
	quizForm
} from '@modules/quizzes/components/QuizForm.css'
import {
	QUESTION_FORM_COPY as COPY,
	QUESTION_LIMITS as LIMITS,
	QUIZ_FORM_COPY,
	QuizKind
} from '@modules/quizzes/constants'
import { questionFormSchema } from '@modules/quizzes/questionFormSchema'
import type { QuestionFormValues } from '@modules/quizzes/questionFormSchema'
import type {
	QuestionDto,
	QuestionRequest,
	QuizKindValue
} from '@modules/quizzes/types'

import { ApiError } from '@api/apiError'
import { getFieldErrors } from '@api/getFieldErrors'

type QuestionFormProps = {
	kind: QuizKindValue
	onSubmit: (request: QuestionRequest) => Promise<unknown>
	onCancel: () => void
	question?: QuestionDto
}

export function QuestionForm({
	kind,
	onSubmit,
	onCancel,
	question
}: QuestionFormProps) {
	const {
		register,
		control,
		handleSubmit,
		setError,
		setValue,
		formState: { errors, isSubmitting }
	} = useForm<QuestionFormValues>({
		resolver: zodResolver(questionFormSchema(kind)),
		defaultValues: question
			? {
					text: question.text,
					timeLimitSeconds: question.timeLimitSeconds?.toString() ?? '',
					basePoints: question.basePoints?.toString() ?? '',
					imageUrl: question.imageUrl ?? '',
					options:
						question.options?.map(option => ({ text: option.text })) ?? [],
					correctIndex: question.options?.some(option => option.isCorrect)
						? String(question.options.findIndex(option => option.isCorrect))
						: ''
				}
			: {
					text: '',
					timeLimitSeconds: '',
					basePoints: '',
					imageUrl: '',
					correctIndex: '',
					options:
						kind === QuizKind.OpenText
							? []
							: Array.from({ length: LIMITS.minOptions }, () => ({ text: '' }))
				}
	})
	const { fields, append, remove } = useFieldArray({ control, name: 'options' })
	const correctIndex = useWatch({ control, name: 'correctIndex' })
	const submit = async (values: QuestionFormValues) => {
		try {
			await onSubmit({
				text: values.text,
				timeLimitSeconds:
					values.timeLimitSeconds === ''
						? null
						: Number(values.timeLimitSeconds),
				basePoints:
					kind === QuizKind.QuizChoice && values.basePoints !== ''
						? Number(values.basePoints)
						: null,
				imageUrl: values.imageUrl || null,
				options:
					kind === QuizKind.OpenText
						? null
						: values.options.map((option, index) => ({
								text: option.text,
								isCorrect:
									kind === QuizKind.QuizChoice
										? index === Number(values.correctIndex)
										: null
							}))
			})
		} catch (error) {
			const fieldErrors = error instanceof ApiError ? getFieldErrors(error) : {}
			const validPaths: FieldPath<QuestionFormValues>[] = [
				'text',
				'timeLimitSeconds',
				'basePoints',
				'imageUrl',
				'options',
				...fields.map((_, index) => `options.${index}.text` as const)
			]
			const matching = validPaths.filter(path => fieldErrors[path])
			for (const path of matching)
				setError(path, { message: fieldErrors[path] })
			if (!matching.length)
				setError('root', {
					message:
						error instanceof ApiError
							? (error.detail ?? QUIZ_FORM_COPY.genericError)
							: QUIZ_FORM_COPY.genericError
				})
		}
	}
	const errorText = (message?: string) =>
		message ? (
			<p className={fieldError} role='alert'>
				{message}
			</p>
		) : null
	return (
		<form
			className={cn(quizForm, formPanel)}
			noValidate
			onSubmit={event => void handleSubmit(submit)(event)}
		>
			{errors.root?.message ? (
				<Alert variant='danger' title={COPY.error}>
					{errors.root.message}
				</Alert>
			) : null}
			<div className={field}>
				<label className={fieldLabel} htmlFor='question-text'>
					{COPY.text}
				</label>
				<Textarea
					id='question-text'
					placeholder={COPY.placeholders.text}
					invalid={Boolean(errors.text)}
					{...register('text')}
				/>
				{errorText(errors.text?.message)}
			</div>
			<div className={field}>
				<label className={fieldLabel} htmlFor='question-time'>
					{COPY.time}
				</label>
				<Input
					id='question-time'
					placeholder={COPY.placeholders.time}
					type='number'
					min={LIMITS.minTime}
					max={LIMITS.maxTime}
					{...register('timeLimitSeconds')}
				/>
				{errorText(errors.timeLimitSeconds?.message)}
			</div>
			<div className={field}>
				<label className={fieldLabel} htmlFor='question-image'>
					{COPY.image}
				</label>
				<Input
					id='question-image'
					placeholder={COPY.placeholders.image}
					type='url'
					{...register('imageUrl')}
				/>
				{errorText(errors.imageUrl?.message)}
			</div>
			{kind === QuizKind.QuizChoice ? (
				<div className={field}>
					<label className={fieldLabel} htmlFor='question-points'>
						{COPY.points}
					</label>
					<Input
						id='question-points'
						placeholder={COPY.placeholders.points}
						type='number'
						min={0}
						max={LIMITS.maxPoints}
						{...register('basePoints')}
					/>
					{errorText(errors.basePoints?.message)}
				</div>
			) : null}
			{fields.map((option, index) => (
				<div className={field} key={option.id}>
					<label className={fieldLabel} htmlFor={`option-${option.id}`}>
						{COPY.option(index)}
					</label>
					<div className={optionRow}>
						{kind === QuizKind.QuizChoice ? (
							<Radio
								name='correctIndex'
								aria-label={COPY.correct(index)}
								title={COPY.correct(index)}
								checked={correctIndex === String(index)}
								onChange={() => setValue('correctIndex', String(index))}
							/>
						) : null}
						<Input
							className={optionInput}
							fullWidth
							id={`option-${option.id}`}
							placeholder={COPY.placeholders.option}
							invalid={Boolean(errors.options?.[index]?.text)}
							{...register(`options.${index}.text`)}
						/>
						<Button
							type='button'
							variant='ghost'
							size='sm'
							aria-label={COPY.removeOption}
							title={COPY.removeOption}
							disabled={fields.length <= LIMITS.minOptions || isSubmitting}
							onClick={() => {
								remove(index)
								if (Number(correctIndex) === index) setValue('correctIndex', '')
								else if (correctIndex !== '' && Number(correctIndex) > index)
									setValue('correctIndex', String(Number(correctIndex) - 1))
							}}
						>
							<Icon icon={X} size='sm' />
						</Button>
					</div>
					{errorText(errors.options?.[index]?.text?.message)}
				</div>
			))}
			{errorText(errors.options?.message ?? errors.options?.root?.message)}
			{errorText(errors.correctIndex?.message)}
			{kind !== QuizKind.OpenText ? (
				<Button
					type='button'
					variant='outline'
					size='sm'
					className={compactAction}
					leftIcon={<Icon icon={Plus} size='sm' />}
					disabled={fields.length >= LIMITS.maxOptions || isSubmitting}
					onClick={() => append({ text: '' })}
				>
					{COPY.addOption}
				</Button>
			) : null}
			<div className={formActions}>
				<Button type='submit' loading={isSubmitting}>
					{question ? COPY.saveEdit : COPY.save}
				</Button>
				<Button
					type='button'
					variant='outline'
					disabled={isSubmitting}
					onClick={onCancel}
				>
					{COPY.cancel}
				</Button>
			</div>
		</form>
	)
}
