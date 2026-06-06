import type { ReactNode } from 'react'
import { PageTransition } from '@/components/PageTransition'
import { cn } from '@/lib/utils'

interface PageShellProps {
  children: ReactNode
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

export function PageShell({ children, title, description, action, className }: PageShellProps) {
  return (
    <PageTransition>
      <div className={cn('w-full min-h-full flex flex-col', className)}>
        {(title || action) && (
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              {title && <h1 className="font-display text-3xl text-ice tracking-tight">{title}</h1>}
              {description && <p className="text-ice-muted text-sm mt-1">{description}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        <div className="flex-1 w-full">{children}</div>
      </div>
    </PageTransition>
  )
}
