import { useEffect, useState } from 'react'
import { GitBranch, Search, Copy } from 'lucide-react'
import { apiCall } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { TransfusionRequest, DonorFindResult } from '@/types'
import { cn } from '@/lib/utils'

export function BridgePage() {
  const { token } = useAuth()
  const { addToast } = useToast()
  const [requests, setRequests] = useState<TransfusionRequest[]>([])
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null)
  const [bridgeSlots, setBridgeSlots] = useState<string[]>(Array(8).fill(''))
  const [emergencySlots, setEmergencySlots] = useState<string[]>(['', ''])
  const [submitting, setSubmitting] = useState(false)
  const [suggestedDonors, setSuggestedDonors] = useState<DonorFindResult[]>([])
  const [findBlood, setFindBlood] = useState('O+')
  const [findCity, setFindCity] = useState('Mumbai')
  const [findState, setFindState] = useState('Maharashtra')

  useEffect(() => {
    if (!token) return
    Promise.all([
      apiCall<TransfusionRequest[]>('/requests/all?status=pending', 'GET', null, token),
      apiCall<TransfusionRequest[]>('/requests/all?status=approved', 'GET', null, token),
    ]).then(([p, a]) => setRequests([...p, ...a])).catch(() => {})
  }, [token])

  const uniquePatients = [...new Map(requests.map((r) => [r.patient_id, r])).values()]

  const findDonors = async () => {
    if (!token) return
    try {
      const res = await apiCall<{ donors: DonorFindResult[] }>(
        '/ml/find-donors', 'POST',
        { blood_type: findBlood, patient_city: findCity, patient_state: findState, top_k: 10 },
        token,
      )
      setSuggestedDonors(res.donors)
      addToast(`Found ${res.donors.length} matching donors`, 'success')
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'ML search failed', 'error')
    }
  }

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id)
    addToast('UUID copied', 'success')
  }

  const assign = async () => {
    if (!token || !selectedPatient) {
      addToast('Select a patient first', 'warn')
      return
    }
    if (bridgeSlots.some((s) => !s) || emergencySlots.some((s) => !s)) {
      addToast('All 10 donor slots must be filled', 'warn')
      return
    }
    setSubmitting(true)
    try {
      const res = await apiCall<{ bridge_code: string; hospital_suggested: string | null }>(
        '/admin/assign-bridge', 'POST',
        { patient_id: selectedPatient, donor_ids: bridgeSlots, emergency_donor_ids: emergencySlots },
        token,
      )
      addToast(`Bridge ${res.bridge_code} assigned${res.hospital_suggested ? ` · ${res.hospital_suggested}` : ''}`, 'success')
      setRequests((prev) => prev.filter((r) => r.patient_id !== selectedPatient))
      setSelectedPatient(null)
      setBridgeSlots(Array(8).fill(''))
      setEmergencySlots(['', ''])
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Assignment failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Patients Awaiting Bridge</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[320px]">
                <div className="space-y-2 pr-3">
                  {uniquePatients.length === 0 ? (
                    <p className="text-ice-muted text-sm p-4">No patients with pending/approved requests</p>
                  ) : uniquePatients.map((r) => (
                    <button
                      key={r.patient_id}
                      type="button"
                      onClick={() => setSelectedPatient(r.patient_id)}
                      className={cn(
                        'w-full text-left rounded-lg border p-3 transition-all',
                        selectedPatient === r.patient_id
                          ? 'border-blood-400/40 bg-blood-400/5'
                          : 'border-border-dim hover:border-border-med bg-bg-surface',
                      )}
                    >
                      <p className="font-data text-[10px] text-ice-dim">PATIENT</p>
                      <p className="font-data text-xs text-ice truncate">{r.patient_id}</p>
                      <p className="text-xs text-ice-muted mt-1">Status: {r.status}</p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card glow>
            <CardHeader><CardTitle className="text-xl flex items-center gap-2"><Search size={18} /> ML Donor Finder</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Blood</Label><Input value={findBlood} onChange={(e) => setFindBlood(e.target.value)} /></div>
                <div><Label>City</Label><Input value={findCity} onChange={(e) => setFindCity(e.target.value)} /></div>
                <div><Label>State</Label><Input value={findState} onChange={(e) => setFindState(e.target.value)} /></div>
              </div>
              <Button variant="gold" size="sm" onClick={findDonors}>Find Donors</Button>
              {suggestedDonors.length > 0 && (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {suggestedDonors.map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-xs bg-bg-surface rounded px-2 py-1.5">
                      <span className="font-data truncate flex-1">{d.id.slice(0, 18)}… · {d.city}</span>
                      <Button variant="ghost" size="sm" onClick={() => copyId(d.id)}><Copy size={12} /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card glow>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GitBranch size={20} /> Assign Bridge (8+2)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPatient ? (
              <p className="font-data text-[10px] text-blood-300">Selected: {selectedPatient}</p>
            ) : (
              <p className="text-sm text-ice-muted">Select a patient from the left panel</p>
            )}

            <div>
              <Label className="mb-2 block">Bridge Donors (Slots 1–8)</Label>
              <div className="grid grid-cols-2 gap-2">
                {bridgeSlots.map((val, i) => (
                  <Input
                    key={i}
                    placeholder={`Slot ${i + 1} UUID`}
                    value={val}
                    onChange={(e) => {
                      const next = [...bridgeSlots]
                      next[i] = e.target.value
                      setBridgeSlots(next)
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Emergency Donors (Slots 9–10)</Label>
              <div className="grid grid-cols-2 gap-2">
                {emergencySlots.map((val, i) => (
                  <Input
                    key={i}
                    placeholder={`Emergency ${i + 1} UUID`}
                    value={val}
                    onChange={(e) => {
                      const next = [...emergencySlots]
                      next[i] = e.target.value
                      setEmergencySlots(next)
                    }}
                  />
                ))}
              </div>
            </div>

            <Button size="lg" className="w-full" onClick={assign} disabled={submitting}>
              Assign Bridge
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  )
}
