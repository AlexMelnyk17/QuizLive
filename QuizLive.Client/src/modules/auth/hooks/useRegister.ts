import { useMutation } from '@tanstack/react-query'

import { registerApi } from '@modules/auth/api/authApi'
import { useAuthStore } from '@modules/auth/store/sessionStore'
import type { RegisterRequest } from '@modules/auth/types'

export function useRegister() {
	const setSessionFromAuthResponse = useAuthStore(
		(state) => state.setSessionFromAuthResponse
	)

	return useMutation({
		mutationFn: async (request: RegisterRequest) => {
			const auth = await registerApi(request)
			return setSessionFromAuthResponse(auth)
		},
	})
}
