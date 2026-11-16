import { globalStyle } from '@vanilla-extract/css'

import { vars } from '@theme/contract.css'

globalStyle('*, *::before, *::after', {
	boxSizing: 'border-box',
})


globalStyle('body', {
	margin: 0,
	fontFamily: vars.fonts.sans,
	fontSize: vars.fontSizes.md,
	lineHeight: vars.lineHeights.normal,
	color: vars.colors.text,
	backgroundColor: vars.colors.bg,
	fontSynthesis: 'none',
	textRendering: 'optimizeLegibility',
	WebkitFontSmoothing: 'antialiased',
	MozOsxFontSmoothing: 'grayscale',
})

globalStyle('#root', {
	minHeight: '100svh',
	width: '100%',
	maxWidth: '1126px',
	margin: '0 auto',
	boxSizing: 'border-box',
})

globalStyle('button, input, textarea, select', {
	font: 'inherit',
})

globalStyle(':focus-visible', {
	outline: `2px solid ${vars.colors.focusRing}`,
	outlineOffset: '2px',
})

globalStyle('input:focus-visible, textarea:focus-visible, select:focus-visible', {
	outline: 'none',
})

globalStyle('select option', {
	color: vars.colors.textHeading,
	backgroundColor: vars.colors.surfaceRaised,
})
