import type { RecipeVariants } from '@vanilla-extract/recipes'
import type { ComponentPropsWithoutRef } from 'react'

import { textarea } from '@components/ui/Textarea/Textarea.css'
import cn from 'clsx'

type TextareaVariants = NonNullable<RecipeVariants<typeof textarea>>

export type TextareaProps = ComponentPropsWithoutRef<'textarea'> & TextareaVariants

export const Textarea = ({ className, invalid, ...props }: TextareaProps) => (
	<textarea className={cn(textarea({ invalid }), className)} {...props} />
)
