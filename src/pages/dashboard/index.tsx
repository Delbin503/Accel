import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import {
  Video,
  AlertTriangle,
  TrendingUp,
  Activity,
  CheckCircle2,
  HardDrive,
  FolderOpen,
  Cpu,
  ArrowUpRight,
  Server,
  MemoryStick,
  Network,
  Power,
  ScrollText,
  MapPin,
  CircleAlert,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCamerasStore } from "@/stores/useCamerasStore";
import { useSitesStore } from "@/stores/useSitesStore";
import { MOCK_EVENTS } from "@/mocks/detectionFeed";
import { MOCK_CASES } from "@/mocks/incidentCases";
import { MOCK_MODELS } from "@/mocks/modelManagement";
import { MOCK_DEPLOYMENTS } from "@/mocks/deployments";
import { MOCK_NVRS } from "@/mocks/nvr";
import { MOCK_ACTIVITY_LOGS, ACTIVITY_KIND_LABELS, ACTIVITY_KIND_STYLES } from "@/mocks/activityLogs";

/* ── Zone severity thresholds (configurable in System Config) ────────────
   These mirror the same defaults exposed inside System Config → Dashboard.
   When zone area incident count crosses a threshold, the badge changes.   */
export const ZONE_SEVERITY_THRESHOLDS = {
  critical: 5,   // ≥ 5 incidents → critical
  warning: 2,    // ≥ 2 incidents → warning
};

/* ── KPI Card ────────────────────────────────────────────────────────── */

function KpiCard({ label, value, sub, bar, txt, icon: Icon, onClick }: {
  label: string; value: React.ReactNode; sub?: string; bar: string; txt: string;
  icon: React.ElementType; onClick?: () => void;
}) {
  return (
    <button onClick={onClick}
      className={cn("relative overflow-hidden rounded-xl border border-border bg-card p-4 text-left transition-colors",
        onClick && "hover:border-primary/40")}>
      <div className={cn("absolute inset-x-0 top-0 h-0.5", bar)} />
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <div className={cn("text-[26px] font-bold leading-none", txt)}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </button>
  );
}

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

/* ── System Status mini-tile ─────────────────────────────────────────── */

function SysTile({ icon: Icon, label, value, pct, tone }: {
  icon: React.ElementType; label: string; value: string; pct: number;
  tone: "ok" | "warn" | "crit";
}) {
  const t =
    tone === "crit" ? { bar: "bg-sev-critical", txt: "text-sev-critical" } :
    tone === "warn" ? { bar: "bg-warning",      txt: "text-warning" } :
                      { bar: "bg-success",      txt: "text-success" };
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <p className={cn("text-[20px] font-bold leading-none", t.txt)}>{value}</p>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", t.bar)} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const navigate = useNavigate();
  const cameras = useCamerasStore((s) => s.cameras);
  const sites = useSitesStore((s) => s.sites);

  // --- Derived stats from all modules ---
  const camOnline = cameras.filter((c) => c.status === "online").length;
  const camTotal = cameras.length;
  const eventsToday = MOCK_EVENTS.filter((e) => e.date.endsWith("-05-25")).length;
  const eventsTotal = MOCK_EVENTS.length;
  const eventsCritical = MOCK_EVENTS.filter((e) => e.severity === "critical").length;
  const eventsMedium = MOCK_EVENTS.filter((e) => e.severity === "medium").length;
  const eventsLow = MOCK_EVENTS.filter((e) => e.severity === "low").length;

  const casesOpen = MOCK_CASES.filter((c) => c.status === "open" || c.status === "in-review").length;
  const casesTotal = MOCK_CASES.length;
  const casesEscalated = MOCK_CASES.filter((c) => c.severity === "critical").length;
  const slaMet = MOCK_CASES.filter((c) => c.status === "closed" || c.status === "action-taken").length;
  const slaPct = casesTotal > 0 ? Math.round((slaMet / casesTotal) * 100) : 100;

  const modelsDeployed = MOCK_DEPLOYMENTS.filter((d) => d.status === "active").length;

  // Storage from NVRs
  const totalStorage = MOCK_NVRS.reduce((s, n) => s + n.totalStorageGb, 0);
  const usedStorage = MOCK_NVRS.reduce((s, n) => s + n.usedStorageGb, 0);
  const storagePct = totalStorage > 0 ? Math.round((usedStorage / totalStorage) * 100) : 0;

  // 7-day event trend (synthetic from index modulo)
  const weekData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => ({
    day: d,
    critical: 4 + ((i * 7) % 8),
    medium: 8 + ((i * 11) % 10),
    low: 12 + ((i * 5) % 9),
  }));

  const severityPie = [
    { name: "Critical", value: eventsCritical, color: "var(--sev-critical)" },
    { name: "Medium",   value: eventsMedium,   color: "var(--warning)" },
    { name: "Low",      value: eventsLow,      color: "var(--info)" },
  ];

  // Zone areas — grouped from detection events + cross-referenced with cameras for offline state
  const zoneAreas = React.useMemo(() => {
    const map = new Map<string, { area: string; site: string; counts: { critical: number; medium: number; low: number }; total: number; cameras: number; cameraOffline: boolean }>();
    for (const e of MOCK_EVENTS) {
      const key = `${e.site}__${e.area}`;
      if (!map.has(key)) {
        map.set(key, {
          area: e.areaDisplay,
          site: e.siteDisplay,
          counts: { critical: 0, medium: 0, low: 0 },
          total: 0,
          cameras: 0,
          cameraOffline: false,
        });
      }
      const row = map.get(key)!;
      row.counts[e.severity] += 1;
      row.total += 1;
    }
    // Augment with camera count + offline state
    for (const row of map.values()) {
      const camsInArea = cameras.filter((c) => {
        const siteMatch = c.siteName === row.site || c.siteId.includes(row.site.toLowerCase().split(" ")[0]);
        const areaMatch = c.areaName === row.area;
        return siteMatch && areaMatch;
      });
      row.cameras = camsInArea.length;
      row.cameraOffline = camsInArea.length > 0 && camsInArea.every((c) => c.status !== "online");
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [cameras]);

  const zoneSummary = React.useMemo(() => {
    const out = { critical: 0, warning: 0, normal: 0, offline: 0 };
    for (const z of zoneAreas) out[zoneStatus(z.total, z.cameraOffline)] += 1;
    return out;
  }, [zoneAreas]);

  const camerasBySite = sites.map((s) => ({
    name: s.name,
    online: cameras.filter((c) => c.siteId === s.id && c.status === "online").length,
    offline: cameras.filter((c) => c.siteId === s.id && c.status !== "online").length,
  }));

  // Recent events (top 5)
  const recentEvents = [...MOCK_EVENTS]
    .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
    .slice(0, 5);

  // Recent cases (top 4)
  const recentCases = [...MOCK_CASES]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  // Top deployed models
  const deploymentsByModel = MOCK_DEPLOYMENTS.reduce<Record<string, { name: string; count: number; events: number }>>((acc, d) => {
    if (!acc[d.modelId]) acc[d.modelId] = { name: d.modelName, count: 0, events: 0 };
    acc[d.modelId].count += 1;
    acc[d.modelId].events += d.eventCount;
    return acc;
  }, {});
  const topModels = Object.values(deploymentsByModel).sort((a, b) => b.events - a.events).slice(0, 4);

  // Recent activity log (top 6)
  const recentActivity = MOCK_ACTIVITY_LOGS.slice(0, 6);

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

      {/* Top KPI strip — primary metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label="Cameras"
          value={<>{camOnline}<span className="text-[14px] text-muted-foreground"> / {camTotal}</span></>}
          sub={`${camTotal - camOnline} offline`}
          bar="bg-success" txt="text-success" icon={Video}
          onClick={() => navigate("/site/cameras")}
        />
        <KpiCard
          label="Events Today"
          value={eventsToday}
          sub={`${eventsTotal} total this week`}
          bar="bg-info" txt="text-info" icon={Activity}
          onClick={() => navigate("/detection-feed")}
        />
        <KpiCard
          label="Open Cases"
          value={casesOpen}
          sub={`${casesEscalated} critical`}
          bar="bg-sev-critical" txt="text-sev-critical" icon={FolderOpen}
          onClick={() => navigate("/incidents")}
        />
        <KpiCard
          label="SLA Met"
          value={`${slaPct}%`}
          sub={`${slaMet}/${casesTotal} cases on time`}
          bar="bg-warning" txt={slaPct >= 90 ? "text-success" : slaPct >= 75 ? "text-warning" : "text-sev-critical"}
          icon={CheckCircle2}
        />
        <KpiCard
          label="Storage Used"
          value={`${storagePct}%`}
          sub={`${(usedStorage / 1000).toFixed(1)} / ${(totalStorage / 1000).toFixed(1)} TB`}
          bar="bg-secondary" txt={storagePct >= 90 ? "text-sev-critical" : storagePct >= 75 ? "text-warning" : "text-success"}
          icon={HardDrive}
        />
        <KpiCard
          label="Models Deployed"
          value={modelsDeployed}
          sub={`${MOCK_MODELS.length} configured`}
          bar="bg-primary" txt="text-foreground" icon={Cpu}
          onClick={() => navigate("/deployment")}
        />
      </div>

      {/* Zone Areas — detections grouped by area with configurable severity */}
      <Section
        title="Zone Areas"
        action={
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="size-1.5 rounded-full bg-sev-critical" /> {zoneSummary.critical} critical
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="size-1.5 rounded-full bg-warning" /> {zoneSummary.warning} warning
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success" /> {zoneSummary.normal} normal
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="size-1.5 rounded-full bg-muted-foreground/60" /> {zoneSummary.offline} offline
            </span>
            <button onClick={() => navigate("/system-config")}
              className="ml-2 inline-flex items-center gap-1 text-muted-foreground underline hover:text-primary">
              Configure thresholds <ArrowUpRight className="size-3" />
            </button>
          </div>
        }
      >
        {zoneAreas.length === 0 ? (
          <p className="px-3 py-6 text-center text-[12px] italic text-muted-foreground">No detections recorded across zones.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {zoneAreas.map((z) => {
              const status = zoneStatus(z.total, z.cameraOffline);
              const s = ZONE_STATUS_STYLES[status];
              return (
                <button key={`${z.site}-${z.area}`} onClick={() => navigate("/detection-feed")}
                  className={cn(
                    "group flex items-start gap-3 rounded-lg border bg-background px-3.5 py-3 text-left transition-colors hover:border-primary/40",
                    s.border
                  )}>
                  <div className={cn("flex size-9 flex-shrink-0 items-center justify-center rounded-lg", s.bg)}>
                    <MapPin className={cn("size-4", s.text)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[13px] font-semibold text-foreground">{z.area}</p>
                      <span className={cn("inline-flex flex-shrink-0 items-center gap-1 rounded-full border px-1.5 py-px text-[9px] font-bold uppercase tracking-wider", s.bg, s.border, s.text)}>
                        <span className={cn("size-1.5 rounded-full", s.dot)} />
                        {s.label}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{z.site} · {z.cameras} camera{z.cameras === 1 ? "" : "s"}</p>
                    <div className="mt-2 flex items-center gap-2.5 text-[11px]">
                      <span className="inline-flex items-center gap-1 font-mono text-foreground">
                        <span className="text-[18px] font-bold leading-none">{z.total}</span>
                        <span className="text-muted-foreground">incident{z.total === 1 ? "" : "s"}</span>
                      </span>
                      <span className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        {z.counts.critical > 0 && <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-sev-critical" />{z.counts.critical}</span>}
                        {z.counts.medium > 0 && <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-warning" />{z.counts.medium}</span>}
                        {z.counts.low > 0 && <span className="inline-flex items-center gap-0.5"><span className="size-1.5 rounded-full bg-info" />{z.counts.low}</span>}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Section>

      {/* System Status */}
      <Section
        title="System Status"
        action={
          <span className="inline-flex items-center gap-1.5 text-[11px] text-success">
            <span className="size-1.5 animate-pulse rounded-full bg-success" />
            All services healthy
          </span>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <SysTile icon={Cpu} label="CPU" value="42%" pct={42} tone="ok" />
          <SysTile icon={MemoryStick} label="Memory" value="68%" pct={68} tone="warn" />
          <SysTile icon={HardDrive} label="Disk I/O" value="24%" pct={24} tone="ok" />
          <SysTile icon={Network} label="Network" value="18%" pct={18} tone="ok" />
          <SysTile icon={Power} label="Uptime" value="42d" pct={92} tone="ok" />
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            { icon: Server,      label: "Inference Engine", status: "Operational",  tone: "ok" as const },
            { icon: ShieldCheck, label: "Auth Service",     status: "Operational",  tone: "ok" as const },
            { icon: CircleAlert, label: "NVR Cluster",      status: "1 degraded",   tone: "warn" as const },
          ].map((s) => {
            const Icon = s.icon;
            const tone = s.tone === "warn" ? "text-warning" : "text-success";
            const dotBg = s.tone === "warn" ? "bg-warning" : "bg-success";
            return (
              <div key={s.label} className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2">
                <Icon className={cn("size-3.5 flex-shrink-0", tone)} />
                <p className="min-w-0 flex-1 truncate text-[12px] font-semibold text-foreground">{s.label}</p>
                <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold", tone)}>
                  <span className={cn("size-1.5 rounded-full", dotBg)} />
                  {s.status}
                </span>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title="Detections — Last 7 Days"
            action={<Button variant="ghost" className="gap-1 text-[12px]" onClick={() => navigate("/detection-feed")}>
              View feed <ArrowUpRight className="size-3" />
            </Button>}>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekData}>
                  <defs>
                    <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--sev-critical)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--sev-critical)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="medGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--warning)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--warning)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="lowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--info)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--info)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
                  <Area type="monotone" dataKey="low" stackId="1" stroke="var(--info)" fill="url(#lowGrad)" />
                  <Area type="monotone" dataKey="medium" stackId="1" stroke="var(--warning)" fill="url(#medGrad)" />
                  <Area type="monotone" dataKey="critical" stackId="1" stroke="var(--sev-critical)" fill="url(#critGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: "Critical", value: eventsCritical, color: "bg-sev-critical", txt: "text-sev-critical" },
                { label: "Medium",   value: eventsMedium,   color: "bg-warning",      txt: "text-warning" },
                { label: "Low",      value: eventsLow,      color: "bg-info",         txt: "text-info" },
              ].map((s) => (
                <div key={s.label} className="rounded-md border border-border bg-background px-3 py-2">
                  <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <span className={cn("size-1.5 rounded-full", s.color)} />
                    {s.label}
                  </p>
                  <p className={cn("mt-0.5 text-[16px] font-bold", s.txt)}>{s.value}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <Section title="Detections by Severity"
          action={<span className="text-[11px] text-muted-foreground">last 7 days</span>}>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={severityPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {severityPie.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {severityPie.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-[11px]">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span className="size-2 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </span>
                <span className="font-mono font-semibold text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Recent events + Cases */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Recent Detections"
          action={<Button variant="ghost" className="gap-1 text-[12px]" onClick={() => navigate("/detection-feed")}>
            View all <ArrowUpRight className="size-3" />
          </Button>}>
          <div className="space-y-2">
            {recentEvents.map((e) => {
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
            {recentCases.map((c) => {
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

      {/* Site health + Top models */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="Cameras by Site"
          action={<Button variant="ghost" className="gap-1 text-[12px]" onClick={() => navigate("/site/overview")}>
            Sites <ArrowUpRight className="size-3" />
          </Button>}>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={camerasBySite}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="online" stackId="a" fill="var(--primary)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="offline" stackId="a" fill="var(--warning)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-sm bg-primary" />
              Online
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-sm bg-warning" />
              Offline
            </span>
          </div>
        </Section>

        <Section title="Top Deployed Models"
          action={<Button variant="ghost" className="gap-1 text-[12px]" onClick={() => navigate("/deployment")}>
            Deployments <ArrowUpRight className="size-3" />
          </Button>}>
          <div className="space-y-2">
            {topModels.length === 0 ? (
              <p className="px-3 py-6 text-center text-[12px] italic text-muted-foreground">No deployments yet.</p>
            ) : topModels.map((m, i) => (
              <div key={m.name + i} className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-[11px] font-bold text-primary">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-foreground">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground">{m.count} deployment{m.count === 1 ? "" : "s"} · {m.events.toLocaleString()} events</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[14px] font-bold text-success">{m.events.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Recent Activity Log (compact) */}
      <Section
        title="Recent Activity Log"
        action={<Button variant="ghost" className="gap-1 text-[12px]" onClick={() => navigate("/activity-logs")}>
          <ScrollText className="size-3" />
          View full log <ArrowUpRight className="size-3" />
        </Button>}>
        <div className="divide-y divide-border/60">
          {recentActivity.map((a) => {
            const ks = ACTIVITY_KIND_STYLES[a.kind];
            return (
              <div key={a.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                <div className={cn("flex size-7 flex-shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-semibold",
                  a.actor.role === "owner" ? "bg-success/15 text-success" :
                  a.actor.role === "admin" ? "bg-info/15 text-info" :
                  a.actor.role === "system" ? "bg-muted text-muted-foreground" :
                  "bg-secondary/15 text-secondary"
                )}>
                  {a.actor.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] text-foreground">
                    <span className="font-semibold">{a.actor.name}</span>
                    <span className="ml-1.5 text-muted-foreground">{a.text}</span>
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className={cn("rounded px-1.5 py-px font-semibold", ks.bg, ks.text)}>{ACTIVITY_KIND_LABELS[a.kind]}</span>
                    <span>{a.module}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="font-mono">{a.whenRelative}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Quick action banner */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/[0.04] px-4 py-3">
        <TrendingUp className="size-4 text-primary" />
        <p className="text-[12px] text-foreground">
          <strong>System Health: {storagePct >= 90 ? "Action needed" : "Good"}</strong> ·{" "}
          {camOnline}/{camTotal} cameras streaming · {modelsDeployed} active deployments · {slaPct}% SLA compliance this week
        </p>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <Button variant="outline" className="gap-1.5" onClick={() => navigate("/device-health")}>
            <AlertTriangle className="size-3.5" />
            Device Health
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => navigate("/analysis")}>
            <Activity className="size-3.5" />
            Run Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}
