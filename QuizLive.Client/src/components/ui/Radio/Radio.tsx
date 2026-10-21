import type { ComponentPropsWithoutRef } from 'react'

import cn from 'clsx'

import {
	radioControl,
	radioDot,
	radioInput,
	radioLabel,
	radioRoot,
} from '@components/ui/Radio/Radio.css'

export type RadioProps = Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'size'> & {
	label?: string
}

export function Radio({
	className,
	label,
	checked,
	disabled,
	id,
	...props
}: RadioProps) {
	return (
		<label className={cn(radioRoot, className)} htmlFor={id}>
			<input
				id={id}
				type="radio"
				className={radioInput}
				checked={checked}
				disabled={disabled}
				{...props}
			/>
			<span
				className={radioControl({
					checked: Boolean(checked),
					disabled: Boolean(disabled),
				})}
				aria-hidden
			>
				{checked ? <span className={radioDot} /> : null}
			</span>
			{label ? <span className={radioLabel}>{label}</span> : null}
		</label>
	)
}
