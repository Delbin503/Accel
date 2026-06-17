import { AlertCircle, MapPinned, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Dev-only forced states for the State Tester (prototype-only). */
export type ForcedState = "normal" | "loading" | "empty" | "error";

/** Skeleton that mirrors the Site Management layout: KPIs → toolbar → table. */
export function SiteTableSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* KPI cards (cols=4) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[120px] animate-pulse rounded-xl bg-muted" />
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="h-9 flex-1 animate-pulse rounded-lg bg-muted" />
        <div className="h-9 w-28 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="h-10 border-b border-border bg-muted/30" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="h-3 flex-1 animate-pulse rounded bg-muted" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
            <div className="hidden h-3 w-12 animate-pulse rounded bg-muted sm:block" />
            <div className="hidden h-3 w-12 animate-pulse rounded bg-muted sm:block" />
            <div className="h-3 w-10 animate-pulse rounded bg-muted" />
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
      <p className="text-sm text-foreground">Couldn't load sites.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
    </div>
  );
}

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
      <MapPinned className="size-10 opacity-30" />
      <p className="text-sm font-medium text-foreground">No sites yet</p>
      <p className="text-[12px]">Add a site to upload floor plans, draw areas, and place cameras.</p>
      <Button size="sm" onClick={onAdd} className="mt-1 gap-1.5">
        <Plus className="size-4" /> Add Site
      </Button>
    </div>
  );
}
