import { z } from 'zod'

export const userDtoSchema = z.object({
	id: z.string(),
	userName: z.string(),
})

export const authResponseSchema = z.object({
	token: z.string(),
	expiresAtUtc: z.string(),
	user: userDtoSchema,
})

export const loginFormSchema = z.object({
	userName: z.string().min(1, 'User name is required'),
	password: z.string().min(1, 'Password is required'),
})

export const registerFormSchema = z.object({
	userName: z
		.string()
		.min(3, 'User name must be at least 3 characters')
		.max(50, 'User name must be at most 50 characters'),
	password: z
		.string()
		.min(6, 'Password must be at least 6 characters')
		.max(100, 'Password must be at most 100 characters')
		.regex(/[a-z]/, 'At least one lowercase letter is required.')
		.regex(/\d/, 'At least one digit is required.'),
})
