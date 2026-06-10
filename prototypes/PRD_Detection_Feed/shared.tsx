import { AlertCircle, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Dev-only forced states for the State Tester (prototype-only). */
export type ForcedState = "normal" | "loading" | "empty" | "error";

export function SkeletonList() {
  return (
    <div className="space-y-2">
      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex gap-3 rounded-xl border border-border p-3.5">
          <div className="h-[90px] w-[140px] flex-shrink-0 animate-pulse rounded-md bg-muted" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-sev-critical/30 bg-sev-critical/[0.05] py-16 text-muted-foreground">
      <AlertCircle className="size-8 text-sev-critical" />
      <p className="text-sm text-foreground">Couldn't load detection events.</p>
      <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>
    </div>
  );
}

export function ListFooter({
  mode,
  loading,
  onLoadOlder,
}: {
  mode: "more" | "caught-up";
  loading: boolean;
  onLoadOlder: () => void;
}) {
  if (mode === "more") {
    return (
      <div className="flex justify-center pt-1">
        <Button variant="outline" className="gap-1.5" disabled={loading} onClick={onLoadOlder}>
          {loading ? "Loading…" : "Load older entries"}
        </Button>
      </div>
    );
  }
  return (
    <p className="flex items-center justify-center gap-1.5 py-3 text-center text-[12px] text-muted-foreground">
      <CheckCheck className="size-3.5 text-success" /> You're all caught up.
    </p>
  );
}
