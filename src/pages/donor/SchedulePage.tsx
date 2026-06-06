import { useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'
import { apiCall } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { PageTransition } from '@/components/PageTransition'
import { StatusBadge } from '@/components/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import type { TransfusionRequest } from '@/types'

export function SchedulePage() {
  const { token } = useAuth()
  const [schedule, setSchedule] = useState<TransfusionRequest[]>([])

  useEffect(() => {
    if (!token) return
    apiCall<TransfusionRequest[]>('/donors/my-schedule', 'GET', null, token)
      .then(setSchedule)
      .catch(() => {})
  }, [token])

  return (
    <PageTransition>
      <Card glow>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar size={20} /> Upcoming Donations</CardTitle>
        </CardHeader>
        <CardContent>
          {schedule.length === 0 ? (
            <p className="text-ice-muted text-center py-8">No upcoming donation appointments</p>
          ) : (
            <div className="space-y-3">
              {schedule.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg bg-bg-surface p-4 border border-border-dim">
                  <div>
                    <StatusBadge status={s.status} />
                    <p className="text-sm text-ice-muted mt-2">
                      {s.requested_date ? formatDateTime(s.requested_date) : 'Date TBD'}
                    </p>
                  </div>
                  <p className="font-data text-[10px] text-ice-dim">{s.packets_required ?? 1} packet(s)</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  )
}
