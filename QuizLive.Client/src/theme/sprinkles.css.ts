import { defineProperties, createSprinkles } from '@vanilla-extract/sprinkles'

import { vars } from '@theme/contract.css'

const responsiveProperties = defineProperties({
	conditions: {
		mobile: {},
		tablet: { '@media': 'screen and (min-width: 768px)' },
		desktop: { '@media': 'screen and (min-width: 1024px)' },
	},
	defaultCondition: 'mobile',
	properties: {
		display: ['none', 'flex', 'inline-flex', 'block', 'inline-block', 'grid'],
		flexDirection: ['row', 'column', 'row-reverse', 'column-reverse'],
		flexWrap: ['nowrap', 'wrap'],
		alignItems: ['stretch', 'flex-start', 'center', 'flex-end', 'baseline'],
		justifyContent: [
			'flex-start',
			'center',
			'flex-end',
			'space-between',
			'space-around',
			'space-evenly',
		],
		gap: vars.spacing,
		paddingTop: vars.spacing,
		paddingBottom: vars.spacing,
		paddingLeft: vars.spacing,
		paddingRight: vars.spacing,
		marginTop: vars.spacing,
		marginBottom: vars.spacing,
		marginLeft: vars.spacing,
		marginRight: vars.spacing,
		width: ['auto', '100%', 'fit-content'],
		maxWidth: ['100%'],
		textAlign: ['left', 'center', 'right'],
		borderRadius: vars.radii,
	},
})

const colorProperties = defineProperties({
	properties: {
		color: {
			text: vars.colors.text,
			muted: vars.colors.textMuted,
			heading: vars.colors.textHeading,
			primary: vars.colors.primary,
			onPrimary: vars.colors.onPrimary,
			success: vars.colors.success,
			danger: vars.colors.danger,
			warning: vars.colors.warning,
			info: vars.colors.info,
		},
		backgroundColor: {
			bg: vars.colors.bg,
			surface: vars.colors.surface,
			surfaceRaised: vars.colors.surfaceRaised,
			primary: vars.colors.primary,
			primaryMuted: vars.colors.primaryMuted,
			successMuted: vars.colors.successMuted,
			dangerMuted: vars.colors.dangerMuted,
			warningMuted: vars.colors.warningMuted,
			infoMuted: vars.colors.infoMuted,
			transparent: 'transparent',
		},
	},
})

export const sprinkles = createSprinkles(responsiveProperties, colorProperties)

export type Sprinkles = Parameters<typeof sprinkles>[0]
