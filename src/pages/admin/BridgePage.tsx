import { useEffect, useState } from "react";
import { GitBranch, Search, Copy, MapPin } from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BLOOD_TYPES, INDIAN_STATES } from "@/lib/utils";
import { parseOptionalNumber } from "@/lib/form";
import type { TransfusionRequest, DonorFindResult } from "@/types";
import { cn } from "@/lib/utils";

export function BridgePage() {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [requests, setRequests] = useState<TransfusionRequest[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [bridgeSlots, setBridgeSlots] = useState<string[]>(Array(8).fill(""));
  const [emergencySlots, setEmergencySlots] = useState<string[]>(["", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [suggestedDonors, setSuggestedDonors] = useState<DonorFindResult[]>([]);
  const [findBlood, setFindBlood] = useState("");
  const [findCity, setFindCity] = useState("");
  const [findState, setFindState] = useState("");
  const [findLat, setFindLat] = useState("");
  const [findLon, setFindLon] = useState("");
  const [searchCoords, setSearchCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiCall<TransfusionRequest[]>(
        "/requests/all?status=pending",
        "GET",
        null,
        token,
      ),
      apiCall<TransfusionRequest[]>(
        "/requests/all?status=approved",
        "GET",
        null,
        token,
      ),
    ])
      .then(([p, a]) => setRequests([...p, ...a]))
      .catch(() => {});
  }, [token]);

  const uniquePatients = [
    ...new Map(requests.map((r) => [r.patient_id, r])).values(),
  ];

  const handleSelectPatient = async (patientId: string) => {
    setSelectedPatient(patientId);
    if (!token) return;
    try {
      const res = await apiCall<{
        city: string;
        state: string;
        blood_type: string;
        latitude: number | null;
        longitude: number | null;
      }>(`/admin/patient/${patientId}`, "GET", null, token);
      setFindCity(res.city || "");
      setFindState(res.state || "");
      setFindBlood(res.blood_type || "");
      setFindLat(res.latitude ? res.latitude.toString() : "");
      setFindLon(res.longitude ? res.longitude.toString() : "");
    } catch (e) {
      console.error(e);
    }
  };

  const findDonors = async () => {
    if (!token) return;
    const lat = parseOptionalNumber(findLat);
    const lon = parseOptionalNumber(findLon);
    try {
      const res = await apiCall<{
        donors: DonorFindResult[];
        search_coords: { latitude: number; longitude: number } | null;
      }>(
        "/ml/find-donors",
        "POST",
        {
          blood_type: findBlood,
          patient_city: findCity,
          patient_state: findState,
          patient_latitude: lat,
          patient_longitude: lon,
          top_k: 10,
        },
        token,
      );
      setSuggestedDonors(res.donors);
      setSearchCoords(res.search_coords);
      addToast(`Found ${res.donors.length} matching donors`, "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "ML search failed", "error");
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    addToast("UUID copied", "success");
  };

  const assign = async () => {
    if (!token || !selectedPatient) {
      addToast("Select a patient first", "warn");
      return;
    }
    const donor_ids = bridgeSlots.filter(Boolean);
    const emergency_donor_ids = emergencySlots.filter(Boolean);
    if (donor_ids.length === 0) {
      addToast("At least one bridge donor is required", "warn");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiCall<{
        bridge_code: string;
        hospital_suggested: string | null;
      }>(
        "/admin/assign-bridge",
        "POST",
        { patient_id: selectedPatient, donor_ids, emergency_donor_ids },
        token,
      );
      addToast(
        `Bridge ${res.bridge_code} assigned${res.hospital_suggested ? ` · ${res.hospital_suggested}` : ""}`,
        "success",
      );
      setRequests((prev) =>
        prev.filter((r) => r.patient_id !== selectedPatient),
      );
      setSelectedPatient(null);
      setBridgeSlots(Array(8).fill(""));
      setEmergencySlots(["", ""]);
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Assignment failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      title="Bridge Assignment"
      description="Find nearby donors using geo-location and assign 8+2 bridge slots"
    >
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
        <div className="space-y-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-xl">
                Patients Awaiting Bridge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[320px]">
                <div className="space-y-2 pr-3">
                  {uniquePatients.length === 0 ? (
                    <p className="text-ice-muted text-sm p-4">
                      No patients with pending/approved requests
                    </p>
                  ) : (
                    uniquePatients.map((r) => (
                      <button
                        key={r.patient_id}
                        type="button"
                        onClick={() => handleSelectPatient(r.patient_id)}
                        className={cn(
                          "w-full text-left rounded-lg border p-3 transition-all",
                          selectedPatient === r.patient_id
                            ? "border-blood-400/40 bg-blood-400/5"
                            : "border-border-dim hover:border-border-med bg-bg-surface",
                        )}
                      >
                        <p className="font-data text-[10px] text-ice-dim">
                          PATIENT
                        </p>
                        <p className="font-data text-xs text-ice truncate">
                          {r.patient_id}
                        </p>
                        <p className="text-xs text-ice-muted mt-1">
                          Status: {r.status}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card glow className="w-full">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Search size={18} /> ML Donor Finder (Geo + Availability)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Blood Type</Label>
                  <select
                    className="w-full rounded-lg border border-border-dim bg-bg-surface px-3 py-2 text-sm text-ice"
                    value={findBlood}
                    onChange={(e) => setFindBlood(e.target.value)}
                  >
                    <option value="">Select</option>
                    {BLOOD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Input
                    value={findCity}
                    onChange={(e) => setFindCity(e.target.value)}
                    placeholder="Mumbai"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>State</Label>
                  <select
                    className="w-full rounded-lg border border-border-dim bg-bg-surface px-3 py-2 text-sm text-ice"
                    value={findState}
                    onChange={(e) => setFindState(e.target.value)}
                  >
                    <option value="">Select</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Latitude</Label>
                  <Input
                    value={findLat}
                    onChange={(e) => setFindLat(e.target.value)}
                    placeholder="e.g. 19.0760"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Longitude</Label>
                  <Input
                    value={findLon}
                    onChange={(e) => setFindLon(e.target.value)}
                    placeholder="e.g. 72.8777"
                  />
                </div>
              </div>
              {searchCoords && (
                <p className="text-xs text-ice-dim flex items-center gap-1">
                  <MapPin size={12} />
                  Searching near ({searchCoords.latitude.toFixed(4)},{" "}
                  {searchCoords.longitude.toFixed(4)})
                </p>
              )}
              <Button
                variant="gold"
                size="sm"
                onClick={findDonors}
                disabled={!findBlood}
              >
                Find Donors
              </Button>
              {suggestedDonors.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {suggestedDonors.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between text-xs bg-bg-surface rounded-lg px-3 py-2 border border-border-dim"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-data truncate block">
                          {d.id.slice(0, 18)}…
                        </span>
                        <span className="text-ice-muted">
                          {d.city}
                          {d.state ? `, ${d.state}` : ""}
                          {d.distance_km != null && ` · ${d.distance_km} km`}
                          {d.availability_prediction &&
                            ` · ${d.availability_prediction}`}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyId(d.id)}
                      >
                        <Copy size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card glow className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch size={20} /> Assign Bridge (up to 8 + 2)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPatient ? (
              <p className="font-data text-[10px] text-blood-300">
                Selected: {selectedPatient}
              </p>
            ) : (
              <p className="text-sm text-ice-muted">
                Select a patient from the left panel
              </p>
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
                      const next = [...bridgeSlots];
                      next[i] = e.target.value;
                      setBridgeSlots(next);
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">
                Emergency Donors (Slots 9–10)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {emergencySlots.map((val, i) => (
                  <Input
                    key={i}
                    placeholder={`Emergency ${i + 1} UUID`}
                    value={val}
                    onChange={(e) => {
                      const next = [...emergencySlots];
                      next[i] = e.target.value;
                      setEmergencySlots(next);
                    }}
                  />
                ))}
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={assign}
              disabled={submitting}
            >
              Assign Bridge
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
