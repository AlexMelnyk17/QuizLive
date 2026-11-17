import { darkTheme } from '@theme/dark.css'
import { lightTheme } from '@theme/light.css'
import type { ThemeMode } from '@theme/themeContext'

export function applyTheme(mode: ThemeMode, resolved: 'light' | 'dark'): void {
	const root = document.documentElement
	root.classList.remove(lightTheme, darkTheme)
	root.classList.add(resolved === 'dark' ? darkTheme : lightTheme)
	root.dataset.theme = resolved
	root.dataset.themeMode = mode
	root.style.colorScheme = resolved
}
