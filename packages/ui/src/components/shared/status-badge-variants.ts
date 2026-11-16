import { cva } from "class-variance-authority";

/** Variants for StatusBadge (one tone per status / severity / health). */
export const statusBadgeVariants = cva(
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
        primary: "border-primary/30 bg-primary/15 text-primary-ink",
        neutral: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);
