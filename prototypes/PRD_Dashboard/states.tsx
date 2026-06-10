import { AlertCircle, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Dev-only forced states for the State Tester (prototype-only). */
export type ForcedState = "normal" | "loading" | "empty" | "error";

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-full animate-pulse rounded-xl bg-muted" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[120px] animate-pulse rounded-xl border border-border bg-muted" />
        ))}
      </div>
      <div className="h-[320px] w-full animate-pulse rounded-xl border border-border bg-muted" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-[260px] animate-pulse rounded-xl border border-border bg-muted" />
        <div className="h-[260px] animate-pulse rounded-xl border border-border bg-muted" />
      </div>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-sev-critical/30 bg-sev-critical/[0.05] py-24 text-muted-foreground">
      <AlertCircle className="size-8 text-sev-critical" />
      <p className="text-sm text-foreground">Couldn't load the dashboard.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-24 text-muted-foreground">
      <LayoutDashboard className="size-10 opacity-20" />
      <p className="text-sm">No dashboard data for the selected range.</p>
    </div>
  );
}
