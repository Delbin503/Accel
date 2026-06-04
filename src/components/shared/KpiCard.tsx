import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Shared KPI card — single canonical pattern used across every module.
 *
 * Layout:
 *   ┌────────────────────────────────┐
 *   │ ▔ accent bar (top, h-0.5)      │ ← top accent (use `accent` color token)
 *   │ [icon] LABEL          [Active] │ ← label row + optional "Active Filter" chip
 *   │ 123 / 456                      │ ← big value (text-[26px] bold)
 *   │ Sub copy below                 │ ← sub text (text-[11px] muted)
 *   └────────────────────────────────┘
 *
 * Renders as a `<button>` when `onClick` is set, otherwise a `<div>`.
 *
 * @example
 *   <KpiCard label="Total" value={42} sub="Across sites" accent="primary" />
 *   <KpiCard icon={Video} label="Cameras" value="8 / 11" sub="3 offline"
 *            accent="success" onClick={...} active />
 */

export type KpiAccent =
  | "primary"
  | "success"
  | "warning"
  | "sev-critical"
  | "sev-medium"
  | "sev-low"
  | "info"
  | "secondary"
  | "purple"
  | "muted";

const ACCENT_BAR: Record<KpiAccent, string> = {
  primary:        "bg-primary",
  success:        "bg-success",
  warning:        "bg-warning",
  "sev-critical": "bg-sev-critical",
  "sev-medium":   "bg-sev-medium",
  "sev-low":      "bg-sev-low",
  info:           "bg-info",
  secondary:      "bg-secondary",
  purple:         "bg-purple",
  muted:          "bg-muted-foreground/30",
};

const ACCENT_TEXT: Record<KpiAccent, string> = {
  primary:        "text-foreground",
  success:        "text-success",
  warning:        "text-warning",
  "sev-critical": "text-sev-critical",
  "sev-medium":   "text-sev-medium",
  "sev-low":      "text-sev-low",
  info:           "text-info",
  secondary:      "text-secondary",
  purple:         "text-purple",
  muted:          "text-muted-foreground",
};

export interface KpiCardProps {
  /** Uppercase label shown above the value. */
  label: React.ReactNode;
  /** Main value — usually a number, but can be any node. */
  value: React.ReactNode;
  /** Small description below the value. */
  sub?: React.ReactNode;
  /** Optional Lucide icon shown to the left of the label. */
  icon?: React.ElementType;
  /** Colour token controlling the top accent bar and value tint. Defaults to "primary". */
  accent?: KpiAccent;
  /** Click handler. When provided, the card is rendered as a button with hover state. */
  onClick?: () => void;
  /** Active filter state — shows the "Active Filter" chip and primary border. */
  active?: boolean;
  /** Extra classes appended to the root. */
  className?: string;
  /** Compact variant for in-drawer mini-stats (shorter, smaller value). */
  compact?: boolean;
}

export function KpiCard({
  label,
  value,
  sub,
  // Icon prop is accepted for backwards compatibility but intentionally not rendered —
  // per design system: KPI cards never show icons (uniform look across every module).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  icon: _Icon,
  accent = "primary",
  onClick,
  active = false,
  compact = false,
  className,
}: KpiCardProps) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border bg-card text-left transition-colors",
        // Fixed height keeps cards uniform across pages/drawers — generous so sub-text never clips.
        compact ? "h-[104px] p-4" : "h-[120px] p-4",
        active ? "border-primary bg-primary-muted" : "border-border",
        onClick && "hover:border-primary/40",
        className
      )}
    >
      {/* Top accent bar */}
      <div className={cn("absolute inset-x-0 top-0 h-0.5", active ? "bg-muted-foreground/30" : ACCENT_BAR[accent])} />

      {/* Active filter chip */}
      {active && (
        <span className="absolute right-2 top-2 rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
          Active Filter
        </span>
      )}

      {/* Label (no icon — uniform across modules) */}
      <div className={cn(
        "mb-1.5 font-semibold uppercase tracking-wider text-muted-foreground",
        compact ? "text-[10px]" : "text-[11px]"
      )}>
        <span className="truncate">{label}</span>
      </div>

      {/* Value — smaller, with proper line-height so descenders (g, y, p) aren't clipped */}
      <div className={cn("truncate font-bold leading-tight", ACCENT_TEXT[accent], compact ? "text-[18px]" : "text-[22px]")}>
        {value}
      </div>

      {/* Sub — guaranteed to stay visible inside the fixed height */}
      {sub && <div className="mt-auto truncate pt-2 text-[11px] leading-tight text-muted-foreground">{sub}</div>}
    </Tag>
  );
}

/**
 * Standard responsive grid for KPI strips. Pass column counts for the
 * sm/lg breakpoints (mobile is always 2 columns).
 *
 * @example
 *   <KpiGrid cols={6}>
 *     <KpiCard ... />  <KpiCard ... />  ...
 *   </KpiGrid>
 */
export function KpiGrid({
  cols = 4,
  children,
  className,
}: {
  cols?: 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}) {
  const gridClass: Record<number, string> = {
    3: "grid grid-cols-2 gap-3 sm:grid-cols-3",
    4: "grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5",
    6: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6",
  };
  return <div className={cn(gridClass[cols], className)}>{children}</div>;
}
