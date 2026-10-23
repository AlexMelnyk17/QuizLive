import type { UseFormSetError } from 'react-hook-form'

import type { LoginRequest } from '@modules/auth/types'
import { getLoginRootErrorMessage } from '@modules/auth/utils/loginErrorMessage'
import { sanitizeRedirectPath } from '@shared/redirect'

type LoginFormValues = LoginRequest

export async function submitLogin(
	values: LoginFormValues,
	context: {
		mutateAsync: (request: LoginRequest) => Promise<unknown>
		navigate: (options: { to: string }) => void | Promise<void>
		redirect?: string
		setError: UseFormSetError<LoginFormValues>
	}
): Promise<void> {
	try {
		await context.mutateAsync(values)
		const target = sanitizeRedirectPath(context.redirect)
		void context.navigate({ to: target })
	} catch (error) {
		context.setError('root', { message: getLoginRootErrorMessage(error) })
	}
}
