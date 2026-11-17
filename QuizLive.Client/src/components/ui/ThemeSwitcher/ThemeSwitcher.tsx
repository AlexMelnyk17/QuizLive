import { Monitor, Moon, Sun } from 'lucide-react'

import { THEME_COPY, THEME_MODES } from '@theme/constants'
import { parseThemeMode } from '@theme/themeStorage'
import { useTheme } from '@theme/useTheme'

import { Icon } from '@components/ui/Icon'
import {
	themeSelect,
	themeSwitcher
} from '@components/ui/ThemeSwitcher/ThemeSwitcher.css'

const modeIcons = { light: Sun, dark: Moon, system: Monitor }

export function ThemeSwitcher() {
	const { mode, setMode } = useTheme()

	return (
		<div
			className={themeSwitcher}
			title={`${THEME_COPY.label}: ${THEME_COPY.options[mode]}`}
		>
			<Icon icon={modeIcons[mode]} size='sm' />
			<select
				className={themeSelect}
				aria-label={THEME_COPY.label}
				value={mode}
				onChange={event => setMode(parseThemeMode(event.currentTarget.value))}
			>
				{THEME_MODES.map(option => (
					<option key={option} value={option}>
						{THEME_COPY.options[option]}
					</option>
				))}
			</select>
		</div>
	)
}
