import { THEME_STORAGE_KEY } from '@theme/constants'
import type { ThemeMode } from '@theme/themeContext'

export function parseThemeMode(value: unknown): ThemeMode {
	return value === 'light' || value === 'dark' || value === 'system'
		? value
		: 'system'
}

export function readThemeMode(): ThemeMode {
	try {
		return parseThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY))
	} catch {
		return 'system'
	}
}

export function writeThemeMode(mode: ThemeMode): void {
	try {
		window.localStorage.setItem(THEME_STORAGE_KEY, mode)
	} catch {
		/* A blocked storage area must not prevent changing the current theme. */
	}
}
