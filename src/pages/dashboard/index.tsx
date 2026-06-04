import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell,
} from "recharts";
import {
  FolderOpen,
  ArrowUpRight,
  ScrollText,
  MapPin,
  Filter,
  Check,
  ChevronDown,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Power,
  Video,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { KpiCard, KpiGrid } from "@/components/shared/KpiCard";
import { DateRangeBar } from "@/components/shared/DateRangeBar";
import { cn } from "@/lib/utils";
import { useCamerasStore } from "@/stores/useCamerasStore";
import { useSitesStore } from "@/stores/useSitesStore";
import { MOCK_EVENTS } from "@/mocks/detectionFeed";
import { MOCK_CASES } from "@/mocks/incidentCases";
import { MOCK_ACTIVITY_LOGS, ACTIVITY_KIND_LABELS, ACTIVITY_KIND_STYLES } from "@/mocks/activityLogs";

/* ── Zone severity thresholds (configurable in System Config) ───────── */
export const ZONE_SEVERITY_THRESHOLDS = {
  critical: 5,
  warning: 2,
};

/* Reference "today" for date-range filtering — matches newest event in mocks. */
const REFERENCE_TODAY = "2026-05-19";

/* ── Section Card ────────────────────────────────────────────────────── */

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <p className="text-[13px] font-bold text-foreground">{title}</p>
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

/** Compact severity chip used in the per-site detection cards. */
function SevPill({ kind, value }: { kind: SevKind; value: number }) {
  const s = SEV_STYLES[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold",
        s.bg, s.text, "border-current/30"
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {value}
    </span>
  );
}

/** Severity row used inside the per-site popover — label + bar + count. */
function SevRow({ kind, value, total }: { kind: SevKind; value: number; total: number }) {
  const s = SEV_STYLES[kind];
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className={cn("inline-flex items-center gap-1 font-bold", s.text)}>
        <span className={cn("size-1.5 rounded-full", s.dot)} />
        {s.label}
      </span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", s.dot)}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
      <span className="w-12 text-right font-mono text-foreground">
        {value}{" "}
        <span className="text-muted-foreground">· {pct}%</span>
      </span>
    </div>
  );
}

const ZONE_STATUS_STYLES = {
  critical: { bg: "bg-sev-critical/15", border: "border-sev-critical/40", text: "text-sev-critical", label: "Critical", dot: "bg-sev-critical" },
  warning:  { bg: "bg-warning/15",      border: "border-warning/40",      text: "text-warning",      label: "Warning",  dot: "bg-warning" },
  normal:   { bg: "bg-success/15",      border: "border-success/40",      text: "text-success",      label: "Normal",   dot: "bg-success" },
  offline:  { bg: "bg-muted",           border: "border-border",          text: "text-muted-foreground", label: "Offline", dot: "bg-muted-foreground/60" },
};

function zoneStatus(count: number, offline: boolean): keyof typeof ZONE_STATUS_STYLES {
  if (offline) return "offline";
  if (count >= ZONE_SEVERITY_THRESHOLDS.critical) return "critical";
  if (count >= ZONE_SEVERITY_THRESHOLDS.warning) return "warning";
  return "normal";
}

/* ── Per-site colors — Sembawang locked to warning yellow per request ─ */
const SITE_COLOR_MAP: Record<string, string> = {
  "Sembawang Naval": "var(--warning)",
  "Astra HQ":        "var(--success)",
  "FedEx Changi":    "var(--info)",
};
const SITE_FALLBACK_COLORS = ["var(--info)", "var(--success)", "var(--warning)", "var(--secondary)", "var(--sev-critical)", "var(--primary)"];
function siteColor(siteName: string, idx: number) {
  return SITE_COLOR_MAP[siteName] ?? SITE_FALLBACK_COLORS[idx % SITE_FALLBACK_COLORS.length];
}

/* ── System Health row tile ─────────────────────────────────────────── */

function SysRow({
  icon: Icon, label, value, pct, tone,
}: {
  icon: React.ElementType; label: string; value: string; pct: number; tone: "ok" | "warn" | "crit";
}) {
  const t =
    tone === "crit" ? { bar: "bg-sev-critical", txt: "text-sev-critical" } :
    tone === "warn" ? { bar: "bg-warning",      txt: "text-warning" } :
                      { bar: "bg-success",      txt: "text-success" };
  return (
    <div className="rounded-md border border-border bg-background px-2.5 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <Icon className="size-3" />
          {label}
        </span>
        <span className={cn("font-mono text-[13px] font-bold leading-none", t.txt)}>{value}</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", t.bar)} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

/* ── Site multi-select dropdown ──────────────────────────────────────── */

function SiteMultiSelect({
  options, selected, onChange,
}: {
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const allSelected = selected.length === 0 || selected.length === options.length;
  const label =
    selected.length === 0 || selected.length === options.length
      ? "All sites"
      : selected.length === 1
        ? options.find((o) => o.id === selected[0])?.name ?? "1 site"
        : `${selected.length} sites`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold transition-colors",
            allSelected
              ? "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              : "border-primary bg-primary/10 text-primary"
          )}
        >
          <Filter className="size-3" />
          {label}
          <ChevronDown className="size-3 opacity-70" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Filter by site</p>
          <button
            onClick={() => onChange([])}
            className="text-[10px] font-semibold uppercase tracking-wider text-primary hover:underline"
          >
            All
          </button>
        </div>
        <div className="max-h-64 space-y-0.5 overflow-y-auto">
          {options.map((o) => {
            const checked = selected.includes(o.id);
            return (
              <button
                key={o.id}
                onClick={() => onChange(checked ? selected.filter((s) => s !== o.id) : [...selected, o.id])}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] hover:bg-muted/60"
              >
                <span
                  className={cn(
                    "flex size-3.5 flex-shrink-0 items-center justify-center rounded-sm border",
                    checked ? "border-primary bg-primary text-primary-foreground" : "border-input"
                  )}
                >
                  {checked && <Check className="size-2.5" strokeWidth={3} />}
                </span>
                <span className="truncate text-foreground">{o.name}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ── System Health donut ─────────────────────────────────────────────── */

function SystemHealthDonut({ healthPct }: { healthPct: number }) {
  const tone = healthPct >= 80 ? "var(--success)" : healthPct >= 50 ? "var(--warning)" : "var(--sev-critical)";
  const data = [
    { name: "Healthy", value: healthPct },
    { name: "Issues",  value: Math.max(0, 100 - healthPct) },
  ];
  return (
    <div className="relative mx-auto h-[150px] w-[150px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius="70%"
            outerRadius="95%"
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            <Cell fill={tone} />
            <Cell fill="var(--muted)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="font-mono text-[26px] font-bold leading-none" style={{ color: tone }}>{healthPct}%</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Healthy</p>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

type DateRange = "today" | "yesterday" | "week" | "month" | "custom";

function shiftDate(iso: string, days: number) {
  // Pure string math against the fixed reference window — keeps the mock deterministic.
  // ISO format YYYY-MM-DD.
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const cameras = useCamerasStore((s) => s.cameras);
  const sites = useSitesStore((s) => s.sites);

  /* ── Date filter state ───────────────────────────────────────────── */
  const [dateRange, setDateRange] = React.useState<DateRange>("today");
  const [customFrom, setCustomFrom] = React.useState("");
  const [customTo, setCustomTo] = React.useState("");

  const dateFilters: { key: DateRange; label: string }[] = [
    { key: "today",     label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "week",      label: "This Week" },
    { key: "month",     label: "This Month" },
  ];

  const dateBounds = React.useMemo<{ from: string; to: string }>(() => {
    if (dateRange === "today")     return { from: REFERENCE_TODAY,             to: REFERENCE_TODAY };
    if (dateRange === "yesterday") return { from: shiftDate(REFERENCE_TODAY, -1), to: shiftDate(REFERENCE_TODAY, -1) };
    if (dateRange === "week")      return { from: shiftDate(REFERENCE_TODAY, -6), to: REFERENCE_TODAY };
    if (dateRange === "month")     return { from: shiftDate(REFERENCE_TODAY, -29), to: REFERENCE_TODAY };
    if (dateRange === "custom" && customFrom && customTo) {
      return customFrom <= customTo ? { from: customFrom, to: customTo } : { from: customTo, to: customFrom };
    }
    return { from: "", to: "" };
  }, [dateRange, customFrom, customTo]);

  const dateLabel =
    dateRange === "custom" && customFrom && customTo ? `${customFrom} → ${customTo}` :
    dateRange === "custom" ? "Custom range" :
    dateFilters.find((f) => f.key === dateRange)?.label ?? "Today";

  /* ── Filtered events / cases ─────────────────────────────────────── */
  const filteredEvents = React.useMemo(() => {
    if (!dateBounds.from || !dateBounds.to) return MOCK_EVENTS;
    return MOCK_EVENTS.filter((e) => e.date >= dateBounds.from && e.date <= dateBounds.to);
  }, [dateBounds]);

  const filteredCases = React.useMemo(() => {
    if (!dateBounds.from || !dateBounds.to) return MOCK_CASES;
    return MOCK_CASES.filter((c) => {
      const d = c.createdAt.slice(0, 10);
      return d >= dateBounds.from && d <= dateBounds.to;
    });
  }, [dateBounds]);

  /* ── Derived stats ───────────────────────────────────────────────── */
  const camOnline = cameras.filter((c) => c.status === "online").length;
  const camTotal = cameras.length;
  const eventsInRange = filteredEvents.length;
  const casesOpen = filteredCases.filter((c) => c.status === "open" || c.status === "in-review").length;
  const casesEscalated = filteredCases.filter((c) => c.severity === "critical").length;

  // Detections grouped by site → { site, critical, medium, low, total }
  const detectionsBySite = React.useMemo(() => {
    const map = new Map<string, { site: string; critical: number; medium: number; low: number; total: number }>();
    for (const e of filteredEvents) {
      if (!map.has(e.siteDisplay)) {
        map.set(e.siteDisplay, { site: e.siteDisplay, critical: 0, medium: 0, low: 0, total: 0 });
      }
      const row = map.get(e.siteDisplay)!;
      row[e.severity] += 1;
      row.total += 1;
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredEvents]);

  // Per-site weekly trend (synthetic distribution, scaled by site totals)
  const siteTrend = React.useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const maxTotal = Math.max(1, ...detectionsBySite.map((s) => s.total));
    return days.map((day, di) => {
      const row: Record<string, string | number> = { day };
      detectionsBySite.forEach((s, si) => {
        const peak = 6 + (s.total / maxTotal) * 18;
        const wave = (Math.sin((di + si * 1.6) * 0.9) + 1) / 2;
        row[s.site] = Math.round(peak * (0.4 + 0.6 * wave));
      });
      return row;
    });
  }, [detectionsBySite]);

  // Zone areas + per-camera event breakdown
  type ZoneCameraStat = { camera: string; total: number; critical: number; medium: number; low: number };
  type ZoneRow = {
    area: string; site: string; siteKey: string;
    counts: { critical: number; medium: number; low: number };
    total: number;
    cameras: number;          // unique cameras detected events here
    cameraOffline: boolean;
    cameraStats: ZoneCameraStat[];
  };

  const zoneAreas: ZoneRow[] = React.useMemo(() => {
    const map = new Map<string, ZoneRow>();
    for (const e of filteredEvents) {
      const key = `${e.site}__${e.area}`;
      if (!map.has(key)) {
        map.set(key, {
          area: e.areaDisplay, site: e.siteDisplay, siteKey: e.site,
          counts: { critical: 0, medium: 0, low: 0 }, total: 0,
          cameras: 0, cameraOffline: false, cameraStats: [],
        });
      }
      const row = map.get(key)!;
      row.counts[e.severity] += 1;
      row.total += 1;

      let cs = row.cameraStats.find((s) => s.camera === e.camera);
      if (!cs) {
        cs = { camera: e.camera, total: 0, critical: 0, medium: 0, low: 0 };
        row.cameraStats.push(cs);
      }
      cs.total += 1;
      cs[e.severity] += 1;
    }
    for (const row of map.values()) {
      const camsInArea = cameras.filter((c) => {
        const siteMatch = c.siteName === row.site || c.siteId.includes(row.site.toLowerCase().split(" ")[0]);
        const areaMatch = c.areaName === row.area;
        return siteMatch && areaMatch;
      });
      // camera count = distinct cameras seen in events (matches popup contents)
      row.cameras = Math.max(camsInArea.length, row.cameraStats.length);
      row.cameraOffline = camsInArea.length > 0 && camsInArea.every((c) => c.status !== "online");
      row.cameraStats.sort((a, b) => b.total - a.total);
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredEvents, cameras]);

  // Site filter for zone areas section
  const siteFilterOptions = React.useMemo(() => {
    const seen = new Map<string, string>();
    for (const z of zoneAreas) if (!seen.has(z.siteKey)) seen.set(z.siteKey, z.site);
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [zoneAreas]);
  const [zoneSiteFilter, setZoneSiteFilter] = React.useState<string[]>([]);
  const filteredZoneAreas = React.useMemo(() => {
    if (zoneSiteFilter.length === 0) return zoneAreas;
    return zoneAreas.filter((z) => zoneSiteFilter.includes(z.siteKey));
  }, [zoneAreas, zoneSiteFilter]);

  const zoneSummary = React.useMemo(() => {
    const out = { critical: 0, warning: 0, normal: 0, offline: 0 };
    for (const z of filteredZoneAreas) out[zoneStatus(z.total, z.cameraOffline)] += 1;
    return out;
  }, [filteredZoneAreas]);

  const camerasBySite = sites.map((s) => ({
    name: s.name,
    online: cameras.filter((c) => c.siteId === s.id && c.status === "online").length,
    offline: cameras.filter((c) => c.siteId === s.id && c.status !== "online").length,
  }));

  // Recent events / cases (top N from filtered)
  const recentEvents = [...filteredEvents]
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
    .slice(0, 5);
  const recentCases = [...filteredCases]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  const recentActivity = MOCK_ACTIVITY_LOGS.slice(0, 8);

  const sitesTotal = sites.length;
  const sitesActive = sites.filter((s) => s.status === "active").length;

  /* ── System health metrics + overall % ───────────────────────────── */
  const healthMetrics: { label: string; value: string; pct: number; tone: "ok" | "warn" | "crit"; icon: React.ElementType }[] = [
    { label: "CPU",      value: "42%", pct: 42, tone: "ok",   icon: Cpu },
    { label: "Memory",   value: "68%", pct: 68, tone: "warn", icon: MemoryStick },
    { label: "Disk I/O", value: "24%", pct: 24, tone: "ok",   icon: HardDrive },
    { label: "Network",  value: "18%", pct: 18, tone: "ok",   icon: Network },
    { label: "Uptime",   value: "42d", pct: 92, tone: "ok",   icon: Power },
  ];
  const healthPct = Math.round(
    (healthMetrics.filter((m) => m.tone === "ok").length / healthMetrics.length) * 100
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Dashboard</PageHeader.Title>
          <PageHeader.Description>
            Workspace-wide overview — pulled live from cameras, detections, incidents, deployments and storage.
          </PageHeader.Description>
        </PageHeader.Content>
      </PageHeader>

      {/* Date filter row */}
      <DateRangeBar
        presets={dateFilters}
        active={dateRange}
        onSelect={(k) => setDateRange(k as DateRange)}
        customFrom={customFrom}
        customTo={customTo}
        onCustomChange={(f, t) => { setCustomFrom(f); setCustomTo(t); }}
        onCustomApply={(f, t) => { setCustomFrom(f); setCustomTo(t); }}
        onCustomReset={() => { setCustomFrom(""); setCustomTo(""); setDateRange("today"); }}
        showingLabel={
          <>
            Showing <strong className="text-foreground">{dateLabel}</strong>
            <span className="ml-2 text-muted-foreground/60">· {eventsInRange} event{eventsInRange === 1 ? "" : "s"}</span>
          </>
        }
      />

      {/* Top KPI strip */}
      <KpiGrid cols={4}>
        <KpiCard
          label="Sites"
          value={sitesTotal}
          sub={`${sitesActive} active`}
          accent="primary"
          onClick={() => navigate("/site/overview")}
        />
        <KpiCard
          label="Cameras"
          value={<>{camOnline}<span className="text-[14px] text-muted-foreground"> / {camTotal}</span></>}
          sub={`${camTotal - camOnline} offline`}
          accent="success"
          onClick={() => navigate("/site/cameras")}
        />
        <KpiCard
          label="Events"
          value={eventsInRange}
          sub={dateLabel}
          accent="info"
          onClick={() => navigate("/detection-feed")}
        />
        <KpiCard
          label="Open Cases"
          value={casesOpen}
          sub={`${casesEscalated} critical`}
          accent="sev-critical"
          onClick={() => navigate("/incidents")}
        />
      </KpiGrid>

      {/* Detections trend + System Health (side-by-side) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section
            title="Detections by Site — Severity Breakdown"
            action={
              <Button variant="ghost" className="gap-1 text-[12px]" onClick={() => navigate("/detection-feed")}>
                View feed <ArrowUpRight className="size-3" />
              </Button>
            }
          >
            {detectionsBySite.length === 0 ? (
              <p className="px-3 py-8 text-center text-[12px] italic text-muted-foreground">No detections recorded in this range.</p>
            ) : (
              <>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={siteTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                      <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                      <Tooltip
                        contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                        cursor={{ stroke: "var(--muted-foreground)", strokeOpacity: 0.3 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                      {detectionsBySite.map((s, i) => (
                        <Line
                          key={s.site}
                          type="monotone"
                          dataKey={s.site}
                          stroke={siteColor(s.site, i)}
                          strokeWidth={2}
                          dot={{ r: 2.5 }}
                          activeDot={{ r: 4 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {detectionsBySite.slice(0, 4).map((s, i) => {
                    const color = siteColor(s.site, i);
                    return (
                      <Popover key={s.site}>
                        <PopoverTrigger asChild>
                          <button
                            className="group flex flex-col gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/40"
                          >
                            {/* Row 1: site name + colored dot */}
                            <div className="flex items-center gap-1.5">
                              <span
                                className="size-2.5 flex-shrink-0 rounded-full"
                                style={{ background: color }}
                              />
                              <p className="min-w-0 flex-1 truncate text-[11px] font-semibold text-foreground">
                                {s.site}
                              </p>
                            </div>
                            {/* Row 2: big number */}
                            <p className="inline-flex items-baseline gap-1 font-mono">
                              <span className="text-[22px] font-bold leading-none text-foreground">
                                {s.total}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                detections
                              </span>
                            </p>
                            {/* Row 3: severity breakdown chips */}
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <SevPill kind="critical" value={s.critical} />
                              <SevPill kind="medium"   value={s.medium} />
                              <SevPill kind="low"      value={s.low} />
                            </div>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-64 p-0">
                          <div className="border-b border-border px-3 py-2.5">
                            <p className="inline-flex items-center gap-1.5 text-[12px] font-bold text-foreground">
                              <span
                                className="size-2.5 flex-shrink-0 rounded-full"
                                style={{ background: color }}
                              />
                              {s.site}
                            </p>
                            <p className="mt-0.5 text-[10px] text-muted-foreground">
                              <strong className="font-mono text-foreground">{s.total}</strong> detections in this range
                            </p>
                          </div>
                          <div className="px-3 py-3">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Severity breakdown
                            </p>
                            <div className="space-y-1.5">
                              <SevRow kind="critical" value={s.critical} total={s.total} />
                              <SevRow kind="medium"   value={s.medium}   total={s.total} />
                              <SevRow kind="low"      value={s.low}      total={s.total} />
                            </div>
                          </div>
                          <div className="border-t border-border bg-muted/20 px-3 py-2.5">
                            <button
                              onClick={() => navigate("/detection-feed")}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                            >
                              View feed for this site
                              <ArrowUpRight className="size-3" />
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    );
                  })}
                </div>
              </>
            )}
          </Section>
        </div>

        <Section
          title="System Health"
          action={
            <span className="inline-flex items-center gap-1.5 text-[11px] text-success">
              <span className="size-1.5 animate-pulse rounded-full bg-success" />
              Live
            </span>
          }
        >
          <SystemHealthDonut healthPct={healthPct} />
          <div className="mt-3 space-y-1.5">
            {healthMetrics.map((m) => (
              <SysRow key={m.label} icon={m.icon} label={m.label} value={m.value} pct={m.pct} tone={m.tone} />
            ))}
          </div>
        </Section>
      </div>

      {/* Zone Areas — compact cards with click popover */}
      <Section
        title="Zone Areas"
        action={
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="size-1.5 rounded-full bg-sev-critical" /> {zoneSummary.critical}
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="size-1.5 rounded-full bg-warning" /> {zoneSummary.warning}
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success" /> {zoneSummary.normal}
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="size-1.5 rounded-full bg-muted-foreground/60" /> {zoneSummary.offline}
            </span>
            <SiteMultiSelect options={siteFilterOptions} selected={zoneSiteFilter} onChange={setZoneSiteFilter} />
          </div>
        }
      >
        {filteredZoneAreas.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12px] italic text-muted-foreground">
            {zoneSiteFilter.length > 0 ? "No zones match the selected sites." : "No detections recorded in this range."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {filteredZoneAreas.map((z) => {
              const status = zoneStatus(z.total, z.cameraOffline);
              const s = ZONE_STATUS_STYLES[status];
              return (
                <Popover key={`${z.site}-${z.area}`}>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "group flex flex-col gap-1 rounded-lg border bg-background px-2.5 py-2 text-left transition-colors hover:border-primary/40",
                        s.border
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <MapPin className={cn("size-3 flex-shrink-0", s.text)} />
                        <p className="truncate text-[11px] font-semibold text-foreground">{z.area}</p>
                      </div>
                      <p className="truncate text-[10px] text-muted-foreground">{z.site}</p>
                      <div className="mt-0.5 flex items-center justify-between gap-1.5">
                        <span className="inline-flex items-baseline gap-1 font-mono">
                          <span className="text-[15px] font-bold leading-none text-foreground">{z.total}</span>
                          <span className="text-[9px] text-muted-foreground">inc</span>
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
                          <Video className="size-2.5" />
                          {z.cameras}
                        </span>
                      </div>
                      <span className={cn(
                        "mt-0.5 inline-flex w-fit items-center gap-1 rounded-full border px-1.5 py-px text-[8px] font-bold uppercase tracking-wider",
                        s.bg, s.border, s.text
                      )}>
                        <span className={cn("size-1 rounded-full", s.dot)} />
                        {s.label}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-72 p-0">
                    <div className="border-b border-border px-3 py-2.5">
                      <p className="inline-flex items-center gap-1.5 text-[12px] font-bold text-foreground">
                        <MapPin className={cn("size-3", s.text)} />
                        {z.area}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{z.site}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-[10px]">
                        <span className="font-mono"><strong className="text-foreground">{z.total}</strong> incidents</span>
                        <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-sev-critical" />{z.counts.critical}</span>
                        <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-warning" />{z.counts.medium}</span>
                        <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-info" />{z.counts.low}</span>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1.5">
                      <p className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Cameras</p>
                      {z.cameraStats.length === 0 ? (
                        <p className="px-2 py-3 text-center text-[11px] italic text-muted-foreground">No camera-attributed events.</p>
                      ) : z.cameraStats.map((cs) => (
                        <div key={cs.camera} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60">
                          <Video className="size-3 flex-shrink-0 text-muted-foreground" />
                          <p className="min-w-0 flex-1 truncate text-[12px] font-semibold text-foreground">{cs.camera}</p>
                          <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            {cs.critical > 0 && <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-sev-critical" />{cs.critical}</span>}
                            {cs.medium   > 0 && <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-warning" />{cs.medium}</span>}
                            {cs.low      > 0 && <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-info" />{cs.low}</span>}
                            <span className="ml-1 font-mono font-bold text-foreground">{cs.total}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-border px-3 py-2">
                      <button
                        onClick={() => navigate("/detection-feed")}
                        className="inline-flex w-full items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/10"
                      >
                        View events for this zone <ArrowUpRight className="size-3" />
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        )}
      </Section>

      {/* Recent events + Cases */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Recent Detections"
          action={<Button variant="ghost" className="gap-1 text-[12px]" onClick={() => navigate("/detection-feed")}>
            View all <ArrowUpRight className="size-3" />
          </Button>}>
          <div className="space-y-2">
            {recentEvents.length === 0 ? (
              <p className="px-3 py-6 text-center text-[12px] italic text-muted-foreground">No detections in this range.</p>
            ) : recentEvents.map((e) => {
              const sv = SEV_STYLES[e.severity];
              return (
                <div key={e.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2"
                  style={{ borderLeftWidth: 3, borderLeftColor: `var(--sev-${e.severity})` }}>
                  <span className={cn("inline-flex items-center gap-1 rounded-full border border-current px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", sv.bg, sv.text)}>
                    {sv.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-foreground">{e.typeLabel}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{e.summary}</p>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">{e.time}</span>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Incident Cases"
          action={<Button variant="ghost" className="gap-1 text-[12px]" onClick={() => navigate("/incidents")}>
            View all <ArrowUpRight className="size-3" />
          </Button>}>
          <div className="space-y-2">
            {recentCases.length === 0 ? (
              <p className="px-3 py-6 text-center text-[12px] italic text-muted-foreground">No cases in this range.</p>
            ) : recentCases.map((c) => {
              const sv = SEV_STYLES[c.severity];
              return (
                <div key={c.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2">
                  <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                    <FolderOpen className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-foreground">{c.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {c.id} · {c.siteDisplay} · {c.assignedTo.name}
                    </p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 rounded-full border border-current px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", sv.bg, sv.text)}>
                    {sv.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      {/* Cameras by Sites + Activity Log */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Cameras by Site"
          action={<Button variant="ghost" className="gap-1 text-[12px]" onClick={() => navigate("/site/overview")}>
            Sites <ArrowUpRight className="size-3" />
          </Button>}>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={camerasBySite} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} interval={0} angle={-12} textAnchor="end" height={50} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                />
                <Bar dataKey="online"  stackId="a" fill="var(--success)"      radius={[0, 0, 0, 0]} />
                <Bar dataKey="offline" stackId="a" fill="var(--sev-critical)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-sm bg-success" />
              Online
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-sm bg-sev-critical" />
              Offline
            </span>
          </div>
        </Section>

        <Section
          title="Recent Activity Log"
          action={
            <Button variant="ghost" className="gap-1 text-[12px]" onClick={() => navigate("/activity-logs")}>
              <ScrollText className="size-3" />
              View full log <ArrowUpRight className="size-3" />
            </Button>
          }
        >
          {/* Height matches the Cameras by Site chart (h-[260px] + ~24px legend = ~300px) */}
          <div className="-mx-4 -my-4">
            <div className="grid grid-cols-[120px_70px_1fr] gap-3 border-b border-border bg-muted/30 px-4 py-2">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">When</p>
              <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Type</p>
              <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Activity</p>
            </div>
            <div className="h-[268px] overflow-y-auto">
              {recentActivity.map((a) => {
                const ks = ACTIVITY_KIND_STYLES[a.kind];
                return (
                  <div
                    key={a.id}
                    className="grid grid-cols-[120px_70px_1fr] gap-3 border-b border-border/60 px-4 py-2.5 last:border-b-0 hover:bg-muted/20"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[10px] text-muted-foreground">
                        {a.whenRelative}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground/60">
                        {a.module}
                      </p>
                    </div>
                    <div>
                      <span
                        className={cn(
                          "inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                          ks.bg,
                          ks.text
                        )}
                      >
                        {ACTIVITY_KIND_LABELS[a.kind]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-[12px] leading-snug text-foreground">
                        <span className="font-semibold">{a.actor.name}</span>{" "}
                        <span className="text-muted-foreground">{a.text}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
