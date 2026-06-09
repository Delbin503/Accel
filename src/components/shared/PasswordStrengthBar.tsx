import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Returns 0–4 based on length and character class diversity. */
export function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}

/** A password is considered strong enough to proceed once it reaches "Good" (score ≥ 3). */
export function isStrongPassword(pw: string): boolean {
  return scorePassword(pw) >= 3;
}

const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"] as const;
const COLORS = [
  "bg-muted",
  "bg-sev-critical",
  "bg-warning",
  "bg-info",
  "bg-success",
] as const;

export function PasswordStrengthBar({
  password,
  className,
}: {
  password: string;
  className?: string;
}) {
  if (!password) return null;
  const score = scorePassword(password);
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < score ? COLORS[score] : "bg-muted/60"
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          "flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider",
          score >= 4
            ? "text-success"
            : score >= 3
              ? "text-info"
              : score >= 2
                ? "text-warning"
                : "text-muted-foreground"
        )}
      >
        {score >= 3 && <Check className="size-3 text-success" strokeWidth={3} />}
        {LABELS[score]}
      </p>
    </div>
  );
}
