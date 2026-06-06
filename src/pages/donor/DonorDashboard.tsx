import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Droplets, MapPin, Calendar, ArrowRight } from 'lucide-react'
import { apiCall } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { StatCard } from '@/components/StatCard'
import { PageTransition } from '@/components/PageTransition'
import { VerifiedBadge, BloodTypeBadge } from '@/components/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { DonorProfile } from '@/types'

export function DonorDashboard() {
  const { token } = useAuth()
  const [profile, setProfile] = useState<DonorProfile | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!token) return
    apiCall<DonorProfile>('/donors/me', 'GET', null, token)
      .then(setProfile)
      .catch(() => setNotFound(true))
  }, [token])

  if (notFound) {
    return (
      <PageTransition>
        <Card glow className="w-full">
          <CardHeader>
            <CardTitle>Complete Your Donor Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ice-muted mb-4">Register your profile and upload HPLC documents to join a bridge.</p>
            <Button asChild size="lg">
              <Link to="/profile">Set Up Profile <ArrowRight size={14} /></Link>
            </Button>
          </CardContent>
        </Card>
      </PageTransition>
    )
  }

  if (!profile) return null

  return (
    <PageTransition>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Donations" value={profile.total_donations} icon={Droplets} accent index={0} />
        <StatCard label="Blood Type" value={profile.blood_type} icon={Droplets} index={1} />
        <StatCard label="Donor Type" value={profile.donor_type} icon={Calendar} index={2} />
      </div>

      <Card glow>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Donor Profile</CardTitle>
            <div className="flex gap-2">
              <BloodTypeBadge type={profile.blood_type} />
              <VerifiedBadge verified={profile.is_admin_verified} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Age', val: profile.age },
              { label: 'Weight', val: `${profile.weight} kg` },
              { label: 'Location', val: `${profile.city}, ${profile.state}`, icon: MapPin },
              { label: 'Last Donated', val: formatDate(profile.last_donated_at) },
            ].map(({ label, val }) => (
              <div key={label} className="rounded-lg bg-bg-surface p-4 border border-border-dim">
                <p className="font-data text-[9px] uppercase text-ice-dim">{label}</p>
                <p className="text-ice mt-1">{val}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  )
}
