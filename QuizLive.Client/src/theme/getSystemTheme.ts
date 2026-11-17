import { THEME_MEDIA_QUERY } from '@theme/constants'

export function getSystemTheme(): 'light' | 'dark' {
	return window.matchMedia(THEME_MEDIA_QUERY).matches ? 'dark' : 'light'
}
