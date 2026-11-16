import type { ComponentPropsWithoutRef } from 'react'

import cn from 'clsx'

import {
	switchInput,
	switchLabel,
	switchRoot,
	switchThumb,
	switchTrack,
} from '@components/ui/Switch/Switch.css'

export type SwitchProps = Omit<
	ComponentPropsWithoutRef<'input'>,
	'type' | 'size'
> & {
	label?: string
}

export function Switch({
	className,
	label,
	checked,
	disabled,
	id,
	...props
}: SwitchProps) {
	return (
		<label className={cn(switchRoot, className)} htmlFor={id}>
			<input
				id={id}
				type="checkbox"
				role="switch"
				className={switchInput}
				checked={checked}
				disabled={disabled}
				{...props}
			/>
			<span
				className={switchTrack({
					checked: Boolean(checked),
					disabled: Boolean(disabled),
				})}
				aria-hidden
			>
				<span className={switchThumb({ checked: Boolean(checked) })} />
			</span>
			{label ? <span className={switchLabel}>{label}</span> : null}
		</label>
	)
}
