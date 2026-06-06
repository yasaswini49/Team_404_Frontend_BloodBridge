import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle, Flame, TrendingUp, Minus, RefreshCw,
  ArrowRight, GitBranch, Users, Clock, Droplets
} from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface PriorityRequest {
  request_id: string;
  patient_id: string;
  patient_name: string | null;
  blood_type: string | null;
  city: string;
  state: string;
  status: string;
  requested_date: string | null;
  created_at: string;
  packets_required: number;
  has_bridge: boolean;
  bridge_donors: number;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  priority_confidence: number | null;
  interval_days: number | null;
  next_due_date: string | null;
}

const PRIORITY_CONFIG = {
  CRITICAL: {
    color: "text-red-400",
    bg: "bg-red-900/20 border-red-700/40",
    badge: "bg-red-900/40 border-red-700/50 text-red-300",
    icon: Flame,
    order: 0,
  },
  HIGH: {
    color: "text-orange-400",
    bg: "bg-orange-900/15 border-orange-700/30",
    badge: "bg-orange-900/40 border-orange-700/50 text-orange-300",
    icon: AlertTriangle,
    order: 1,
  },
  MEDIUM: {
    color: "text-yellow-400",
    bg: "bg-yellow-900/10 border-yellow-700/20",
    badge: "bg-yellow-900/30 border-yellow-700/40 text-yellow-300",
    icon: TrendingUp,
    order: 2,
  },
  LOW: {
    color: "text-ice-muted",
    bg: "bg-bg-surface border-border-dim",
    badge: "bg-bg-panel border-border-dim text-ice-dim",
    icon: Minus,
    order: 3,
  },
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
];

function PriorityBadge({ priority, confidence }: { priority: string; confidence: number | null }) {
  const cfg = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.MEDIUM;
  const Icon = cfg.icon;
  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold", cfg.badge)}>
      <Icon size={11} />
      {priority}
      {confidence != null && (
        <span className="opacity-70 font-normal">({(confidence * 100).toFixed(0)}%)</span>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: typeof Flame; color: string;
}) {
  return (
    <div className={cn("rounded-xl border p-4 flex items-center gap-3", color)}>
      <div className="w-9 h-9 rounded-lg bg-current/10 flex items-center justify-center">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-2xl font-bold font-data">{value}</p>
        <p className="text-xs opacity-70">{label}</p>
      </div>
    </div>
  );
}

export function PriorityRequestsPage() {
  const { token } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PriorityRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await apiCall<PriorityRequest[]>(
        `/ml/priority-requests?status=${statusFilter}`,
        "GET",
        null,
        token
      );
      setRequests(res);
      setLastRefresh(new Date());
    } catch (e) {
      addToast("Failed to load priority requests", "error");
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const critical = requests.filter(r => r.priority === "CRITICAL");
  const high = requests.filter(r => r.priority === "HIGH");
  const medium = requests.filter(r => r.priority === "MEDIUM");
  const low = requests.filter(r => r.priority === "LOW");

  const goToBridge = () => navigate("/bridges");

  return (
    <PageShell
      title="AI Priority Requests"
      description="All transfusion requests scored and ranked by the ML Request Priority Model"
    >
      <div className="space-y-6 w-full">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Critical" value={critical.length} icon={Flame} color="text-red-400 bg-red-900/15 border-red-700/30" />
          <StatCard label="High" value={high.length} icon={AlertTriangle} color="text-orange-400 bg-orange-900/10 border-orange-700/20" />
          <StatCard label="Medium" value={medium.length} icon={TrendingUp} color="text-yellow-400 bg-yellow-900/10 border-yellow-700/20" />
          <StatCard label="Low" value={low.length} icon={Minus} color="text-ice-muted bg-bg-surface border-border-dim" />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-2">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  "px-4 py-1.5 rounded-lg border text-sm font-medium transition-all",
                  statusFilter === opt.value
                    ? "border-blood-400/50 bg-blood-400/10 text-blood-300"
                    : "border-border-dim bg-bg-surface text-ice-muted hover:text-ice"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-xs text-ice-dim">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchRequests}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </Button>
            <Button size="sm" onClick={goToBridge} className="gap-2">
              <GitBranch size={14} />
              Assign Bridge
            </Button>
          </div>
        </div>

        {/* Model info banner */}
        <div className="rounded-xl border border-blood-800/30 bg-blood-900/10 px-4 py-3 flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blood-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Flame size={12} className="text-blood-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-blood-300 mb-0.5">ML Request Priority Model Active</p>
            <p className="text-xs text-ice-dim">
              Requests are ranked using blood rarity, number of assigned donors, eligibility and location signals.
              CRITICAL = rare blood + no/few donors assigned. Use this list to decide which patients to prioritize when assigning bridges.
            </p>
          </div>
        </div>

        {/* Request List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 rounded-xl bg-bg-surface animate-pulse border border-border-dim" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-ice-muted text-sm">
              No {statusFilter} requests found.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((r, idx) => {
              const cfg = PRIORITY_CONFIG[r.priority] ?? PRIORITY_CONFIG.MEDIUM;
              return (
                <div
                  key={r.request_id}
                  className={cn(
                    "rounded-xl border p-4 transition-all duration-200",
                    cfg.bg
                  )}
                >
                  <div className="flex items-start gap-4 flex-wrap md:flex-nowrap">
                    {/* Rank */}
                    <div className="shrink-0 w-8 h-8 rounded-full bg-bg-panel border border-border-dim flex items-center justify-center">
                      <span className="font-data text-xs text-ice-muted">{idx + 1}</span>
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <PriorityBadge priority={r.priority} confidence={r.priority_confidence} />
                        {r.blood_type && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blood-900/40 border border-blood-700/40 text-blood-300 font-data font-bold">
                            <Droplets size={10} />
                            {r.blood_type}
                          </span>
                        )}
                        {!r.has_bridge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-900/30 border border-amber-700/40 text-amber-300">
                            No Bridge
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 text-xs">
                        <div>
                          <span className="text-ice-dim">Patient </span>
                          <span className="text-ice font-medium">{r.patient_name ?? "—"}</span>
                        </div>
                        <div>
                          <span className="text-ice-dim">Location </span>
                          <span className="text-ice">{r.city}, {r.state}</span>
                        </div>
                        <div>
                          <span className="text-ice-dim">Packets </span>
                          <span className="text-ice font-data">{r.packets_required}</span>
                        </div>
                        <div>
                          <span className="text-ice-dim">Interval </span>
                          <span className="text-ice font-data">{r.interval_days ?? "—"}d</span>
                        </div>
                        <div>
                          <span className="text-ice-dim">Requested </span>
                          <span className="text-ice">{r.requested_date ? formatDate(r.requested_date) : "—"}</span>
                        </div>
                        <div>
                          <span className="text-ice-dim">Next Due </span>
                          <span className="text-ice">{r.next_due_date ? formatDate(r.next_due_date) : "—"}</span>
                        </div>
                        {r.has_bridge && (
                          <div className="col-span-2">
                            <span className="text-ice-dim">Bridge Donors </span>
                            <span className="text-green-400 font-data">{r.bridge_donors}</span>
                            <span className="text-ice-dim"> assigned</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      {!r.has_bridge && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={goToBridge}
                          className="gap-1.5 whitespace-nowrap"
                        >
                          <GitBranch size={12} />
                          Assign Bridge
                        </Button>
                      )}
                      {r.has_bridge && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate("/bridge-management")}
                          className="gap-1.5 whitespace-nowrap"
                        >
                          <Users size={12} />
                          Manage Bridge
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
