import type { vars } from '@theme/contract.css'
import { palette } from '@theme/tokens'

type ThemeColors = Record<keyof typeof vars.colors, string>
type ChartColors = Record<keyof typeof vars.charts, string>

export const lightColors = {
	bg: palette.gray50,
	surface: palette.white,
	surfaceSunken: palette.gray100,
	surfaceRaised: palette.white,
	text: palette.gray700,
	textMuted: palette.gray600,
	textHeading: palette.gray900,
	primary: palette.purple700,
	primaryHover: palette.purple800,
	onPrimary: palette.white,
	primaryMuted: 'rgba(147, 51, 234, 0.08)',
	primaryBorder: palette.purple600,
	success: palette.green800,
	successMuted: 'rgba(34, 197, 94, 0.1)',
	danger: palette.red700,
	dangerMuted: 'rgba(185, 28, 28, 0.08)',
	warning: palette.amber800,
	warningMuted: 'rgba(245, 158, 11, 0.12)',
	info: palette.blue700,
	infoMuted: 'rgba(59, 130, 246, 0.08)',
	border: palette.gray300,
	borderStrong: palette.gray500,
	focusRing: palette.purple600,
	overlay: 'rgba(8, 6, 13, 0.45)',
	codeBg: palette.gray100,
	disabledBg: palette.gray100,
	disabledText: palette.gray600,
	disabledBorder: palette.gray300
} as const satisfies ThemeColors

export const darkColors = {
	bg: palette.gray900,
	surface: palette.gray800,
	surfaceSunken: palette.gray900,
	surfaceRaised: palette.gray700,
	text: palette.gray200,
	textMuted: palette.gray400,
	textHeading: palette.gray100,
	primary: palette.purple400,
	primaryHover: palette.purple300,
	onPrimary: palette.black,
	primaryMuted: 'rgba(192, 132, 252, 0.04)',
	primaryBorder: palette.purple400,
	success: palette.green400,
	successMuted: 'rgba(34, 197, 94, 0.06)',
	danger: palette.red400,
	dangerMuted: 'rgba(239, 68, 68, 0.06)',
	warning: palette.amber400,
	warningMuted: 'rgba(245, 158, 11, 0.06)',
	info: palette.blue400,
	infoMuted: 'rgba(59, 130, 246, 0.06)',
	border: palette.gray700,
	borderStrong: palette.gray400,
	focusRing: palette.purple400,
	overlay: 'rgba(0, 0, 0, 0.6)',
	codeBg: palette.gray800,
	disabledBg: palette.gray700,
	disabledText: palette.gray400,
	disabledBorder: palette.gray600
} as const satisfies ThemeColors

export const lightChartColors = {
	blue: palette.blue700,
	purple: palette.purple700,
	green: palette.green700,
	amber: palette.amber800,
	red: palette.red700,
	indigo: palette.indigo600,
	pink: palette.pink700,
	teal: palette.teal700,
	textOnFill: palette.white
} as const satisfies ChartColors

export const darkChartColors = {
	blue: palette.blue400,
	purple: palette.purple400,
	green: palette.green400,
	amber: palette.amber400,
	red: palette.red400,
	indigo: palette.indigo400,
	pink: palette.pink300,
	teal: palette.teal300,
	textOnFill: palette.black
} as const satisfies ChartColors
