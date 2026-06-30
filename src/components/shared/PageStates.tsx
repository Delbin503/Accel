import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiGrid } from "@/components/shared/KpiCard";
import { cn } from "@/lib/utils";

/**
 * Shared loading / error views for list pages (KPI grid + filter bar + table).
 * Used by data-driven pages so loading / empty / error all render inside the
 * real page chrome instead of replacing the whole screen.
 */

export function ListLoadingState({
  kpiCols = 4,
  columns = 6,
  rows = 6,
}: {
  kpiCols?: 3 | 4 | 5 | 6;
  columns?: number;
  rows?: number;
}) {
  return (
    <>
      <KpiGrid cols={kpiCols}>
        {Array.from({ length: kpiCols }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
        ))}
      </KpiGrid>
      <Skeleton className="h-11 w-full rounded-lg" />
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border bg-muted/30 px-4 py-3">
          <Skeleton className="h-3 w-40" />
        </div>
        <div className="divide-y divide-border/60">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              {Array.from({ length: columns }).map((__, j) => (
                <Skeleton key={j} className={cn("h-4", j === 1 ? "flex-[2]" : "flex-1")} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export function ListErrorState({
  onRetry,
  title = "Couldn't load data",
  message = "Something went wrong while loading this view. Please try again.",
}: {
  onRetry?: () => void;
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-sev-critical/30 bg-sev-critical/[0.04] py-20 text-center">
      <CircleAlert className="size-10 text-sev-critical/70" />
      <div>
        <p className="text-md font-semibold text-foreground">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
