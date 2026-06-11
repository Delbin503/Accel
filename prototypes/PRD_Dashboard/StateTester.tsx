import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
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
    <div className="flex flex-col gap-1.5 rounded-lg border border-dashed border-warning/50 bg-warning/[0.06] px-2.5 py-1.5">
      <div className="flex items-center gap-2">
        <span className="inline-flex w-14 items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-warning">
          <FlaskConical className="size-3" />
          State
        </span>
        <div className="flex items-center gap-1">
          {STATE_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => onChange(o.key)}
              className={cn(
                "rounded-md px-2 py-1 text-[11px] font-semibold transition-colors",
                value === o.key ? "bg-warning/20 text-warning" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className={cn("flex items-center gap-2", healthDisabled && "pointer-events-none opacity-40")}>
        <span className="w-14 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Health</span>
        <div className="flex items-center gap-1">
          {HEALTH_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => onHealthChange(o.key)}
              className={cn(
                "rounded-md px-2 py-1 text-[11px] font-semibold transition-colors",
                health === o.key ? "bg-warning/20 text-warning" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className={cn("flex items-center gap-2", scaleDisabled && "pointer-events-none opacity-40")}>
        <span className="w-14 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sites</span>
        <div className="flex items-center gap-1">
          {SCALE_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => onScaleChange(o.key)}
              className={cn(
                "rounded-md px-2 py-1 text-[11px] font-semibold transition-colors",
                scale === o.key ? "bg-warning/20 text-warning" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
