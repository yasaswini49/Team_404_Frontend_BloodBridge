import * as React from 'react'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-xl border border-border-med bg-bg-panel px-4 py-3 text-sm text-ice placeholder:text-ice-dim focus:border-blood-400/50 focus:outline-none focus:ring-2 focus:ring-blood-400/15 disabled:cursor-not-allowed disabled:opacity-50 transition-colors resize-y shadow-sm',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

export { Textarea }
