import type { Severity } from "@/types/detection";
import { StatusBadge } from "@accel/ui/components/shared/StatusBadge";

// parseEventText and SEVERITY_BORDER live in ./shared-utils.tsx so this file
// only exports components (React Fast Refresh).

/* ── Severity badge ──────────────────────────────────────────────────────── */

const SEV_LABEL: Record<Severity, string> = {
  critical: "Critical",
  medium: "Medium",
  low: "Low",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <StatusBadge tone={severity}>{SEV_LABEL[severity]}</StatusBadge>;
}
