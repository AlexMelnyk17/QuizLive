import {
	type ReactNode,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState
} from 'react'

import { applyTheme } from '@theme/applyTheme'
import { THEME_STORAGE_KEY } from '@theme/constants'
import { ThemeContext, type ThemeMode } from '@theme/themeContext'
import {
	parseThemeMode,
	readThemeMode,
	writeThemeMode
} from '@theme/themeStorage'
import { useSystemTheme } from '@theme/useSystemTheme'

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
	const [mode, setMode] = useState<ThemeMode>(readThemeMode)
	const systemTheme = useSystemTheme()

	const resolved = mode === 'system' ? systemTheme : mode

	useLayoutEffect(() => {
		applyTheme(mode, resolved)
	}, [mode, resolved])

	useEffect(() => {
		const syncPreference = (event: StorageEvent) => {
			if (event.key === THEME_STORAGE_KEY || event.key === null)
				setMode(parseThemeMode(event.newValue))
		}
		window.addEventListener('storage', syncPreference)
		return () => window.removeEventListener('storage', syncPreference)
	}, [])

	const setThemeMode = useCallback((next: ThemeMode) => {
		setMode(next)
		writeThemeMode(next)
	}, [])

	const toggle = useCallback(
		() => setThemeMode(resolved === 'dark' ? 'light' : 'dark'),
		[resolved, setThemeMode]
	)
	const value = useMemo(
		() => ({ mode, resolved, setMode: setThemeMode, toggle }),
		[mode, resolved, setThemeMode, toggle]
	)

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
