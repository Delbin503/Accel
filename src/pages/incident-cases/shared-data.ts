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
    badge: "bg-violet/15 border-violet/30 text-violet",
    dot: "bg-violet",
  },
  closed: {
    label: "Closed",
    badge: "bg-success/15 border-success/30 text-success",
    dot: "bg-success",
  },
};
