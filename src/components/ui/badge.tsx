import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const badgeVariants = cva('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap', {
  variants: {
    variant: {
      default: 'border-primary/30 bg-primary/15 text-primary',
      success: 'border-success/30 bg-success/15 text-success',
      warning: 'border-warning/30 bg-warning/15 text-warning',
      orange: 'border-orange-500/30 bg-orange-500/15 text-orange-500',
      danger: 'border-danger/30 bg-danger/15 text-danger',
      neutral: 'border-border bg-muted text-muted-foreground',
      outline: 'border-border text-foreground',
    },
  },
  defaultVariants: { variant: 'neutral' },
})

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
