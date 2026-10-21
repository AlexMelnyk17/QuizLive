import { Check } from 'lucide-react'
import type { ComponentPropsWithoutRef } from 'react'

import { Icon } from '@components/ui/Icon'
import cn from 'clsx'

import {
	checkboxControl,
	checkboxInput,
	checkboxLabel,
	checkboxRoot,
} from '@components/ui/Checkbox/Checkbox.css'

export type CheckboxProps = Omit<
	ComponentPropsWithoutRef<'input'>,
	'type' | 'size'
> & {
	label?: string
}

export function Checkbox({
	className,
	label,
	checked,
	disabled,
	id,
	...props
}: CheckboxProps) {
	return (
		<label className={cn(checkboxRoot, className)} htmlFor={id}>
			<input
				id={id}
				type="checkbox"
				className={checkboxInput}
				checked={checked}
				disabled={disabled}
				{...props}
			/>
			<span
				className={checkboxControl({
					checked: Boolean(checked),
					disabled: Boolean(disabled),
				})}
				aria-hidden
			>
				{checked ? <Icon icon={Check} size="xs" aria-hidden /> : null}
			</span>
			{label ? <span className={checkboxLabel}>{label}</span> : null}
		</label>
	)
}
