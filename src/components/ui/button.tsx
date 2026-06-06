import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-body text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blood-400/30 disabled:pointer-events-none disabled:opacity-45 cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-blood-400 text-white hover:bg-blood-500 shadow-md shadow-blood-400/15',
        secondary: 'bg-bg-panel text-ice border border-border-med hover:border-blood-300/50 hover:bg-blood-100/50 shadow-sm',
        ghost: 'text-ice-muted hover:text-ice hover:bg-bg-surface',
        danger: 'bg-blood-100 text-blood-700 border border-blood-300 hover:bg-blood-200',
        gold: 'bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20',
      },
      size: {
        sm: 'h-9 px-3.5 text-xs',
        md: 'h-10 px-5',
        lg: 'h-12 px-7 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
