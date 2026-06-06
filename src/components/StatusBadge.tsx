import { Badge } from '@/components/ui/badge'
import type { RequestStatus } from '@/types'

const statusVariant: Record<RequestStatus, 'warn' | 'info' | 'success' | 'default' | 'blood'> = {
  pending: 'warn',
  approved: 'info',
  assigned: 'info',
  scheduled: 'success',
  completed: 'success',
  cancelled: 'blood',
}

export function StatusBadge({ status }: { status: RequestStatus | string }) {
  const s = status as RequestStatus
  return (
    <Badge variant={statusVariant[s] ?? 'default'}>
      {status.replace('_', ' ')}
    </Badge>
  )
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <Badge variant={verified ? 'success' : 'warn'}>
      {verified ? 'Verified' : 'Pending'}
    </Badge>
  )
}

export function BloodTypeBadge({ type }: { type: string }) {
  return <Badge variant="blood">{type || '—'}</Badge>
}
