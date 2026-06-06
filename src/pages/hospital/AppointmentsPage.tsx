import { useEffect, useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { PageShell } from "@/components/PageShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TransfusionRequest, Hospital } from "@/types";

export function AppointmentsPage() {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [pending, setPending] = useState<TransfusionRequest[]>([]);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [hospitalLoading, setHospitalLoading] = useState(false);
  const [hospitalForm, setHospitalForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
    phone: "",
    email: "",
  });
  const [form, setForm] = useState({
    request_id: "",
    scheduled_at: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const load = () => {
    if (!token) return;
    apiCall<TransfusionRequest[]>(
      "/hospital/pending-appointments",
      "GET",
      null,
      token,
    )
      .then(setPending)
      .catch(() => {});
    apiCall<{ hospital: Hospital | null }>("/hospital/me", "GET", null, token)
      .then((res) => {
        setHospital(res.hospital);
        if (res.hospital) {
          setHospitalForm({
            name: res.hospital.name || "",
            address: res.hospital.address || "",
            city: res.hospital.city || "",
            state: res.hospital.state || "",
            pincode: res.hospital.pincode || "",
            latitude: res.hospital.latitude?.toString() || "",
            longitude: res.hospital.longitude?.toString() || "",
            phone: res.hospital.phone || "",
            email: res.hospital.email || "",
          });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
  }, [token]);

  const prefill = (id: string) => setForm((f) => ({ ...f, request_id: id }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    try {
      await apiCall("/hospital/create-appointment", "POST", form, token);
      addToast("Appointment created — patient & donor notified", "success");
      setForm({ request_id: "", scheduled_at: "", notes: "" });
      load();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setHospitalLoading(true);
    try {
      const payload = {
        name: hospitalForm.name,
        address: hospitalForm.address,
        city: hospitalForm.city,
        state: hospitalForm.state,
        pincode: hospitalForm.pincode || undefined,
        latitude: hospitalForm.latitude
          ? Number(hospitalForm.latitude)
          : undefined,
        longitude: hospitalForm.longitude
          ? Number(hospitalForm.longitude)
          : undefined,
        phone: hospitalForm.phone || undefined,
        email: hospitalForm.email || undefined,
      };
      await apiCall("/hospital/me", "POST", payload, token);
      addToast("Hospital details saved", "success");
      load();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Hospital save failed",
        "error",
      );
    } finally {
      setHospitalLoading(false);
    }
  };

  return (
    <PageShell
      title="Appointments"
      description="Schedule transfusion appointments for accepted donor-patient pairs"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {!hospital ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Register Your Hospital</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-ice-muted mb-4">
                Hospital coordinators should set their hospital before
                scheduling appointments.
              </p>
              <form
                onSubmit={saveHospital}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input
                    value={hospitalForm.name}
                    onChange={(e) =>
                      setHospitalForm({ ...hospitalForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input
                    value={hospitalForm.city}
                    onChange={(e) =>
                      setHospitalForm({ ...hospitalForm, city: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <Input
                    value={hospitalForm.state}
                    onChange={(e) =>
                      setHospitalForm({
                        ...hospitalForm,
                        state: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Address</Label>
                  <Input
                    value={hospitalForm.address}
                    onChange={(e) =>
                      setHospitalForm({
                        ...hospitalForm,
                        address: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Pincode</Label>
                  <Input
                    value={hospitalForm.pincode}
                    onChange={(e) =>
                      setHospitalForm({
                        ...hospitalForm,
                        pincode: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    value={hospitalForm.phone}
                    onChange={(e) =>
                      setHospitalForm({
                        ...hospitalForm,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={hospitalForm.email}
                    onChange={(e) =>
                      setHospitalForm({
                        ...hospitalForm,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Latitude</Label>
                  <Input
                    value={hospitalForm.latitude}
                    onChange={(e) =>
                      setHospitalForm({
                        ...hospitalForm,
                        latitude: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Longitude</Label>
                  <Input
                    value={hospitalForm.longitude}
                    onChange={(e) =>
                      setHospitalForm({
                        ...hospitalForm,
                        longitude: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={hospitalLoading}
                  >
                    {hospitalLoading ? "Saving…" : "Save Hospital"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={18} /> Pending Assignments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.length === 0 ? (
              <p className="text-ice-muted text-sm py-4">
                No assigned requests awaiting scheduling
              </p>
            ) : (
              pending.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl bg-bg-surface p-4 border border-border-dim"
                >
                  <div className="min-w-0 flex-1">
                    <StatusBadge status={r.status} />
                    <p className="text-xs text-ice-muted mt-2">
                      Patient:{" "}
                      <span className="font-data text-[10px]">
                        {r.patient_id?.slice(0, 12)}…
                      </span>
                    </p>
                    <p className="text-xs text-ice-muted mt-1">
                      Req Date:{" "}
                      <span className="font-data text-[10px] text-ice">
                        {r.requested_date ? formatDate(r.requested_date) : "N/A"}
                      </span>
                    </p>
                    {r.assigned_donor_id && (
                      <p className="text-xs text-ice-muted">
                        Donor:{" "}
                        <span className="font-data text-[10px]">
                          {r.assigned_donor_id.slice(0, 12)}…
                        </span>
                      </p>
                    )}
                    <p className="font-data text-[10px] text-ice-dim mt-1 truncate">
                      {r.id}
                    </p>
                  </div>
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => prefill(r.id)}
                  >
                    Schedule
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card glow>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar size={18} /> Create Appointment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Request ID</Label>
                <Input
                  value={form.request_id}
                  onChange={(e) =>
                    setForm({ ...form, request_id: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Scheduled Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={(e) =>
                    setForm({ ...form, scheduled_at: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                Confirm Appointment
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
