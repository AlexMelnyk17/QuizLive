import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import type { FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { AuthLayout } from '@layout/AuthLayout/AuthLayout'

import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Input } from '@components/ui/Input'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

import {
	field,
	fieldError,
	fieldLabel,
	formActions,
	formAlert,
	formFooter,
	inlineLink
} from '@modules/auth/components/AuthForm.css'
import { AUTH_COPY } from '@modules/auth/constants'
import { useRegister } from '@modules/auth/hooks/useRegister'
import { registerFormSchema } from '@modules/auth/schemas'

import { PATHS } from '@config/routes'

import { ApiError } from '@api/apiError'
import { HTTP_STATUS } from '@api/httpStatus'

type RegisterFormValues = z.infer<typeof registerFormSchema>

export function RegisterPage() {
	const navigate = useNavigate()
	const registerMutation = useRegister()

	const {
		register,
		handleSubmit,
		formState: { errors },
		setError
	} = useForm<RegisterFormValues>({
		resolver: zodResolver(registerFormSchema),
		defaultValues: { userName: '', password: '' }
	})

	const submitRegister = async (values: RegisterFormValues) => {
		try {
			await registerMutation.mutateAsync(values)
			void navigate({ to: PATHS.dashboard })
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === HTTP_STATUS.BAD_REQUEST && err.errors) {
					const userNameMsg = err.errors.userName?.[0]
					const passwordMsg = err.errors.password?.[0]
					if (userNameMsg) {
						setError('userName', { message: userNameMsg })
					}
					if (passwordMsg) {
						setError('password', { message: passwordMsg })
					}
					if (!userNameMsg && !passwordMsg) {
						setError('root', {
							message: err.detail ?? AUTH_COPY.register.failed
						})
					}
					return
				}
				if (err.status === HTTP_STATUS.CONFLICT) {
					setError('userName', {
						message: err.detail ?? AUTH_COPY.register.userNameTaken
					})
					return
				}
				setError('root', {
					message: err.detail ?? AUTH_COPY.register.failedRetry
				})
				return
			}
			setError('root', { message: AUTH_COPY.register.failedRetry })
		}
	}

	const onSubmit = (event: FormEvent<HTMLFormElement>) => {
		void handleSubmit(submitRegister)(event)
	}

	return (
		<AuthLayout>
			<Heading level={2}>{AUTH_COPY.register.title}</Heading>
			<Text tone='muted' size='sm'>
				{AUTH_COPY.register.subtitle}
			</Text>

			<form onSubmit={onSubmit} noValidate>
				<Stack direction='column' align='stretch'>
					{errors.root?.message ? (
						<Alert
							className={formAlert}
							variant='danger'
							title={AUTH_COPY.register.errorTitle}
						>
							{errors.root.message}
						</Alert>
					) : null}

					<div className={field}>
						<label className={fieldLabel} htmlFor='register-userName'>
							{AUTH_COPY.register.userNameLabel}
						</label>
						<Input
							id='register-userName'
							autoComplete='username'
							invalid={Boolean(errors.userName)}
							fullWidth
							{...register('userName')}
						/>
						{errors.userName?.message ? (
							<p className={fieldError} role='alert'>
								{errors.userName.message}
							</p>
						) : null}
					</div>

					<div className={field}>
						<label className={fieldLabel} htmlFor='register-password'>
							{AUTH_COPY.register.passwordLabel}
						</label>
						<Input
							id='register-password'
							type='password'
							autoComplete='new-password'
							invalid={Boolean(errors.password)}
							fullWidth
							{...register('password')}
						/>
						{errors.password?.message ? (
							<p className={fieldError} role='alert'>
								{errors.password.message}
							</p>
						) : null}
					</div>

					<div className={formActions}>
						<Button
							type='submit'
							variant='primary'
							fullWidth
							loading={registerMutation.isPending}
						>
							{AUTH_COPY.register.submit}
						</Button>
					</div>
				</Stack>
			</form>

			<div className={formFooter}>
				<Text size='sm' tone='muted'>
					{AUTH_COPY.register.hasAccount}
				</Text>{' '}
				<Link to={PATHS.login} className={inlineLink}>
					{AUTH_COPY.register.loginLink}
				</Link>
			</div>
		</AuthLayout>
	)
}
