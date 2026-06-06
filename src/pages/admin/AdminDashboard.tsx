import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Heart, Clock, ShieldAlert, RefreshCw } from 'lucide-react'
import { apiCall } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { StatCard } from '@/components/StatCard'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { AdminDashboard, TransfusionRequest } from '@/types'

export function AdminDashboard() {
  const { token } = useAuth()
  const [stats, setStats] = useState<AdminDashboard | null>(null)
  const [requests, setRequests] = useState<TransfusionRequest[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!token) return
    setLoading(true)
    try {
      const [dash, allReqs] = await Promise.all([
        apiCall<AdminDashboard>('/admin/dashboard', 'GET', null, token),
        apiCall<TransfusionRequest[]>('/requests/all', 'GET', null, token),
      ])
      setStats(dash)
      setRequests(allReqs)
    } catch {
      /* handled by empty state */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token])

  const statusCounts = requests.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})

  const total = requests.length || 1
  const completedRate = Math.round(((statusCounts.completed ?? 0) / total) * 100)

  return (
    <PageTransition>
      <div className="flex items-center justify-between mb-6">
        <p className="text-ice-muted text-sm">System-wide coordination overview</p>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Donors" value={stats?.total_donors ?? '—'} icon={Users} index={0} />
        <StatCard label="Total Patients" value={stats?.total_patients ?? '—'} icon={Heart} accent index={1} />
        <StatCard label="Pending Requests" value={stats?.pending_requests ?? '—'} icon={Clock} index={2} />
        <StatCard label="Pending Verifications" value={stats?.pending_verifications ?? '—'} icon={ShieldAlert} accent index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card glow>
          <CardHeader>
            <CardTitle>Request Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {['pending', 'approved', 'assigned', 'scheduled', 'completed'].map((status, i) => {
              const count = statusCounts[status] ?? 0
              const pct = Math.round((count / total) * 100)
              return (
                <div key={status}>
                  <div className="flex justify-between mb-1">
                    <span className="font-body text-xs font-medium text-ice-muted capitalize">{status}</span>
                    <span className="font-body text-xs text-ice">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-bg-surface overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: i * 0.1, duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-blood-400 to-blood-300"
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transfusion Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 mb-4">
              <span className="font-display text-6xl font-normal text-blood-500">{completedRate}</span>
              <span className="text-2xl text-ice-muted mb-2">%</span>
            </div>
            <p className="text-sm text-ice-muted mb-4">30-day completion rate across all requests</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Scheduled', val: statusCounts.scheduled ?? 0 },
                { label: 'Completed', val: statusCounts.completed ?? 0 },
                { label: 'Pending', val: statusCounts.pending ?? 0 },
              ].map(({ label, val }) => (
                <div key={label} className="rounded-lg bg-bg-surface p-3 text-center border border-border-dim">
                  <p className="font-display text-2xl">{val}</p>
                  <p className="font-body text-xs text-ice-dim">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
