import { FlaskConical } from "lucide-react";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import type { ForcedState } from "./shared";

/* ──────────────────────────────────────────────────────────────────────────
   PROTOTYPE-ONLY. Forces the view into each state for testing.
   Do NOT promote to src/ — see README "Promoting to src".
   ────────────────────────────────────────────────────────────────────────── */

const OPTIONS: { key: ForcedState; label: string }[] = [
  { key: "normal", label: "Populated" },
  { key: "loading", label: "Loading" },
  { key: "empty", label: "Empty" },
  { key: "noresults", label: "No results" },
  { key: "error", label: "Error" },
];

export function StateTester({ value, onChange }: { value: ForcedState; onChange: (s: ForcedState) => void }) {
  return (
    <div data-slot="model-management-state-tester" className="flex items-center gap-2 rounded-lg border border-dashed border-warning/50 bg-warning/[0.06] px-2.5 py-1.5">
      <span className="inline-flex items-center gap-1 text-2xs font-bold uppercase tracking-wider text-warning">
        <FlaskConical className="size-3" />
        Dev · State
      </span>
      <SegmentedControl
        data-slot="model-management-state-tester-options"
        type="single"
        size="sm"
        value={value}
        onValueChange={(next) => next && onChange(next as typeof value)}
        className="flex items-center gap-1 rounded-none bg-transparent p-0"
      >
        {OPTIONS.map((o) => (
          <SegmentedControlItem
            key={o.key}
            value={o.key}
            className="h-auto rounded-md px-2 py-1 font-semibold transition-colors text-muted-foreground hover:bg-muted hover:text-foreground data-[state=on]:bg-warning/20 data-[state=on]:text-warning data-[state=on]:shadow-none"
          >
            {o.label}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    </div>
  );
}
