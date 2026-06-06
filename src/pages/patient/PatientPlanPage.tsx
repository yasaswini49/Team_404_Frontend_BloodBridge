import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { apiCall } from "@/lib/api";
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
import { Separator } from "@/components/ui/separator";
import { BloodTypeBadge } from "@/components/StatusBadge";
import { BLOOD_TYPES, formatDateTime } from "@/lib/utils";
import { parseOptionalNumber } from "@/lib/form";
import type { TransfusionPlan } from "@/types";

type PlanForm = {
  blood_type: string;
  packets_per_transfusion: string;
  interval_days: string;
};

const emptyPlan = (): PlanForm => ({
  blood_type: "",
  packets_per_transfusion: "",
  interval_days: "",
});

function toPlanForm(plan: TransfusionPlan): PlanForm {
  return {
    blood_type: plan.blood_type ?? "",
    packets_per_transfusion:
      plan.packets_per_transfusion != null
        ? String(plan.packets_per_transfusion)
        : "",
    interval_days: plan.interval_days != null ? String(plan.interval_days) : "",
  };
}

export function PatientPlanPage() {
  const { token } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<TransfusionPlan | null>(null);
  const [editingPlan, setEditingPlan] = useState(false);
  const [planForm, setPlanForm] = useState<PlanForm>(emptyPlan);

  const load = () => {
    if (!token) return;
    setLoading(true);
    apiCall<{ plan: TransfusionPlan | null }>("/patients/me", "GET", null, token)
      .then((res) => {
        setPlan(res.plan);
        if (res.plan) setPlanForm(toPlanForm(res.plan));
        setEditingPlan(false);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Plan load error:", err);
        setPlan(null);
        setEditingPlan(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, [token]);

  const savePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const packets = parseOptionalNumber(planForm.packets_per_transfusion);
    const interval = parseOptionalNumber(planForm.interval_days);
    if (!planForm.blood_type || packets == null || interval == null) {
      addToast("All plan fields are required", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        blood_type: planForm.blood_type,
        packets_per_transfusion: packets,
        interval_days: interval,
      };
      if (plan) {
        const res = await apiCall<TransfusionPlan>("/patients/plan", "PUT", payload, token);
        setPlan(res);
        setPlanForm(toPlanForm(res));
        setEditingPlan(false);
        addToast("Transfusion plan updated", "success");
      } else {
        await apiCall("/patients/plan", "POST", payload, token);
        addToast("Transfusion plan created. First request submitted.", "success");
        load();
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageShell title="Transfusion Plan">
        <p className="text-ice-muted">Loading plan…</p>
      </PageShell>
    );
  }

  const showPlanForm = editingPlan || !plan;
  const showPlanView = !editingPlan && !!plan;

  return (
    <PageShell
      title="Transfusion Plan"
      description="Manage your blood transfusion requirements and schedule"
      action={
        plan && !editingPlan ? (
          <Button variant="ghost" onClick={() => setEditingPlan(true)}>
            <Pencil size={14} className="mr-2" /> Edit Plan
          </Button>
        ) : null
      }
    >
      {showPlanForm ? (
        <Card glow className="w-full">
          <CardHeader>
            <CardTitle>{plan ? "Edit Transfusion Plan" : "Create Transfusion Plan"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={savePlan} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <Label>Blood Type Required</Label>
                <Select
                  value={planForm.blood_type}
                  onValueChange={(v) => setPlanForm({ ...planForm, blood_type: v })}
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
                <Label>Packets per Transfusion</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={planForm.packets_per_transfusion}
                  onChange={(e) =>
                    setPlanForm({
                      ...planForm,
                      packets_per_transfusion: e.target.value,
                    })
                  }
                  placeholder="e.g. 2"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Interval (days)</Label>
                <Input
                  type="number"
                  min={7}
                  max={90}
                  value={planForm.interval_days}
                  onChange={(e) => setPlanForm({ ...planForm, interval_days: e.target.value })}
                  placeholder="e.g. 21"
                />
              </div>
              <div className="md:col-span-3 flex gap-3">
                <Button type="submit" size="lg" disabled={saving}>
                  {saving ? "Saving…" : plan ? "Update Plan" : "Create Plan & Submit Request"}
                </Button>
                {editingPlan && plan && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditingPlan(false);
                      setPlanForm(toPlanForm(plan));
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {showPlanView && plan ? (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Transfusion Plan Details
              {plan && <BloodTypeBadge type={plan.blood_type} />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-xl bg-bg-surface p-4 border border-border-dim">
                <p className="font-data text-[9px] uppercase text-ice-dim">Packets / Session</p>
                <p className="text-ice text-xl mt-1">{plan.packets_per_transfusion}</p>
              </div>
              <div className="rounded-xl bg-bg-surface p-4 border border-border-dim">
                <p className="font-data text-[9px] uppercase text-ice-dim">Interval</p>
                <p className="text-ice text-xl mt-1">{plan.interval_days} days</p>
              </div>
              <div className="rounded-xl bg-bg-surface p-4 border border-border-dim">
                <p className="font-data text-[9px] uppercase text-ice-dim">Next Due</p>
                <p className="text-ice mt-1">
                  {plan.next_due_date ? formatDateTime(plan.next_due_date) : "TBD"}
                </p>
              </div>
              <Separator />
              <p className="text-xs text-ice-dim">
                Status: {plan.is_active ? "Active" : "Inactive"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </PageShell>
  );
}
