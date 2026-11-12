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
        critical: "border-severity-critical/30 bg-severity-critical/15 text-severity-critical",
        high: "border-severity-high/30 bg-severity-high/15 text-severity-high",
        medium: "border-severity-medium/30 bg-severity-medium/15 text-severity-medium",
        low: "border-severity-low/30 bg-severity-low/15 text-severity-low",
        success: "border-success/30 bg-success/15 text-success",
        warning: "border-warning/30 bg-warning/15 text-warning",
        info: "border-info/30 bg-info/15 text-info",
        violet: "border-violet/30 bg-violet/15 text-violet",
        /** @deprecated Renamed to "violet" — kept for prototypes and in-flight pages. */
        purple: "border-violet/30 bg-violet/15 text-violet",
        primary: "border-primary/30 bg-primary/15 text-primary-ink",
        neutral: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

const DOT_TONE: Record<NonNullable<VariantProps<typeof statusBadgeVariants>["tone"]>, string> = {
  critical: "bg-severity-critical",
  high: "bg-severity-high",
  medium: "bg-severity-medium",
  low: "bg-severity-low",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  violet: "bg-violet",
  purple: "bg-violet",
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
