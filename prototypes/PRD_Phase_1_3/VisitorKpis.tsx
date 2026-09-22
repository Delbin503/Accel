import * as React from "react";
import { cn } from "@/lib/utils";
import { BASELINE_INSIDE, type VisitorStats } from "./visitorStats";

/* A split count reads as a fraction inside a KPI card — "168 / 163" looks like
   168 out of 163, not two categories. These cards name each side, give it its
   own colour, and show the balance as a bar. */

type StatTone = "primary" | "success" | "warning" | "info" | "purple";

const TONE_VALUE: Record<StatTone, string> = {
  primary: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
  purple: "text-purple",
};

const TONE_BAR: Record<StatTone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  purple: "bg-purple",
};

function StatShell({ label, meta, accent, children }: {
  label: string;
  meta?: React.ReactNode;
  accent: StatTone;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[132px] flex-col overflow-hidden rounded-xl border border-border bg-card p-4">
      <div className={cn("absolute inset-x-0 top-0 h-0.5", TONE_BAR[accent])} />
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        {meta && <span className="shrink-0 font-mono text-2xs text-muted-foreground">{meta}</span>}
      </div>
      {children}
    </div>
  );
}

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

function SplitStat({ label, parts }: { label: string; parts: [StatPart, StatPart] }) {
  const total = parts[0].value + parts[1].value;
  const share = (v: number) => (total === 0 ? 50 : (v / total) * 100);

  return (
    <StatShell label={label} accent={parts[0].tone} meta={`${total} total`}>
      <div className="flex items-stretch gap-3">
        {parts.map((part, i) => (
          <div key={part.label} className={cn("min-w-0 flex-1", i === 1 && "border-l border-border pl-3")}>
            <p className={cn("flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider", TONE_VALUE[part.tone])}>
              <span className={cn("size-1.5 shrink-0 rounded-full", TONE_BAR[part.tone])} />
              {part.label}
            </p>
            <p className={cn("mt-0.5 text-2xl font-bold leading-none", TONE_VALUE[part.tone])}>{part.value}</p>
          </div>
        ))}
      </div>

      {/* The balance, so the split reads without doing the arithmetic. */}
      <div className="mt-auto flex h-1.5 overflow-hidden rounded-full bg-muted">
        {parts.map((part) => (
          <span key={part.label} className={cn("h-full", TONE_BAR[part.tone])} style={{ width: `${share(part.value)}%` }} />
        ))}
      </div>
      <p className="mt-1.5 flex justify-between text-2xs text-muted-foreground">
        <span>{Math.round(share(parts[0].value))}%</span>
        <span>{Math.round(share(parts[1].value))}%</span>
      </p>
    </StatShell>
  );
}

export function VisitorKpis({
  stats,
  gridClassName = "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4",
}: {
  stats: VisitorStats;
  /** Replaces the column layout — the dashboard sizes it by container instead. */
  gridClassName?: string;
}) {
  return (
    <div className={gridClassName}>
      <SingleStat
        label="Visitors Inside"
        value={stats.inside}
        sub={`${BASELINE_INSIDE} at start-up + entries − exits`}
        accent="primary"
      />
      <SplitStat
        label="Visitor Count"
        parts={[
          { label: "Entries", value: stats.entries, tone: "success" },
          { label: "Exits", value: stats.exits, tone: "warning" },
        ]}
      />
      <SplitStat
        label="Gender"
        parts={[
          { label: "Male", value: stats.male, tone: "info" },
          { label: "Female", value: stats.female, tone: "purple" },
        ]}
      />
      <SplitStat
        label="Age Group"
        parts={[
          { label: "Adult", value: stats.adult, tone: "warning" },
          { label: "Child", value: stats.child, tone: "info" },
        ]}
      />
    </div>
  );
}
