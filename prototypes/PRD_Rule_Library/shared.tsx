import { AlertCircle, ScrollText, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Dev-only forced states for the State Tester (prototype-only). */
export type ForcedState = "normal" | "loading" | "empty" | "noresults" | "error";

/** Skeleton mirroring the Rule Library table (filter bar + header + rows). */
export function RuleSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
        <div className="flex-1" />
        <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
      </div>
      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-2.5">
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0">
            <div className="h-3 w-16 shrink-0 animate-pulse rounded bg-muted" />
            <div className="w-40 shrink-0 space-y-1.5">
              <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
              <div className="h-3 w-16 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="hidden w-44 shrink-0 animate-pulse rounded bg-muted h-3 sm:block" />
            <div className="hidden flex-1 gap-1.5 md:flex">
              <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
              <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="h-3 w-24 shrink-0 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-sev-critical/30 bg-sev-critical/[0.05] py-20 text-muted-foreground">
      <AlertCircle className="size-8 text-sev-critical" />
      <p className="text-sm text-foreground">Couldn't load detection rules.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
    </div>
  );
}

export function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-24 text-muted-foreground">
      <ScrollText className="size-10 opacity-30" />
      <p className="text-sm font-medium text-foreground">No rules yet</p>
      <p className="text-[12px]">Create your first detection rule, or start from a saved template.</p>
      <Button size="sm" className="mt-1" onClick={onCreate}>Add Rule</Button>
    </div>
  );
}

export function NoResultsState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-24 text-muted-foreground">
      <SearchX className="size-10 opacity-30" />
      <p className="text-sm font-medium text-foreground">No rules match your filters</p>
      <p className="text-[12px]">Try a different search term, severity, or tag — or clear the active filters.</p>
      <Button variant="outline" size="sm" className="mt-1" onClick={onClear}>Clear filters</Button>
    </div>
  );
}
