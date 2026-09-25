import * as React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { ArrowUpRight, FolderOpen, ScrollText } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { KpiCard, KpiGrid } from "@/components/shared/KpiCard";
import { DateRangeBar } from "@/components/shared/DateRangeBar";
import { TruncatedText } from "@/components/shared/TruncatedText";
import { ACTIVITY_KIND_LABELS, ACTIVITY_KIND_STYLES, type ActivityKind } from "@/mocks/activityLogs";
import { cn } from "@/lib/utils";

/* PROTOTYPE — Accel TRMS dashboard. Layout, cards and section chrome mirror
   src/pages/dashboard (PRD_Dashboard/RealDashboard.tsx); only the data is TRMS-specific. */

/* ── Section card — same chrome as the main dashboard's Section ──────── */

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <TruncatedText text={title} className="min-w-0 flex-1 text-base font-bold text-foreground" />
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ── Severity styles ─────────────────────────────────────────────────── */

const SEV_STYLES = {
  critical: { bg: "bg-sev-critical/15", text: "text-sev-critical", label: "Critical", dot: "bg-sev-critical" },
  medium:   { bg: "bg-warning/15",      text: "text-warning",      label: "Medium",   dot: "bg-warning" },
  low:      { bg: "bg-info/15",         text: "text-info",         label: "Low",      dot: "bg-info" },
};
type SevKind = keyof typeof SEV_STYLES;

function SevPill({ kind, value }: { kind: SevKind; value: number }) {
  const s = SEV_STYLES[kind];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-current/30 px-1.5 py-0.5 text-2xs font-bold", s.bg, s.text)}>
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {value}
    </span>
  );
}

/** Severity row used inside the per-station popover — label + bar + count. */
function SevRow({ kind, value, total }: { kind: SevKind; value: number; total: number }) {
  const s = SEV_STYLES[kind];
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={cn("inline-flex items-center gap-1 font-bold", s.text)}>
        <span className={cn("size-1.5 rounded-full", s.dot)} />
        {s.label}
      </span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", s.dot)} style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
      <span className="w-12 text-right font-mono text-foreground">
        {value} <span className="text-muted-foreground">· {pct}%</span>
      </span>
    </div>
  );
}

function SevBadge({ kind }: { kind: SevKind }) {
  const s = SEV_STYLES[kind];
  return (
    <span className={cn("inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-current px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider", s.bg, s.text)}>
      {s.label}
    </span>
  );
}

/* ── Mock data ───────────────────────────────────────────────────────── */

type DateRange = "today" | "yesterday" | "week" | "month" | "custom";

const DATE_FILTERS: { key: DateRange; label: string }[] = [
  { key: "today",     label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week",      label: "This Week" },
  { key: "month",     label: "This Month" },
];

/* Scales the "today" mock so switching range visibly changes the numbers. */
const RANGE_SCALE: Record<DateRange, number> = { today: 1, yesterday: 1, week: 6, month: 22, custom: 3 };

const TREND_AXIS: Record<DateRange, string[]> = {
  today:     ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
  yesterday: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
  week:      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  month:     ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
  custom:    ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"],
};

const STATIONS = [
  { name: "IMT-01", color: "var(--info)",    critical: 2, medium: 1, low: 1 },
  { name: "IMT-02", color: "var(--warning)", critical: 1, medium: 2, low: 0 },
  { name: "IMT-03", color: "var(--success)", critical: 0, medium: 1, low: 1 },
];

interface AlertEvent {
  id: string;
  severity: SevKind;
  title: string;
  summary: string;
  caseId?: string;
  time: string;
}

const ALERT_EVENTS: AlertEvent[] = [
  { id: "EVT-01", severity: "critical", title: "Weapon missing from rack",  summary: "SAR21 #A-0421 not returned · IMT-02 › Lane 11 · 18 min overdue", time: "14:23:08" },
  { id: "EVT-02", severity: "critical", title: "Camera disconnected",       summary: "Cam-BS-001 lost signal · IMT-01 · weapon tracking paused", caseId: "CASE-2026-0211", time: "12:10:36" },
  { id: "EVT-03", severity: "critical", title: "Unauthorised weapon removal", summary: "SAR21 #A-0388 lifted without sign-out · IMT-01 › Lane 4", time: "11:47:22" },
  { id: "EVT-04", severity: "medium",   title: "Weapon returned late",      summary: "SAR21 #A-0402 returned 9 min after session end · IMT-02 › Lane 2", time: "10:18:55" },
  { id: "EVT-05", severity: "low",      title: "Base station signal weak",  summary: "IMT-03 uplink below threshold for 4 min — auto-recovered", time: "08:55:03" },
];

interface TrmsCase {
  id: string;
  title: string;
  station: string;
  assignee: string;
  severity: SevKind;
  open: boolean;
}

const CASES: TrmsCase[] = [
  { id: "CASE-2026-0211", title: "Weapon unaccounted — SAR21 #A-0421", station: "IMT-02", assignee: "Sze Hui", severity: "critical", open: true },
  { id: "CASE-2026-0209", title: "Tracking gap — Cam-BS-001 outage",    station: "IMT-01", assignee: "Jordan Kim", severity: "medium", open: true },
  { id: "CASE-2026-0204", title: "Late return pattern — Lane 2",        station: "IMT-02", assignee: "Priya Raman", severity: "low", open: false },
];

interface TrmsActivity {
  id: string;
  whenRelative: string;
  module: string;
  kind: ActivityKind;
  actor: string;
  text: string;
}

const ACTIVITY: TrmsActivity[] = [
  { id: "A-1", whenRelative: "4 min ago",  module: "Incident Cases", kind: "case",       actor: "Sze Hui",      text: "Opened CASE-2026-0211 — SAR21 #A-0421 unaccounted at IMT-02" },
  { id: "A-2", whenRelative: "11 min ago", module: "Devices",        kind: "camera",     actor: "System",       text: "Cam-BS-001 went offline — weapon tracking paused on IMT-01" },
  { id: "A-3", whenRelative: "22 min ago", module: "Alert Log",      kind: "event",      actor: "Jordan Kim",   text: "Escalated alert EVT-03 — unauthorised removal at Lane 4" },
  { id: "A-4", whenRelative: "38 min ago", module: "User Management", kind: "auth",      actor: "Delbin Arkar", text: "Signed in via SSO (Okta)" },
  { id: "A-5", whenRelative: "1 hr ago",   module: "System Config",  kind: "config",     actor: "Delbin Arkar", text: "Set weapon-return grace period to 10 minutes" },
  { id: "A-6", whenRelative: "2 hr ago",   module: "Devices",        kind: "camera",     actor: "Priya Raman",  text: "Re-paired Cam-BS-014 to base station IMT-03" },
];

/* ── Page ────────────────────────────────────────────────────────────── */

export function AccelDashboard() {
  const [dateRange, setDateRange] = React.useState<DateRange>("today");
  const [customFrom, setCustomFrom] = React.useState("");
  const [customTo, setCustomTo] = React.useState("");
  const [selectedStations, setSelectedStations] = React.useState<string[]>(STATIONS.map((s) => s.name));

  const scale = RANGE_SCALE[dateRange];
  const dateLabel =
    dateRange === "custom" && customFrom && customTo ? `${customFrom} → ${customTo}` :
    dateRange === "custom" ? "Custom range" :
    DATE_FILTERS.find((f) => f.key === dateRange)?.label ?? "Today";

  const stations = STATIONS.map((s) => ({
    ...s,
    critical: s.critical * scale,
    medium: s.medium * scale,
    low: s.low * scale,
    total: (s.critical + s.medium + s.low) * scale,
  }));
  const eventsInRange = stations.reduce((n, s) => n + s.total, 0);
  const openCases = CASES.filter((c) => c.open).length;
  const openCritical = CASES.filter((c) => c.open && c.severity === "critical").length;

  const trend = TREND_AXIS[dateRange].map((label, bi) => {
    const row: Record<string, string | number> = { label };
    stations.forEach((s, si) => {
      const wave = (Math.sin((bi + si * 1.6) * 0.9) + 1) / 2;
      row[s.name] = Math.round((2 + s.total * 0.6) * (0.4 + 0.6 * wave));
    });
    return row;
  });

  function toggleStation(name: string) {
    setSelectedStations((prev) =>
      prev.includes(name) ? (prev.length === 1 ? prev : prev.filter((n) => n !== name)) : [...prev, name]
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Accel TRMS · Dashboard</PageHeader.Title>
          <PageHeader.Description>
            Training resource overview — weapon tracking, base-station alerts, cases and activity for Kranji Camp.
          </PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-3 py-1 text-sm font-semibold text-success">
            <span className="size-1.5 animate-pulse rounded-full bg-success" />
            All Systems Operational
          </span>
        </PageHeader.Actions>
      </PageHeader>

      <DateRangeBar
        presets={DATE_FILTERS}
        active={dateRange}
        onSelect={(k) => setDateRange(k as DateRange)}
        customFrom={customFrom}
        customTo={customTo}
        onCustomChange={(f, t) => { setCustomFrom(f); setCustomTo(t); }}
        onCustomApply={(f, t) => { setCustomFrom(f); setCustomTo(t); setDateRange("custom"); }}
        onCustomReset={() => { setCustomFrom(""); setCustomTo(""); setDateRange("today"); }}
        showingLabel={
          <>
            Showing <strong className="text-foreground">{dateLabel}</strong>
            <span className="ml-2 text-muted-foreground/60">· {eventsInRange} event{eventsInRange === 1 ? "" : "s"}</span>
          </>
        }
      />

      {/* KPI strip — Live Status | Period Metrics (same split as the main dashboard) */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="min-w-0 flex-[3] space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-success" />
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Live status</p>
          </div>
          <KpiGrid cols={3}>
            <KpiCard label="Sites" value={3} sub="3 active" accent="primary" onClick={() => {}} />
            <KpiCard
              label="Weapons Detected"
              value={<>18<span className="text-md text-muted-foreground"> / 20</span></>}
              sub="2 missing from racks"
              accent="success"
              onClick={() => {}}
            />
            <KpiCard
              label="Cameras"
              value={<>142<span className="text-md text-muted-foreground"> / 150</span></>}
              sub="8 offline"
              accent="purple"
              onClick={() => {}}
            />
          </KpiGrid>
        </div>
        <div className="hidden w-px self-stretch bg-border md:block" />
        <div className="space-y-2 md:w-64 md:shrink-0">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Period · {dateLabel}</p>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Events" value={eventsInRange} sub={dateLabel} accent="info" onClick={() => {}} />
            <KpiCard label="Open Cases" value={openCases} sub={`${openCritical} critical`} accent="sev-critical" onClick={() => {}} />
          </div>
        </div>
      </div>

      {/* Severity breakdown */}
      <Section
        title="Alerts by Base Station — Severity Breakdown"
        action={<Button variant="ghost" className="gap-1 text-sm">View alert log <ArrowUpRight className="size-3" /></Button>}
      >
        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
          {stations.map((s) => {
            const isActive = selectedStations.includes(s.name);
            return (
              <button
                key={s.name}
                onClick={() => toggleStation(s.name)}
                style={isActive ? {
                  backgroundColor: `color-mix(in srgb, ${s.color} 15%, transparent)`,
                  borderColor: `color-mix(in srgb, ${s.color} 40%, transparent)`,
                  color: s.color,
                } : undefined}
                className={cn(
                  "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-semibold transition-colors",
                  isActive ? "border-current/30" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}
              >
                <span className="size-1.5 flex-shrink-0 rounded-full" style={{ background: s.color }} />
                {s.name}
                <span className={cn("rounded-full px-1 py-px font-mono text-3xs", isActive ? "bg-white/10" : "bg-muted text-muted-foreground")}>
                  {s.total}
                </span>
              </button>
            );
          })}
        </div>

        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                cursor={{ stroke: "var(--muted-foreground)", strokeOpacity: 0.3 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
              {stations.filter((s) => selectedStations.includes(s.name)).map((s) => (
                <Line key={s.name} type="monotone" dataKey={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {stations.filter((s) => selectedStations.includes(s.name)).map((s) => (
            <Popover key={s.name}>
              <PopoverTrigger asChild>
                <button className="group flex flex-col gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/40">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 flex-shrink-0 rounded-full" style={{ background: s.color }} />
                    <TruncatedText text={s.name} className="min-w-0 flex-1 text-xs font-semibold text-foreground" />
                  </div>
                  <p className="inline-flex items-baseline gap-1 font-mono">
                    <span className="text-2xl font-bold leading-none text-foreground">{s.total}</span>
                    <span className="text-2xs text-muted-foreground">alerts</span>
                  </p>
                  <div className="flex items-center gap-1.5 text-2xs">
                    <SevPill kind="critical" value={s.critical} />
                    <SevPill kind="medium" value={s.medium} />
                    <SevPill kind="low" value={s.low} />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-0">
                <div className="border-b border-border px-3 py-2.5">
                  <p className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
                    <span className="size-2.5 flex-shrink-0 rounded-full" style={{ background: s.color }} />
                    {s.name}
                  </p>
                  <p className="mt-0.5 text-2xs text-muted-foreground">
                    <strong className="font-mono text-foreground">{s.total}</strong> alerts in this range
                  </p>
                </div>
                <div className="px-3 py-3">
                  <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Severity breakdown
                  </p>
                  <div className="space-y-1.5">
                    <SevRow kind="critical" value={s.critical} total={s.total} />
                    <SevRow kind="medium" value={s.medium} total={s.total} />
                    <SevRow kind="low" value={s.low} total={s.total} />
                  </div>
                </div>
                <div className="border-t border-border bg-muted/20 px-3 py-2.5">
                  <button className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                    View alerts for this station
                    <ArrowUpRight className="size-3" />
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      </Section>

      {/* Detected alert events + Incident cases */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section
          title="Detected Alert Events"
          action={<Button variant="ghost" className="gap-1 text-sm">View all <ArrowUpRight className="size-3" /></Button>}
        >
          <div className="space-y-2">
            {ALERT_EVENTS.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2"
                style={{ borderLeftWidth: 3, borderLeftColor: `var(--sev-${e.severity})` }}
              >
                <SevBadge kind={e.severity} />
                <div className="min-w-0 flex-1">
                  <TruncatedText text={e.title} className="text-base font-semibold text-foreground" />
                  <TruncatedText text={e.summary} className="text-xs text-muted-foreground" />
                </div>
                {e.caseId && (
                  <span className="inline-flex flex-shrink-0 items-center rounded-full border border-info/30 bg-info/15 px-1.5 py-0.5 font-mono text-2xs font-semibold text-info">
                    {e.caseId}
                  </span>
                )}
                <span className="font-mono text-2xs text-muted-foreground">{e.time}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Incident Cases"
          action={<Button variant="ghost" className="gap-1 text-sm">View all <ArrowUpRight className="size-3" /></Button>}
        >
          <div className="space-y-2">
            {CASES.map((c) => (
              <div key={c.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2">
                <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FolderOpen className="size-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <TruncatedText text={c.title} className="text-base font-semibold text-foreground" />
                  <TruncatedText text={`${c.id} · ${c.station} · ${c.assignee}`} className="text-xs text-muted-foreground" />
                </div>
                <SevBadge kind={c.severity} />
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Activity log summary */}
      <Section
        title="Recent Activity Log"
        action={
          <Button variant="ghost" className="gap-1 text-sm">
            <ScrollText className="size-3" />
            View full log <ArrowUpRight className="size-3" />
          </Button>
        }
      >
        <div className="-mx-4 -my-4">
          <div className="grid grid-cols-[96px_140px_1fr] gap-4 border-b border-border bg-muted/30 px-4 py-2">
            <p className="text-3xs font-semibold uppercase tracking-widest text-muted-foreground">When</p>
            <p className="text-3xs font-semibold uppercase tracking-widest text-muted-foreground">Type</p>
            <p className="text-3xs font-semibold uppercase tracking-widest text-muted-foreground">Activity</p>
          </div>
          {ACTIVITY.map((a) => {
            const ks = ACTIVITY_KIND_STYLES[a.kind];
            return (
              <div key={a.id} className="grid grid-cols-[96px_140px_1fr] gap-4 border-b border-border/60 px-4 py-2.5 last:border-b-0 hover:bg-muted/20">
                <div className="min-w-0">
                  <TruncatedText text={a.whenRelative} className="font-mono text-2xs text-muted-foreground" />
                  <TruncatedText text={a.module} className="mt-0.5 text-2xs text-muted-foreground/60" />
                </div>
                <div>
                  <span className={cn("inline-flex w-fit max-w-full items-center truncate whitespace-nowrap rounded px-1.5 py-0.5 text-3xs font-bold uppercase tracking-wider", ks.bg, ks.text)}>
                    {ACTIVITY_KIND_LABELS[a.kind]}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm leading-snug text-foreground">
                    <span className="font-semibold">{a.actor}</span>{" "}
                    <span className="text-muted-foreground">{a.text}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
