import { useMutation } from '@tanstack/react-query'

import { loginApi } from '@modules/auth/api/authApi'
import { useAuthStore } from '@modules/auth/store/sessionStore'
import type { LoginRequest } from '@modules/auth/types'

export function useLogin() {
	const setSessionFromAuthResponse = useAuthStore(
		(state) => state.setSessionFromAuthResponse
	)

	return useMutation({
		mutationFn: async (request: LoginRequest) => {
			const auth = await loginApi(request)
			return setSessionFromAuthResponse(auth)
		},
	})
}
