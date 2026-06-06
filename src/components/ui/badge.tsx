import type * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 font-body text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'border-border-med bg-bg-surface text-ice-muted',
        blood: 'border-blood-300/50 bg-blood-100 text-blood-600',
        success: 'border-sage-400/40 bg-sage-100 text-sage-500',
        warn: 'border-gold/40 bg-gold/10 text-gold',
        info: 'border-sky-300/50 bg-sky-50 text-sky-600',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
