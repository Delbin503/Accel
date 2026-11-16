import type { CaseStatus } from "@/types/incidents";
import { StatusBadge, type StatusBadgeProps } from "@accel/ui/components/shared/StatusBadge";
import { STATUS_CONFIG } from "./shared-data";

// STATUS_CONFIG lives in ./shared-data.ts so this file only exports components
// (React Fast Refresh). Re-exported for the frozen src/pages/dev/modals/legacy
// copy, which still imports it from here.
export { STATUS_CONFIG } from "./shared-data";

const STATUS_TONE: Record<CaseStatus, StatusBadgeProps["tone"]> = {
  open: "info",
  "in-review": "warning",
  "action-taken": "violet",
  closed: "success",
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return <StatusBadge tone={STATUS_TONE[status]}>{STATUS_CONFIG[status].label}</StatusBadge>;
}
