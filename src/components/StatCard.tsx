import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  icon: LucideIcon
  delta?: number
  accent?: boolean
  index?: number
}

export function StatCard({ label, value, unit, icon: Icon, delta, accent, index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
    >
      <Card className={cn('p-5', accent && 'border-blood-400/20')}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-data text-[10px] uppercase tracking-widest text-ice-dim">{label}</p>
            <p className={cn('font-display text-4xl font-light mt-1', accent ? 'text-blood-300' : 'text-ice')}>
              {value}
              {unit && <span className="text-lg text-ice-muted ml-1">{unit}</span>}
            </p>
            {delta !== undefined && (
              <p className={cn('font-data text-[10px] mt-2', delta >= 0 ? 'text-emerald-400' : 'text-blood-300')}>
                {delta >= 0 ? '+' : ''}{delta} today
              </p>
            )}
          </div>
          <div className={cn(
            'rounded-lg p-2.5',
            accent ? 'bg-blood-400/10 text-blood-300' : 'bg-bg-surface text-ice-muted',
          )}>
            <Icon size={20} />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
