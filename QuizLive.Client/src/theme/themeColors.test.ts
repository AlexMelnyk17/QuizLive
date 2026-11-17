import { describe, expect, it } from 'vitest'

import {
	darkChartColors,
	darkColors,
	lightChartColors,
	lightColors
} from '@theme/themeColors'

const rgb = (hex: string) =>
	[1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16))
const luminance = (color: number[]) =>
	color.reduce((sum, channel, index) => {
		const value = channel / 255
		return (
			sum +
			(value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4) *
				[0.2126, 0.7152, 0.0722][index]
		)
	}, 0)
const contrast = (foreground: string, background: number[]) => {
	const values = [luminance(rgb(foreground)), luminance(background)].sort(
		(a, b) => b - a
	)
	return (values[0] + 0.05) / (values[1] + 0.05)
}
const composite = (rgba: string, background: string) => {
	const channels = rgba.match(/[\d.]+/g)!.map(Number)
	return rgb(background).map(
		(channel, index) =>
			channels[index] * channels[3] + channel * (1 - channels[3])
	)
}

describe.each([
	{ name: 'light', colors: lightColors, charts: lightChartColors },
	{ name: 'dark', colors: darkColors, charts: darkChartColors }
])('$name theme contrast', ({ colors, charts }) => {
	it('keeps normal, muted, selected, error and status text readable on every surface', () => {
		for (const background of [
			colors.bg,
			colors.surface,
			colors.surfaceRaised,
			colors.surfaceSunken
		]) {
			for (const foreground of [
				colors.text,
				colors.textMuted,
				colors.textHeading
			]) {
				expect(contrast(foreground, rgb(background))).toBeGreaterThanOrEqual(
					4.5
				)
			}
			for (const status of [
				'primary',
				'success',
				'danger',
				'warning',
				'info'
			] as const) {
				expect(
					contrast(
						colors[status],
						composite(colors[`${status}Muted`], background)
					),
					status
				).toBeGreaterThanOrEqual(4.5)
			}
		}
	})
	it('keeps button labels, disabled controls and chart labels readable', () => {
		for (const fill of [colors.primary, colors.primaryHover, colors.danger]) {
			expect(contrast(colors.onPrimary, rgb(fill))).toBeGreaterThanOrEqual(4.5)
		}
		expect(
			contrast(colors.disabledText, rgb(colors.disabledBg))
		).toBeGreaterThanOrEqual(4.5)
		for (const [name, fill] of Object.entries(charts)) {
			if (name !== 'textOnFill')
				expect(
					contrast(charts.textOnFill, rgb(fill)),
					name
				).toBeGreaterThanOrEqual(4.5)
		}
	})
})
