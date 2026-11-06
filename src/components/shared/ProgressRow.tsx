import * as React from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * Labelled progress bar for progress modals: what's done on the left, the
 * percentage on the right, a thin bar under them. Turns green at 100%.
 *
 * @example
 *   <ProgressRow progress={42} label="173 of 412 files" />
 */
export function ProgressRow({ progress, label }: { progress: number; label: React.ReactNode }) {
  const done = progress >= 100;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="min-w-0 truncate text-muted-foreground">{label}</span>
        <span className={cn("font-mono font-semibold tabular-nums", done ? "text-success" : "text-foreground")}>
          {progress}%
        </span>
      </div>
      <Progress
        value={progress}
        aria-label="Progress"
        className={cn("h-1.5 bg-muted", done && "[&_[data-slot=progress-indicator]]:bg-success")}
      />
    </div>
  );
}
