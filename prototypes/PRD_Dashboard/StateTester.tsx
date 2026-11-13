import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import type { ForcedState, HealthMode, ScaleMode } from "./states";

/* PROTOTYPE-ONLY. Forces the view state + System Health for testing. Not promoted to src. */

const STATE_OPTIONS: { key: ForcedState; label: string }[] = [
  { key: "normal", label: "Populated" },
  { key: "loading", label: "Loading" },
  { key: "empty", label: "Empty" },
  { key: "error", label: "Error" },
];

const HEALTH_OPTIONS: { key: HealthMode; label: string }[] = [
  { key: "healthy", label: "Healthy" },
  { key: "degraded", label: "Degraded" },
  { key: "critical", label: "Critical" },
];

const SCALE_OPTIONS: { key: ScaleMode; label: string }[] = [
  { key: "normal", label: "3 sites" },
  { key: "many", label: "20 sites" },
];

export function StateTester({
  value,
  onChange,
  health,
  onHealthChange,
  scale,
  onScaleChange,
}: {
  value: ForcedState;
  onChange: (s: ForcedState) => void;
  health: HealthMode;
  onHealthChange: (h: HealthMode) => void;
  scale: ScaleMode;
  onScaleChange: (s: ScaleMode) => void;
}) {
  // The Health/Scale overrides only apply when the page actually renders (Populated / Empty).
  const healthDisabled = value === "loading" || value === "error";
  const scaleDisabled = value === "loading" || value === "error";
  return (
    <div data-slot="dashboard-state-tester" className="flex flex-col gap-1.5 rounded-lg border border-dashed border-warning/50 bg-warning/[0.06] px-2.5 py-1.5">
      <div className="flex items-center gap-2">
        <span className="inline-flex w-14 items-center gap-1 text-2xs font-bold uppercase tracking-wider text-warning">
          <FlaskConical className="size-3" />
          State
        </span>
        <SegmentedControl
          data-slot="dashboard-state-tester-options"
          type="single"
          size="sm"
          value={value}
          onValueChange={(next) => next && onChange(next as typeof value)}
          className="flex items-center gap-1 rounded-none bg-transparent p-0"
        >
          {STATE_OPTIONS.map((o) => (
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
      <div className={cn("flex items-center gap-2", healthDisabled && "pointer-events-none opacity-40")}>
        <span className="w-14 text-2xs font-bold uppercase tracking-wider text-muted-foreground">Health</span>
        <SegmentedControl
          data-slot="dashboard-state-tester-options"
          type="single"
          size="sm"
          value={health}
          onValueChange={(next) => next && onHealthChange(next as typeof health)}
          className="flex items-center gap-1 rounded-none bg-transparent p-0"
        >
          {HEALTH_OPTIONS.map((o) => (
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
      <div className={cn("flex items-center gap-2", scaleDisabled && "pointer-events-none opacity-40")}>
        <span className="w-14 text-2xs font-bold uppercase tracking-wider text-muted-foreground">Sites</span>
        <SegmentedControl
          data-slot="dashboard-state-tester-options"
          type="single"
          size="sm"
          value={scale}
          onValueChange={(next) => next && onScaleChange(next as typeof scale)}
          className="flex items-center gap-1 rounded-none bg-transparent p-0"
        >
          {SCALE_OPTIONS.map((o) => (
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
