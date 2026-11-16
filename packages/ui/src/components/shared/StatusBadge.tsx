import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import { statusBadgeVariants } from "./status-badge-variants";

// statusBadgeVariants lives in ./status-badge-variants.ts so this file only
// exports components (React Fast Refresh).

const DOT_TONE: Record<NonNullable<VariantProps<typeof statusBadgeVariants>["tone"]>, string> = {
  critical: "bg-severity-critical",
  high: "bg-severity-high",
  medium: "bg-severity-medium",
  low: "bg-severity-low",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  violet: "bg-violet",
  primary: "bg-primary",
  neutral: "bg-muted-foreground",
};

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  /** Show the leading status dot. Defaults to true. */
  dot?: boolean;
}

/**
 * Canonical status / severity / health indicator.
 * Replaces the per-page StatusPill, SeverityBadge, CaseStatusBadge,
 * SeverityChip, HealthPill and StatusBadge variants — one component, one look.
 */
const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ tone = "neutral", dot = true, className, children, ...props }, ref) => (
    <span data-slot="status-badge" ref={ref} className={cn(statusBadgeVariants({ tone }), className)} {...props}>
      {dot && <span data-slot="status-badge-dot" className={cn("size-1.5 shrink-0 rounded-full", DOT_TONE[tone ?? "neutral"])} />}
      {children}
    </span>
  )
);
StatusBadge.displayName = "StatusBadge";

export { StatusBadge };
