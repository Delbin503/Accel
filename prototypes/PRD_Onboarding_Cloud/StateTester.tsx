import { FlaskConical } from "lucide-react";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import { CLOUD_SCREENS, type CloudScreen, type AsyncMode } from "./shared";

/* ──────────────────────────────────────────────────────────────────────────
   PROTOTYPE-ONLY. Jumps to any screen in the Cloud onboarding flow and injects
   async (loading / error) previews. Not promoted to src.
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
  screen: CloudScreen | null;
  onScreen: (s: CloudScreen) => void;
  async: AsyncMode;
  onAsync: (a: AsyncMode) => void;
}) {
  return (
    <div data-slot="onboarding-cloud-state-tester" className="flex flex-col gap-1.5 rounded-lg border border-dashed border-warning/50 bg-warning/[0.06] px-2.5 py-1.5">
      <div className="flex items-center gap-2">
        <span className="inline-flex w-12 items-center gap-1 text-2xs font-bold uppercase tracking-wider text-warning">
          <FlaskConical className="size-3" />
          Screen
        </span>
        <SegmentedControl
          type="single"
          size="sm"
          value={asyncMode === "idle" && screen ? screen : ""}
          onValueChange={(next) => next && onScreen(next as NonNullable<typeof screen>)}
          className="flex flex-wrap items-center gap-1 rounded-none bg-transparent p-0"
        >
          {CLOUD_SCREENS.map((o) => (
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
        <span className="w-12 text-2xs font-bold uppercase tracking-wider text-muted-foreground">Async</span>
        <SegmentedControl
          data-slot="onboarding-cloud-state-tester-options"
          type="single"
          size="sm"
          value={asyncMode}
          onValueChange={(next) => next && onAsync(next as typeof asyncMode)}
          className="flex items-center gap-1 rounded-none bg-transparent p-0"
        >
          {ASYNC_OPTIONS.map((o) => (
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
