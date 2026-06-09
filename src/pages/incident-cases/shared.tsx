import type { CaseStatus } from "@/types/incidents";
import { StatusBadge, type StatusBadgeProps } from "@/components/shared/StatusBadge";

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

const STATUS_TONE: Record<CaseStatus, StatusBadgeProps["tone"]> = {
  open: "info",
  "in-review": "warning",
  "action-taken": "purple",
  closed: "success",
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return <StatusBadge tone={STATUS_TONE[status]}>{STATUS_CONFIG[status].label}</StatusBadge>;
}
