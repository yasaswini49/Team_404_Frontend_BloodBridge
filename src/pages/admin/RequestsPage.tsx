import { useEffect, useState } from 'react'
import { CheckCircle, Filter } from 'lucide-react'
import { apiCall } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { PageTransition } from '@/components/PageTransition'
import { StatusBadge } from '@/components/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime } from '@/lib/utils'
import type { TransfusionRequest, RequestStatus } from '@/types'

const FILTERS: (RequestStatus | 'all')[] = ['all', 'pending', 'approved', 'assigned', 'scheduled', 'completed']

export function AdminRequestsPage() {
  const { token } = useAuth()
  const { addToast } = useToast()
  const [requests, setRequests] = useState<TransfusionRequest[]>([])
  const [filter, setFilter] = useState<string>('all')

  const load = async () => {
    if (!token) return
    const endpoint = filter === 'all' ? '/requests/all' : `/requests/all?status=${filter}`
    const data = await apiCall<TransfusionRequest[]>(endpoint, 'GET', null, token)
    setRequests(data)
  }

  useEffect(() => { load().catch(() => {}) }, [token, filter])

  const complete = async (id: string) => {
    if (!token) return
    try {
      await apiCall(`/requests/${id}/complete`, 'POST', null, token)
      addToast('Request marked complete — next auto-request created', 'success')
      load()
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Failed', 'error')
    }
  }

  return (
    <PageTransition>
      <div className="flex items-center gap-3 mb-6">
        <Filter size={16} className="text-ice-dim" />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FILTERS.map((f) => (
              <SelectItem key={f} value={f}>{f === 'all' ? 'All Statuses' : f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="font-data text-[10px] text-ice-dim uppercase">{requests.length} requests</span>
      </div>

      <div className="space-y-3">
        {requests.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-ice-muted">No requests found</CardContent></Card>
        ) : requests.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-data text-[10px] text-ice-dim">{r.id.slice(0, 13)}…</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={r.status} />
                  {r.is_auto && <span className="font-data text-[9px] text-gold uppercase">Auto</span>}
                </div>
                <p className="text-sm text-ice-muted mt-2">
                  Created {formatDateTime(r.created_at)}
                  {r.packets_required && ` · ${r.packets_required} packets`}
                </p>
              </div>
              {r.status !== 'completed' && r.status !== 'cancelled' && (
                <Button variant="primary" size="sm" onClick={() => complete(r.id)}>
                  <CheckCircle size={14} /> Mark Complete
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </PageTransition>
  )
}

export function PatientRequestsPage() {
  const { token } = useAuth()
  const [requests, setRequests] = useState<TransfusionRequest[]>([])

  useEffect(() => {
    if (!token) return
    apiCall<TransfusionRequest[]>('/patients/my-requests', 'GET', null, token)
      .then(setRequests)
      .catch(() => {})
  }, [token])

  return (
    <PageTransition>
      <div className="space-y-3">
        {requests.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-ice-muted">No transfusion requests yet</CardContent></Card>
        ) : requests.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <StatusBadge status={r.status} />
                <p className="text-sm text-ice-muted mt-2">
                  {r.requested_date ? formatDateTime(r.requested_date) : 'Date pending'}
                </p>
              </div>
              {r.window_start && (
                <p className="font-data text-[10px] text-ice-dim">
                  Window: {formatDateTime(r.window_start)} – {formatDateTime(r.window_end)}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </PageTransition>
  )
}
