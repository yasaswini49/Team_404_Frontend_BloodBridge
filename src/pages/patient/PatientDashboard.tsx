import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Calendar, ArrowRight } from 'lucide-react'
import { apiCall } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { StatCard } from '@/components/StatCard'
import { PageTransition } from '@/components/PageTransition'
import { StatusBadge, VerifiedBadge, BloodTypeBadge } from '@/components/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate, formatDateTime } from '@/lib/utils'
import type { PatientProfile, TransfusionPlan, TransfusionRequest } from '@/types'

interface PatientMe {
  profile: PatientProfile
  plan: TransfusionPlan | null
}

export function PatientDashboard() {
  const { token } = useAuth()
  const [data, setData] = useState<PatientMe | null>(null)
  const [requests, setRequests] = useState<TransfusionRequest[]>([])
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!token) return
    Promise.all([
      apiCall<PatientMe>('/patients/me', 'GET', null, token),
      apiCall<TransfusionRequest[]>('/patients/my-requests', 'GET', null, token),
    ])
      .then(([me, reqs]) => { setData(me); setRequests(reqs.slice(0, 5)) })
      .catch(() => setNotFound(true))
  }, [token])

  if (notFound) {
    return (
      <PageTransition>
        <Card glow className="w-full">
          <CardHeader><CardTitle>Complete Your Patient Profile</CardTitle></CardHeader>
          <CardContent>
            <p className="text-ice-muted mb-4">Set up your profile and transfusion plan to begin coordination.</p>
            <Button asChild size="lg"><Link to="/profile">Set Up Profile <ArrowRight size={14} /></Link></Button>
          </CardContent>
        </Card>
      </PageTransition>
    )
  }

  if (!data) return null
  const { profile, plan } = data

  return (
    <PageTransition>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Blood Type" value={plan?.blood_type ?? profile.blood_type ?? '—'} icon={Heart} accent index={0} />
        <StatCard label="Interval" value={plan?.interval_days ?? profile.transfusion_interval_days} unit="days" icon={Calendar} index={1} />
        <StatCard label="Next Due" value={formatDate(plan?.next_due_date ?? profile.next_transfusion_date)} icon={Calendar} index={2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card glow>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Patient Status</CardTitle>
              <VerifiedBadge verified={profile.is_admin_verified} />
            </div>
          </CardHeader>
          <CardContent>
            {plan && <BloodTypeBadge type={plan.blood_type} />}
            <p className="text-sm text-ice-muted mt-3">{profile.city}, {profile.state}</p>
            {plan && (
              <p className="font-data text-[10px] text-ice-dim mt-2">
                {plan.packets_per_transfusion} packets · every {plan.interval_days} days
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Requests</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {requests.length === 0 ? (
              <p className="text-ice-muted text-sm">No requests yet</p>
            ) : requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-border-dim last:border-0">
                <StatusBadge status={r.status} />
                <span className="font-data text-[10px] text-ice-dim">{formatDateTime(r.created_at)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
