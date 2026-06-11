import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ForcedState } from "./shared";

/* ──────────────────────────────────────────────────────────────────────────
   PROTOTYPE-ONLY. This control forces the view into each state for testing.
   It must NOT be promoted to src/ — see README "Promoting to src".
   ────────────────────────────────────────────────────────────────────────── */

const OPTIONS: { key: ForcedState; label: string }[] = [
  { key: "normal", label: "Populated" },
  { key: "loading", label: "Loading" },
  { key: "empty", label: "Empty" },
  { key: "error", label: "Error" },
];

export function StateTester({ value, onChange }: { value: ForcedState; onChange: (s: ForcedState) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-warning/50 bg-warning/[0.06] px-2.5 py-1.5">
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-warning">
        <FlaskConical className="size-3" />
        Dev · State
      </span>
      <div className="flex items-center gap-1">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-semibold transition-colors",
              value === o.key
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
