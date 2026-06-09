import * as React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Loader2,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "../AuthLayout";
import { DeploymentModeSwitcher } from "@/components/shared/DeploymentModeSwitcher";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

/**
 * On-Premise sign-in page.
 *
 * Differences from cloud sign-in:
 *   - Username (not email) as primary identifier
 *   - Optional 2FA code reveal
 *   - "Use recovery code" link instead of "Forgot password"
 *   - No SSO, no "Create one" link (operators are provisioned by the admin)
 *   - Single-site appliance — site name shown at top
 */
export default function OnPremSignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useAuthStore((s) => s.signIn);

  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [twoFactorCode, setTwoFactorCode] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [showTwoFactor, setShowTwoFactor] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (username.trim().length < 2 || password.length < 4) {
      setError("Enter your username and password (4+ characters).");
      return;
    }
    if (showTwoFactor && twoFactorCode.length < 6) {
      setError("Enter the 6-digit code from your authenticator.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const initials = username
        .replace(/[^a-zA-Z]/g, "")
        .slice(0, 2)
        .toUpperCase() || "OP";
      const displayName = username
        .split(/[._]+/)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");
      signIn({
        id: "usr-onprem-" + Math.random().toString(36).slice(2, 6),
        name: displayName || username,
        initials,
        role: "admin",
        email: username,
        username,
        notificationCount: 0,
        orgName: "Sembawang Naval Base",
        deploymentMode: "onprem",
      });
      toast.success(`Welcome back, ${displayName.split(" ")[0] || username}`, {
        description: "Loading the on-premise workspace…",
      });
      navigate(redirectTo, { replace: true });
    }, 300);
  }

  return (
    <AuthLayout>
      <div>
        <DeploymentModeSwitcher />
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Sign in to your appliance
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          Use the username assigned to you by your site administrator.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Username
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. kc.loke"
                className="h-10 pl-9 font-mono text-base"
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
                {showPw ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
              </button>
            </div>
          </div>

          {showTwoFactor ? (
            <div>
              <label className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3" />
                  2FA Code
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowTwoFactor(false);
                    setTwoFactorCode("");
                  }}
                  className="text-2xs font-semibold text-muted-foreground/70 hover:text-foreground"
                >
                  Skip
                </button>
              </label>
              <Input
                inputMode="numeric"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) =>
                  setTwoFactorCode(
                    e.target.value.replace(/\D/g, "").slice(0, 6)
                  )
                }
                placeholder="6-digit code from your authenticator"
                className="h-10 text-center font-mono text-md tracking-[0.35em]"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowTwoFactor(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-card/30 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-secondary/40 hover:text-foreground"
            >
              <ShieldCheck className="size-3.5" />
              Enter 2FA code
            </button>
          )}

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
            <button
              type="button"
              onClick={() =>
                toast.message("Recovery code stub", {
                  description:
                    "Use the printed 16-character recovery code from initial setup, or contact your administrator.",
                })
              }
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              <KeyRound className="size-3" />
              Use recovery code
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.08] px-3 py-2 text-sm text-sev-critical">
              <AlertCircle className="size-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="h-10 w-full gap-2 text-base"
            disabled={loading}
          >
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
            <p className="text-base font-bold text-foreground">
              Set up this appliance
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Activate license, configure the site, create the Super Admin.
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
