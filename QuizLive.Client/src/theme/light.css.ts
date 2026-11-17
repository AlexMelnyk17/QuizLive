import { createTheme, globalStyle } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'
import { lightChartColors, lightColors } from '@theme/themeColors'
import {
	durations,
	fontSizes,
	fontWeights,
	fonts,
	lineHeights,
	radii,
	shadows,
	spacing,
	zIndices
} from '@theme/tokens'

export const lightTheme = createTheme(vars, {
	colors: lightColors,
	charts: lightChartColors,
	spacing,
	radii,
	fontSizes,
	fontWeights,
	lineHeights,
	shadows,
	zIndices,
	durations,
	fonts
})

globalStyle(`.${lightTheme}`, {
	colorScheme: 'light'
})
