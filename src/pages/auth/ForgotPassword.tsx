import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthLayout } from "./AuthLayout";
import { PasswordStrengthBar } from "@/components/shared/PasswordStrengthBar";
import { cn } from "@/lib/utils";

type Step = "email" | "code" | "reset" | "done";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = React.useState<Step>("email");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState<string[]>(["", "", "", "", "", ""]);
  const [newPw, setNewPw] = React.useState("");
  const [confirmPw, setConfirmPw] = React.useState("");
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sending, setSending] = React.useState(false);

  const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);

  function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.includes("@")) {
      setError("Enter a valid email.");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.message("Verification code sent", {
        description: `A 6-digit code was sent to ${email}. (Demo code: 123456)`,
      });
      setStep("code");
      setTimeout(() => inputRefs.current[0]?.focus(), 80);
    }, 400);
  }

  function setCodeAt(idx: number, val: string) {
    const clean = val.replace(/[^0-9]/g, "").slice(-1);
    const next = [...code];
    next[idx] = clean;
    setCode(next);
    if (clean && idx < 5) inputRefs.current[idx + 1]?.focus();
  }

  function handleCodeKey(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[idx] && idx > 0)
      inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowLeft" && idx > 0) inputRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) inputRefs.current[idx + 1]?.focus();
  }

  function handleCodePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, 6);
    if (pasted.length === 0) return;
    e.preventDefault();
    const next = [...code];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] ?? "";
    setCode(next);
    inputRefs.current[Math.min(5, pasted.length)]?.focus();
  }

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const joined = code.join("");
    if (joined.length < 6) {
      setError("Enter all six digits.");
      return;
    }
    setStep("reset");
  }

  function submitReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPw.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setError("Passwords don't match.");
      return;
    }
    setStep("done");
    toast.success("Password updated", {
      description: "You can now sign in with your new password.",
    });
    setTimeout(() => navigate("/signin", { replace: true }), 1400);
  }

  return (
    <AuthLayout>
      <div>
        {step !== "done" && (
          <button
            onClick={() => {
              if (step === "email") navigate("/signin");
              else if (step === "code") setStep("email");
              else if (step === "reset") setStep("code");
            }}
            className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </button>
        )}

        {step === "email" && (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Forgot password?
            </h1>
            <p className="mt-1 text-base text-muted-foreground">
              Enter the email associated with your Accel account. We'll send a
              6-digit verification code.
            </p>
            <form onSubmit={submitEmail} className="mt-6 space-y-3">
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
                    placeholder="you@company.com"
                    className="h-10 pl-9 text-base"
                  />
                </div>
              </div>
              {error && <ErrorBox message={error} />}
              <Button
                type="submit"
                disabled={sending}
                className="h-10 w-full gap-2 text-base"
              >
                {sending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Sending code…
                  </>
                ) : (
                  <>
                    <KeyRound className="size-3.5" /> Send verification code
                  </>
                )}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Remembered it?{" "}
              <Link
                to="/signin"
                className="font-semibold text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </>
        )}

        {step === "code" && (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Check your email
            </h1>
            <p className="mt-1 text-base text-muted-foreground">
              We sent a 6-digit code to{" "}
              <strong className="text-foreground">{email}</strong>. Enter it
              below to verify.
            </p>
            <form onSubmit={submitCode} className="mt-6 space-y-3">
              <div
                onPaste={handleCodePaste}
                className="flex items-center justify-between gap-2"
              >
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    value={digit}
                    onChange={(e) => setCodeAt(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKey(i, e)}
                    inputMode="numeric"
                    maxLength={1}
                    className={cn(
                      "h-12 w-12 rounded-md border border-input bg-background text-center font-mono text-2xl font-bold text-foreground outline-none transition-colors",
                      "focus:border-primary focus:ring-2 focus:ring-primary/30"
                    )}
                  />
                ))}
              </div>
              {error && <ErrorBox message={error} />}
              <Button
                type="submit"
                className="h-10 w-full gap-2 text-base"
              >
                Verify Code
              </Button>
              <button
                type="button"
                onClick={() =>
                  toast.message("Code re-sent", {
                    description: `A new code was sent to ${email}.`,
                  })
                }
                className="block w-full text-center text-sm text-muted-foreground hover:text-primary"
              >
                Didn't get it?{" "}
                <span className="font-semibold underline">Resend code</span>
              </button>
            </form>
          </>
        )}

        {step === "reset" && (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Create new password
            </h1>
            <p className="mt-1 text-base text-muted-foreground">
              Choose a strong password — at least 8 characters.
            </p>
            <form onSubmit={submitReset} className="mt-6 space-y-3">
              <div>
                <PasswordField
                  label="New password"
                  value={newPw}
                  onChange={setNewPw}
                  show={showNew}
                  onToggle={() => setShowNew((v) => !v)}
                  placeholder="Enter a new password"
                />
                <PasswordStrengthBar className="mt-1.5" password={newPw} />
              </div>
              <PasswordField
                label="Confirm new password"
                value={confirmPw}
                onChange={setConfirmPw}
                show={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
                placeholder="Re-type the new password"
              />
              {error && <ErrorBox message={error} />}
              <Button
                type="submit"
                className="h-10 w-full gap-2 text-base"
              >
                <Lock className="size-3.5" /> Update password
              </Button>
            </form>
          </>
        )}

        {step === "done" && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border-2 border-success/50 bg-success/10">
              <CheckCircle2 className="size-7 text-success" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Password updated
            </h1>
            <p className="mt-1 text-base text-muted-foreground">
              Redirecting you to sign in…
            </p>
          </div>
        )}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
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
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
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

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-sev-critical/30 bg-sev-critical/[0.08] px-3 py-2 text-sm text-sev-critical">
      <AlertCircle className="size-3.5 flex-shrink-0" />
      {message}
    </div>
  );
}
