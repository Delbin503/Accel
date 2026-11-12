import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Dev-only forced states for the State Tester (prototype-only). */
export type ForcedState = "normal" | "loading" | "empty" | "error";

/** Skeleton mirroring the Hero layout: big featured pane + sidebar list. */
export function CameraSkeleton() {
  return (
    <div data-slot="live-monitoring-page-skeleton" className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        <div className="aspect-video w-full animate-pulse rounded-xl border border-border bg-muted" />
        <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="space-y-2 rounded-xl border border-border bg-card p-3">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-2 gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-video animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div data-slot="live-monitoring-page-error" className="flex flex-col items-center justify-center gap-3 rounded-xl border border-severity-critical/30 bg-severity-critical/[0.05] py-20 text-muted-foreground">
      <AlertCircle className="size-8 text-severity-critical" />
      <p className="text-sm text-foreground">Couldn't load camera feeds.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
    </div>
  );
}
