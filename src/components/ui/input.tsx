import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-xl border border-border-med bg-bg-panel px-4 py-2 text-sm text-ice placeholder:text-ice-dim focus:border-blood-400/50 focus:outline-none focus:ring-2 focus:ring-blood-400/15 disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-sm',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input }
