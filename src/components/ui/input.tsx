import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-border-med bg-bg-surface px-3 py-2 text-sm text-ice placeholder:text-ice-dim focus:border-blood-400/60 focus:outline-none focus:ring-1 focus:ring-blood-400/30 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input }
