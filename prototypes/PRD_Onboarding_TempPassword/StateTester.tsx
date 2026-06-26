import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TempPwStep } from "./TempPasswordFlow";

/* ──────────────────────────────────────────────────────────────────────────
   PROTOTYPE-ONLY. Jumps to any step in the temp-password first-login flow.
   Not promoted to src.
   ────────────────────────────────────────────────────────────────────────── */

const STEPS: { key: TempPwStep; label: string }[] = [
  { key: "setup", label: "Set up" },
  { key: "2fa", label: "2FA" },
  { key: "newpw", label: "New password" },
  { key: "done", label: "Dashboard" },
];

export function StateTester({
  step,
  onStep,
}: {
  step: TempPwStep;
  onStep: (s: TempPwStep) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-warning/50 bg-warning/[0.06] px-2.5 py-1.5">
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-warning">
        <FlaskConical className="size-3" />
        Step
      </span>
      <div className="flex flex-wrap items-center gap-1">
        {STEPS.map((o) => (
          <button
            key={o.key}
            onClick={() => onStep(o.key)}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-semibold transition-colors",
              step === o.key
                ? "bg-warning/20 text-warning"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
