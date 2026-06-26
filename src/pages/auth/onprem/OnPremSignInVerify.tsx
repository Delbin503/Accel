import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, AlertCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "../AuthLayout";
import { useAuthStore } from "@/stores/useAuthStore";
import { cn } from "@/lib/utils";

/**
 * On-Premise sign-in 2FA step.
 *
 * Reached after the on-prem sign-in form. The actual session is established
 * here, once the 6-digit code is verified.
 */
export default function OnPremSignInVerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const signIn = useAuthStore((s) => s.signIn);

  const state = (location.state as { email?: string; from?: string } | null) ?? {};
  const email = state.email ?? "you@account.local";
  const from = state.from ?? "/";

  const [otp, setOtp] = React.useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = React.useState<string | null>(null);
  const [trustDevice, setTrustDevice] = React.useState(false);
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  function setAt(idx: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });
    if (digit && idx < 5) refs.current[idx + 1]?.focus();
  }

  function onKey(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) refs.current[idx - 1]?.focus();
  }

  function onPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
    if (digits.length) {
      setOtp((prev) => prev.map((d, i) => digits[i] ?? d));
      refs.current[Math.min(digits.length, 5)]?.focus();
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (otp.join("").length < 6) {
      setError("Enter the full 6-digit code.");
      return;
    }
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
    navigate(from, { replace: true });
  }

  return (
    <AuthLayout hideBrand>
      <div>
        <button
          type="button"
          onClick={() => navigate("/on-premise/signin")}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </button>

        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-secondary shadow-lg shadow-secondary/25">
            <Play className="size-7 fill-white text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Verify your email</h1>
          <p className="mt-2 text-base text-muted-foreground">
            We sent a 6-digit code to <strong className="text-foreground">{email}</strong>.
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div onPaste={onPaste} className="flex items-center justify-center gap-2">
            {otp.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                value={d}
                onChange={(e) => setAt(i, e.target.value)}
                onKeyDown={(e) => onKey(i, e)}
                inputMode="numeric"
                maxLength={1}
                className={cn(
                  "h-12 w-11 rounded-md border border-input bg-background text-center font-mono text-2xl font-bold text-foreground outline-none transition-colors",
                  "focus:border-primary focus:ring-2 focus:ring-primary/30"
                )}
              />
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.08] px-3 py-2 text-sm text-sev-critical">
              <AlertCircle className="size-3.5 flex-shrink-0" />
              {error}
            </div>
          )}

          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="mt-0.5 size-3.5 accent-primary"
            />
            Don't ask for a verification code again on this device for 14 days.
          </label>

          <Button type="submit" className="h-10 w-full gap-2 text-base">
            Verify &amp; Continue <ArrowRight className="size-3.5" />
          </Button>

          <button
            type="button"
            onClick={() =>
              toast.message("Code re-sent", { description: `A new code was sent to ${email}.` })
            }
            className="block w-full text-center text-sm text-muted-foreground hover:text-primary"
          >
            Didn't get it? <span className="font-semibold underline">Resend code</span>
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
