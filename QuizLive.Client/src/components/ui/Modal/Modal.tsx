import type { RecipeVariants } from '@vanilla-extract/recipes'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

import { IconButton } from '@components/ui/IconButton'
import { Icon } from '@components/ui/Icon'

import {
	modalHeader,
	modalOverlay,
	modalPanel,
	modalTitle,
} from '@components/ui/Modal/Modal.css'

type ModalVariants = NonNullable<RecipeVariants<typeof modalPanel>>

export type ModalProps = ModalVariants & {
	open: boolean
	onClose: () => void
	title?: string
	children: ReactNode
}

export function Modal({
	open,
	onClose,
	title,
	children,
	size,
}: ModalProps) {
	useEffect(() => {
		if (!open) return
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose()
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [open, onClose])

	if (!open) return null

	return createPortal(
		<div
			className={modalOverlay}
			role="presentation"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose()
			}}
		>
			<div
				className={modalPanel({ size })}
				role="dialog"
				aria-modal="true"
				aria-label={title}
			>
				<div className={modalHeader}>
						{title ? <h2 className={modalTitle}>{title}</h2> : <span />}
						<IconButton
							variant="ghost"
							size="sm"
							aria-label="Close dialog"
							onClick={onClose}
							icon={<Icon icon={X} size="sm" />}
						/>
				</div>
				{children}
			</div>
		</div>,
		document.body
	)
}
