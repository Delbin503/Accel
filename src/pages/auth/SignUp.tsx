import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, User, AlertCircle, ArrowRight, Check, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "./AuthLayout";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

export default function SignUpPage() {
  const navigate = useNavigate();
  const signUp = useAuthStore((s) => s.signUp);

  const [name, setName] = React.useState("");
  const [orgName, setOrgName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [terms, setTerms] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const pwScore = scorePassword(password);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !orgName.trim()) {
      setError("Tell us your name and your organization.");
      return;
    }
    if (!email.includes("@")) {
      setError("Enter a valid work email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!terms) {
      setError("You must accept the Terms and Privacy Policy.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
      signUp({
        id: "usr-" + Math.random().toString(36).slice(2, 6),
        name,
        initials,
        role: "admin",
        email,
        notificationCount: 0,
        orgName,
      });
      toast.success("Welcome to Accel", { description: "Let's get your first site set up." });
      navigate("/onboarding/site", { replace: true });
    }, 250);
  }

  return (
    <AuthLayout
      brandSlot={
        <>
          <h2 className="text-[28px] font-bold leading-tight text-foreground">
            Create your workspace in two minutes.
          </h2>
          <ul className="space-y-3 text-[13px] text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-white">1</span>
              <span><strong className="text-foreground">Create your account</strong> — name, work email, password.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-white">2</span>
              <span><strong className="text-foreground">Set up your first site</strong> — name, address, areas, cameras.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-white">3</span>
              <span><strong className="text-foreground">Pick a plan</strong> — Starter, Pro or Enterprise per site.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded-full bg-success text-[9px] font-bold text-white">✓</span>
              <span><strong className="text-foreground">Start detecting</strong> — your dashboard unlocks instantly.</span>
            </li>
          </ul>
        </>
      }
    >
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-foreground">Create your account</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Start a free 30-day trial. No credit card required.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Full name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Delbin Arkar" className="h-10 pl-9 text-[13px]" required />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Organization
              </label>
              <div className="relative">
                <Building className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Your company" className="h-10 pl-9 text-[13px]" required />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Work email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com" className="h-10 pl-9 text-[13px]" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input type={showPw ? "text" : "password"} autoComplete="new-password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters" className="h-10 px-9 text-[13px]" />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                <div className="flex flex-1 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      i < pwScore.score
                        ? pwScore.score >= 3 ? "bg-success" : pwScore.score === 2 ? "bg-warning" : "bg-sev-critical"
                        : "bg-muted"
                    )} />
                  ))}
                </div>
                <span className={cn(
                  pwScore.score >= 3 ? "text-success" :
                  pwScore.score === 2 ? "text-warning" :
                  "text-sev-critical"
                )}>{pwScore.label}</span>
              </div>
            )}
          </div>

          <label className="flex items-start gap-2 text-[12px] text-muted-foreground">
            <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)}
              className="mt-0.5 size-3.5 accent-primary" />
            <span>
              I agree to the{" "}
              <a href="https://accel.ai/terms" target="_blank" rel="noreferrer" className="text-primary underline">Terms of Service</a>
              {" "}and{" "}
              <a href="https://accel.ai/privacy" target="_blank" rel="noreferrer" className="text-primary underline">Privacy Policy</a>.
            </span>
          </label>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.08] px-3 py-2 text-[12px] text-sev-critical">
              <AlertCircle className="size-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" className="h-10 w-full gap-2 text-[13px]" disabled={loading}>
            {loading ? "Creating account…" : (<>Create account <ArrowRight className="size-3.5" /></>)}
          </Button>
        </form>

        <div className="mt-3 flex items-center gap-2 rounded-md border border-info/30 bg-info/[0.05] px-3 py-2 text-[11px] text-info">
          <Check className="size-3.5 flex-shrink-0" />
          Next step after sign-up: <strong>create your first site</strong>, then choose a subscription plan.
        </div>

        <p className="mt-6 text-center text-[12px] text-muted-foreground">
          Already have an account?{" "}
          <Link to="/signin" className="font-semibold text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}

function scorePassword(p: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (p.length === 0) return { score: 0, label: "" };
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return {
    score: Math.min(4, s) as 0 | 1 | 2 | 3 | 4,
    label: s <= 1 ? "Weak" : s === 2 ? "Fair" : s === 3 ? "Good" : "Strong",
  };
}
