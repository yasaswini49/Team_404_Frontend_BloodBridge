import { useState, useRef } from 'react'
import { Upload, FileText } from 'lucide-react'
import { apiCall, uploadFile } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { PageTransition } from '@/components/PageTransition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { BLOOD_TYPES, INDIAN_STATES } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function PatientProfilePage() {
  const { token } = useAuth()
  const { addToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [step, setStep] = useState<'profile' | 'plan'>('profile')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({ age: 12, city: '', state: 'Maharashtra', hplc_unique_id: '' })
  const [plan, setPlan] = useState({ blood_type: 'B+', packets_per_transfusion: 2, interval_days: 21 })

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setLoading(true)
    try {
      await apiCall('/patients/register', 'POST', profile, token)
      if (file) await uploadFile('/patients/upload-hplc', file, token)
      addToast('Profile created — now set your transfusion plan', 'success')
      setStep('plan')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const savePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setLoading(true)
    try {
      await apiCall('/patients/plan', 'POST', plan, token)
      addToast('Transfusion plan created. First request submitted.', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      <Card glow className="max-w-2xl">
        <CardHeader>
          <CardTitle>{step === 'profile' ? 'Patient Profile' : 'Transfusion Plan'}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 'profile' ? (
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Age</Label><Input type="number" value={profile.age} onChange={(e) => setProfile({ ...profile, age: +e.target.value })} /></div>
                <div className="space-y-1.5"><Label>HPLC ID</Label><Input value={profile.hplc_unique_id} onChange={(e) => setProfile({ ...profile, hplc_unique_id: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>City</Label><Input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} required /></div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Select value={profile.state} onValueChange={(v) => setProfile({ ...profile, state: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div role="button" tabIndex={0} onClick={() => fileRef.current?.click()} className={cn('border-2 border-dashed rounded-xl p-6 text-center cursor-pointer', file ? 'border-blood-400/40' : 'border-border-med')}>
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {file ? <span className="flex items-center justify-center gap-2"><FileText size={18} />{file.name}</span> : <span className="text-ice-muted flex flex-col items-center"><Upload size={20} className="mb-1" />HPLC Document</span>}
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>Continue to Plan</Button>
            </form>
          ) : (
            <form onSubmit={savePlan} className="space-y-4">
              <Separator />
              <div className="space-y-1.5">
                <Label>Blood Type Required</Label>
                <Select value={plan.blood_type} onValueChange={(v) => setPlan({ ...plan, blood_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BLOOD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Packets per Transfusion</Label><Input type="number" min={1} max={10} value={plan.packets_per_transfusion} onChange={(e) => setPlan({ ...plan, packets_per_transfusion: +e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Interval (days)</Label><Input type="number" min={7} max={90} value={plan.interval_days} onChange={(e) => setPlan({ ...plan, interval_days: +e.target.value })} /></div>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>Create Plan & Submit Request</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  )
}
