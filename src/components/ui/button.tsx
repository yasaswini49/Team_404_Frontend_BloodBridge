import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-data text-xs font-medium uppercase tracking-wider transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blood-400/50 disabled:pointer-events-none disabled:opacity-45 cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-blood-400 text-white hover:bg-blood-300 shadow-lg shadow-blood-400/20',
        secondary: 'bg-bg-surface text-ice border border-border-med hover:border-border-lit hover:bg-bg-raised',
        ghost: 'text-ice-muted hover:text-ice hover:bg-bg-surface',
        danger: 'bg-blood-800 text-blood-100 border border-blood-600 hover:bg-blood-700',
        gold: 'bg-gold/15 text-gold border border-gold/40 hover:bg-gold/25',
      },
      size: {
        sm: 'h-8 px-3 text-[10px]',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-sm',
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
