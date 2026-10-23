import { apiRequest } from '@api/client'

import {
	authResponseSchema,
	userDtoSchema,
} from '@modules/auth/schemas'
import type {
	AuthResponse,
	LoginRequest,
	RegisterRequest,
	UserDto,
} from '@modules/auth/types'

export async function loginApi(request: LoginRequest): Promise<AuthResponse> {
	const data = await apiRequest<AuthResponse>('/auth/login', {
		method: 'POST',
		body: request,
		skipAuth: true,
	})
	return authResponseSchema.parse(data)
}

export async function registerApi(
	request: RegisterRequest
): Promise<AuthResponse> {
	const data = await apiRequest<AuthResponse>('/auth/register', {
		method: 'POST',
		body: request,
		skipAuth: true,
	})
	return authResponseSchema.parse(data)
}

export async function getCurrentUserApi(): Promise<UserDto> {
	const data = await apiRequest<UserDto>('/auth/me')
	return userDtoSchema.parse(data)
}
