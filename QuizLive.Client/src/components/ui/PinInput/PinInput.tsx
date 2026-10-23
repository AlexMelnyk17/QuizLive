import type { ClipboardEvent, KeyboardEvent } from 'react'
import { useCallback, useMemo, useRef } from 'react'

import cn from 'clsx'

import { pinCell, pinRow } from '@components/ui/PinInput/PinInput.css'

export type PinInputProps = {
	length?: number
	value?: string
	onChange?: (value: string) => void
	invalid?: boolean
	className?: string
	name?: string
	autoFocus?: boolean
	'aria-labelledby'?: string
}

export function PinInput({
	length = 6,
	value = '',
	onChange,
	invalid = false,
	className,
	name,
	autoFocus,
	'aria-labelledby': ariaLabelledBy,
}: PinInputProps) {
	const inputsRef = useRef<Array<HTMLInputElement | null>>([])
	const chars = useMemo(() => {
		const normalized = value.slice(0, length).toUpperCase()
		return Array.from({ length }, (_, index) => normalized[index] ?? '')
	}, [length, value])

	const updateAt = useCallback(
		(index: number, char: string) => {
			const next = chars.slice()
			next[index] = char
			onChange?.(next.join('').slice(0, length))
		},
		[chars, length, onChange]
	)

	const handleChange = (index: number, nextValue: string) => {
		const char = nextValue.replace(/[^a-zA-Z0-9]/g, '').slice(-1).toUpperCase()
		updateAt(index, char)
		if (char && index < length - 1) {
			inputsRef.current[index + 1]?.focus()
		}
	}

	const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Backspace' && !chars[index] && index > 0) {
			inputsRef.current[index - 1]?.focus()
			updateAt(index - 1, '')
		}
		if (event.key === 'ArrowLeft' && index > 0) {
			inputsRef.current[index - 1]?.focus()
		}
		if (event.key === 'ArrowRight' && index < length - 1) {
			inputsRef.current[index + 1]?.focus()
		}
	}

	const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
		event.preventDefault()
		const pasted = event.clipboardData
			.getData('text')
			.replace(/[^a-zA-Z0-9]/g, '')
			.slice(0, length)
			.toUpperCase()
		onChange?.(pasted)
		const focusIndex = Math.min(pasted.length, length - 1)
		inputsRef.current[focusIndex]?.focus()
	}

	return (
		<div
			className={cn(pinRow, className)}
			role="group"
			aria-labelledby={ariaLabelledBy}
			aria-label={ariaLabelledBy ? undefined : (name ?? 'PIN input')}
		>
			{chars.map((char, index) => (
				<input
					key={index}
					ref={(el) => {
						inputsRef.current[index] = el
					}}
					className={pinCell({ filled: Boolean(char), invalid })}
					inputMode="text"
					autoComplete={index === 0 ? 'one-time-code' : 'off'}
					autoFocus={autoFocus && index === 0}
					maxLength={1}
					value={char}
					onChange={(event) => handleChange(index, event.target.value)}
					onKeyDown={(event) => handleKeyDown(index, event)}
					onPaste={handlePaste}
					aria-invalid={invalid || undefined}
				/>
			))}
		</div>
	)
}
