export const THEME_STORAGE_KEY = 'quizlive-theme'
export const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)'
export const THEME_MODES = ['light', 'dark', 'system'] as const
export const THEME_COPY = {
	label: 'Theme',
	options: { light: 'Light', dark: 'Dark', system: 'System' }
} as const
