import { cn } from "@/lib/utils";
import type { CaseStatus } from "@/types/incidents";

export const STATUS_CONFIG: Record<CaseStatus, { label: string; badge: string; dot: string }> = {
  open: {
    label: "Open",
    badge: "bg-info/15 border-info/30 text-info",
    dot: "bg-info",
  },
  "in-review": {
    label: "In Review",
    badge: "bg-warning/15 border-warning/30 text-warning",
    dot: "bg-warning",
  },
  "action-taken": {
    label: "Action Taken",
    badge: "bg-purple/15 border-purple/30 text-purple",
    dot: "bg-purple",
  },
  closed: {
    label: "Closed",
    badge: "bg-success/15 border-success/30 text-success",
    dot: "bg-success",
  },
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const s = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        s.badge
      )}
    >
      <span className={cn("size-1.5 flex-shrink-0 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
