import * as React from 'react'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-md border border-border-med bg-bg-surface px-3 py-2 text-sm text-ice placeholder:text-ice-dim focus:border-blood-400/60 focus:outline-none focus:ring-1 focus:ring-blood-400/30 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-y',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

export { Textarea }
