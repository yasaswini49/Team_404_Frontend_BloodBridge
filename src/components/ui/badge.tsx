import type * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 font-data text-[10px] uppercase tracking-wider',
  {
    variants: {
      variant: {
        default: 'border-border-med bg-bg-surface text-ice-muted',
        blood: 'border-blood-400/40 bg-blood-900/50 text-blood-200',
        success: 'border-emerald-500/30 bg-emerald-950/50 text-emerald-300',
        warn: 'border-gold/40 bg-gold/10 text-gold',
        info: 'border-sky-500/30 bg-sky-950/50 text-sky-300',
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
