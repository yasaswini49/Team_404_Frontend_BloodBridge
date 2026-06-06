import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { BloodDrop } from "@/components/BloodDrop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDefaultRoute } from "@/lib/auth";
import { tryGetLocation } from "@/lib/geolocation";
import type { UserRole } from "@/types";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const isLogin = mode === "login";
  const { login, register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "donor" as UserRole,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        const coords = await tryGetLocation();
        await register({
          ...form,
          ...(coords
            ? { latitude: coords.latitude, longitude: coords.longitude }
            : {}),
        });
        addToast(
          coords
            ? "Welcome to BloodBridge — location saved"
            : "Welcome to BloodBridge",
          "success",
        );
      }
      const auth = JSON.parse(localStorage.getItem("bb_auth")!);
      navigate(getDefaultRoute(auth.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen care-grid flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 care-pattern opacity-60 pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-blood-300/15 blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-sage-400/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="inline-flex items-center justify-center mb-4"
          >
            <BloodDrop size={56} animate />
          </motion.div>
          <h1 className="font-display text-5xl font-normal text-ice tracking-tight">
            BloodBridge
          </h1>
          <p className="font-body text-sm text-ice-muted mt-2">
            A caring bridge between donors and heroes
          </p>
        </div>

        <Card glow className="backdrop-blur-sm bg-bg-panel/95">
          <CardContent className="p-6 pt-6">
            <div className="flex gap-1 mb-6 p-1 rounded-xl bg-bg-surface border border-border-dim">
              <Link to="/login" className="flex-1">
                <Button
                  variant={isLogin ? "primary" : "ghost"}
                  size="sm"
                  className="w-full"
                  type="button"
                >
                  Sign In
                </Button>
              </Link>
              <Link to="/register" className="flex-1">
                <Button
                  variant={!isLogin ? "primary" : "ghost"}
                  size="sm"
                  className="w-full"
                  type="button"
                >
                  <UserPlus size={14} /> Register
                </Button>
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={form.full_name}
                      onChange={(e) =>
                        setForm({ ...form, full_name: e.target.value })
                      }
                      required
                      placeholder="Priya Sharma"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      required
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select
                      value={form.role}
                      onValueChange={(v) =>
                        setForm({ ...form, role: v as UserRole })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="donor">Blood Donor</SelectItem>
                        <SelectItem value="patient">
                          Thalassemia Patient
                        </SelectItem>
                        <SelectItem value="hospital_coordinator">
                          Hospital Coordinator
                        </SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <p className="text-sm text-blood-600 font-body border border-blood-300/50 rounded-xl px-3 py-2 bg-blood-100">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full mt-2"
                disabled={loading}
              >
                {loading ? (
                  "Please wait…"
                ) : isLogin ? (
                  <>
                    Sign In <ArrowRight size={14} />
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center font-body text-sm text-ice-dim mt-6">
          Trusted care · One bridge · Eight heroes by your side
        </p>
      </motion.div>
    </div>
  );
}
