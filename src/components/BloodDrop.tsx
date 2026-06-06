import { cn } from '@/lib/utils'

interface BloodDropProps {
  size?: number
  animate?: boolean
  className?: string
}

export function BloodDrop({ size = 20, animate = false, className }: BloodDropProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn(animate && 'animate-heartbeat', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="bloodGrad" x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e8304a" />
          <stop offset="1" stopColor="#8b111b" />
        </linearGradient>
      </defs>
      <path
        d="M16 4C16 4 8 14 8 20a8 8 0 0 0 16 0c0-6-8-16-8-16z"
        fill="url(#bloodGrad)"
      />
      <ellipse cx="13" cy="17" rx="2" ry="3" fill="white" opacity="0.15" />
    </svg>
  )
}
