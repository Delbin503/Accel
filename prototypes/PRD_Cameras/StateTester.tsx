import { FlaskConical } from "lucide-react";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import type { ForcedState, DrawerAsync } from "./shared";

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

const DRAWER_OPTIONS: { key: DrawerAsync; label: string }[] = [
  { key: "idle", label: "Live" },
  { key: "loading", label: "Loading" },
  { key: "error", label: "Error" },
];

export function StateTester({
  value,
  onChange,
  drawer,
  onDrawer,
}: {
  value: ForcedState;
  onChange: (s: ForcedState) => void;
  drawer: DrawerAsync;
  onDrawer: (d: DrawerAsync) => void;
}) {
  return (
    <div data-slot="cameras-state-tester" className="flex flex-col gap-1.5 rounded-lg border border-dashed border-warning/50 bg-warning/[0.06] px-2.5 py-1.5">
      <div className="flex items-center gap-2">
        <span className="inline-flex w-14 items-center gap-1 text-2xs font-bold uppercase tracking-wider text-warning">
          <FlaskConical className="size-3" />
          Page
        </span>
        <SegmentedControl
          data-slot="cameras-state-tester-options"
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
      <div className="flex items-center gap-2">
        <span className="w-14 text-2xs font-bold uppercase tracking-wider text-muted-foreground">Drawer</span>
        <SegmentedControl
          data-slot="cameras-state-tester-options"
          type="single"
          size="sm"
          value={drawer}
          onValueChange={(next) => next && onDrawer(next as typeof drawer)}
          className="flex items-center gap-1 rounded-none bg-transparent p-0"
        >
          {DRAWER_OPTIONS.map((o) => (
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
    </div>
  );
}
