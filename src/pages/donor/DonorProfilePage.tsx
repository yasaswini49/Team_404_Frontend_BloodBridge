import { useEffect, useState, useRef } from "react";
import { Upload, FileText, Pencil, MapPin } from "lucide-react";
import { apiCall, uploadFile } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VerifiedBadge, BloodTypeBadge } from "@/components/StatusBadge";
import { BLOOD_TYPES, INDIAN_STATES } from "@/lib/utils";
import { parseOptionalNumber } from "@/lib/form";
import { cn } from "@/lib/utils";
import type { DonorProfile, Hospital } from "@/types";

const GENDERS = ["Male", "Female", "Other"];

type DonorForm = {
  blood_type: string;
  age: string;
  weight: string;
  gender: string;
  city: string;
  state: string;
  pincode: string;
  hospital_id: string;
  hplc_unique_id: string;
  donor_type: string;
  notes: string;
};

const emptyForm = (): DonorForm => ({
  blood_type: "",
  age: "",
  weight: "",
  gender: "",
  city: "",
  state: "",
  pincode: "",
  hospital_id: "",
  hplc_unique_id: "",
  donor_type: "bridge",
  notes: "",
});

function profileToForm(p: DonorProfile): DonorForm {
  return {
    blood_type: p.blood_type ?? "",
    age: p.age != null ? String(p.age) : "",
    weight: p.weight != null ? String(p.weight) : "",
    gender: p.gender ?? "",
    city: p.city ?? "",
    state: p.state ?? "",
    pincode: p.pincode ?? "",
    hospital_id: p.hospital_id ?? "",
    hplc_unique_id: p.hplc_unique_id ?? "",
    donor_type: p.donor_type ?? "bridge",
    notes: p.notes ?? "",
  };
}

export function DonorProfilePage() {
  const { token } = useAuth();
  const { addToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<DonorForm>(emptyForm);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      apiCall<DonorProfile>("/donors/me", "GET", null, token),
      apiCall<Hospital[]>("/hospital/list", "GET", null, token),
    ])
      .then(([p, hospitalList]) => {
        setProfile(p);
        setForm(profileToForm(p));
        setHospitals(hospitalList);
        setEditing(false);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Profile load error:", err);
        setProfile(null);
        setEditing(true);
        setLoading(false);
      });
  }, [token]);

  const buildPayload = () => {
    const age = parseOptionalNumber(form.age);
    const weight = parseOptionalNumber(form.weight);
    if (!form.blood_type) throw new Error("Please select a blood type.");
    if (age == null || weight == null)
      throw new Error("Age and weight are required.");
    if (!form.city) throw new Error("City is required.");
    if (!form.state) throw new Error("State is required.");
    if (!form.hplc_unique_id.trim())
      throw new Error("HPLC Unique ID is required.");

    return {
      blood_type: form.blood_type,
      age,
      weight,
      gender: form.gender || undefined,
      city: form.city.trim(),
      state: form.state,
      pincode: form.pincode || undefined,
      hospital_id: form.hospital_id === "none" ? undefined : form.hospital_id || undefined,
      hplc_unique_id: form.hplc_unique_id.trim(),
      donor_type: form.donor_type,
      notes: form.notes?.trim() || undefined,
    };
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const payload = buildPayload();
      if (profile) {
        const res = await apiCall<{ profile: DonorProfile }>(
          "/donors/me",
          "PUT",
          payload,
          token,
        );
        setProfile(res.profile);
        setForm(profileToForm(res.profile));
        setEditing(false);
        addToast("Profile updated", "success");
      } else {
        await apiCall("/donors/register", "POST", payload, token);
        const p = await apiCall<DonorProfile>("/donors/me", "GET", null, token);
        setProfile(p);
        setForm(profileToForm(p));
        setEditing(false);
        addToast("Donor profile created. Awaiting verification.", "success");
      }
      if (file) await uploadFile("/donors/upload-hplc", file, token);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageShell title="My Profile">
        <p className="text-ice-muted">Loading profile…</p>
      </PageShell>
    );
  }

  if (!profile && !editing) {
    return (
      <PageShell title="My Profile">
        <Card glow className="w-full">
          <CardHeader>
            <CardTitle>Complete Your Donor Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ice-muted mb-4">
              Complete your donor profile to join a blood bridge and help save
              lives.
            </p>
            <Button variant="gold" onClick={() => setEditing(true)}>
              Create Profile
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const showForm = !profile || editing;

  return (
    <PageShell
      title="My Profile"
      description={
        profile
          ? "Your donor profile and verification status"
          : "Complete your donor profile to join a bridge"
      }
      action={
        profile && !editing ? (
          <Button variant="gold" onClick={() => setEditing(true)}>
            <Pencil size={14} /> Update Profile
          </Button>
        ) : profile && editing ? (
          <Button
            variant="ghost"
            onClick={() => {
              setEditing(false);
              setForm(profileToForm(profile));
            }}
          >
            Cancel
          </Button>
        ) : null
      }
    >
      {showForm ? (
        <Card glow className="w-full">
          <CardHeader>
            <CardTitle>
              {profile ? "Edit Donor Profile" : "Create Donor Profile"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={submit}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="space-y-1.5">
                <Label>Blood Type</Label>
                <Select
                  value={form.blood_type}
                  onValueChange={(v) => setForm({ ...form, blood_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Donor Type</Label>
                <Select
                  value={form.donor_type}
                  onValueChange={(v) => setForm({ ...form, donor_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bridge">Bridge Donor</SelectItem>
                    <SelectItem value="emergency">Emergency Backup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Age</Label>
                <Input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  min={18}
                  max={65}
                  placeholder="e.g. 28"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  min={45}
                  placeholder="e.g. 65"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) => setForm({ ...form, gender: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Pincode</Label>
                <Input
                  value={form.pincode}
                  onChange={(e) =>
                    setForm({ ...form, pincode: e.target.value })
                  }
                  placeholder="e.g. 400001"
                />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                  placeholder="e.g. Mumbai"
                />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Select
                  value={form.state}
                  onValueChange={(v) => setForm({ ...form, state: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Hospital</Label>
                <Select
                  value={form.hospital_id}
                  onValueChange={(v) => setForm({ ...form, hospital_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hospital" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {hospitals.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name} — {h.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>HPLC Unique ID</Label>
                <Input
                  value={form.hplc_unique_id}
                  onChange={(e) =>
                    setForm({ ...form, hplc_unique_id: e.target.value })
                  }
                  required
                  placeholder="Your HPLC report ID"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Notes</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Any additional information (optional)"
                />
              </div>
              <div className="md:col-span-2">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileRef.current?.click()}
                  onKeyDown={(e) =>
                    e.key === "Enter" && fileRef.current?.click()
                  }
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                    file
                      ? "border-blood-300/50 bg-blood-100/60"
                      : "border-border-med hover:border-blood-300/40",
                  )}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.png"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-blood-600">
                      <FileText size={20} />
                      {file.name}
                    </div>
                  ) : (
                    <div className="text-ice-muted">
                      <Upload size={24} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Upload HPLC Document (optional)</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full md:w-auto min-w-[200px]"
                  disabled={saving}
                >
                  {saving
                    ? "Saving…"
                    : profile
                      ? "Save Changes"
                      : "Create Profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : profile ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          <Card glow className="lg:col-span-2 w-full">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle>Profile Details</CardTitle>
                <div className="flex gap-2">
                  <BloodTypeBadge type={profile.blood_type} />
                  <VerifiedBadge verified={profile.is_admin_verified} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Blood Type", val: profile.blood_type },
                  { label: "Donor Type", val: profile.donor_type },
                  { label: "Age", val: profile.age },
                  { label: "Weight", val: `${profile.weight} kg` },
                  { label: "Gender", val: profile.gender || "—" },
                  { label: "Pincode", val: profile.pincode || "—" },
                  { label: "City", val: profile.city },
                  { label: "State", val: profile.state },
                  { label: "HPLC ID", val: profile.hplc_unique_id },
                  { label: "Total Donations", val: profile.total_donations },
                  {
                    label: "Availability",
                    val: profile.availability ? "Available" : "Unavailable",
                  },
                ].map(({ label, val }) => (
                  <div
                    key={label}
                    className="rounded-xl bg-bg-surface p-4 border border-border-dim"
                  >
                    <p className="font-data text-[9px] uppercase text-ice-dim tracking-wider">
                      {label}
                    </p>
                    <p className="text-ice mt-1.5 font-medium">{val}</p>
                  </div>
                ))}
                <div className="rounded-xl bg-bg-surface p-4 border border-border-dim col-span-2 md:col-span-3">
                  <p className="font-data text-[9px] uppercase text-ice-dim tracking-wider">
                    Location
                  </p>
                  <p className="text-ice mt-1.5 flex items-center gap-1.5">
                    <MapPin size={14} className="text-blood-400" />
                    {profile.city}, {profile.state}
                    {profile.latitude != null && profile.longitude != null && (
                      <span className="text-ice-dim text-xs ml-2">
                        ({profile.latitude.toFixed(4)},{" "}
                        {profile.longitude.toFixed(4)})
                      </span>
                    )}
                  </p>
                </div>
                {profile.notes && (
                  <div className="rounded-xl bg-bg-surface p-4 border border-border-dim col-span-2 md:col-span-3">
                    <p className="font-data text-[9px] uppercase text-ice-dim tracking-wider">
                      Notes
                    </p>
                    <p className="text-ice-muted mt-1.5">{profile.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.hplc_doc_url ? (
                <a
                  href={profile.hplc_doc_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blood-400 hover:underline text-sm flex items-center gap-2"
                >
                  <FileText size={16} /> View HPLC Document
                </a>
              ) : (
                <p className="text-ice-muted text-sm">
                  No HPLC document uploaded yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </PageShell>
  );
}
