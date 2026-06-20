import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import { ONPREM_SCREENS, type OnPremScreen, type AsyncMode } from "./shared";

/* ──────────────────────────────────────────────────────────────────────────
   PROTOTYPE-ONLY. Jumps to any screen in the On-Premise onboarding flow and
   injects async (loading / error) previews. Not promoted to src.
   ────────────────────────────────────────────────────────────────────────── */

const ASYNC_OPTIONS: { key: AsyncMode; label: string }[] = [
  { key: "idle", label: "Live" },
  { key: "loading", label: "Loading" },
  { key: "error", label: "Error" },
];

export function StateTester({
  screen,
  onScreen,
  async: asyncMode,
  onAsync,
}: {
  screen: OnPremScreen | null;
  onScreen: (s: OnPremScreen) => void;
  async: AsyncMode;
  onAsync: (a: AsyncMode) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-dashed border-warning/50 bg-warning/[0.06] px-2.5 py-1.5">
      <div className="flex items-center gap-2">
        <span className="inline-flex w-12 items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-warning">
          <FlaskConical className="size-3" />
          Screen
        </span>
        <div className="flex flex-wrap items-center gap-1">
          {ONPREM_SCREENS.map((o) => (
            <button
              key={o.key}
              onClick={() => onScreen(o.key)}
              className={cn(
                "rounded-md px-2 py-1 text-[11px] font-semibold transition-colors",
                screen === o.key && asyncMode === "idle"
                  ? "bg-warning/20 text-warning"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-12 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Async</span>
        <div className="flex items-center gap-1">
          {ASYNC_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => onAsync(o.key)}
              className={cn(
                "rounded-md px-2 py-1 text-[11px] font-semibold transition-colors",
                asyncMode === o.key ? "bg-warning/20 text-warning" : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
