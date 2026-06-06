import { useEffect, useState, useCallback } from "react";
import { GitBranch, Search, UserPlus, ChevronRight, Copy, CheckCircle2, Circle, Zap, Users } from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { parseOptionalNumber } from "@/lib/form";
import type { DonorFindResult } from "@/types";
import { cn, formatDate } from "@/lib/utils";

interface BridgeSummary {
  id: string;
  bridge_code: string;
  is_active: boolean;
  created_at: string;
  bridge_slots_filled: number;
  bridge_slots_total: number;
  emergency_slots_filled: number;
  emergency_slots_total: number;
  patient_id: string | null;
  patient_name: string | null;
  patient_blood_type: string | null;
}

interface BridgeSlot {
  slot_order: number;
  donor_type: "bridge" | "emergency";
  current_turn: boolean;
  donor_id: string;
  donor_name: string | null;
  donor_blood_type: string | null;
}

interface BridgeDetail extends BridgeSummary {
  patient_city: string | null;
  patient_state: string | null;
  patient_latitude: number | null;
  patient_longitude: number | null;
  slots: BridgeSlot[];
}

function CapacityBar({ filled, total, color }: { filled: number; total: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-4 h-4 rounded-sm border transition-all",
            i < filled
              ? color === "blood" ? "bg-blood-500 border-blood-400" : "bg-amber-500 border-amber-400"
              : "bg-bg-surface border-border-dim"
          )}
        />
      ))}
      <span className="text-xs text-ice-muted ml-1">{filled}/{total}</span>
    </div>
  );
}

export function BridgeManagementPage() {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [bridges, setBridges] = useState<BridgeSummary[]>([]);
  const [selected, setSelected] = useState<BridgeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  // ML Finder state
  const [findLat, setFindLat] = useState("");
  const [findLon, setFindLon] = useState("");
  const [findCity, setFindCity] = useState("");
  const [findState, setFindState] = useState("");
  const [donors, setDonors] = useState<DonorFindResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Add donor state
  const [addingDonorId, setAddingDonorId] = useState<string | null>(null);
  const [donorType, setDonorType] = useState<"bridge" | "emergency">("bridge");

  const fetchBridges = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiCall<BridgeSummary[]>("/admin/bridges", "GET", null, token);
      setBridges(res);
    } catch (e) {
      addToast("Failed to load bridges", "error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchBridges(); }, [fetchBridges]);

  const openBridge = async (bridge: BridgeSummary) => {
    if (!token) return;
    setDetailLoading(true);
    try {
      const res = await apiCall<BridgeDetail>(`/admin/bridges/${bridge.id}`, "GET", null, token);
      setSelected(res);
      // Auto-populate ML search with patient location
      setFindLat(res.patient_latitude ? res.patient_latitude.toString() : "");
      setFindLon(res.patient_longitude ? res.patient_longitude.toString() : "");
      setFindCity(res.patient_city || "");
      setFindState(res.patient_state || "");
      setDonors([]);
    } catch (e) {
      addToast("Failed to load bridge details", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const findDonors = async () => {
    if (!token || !selected) return;
    setSearching(true);
    try {
      const res = await apiCall<{ donors: DonorFindResult[]; search_coords: null }>(
        "/ml/find-donors",
        "POST",
        {
          blood_type: selected.patient_blood_type || "O+",
          patient_city: findCity,
          patient_state: findState,
          patient_latitude: parseOptionalNumber(findLat),
          patient_longitude: parseOptionalNumber(findLon),
          top_k: 15,
        },
        token
      );
      setDonors(res.donors);
      if (res.donors.length === 0) addToast("No available donors found", "warn");
      else addToast(`Found ${res.donors.length} compatible donors`, "success");
    } catch (e) {
      addToast(e instanceof Error ? e.message : "ML search failed", "error");
    } finally {
      setSearching(false);
    }
  };

  const addDonor = async (donorId: string) => {
    if (!token || !selected) return;
    setAddingDonorId(donorId);
    try {
      await apiCall(
        `/admin/bridges/${selected.id}/add-donor`,
        "POST",
        { donor_id: donorId, donor_type: donorType },
        token
      );
      addToast("Donor added to bridge!", "success");
      // Refresh detail
      const res = await apiCall<BridgeDetail>(`/admin/bridges/${selected.id}`, "GET", null, token);
      setSelected(res);
      fetchBridges();
      // Remove from donor list
      setDonors(prev => prev.filter(d => d.id !== donorId));
    } catch (e) {
      addToast(e instanceof Error ? e.message : "Failed to add donor", "error");
    } finally {
      setAddingDonorId(null);
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    addToast("Copied!", "success");
  };

  const existingDonorIds = new Set(selected?.slots.map(s => s.donor_id) ?? []);
  const bridgeFilled = selected?.slots.filter(s => s.donor_type === "bridge").length ?? 0;
  const emergencyFilled = selected?.slots.filter(s => s.donor_type === "emergency").length ?? 0;

  return (
    <PageShell
      title="Bridge Management"
      description="View all active bridges, check capacity and assign new donors using AI"
    >
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 w-full">
        {/* Left: Bridge List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ice flex items-center gap-2">
              <GitBranch size={18} className="text-blood-400" />
              All Bridges
              <span className="text-xs bg-blood-900/40 border border-blood-800/40 px-2 py-0.5 rounded-full text-blood-300 ml-1">
                {bridges.length}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 rounded-xl bg-bg-surface animate-pulse border border-border-dim" />
              ))}
            </div>
          ) : bridges.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center text-ice-muted text-sm">
                No bridges created yet.
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="space-y-3 pr-2">
                {bridges.map(b => {
                  const isSelected = selected?.id === b.id;
                  const isFull = b.bridge_slots_filled >= b.bridge_slots_total;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => openBridge(b)}
                      className={cn(
                        "w-full text-left rounded-xl border p-4 transition-all duration-200 hover:border-blood-400/40",
                        isSelected
                          ? "border-blood-400/50 bg-blood-400/5 shadow-[0_0_12px_rgba(239,68,68,0.08)]"
                          : "border-border-dim bg-bg-surface"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-data text-sm text-blood-300 font-medium">{b.bridge_code}</span>
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full border font-medium",
                              b.is_active
                                ? "text-green-400 border-green-700/40 bg-green-900/20"
                                : "text-ice-dim border-border-dim bg-bg-panel"
                            )}>
                              {b.is_active ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </div>
                          {b.patient_name && (
                            <p className="text-xs text-ice truncate">
                              <span className="text-ice-dim">Patient: </span>{b.patient_name}
                              {b.patient_blood_type && (
                                <span className="ml-1 text-blood-300 font-data">{b.patient_blood_type}</span>
                              )}
                            </p>
                          )}
                          <p className="text-[10px] text-ice-dim mt-0.5">{formatDate(b.created_at)}</p>
                        </div>
                        <ChevronRight size={16} className={cn("shrink-0 mt-0.5 transition-transform", isSelected && "rotate-90 text-blood-400")} />
                      </div>

                      <div className="mt-3 space-y-1.5">
                        <div>
                          <p className="text-[10px] text-ice-dim mb-1">Bridge Slots</p>
                          <CapacityBar filled={b.bridge_slots_filled} total={b.bridge_slots_total} color="blood" />
                        </div>
                        <div>
                          <p className="text-[10px] text-ice-dim mb-1">Emergency Slots</p>
                          <CapacityBar filled={b.emergency_slots_filled} total={b.emergency_slots_total} color="amber" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Right: Bridge Detail + ML Search */}
        <div className="xl:col-span-3 space-y-4">
          {!selected && !detailLoading && (
            <Card className="h-48 flex items-center justify-center">
              <div className="text-center text-ice-muted">
                <GitBranch size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Select a bridge to manage it</p>
              </div>
            </Card>
          )}

          {detailLoading && (
            <div className="h-48 rounded-xl bg-bg-surface animate-pulse border border-border-dim" />
          )}

          {selected && !detailLoading && (
            <>
              {/* Bridge Slots Overview */}
              <Card glow>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <GitBranch size={18} />
                      {selected.bridge_code}
                    </span>
                    <div className="flex gap-2">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full border",
                        selected.is_active
                          ? "text-green-400 border-green-700/40 bg-green-900/20"
                          : "text-ice-dim border-border-dim"
                      )}>
                        {selected.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selected.patient_name && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-surface border border-border-dim">
                      <div className="w-8 h-8 rounded-full bg-blood-900/40 border border-blood-700/40 flex items-center justify-center">
                        <Users size={14} className="text-blood-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ice">{selected.patient_name}</p>
                        <p className="text-xs text-ice-dim">
                          {selected.patient_city}, {selected.patient_state}
                          {selected.patient_blood_type && (
                            <span className="ml-2 text-blood-300 font-data">{selected.patient_blood_type}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Current Slots Grid */}
                  <div>
                    <p className="text-xs text-ice-dim font-medium mb-2 uppercase tracking-wider">Bridge Slots (1–8)</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {Array.from({ length: 8 }).map((_, i) => {
                        const slot = selected.slots.find(s => s.slot_order === i + 1 && s.donor_type === "bridge");
                        return (
                          <div
                            key={i}
                            className={cn(
                              "rounded-lg border p-2 text-center text-xs transition-all",
                              slot
                                ? slot.current_turn
                                  ? "border-blood-400/60 bg-blood-400/10 text-blood-300"
                                  : "border-green-700/40 bg-green-900/10 text-green-400"
                                : "border-border-dim bg-bg-surface text-ice-dim"
                            )}
                          >
                            <p className="font-data text-[10px] mb-0.5">Slot {i + 1}</p>
                            {slot ? (
                              <>
                                {slot.current_turn && <Zap size={10} className="mx-auto mb-0.5 text-blood-400" />}
                                <p className="truncate text-[10px] leading-tight">{slot.donor_name?.split(" ")[0] ?? "Donor"}</p>
                                <p className="font-data text-[10px] opacity-70">{slot.donor_blood_type}</p>
                              </>
                            ) : (
                              <p className="text-[10px] text-ice-dim/50 mt-1">Empty</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-ice-dim font-medium mb-2 uppercase tracking-wider">Emergency Slots (9–10)</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Array.from({ length: 2 }).map((_, i) => {
                        const slot = selected.slots.find(s => s.slot_order === 9 + i && s.donor_type === "emergency");
                        return (
                          <div
                            key={i}
                            className={cn(
                              "rounded-lg border p-2 text-center text-xs transition-all",
                              slot
                                ? "border-amber-700/40 bg-amber-900/10 text-amber-400"
                                : "border-border-dim bg-bg-surface text-ice-dim"
                            )}
                          >
                            <p className="font-data text-[10px] mb-0.5">Emergency {i + 1}</p>
                            {slot ? (
                              <>
                                <p className="truncate text-[10px]">{slot.donor_name?.split(" ")[0] ?? "Donor"}</p>
                                <p className="font-data text-[10px] opacity-70">{slot.donor_blood_type}</p>
                              </>
                            ) : (
                              <p className="text-[10px] text-ice-dim/50 mt-1">Empty</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ML Donor Search */}
              <Card glow>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Search size={16} className="text-blood-400" />
                    AI Donor Finder
                    <span className="text-xs text-ice-dim font-normal ml-auto">
                      Bridge: {bridgeFilled}/8 · Emergency: {emergencyFilled}/2
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Slot type selector */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDonorType("bridge")}
                      className={cn(
                        "flex-1 py-2 rounded-lg border text-xs font-medium transition-all",
                        donorType === "bridge"
                          ? "border-blood-400/50 bg-blood-400/10 text-blood-300"
                          : "border-border-dim bg-bg-surface text-ice-muted hover:text-ice"
                      )}
                    >
                      Bridge Slot ({bridgeFilled}/8 filled)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDonorType("emergency")}
                      className={cn(
                        "flex-1 py-2 rounded-lg border text-xs font-medium transition-all",
                        donorType === "emergency"
                          ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
                          : "border-border-dim bg-bg-surface text-ice-muted hover:text-ice"
                      )}
                    >
                      Emergency Slot ({emergencyFilled}/2 filled)
                    </button>
                  </div>

                  {/* Search params */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Latitude</Label>
                      <Input
                        value={findLat}
                        onChange={e => setFindLat(e.target.value)}
                        placeholder="e.g. 16.5151"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Longitude</Label>
                      <Input
                        value={findLon}
                        onChange={e => setFindLon(e.target.value)}
                        placeholder="e.g. 80.6321"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">City</Label>
                      <Input
                        value={findCity}
                        onChange={e => setFindCity(e.target.value)}
                        placeholder="City"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">State</Label>
                      <Input
                        value={findState}
                        onChange={e => setFindState(e.target.value)}
                        placeholder="State"
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    variant="gold"
                    size="sm"
                    className="w-full"
                    onClick={findDonors}
                    disabled={searching}
                  >
                    <Search size={14} className="mr-2" />
                    {searching ? "Searching..." : `Find Compatible Donors (${selected.patient_blood_type})`}
                  </Button>

                  {/* Results */}
                  {donors.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      <p className="text-xs text-ice-dim">{donors.length} donors found — click + to add as {donorType} slot</p>
                      {donors.map(d => {
                        const alreadyIn = existingDonorIds.has(d.id);
                        return (
                          <div
                            key={d.id}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 border text-xs transition-all",
                              alreadyIn
                                ? "border-green-700/40 bg-green-900/10 opacity-60"
                                : "border-border-dim bg-bg-surface"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-data text-[10px] text-ice-dim truncate block">{d.id.slice(0, 18)}…</span>
                                <button
                                  type="button"
                                  onClick={() => copyId(d.id)}
                                  className="shrink-0 text-ice-dim hover:text-ice"
                                >
                                  <Copy size={10} />
                                </button>
                              </div>
                              <span className="text-ice-muted">
                                {d.city}{d.state ? `, ${d.state}` : ""}
                                {d.blood_type && <span className="ml-1 font-data text-blood-300">{d.blood_type}</span>}
                                {d.distance_km != null && ` · ${d.distance_km} km`}
                                {d.availability_prediction && (
                                  <span className={cn(
                                    "ml-2 px-1 rounded text-[10px]",
                                    d.availability_prediction === "Will Donate"
                                      ? "bg-green-900/30 text-green-400"
                                      : "bg-red-900/30 text-red-400"
                                  )}>
                                    {d.availability_prediction}
                                  </span>
                                )}
                                {d.churn_risk && (
                                  <span className={cn(
                                    "ml-1 px-1 rounded text-[10px]",
                                    d.churn_risk === "HIGH_RISK" ? "bg-red-900/30 text-red-400"
                                    : d.churn_risk === "MEDIUM_RISK" ? "bg-yellow-900/30 text-yellow-400"
                                    : "bg-green-900/30 text-green-400"
                                  )}>
                                    {d.churn_risk === "HIGH_RISK" ? "⚠ Churn Risk" : d.churn_risk === "MEDIUM_RISK" ? "~ Med Churn" : "✓ Stable"}
                                  </span>
                                )}
                                {d.confidence != null && (
                                  <span className="ml-1 text-ice-dim text-[10px]">{(d.confidence * 100).toFixed(0)}%</span>
                                )}
                              </span>
                            </div>
                            {alreadyIn ? (
                              <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                            ) : (
                              <Button
                                size="sm"
                                variant={donorType === "bridge" ? "default" : "gold"}
                                className="shrink-0 h-7 px-3"
                                disabled={addingDonorId === d.id}
                                onClick={() => addDonor(d.id)}
                              >
                                <UserPlus size={12} className="mr-1" />
                                {addingDonorId === d.id ? "..." : "Add"}
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
