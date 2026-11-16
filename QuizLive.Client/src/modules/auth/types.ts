export type UserDto = {
	id: string
	userName: string
}

export type LoginRequest = {
	userName: string
	password: string
}

export type RegisterRequest = {
	userName: string
	password: string
}

export type AuthResponse = {
	token: string
	expiresAtUtc: string
	user: UserDto
}

export type Session = AuthResponse
