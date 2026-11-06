import * as React from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TruncatedText } from "@/components/shared/TruncatedText";

/**
 * Shared KPI card — single canonical pattern used across every module.
 *
 * Layout:
 *   ┌────────────────────────────────┐
 *   │ • Label                [Active] │ ← accent dot + sentence-case label
 *   │                                │
 *   │ 123 / 456                      │ ← big neutral value
 *   │                                │
 *   │ ↑ 12.5%          sub copy      │ ← footer: optional trend left, sub right
 *   └────────────────────────────────┘
 *
 * The accent colour lives only in the small dot beside the label, so values stay
 * neutral and the card reads calm. Without a trend, `sub` sits on the left.
 *
 * Renders as a `<button>` when `onClick` is set, otherwise a `<div>`.
 *
 * @example
 *   <KpiCard label="Total" value={42} sub="Across sites" accent="primary" />
 *   <KpiCard label="Events" value={128} sub="vs yesterday"
 *            trend={{ value: "12.5%", direction: "up" }} />
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

const ACCENT_DOT: Record<KpiAccent, string> = {
  primary:        "bg-primary",
  success:        "bg-success",
  warning:        "bg-warning",
  "sev-critical": "bg-sev-critical",
  "sev-medium":   "bg-sev-medium",
  "sev-low":      "bg-sev-low",
  info:           "bg-info",
  secondary:      "bg-secondary",
  purple:         "bg-purple",
  muted:          "bg-muted-foreground/40",
};

export interface KpiTrend {
  /** Change to show, e.g. "12.5%" or "+4". The arrow is added for you. */
  value: React.ReactNode;
  direction: "up" | "down" | "flat";
  /**
   * Whether the change is good news. Defaults to up = positive, down = negative.
   * Set it for metrics where rising is bad (e.g. critical events going up).
   */
  sentiment?: "positive" | "negative" | "neutral";
}

const TREND_ICON = { up: ArrowUp, down: ArrowDown, flat: Minus } as const;

const TREND_TONE = {
  positive: "text-success",
  negative: "text-sev-critical",
  neutral:  "text-muted-foreground",
} as const;

export interface KpiCardProps {
  /** Label shown above the value (sentence case). */
  label: React.ReactNode;
  /** Main value — usually a number, but can be any node. */
  value: React.ReactNode;
  /** Small description in the footer — right-aligned when a trend is shown. */
  sub?: React.ReactNode;
  /** Optional change indicator shown at the bottom-left. */
  trend?: KpiTrend;
  /** Accepted for backwards compatibility; KPI cards never render icons. */
  icon?: React.ElementType;
  /** Colour token for the dot beside the label. Defaults to "primary". */
  accent?: KpiAccent;
  /** Click handler. When provided, the card is rendered as a button with hover state. */
  onClick?: () => void;
  /** Active filter state — shows the "Active" chip and primary border. */
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
  trend,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  icon: _Icon,
  accent = "primary",
  onClick,
  active = false,
  compact = false,
  className,
}: KpiCardProps) {
  const Tag = onClick ? "button" : "div";
  const TrendIcon = trend ? TREND_ICON[trend.direction] : null;
  const sentiment =
    trend?.sentiment ?? (trend?.direction === "up" ? "positive" : trend?.direction === "down" ? "negative" : "neutral");

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "relative flex min-w-0 flex-col rounded-xl border bg-card text-left",
        "transition-colors duration-[var(--duration-fast)] ease-standard",
        // Fixed height keeps cards uniform across pages/drawers — matches the KPI skeletons.
        compact ? "h-[104px] p-3.5" : "h-[120px] p-4",
        active ? "border-primary bg-primary-muted" : "border-border",
        onClick && !active && "hover:border-muted-foreground/30 hover:bg-accent/40",
        className
      )}
    >
      {/* Label row — the accent dot replaces the old coloured top stroke */}
      <div className="flex min-w-0 items-center gap-2">
        <span className={cn("size-1.5 shrink-0 rounded-full", ACCENT_DOT[accent])} />
        <TruncatedText className={cn("min-w-0 flex-1 font-medium text-muted-foreground", compact ? "text-sm" : "text-base")}>
          {label}
        </TruncatedText>
        {active && (
          <span className="shrink-0 rounded bg-primary/15 px-1.5 py-0.5 text-3xs font-semibold uppercase tracking-wider text-primary">
            Active
          </span>
        )}
      </div>

      {/* Value — neutral and prominent; leading-tight keeps descenders unclipped */}
      <div
        className={cn(
          "font-semibold leading-tight tracking-tight tabular-nums text-foreground",
          compact ? "mt-1.5 text-xl" : "mt-2 text-2xl"
        )}
      >
        <TruncatedText>{value}</TruncatedText>
      </div>

      {/* Footer — trend on the left, meta on the right */}
      {(trend || sub) && (
        <div className="mt-auto flex min-w-0 items-center gap-2 pt-2 text-xs leading-tight">
          {trend && TrendIcon && (
            <span className={cn("inline-flex shrink-0 items-center gap-0.5 font-medium tabular-nums", TREND_TONE[sentiment])}>
              <TrendIcon className="size-3" aria-hidden />
              {trend.value}
            </span>
          )}
          {sub && (
            <TruncatedText className={cn("min-w-0 flex-1 text-muted-foreground", trend && "text-right")}>
              {sub}
            </TruncatedText>
          )}
        </div>
      )}
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
