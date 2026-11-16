import { Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { scorePassword } from "./password-strength";

// scorePassword / isStrongPassword live in ./password-strength.ts so this file
// only exports components (React Fast Refresh).
// eslint-disable-next-line react-refresh/only-export-components -- kept only for the frozen src/pages/dev/modals/legacy copy, which still imports it from here and is off-limits
export { isStrongPassword } from "./password-strength";

const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"] as const;
const COLORS = [
  "bg-muted",
  "bg-severity-critical",
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
    <div data-slot="password-strength-bar" className={cn("space-y-1", className)}>
      <div data-slot="password-strength-bar-segments" className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            data-slot="password-strength-bar-segment"
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i < score ? COLORS[score] : "bg-muted/60"
            )}
          />
        ))}
      </div>
      <p
        data-slot="password-strength-bar-label"
        className={cn(
          "flex items-center gap-1 text-2xs font-semibold uppercase tracking-wider",
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
