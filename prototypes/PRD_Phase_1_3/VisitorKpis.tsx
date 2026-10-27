import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { BASELINE_INSIDE, type VisitorStats } from "./visitorStats";

/* A split count reads as a fraction inside a KPI card — "168 / 163" looks like
   168 out of 163, not two categories. These cards name each side, give it its
   own colour, and show the balance as a bar. */

type StatTone = "primary" | "success" | "warning" | "info" | "purple" | "muted";

const TONE_VALUE: Record<StatTone, string> = {
  primary: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
  purple: "text-purple",
  muted: "text-muted-foreground",
};

const TONE_BAR: Record<StatTone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  purple: "bg-purple",
  muted: "bg-muted-foreground",
};

const StatShell = React.forwardRef<HTMLDivElement, {
  label: string;
  meta?: React.ReactNode;
  accent: StatTone;
  className?: string;
  children: React.ReactNode;
}>(({ label, meta, accent, className, children }, ref) => {
  return (
    <div ref={ref} className={cn("relative flex min-h-[132px] flex-col overflow-hidden rounded-xl border border-border bg-card p-4", className)}>
      <div className={cn("absolute inset-x-0 top-0 h-0.5", TONE_BAR[accent])} />
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        {meta && <span className="shrink-0 font-mono text-2xs text-muted-foreground">{meta}</span>}
      </div>
      {children}
    </div>
  );
});
StatShell.displayName = "StatShell";

function SingleStat({ label, value, sub, accent }: {
  label: string; value: number; sub: string; accent: StatTone;
}) {
  return (
    <StatShell label={label} accent={accent}>
      <p className={cn("text-4xl font-bold leading-none", TONE_VALUE[accent])}>{value}</p>
      <p className="mt-auto pt-2 text-xs leading-tight text-muted-foreground">{sub}</p>
    </StatShell>
  );
}

interface StatPart {
  label: string;
  value: number;
  tone: StatTone;
}

/** Rough px per character of an uppercase card label, to tell whether "N total" fits beside it. */
const LABEL_CHAR_PX = 8;
const TOTAL_PX = 64;

/**
 * Two to four named parts of one total, each with its share; the bar shows the
 * balance. `stacked` lists the parts as rows, for a card a status-card wide.
 */
function SplitStat({ label, parts, stacked, className }: { label: string; parts: StatPart[]; stacked?: boolean; className?: string }) {
  const total = parts.reduce((t, p) => t + p.value, 0);
  const share = (v: number) => (total === 0 ? 100 / parts.length : (v / total) * 100);
  const many = parts.length > 2;

  // A narrow card keeps its title on one line by dropping "N total" (the title attribute keeps it).
  const ref = React.useRef<HTMLDivElement>(null);
  const [showTotal, setShowTotal] = React.useState(true);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !stacked) return;
    const ro = new ResizeObserver(([entry]) => setShowTotal(entry.contentRect.width >= label.length * LABEL_CHAR_PX + TOTAL_PX));
    ro.observe(el);
    return () => ro.disconnect();
  }, [stacked, label]);

  return (
    <StatShell ref={ref} label={label} accent={parts[0].tone} meta={showTotal ? `${total} total` : undefined} className={className}>
      {stacked ? (
        <ul className="mb-2.5 flex flex-col gap-1.5" title={`${total} total`}>
          {parts.map((part) => (
            <li key={part.label} className="flex items-baseline gap-2">
              <span className={cn("flex min-w-0 flex-1 items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider", TONE_VALUE[part.tone])}>
                <span className={cn("size-1.5 shrink-0 rounded-full", TONE_BAR[part.tone])} />
                <span className="truncate">{part.label}</span>
              </span>
              <span className={cn("text-md font-bold leading-none", TONE_VALUE[part.tone])}>{part.value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-stretch gap-3">
          {parts.map((part, i) => (
            <div key={part.label} className={cn("min-w-0 flex-1", i > 0 && "border-l border-border pl-3")}>
              <p className={cn("flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider", TONE_VALUE[part.tone])}>
                <span className={cn("size-1.5 shrink-0 rounded-full", TONE_BAR[part.tone])} />
                <span className="truncate">{part.label}</span>
              </p>
              <p className={cn("mt-0.5 font-bold leading-none", many ? "text-xl" : "text-2xl", TONE_VALUE[part.tone])}>{part.value}</p>
              <p className="mt-1 text-2xs text-muted-foreground">{Math.round(share(part.value))}%</p>
            </div>
          ))}
        </div>
      )}

      {/* The balance, so the split reads without doing the arithmetic. Hovering a
          part gives its count and share, as the Recordings storage bar does; each
          part is a taller hover target than the bar it draws. */}
      <div className="mt-auto flex shrink-0 gap-px">
        {parts.map((part, i) => (
          <Tooltip key={part.label}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`${part.label}: ${part.value}, ${Math.round(share(part.value))}%`}
                className="group/part flex h-3 min-w-0 items-center"
                style={{ width: `${share(part.value)}%` }}
              >
                <span className={cn(
                  "h-1.5 w-full transition-all group-hover/part:h-2",
                  i === 0 && "rounded-l-full",
                  i === parts.length - 1 && "rounded-r-full",
                  TONE_BAR[part.tone]
                )} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span className="flex items-center gap-1.5">
                <span className={cn("size-1.5 rounded-full", TONE_BAR[part.tone])} />
                <span className="font-semibold">{part.label} · {part.value}</span>
                <span className="text-muted-foreground">· {Math.round(share(part.value))}% of {total}</span>
              </span>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </StatShell>
  );
}

export function VisitorKpis({
  stats,
  gridClassName = "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3",
  wideClassName = "sm:col-span-2",
  statusColumns,
}: {
  stats: VisitorStats;
  /** Replaces the column layout — the dashboard sizes it by container instead. */
  gridClassName?: string;
  /** Lets the four-way Race card take two columns, so its parts don't crowd. */
  wideClassName?: string;
  /**
   * Lays the five cards out on the dashboard's status columns — three, a gap
   * the width of the status divider, then two — so each lines up under, and
   * is as wide as, the status card above it. Ignores the two class props.
   */
  statusColumns?: boolean;
}) {
  const cards = [
    <SingleStat
      key="Visitors Inside"
      label="Visitors Inside"
      value={stats.inside}
      sub={`${BASELINE_INSIDE} at start-up + entries − exits`}
      accent="primary"
    />,
    <SplitStat
      key="Visitor Count"
      label="Visitor Count"
      stacked={statusColumns}
      parts={[
        { label: "Entries", value: stats.entries, tone: "success" },
        { label: "Exits", value: stats.exits, tone: "warning" },
      ]}
    />,
    <SplitStat
      key="Gender"
      label="Gender"
      stacked={statusColumns}
      parts={[
        { label: "Male", value: stats.male, tone: "info" },
        { label: "Female", value: stats.female, tone: "purple" },
      ]}
    />,
    <SplitStat
      key="Age Group"
      label="Age Group"
      stacked={statusColumns}
      parts={[
        { label: "Adult", value: stats.adult, tone: "warning" },
        { label: "Child", value: stats.child, tone: "info" },
        { label: "Elderly", value: stats.elderly, tone: "purple" },
      ]}
    />,
    <SplitStat
      key="Race"
      label="Race"
      stacked={statusColumns}
      className={statusColumns ? undefined : wideClassName}
      parts={[
        { label: "Chinese", value: stats.chinese, tone: "info" },
        { label: "Malay", value: stats.malay, tone: "success" },
        { label: "Indian", value: stats.indian, tone: "warning" },
        { label: "Others", value: stats.others, tone: "muted" },
      ]}
    />,
  ];

  if (!statusColumns) return <div className={gridClassName}>{cards}</div>;

  // Same flex and grids as the status strip, so the columns match exactly.
  return (
    <div className="flex flex-col gap-4 @2xl:flex-row">
      <div className="grid min-w-0 grid-cols-1 gap-3 @sm:grid-cols-3 @2xl:flex-[3_3_24px]">{cards.slice(0, 3)}</div>
      <div className="hidden w-px @2xl:block" />
      <div className="grid min-w-0 grid-cols-1 gap-3 @sm:grid-cols-2 @2xl:flex-[2_2_12px]">{cards.slice(3)}</div>
    </div>
  );
}
