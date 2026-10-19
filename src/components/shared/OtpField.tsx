import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Six one-digit boxes for an emailed verification code — the same entry the
 * sign-in verify screen uses, sized for a modal. Typing advances, Backspace on
 * an empty box steps back, and pasting a whole code fills every box.
 *
 * Controlled: `value` is the digits entered so far ("", "48", "482913").
 */
export interface OtpFieldProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  invalid?: boolean;
  /** Labels the group for screen readers, e.g. "Verification code". */
  "aria-label"?: string;
  id?: string;
  className?: string;
}

function OtpField({
  value,
  onChange,
  length = 6,
  autoFocus,
  invalid,
  "aria-label": ariaLabel = "Verification code",
  id,
  className,
}: OtpFieldProps) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");
  // The value as last set from here. Focus moves to the next box before the
  // parent re-renders, so the focus guard below can't rely on `value` yet.
  const latest = React.useRef(value);
  React.useEffect(() => {
    latest.current = value;
  }, [value]);

  function emit(next: string) {
    latest.current = next;
    onChange(next);
  }

  function setAt(idx: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    // Built from `latest`, not `digits`, so fast typing doesn't drop a digit
    // entered before the parent re-rendered.
    const next = Array.from({ length }, (_, i) => latest.current[i] ?? "");
    next[idx] = digit;
    // Keep the value contiguous: a gap would make "48 913" read as complete.
    emit(next.join("").slice(0, length));
    if (digit && idx < length - 1) refs.current[idx + 1]?.focus();
  }

  function onKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) refs.current[idx - 1]?.focus();
  }

  function onPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    emit(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <div id={id} role="group" aria-label={ariaLabel} onPaste={onPaste} className={cn("flex items-center gap-2", className)}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          onChange={(e) => setAt(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          // Only the next empty box (or a filled one) takes a click, so the code
          // can't be entered out of order.
          onFocus={(e) => {
            const firstEmpty = latest.current.length;
            if (firstEmpty < length && i > firstEmpty) refs.current[firstEmpty]?.focus();
            else e.target.select();
          }}
          autoFocus={autoFocus && i === 0}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          className={cn(
            "h-11 w-10 rounded-md border border-input bg-transparent text-center font-mono text-xl font-bold text-foreground outline-none transition-colors dark:bg-input/30",
            "focus:border-primary focus:ring-2 focus:ring-primary/30",
            invalid && "border-destructive"
          )}
        />
      ))}
    </div>
  );
}

export { OtpField };
