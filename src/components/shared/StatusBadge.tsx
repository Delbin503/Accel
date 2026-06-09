import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Canonical status / severity / health indicator.
 * Replaces the per-page StatusPill, SeverityBadge, CaseStatusBadge,
 * SeverityChip, HealthPill and StatusBadge variants — one component, one look.
 */
const statusBadgeVariants = cva(
  "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider whitespace-nowrap",
  {
    variants: {
      tone: {
        critical: "border-sev-critical/30 bg-sev-critical/15 text-sev-critical",
        high: "border-sev-high/30 bg-sev-high/15 text-sev-high",
        medium: "border-sev-medium/30 bg-sev-medium/15 text-sev-medium",
        low: "border-sev-low/30 bg-sev-low/15 text-sev-low",
        success: "border-success/30 bg-success/15 text-success",
        warning: "border-warning/30 bg-warning/15 text-warning",
        info: "border-info/30 bg-info/15 text-info",
        purple: "border-purple/30 bg-purple/15 text-purple",
        primary: "border-primary/30 bg-primary/15 text-primary",
        neutral: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

const DOT_TONE: Record<NonNullable<VariantProps<typeof statusBadgeVariants>["tone"]>, string> = {
  critical: "bg-sev-critical",
  high: "bg-sev-high",
  medium: "bg-sev-medium",
  low: "bg-sev-low",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  purple: "bg-purple",
  primary: "bg-primary",
  neutral: "bg-muted-foreground",
};

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  /** Show the leading status dot. Defaults to true. */
  dot?: boolean;
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ tone = "neutral", dot = true, className, children, ...props }, ref) => (
    <span ref={ref} className={cn(statusBadgeVariants({ tone }), className)} {...props}>
      {dot && <span className={cn("size-1.5 shrink-0 rounded-full", DOT_TONE[tone ?? "neutral"])} />}
      {children}
    </span>
  )
);
StatusBadge.displayName = "StatusBadge";

export { StatusBadge, statusBadgeVariants };
