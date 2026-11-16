import type { ComponentPropsWithoutRef } from 'react'

export type BoxProps = ComponentPropsWithoutRef<'div'>

export const Box = ({ className, ...props }: BoxProps) => (
	<div className={className} {...props} />
)
