import { useEffect, useState } from 'react'
import { GitBranch, Users } from 'lucide-react'
import { apiCall } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PatientProfile } from '@/types'

interface PatientMe {
  profile: PatientProfile
}

export function BridgeInfoPage() {
  const { token } = useAuth()
  const [profile, setProfile] = useState<PatientProfile | null>(null)

  useEffect(() => {
    if (!token) return
    apiCall<PatientMe>('/patients/me', 'GET', null, token)
      .then((d) => setProfile(d.profile))
      .catch(() => {})
  }, [token])

  const hasBridge = profile?.current_bridge_id

  return (
    <PageTransition>
      <Card glow className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GitBranch size={22} /> My Donor Bridge</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasBridge ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-ice-dim mb-4 opacity-40" />
              <p className="font-display text-xl text-ice-muted">Bridge not yet assigned</p>
              <p className="text-sm text-ice-dim mt-2">Your admin will assign 8 primary donors and 2 emergency backups once your profile is verified.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Badge variant="blood" className="text-sm px-3 py-1">Bridge Active</Badge>
              <p className="font-data text-xs text-ice-muted">Bridge ID: {profile.current_bridge_id}</p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="rounded-lg bg-bg-surface border border-border-dim p-3 text-center">
                    <p className="font-data text-[9px] text-ice-dim uppercase">Slot {i + 1}</p>
                    <p className="font-display text-lg text-ice mt-1">Bridge</p>
                  </div>
                ))}
                {[9, 10].map((n) => (
                  <div key={n} className="rounded-lg bg-blood-900/30 border border-blood-400/20 p-3 text-center">
                    <p className="font-data text-[9px] text-gold uppercase">Emergency {n - 8}</p>
                    <p className="font-display text-lg text-gold mt-1">Backup</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  )
}
