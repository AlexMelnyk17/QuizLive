import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import type { FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { ApiError } from '@api/apiError'
import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Input } from '@components/ui/Input'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

import { AuthLayout } from '@layout/AuthLayout/AuthLayout'
import {
	field,
	fieldError,
	fieldLabel,
	formActions,
	formAlert,
	formFooter,
	inlineLink,
} from '@modules/auth/components/AuthForm.css'
import { useRegister } from '@modules/auth/hooks/useRegister'
import { registerFormSchema } from '@modules/auth/schemas'

type RegisterFormValues = z.infer<typeof registerFormSchema>

export function RegisterPage() {
	const navigate = useNavigate()
	const registerMutation = useRegister()

	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
	} = useForm<RegisterFormValues>({
		resolver: zodResolver(registerFormSchema),
		defaultValues: { userName: '', password: '' },
	})

	const submitRegister = async (values: RegisterFormValues) => {
		try {
			await registerMutation.mutateAsync(values)
			void navigate({ to: '/dashboard' })
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.status === 400 && err.errors) {
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
							message: err.detail ?? 'Registration failed.',
						})
					}
					return
				}
				if (err.status === 409) {
					setError('userName', {
						message: err.detail ?? 'User name is already taken.',
					})
					return
				}
				setError('root', {
					message: err.detail ?? 'Registration failed. Please try again.',
				})
				return
			}
			setError('root', { message: 'Registration failed. Please try again.' })
		}
	}

	const onSubmit = (event: FormEvent<HTMLFormElement>) => {
		void handleSubmit(submitRegister)(event)
	}

	return (
		<AuthLayout>
			<Heading level={2}>Register</Heading>
			<Text tone="muted" size="sm">
				Create an account to host your own quizzes.
			</Text>

			<form onSubmit={onSubmit} noValidate>
				<Stack direction="column" align="stretch">
					{errors.root?.message ? (
						<Alert
							className={formAlert}
							variant="danger"
							title="Could not register"
						>
							{errors.root.message}
						</Alert>
					) : null}

					<div className={field}>
						<label className={fieldLabel} htmlFor="register-userName">
							User name
						</label>
						<Input
							id="register-userName"
							autoComplete="username"
							invalid={Boolean(errors.userName)}
							fullWidth
							{...register('userName')}
						/>
						{errors.userName?.message ? (
							<p className={fieldError} role="alert">
								{errors.userName.message}
							</p>
						) : null}
					</div>

					<div className={field}>
						<label className={fieldLabel} htmlFor="register-password">
							Password
						</label>
						<Input
							id="register-password"
							type="password"
							autoComplete="new-password"
							invalid={Boolean(errors.password)}
							fullWidth
							{...register('password')}
						/>
						{errors.password?.message ? (
							<p className={fieldError} role="alert">
								{errors.password.message}
							</p>
						) : null}
					</div>

					<div className={formActions}>
						<Button
							type="submit"
							variant="primary"
							fullWidth
							loading={registerMutation.isPending}
						>
							Create account
						</Button>
					</div>
				</Stack>
			</form>

			<div className={formFooter}>
				<Text size="sm" tone="muted">
					Already have an account?
				</Text>{' '}
				<Link to="/login" className={inlineLink}>
					Log in
				</Link>
			</div>
		</AuthLayout>
	)
}
