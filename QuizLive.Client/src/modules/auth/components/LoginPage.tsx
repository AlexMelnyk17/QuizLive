import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import type { FormEvent } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { Alert } from '@components/ui/Alert'
import { Button } from '@components/ui/Button'
import { Heading } from '@components/ui/Heading'
import { Input } from '@components/ui/Input'
import { Stack } from '@components/ui/Stack'
import { Text } from '@components/ui/Text'

import { AuthLayout } from '@layout/AuthLayout/AuthLayout'
import { useLogin } from '@modules/auth/hooks/useLogin'
import { loginFormSchema } from '@modules/auth/schemas'
import { submitLogin } from '@modules/auth/utils/submitLogin'
import {
	field,
	fieldError,
	fieldLabel,
	formActions,
	formAlert,
	formFooter,
	inlineLink,
} from '@modules/auth/components/AuthForm.css'
type LoginFormValues = z.infer<typeof loginFormSchema>

export function LoginPage() {
	const navigate = useNavigate()
	const search = useSearch({ from: '/login' })
	const login = useLogin()

	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
	} = useForm<LoginFormValues>({
		resolver: zodResolver(loginFormSchema),
		defaultValues: { userName: '', password: '' },
	})

	const onLoginSubmit = (values: LoginFormValues) =>
		submitLogin(values, {
			mutateAsync: login.mutateAsync,
			navigate,
			redirect: search.redirect,
			setError,
		})

	const onSubmit = (event: FormEvent<HTMLFormElement>) => {
		void handleSubmit(onLoginSubmit)(event)
	}

	return (
		<AuthLayout>
			<Heading level={2}>Log in</Heading>
			<Text tone="muted" size="sm">
				Sign in to create and manage your quizzes.
			</Text>

			<form onSubmit={onSubmit} noValidate>
				<Stack direction="column" align="stretch">
					{errors.root?.message ? (
						<Alert
							className={formAlert}
							variant="danger"
							title="Could not log in"
						>
							{errors.root.message}
						</Alert>
					) : null}

					<div className={field}>
						<label className={fieldLabel} htmlFor="login-userName">
							User name
						</label>
						<Input
							id="login-userName"
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
						<label className={fieldLabel} htmlFor="login-password">
							Password
						</label>
						<Input
							id="login-password"
							type="password"
							autoComplete="current-password"
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
							loading={login.isPending}
						>
							Log in
						</Button>
					</div>
				</Stack>
			</form>

			<div className={formFooter}>
				<Text size="sm" tone="muted">
					No account yet?
				</Text>{' '}
				<Link to="/register" className={inlineLink}>
					Register
				</Link>
			</div>
		</AuthLayout>
	)
}
