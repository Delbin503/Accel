import * as React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "./AuthLayout";
import { DeploymentModeSwitcher } from "@/components/shared/DeploymentModeSwitcher";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

export default function SignInPage() {
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
      const initials = email.split("@")[0].slice(0, 2).toUpperCase();
      const local = email.split("@")[0].replace(/[._-]+/g, " ").trim();
      const displayName = local
        .split(" ")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");
      const firstName = displayName.split(" ")[0] || displayName;
      signIn({
        id: "usr-" + Math.random().toString(36).slice(2, 6),
        name: displayName || email,
        initials,
        role: "admin",
        email,
        notificationCount: 0,
        orgName: "My Workspace",
      });
      toast.success(`Welcome back, ${firstName}! 👋`, {
        description: "Loading your Accel workspace…",
      });
      navigate(redirectTo, { replace: true });
    }, 250);
  }

  return (
    <AuthLayout>
      <div>
        <DeploymentModeSwitcher />
        <h1 className="text-[24px] font-bold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Sign in to your Accel workspace to continue.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                placeholder="you@company.com"
                className="h-10 pl-9 text-[13px]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                className="h-10 px-9 text-[13px]"
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

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="size-3.5 accent-primary"
              />
              Keep me signed in
            </label>
            <Link
              to="/forgot-password"
              className="text-[12px] font-semibold text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.08] px-3 py-2 text-[12px] text-sev-critical">
              <AlertCircle className="size-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="h-10 w-full gap-2 text-[13px]"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Signing in…
              </>
            ) : (
              <>
                <LogIn className="size-3.5" /> Sign In
              </>
            )}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          OR CONTINUE WITH
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-10 gap-2 text-[12px]"
            onClick={() =>
              toast.message("SSO sign-in stub", {
                description: "Google SSO would launch here.",
              })
            }
          >
            <GoogleMark /> Google
          </Button>
          <Button
            variant="outline"
            className="h-10 gap-2 text-[12px]"
            onClick={() =>
              toast.message("SSO sign-in stub", {
                description: "Microsoft SSO would launch here.",
              })
            }
          >
            <MicrosoftMark /> Microsoft
          </Button>
        </div>

        <p className="mt-6 text-center text-[12px] text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className={cn("font-semibold text-primary hover:underline")}
          >
            Create one
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.1A6.61 6.61 0 0 1 5.5 12c0-.73.12-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function MicrosoftMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <rect x="2" y="2" width="9" height="9" fill="#F25022" />
      <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
      <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
      <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
