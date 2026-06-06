import { useEffect, useState } from 'react'
import { ExternalLink, CheckCircle, User, Heart } from 'lucide-react'
import { apiCall } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { PageTransition } from '@/components/PageTransition'
import { BloodTypeBadge, VerifiedBadge } from '@/components/StatusBadge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import type { DonorProfile, PatientProfile } from '@/types'

function ProfileCard({
  type,
  id,
  bloodType,
  city,
  state,
  hplcUrl,
  hplcId,
  onVerify,
}: {
  type: 'donor' | 'patient'
  id: string
  bloodType?: string
  city?: string
  state?: string
  hplcUrl?: string | null
  hplcId?: string
  onVerify: () => void
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="rounded-xl bg-blood-100 p-2.5 text-blood-500">
            {type === 'donor' ? <User size={18} /> : <Heart size={18} />}
          </div>
          <div>
            <p className="font-body text-xs text-ice-dim capitalize">{type} · {id.slice(0, 8)}…</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              {bloodType && <BloodTypeBadge type={bloodType} />}
              <VerifiedBadge verified={false} />
            </div>
            <p className="text-sm text-ice-muted mt-2">{city}, {state}</p>
            {hplcId && <p className="font-data text-[10px] text-ice-dim mt-1">HPLC: {hplcId}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {hplcUrl && (
            <Button variant="secondary" size="sm" asChild>
              <a href={hplcUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={12} /> HPLC
              </a>
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={onVerify}>
            <CheckCircle size={12} /> Verify
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function VerifyPage() {
  const { token } = useAuth()
  const { addToast } = useToast()
  const [donors, setDonors] = useState<DonorProfile[]>([])
  const [patients, setPatients] = useState<PatientProfile[]>([])

  const load = async () => {
    if (!token) return
    const [d, p] = await Promise.all([
      apiCall<DonorProfile[]>('/admin/pending-donors', 'GET', null, token),
      apiCall<PatientProfile[]>('/admin/pending-patients', 'GET', null, token),
    ])
    setDonors(d)
    setPatients(p)
  }

  useEffect(() => { load().catch(() => {}) }, [token])

  const verifyDonor = async (id: string) => {
    if (!token) return
    await apiCall(`/admin/verify-donor/${id}`, 'POST', null, token)
    addToast('Donor verified successfully', 'success')
    setDonors((prev) => prev.filter((d) => d.id !== id))
  }

  const verifyPatient = async (id: string) => {
    if (!token) return
    await apiCall(`/admin/verify-patient/${id}`, 'POST', null, token)
    addToast('Patient verified successfully', 'success')
    setPatients((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <PageTransition>
      <Tabs defaultValue="donors">
        <TabsList>
          <TabsTrigger value="donors">Donors ({donors.length})</TabsTrigger>
          <TabsTrigger value="patients">Patients ({patients.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="donors" className="space-y-3 mt-4">
          {donors.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-ice-muted">No pending donor verifications</CardContent></Card>
          ) : donors.map((d) => (
            <ProfileCard
              key={d.id}
              type="donor"
              id={d.id}
              bloodType={d.blood_type}
              city={d.city}
              state={d.state}
              hplcUrl={d.hplc_doc_url}
              hplcId={d.hplc_unique_id}
              onVerify={() => verifyDonor(d.id).catch((e) => addToast(e.message, 'error'))}
            />
          ))}
        </TabsContent>
        <TabsContent value="patients" className="space-y-3 mt-4">
          {patients.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-ice-muted">No pending patient verifications</CardContent></Card>
          ) : patients.map((p) => (
            <ProfileCard
              key={p.id}
              type="patient"
              id={p.id}
              bloodType={p.blood_type ?? undefined}
              city={p.city}
              state={p.state}
              hplcUrl={p.hplc_doc_url}
              hplcId={p.hplc_unique_id}
              onVerify={() => verifyPatient(p.id).catch((e) => addToast(e.message, 'error'))}
            />
          ))}
        </TabsContent>
      </Tabs>
    </PageTransition>
  )
}
