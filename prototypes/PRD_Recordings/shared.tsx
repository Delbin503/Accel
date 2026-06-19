import { AlertCircle, Film } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Dev-only forced states for the State Tester (prototype-only). */
export type ForcedState = "normal" | "loading" | "empty" | "error";

/** Skeleton that mirrors the Recordings layout: KPIs → date bar → card grid. */
export function RecordingsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* KPI cards (cols=4) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[120px] animate-pulse rounded-xl bg-muted" />
        ))}
      </div>

      {/* Date / filter bar */}
      <div className="flex items-center gap-2">
        <div className="h-9 flex-1 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-40 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Recording card grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="aspect-video w-full animate-pulse bg-muted" />
            <div className="space-y-2 p-3.5">
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-1/2 animate-pulse rounded bg-muted" />
              <div className="flex items-center justify-between border-t border-border/60 pt-2">
                <div className="h-4 w-16 animate-pulse rounded-full bg-muted" />
                <div className="h-3 w-12 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-sev-critical/30 bg-sev-critical/[0.05] py-16 text-muted-foreground">
      <AlertCircle className="size-8 text-sev-critical" />
      <p className="text-sm text-foreground">Couldn't load recordings.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
      <Film className="size-10 opacity-30" />
      <p className="text-sm font-medium text-foreground">No recordings found</p>
      <p className="text-[12px]">Recordings appear here once cameras with attached NVRs capture footage.</p>
    </div>
  );
}
