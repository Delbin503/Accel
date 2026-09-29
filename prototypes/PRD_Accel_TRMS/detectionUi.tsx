import { Crosshair, ScanFace } from "lucide-react";
import { SeverityBadge } from "@/pages/detection-feed/shared";
import { cn } from "@/lib/utils";
import { KIND_LABEL, type DetectionKind, type TrmsDetection } from "./trmsData";

/* Small pieces every TRMS page draws a detection with, so a detection looks
   the same in a toast, the live drawer and the Alert Log. */

export function KindIcon({ kind, className }: { kind: DetectionKind; className?: string }) {
  const Icon = kind === "person" ? ScanFace : Crosshair;
  return <Icon className={cn("shrink-0", className)} />;
}

export function StatusChip({ detection: d }: { detection: TrmsDetection }) {
  if (d.status === "escalated") {
    return (
      <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-2xs font-semibold text-primary">
        {d.caseId ?? "Escalated"}
      </span>
    );
  }
  if (d.status === "dismissed") {
    return (
      <span className="inline-flex items-center rounded-md border border-border bg-muted px-1.5 py-0.5 text-2xs font-semibold text-muted-foreground">
        Dismissed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-2xs font-semibold text-warning">
      Pending
    </span>
  );
}

/** Title line shared by every detection row: icon, what, and how serious. */
export function DetectionHeading({ detection: d }: { detection: TrmsDetection }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg",
        d.kind === "person" ? "bg-info/15 text-info" : "bg-warning/15 text-warning"
      )}>
        <KindIcon kind={d.kind} className="size-3.5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-base font-semibold text-foreground">{KIND_LABEL[d.kind]}</p>
        <p className="truncate text-xs text-muted-foreground">{d.subject}</p>
      </div>
      <span className="ml-auto shrink-0">
        <SeverityBadge severity={d.severity} />
      </span>
    </div>
  );
}
