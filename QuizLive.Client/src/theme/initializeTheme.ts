import { applyTheme } from '@theme/applyTheme'
import { getSystemTheme } from '@theme/getSystemTheme'
import { readThemeMode } from '@theme/themeStorage'

export function initializeTheme(): void {
	const mode = readThemeMode()
	applyTheme(mode, mode === 'system' ? getSystemTheme() : mode)
}
