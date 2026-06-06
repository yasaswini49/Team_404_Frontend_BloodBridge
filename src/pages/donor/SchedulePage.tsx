import { useEffect, useState, useCallback } from 'react'
import { Calendar, CheckCircle } from 'lucide-react'
import { apiCall } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { PageShell } from '@/components/PageShell'
import { StatusBadge } from '@/components/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'
import type { TransfusionRequest } from '@/types'

export function SchedulePage() {
  const { token } = useAuth()
  const { addToast } = useToast()
  const [schedule, setSchedule] = useState<TransfusionRequest[]>([])
  const [pending, setPending] = useState<TransfusionRequest[]>([])
  const [accepting, setAccepting] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!token) return
    Promise.all([
      apiCall<TransfusionRequest[]>('/donors/my-schedule', 'GET', null, token),
      apiCall<TransfusionRequest[]>('/donors/pending-requests', 'GET', null, token),
    ])
      .then(([sched, pend]) => {
        setSchedule(sched)
        setPending(pend)
      })
      .catch(() => {})
  }, [token])

  useEffect(() => { load() }, [load])

  const accept = async (requestId: string) => {
    if (!token) return
    setAccepting(requestId)
    try {
      await apiCall(`/donors/accept-request/${requestId}`, 'POST', null, token)
      addToast('Request accepted — coordinator will schedule your appointment', 'success')
      load()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to accept', 'error')
    } finally {
      setAccepting(null)
    }
  }

  return (
    <PageShell
      title="My Schedule"
      description="Accept transfusion requests and view upcoming donation appointments"
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
        <Card glow className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle size={20} className="text-blood-400" />
              Requests Awaiting Your Acceptance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-ice-muted text-center py-8">No requests waiting for your acceptance</p>
            ) : (
              <div className="space-y-3">
                {pending.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-xl bg-bg-surface p-4 border border-border-dim">
                    <div>
                      <StatusBadge status={r.status} />
                      <p className="text-sm text-ice-muted mt-2">
                        {r.requested_date ? formatDateTime(r.requested_date) : 'Date TBD'}
                      </p>
                      <p className="font-data text-[10px] text-ice-dim mt-1">{r.packets_required ?? 1} packet(s)</p>
                    </div>
                    <Button
                      variant="gold"
                      size="sm"
                      disabled={accepting === r.id}
                      onClick={() => accept(r.id)}
                    >
                      {accepting === r.id ? 'Accepting…' : 'Accept'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card glow className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar size={20} /> Upcoming Donations</CardTitle>
          </CardHeader>
          <CardContent>
            {schedule.length === 0 ? (
              <p className="text-ice-muted text-center py-8">No upcoming donation appointments</p>
            ) : (
              <div className="space-y-3">
                {schedule.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl bg-bg-surface p-4 border border-border-dim">
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
      </div>
    </PageShell>
  )
}
