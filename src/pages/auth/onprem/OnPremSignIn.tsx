import * as React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "../AuthLayout";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

/**
 * On-Premise sign-in page.
 *
 * Differences from cloud sign-in:
 *   - No SSO, no "Create one" link (members are provisioned by the admin)
 *   - Single-site account — first-run setup entry below the form
 */
export default function OnPremSignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useAuthStore((s) => s.signIn);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@") || password.length < 4) {
      setError("Enter a valid email and password (4+ characters).");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const initials = email.split("@")[0].slice(0, 2).toUpperCase() || "OP";
      const displayName = email
        .split("@")[0]
        .split(/[._]+/)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");
      signIn({
        id: "usr-onprem-" + Math.random().toString(36).slice(2, 6),
        name: displayName || email,
        initials,
        role: "admin",
        email,
        notificationCount: 0,
        orgName: "Sembawang Naval Base",
        deploymentMode: "onprem",
      });
      toast.success(`Welcome back, ${displayName.split(" ")[0] || email}`, {
        description: "Loading the on-premise workspace…",
      });
      navigate(redirectTo, { replace: true });
    }, 300);
  }

  return (
    <AuthLayout hideBrand>
      <div>
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-secondary shadow-lg shadow-secondary/25">
            <Play className="size-7 fill-white text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Sign in to your account
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Use the email assigned to you by your site administrator.
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@account.local"
                className="h-10 pl-9 text-base"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-10 px-9 text-base"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="size-3.5 accent-primary"
              />
              Keep me signed in
            </label>
            <Link
              to="/on-premise/forgot-password"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.08] px-3 py-2 text-sm text-sev-critical">
              <AlertCircle className="size-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" className="mt-2 h-10 w-full gap-2 text-base" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Authenticating…
              </>
            ) : (
              <>
                <LogIn className="size-3.5" /> Sign In
              </>
            )}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-2xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
          <span className="h-px flex-1 bg-border" />
          first-run setup
          <span className="h-px flex-1 bg-border" />
        </div>

        <Link
          to="/on-premise/setup"
          className={cn(
            "flex w-full items-center justify-between rounded-md border border-border bg-card/40 px-4 py-3 transition-colors hover:border-secondary/50 hover:bg-card/60"
          )}
        >
          <div>
            <p className="text-base font-bold text-foreground">Set up this account</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Activate license, configure the site, add members.
            </p>
          </div>
          <span className="text-xl text-secondary">→</span>
        </Link>

        <p className="mt-6 text-center font-mono text-2xs text-muted-foreground/60">
          Build 4.7.2-onprem · Air-gapped · No telemetry
        </p>
      </div>
    </AuthLayout>
  );
}
