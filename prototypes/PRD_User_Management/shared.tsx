import { AlertCircle, Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Dev-only forced states for the State Tester (prototype-only). */
export type ForcedState = "normal" | "loading" | "empty" | "error";

/** Skeleton that mirrors the User Management layout: seat strip → KPIs → table. */
export function UserTableSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Seat usage strip */}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="mb-2 h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[120px] animate-pulse rounded-xl bg-muted" />
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="h-10 border-b border-border bg-muted/30" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border/60 px-4 py-3 last:border-b-0">
            <div className="size-9 flex-shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2 py-0.5">
              <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-1/4 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
            <div className="hidden h-3 w-16 animate-pulse rounded bg-muted sm:block" />
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
      <p className="text-sm text-foreground">Couldn't load workspace members.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
    </div>
  );
}

export function EmptyState({ onInvite }: { onInvite: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
      <Users className="size-10 opacity-30" />
      <p className="text-sm font-medium text-foreground">No team members yet</p>
      <p className="text-[12px]">Invite people to give them access to this workspace.</p>
      <Button size="sm" onClick={onInvite} className="mt-1 gap-1.5">
        <UserPlus className="size-4" /> Invite Users
      </Button>
    </div>
  );
}
