import { useCallback, useState } from 'react'

import { JOIN_GAME_CODE_LENGTH } from '@modules/join/constants'

export function useJoinByCode() {
	const [code, setCode] = useState('')

	const isComplete = code.length === JOIN_GAME_CODE_LENGTH

	const join = useCallback(() => {
		if (!isComplete) return
		// Join API not wired yet.
	}, [isComplete])

	return {
		code,
		setCode,
		isComplete,
		join,
	}
}
