import * as React from "react";
import { toast } from "sonner";
import {
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  ArrowLeft,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthLayout } from "@/pages/auth/AuthLayout";
import { DepartmentSelect } from "@/components/shared/DepartmentSelect";
import { PasswordStrengthBar } from "@/components/shared/PasswordStrengthBar";
import { cn } from "@/lib/utils";

export type TempPwStep = "setup" | "2fa" | "newpw" | "done";

const MOCK_EMAIL = "alex.tan@account.local";

/**
 * First-time sign-in for an on-premise member issued a Temporary Password.
 *
 *   Set up account  →  Two-factor verification  →  Create new password  →  Dashboard
 *
 * Reuses the visual structure of the invite "Set up your account" page,
 * SignInVerify, and the OnPremForgotPassword "create new password" step. Inline
 * field errors follow the project pattern (aria-invalid + <p className="mt-1 text-xs text-sev-critical">).
 */
export function TempPasswordFlow({
  step,
  onStep,
}: {
  step: TempPwStep;
  onStep: (s: TempPwStep) => void;
}) {
  switch (step) {
    case "setup":
      return <SetupStep onNext={() => onStep("2fa")} />;
    case "2fa":
      return <TwoFactorStep onNext={() => onStep("newpw")} onBack={() => onStep("setup")} />;
    case "newpw":
      return <NewPasswordStep onDone={() => onStep("done")} onBack={() => onStep("2fa")} />;
    case "done":
      return <DoneStep />;
  }
}

/* ── Step 1 · Set up your account (profile details) ─────────────────────── */

const DIAL_CODES = ["+65", "+60", "+62", "+66", "+63", "+84", "+44", "+1"];

function SetupStep({ onNext }: { onNext: () => void }) {
  const [fullName, setFullName] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [dialCode, setDialCode] = React.useState("+65");
  const [phone, setPhone] = React.useState("");
  const [departments, setDepartments] = React.useState<string[]>([]);
  const [agree, setAgree] = React.useState(false);
  const [errors, setErrors] = React.useState<{ fullName?: string; agree?: string }>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: { fullName?: string; agree?: string } = {};
    if (!fullName.trim()) next.fullName = "Enter your full name.";
    if (!agree) next.agree = "Please accept the Terms to continue.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onNext();
  }

  return (
    <AuthLayout hideBrand>
      <div>
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-secondary shadow-lg shadow-secondary/25">
            <KeyRound className="size-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Set up your account</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Complete your profile to finish setting up your account.
          </p>
        </div>

        {/* Account context */}
        <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-border bg-card/40 px-3 py-2.5">
          <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-sm font-semibold text-primary">
            AT
          </div>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-base font-semibold text-foreground">{MOCK_EMAIL}</span>
            <p className="text-xs text-muted-foreground">Signing in with a temporary password</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Full name
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setErrors((p) => ({ ...p, fullName: undefined }));
                }}
                placeholder="e.g. Delbin Arkar"
                aria-invalid={!!errors.fullName}
                className="h-10 pl-9 text-base"
              />
            </div>
            {errors.fullName && <p className="mt-1 text-xs text-sev-critical">{errors.fullName}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Display name (Optional)
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Delbin (shown to teammates)"
                className="h-10 pl-9 text-base"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Phone (Optional)
            </label>
            <div className="flex h-10 w-full items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:border-primary">
              <Select value={dialCode} onValueChange={setDialCode}>
                <SelectTrigger className="h-full w-auto gap-1 rounded-none border-0 border-r border-input bg-transparent px-3 font-mono text-base">
                  <Phone className="size-3.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIAL_CODES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9123 4567"
                inputMode="tel"
                className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Department (Optional)
            </label>
            <DepartmentSelect value={departments} onChange={setDepartments} placeholder="Select departments" />
          </div>

          <div>
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => {
                  setAgree(e.target.checked);
                  setErrors((p) => ({ ...p, agree: undefined }));
                }}
                className="mt-0.5 size-3.5 accent-primary"
              />
              <span>
                I agree to the <span className="font-semibold text-primary underline">Terms of Service</span> and{" "}
                <span className="font-semibold text-primary underline">Privacy Policy</span>.
              </span>
            </label>
            {errors.agree && <p className="mt-1 text-xs text-sev-critical">{errors.agree}</p>}
          </div>

          <Button type="submit" className="mt-2 h-10 w-full gap-2 text-base">
            Continue <ArrowRight className="size-3.5" />
          </Button>
        </form>

        <p className="mt-6 text-center font-mono text-2xs text-muted-foreground/60">
          Build 4.7.2-onprem · Air-gapped · No telemetry
        </p>
      </div>
    </AuthLayout>
  );
}

/* ── Step 2 · Two-factor verification ───────────────────────────────────── */

function TwoFactorStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [otp, setOtp] = React.useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = React.useState<string | null>(null);
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  function setAt(idx: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    setError(null);
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
      setError(null);
      setOtp((prev) => prev.map((d, i) => digits[i] ?? d));
      refs.current[Math.min(digits.length, 5)]?.focus();
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (otp.join("").length < 6) {
      setError("Enter the full 6-digit code.");
      return;
    }
    onNext();
  }

  return (
    <AuthLayout hideBrand>
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Two-factor verification</h1>
        <p className="mt-2 text-base text-muted-foreground">
          We sent a 6-digit code to <strong className="text-foreground">{MOCK_EMAIL}</strong>.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
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
                aria-label={`Digit ${i + 1}`}
                aria-invalid={!!error}
                className={cn(
                  "h-12 w-11 rounded-md border bg-background text-center font-mono text-2xl font-bold text-foreground outline-none transition-colors",
                  "focus:border-primary focus:ring-2 focus:ring-primary/30",
                  error ? "border-sev-critical" : "border-input"
                )}
              />
            ))}
          </div>

          {error && <p className="text-center text-xs text-sev-critical">{error}</p>}

          <Button type="submit" className="h-10 w-full gap-2 text-base">
            Verify &amp; Continue <ArrowRight className="size-3.5" />
          </Button>

          <button
            type="button"
            onClick={() =>
              toast.message("Code re-sent", { description: `A new code was sent to ${MOCK_EMAIL}.` })
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

/* ── Step 3 · Create a new password ─────────────────────────────────────── */

function NewPasswordStep({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [newPw, setNewPw] = React.useState("");
  const [confirmPw, setConfirmPw] = React.useState("");
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [errors, setErrors] = React.useState<{ newPw?: string; confirmPw?: string }>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: { newPw?: string; confirmPw?: string } = {};
    if (newPw.length < 8) next.newPw = "Password must be at least 8 characters.";
    if (confirmPw !== newPw) next.confirmPw = "Passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    toast.success("Password set", {
      description: "Your temporary password has been replaced.",
    });
    onDone();
  }

  return (
    <AuthLayout hideBrand>
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Create a new password</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Replace your temporary password — use at least 8 characters.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <div>
            <PasswordField
              label="New password"
              value={newPw}
              onChange={(v) => {
                setNewPw(v);
                setErrors((p) => ({ ...p, newPw: undefined }));
              }}
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
              placeholder="Enter a new password"
              invalid={!!errors.newPw}
            />
            <PasswordStrengthBar className="mt-1.5" password={newPw} />
            {errors.newPw && <p className="mt-1 text-xs text-sev-critical">{errors.newPw}</p>}
          </div>

          <div>
            <PasswordField
              label="Confirm new password"
              value={confirmPw}
              onChange={(v) => {
                setConfirmPw(v);
                setErrors((p) => ({ ...p, confirmPw: undefined }));
              }}
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              placeholder="Re-type the new password"
              invalid={!!errors.confirmPw}
            />
            {errors.confirmPw && <p className="mt-1 text-xs text-sev-critical">{errors.confirmPw}</p>}
          </div>

          <Button type="submit" className="mt-2 h-10 w-full gap-2 text-base">
            <Lock className="size-3.5" /> Set password &amp; continue
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  invalid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  invalid?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={invalid}
          className="h-10 px-9 text-base"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      </div>
    </div>
  );
}

/* ── Step 4 · Done — redirecting to the dashboard ───────────────────────── */

function DoneStep() {
  return (
    <AuthLayout hideBrand>
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border-2 border-success/50 bg-success/10">
          <CheckCircle2 className="size-7 text-success" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">You're all set</h1>
        <p className="mt-2 text-base text-muted-foreground">Redirecting to dashboard…</p>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading your workspace
        </div>
      </div>
    </AuthLayout>
  );
}
