import { useEffect, useState } from 'react'
import { Calendar, Clock } from 'lucide-react'
import { apiCall } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { PageTransition } from '@/components/PageTransition'
import { StatusBadge } from '@/components/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { TransfusionRequest } from '@/types'

export function AppointmentsPage() {
  const { token } = useAuth()
  const { addToast } = useToast()
  const [pending, setPending] = useState<TransfusionRequest[]>([])
  const [form, setForm] = useState({ request_id: '', scheduled_at: '', notes: '' })
  const [loading, setLoading] = useState(false)

  const load = () => {
    if (!token) return
    apiCall<TransfusionRequest[]>('/hospital/pending-appointments', 'GET', null, token)
      .then(setPending)
      .catch(() => {})
  }

  useEffect(() => { load() }, [token])

  const prefill = (id: string) => setForm((f) => ({ ...f, request_id: id }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setLoading(true)
    try {
      await apiCall('/hospital/create-appointment', 'POST', form, token)
      addToast('Appointment created — patient & donor notified', 'success')
      setForm({ request_id: '', scheduled_at: '', notes: '' })
      load()
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock size={18} /> Pending Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.length === 0 ? (
              <p className="text-ice-muted text-sm py-4">No assigned requests awaiting scheduling</p>
            ) : pending.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-bg-surface p-3 border border-border-dim">
                <div>
                  <StatusBadge status={r.status} />
                  <p className="font-data text-[10px] text-ice-dim mt-1 truncate max-w-[200px]">{r.id}</p>
                </div>
                <Button variant="gold" size="sm" onClick={() => prefill(r.id)}>Schedule</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card glow>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar size={18} /> Create Appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5"><Label>Request ID</Label><Input value={form.request_id} onChange={(e) => setForm({ ...form, request_id: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Scheduled Date & Time</Label><Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} required /></div>
              <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>Confirm Appointment</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
