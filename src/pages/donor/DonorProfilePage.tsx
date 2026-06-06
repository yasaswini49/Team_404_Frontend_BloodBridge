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
import { BLOOD_TYPES, INDIAN_STATES } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function DonorProfilePage() {
  const { token } = useAuth()
  const { addToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    blood_type: 'O+',
    age: 25,
    weight: 65,
    city: '',
    state: 'Maharashtra',
    hplc_unique_id: '',
    donor_type: 'bridge',
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setLoading(true)
    try {
      await apiCall('/donors/register', 'POST', form, token)
      if (file) await uploadFile('/donors/upload-hplc', file, token)
      addToast('Donor profile created. Awaiting verification.', 'success')
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
          <CardTitle>Donor Profile Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Blood Type</Label>
                <Select value={form.blood_type} onValueChange={(v) => setForm({ ...form, blood_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{BLOOD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Donor Type</Label>
                <Select value={form.donor_type} onValueChange={(v) => setForm({ ...form, donor_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bridge">Bridge Donor</SelectItem>
                    <SelectItem value="emergency">Emergency Backup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Age</Label><Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: +e.target.value })} min={18} max={65} /></div>
              <div className="space-y-1.5"><Label>Weight (kg)</Label><Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: +e.target.value })} min={45} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>HPLC Unique ID</Label><Input value={form.hplc_unique_id} onChange={(e) => setForm({ ...form, hplc_unique_id: e.target.value })} required /></div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                file ? 'border-blood-300/50 bg-blood-100/60' : 'border-border-med hover:border-blood-300/40',
              )}
            >
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-blood-600"><FileText size={20} />{file.name}</div>
              ) : (
                <div className="text-ice-muted"><Upload size={24} className="mx-auto mb-2 opacity-50" /><p className="text-sm">Upload HPLC Document</p></div>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? 'Saving…' : 'Create Profile'}</Button>
          </form>
        </CardContent>
      </Card>
    </PageTransition>
  )
}
