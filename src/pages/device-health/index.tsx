import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Check,
  Video,
  HardDrive,
  HeartPulse,
  MapPin,
  Database,
} from "lucide-react";
import { Button } from "@accel/ui/components/ui/button";
import { ItemButton } from "@accel/ui/components/ui/item";
import { DataTable, type DataTableColumn } from "@accel/ui/components/shared/DataTable";
import { Popover, PopoverContent, PopoverTrigger } from "@accel/ui/components/ui/popover";
import { PageHeader } from "@accel/ui/components/layout/PageHeader";
import { cn } from "@accel/ui/lib/utils";
import { MOCK_CAMERAS, CAMERA_SITES, CAMERA_AREAS } from "@/mocks/cameras";
import { MOCK_NVRS } from "@/mocks/nvr";
import { KpiCard, KpiGrid, type KpiTone } from "@accel/ui/components/shared/KpiCard";
import { ToolbarSearch } from "@accel/ui/components/shared/Toolbar";
import { TruncatedText } from "@accel/ui/components/shared/TruncatedText";
import { EmptyState } from "@accel/ui/components/shared/EmptyState";
import { ListLoadingState, ListErrorState } from "@accel/ui/components/shared/PageStates";
import { storageBandFor } from "@/types/nvr";
import type { CameraData } from "@/types/cameras";
import type { NvrData } from "@/types/nvr";

/* ── Health status derivation ────────────────────────────────────────────── */

type HealthStatus = "online" | "offline";

/** Fixed "now" so the prototype is deterministic against mock lastSeen timestamps. */
const NOW = new Date("2026-05-25T10:15:00").getTime();
const OFFLINE_THRESHOLD_MIN = 24 * 60; // > 24 hr old = offline

function deriveCameraHealth(c: CameraData): HealthStatus {
  // A camera we cannot reach reads as offline — the page tracks two states only.
  if (c.status === "connection-failed") return "offline";
  if (c.status === "offline") return "offline";
  const ageMin = (NOW - new Date(c.lastSeenAt).getTime()) / 60000;
  if (ageMin > OFFLINE_THRESHOLD_MIN) return "offline";
  return "online";
}

function deriveNvrHealth(n: NvrData): HealthStatus {
  if (n.status === "offline") return "offline";
  if (n.status === "degraded") return "offline";
  const ageMin = (NOW - new Date(n.lastSeenAt).getTime()) / 60000;
  if (ageMin > OFFLINE_THRESHOLD_MIN) return "offline";
  return "online";
}

/* ── Unified device record ───────────────────────────────────────────────── */

type DeviceType = "camera" | "nvr";

interface DeviceRow {
  id: string;
  name: string;
  type: DeviceType;
  siteId: string;
  siteName: string;
  areaId: string;
  areaName: string;
  ip: string;
  health: HealthStatus;
  lastSeenDisplay: string;
  lastSeenAt: string;
  /** Disk % usage — NVR only. */
  diskPct?: number;
  diskBand?: "healthy" | "warning" | "critical";
  diskDisplay?: string;
}

function buildRows(): DeviceRow[] {
  const cameras: DeviceRow[] = MOCK_CAMERAS.map((c) => ({
    id: c.id,
    name: c.name,
    type: "camera",
    siteId: c.siteId,
    siteName: c.siteName,
    areaId: c.areaId,
    areaName: c.areaName,
    ip: c.ipAddress,
    health: deriveCameraHealth(c),
    lastSeenDisplay: c.lastSeenDisplay,
    lastSeenAt: c.lastSeenAt,
  }));
  const nvrs: DeviceRow[] = MOCK_NVRS.map((n) => {
    const pct = n.totalStorageGb > 0 ? Math.round((n.usedStorageGb / n.totalStorageGb) * 100) : 0;
    return {
      id: n.id,
      name: n.name,
      type: "nvr",
      siteId: n.siteId,
      siteName: n.siteName,
      areaId: n.areaId,
      areaName: n.areaName,
      ip: n.ipAddress,
      health: deriveNvrHealth(n),
      lastSeenDisplay: n.lastSeenDisplay,
      lastSeenAt: n.lastSeenAt,
      diskPct: pct,
      diskBand: storageBandFor(n.usedStorageGb, n.totalStorageGb),
      diskDisplay: `${n.usedStorageGb.toFixed(1)} / ${n.totalStorageGb.toFixed(1)} TB`,
    };
  });
  return [...cameras, ...nvrs];
}

/* ── Status pill ─────────────────────────────────────────────────────────── */

const HEALTH_STYLES: Record<HealthStatus, { bg: string; text: string; dot: string; label: string }> = {
  online:  { bg: "bg-success/15 border-success/30",           text: "text-success",          dot: "bg-success",          label: "Online" },
  offline: { bg: "bg-muted border-border",                    text: "text-muted-foreground", dot: "bg-muted-foreground", label: "Offline" },
};

function HealthPill({ status }: { status: HealthStatus }) {
  const s = HEALTH_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider",
        s.bg,
        s.text
      )}
    >
      <span className={cn("size-1.5 flex-shrink-0 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

/* ── Type pill ───────────────────────────────────────────────────────────── */

const TYPE_STYLES: Record<DeviceType, { bg: string; text: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
  camera: { bg: "bg-info/10 border-info/20",        text: "text-info",   icon: Video,     label: "Camera" },
  nvr:    { bg: "bg-violet/15 border-violet/20",  text: "text-violet", icon: HardDrive, label: "NVR" },
};

function TypePill({ type }: { type: DeviceType }) {
  const s = TYPE_STYLES[type];
  const Icon = s.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider",
        s.bg,
        s.text
      )}
    >
      <Icon className="size-3" />
      {s.label}
    </span>
  );
}

/* ── Disk usage bar (NVR only) ───────────────────────────────────────────── */

const DISK_BAND_STYLES: Record<NonNullable<DeviceRow["diskBand"]>, { bar: string; text: string }> = {
  healthy:  { bar: "bg-success",      text: "text-success" },
  warning:  { bar: "bg-warning",  text: "text-warning" },
  critical: { bar: "bg-severity-critical", text: "text-severity-critical" },
};

function DiskBar({ pct, band, display }: { pct: number; band: DeviceRow["diskBand"]; display: string }) {
  const style = band ? DISK_BAND_STYLES[band] : DISK_BAND_STYLES.healthy;
  return (
    <div data-slot="disk-bar" className="min-w-[140px] max-w-[200px]">
      <div className="mb-1 flex items-center justify-between text-2xs">
        <span className={cn("font-semibold", style.text)}>{pct}%</span>
        <span className="font-mono text-2xs text-muted-foreground">{display}</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", style.bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ── KPI cards ───────────────────────────────────────────────────────────── */

type KpiFilter = "all" | HealthStatus;

const KPI_CONFIGS: {
  key: KpiFilter;
  label: string;
  sub: string;
  accent: KpiTone;
  getValue: (items: DeviceRow[]) => number;
}[] = [
  { key: "all",     label: "Total Devices", sub: "Cameras + NVRs",         accent: "primary",      getValue: (i) => i.length },
  { key: "online",  label: "Online",        sub: "Streaming + healthy",    accent: "success",      getValue: (i) => i.filter((d) => d.health === "online").length },
  { key: "offline", label: "Offline",       sub: "Last seen > 24h",        accent: "muted",        getValue: (i) => i.filter((d) => d.health === "offline").length },
];

/* ── Multi-select dropdown ───────────────────────────────────────────────── */

interface FilterOption { value: string; label: string }

function FilterDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly FilterOption[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const hasValue = selected.length > 0;
  const displayLabel = hasValue
    ? selected.length === 1
      ? (options.find((o) => o.value === selected[0])?.label ?? label)
      : `${selected.length} selected`
    : label;

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ItemButton variant="plain"
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-base transition-colors hover:border-primary",
            open ? "border-primary" : "border-border",
            hasValue ? "text-primary-ink" : "text-muted-foreground"
          )}
        >
          <TruncatedText text={displayLabel} className="font-medium" />
          <ChevronDown className={cn("size-3.5 flex-shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </ItemButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1.5">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <ItemButton variant="plain"
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-base text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <div
                className={cn(
                  "flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                  checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                )}
              >
                {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
              </div>
              {opt.label}
            </ItemButton>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

/* ── Filter panel ────────────────────────────────────────────────────────── */

interface DeviceFilters {
  site:   string[];
  area:   string[];
  type:   string[];
  status: string[];
}
const EMPTY_FILTERS: DeviceFilters = { site: [], area: [], type: [], status: [] };

const TYPE_OPTS: FilterOption[] = [
  { value: "camera", label: "Camera" },
  { value: "nvr",    label: "NVR" },
];

function FilterPanel({
  filters,
  onChange,
  search,
  onSearchChange,
}: {
  filters: DeviceFilters;
  onChange: (f: DeviceFilters) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const filterCount = Object.values(filters).reduce((s, arr) => s + arr.length, 0);
  const activeCount = filterCount + (search ? 1 : 0);

  function setGroup(group: keyof DeviceFilters, values: string[]) {
    onChange({ ...filters, [group]: values });
  }

  return (
    <div data-slot="device-health-filter-panel" className="rounded-xl border border-border bg-card">
      <ItemButton variant="plain"
        onClick={() => setOpen((v) => !v)}
        className="text-inherit flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-base font-semibold text-foreground">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary-fill px-2 py-px text-xs font-semibold text-primary-foreground">
              {activeCount} active
            </span>
          ) : (
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {["All sites", "All areas", "All types"].map((l) => (
                <span
                  key={l}
                  className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {l}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {open ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </ItemButton>

      {open && (
        <div data-slot="device-health-filter-panel-body" className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
          <ToolbarSearch value={search} onChange={onSearchChange} placeholder="Search by ID, name, or IP…" className="sm:w-full" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { key: "site"   as const, label: "Site",   opts: CAMERA_SITES },
              { key: "area"   as const, label: "Area",   opts: CAMERA_AREAS },
              { key: "type"   as const, label: "Type",   opts: TYPE_OPTS },
            ].map(({ key, label, opts }) => (
              <div key={key}>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </div>
                <FilterDropdown
                  label={`All ${label.toLowerCase()}s`}
                  options={opts}
                  selected={filters[key]}
                  onChange={(v) => setGroup(key, v)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

type SortKey = "health" | "last-seen" | "name" | "type";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "health",    label: "Health (worst first)" },
  { key: "last-seen", label: "Last Seen" },
  { key: "name",      label: "Name (A → Z)" },
  { key: "type",      label: "Type" },
];

const HEALTH_RANK: Record<HealthStatus, number> = { offline: 0, online: 1 };

/** Prototype hook — forces the page's data-state (loading / empty / error). */
export type DeviceHealthForcedState = "normal" | "loading" | "empty" | "error";

export default function DeviceHealthPage({
  forcedState = "normal",
  onRetry,
}: {
  forcedState?: DeviceHealthForcedState;
  onRetry?: () => void;
} = {}) {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<DeviceFilters>(EMPTY_FILTERS);
  const [kpiFilter, setKpiFilter] = React.useState<KpiFilter>("all");
  const [sort, setSort] = React.useState<SortKey>("health");
  const [sortOpen, setSortOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const pageSize = 12;

  // Prototype-only: force a zero-data view without touching the mock source.
  const allDevices = React.useMemo(
    () => (forcedState === "empty" ? [] : buildRows()),
    [forcedState]
  );

  const filtered = React.useMemo(() => {
    let list = allDevices.filter((d) => {
      if (kpiFilter !== "all" && d.health !== kpiFilter) return false;
      if (filters.site.length > 0 && !filters.site.includes(d.siteId)) return false;
      if (filters.area.length > 0 && !filters.area.includes(d.areaId)) return false;
      if (filters.type.length > 0 && !filters.type.includes(d.type)) return false;
      if (filters.status.length > 0 && !filters.status.includes(d.health)) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [d.id, d.name, d.ip, d.siteName, d.areaName].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "health") return HEALTH_RANK[a.health] - HEALTH_RANK[b.health];
      if (sort === "last-seen") return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
      if (sort === "name") return a.name.localeCompare(b.name);
      return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
    });
    return list;
  }, [allDevices, kpiFilter, filters, search, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const hasFilters = !!(search || Object.values(filters).some((a) => a.length > 0) || kpiFilter !== "all");

  function openDevice(d: DeviceRow) {
    if (d.type === "camera") navigate(`/site/cameras?camera=${d.id}`);
    else navigate(`/site/nvr?nvr=${d.id}`);
  }

  function handleKpiClick(key: KpiFilter) {
    setKpiFilter((current) => (current === key ? "all" : key));
    setPage(1);
  }

  const deviceColumns: DataTableColumn<DeviceRow>[] = [
    {
      key: "id",
      header: "DEVICE ID",
      cell: (d) => (
        <span className="font-mono text-sm font-semibold text-muted-foreground transition-colors group-hover:text-primary-ink">
          {d.id}
        </span>
      ),
    },
    {
      key: "name",
      header: "NAME",
      cell: (d) => (
        <span className="font-semibold text-foreground transition-colors group-hover:text-primary-ink">
          {d.name}
        </span>
      ),
    },
    { key: "type", header: "TYPE", cell: (d) => <TypePill type={d.type} /> },
    { key: "status", header: "STATUS", cell: (d) => <HealthPill status={d.health} /> },
    {
      key: "location",
      header: "LOCATION",
      className: "text-muted-foreground",
      headClassName: "",
      cell: (d) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground">{d.areaName}</span>
          <span className="inline-flex items-center gap-1 text-xs">
            <MapPin className="size-2.5" />
            {d.siteName}
          </span>
        </div>
      ),
    },
    {
      key: "ip",
      header: "IP",
      className: "font-mono text-sm text-muted-foreground",
      headClassName: "",
      cell: (d) => d.ip,
    },
    {
      key: "disk",
      header: "DISK USAGE",
      cell: (d) =>
        d.type === "nvr" && d.diskPct != null && d.diskBand && d.diskDisplay ? (
          <DiskBar pct={d.diskPct} band={d.diskBand} display={d.diskDisplay} />
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Database className="size-3 opacity-50" />
            n/a
          </span>
        ),
    },
    {
      key: "lastSync",
      header: "LAST SYNC",
      className: "text-muted-foreground",
      headClassName: "",
      cell: (d) => (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-sm",
            d.health === "online" ? "text-success" : "text-muted-foreground"
          )}
        >
          {d.lastSeenDisplay}
        </span>
      ),
    },
  ];

  return (
    <div data-slot="device-health-page" className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Device Health</PageHeader.Title>
        </PageHeader.Content>
      </PageHeader>

      {forcedState === "loading" ? (
        <ListLoadingState kpiCols={4} columns={8} />
      ) : forcedState === "error" ? (
        <ListErrorState onRetry={onRetry} title="Couldn't load device health" />
      ) : (
        <>
      {/* KPI cards */}
      <KpiGrid cols={3}>
        {KPI_CONFIGS.map((cfg) => (
          <KpiCard
            key={cfg.key}
            label={cfg.label}
            value={cfg.getValue(allDevices)}
            sub={cfg.sub}
            tone={cfg.accent}
            active={kpiFilter === cfg.key}
            onClick={() => handleKpiClick(cfg.key)}
          />
        ))}
      </KpiGrid>

      {/* Filter panel */}
      <FilterPanel
        filters={filters}
        onChange={(f) => { setFilters(f); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
      />

      {/* Count + sort */}
      <div data-slot="device-health-page-toolbar" className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base text-muted-foreground">
          <strong className="text-foreground">{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "device" : "devices"} match current filters
          {hasFilters && (
            <Button variant="link"
              onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); setKpiFilter("all"); }}
              className="h-auto p-0 border-0 font-normal ml-2 text-base text-muted-foreground underline hover:text-primary-ink"
            >
              Clear all
            </Button>
          )}
        </p>
        <Popover open={sortOpen} onOpenChange={setSortOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-1.5">
              {SORT_OPTIONS.find((o) => o.key === sort)?.label}
              <ChevronDown className="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-52 p-1">
            {SORT_OPTIONS.map((o) => (
              <ItemButton variant="plain"
                key={o.key}
                onClick={() => { setSort(o.key); setSortOpen(false); }}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                  sort === o.key ? "text-primary-ink" : "text-foreground"
                )}
              >
                {o.label}
                {sort === o.key && <Check className="size-3.5" />}
              </ItemButton>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {/* Table */}
      {forcedState === "empty" ? (
        <EmptyState
          icon={HeartPulse}
          title="No devices yet"
          description="Cameras and NVRs appear here once they're registered to the workspace."
          className="rounded-xl border border-dashed border-border"
        />
      ) : filtered.length === 0 ? (
        <div data-slot="device-health-page-empty" className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <HeartPulse className="size-10 opacity-20" />
          <p className="text-sm">No devices match the current filters.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); setKpiFilter("all"); }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div data-slot="device-health-page-table" className="overflow-hidden rounded-xl border border-border bg-card">
          <DataTable
            variant="list"
            columns={deviceColumns}
            data={pageItems}
            getRowId={(d) => d.id}
            onRowClick={openDevice}
            getRowClassName={() => "transition-colors"}
          />

          {/* Pagination */}
          <div data-slot="device-health-page-pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {filtered.length === 0
                ? "0 of 0"
                : `${(page - 1) * pageSize + 1} – ${Math.min(page * pageSize, filtered.length)} of ${filtered.length}`}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-transparent hover:bg-transparent dark:border-border dark:bg-transparent dark:hover:bg-transparent flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="px-2 text-sm text-foreground">
                {page} <span className="text-muted-foreground">of {pageCount}</span>
              </span>
              <Button variant="outline" size="icon-sm"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className="bg-transparent hover:bg-transparent dark:border-border dark:bg-transparent dark:hover:bg-transparent flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40"
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
