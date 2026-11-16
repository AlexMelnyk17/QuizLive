import { z } from 'zod'

import { AUTH_COPY, AUTH_FIELD_LIMITS } from '@modules/auth/constants'

export const userDtoSchema = z.object({
	id: z.string(),
	userName: z.string()
})

export const authResponseSchema = z.object({
	token: z.string(),
	expiresAtUtc: z.string(),
	user: userDtoSchema
})

export const loginFormSchema = z.object({
	userName: z
		.string()
		.min(AUTH_FIELD_LIMITS.loginFieldMin, AUTH_COPY.validation.userNameRequired),
	password: z
		.string()
		.min(AUTH_FIELD_LIMITS.loginFieldMin, AUTH_COPY.validation.passwordRequired)
})

export const registerFormSchema = z.object({
	userName: z
		.string()
		.min(AUTH_FIELD_LIMITS.userNameMin, AUTH_COPY.validation.userNameMin)
		.max(AUTH_FIELD_LIMITS.userNameMax, AUTH_COPY.validation.userNameMax),
	password: z
		.string()
		.min(AUTH_FIELD_LIMITS.passwordMin, AUTH_COPY.validation.passwordMin)
		.max(AUTH_FIELD_LIMITS.passwordMax, AUTH_COPY.validation.passwordMax)
		.regex(/[a-z]/, AUTH_COPY.validation.passwordLowercase)
		.regex(/\d/, AUTH_COPY.validation.passwordDigit)
})