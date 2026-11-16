import {
	useEffect,
	useLayoutEffect,
	useState,
	type ReactNode,
} from 'react'

import { darkTheme } from '@theme/dark.css'
import { lightTheme } from '@theme/light.css'
import { ThemeContext, type ThemeMode } from '@theme/themeContext'

const storageKey = 'quizlive-theme'

const isThemeMode = (value: string | null): value is ThemeMode =>
	value === 'light' || value === 'dark' || value === 'system'

const readStoredMode = (): ThemeMode => {
	const stored = localStorage.getItem(storageKey)
	return isThemeMode(stored) ? stored : 'system'
}

const readSystemTheme = (): 'light' | 'dark' =>
	window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
	const [mode, setMode] = useState<ThemeMode>(() => readStoredMode())
	const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() =>
		readSystemTheme()
	)

	const resolved = mode === 'system' ? systemTheme : mode

	useLayoutEffect(() => {
		const root = document.documentElement
		root.classList.remove(lightTheme, darkTheme)
		root.classList.add(resolved === 'dark' ? darkTheme : lightTheme)
	}, [resolved])

	useEffect(() => {
		const media = window.matchMedia('(prefers-color-scheme: dark)')
		const handleChange = () => setSystemTheme(media.matches ? 'dark' : 'light')
		media.addEventListener('change', handleChange)
		return () => media.removeEventListener('change', handleChange)
	}, [])

	const setThemeMode = (next: ThemeMode) => {
		setMode(next)
		localStorage.setItem(storageKey, next)
	}

	const toggle = () => setThemeMode(resolved === 'dark' ? 'light' : 'dark')

	return (
		<ThemeContext.Provider
			value={{ mode, resolved, setMode: setThemeMode, toggle }}
		>
			{children}
		</ThemeContext.Provider>
	)
}
