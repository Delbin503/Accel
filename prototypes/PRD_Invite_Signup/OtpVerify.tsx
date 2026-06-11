import * as React from "react";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AccelMark } from "./shared";

const LENGTH = 6;

export function OtpVerify({
  email,
  onVerified,
  onBack,
}: {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}) {
  const [digits, setDigits] = React.useState<string[]>(Array(LENGTH).fill(""));
  const [error, setError] = React.useState(false);
  const inputs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const code = digits.join("");
  const complete = code.length === LENGTH;

  function setAt(i: number, value: string) {
    setError(false);
    const next = [...digits];
    next[i] = value;
    setDigits(next);
  }

  function handleChange(i: number, raw: string) {
    const val = raw.replace(/\D/g, "");
    if (!val) {
      setAt(i, "");
      return;
    }
    // Support paste of the full code into any box.
    if (val.length > 1) {
      const chars = val.slice(0, LENGTH - i).split("");
      const next = [...digits];
      chars.forEach((c, k) => (next[i + k] = c));
      setDigits(next);
      setError(false);
      const last = Math.min(i + chars.length, LENGTH - 1);
      inputs.current[last]?.focus();
      return;
    }
    setAt(i, val);
    if (i < LENGTH - 1) inputs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!complete) return;
    // Prototype: any 6-digit code is accepted. "000000" demos the error state.
    if (code === "000000") {
      setError(true);
      return;
    }
    onVerified();
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col px-5 py-10">
      <header className="mb-8 flex flex-col items-center text-center">
        <AccelMark size="lg" />
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">Verify your email</h1>
        <p className="mt-1.5 text-md text-muted-foreground">
          We sent a 6-digit code to <strong className="text-foreground">{email}</strong>. Enter it below to confirm
          your account.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col items-center">
        <div className="flex items-center gap-2 sm:gap-3" onPaste={(e) => { e.preventDefault(); handleChange(0, e.clipboardData.getData("text")); }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              inputMode="numeric"
              maxLength={1}
              aria-label={`Digit ${i + 1}`}
              className={cn(
                "size-12 rounded-lg border bg-background text-center font-mono text-xl font-semibold text-foreground outline-none transition-colors focus:border-primary",
                error ? "border-sev-critical" : "border-input"
              )}
            />
          ))}
        </div>

        {error && (
          <p className="mt-3 flex items-center gap-1 text-2xs text-sev-critical">
            <CircleAlert className="size-3" /> That code isn't valid. Check your email and try again.
          </p>
        )}

        <Button type="submit" disabled={!complete} className="mt-7 w-full" size="lg">
          Verify &amp; continue
        </Button>

        <p className="mt-4 text-sm text-muted-foreground">
          Didn't get a code?{" "}
          <button type="button" className="font-medium text-primary underline hover:text-primary-hover">
            Resend
          </button>
        </p>

        <button
          type="button"
          onClick={onBack}
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to setup
        </button>
      </form>
    </div>
  );
}
