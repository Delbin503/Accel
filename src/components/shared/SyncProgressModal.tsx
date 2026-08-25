import * as React from "react";
import { CheckCircle2, CircleDot, LoaderCircle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Canonical "device is syncing" progress modal. Replaces the two hand-rolled
 * sync modals (NVR devices + Cameras) so both stay on the same panel layout
 * the rest of the app's dialogs use: bordered sections, eyebrow labels and a
 * single right-aligned footer action.
 *
 * Progress is simulated here — the caller owns when the sync actually settles.
 */
export interface SyncProgressModalProps {
  /** Dialog copy, e.g. "Syncing NVR…". */
  title: string;
  /** Device the sync targets, shown under the title and next to the ring. */
  deviceLabel: string;
  /** Ordered stage labels stepped through as progress advances. */
  stages: string[];
  onCancel: () => void;
  /** Footer button copy. */
  cancelLabel?: string;
}

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function SyncProgressModal({
  title, deviceLabel, stages, onCancel, cancelLabel = "Cancel Sync",
}: SyncProgressModalProps) {
  const [progress, setProgress] = React.useState(0);

  // Mounted only while a sync is running, so progress always starts at 0.
  React.useEffect(() => {
    let pct = 0;
    const interval = setInterval(() => {
      pct += 5 + Math.random() * 9;
      if (pct >= 100) pct = 100;
      setProgress(Math.round(pct));
      if (pct >= 100) clearInterval(interval);
    }, 240);
    return () => clearInterval(interval);
  }, []);

  const done = progress >= 100;
  const stageIndex = Math.min(stages.length - 1, Math.floor((progress / 100) * stages.length));

  return (
    <Dialog open onOpenChange={() => { /* not dismissible while syncing */ }}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[85vh] w-[560px] max-w-[95vw] p-0"
      >
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">{title}</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {done ? "Sync complete — applying changes…" : "Keep this window open until the sync finishes."}
          </p>
        </DialogHeader>

        <div className="space-y-3 px-5 py-4">
          {/* Progress */}
          <div className="rounded-lg border border-border bg-background p-3.5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sync Progress
            </p>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
                  <circle cx="40" cy="40" r={RADIUS} fill="none" stroke="currentColor" strokeWidth="7" className="text-muted" />
                  <circle
                    cx="40" cy="40" r={RADIUS}
                    fill="none"
                    stroke={done ? "var(--color-success)" : "var(--primary)"}
                    strokeWidth="7"
                    strokeDasharray={`${(progress / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                    strokeLinecap="round"
                    className="transition-all duration-200"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-xl font-bold text-foreground">{progress}%</p>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-md font-semibold text-foreground">{deviceLabel}</p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {done ? "All steps complete" : stages[stageIndex]}
                </p>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full transition-all duration-200", done ? "bg-success" : "bg-primary")}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="rounded-lg border border-border bg-background p-3.5">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Steps
            </p>
            <ul className="space-y-2">
              {stages.map((stage, i) => {
                const stageDone = done || i < stageIndex;
                const active = !done && i === stageIndex;
                return (
                  <li key={stage} className="flex items-center gap-2">
                    {stageDone ? (
                      <CheckCircle2 className="size-3.5 shrink-0 text-success" />
                    ) : active ? (
                      <LoaderCircle className="size-3.5 shrink-0 animate-spin text-primary" />
                    ) : (
                      <CircleDot className="size-3.5 shrink-0 text-muted-foreground/40" />
                    )}
                    <span
                      className={cn(
                        "truncate text-sm",
                        active ? "font-semibold text-foreground"
                          : stageDone ? "text-muted-foreground"
                          : "text-muted-foreground/50",
                      )}
                    >
                      {stage}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="flex justify-end border-t border-border px-5 py-3.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10"
          >
            <X className="size-3.5" />
            {cancelLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
