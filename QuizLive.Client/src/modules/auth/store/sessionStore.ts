import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { SESSION_STORAGE_KEY } from '@modules/auth/constants'
import { authResponseSchema } from '@modules/auth/schemas'
import type { AuthResponse, Session } from '@modules/auth/types'

type AuthState = {
	session: Session | null
	setSessionFromAuthResponse: (response: AuthResponse) => Session
	clearSession: () => void
}

function isSessionExpired(session: Session): boolean {
	return new Date(session.expiresAtUtc).getTime() <= Date.now()
}

function parseSession(raw: Session | null): Session | null {
	if (!raw) return null
	if (isSessionExpired(raw)) return null
	return raw
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			session: null,
			setSessionFromAuthResponse: (response) => {
				const parsed = authResponseSchema.parse(response)
				const session: Session = {
					token: parsed.token,
					expiresAtUtc: parsed.expiresAtUtc,
					user: parsed.user,
				}
				set({ session })
				return session
			},
			clearSession: () => set({ session: null }),
		}),
		{
			name: SESSION_STORAGE_KEY,
			storage: createJSONStorage(() => sessionStorage),
			partialize: (state) => ({ session: state.session }),
			onRehydrateStorage: () => (state) => {
				if (state?.session && isSessionExpired(state.session)) {
					state.clearSession()
				}
			},
		}
	)
)

export function readSession(): Session | null {
	const session = useAuthStore.getState().session
	const valid = parseSession(session)
	if (session && !valid) {
		useAuthStore.getState().clearSession()
	}
	return valid
}

export function getAccessToken(): string | null {
	return readSession()?.token ?? null
}

export function handleUnauthorized(): void {
	useAuthStore.getState().clearSession()
}

export function signOut(): void {
	useAuthStore.getState().clearSession()
}

export function useSession(): Session | null {
	const session = useAuthStore((state) => state.session)
	if (!session) return null
	if (isSessionExpired(session)) {
		useAuthStore.getState().clearSession()
		return null
	}
	return session
}
