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
import { VerifiedBadge } from "@/components/StatusBadge";
import { INDIAN_STATES } from "@/lib/utils";
import { parseOptionalNumber } from "@/lib/form";
import { cn } from "@/lib/utils";
import type { PatientProfile, Hospital } from "@/types";

const GENDERS = ["Male", "Female", "Other"];
const THALASSEMIA_TYPES = ["Alpha", "Beta"];

type ProfileForm = {
  age: string;
  gender: string;
  city: string;
  state: string;
  pincode: string;
  hospital_id: string;
  hplc_unique_id: string;
  thalassemia_type: string;
  guardian_name: string;
  guardian_phone: string;
  notes: string;
};

const emptyProfile = (): ProfileForm => ({
  age: "",
  gender: "",
  city: "",
  state: "",
  pincode: "",
  hospital_id: "",
  hplc_unique_id: "",
  thalassemia_type: "",
  guardian_name: "",
  guardian_phone: "",
  notes: "",
});

function toProfileForm(p: PatientProfile): ProfileForm {
  return {
    age: p.age != null ? String(p.age) : "",
    gender: p.gender ?? "",
    city: p.city ?? "",
    state: p.state ?? "",
    pincode: p.pincode ?? "",
    hospital_id: p.hospital_id ?? "",
    hplc_unique_id: p.hplc_unique_id ?? "",
    thalassemia_type: p.thalassemia_type ?? "",
    guardian_name: p.guardian_name ?? "",
    guardian_phone: p.guardian_phone ?? "",
    notes: p.notes ?? "",
  };
}

export function PatientProfilePage() {
  const { token } = useAuth();
  const { addToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfile);

  const load = () => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      apiCall<{ profile: PatientProfile }>("/patients/me", "GET", null, token),
      apiCall<Hospital[]>("/hospital/list", "GET", null, token),
    ])
      .then(([res, hospitalList]) => {
        setProfile(res.profile);
        setProfileForm(toProfileForm(res.profile));
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
  };

  useEffect(() => {
    load();
  }, [token]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const age = parseOptionalNumber(profileForm.age);
    if (age == null) {
      addToast("Age is required", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        age,
        gender: profileForm.gender || undefined,
        city: profileForm.city,
        state: profileForm.state,
        pincode: profileForm.pincode || undefined,
        hospital_id: profileForm.hospital_id === "none" ? undefined : profileForm.hospital_id || undefined,
        hplc_unique_id: profileForm.hplc_unique_id,
        thalassemia_type: profileForm.thalassemia_type || undefined,
        guardian_name: profileForm.guardian_name || undefined,
        guardian_phone: profileForm.guardian_phone || undefined,
        notes: profileForm.notes || undefined,
      };
      if (profile) {
        const res = await apiCall<{ profile: PatientProfile }>(
          "/patients/me",
          "PUT",
          payload,
          token,
        );
        setProfile(res.profile);
        setProfileForm(toProfileForm(res.profile));
        setEditing(false);
        addToast("Profile updated", "success");
      } else {
        await apiCall("/patients/register", "POST", payload, token);
        if (file) await uploadFile("/patients/upload-hplc", file, token);
        addToast(
          "Profile created.",
          "success",
        );
        setEditing(false);
        load();
      }
      if (file && profile)
        await uploadFile("/patients/upload-hplc", file, token);
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
            <CardTitle>Complete Your Patient Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ice-muted mb-4">
              Set up your profile to begin coordination.
            </p>
            <Button variant="gold" onClick={() => setEditing(true)}>
              Create Profile
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const showProfileForm = !profile || editing;
  const showView = profile && !editing;

  return (
    <PageShell
      title="My Profile"
      description={
        profile
          ? "Your patient profile and transfusion plan"
          : "Set up your profile to begin receiving care"
      }
      action={
        profile && !editing ? (
          <Button variant="ghost" onClick={() => setEditing(true)}>
            <Pencil size={14} className="mr-2" /> Update Profile
          </Button>
        ) : editing && profile ? (
          <Button
            variant="ghost"
            onClick={() => {
              setEditing(false);
              setProfileForm(toProfileForm(profile));
            }}
          >
            Cancel
          </Button>
        ) : null
      }
    >
      {showProfileForm ? (
        <Card glow className="w-full mb-6">
          <CardHeader>
            <CardTitle>
              {profile ? "Edit Patient Profile" : "Create Patient Profile"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={saveProfile}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="space-y-1.5">
                <Label>Age</Label>
                <Input
                  type="number"
                  value={profileForm.age}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, age: e.target.value })
                  }
                  placeholder="e.g. 12"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select
                  value={profileForm.gender}
                  onValueChange={(v) =>
                    setProfileForm({ ...profileForm, gender: v })
                  }
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
                <Label>Thalassemia Type</Label>
                <Select
                  value={profileForm.thalassemia_type}
                  onValueChange={(v) =>
                    setProfileForm({ ...profileForm, thalassemia_type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {THALASSEMIA_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>HPLC ID</Label>
                <Input
                  value={profileForm.hplc_unique_id}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      hplc_unique_id: e.target.value,
                    })
                  }
                  required
                  placeholder="Your HPLC report ID"
                />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input
                  value={profileForm.city}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, city: e.target.value })
                  }
                  required
                  placeholder="e.g. Mumbai"
                />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Select
                  value={profileForm.state}
                  onValueChange={(v) =>
                    setProfileForm({ ...profileForm, state: v })
                  }
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
                  value={profileForm.hospital_id}
                  onValueChange={(v) =>
                    setProfileForm({ ...profileForm, hospital_id: v })
                  }
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
              <div className="space-y-1.5">
                <Label>Pincode</Label>
                <Input
                  value={profileForm.pincode}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, pincode: e.target.value })
                  }
                  placeholder="e.g. 400001"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Guardian Name</Label>
                <Input
                  value={profileForm.guardian_name}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      guardian_name: e.target.value,
                    })
                  }
                  placeholder="Parent or guardian name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Guardian Phone</Label>
                <Input
                  value={profileForm.guardian_phone}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      guardian_phone: e.target.value,
                    })
                  }
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Notes</Label>
                <Input
                  value={profileForm.notes}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, notes: e.target.value })
                  }
                  placeholder="Medical notes (optional)"
                />
              </div>
              <div className="md:col-span-2">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer",
                    file
                      ? "border-blood-300/50 bg-blood-100/40"
                      : "border-border-med hover:border-blood-300/30",
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
                    <span className="flex items-center justify-center gap-2">
                      <FileText size={18} />
                      {file.name}
                    </span>
                  ) : (
                    <span className="text-ice-muted flex flex-col items-center">
                      <Upload size={20} className="mb-1" />
                      HPLC Document (optional)
                    </span>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <Button type="submit" size="lg" disabled={saving}>
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
      ) : null}

      {showView && profile ? (
        <div className="grid grid-cols-1 gap-6 w-full max-w-4xl">
          <Card glow className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle>Profile Details</CardTitle>
                <VerifiedBadge verified={profile.is_admin_verified} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Age", val: profile.age },
                  { label: "Gender", val: profile.gender || "—" },
                  {
                    label: "Thalassemia Type",
                    val: profile.thalassemia_type || "—",
                  },
                  { label: "City", val: profile.city },
                  { label: "State", val: profile.state },
                  { label: "Pincode", val: profile.pincode || "—" },
                  { label: "HPLC ID", val: profile.hplc_unique_id },
                  { label: "Guardian", val: profile.guardian_name || "—" },
                  {
                    label: "Guardian Phone",
                    val: profile.guardian_phone || "—",
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
        </div>
      ) : null}
    </PageShell>
  );
}
