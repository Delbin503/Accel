import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BarChart, LineChart } from "@accel/ui/components/charts";
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
  TriangleAlert,
  X,
} from "lucide-react";
import { PageHeader } from "@accel/ui/components/layout/PageHeader";
import { Button } from "@accel/ui/components/ui/button";
import { ItemButton } from "@accel/ui/components/ui/item";
import { SegmentedControl, SegmentedControlItem } from "@accel/ui/components/ui/segmented-control";
import { Popover, PopoverContent, PopoverTrigger } from "@accel/ui/components/ui/popover";
import { KpiCard, KpiGrid, type KpiTrend } from "@accel/ui/components/shared/KpiCard";
import { DateRangeBar } from "@accel/ui/components/shared/DateRangeBar";
import { TruncatedText } from "@accel/ui/components/shared/TruncatedText";
import { cn } from "@accel/ui/lib/utils";
import { useCamerasStore } from "@/stores/useCamerasStore";
import { useSitesStore } from "@/stores/useSitesStore";
import { MOCK_EVENTS } from "@/mocks/detectionFeed";
import { MOCK_CASES } from "@/mocks/incidentCases";
import { MOCK_ACTIVITY_LOGS, ACTIVITY_KIND_LABELS, ACTIVITY_KIND_STYLES } from "@/mocks/activityLogs";
import { MOCK_NVRS } from "@/mocks/nvr";

/* Reference "today" for date-range filtering — matches newest event in mocks. */
const REFERENCE_TODAY = "2026-05-19";

/* ── Section Card ────────────────────────────────────────────────────── */

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div data-slot="dashboard-section" className="overflow-hidden rounded-xl border border-border bg-card">
      <div data-slot="dashboard-section-header" className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <TruncatedText text={title} className="min-w-0 flex-1 text-base font-bold text-foreground" />
        {action}
      </div>
      <div data-slot="dashboard-section-content" className="p-4">{children}</div>
    </div>
  );
}

/* ── Severity styles ─────────────────────────────────────────────────── */

const SEV_STYLES = {
  critical: { bg: "bg-severity-critical/15", text: "text-severity-critical", label: "Critical", dot: "bg-severity-critical" },
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
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-2xs font-bold",
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
    <div data-slot="sev-row" className="flex items-center gap-2 text-xs">
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

/* ── Per-site colors — Sembawang locked to warning yellow per request ─ */
const SITE_COLOR_MAP: Record<string, string> = {
  "Sembawang Naval": "var(--warning)",
  "Astra HQ":        "var(--success)",
  "FedEx Changi":    "var(--info)",
};
const SITE_FALLBACK_COLORS = ["var(--info)", "var(--success)", "var(--warning)", "var(--secondary)", "var(--severity-critical)", "var(--primary)"];
function siteColor(siteName: string, idx: number) {
  return SITE_COLOR_MAP[siteName] ?? SITE_FALLBACK_COLORS[idx % SITE_FALLBACK_COLORS.length];
}

/* ── Site chip row for trend chart ──────────────────────────────────── */

const MAX_CHART_SITES = 5;

function SiteChipRow({
  sites,
  selected,
  onChange,
}: {
  sites: { name: string; count: number; color: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function handleToggle(name: string) {
    if (selected.includes(name)) {
      if (selected.length === 1) return;
      onChange(selected.filter((s) => s !== name));
    } else {
      if (selected.length >= MAX_CHART_SITES) {
        const oldest = selected[0];
        onChange([...selected.slice(1), name]);
        toast(`${oldest} removed — max ${MAX_CHART_SITES} sites visible at once`);
      } else {
        onChange([...selected, name]);
      }
    }
  }

  return (
    <SegmentedControl
      data-slot="site-chip-row"
      type="multiple"
      variant="outline"
      value={selected}
      onValueChange={(next) => {
        const changed = next.find((n) => !selected.includes(n)) ?? selected.find((n) => !next.includes(n));
        if (changed) handleToggle(changed);
      }}
      className="mb-3 flex flex-nowrap gap-1.5 overflow-x-auto pb-1"
    >
      {sites.map((s) => {
        const isActive = selected.includes(s.name);
        return (
          <SegmentedControlItem
            key={s.name}
            value={s.name}
            style={isActive ? {
              backgroundColor: `color-mix(in srgb, ${s.color} 15%, transparent)`,
              borderColor: `color-mix(in srgb, ${s.color} 40%, transparent)`,
              color: s.color,
            } : undefined}
            className={cn(
              "h-auto flex-shrink-0 gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-semibold transition-colors",
              isActive
                ? "border-current/30 hover:bg-transparent"
                : "border-border bg-transparent text-muted-foreground hover:border-primary/30 hover:bg-transparent hover:text-foreground"
            )}
          >
            <span className="size-1.5 flex-shrink-0 rounded-full" style={{ background: s.color }} />
            {s.name}
            <span className={cn(
              "rounded-full px-1 py-px font-mono text-3xs",
              isActive ? "bg-media-foreground/10" : "bg-muted text-muted-foreground"
            )}>
              {s.count}
            </span>
          </SegmentedControlItem>
        );
      })}
    </SegmentedControl>
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
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-auto gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold transition-colors",
            allSelected
              ? "border-border bg-transparent text-muted-foreground hover:border-primary/30 hover:bg-transparent hover:text-foreground aria-expanded:bg-transparent aria-expanded:text-foreground dark:border-border dark:bg-transparent dark:hover:bg-transparent"
              : "border-primary bg-primary/10 text-primary-ink hover:bg-primary/10 hover:text-primary-ink aria-expanded:bg-primary/10 aria-expanded:text-primary-ink dark:border-primary dark:bg-primary/10 dark:hover:bg-primary/10"
          )}
        >
          <Filter className="size-3" />
          {label}
          <ChevronDown className="size-3 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Filter by site</p>
          <Button variant="link"
            onClick={() => onChange([])}
            className="h-auto p-0 border-0 text-2xs font-semibold uppercase tracking-wider text-primary-ink hover:underline"
          >
            All
          </Button>
        </div>
        <div className="max-h-64 space-y-0.5 overflow-y-auto">
          {options.map((o) => {
            const checked = selected.includes(o.id);
            return (
              <ItemButton variant="plain"
                key={o.id}
                onClick={() => onChange(checked ? selected.filter((s) => s !== o.id) : [...selected, o.id])}
                className="text-inherit flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60"
              >
                <span
                  className={cn(
                    "flex size-3.5 flex-shrink-0 items-center justify-center rounded-sm border",
                    checked ? "border-primary bg-primary-fill text-primary-foreground" : "border-input"
                  )}
                >
                  {checked && <Check className="size-2.5" strokeWidth={3} />}
                </span>
                <TruncatedText text={o.name} className="min-w-0 flex-1 text-foreground" />
              </ItemButton>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
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

  // Events in the equally long window right before the selected one — drives the KPI trend.
  const eventsTrend = React.useMemo<KpiTrend | undefined>(() => {
    if (!dateBounds.from || !dateBounds.to) return undefined;
    const days = Math.round((Date.parse(dateBounds.to) - Date.parse(dateBounds.from)) / 86_400_000) + 1;
    const prevFrom = shiftDate(dateBounds.from, -days);
    const prevTo = shiftDate(dateBounds.from, -1);
    const prev = MOCK_EVENTS.filter((e) => e.date >= prevFrom && e.date <= prevTo).length;
    if (prev === 0) return undefined;
    const pct = ((eventsInRange - prev) / prev) * 100;
    const direction = pct > 0 ? "up" : pct < 0 ? "down" : "flat";
    // More detections is not good news, so rising events read as negative.
    return {
      // Whole numbers once the change is large, so the narrow card stays readable.
      value: `${Math.abs(pct).toFixed(Math.abs(pct) >= 10 ? 0 : 1)}%`,
      direction,
      sentiment: direction === "up" ? "negative" : direction === "down" ? "positive" : "neutral",
    };
  }, [dateBounds, eventsInRange]);
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

  const chartSiteOptions = React.useMemo(
    () => detectionsBySite.map((s, i) => ({ name: s.site, count: s.total, color: siteColor(s.site, i) })),
    [detectionsBySite]
  );
  /* Keyed by date range: switching range starts from that range's top three
     again, without an effect resetting it a render later. */
  const [sitePicks, setSitePicks] = React.useState<{ range: DateRange; sites: string[] } | null>(null);
  const selectedSites =
    sitePicks?.range === dateRange ? sitePicks.sites : detectionsBySite.slice(0, 3).map((s) => s.site);
  const setSelectedSites = (next: string[]) => setSitePicks({ range: dateRange, sites: next });

  const sitesTotal = sites.length;
  const sitesActive = sites.filter((s) => s.status === "active").length;
  const nvrTotal = MOCK_NVRS.length;
  const nvrOnline = MOCK_NVRS.filter((n) => n.status === "online").length;

  /* ── System health metrics + overall % ───────────────────────────── */
  const healthMetrics: { label: string; value: string; pct: number; tone: "ok" | "warn" | "crit"; icon: React.ElementType }[] = [
    { label: "CPU",      value: "42%", pct: 42, tone: "ok",   icon: Cpu },
    { label: "Memory",   value: "68%", pct: 68, tone: "warn", icon: MemoryStick },
    { label: "Disk I/O", value: "24%", pct: 24, tone: "ok",   icon: HardDrive },
    { label: "Network",  value: "18%", pct: 18, tone: "ok",   icon: Network },
    { label: "Uptime",   value: "42d", pct: 92, tone: "ok",   icon: Power },
  ];
  /* ── System status pill ──────────────────────────────────────────────
     Same roll-up the top-bar status menu reads (cameras / NVRs / servers), so
     the header and this pill always agree. The resource metrics above drive
     the alert banner below, which is a separate concern. */

  /* ── Inline alert banner — driven by the resource metrics, not fleet health ── */
  const worstHealth = healthMetrics.find((m) => m.tone === "crit")
    ?? healthMetrics.find((m) => m.tone === "warn");
  const alertCritical = worstHealth?.tone === "crit";

  const [alertAcknowledged, setAlertAcknowledged] = React.useState(false);
  const showAlertBanner = !!worstHealth && !alertAcknowledged;

  return (
    <div data-slot="dashboard-page" className="flex flex-col gap-section">
      {showAlertBanner && worstHealth && (
        <div data-slot="dashboard-page-alert"
          className={cn(
            "flex items-center gap-3 rounded-xl border px-4 py-3",
            alertCritical
              ? "border-severity-critical/40 bg-severity-critical/[0.06]"
              : "border-warning/40 bg-warning/[0.06]"
          )}
        >
          <TriangleAlert
            className={cn(
              "size-4 flex-shrink-0",
              alertCritical ? "text-severity-critical" : "text-warning"
            )}
          />
          <div className="min-w-0 flex-1 text-base">
            <span
              className={cn(
                "font-semibold",
                alertCritical ? "text-severity-critical" : "text-warning"
              )}
            >
              Alert · {worstHealth.label} running {worstHealth.tone === "crit" ? "critical" : "slow"}
            </span>
            <span className="ml-1 text-muted-foreground">
              {worstHealth.label} usage is at{" "}
              <strong className="text-foreground">{worstHealth.value}</strong>. Contact your
              administrator immediately.
            </span>
          </div>
          <Button variant="ghost" size="icon-xs"
            onClick={() => setAlertAcknowledged(true)}
            className="size-auto border-0 hover:bg-transparent dark:hover:bg-transparent flex-shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Dismiss alert"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Dashboard</PageHeader.Title>
        </PageHeader.Content>
        <PageHeader.Actions>
        </PageHeader.Actions>
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
            <span className="ml-2 text-muted-foreground">· {eventsInRange} event{eventsInRange === 1 ? "" : "s"}</span>
          </>
        }
      />

      {/* KPI strip — live status on the left, the selected period on the right (PRD). */}
      <div data-slot="dashboard-page-kpis" className="flex flex-col gap-4 md:flex-row">
        <div data-slot="dashboard-page-kpis-live" className="min-w-0 flex-[3] space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-success" />
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Live status</p>
          </div>
          <KpiGrid cols={3}>
            <KpiCard
              label="Sites"
              value={sitesTotal}
              sub={`${sitesActive} active`}
              tone="primary"
              onClick={() => navigate("/site/overview")}
            />
            <KpiCard
              label="Cameras"
              value={<>{camOnline}<span className="text-md text-muted-foreground"> / {camTotal}</span></>}
              sub={`${camTotal - camOnline} offline`}
              tone="success"
              onClick={() => navigate("/site/cameras")}
            />
            <KpiCard
              label="NVR Devices"
              value={<>{nvrOnline}<span className="text-md text-muted-foreground"> / {nvrTotal}</span></>}
              sub={`${nvrTotal - nvrOnline} offline`}
              tone="violet"
              onClick={() => navigate("/site/nvr")}
            />
          </KpiGrid>
        </div>
        <div className="hidden w-px self-stretch bg-border md:block" />
        <div data-slot="dashboard-page-kpis-period" className="space-y-2 md:w-72 md:shrink-0">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            Period · {dateLabel}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              label="Events"
              value={eventsInRange}
              trend={eventsTrend}
              sub={eventsTrend ? "vs prior" : dateLabel}
              tone="info"
              onClick={() => navigate("/detection-feed")}
            />
            <KpiCard
              label="Open Cases"
              value={casesOpen}
              sub={`${casesEscalated} critical`}
              tone="severity-critical"
              onClick={() => navigate("/incidents")}
            />
          </div>
        </div>
      </div>

      {/* Detections trend — full width now that System Health lives in the header */}
      <div data-slot="dashboard-page-detections">
        <div>
          <Section
            title="Detections by Site — Severity Breakdown"
            action={
              <Button variant="ghost" className="gap-1 text-sm" onClick={() => navigate("/detection-feed")}>
                View feed <ArrowUpRight className="size-3" />
              </Button>
            }
          >
            {detectionsBySite.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm italic text-muted-foreground">No detections recorded in this range.</p>
            ) : (
              <>
                <SiteChipRow
                  sites={chartSiteOptions}
                  selected={selectedSites}
                  onChange={setSelectedSites}
                />
                <div data-slot="dashboard-page-detections-chart" className="h-[240px]">
                  <LineChart
                    data={siteTrend}
                    xKey="day"
                    series={chartSiteOptions
                      .filter((s) => selectedSites.includes(s.name))
                      .map((s) => ({ key: s.name, label: s.name, color: s.color }))}
                    dots
                    showLegend
                    yAxis={{ show: true }}
                    className="h-full"
                  />
                </div>
                <div data-slot="dashboard-page-detections-sites" className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {detectionsBySite
                    .filter((s) => selectedSites.includes(s.site))
                    .map((s) => {
                    const i = detectionsBySite.findIndex((d) => d.site === s.site);
                    const color = siteColor(s.site, i);
                    return (
                      <Popover key={s.site}>
                        <PopoverTrigger asChild>
                          <ItemButton variant="plain"
                            className="w-auto items-stretch text-inherit group flex flex-col gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/40"
                          >
                            {/* Row 1: site name + colored dot */}
                            <div className="flex items-center gap-1.5">
                              <span
                                className="size-2.5 flex-shrink-0 rounded-full"
                                style={{ background: color }}
                              />
                              <TruncatedText
                                text={s.site}
                                className="min-w-0 flex-1 text-xs font-semibold text-foreground"
                              />
                            </div>
                            {/* Row 2: big number */}
                            <p className="inline-flex items-baseline gap-1 font-mono">
                              <span className="text-2xl font-bold leading-none text-foreground">
                                {s.total}
                              </span>
                              <span className="text-2xs text-muted-foreground">
                                detections
                              </span>
                            </p>
                            {/* Row 3: severity breakdown chips */}
                            <div className="flex items-center gap-1.5 text-2xs">
                              <SevPill kind="critical" value={s.critical} />
                              <SevPill kind="medium"   value={s.medium} />
                              <SevPill kind="low"      value={s.low} />
                            </div>
                          </ItemButton>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-64 p-0">
                          <div className="border-b border-border px-3 py-2.5">
                            <p className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
                              <span
                                className="size-2.5 flex-shrink-0 rounded-full"
                                style={{ background: color }}
                              />
                              {s.site}
                            </p>
                            <p className="mt-0.5 text-2xs text-muted-foreground">
                              <strong className="font-mono text-foreground">{s.total}</strong> detections in this range
                            </p>
                          </div>
                          <div className="px-3 py-3">
                            <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Severity breakdown
                            </p>
                            <div className="space-y-1.5">
                              <SevRow kind="critical" value={s.critical} total={s.total} />
                              <SevRow kind="medium"   value={s.medium}   total={s.total} />
                              <SevRow kind="low"      value={s.low}      total={s.total} />
                            </div>
                          </div>
                          <div className="border-t border-border bg-muted/20 px-3 py-2.5">
                            <Button variant="link"
                              onClick={() => navigate("/detection-feed")}
                              className="h-auto p-0 border-0 rounded-none shrink whitespace-normal justify-start inline-flex items-center gap-1 text-xs font-semibold text-primary-ink hover:underline"
                            >
                              View feed for this site
                              <ArrowUpRight className="size-3" />
                            </Button>
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

      </div>

      {/* Zone Areas — compact cards with click popover */}
      <Section
        title="Zone Areas"
        action={
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">
              <strong className="text-foreground">{filteredZoneAreas.length}</strong> area{filteredZoneAreas.length === 1 ? "" : "s"}
            </span>
            <SiteMultiSelect options={siteFilterOptions} selected={zoneSiteFilter} onChange={setZoneSiteFilter} />
          </div>
        }
      >
        {filteredZoneAreas.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm italic text-muted-foreground">
            {zoneSiteFilter.length > 0 ? "No zones match the selected sites." : "No detections recorded in this range."}
          </p>
        ) : (
          <div data-slot="dashboard-page-zones-grid" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {filteredZoneAreas.map((z) => {
              return (
                <Popover key={`${z.site}-${z.area}`}>
                  <PopoverTrigger asChild>
                    <ItemButton variant="plain"
                      className="w-auto items-stretch text-inherit group flex flex-col gap-1 rounded-lg border border-border bg-background px-2.5 py-2 text-left transition-colors hover:border-primary/40"
                    >
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3 flex-shrink-0 text-muted-foreground" />
                        <TruncatedText text={z.area} className="min-w-0 flex-1 text-xs font-semibold text-foreground" />
                      </div>
                      <TruncatedText text={z.site} className="text-2xs text-muted-foreground" />
                      <div className="mt-0.5 flex items-center justify-between gap-1.5">
                        <span className="inline-flex items-baseline gap-1 font-mono">
                          <span className="text-lg font-bold leading-none text-foreground">{z.total}</span>
                          <span className="text-2xs text-muted-foreground">incident{z.total === 1 ? "" : "s"}</span>
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-3xs text-muted-foreground">
                          <Video className="size-2.5" />
                          {z.cameras}
                        </span>
                      </div>
                    </ItemButton>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-72 p-0">
                    <div className="border-b border-border px-3 py-2.5">
                      <p className="inline-flex items-center gap-1.5 text-sm font-bold text-foreground">
                        <MapPin className="size-3 text-muted-foreground" />
                        {z.area}
                      </p>
                      <p className="mt-0.5 text-2xs text-muted-foreground">{z.site}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-2xs">
                        <span className="font-mono"><strong className="text-foreground">{z.total}</strong> incidents</span>
                        <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-severity-critical" />{z.counts.critical}</span>
                        <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-warning" />{z.counts.medium}</span>
                        <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-info" />{z.counts.low}</span>
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto p-1.5">
                      <p className="px-2 py-1 text-3xs font-semibold uppercase tracking-wider text-muted-foreground">Cameras</p>
                      {z.cameraStats.length === 0 ? (
                        <p className="px-2 py-3 text-center text-xs italic text-muted-foreground">No camera-attributed events.</p>
                      ) : z.cameraStats.map((cs) => (
                        <div key={cs.camera} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/60">
                          <Video className="size-3 flex-shrink-0 text-muted-foreground" />
                          <TruncatedText text={cs.camera} className="min-w-0 flex-1 text-sm font-semibold text-foreground" />
                          <span className="inline-flex items-center gap-1.5 text-2xs text-muted-foreground">
                            {cs.critical > 0 && <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-severity-critical" />{cs.critical}</span>}
                            {cs.medium   > 0 && <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-warning" />{cs.medium}</span>}
                            {cs.low      > 0 && <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-info" />{cs.low}</span>}
                            <span className="ml-1 font-mono font-bold text-foreground">{cs.total}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-border px-3 py-2">
                      <Button variant="ghost" size="xs"
                        onClick={() => navigate("/detection-feed")}
                        className="h-auto border-0 shrink whitespace-normal dark:hover:bg-primary/10 hover:text-primary-ink inline-flex w-full items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-primary-ink hover:bg-primary/10"
                      >
                        View events for this zone <ArrowUpRight className="size-3" />
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        )}
      </Section>

      {/* Recent events + Cases */}
      <div data-slot="dashboard-page-recent" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Recent Detections"
          action={<Button variant="ghost" className="gap-1 text-sm" onClick={() => navigate("/detection-feed")}>
            View all <ArrowUpRight className="size-3" />
          </Button>}>
          <div className="space-y-2">
            {recentEvents.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm italic text-muted-foreground">No detections in this range.</p>
            ) : recentEvents.map((e) => {
              const sv = SEV_STYLES[e.severity];
              return (
                <div data-slot="dashboard-page-detection-row" key={e.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2"
                  style={{ borderLeftWidth: 3, borderLeftColor: `var(--severity-${e.severity})` }}>
                  <span className={cn("inline-flex items-center gap-1 rounded-full border border-current px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider", sv.bg, sv.text)}>
                    {sv.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <TruncatedText text={e.typeLabel} className="text-base font-semibold text-foreground" />
                    <TruncatedText text={e.summary} className="text-xs text-muted-foreground" />
                  </div>
                  <span className="font-mono text-2xs text-muted-foreground">{e.time}</span>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Incident Cases"
          action={<Button variant="ghost" className="gap-1 text-sm" onClick={() => navigate("/incidents")}>
            View all <ArrowUpRight className="size-3" />
          </Button>}>
          <div className="space-y-2">
            {recentCases.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm italic text-muted-foreground">No cases in this range.</p>
            ) : recentCases.map((c) => {
              const sv = SEV_STYLES[c.severity];
              return (
                <div data-slot="dashboard-page-case-row" key={c.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2">
                  <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                    <FolderOpen className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <TruncatedText text={c.title} className="text-base font-semibold text-foreground" />
                    <TruncatedText
                      text={`${c.id} · ${c.siteDisplay} · ${c.assignedTo.name}`}
                      className="text-xs text-muted-foreground"
                    />
                  </div>
                  <span className={cn("inline-flex items-center gap-1 rounded-full border border-current px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider", sv.bg, sv.text)}>
                    {sv.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      </div>

      {/* Cameras by Sites + Activity Log */}
      <div data-slot="dashboard-page-cameras-activity" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Cameras by Site"
          action={<Button variant="ghost" className="gap-1 text-sm" onClick={() => navigate("/site/overview")}>
            Sites <ArrowUpRight className="size-3" />
          </Button>}>
          <div data-slot="dashboard-page-cameras-chart" className="h-[260px]">
            <BarChart
              data={camerasBySite}
              xKey="name"
              stacked
              series={[
                { key: "online", label: "Online", color: "var(--success)" },
                { key: "offline", label: "Offline", color: "var(--severity-critical)" },
              ]}
              xAxis={{ angle: -12, interval: 0 }}
              yAxis={{ show: true }}
              className="h-full"
            />
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-sm bg-success" />
              Online
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-sm bg-severity-critical" />
              Offline
            </span>
          </div>
        </Section>

        <Section
          title="Recent Activity Log"
          action={
            <Button variant="ghost" className="gap-1 text-sm" onClick={() => navigate("/activity-logs")}>
              <ScrollText className="size-3" />
              View full log <ArrowUpRight className="size-3" />
            </Button>
          }
        >
          {/* Height matches the Cameras by Site chart (h-[260px] + ~24px legend = ~300px) */}
          <div data-slot="dashboard-page-activity-log" className="-mx-4 -my-4">
            <div className="grid grid-cols-[120px_70px_1fr] gap-3 border-b border-border bg-muted/30 px-4 py-2">
              <p className="text-3xs font-semibold uppercase tracking-widest text-muted-foreground">When</p>
              <p className="text-3xs font-semibold uppercase tracking-widest text-muted-foreground">Type</p>
              <p className="text-3xs font-semibold uppercase tracking-widest text-muted-foreground">Activity</p>
            </div>
            <div tabIndex={0} aria-label="Recent activity" className="h-[268px] overflow-y-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {recentActivity.map((a) => {
                const ks = ACTIVITY_KIND_STYLES[a.kind];
                return (
                  <div data-slot="dashboard-page-activity-row"
                    key={a.id}
                    className="grid grid-cols-[120px_70px_1fr] gap-3 border-b border-border/60 px-4 py-2.5 last:border-b-0 hover:bg-muted/20"
                  >
                    <div className="min-w-0">
                      <TruncatedText text={a.whenRelative} className="font-mono text-2xs text-muted-foreground" />
                      <TruncatedText text={a.module} className="mt-0.5 text-2xs text-muted-foreground" />
                    </div>
                    <div>
                      <span
                        className={cn(
                          "inline-flex items-center rounded px-1.5 py-0.5 text-3xs font-bold uppercase tracking-wider",
                          ks.bg,
                          ks.text
                        )}
                      >
                        {ACTIVITY_KIND_LABELS[a.kind]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm leading-snug text-foreground">
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
