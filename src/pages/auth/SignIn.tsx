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
          Welcome
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
