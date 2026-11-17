import { useSyncExternalStore } from 'react'

import { THEME_MEDIA_QUERY } from '@theme/constants'
import { getSystemTheme } from '@theme/getSystemTheme'

const subscribe = (onChange: () => void) => {
	const media = window.matchMedia(THEME_MEDIA_QUERY)
	media.addEventListener('change', onChange)
	return () => media.removeEventListener('change', onChange)
}

export function useSystemTheme() {
	return useSyncExternalStore(subscribe, getSystemTheme, () => 'light' as const)
}
