import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Check,
  X,
  Plus,
  HardDrive,
  AlertTriangle,
  Calendar,
  Trash2,
  MoreHorizontal,
  Pencil,
  Video,
  Link2,
  Unlink,
  Download,
  Sparkles,
  Layers,
  Cable,
  CheckCircle2,
  MapPin,
  CircleDot,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { MOCK_NVRS } from "@/mocks/nvr";
import { MOCK_CAMERAS, CAMERA_SITES, CAMERA_AREAS } from "@/mocks/cameras";
import { useCamerasStore } from "@/stores/useCamerasStore";
import { MOCK_RECORDINGS } from "@/mocks/recordings";
import { storageBandFor } from "@/types/nvr";
import type { NvrData, NvrStatus, StorageBand, NvrChannel } from "@/types/nvr";
import { KpiCard, KpiGrid, type KpiAccent } from "@/components/shared/KpiCard";
import { TruncatedText } from "@/components/shared/TruncatedText";

/* ── Status pill ─────────────────────────────────────────────────────────── */

const STATUS_STYLES: Record<NvrStatus, { bg: string; text: string; dot: string; label: string }> = {
  online:   { bg: "bg-success/15 border-success/30",   text: "text-success",          dot: "bg-success",          label: "Online" },
  offline:  { bg: "bg-muted border-border",            text: "text-muted-foreground", dot: "bg-muted-foreground", label: "Offline" },
  degraded: { bg: "bg-warning/15 border-warning/30",   text: "text-warning",          dot: "bg-warning",          label: "Degraded" },
};

function StatusPill({ status }: { status: NvrStatus }) {
  const s = STATUS_STYLES[status];
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

/* ── Storage bar ─────────────────────────────────────────────────────────── */

const BAND_STYLES: Record<StorageBand, { bar: string; text: string; label: string }> = {
  healthy:  { bar: "bg-success",      text: "text-success",      label: "Healthy" },
  warning:  { bar: "bg-warning",      text: "text-warning",      label: "Warning" },
  critical: { bar: "bg-sev-critical", text: "text-sev-critical", label: "Critical" },
};

function StorageBar({ used, total }: { used: number; total: number }) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((used / total) * 100));
  const band = storageBandFor(used, total);
  const styles = BAND_STYLES[band];
  return (
    <div className="min-w-[140px]">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className={cn("text-sm font-semibold", styles.text)}>{pct}%</span>
        <span className="font-mono text-2xs text-muted-foreground">
          {used.toLocaleString()} / {total.toLocaleString()} GB
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", styles.bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ── Storage donut (drawer) ──────────────────────────────────────────────── */

function StorageDonut({ usedPct, band, size = 140 }: { usedPct: number; band: StorageBand; size?: number }) {
  const r = (size - 28) / 2;
  const c = 2 * Math.PI * r;
  const dash = (usedPct / 100) * c;
  const colour = band === "critical" ? "var(--sev-critical)" : band === "warning" ? "var(--warning)" : "var(--success)";
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="12" className="text-muted" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={colour}
          strokeWidth="12"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className={cn("text-3xl font-bold leading-none", BAND_STYLES[band].text)}>
          {usedPct}%
        </p>
        <p className="mt-0.5 text-2xs uppercase tracking-widest text-muted-foreground">Used</p>
      </div>
    </div>
  );
}

/* ── KPI cards (page) ────────────────────────────────────────────────────── */

type KpiFilter = "all" | "online" | "offline" | "degraded" | "storage-critical";

const KPI_CONFIGS: {
  key: KpiFilter;
  label: string;
  sub: string;
  accent: KpiAccent;
  getValue: (items: NvrData[]) => number;
}[] = [
  { key: "all",              label: "Total NVRs",       sub: "Across all sites",      accent: "primary",      getValue: (i) => i.length },
  { key: "online",           label: "Online",           sub: "Recording active",      accent: "success",      getValue: (i) => i.filter((n) => n.status === "online").length },
  { key: "offline",          label: "Offline",          sub: "No recent contact",     accent: "muted",        getValue: (i) => i.filter((n) => n.status === "offline").length },
  { key: "degraded",         label: "Degraded",         sub: "Partial functionality", accent: "warning",      getValue: (i) => i.filter((n) => n.status === "degraded").length },
  { key: "storage-critical", label: "Storage Critical", sub: "≥ 90% utilised",        accent: "sev-critical", getValue: (i) => i.filter((n) => storageBandFor(n.usedStorageGb, n.totalStorageGb) === "critical").length },
];

/* ── Multi-select filter dropdown ─────────────────────────────────────────── */

interface FilterOption { value: string; label: string }

function FilterDropdown({
  label, options, selected, onChange,
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
        <button
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-base transition-colors hover:border-primary",
            open ? "border-primary" : "border-border",
            hasValue ? "text-primary" : "text-muted-foreground"
          )}
        >
          <TruncatedText text={displayLabel} className="font-medium" />
          <ChevronDown className={cn("size-3.5 flex-shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1.5">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <button
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
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

/* ── Filter panel ────────────────────────────────────────────────────────── */

interface NvrFilters {
  site: string[];
  area: string[];
  status: string[];
  storage: string[];
}
const EMPTY_FILTERS: NvrFilters = { site: [], area: [], status: [], storage: [] };

const STORAGE_OPTS: FilterOption[] = [
  { value: "healthy",  label: "Healthy (<75%)" },
  { value: "warning",  label: "Warning (75–90%)" },
  { value: "critical", label: "Critical (≥90%)" },
];

function FilterPanel({
  filters, onChange, search, onSearchChange,
}: {
  filters: NvrFilters;
  onChange: (f: NvrFilters) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const filterCount = Object.values(filters).reduce((s, arr) => s + arr.length, 0);
  const activeCount = filterCount + (search ? 1 : 0);

  function setGroup(group: keyof NvrFilters, values: string[]) {
    onChange({ ...filters, [group]: values });
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-base font-semibold text-foreground">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary px-2 py-px text-xs font-semibold text-primary-foreground">
              {activeCount} active
            </span>
          ) : (
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {["All sites", "All areas", "All storage"].map((l) => (
                <span key={l} className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  {l}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onChange(EMPTY_FILTERS); onSearchChange(""); }}
              className="text-sm text-muted-foreground underline hover:text-primary"
            >
              Clear all
            </button>
          )}
          {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by ID, name, model, or IP…"
              className="h-9 w-full pl-9 text-base"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { key: "site"    as const, label: "Site",    opts: CAMERA_SITES },
              { key: "area"    as const, label: "Area",    opts: CAMERA_AREAS },
              { key: "storage" as const, label: "Storage", opts: STORAGE_OPTS },
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

/* ── Channel storage helpers ─────────────────────────────────────────────── */

/** Returns total recorded GB for a (nvr, channel) pair. */
function channelStorageGb(nvrId: string, channel: NvrChannel): number {
  if (!channel.cameraId) return 0;
  const recs = MOCK_RECORDINGS.filter((r) => r.nvrId === nvrId && r.cameraId === channel.cameraId);
  const totalMb = recs.reduce((acc, r) => acc + r.fileSizeMb, 0);
  return Math.round((totalMb / 1024) * 100) / 100;
}

function channelRecordingCount(nvrId: string, channel: NvrChannel): number {
  if (!channel.cameraId) return 0;
  return MOCK_RECORDINGS.filter((r) => r.nvrId === nvrId && r.cameraId === channel.cameraId).length;
}

/** Decorate a channel with the linked camera's area + status. */
interface ChannelRow extends NvrChannel {
  cameraStatus?: "live" | "offline";
  cameraArea?: string;
  cameraSite?: string;
  storageGb: number;
  recordings: number;
  linkedAtDisplay?: string;
}

function buildChannelRows(nvr: NvrData): ChannelRow[] {
  return nvr.channels.map((ch) => {
    const cam = ch.cameraId ? MOCK_CAMERAS.find((c) => c.id === ch.cameraId) : null;
    return {
      ...ch,
      cameraStatus: cam ? (cam.status === "online" ? "live" : "offline") : undefined,
      cameraArea: cam?.areaName,
      cameraSite: cam?.siteName,
      storageGb: channelStorageGb(nvr.id, ch),
      recordings: channelRecordingCount(nvr.id, ch),
      // For the mock, treat the camera's activeAt as the linked-on date
      linkedAtDisplay: cam?.activeAtDisplay,
    };
  });
}

/* ── Drawer helper components ────────────────────────────────────────────── */

function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {children}
      </span>
      {aside}
    </div>
  );
}

// Unified compact StatCard — delegates to shared KpiCard so accent bar + sizing match.
function StatCard({ icon, label, value, valueClass, sub }: {
  icon?: React.ReactNode; label: string; value: React.ReactNode; valueClass?: string; sub?: string;
}) {
  void icon;
  const accent: KpiAccent =
    valueClass?.includes("text-success")      ? "success" :
    valueClass?.includes("text-info")         ? "info" :
    valueClass?.includes("text-sev-critical") ? "sev-critical" :
    valueClass?.includes("text-warning")      ? "warning" :
    valueClass?.includes("text-purple")       ? "purple" :
    "primary";
  return <KpiCard compact label={label} value={value} sub={sub} accent={accent} />;
}

function ChannelRecordingStatusPill({ status, hasCamera }: { status?: "live" | "offline"; hasCamera: boolean }) {
  if (!hasCamera) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-muted-foreground/70">
        Empty
      </span>
    );
  }
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/15 px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-success">
        <CircleDot className="size-2.5" />
        Recording
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/15 px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-warning">
      <AlertTriangle className="size-2.5" />
      Not Recording
    </span>
  );
}

/* ── NVR Drawer ──────────────────────────────────────────────────────────── */

type DrawerTab = "overview" | "channels";

interface NvrDrawerProps {
  nvr: NvrData | null;
  open: boolean;
  onClose: () => void;
  onOpenCamera: (cameraId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onCleanup: () => void;
  onExportAll: () => void;
  onLinkCamera: (channel: number) => void;
  onUnlink: (channel: number) => void;
}

function NvrDrawer({
  nvr, open, onClose, onOpenCamera, onEdit, onDelete, onCleanup, onExportAll, onLinkCamera, onUnlink,
}: NvrDrawerProps) {
  const [tab, setTab] = React.useState<DrawerTab>("overview");
  const [channelSearch, setChannelSearch] = React.useState("");

  React.useEffect(() => {
    if (open) { setTab("overview"); setChannelSearch(""); }
  }, [open, nvr?.id]);

  if (!nvr) {
    return (
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="right" showCloseButton={false} className="flex w-[min(860px,58vw)] max-w-[95vw] flex-col gap-0 p-0">
          <SheetHeader className="border-b border-border bg-card px-5 py-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-md text-muted-foreground">NVR not found</SheetTitle>
              <button onClick={onClose} className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  const band = storageBandFor(nvr.usedStorageGb, nvr.totalStorageGb);
  const usedPct = Math.min(100, Math.round((nvr.usedStorageGb / nvr.totalStorageGb) * 100));
  const availablePct = 100 - usedPct;
  const availableGb = nvr.totalStorageGb - nvr.usedStorageGb;
  const dailyGb = 4; // mock daily consumption
  const estDaysRemaining = availableGb > 0 ? Math.max(0, Math.floor(availableGb / dailyGb)) : 0;

  const channelRows = buildChannelRows(nvr);
  const filteredChannels = channelRows.filter((c) => {
    if (!channelSearch) return true;
    const q = channelSearch.toLowerCase();
    return [
      `Ch ${c.channel}`,
      c.cameraId ?? "",
      c.cameraName ?? "",
      c.cameraArea ?? "",
    ].join(" ").toLowerCase().includes(q);
  });

  const linkedChannels = channelRows.filter((c) => c.cameraId);
  const availableChannelCount = nvr.channelCount - nvr.channelsInUse;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-[min(860px,58vw)] max-w-[95vw] flex-col gap-0 p-0"
      >
        {/* Header */}
        <SheetHeader className="border-b border-border bg-card px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <StatusPill status={nvr.status} />
                {nvr.status === "offline" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-sev-critical/30 bg-sev-critical/10 px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-sev-critical">
                    <AlertTriangle className="size-3" />
                    NVR is offline
                  </span>
                )}
              </div>
              <div className="mb-1 flex items-center gap-2">
                <SheetTitle className="min-w-0 text-lg font-bold"><TruncatedText text={nvr.name} /></SheetTitle>
                <span className="rounded border border-border bg-muted px-1.5 py-px font-mono text-2xs text-muted-foreground">
                  {nvr.id}
                </span>
              </div>
              <p className="inline-flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3" />
                {nvr.siteName} · {nvr.areaName}
                <span className="text-muted-foreground/40">·</span>
                <span className="font-mono">{nvr.model}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-0.5 flex size-7 flex-shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-3 flex items-center gap-1">
            {[
              { key: "overview" as const, label: "Overview",           icon: Layers },
              { key: "channels" as const, label: "Channel Management", icon: Cable, badge: nvr.channelCount },
            ].map(({ key, label, icon: Icon, badge }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-2 text-base font-semibold transition-colors",
                  tab === key ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {label}
                {badge != null && (
                  <span className="ml-0.5 rounded-full bg-muted px-1.5 py-px text-2xs font-semibold text-muted-foreground">
                    {badge}
                  </span>
                )}
                {tab === key && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
        </SheetHeader>

        {/* Overview tab */}
        {tab === "overview" && (
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {/* 4 KPI strip */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                icon={<Cable className="size-3 text-success" />}
                label="Available Channels"
                value={availableChannelCount}
                valueClass={availableChannelCount > 0 ? "text-success" : "text-muted-foreground"}
                sub={`of ${nvr.channelCount} total`}
              />
              <StatCard
                icon={<Video className="size-3 text-info" />}
                label="Used Channels"
                value={`${nvr.channelsInUse}/${nvr.channelCount}`}
                valueClass="text-info"
                sub="Cameras linked"
              />
              <StatCard
                icon={<HardDrive className={cn("size-3", BAND_STYLES[band].text)} />}
                label="Storage Used"
                value={`${usedPct}%`}
                valueClass={BAND_STYLES[band].text}
                sub={`${nvr.usedStorageGb.toLocaleString()} / ${nvr.totalStorageGb.toLocaleString()} GB`}
              />
              <StatCard
                label="Last Activity"
                value={nvr.status === "online" ? "Live" : nvr.status === "degraded" ? "Degraded" : "Offline"}
                valueClass={
                  nvr.status === "online" ? "text-success" :
                  nvr.status === "degraded" ? "text-warning" :
                  "text-muted-foreground"
                }
                sub={`Last seen ${nvr.lastSeenDisplay}`}
              />
            </div>

            {/* Device Information */}
            <div>
              <SectionTitle>Device Information</SectionTitle>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-border bg-card p-4">
                {(
                  [
                    ["Device Type",   "NVR"],
                    ["NVR Name",      nvr.name],
                    ["NVR ID",        <span className="font-mono text-xs text-primary">{nvr.id}</span>],
                    ["Status",        <StatusPill status={nvr.status} />],
                    ["Manufacturer",  nvr.model.split(" ")[0] || "—"],
                    ["Model",         <span className="font-mono text-xs">{nvr.model}</span>],
                    ["Site Location", nvr.siteName],
                    ["Area",          nvr.areaName],
                    ["IP Address",    <span className="font-mono text-xs">{nvr.ipAddress}</span>],
                    ["HTTP Port",     <span className="font-mono text-xs">{nvr.httpPort}</span>],
                    ["Channels",      <span className="font-semibold">{nvr.channelsInUse} / {nvr.channelCount} in use</span>],
                    ["Cleanup",       <span className="capitalize">{nvr.cleanupSchedule.replace(/-/g, " ")}</span>],
                  ] as [string, React.ReactNode][]
                ).map(([label, value]) => (
                  <div key={label as string} className="flex flex-col gap-0.5">
                    <span className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {label}
                    </span>
                    <span className="text-base font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NVR Recording Storage */}
            <div>
              <SectionTitle>NVR Recording Storage</SectionTitle>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="grid grid-cols-[160px_1fr] items-center gap-5">
                  <StorageDonut usedPct={usedPct} band={band} size={140} />
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <p className="text-md font-bold text-foreground">
                        {nvr.usedStorageGb.toLocaleString()} GB used
                      </p>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-2xs font-bold uppercase tracking-wider",
                          BAND_STYLES[band].text,
                          band === "healthy" ? "border-success/30 bg-success/10" :
                          band === "warning" ? "border-warning/30 bg-warning/10" :
                          "border-sev-critical/30 bg-sev-critical/10"
                        )}
                      >
                        {BAND_STYLES[band].label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      of {nvr.totalStorageGb.toLocaleString()} GB total
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Retention <span className="font-semibold text-foreground">{nvr.retentionDays} days</span>{" "}
                      · Cleanup <span className="font-semibold text-foreground capitalize">{nvr.cleanupSchedule.replace(/-/g, " ")}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Total</p>
                    <p className="mt-0.5 text-md font-bold text-foreground">
                      {nvr.totalStorageGb.toLocaleString()} GB
                    </p>
                  </div>
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Available</p>
                    <p className="mt-0.5 text-md font-bold text-foreground">
                      {availableGb.toLocaleString()} GB <span className="text-xs font-normal text-muted-foreground">({availablePct}%)</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Est. Time Remaining</p>
                    <p className={cn("mt-0.5 text-md font-bold",
                      estDaysRemaining < 7 ? "text-sev-critical" : estDaysRemaining < 30 ? "text-warning" : "text-success"
                    )}>
                      {estDaysRemaining} days
                    </p>
                  </div>
                </div>

                {band === "critical" && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-sev-critical/30 bg-sev-critical/[0.06] px-3 py-2.5 text-xs text-muted-foreground">
                    <AlertTriangle className="size-3.5 flex-shrink-0 text-sev-critical" />
                    Auto-cleanup is deleting recordings older than the retention window. Events older than that lose replayable footage.
                  </div>
                )}
              </div>
            </div>

            {/* Recording Statistics by Channel */}
            <div>
              <SectionTitle
                aside={
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={onExportAll}>
                      <Download className="size-3.5" />
                      Export Recordings
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={onCleanup}>
                      <Sparkles className="size-3.5" />
                      Clean Up Storage
                    </Button>
                  </div>
                }
              >
                Recording Statistics by Channel ({linkedChannels.length})
              </SectionTitle>
              {nvr.status === "offline" && (
                <div className="mb-2 flex items-start gap-2 rounded-lg border border-sev-critical/30 bg-sev-critical/[0.06] px-3 py-2 text-xs">
                  <AlertTriangle className="size-3.5 flex-shrink-0 text-sev-critical" />
                  <p className="text-muted-foreground">
                    <strong className="text-sev-critical">Recording Disabled:</strong> This NVR is currently offline and recording is paused until it reconnects.
                  </p>
                </div>
              )}
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr className="border-b border-border text-left">
                      {["CH", "CAMERA", "RECORDING", "LOCATION", "STORAGE USED", "RECORDINGS"].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2.5 font-mono text-2xs uppercase tracking-[0.15em] text-muted-foreground/60"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {linkedChannels.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                          No cameras linked to this NVR yet.
                        </td>
                      </tr>
                    ) : (
                      linkedChannels.map((ch) => (
                        <tr key={ch.channel} className="group text-base transition-colors hover:bg-muted/20">
                          <td className="px-3 py-2.5 font-mono text-sm text-muted-foreground">
                            Ch {String(ch.channel).padStart(2, "0")}
                          </td>
                          <td className="px-3 py-2.5">
                            <button
                              onClick={() => ch.cameraId && onOpenCamera(ch.cameraId)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-info/20 bg-info/5 px-2 py-1 text-xs text-info hover:bg-info/15"
                            >
                              <Video className="size-3" />
                              <span className="font-mono">{ch.cameraId}</span>
                            </button>
                            {ch.cameraName && (
                              <p className="mt-1 text-xs text-muted-foreground">{ch.cameraName}</p>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <ChannelRecordingStatusPill status={ch.cameraStatus} hasCamera={!!ch.cameraId} />
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {ch.cameraArea ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="inline-flex items-center gap-1 text-foreground">
                                  <MapPin className="size-2.5" />
                                  {ch.cameraArea}
                                </span>
                                <span className="text-xs">{ch.cameraSite}</span>
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-mono text-sm font-semibold text-foreground">
                              {ch.storageGb.toFixed(2)} GB
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-foreground">{ch.recordings}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Channel Management tab */}
        {tab === "channels" && (
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="relative max-w-sm flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={channelSearch}
                  onChange={(e) => setChannelSearch(e.target.value)}
                  placeholder="Search by channel, camera ID, or area…"
                  className="h-9 w-full pl-9 text-base"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{filteredChannels.length}</strong> / {nvr.channelCount} channels
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr className="border-b border-border text-left">
                    {["CH", "CAMERA", "RECORDING", "LOCATION", "IP", "LINKED ON", "ACTION"].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2.5 font-mono text-2xs uppercase tracking-[0.15em] text-muted-foreground/60"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredChannels.map((ch) => {
                    const cam = ch.cameraId ? MOCK_CAMERAS.find((c) => c.id === ch.cameraId) : null;
                    return (
                      <tr key={ch.channel} className="text-base transition-colors hover:bg-muted/20">
                        <td className="px-3 py-2.5 font-mono text-sm text-muted-foreground">
                          Ch {String(ch.channel).padStart(2, "0")}
                        </td>
                        <td className="px-3 py-2.5">
                          {ch.cameraId ? (
                            <button
                              onClick={() => onOpenCamera(ch.cameraId!)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-info/20 bg-info/5 px-2 py-1 text-xs text-info hover:bg-info/15"
                            >
                              <Video className="size-3" />
                              <span className="font-mono">{ch.cameraId}</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md border border-success/30 bg-success/10 px-2 py-1 text-xs font-semibold text-success">
                              Available
                            </span>
                          )}
                          {ch.cameraName && (
                            <p className="mt-1 text-xs text-muted-foreground">{ch.cameraName}</p>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <ChannelRecordingStatusPill status={ch.cameraStatus} hasCamera={!!ch.cameraId} />
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {ch.cameraArea ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1 text-foreground">
                                <MapPin className="size-2.5" />
                                {ch.cameraArea}
                              </span>
                              <span className="text-xs">{ch.cameraSite}</span>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-sm text-muted-foreground">
                          {cam?.ipAddress ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {ch.linkedAtDisplay ? (
                            <div className="inline-flex items-center gap-1 text-sm">
                              <Calendar className="size-3 opacity-60" />
                              {ch.linkedAtDisplay}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {ch.cameraId ? (
                            <button
                              onClick={() => onUnlink(ch.channel)}
                              title="Unlink camera"
                              aria-label="Unlink camera"
                              className="flex size-7 items-center justify-center rounded-md border border-sev-critical/30 text-sev-critical transition-colors hover:bg-sev-critical/10"
                            >
                              <Unlink className="size-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => onLinkCamera(ch.channel)}
                              title="Link camera"
                              aria-label="Link camera"
                              className="flex size-7 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary transition-colors hover:bg-primary/20"
                            >
                              <Link2 className="size-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-border bg-card px-5 py-3.5">
          <Button size="sm" className="gap-1.5" onClick={onEdit}>
            <Pencil className="size-3.5" />
            Edit NVR
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onExportAll}>
            <Download className="size-3.5" />
            Export Recordings
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
            Delete NVR
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Export Recordings modal ─────────────────────────────────────────────── */

type ExportRange = "today" | "yesterday" | "week" | "month" | "all";
type ExportFormat = "zip" | "mp4-pack" | "manifest-only";

const EXPORT_RANGES: { value: ExportRange; label: string }[] = [
  { value: "today",     label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week",      label: "This Week" },
  { value: "month",     label: "This Month" },
  { value: "all",       label: "All Time" },
];
const EXPORT_FORMATS: { value: ExportFormat; label: string; desc: string }[] = [
  { value: "zip",            label: "ZIP archive",       desc: "All recordings packed in a single .zip" },
  { value: "mp4-pack",       label: "MP4 pack",          desc: "Individual .mp4 files in a folder" },
  { value: "manifest-only",  label: "Manifest only",     desc: "JSON listing — no media payload" },
];

function ExportRecordingsModal({
  open, nvr, onClose, onConfirm,
}: {
  open: boolean;
  nvr: NvrData | null;
  onClose: () => void;
  onConfirm: (payload: { channels: number[]; range: ExportRange; format: ExportFormat; totalGb: number; recordingCount: number }) => void;
}) {
  const [channels, setChannels] = React.useState<number[]>([]);
  const [range, setRange] = React.useState<ExportRange>("all");
  const [format, setFormat] = React.useState<ExportFormat>("zip");

  React.useEffect(() => {
    if (open && nvr) {
      // Pre-select all linked channels
      setChannels(nvr.channels.filter((c) => c.cameraId).map((c) => c.channel));
      setRange("all");
      setFormat("zip");
    }
  }, [open, nvr?.id]);

  if (!nvr) return null;

  const rows = buildChannelRows(nvr).filter((c) => c.cameraId);
  const allSelected = rows.length > 0 && rows.every((r) => channels.includes(r.channel));
  const someSelected = !allSelected && rows.some((r) => channels.includes(r.channel));

  const selectedRows = rows.filter((r) => channels.includes(r.channel));
  const totalGb = selectedRows.reduce((acc, r) => acc + r.storageGb, 0);
  const recordingCount = selectedRows.reduce((acc, r) => acc + r.recordings, 0);

  function toggleAll() {
    setChannels(allSelected ? [] : rows.map((r) => r.channel));
  }
  function toggleChannel(ch: number) {
    setChannels((curr) => curr.includes(ch) ? curr.filter((c) => c !== ch) : [...curr, ch]);
  }

  const canSubmit = channels.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Export Recordings</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Download recordings from selected channels on <strong className="text-foreground">{nvr.name}</strong>.
          </p>
        </DialogHeader>
        <div className="space-y-4 px-5 py-4">
          {/* Channels */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Channels to Export
              </p>
              <button onClick={toggleAll} className="text-xs text-primary hover:underline">
                {allSelected ? "Unselect all" : "Select all"}
              </button>
            </div>
            {rows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                No channels with recordings.
              </div>
            ) : (
              <div className="max-h-[200px] space-y-1.5 overflow-y-auto pr-1">
                {rows.map((ch) => {
                  const checked = channels.includes(ch.channel);
                  return (
                    <button
                      key={ch.channel}
                      onClick={() => toggleChannel(ch.channel)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-left transition-colors",
                        checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className={cn(
                        "flex size-4 flex-shrink-0 items-center justify-center rounded border",
                        checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                      )}>
                        {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <TruncatedText
                          title={`${ch.cameraName} (Channel ${ch.channel})`}
                          className="text-base font-semibold text-foreground"
                        >
                          {ch.cameraName} <span className="font-mono text-xs text-muted-foreground">(Channel {ch.channel})</span>
                        </TruncatedText>
                        <p className="text-xs text-muted-foreground">
                          {ch.cameraSite} · {ch.cameraArea}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-semibold text-foreground">{ch.storageGb.toFixed(2)} GB</p>
                        <p className="text-2xs text-muted-foreground">{ch.recordings} files</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {someSelected && (
              <p className="mt-1 text-xs text-muted-foreground">
                {channels.length} of {rows.length} channels selected
              </p>
            )}
          </div>

          {/* Date range */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Date Range
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {EXPORT_RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-sm font-semibold transition-colors",
                    range === r.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Export Format
            </p>
            <div className="space-y-2">
              {EXPORT_FORMATS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border bg-background p-3 text-left transition-colors",
                    format === f.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                >
                  <div className={cn(
                    "mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded-full border",
                    format === f.value ? "border-primary" : "border-muted-foreground/40"
                  )}>
                    {format === f.value && <span className="size-2 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-foreground">{f.label}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{f.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {canSubmit && (
            <div className="rounded-lg border border-info/30 bg-info/[0.06] px-3.5 py-2.5">
              <p className="text-sm text-muted-foreground">
                Exporting <strong className="text-foreground">{recordingCount}</strong> recordings
                ({totalGb.toFixed(2)} GB) from <strong className="text-foreground">{channels.length}</strong> channel{channels.length === 1 ? "" : "s"} —
                <strong className="text-foreground"> {EXPORT_RANGES.find((r) => r.value === range)?.label}</strong> ·
                <strong className="text-foreground"> {EXPORT_FORMATS.find((f) => f.value === format)?.label}</strong>
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            disabled={!canSubmit}
            onClick={() => onConfirm({ channels, range, format, totalGb, recordingCount })}
            className="gap-1.5"
          >
            <Download className="size-3.5" />
            Export {totalGb > 0 ? `(${totalGb.toFixed(2)} GB)` : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Clean Up Storage modal ──────────────────────────────────────────────── */

type CleanupMethod = "age" | "channel";

function CleanupStorageModal({
  open, nvr, onClose, onConfirm,
}: {
  open: boolean;
  nvr: NvrData | null;
  onClose: () => void;
  onConfirm: (method: CleanupMethod, payload: { ageDays?: number; channels?: number[] }) => void;
}) {
  const [method, setMethod] = React.useState<CleanupMethod>("age");
  const [ageDays, setAgeDays] = React.useState(30);
  const [picked, setPicked] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (open) { setMethod("age"); setAgeDays(30); setPicked([]); }
  }, [open, nvr?.id]);

  if (!nvr) return null;

  const usedPct = Math.min(100, Math.round((nvr.usedStorageGb / nvr.totalStorageGb) * 100));
  const linkedChannels = buildChannelRows(nvr).filter((c) => c.cameraId);
  const canSubmit = method === "age" ? ageDays > 0 : picked.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] overflow-y-auto p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Clean up Storage</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          {/* Current capacity */}
          <div className="rounded-lg border border-border bg-background p-3.5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Storage Capacity
            </p>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="font-mono text-sm text-muted-foreground">
                <strong className="text-foreground">{nvr.usedStorageGb.toLocaleString()} GB</strong> of {nvr.totalStorageGb.toLocaleString()} GB used
              </span>
              <span className={cn("text-sm font-semibold", BAND_STYLES[storageBandFor(nvr.usedStorageGb, nvr.totalStorageGb)].text)}>
                {usedPct}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full", BAND_STYLES[storageBandFor(nvr.usedStorageGb, nvr.totalStorageGb)].bar)}
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>

          {/* Method picker */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Clean up Method
            </p>
            <div className="space-y-2">
              {[
                { value: "age" as const,     title: "Age Based Clean up",     desc: "Remove recordings older than a specific number of days" },
                { value: "channel" as const, title: "Channel Based Clean up", desc: "Remove recordings from specific channels" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMethod(opt.value)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border bg-background p-3 text-left transition-colors",
                    method === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                >
                  <div className={cn(
                    "mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded-full border",
                    method === opt.value ? "border-primary" : "border-muted-foreground/40"
                  )}>
                    {method === opt.value && <span className="size-2 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-foreground">{opt.title}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {method === "age" && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Remove recordings older than
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {[7, 14, 30, 60, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setAgeDays(d)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors",
                      ageDays === d
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>
          )}

          {method === "channel" && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Select Channel*
              </p>
              {linkedChannels.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  No channels with recordings.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {linkedChannels.map((ch) => {
                    const checked = picked.includes(ch.channel);
                    return (
                      <button
                        key={ch.channel}
                        onClick={() =>
                          setPicked((curr) => curr.includes(ch.channel) ? curr.filter((c) => c !== ch.channel) : [...curr, ch.channel])
                        }
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-left transition-colors",
                          checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        )}
                      >
                        <div className={cn(
                          "flex size-4 flex-shrink-0 items-center justify-center rounded border",
                          checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                        )}>
                          {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <TruncatedText
                            title={`${ch.cameraName} (Channel ${ch.channel})`}
                            className="text-base font-semibold text-foreground"
                          >
                            {ch.cameraName} <span className="font-mono text-xs text-muted-foreground">(Channel {ch.channel})</span>
                          </TruncatedText>
                          <p className="text-xs text-muted-foreground">{ch.cameraSite} · {ch.cameraArea}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-semibold text-foreground">{ch.storageGb.toFixed(2)} GB</p>
                          <p className="text-2xs text-muted-foreground">{ch.recordings} Recordings</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            disabled={!canSubmit}
            onClick={() => onConfirm(method, method === "age" ? { ageDays } : { channels: picked })}
            className="gap-1.5"
          >
            <Sparkles className="size-3.5" />
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Clean Up Running (progress) modal ───────────────────────────────────── */

function CleanupRunningModal({
  open, methodLabel, totalToProcess, onCancel,
}: {
  open: boolean;
  methodLabel: string;
  totalToProcess: number;
  onCancel: () => void;
}) {
  const [progress, setProgress] = React.useState(0);
  const [processed, setProcessed] = React.useState(0);

  React.useEffect(() => {
    if (!open) { setProgress(0); setProcessed(0); return; }
    let pct = 0;
    const interval = setInterval(() => {
      pct += 7 + Math.random() * 8;
      if (pct >= 100) pct = 100;
      setProgress(Math.round(pct));
      setProcessed(Math.floor((pct / 100) * totalToProcess));
      if (pct >= 100) clearInterval(interval);
    }, 220);
    return () => clearInterval(interval);
  }, [open, totalToProcess]);

  return (
    <Dialog open={open} onOpenChange={() => { /* not dismissible by overlay */ }}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Cleaning Up Storage…</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {methodLabel} · {processed} of {totalToProcess} files processed
          </p>
        </DialogHeader>
        <div className="space-y-4 px-5 py-5">
          <div className="flex items-center justify-center">
            <div className="relative">
              <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
                <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                <circle
                  cx="48" cy="48" r="40"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="8"
                  strokeDasharray={`${(progress / 100) * (2 * Math.PI * 40)} ${2 * Math.PI * 40}`}
                  strokeLinecap="round"
                  className="transition-all duration-200"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-2xl font-bold text-foreground">{progress}%</p>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-mono font-semibold text-foreground">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Don't close this window. Cleanup will continue until complete.
          </p>
        </div>
        <div className="flex justify-end border-t border-border px-5 py-3.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10"
          >
            <X className="size-3.5" />
            Cancel Cleanup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Clean Up Completed modal ────────────────────────────────────────────── */

function CleanupCompletedModal({
  open, previous, freed, current, total, processed, onClose,
}: {
  open: boolean;
  previous: number;
  freed: number;
  current: number;
  total: number;
  processed: { processed: number; outOf: number };
  onClose: () => void;
}) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="sr-only">Clean Up Completed</DialogTitle>
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-success/15">
              <CheckCircle2 className="size-6 text-success" />
            </div>
            <div>
              <p className="text-md font-bold text-foreground">Clean Up Completed!</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {processed.processed} of {processed.outOf} files processed
              </p>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-3 px-5 py-4">
          <div>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-muted-foreground">Storage Usage</span>
              <span className="text-sm font-bold text-success">{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-success transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-background p-3.5">
            <div className="flex items-center justify-between text-base">
              <span className="text-muted-foreground">Previous Usage:</span>
              <span className="font-mono font-semibold text-foreground">{previous.toLocaleString()} GB</span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span className="text-muted-foreground">Space Freed:</span>
              <span className="font-mono font-semibold text-sev-critical">- {freed.toLocaleString()} GB</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2 text-base">
              <span className="text-muted-foreground">Current Storage:</span>
              <span className="font-mono font-semibold text-success">{current.toLocaleString()} GB ({pct}%)</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end border-t border-border px-5 py-3.5">
          <Button size="sm" onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Link Camera modal ───────────────────────────────────────────────────── */

function LinkCameraModal({
  open, nvr, channel, onClose, onConfirm,
}: {
  open: boolean;
  nvr: NvrData | null;
  channel: number | null;
  onClose: () => void;
  onConfirm: (cameraId: string) => void;
}) {
  const cameras = useCamerasStore((s) => s.cameras);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [areaFilter, setAreaFilter] = React.useState<string | "all">("all");

  React.useEffect(() => {
    if (open) { setPicked(null); setSearch(""); setAreaFilter("all"); }
  }, [open, channel]);

  if (!nvr || channel == null) return null;

  // Same-site cameras with no NVR link
  const candidates = cameras.filter((c) => c.siteId === nvr.siteId && !c.nvrId);
  const areas = Array.from(new Set(candidates.map((c) => c.areaId))).map((id) => {
    const cam = candidates.find((c) => c.areaId === id);
    return { id, label: cam?.areaName ?? id };
  });

  const q = search.trim().toLowerCase();
  const filtered = candidates.filter((c) => {
    if (areaFilter !== "all" && c.areaId !== areaFilter) return false;
    if (q && !`${c.id} ${c.name} ${c.areaName}`.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Link Camera to Channel {channel}</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Only cameras at <strong className="text-foreground">{nvr.siteName}</strong> (same site as this NVR) can be linked.
          </p>
        </DialogHeader>
        <div className="flex-shrink-0 space-y-2 border-b border-border px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by camera name, ID or area…" className="h-9 pl-9 text-base" />
          </div>
          {areas.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Area</span>
              <button
                onClick={() => setAreaFilter("all")}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
                  areaFilter === "all" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}
              >
                All ({candidates.length})
              </button>
              {areas.map((a) => {
                const count = candidates.filter((c) => c.areaId === a.id).length;
                const active = areaFilter === a.id;
                return (
                  <button key={a.id} onClick={() => setAreaFilter(a.id)}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
                      active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    )}>
                    {a.label} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
          {candidates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
              <Video className="mx-auto size-7 text-muted-foreground/40" />
              <p className="mt-2 text-base text-muted-foreground">
                No unlinked cameras at this site.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add a camera at {nvr.siteName} first, or unlink an existing one to make it available.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm italic text-muted-foreground">No cameras match the current filters.</p>
          ) : (
            filtered.map((c) => {
              const selected = picked === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setPicked(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left transition-colors",
                    selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                >
                  <div className={cn(
                    "flex size-4 flex-shrink-0 items-center justify-center rounded-full border",
                    selected ? "border-primary" : "border-muted-foreground/40"
                  )}>
                    {selected && <span className="size-2 rounded-full bg-primary" />}
                  </div>
                  <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg border border-info/30 bg-info/10">
                    <Video className="size-4 text-info" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <TruncatedText text={c.name} className="text-base font-semibold text-foreground" />
                    <p className="font-mono text-xs text-muted-foreground">{c.id} · {c.areaName}</p>
                  </div>
                  <StatusPill status={c.status === "online" ? "online" : c.status === "offline" ? "offline" : "degraded"} />
                </button>
              );
            })
          )}
        </div>
        <div className="flex flex-shrink-0 justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!picked} onClick={() => picked && onConfirm(picked)} className="gap-1.5">
            <Link2 className="size-3.5" />
            Link to Channel {channel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Unlink confirmation modal ───────────────────────────────────────────── */

function UnlinkConfirmModal({
  open, nvr, channel, onClose, onConfirm, onExportFirst,
}: {
  open: boolean;
  nvr: NvrData | null;
  channel: number | null;
  onClose: () => void;
  onConfirm: () => void;
  onExportFirst: () => void;
}) {
  const [exportFirst, setExportFirst] = React.useState(true);
  React.useEffect(() => { if (open) setExportFirst(true); }, [open, channel]);

  if (!nvr || channel == null) return null;
  const ch = nvr.channels.find((c) => c.channel === channel);
  if (!ch) return null;
  const cam = ch.cameraId ? MOCK_CAMERAS.find((c) => c.id === ch.cameraId) : null;
  const recCount = ch.cameraId ? MOCK_RECORDINGS.filter((r) => r.nvrId === nvr.id && r.cameraId === ch.cameraId).length : 0;
  const storageGb = channelStorageGb(nvr.id, ch);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold text-destructive">Unlink Camera</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Confirm before disconnecting this channel.
          </p>
        </DialogHeader>
        <div className="space-y-3 px-5 py-4">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
            <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg border border-info/30 bg-info/10">
              <Video className="size-4 text-info" />
            </div>
            <div className="min-w-0 flex-1">
              <TruncatedText text={cam?.name ?? ch.cameraName ?? "—"} className="text-base font-semibold text-foreground" />
              <p className="font-mono text-xs text-muted-foreground">
                {ch.cameraId} · Channel {channel} · {cam?.areaName ?? ""}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-warning" />
              <div className="text-sm leading-relaxed text-muted-foreground">
                Unlinking will stop new recordings from this camera. Existing recordings —
                <strong className="text-foreground"> {recCount} files, {storageGb.toFixed(2)} GB</strong>
                — will remain on the NVR until their retention window expires.
                <p className="mt-1">
                  The camera detection events will <strong className="text-foreground">no longer have replayable footage</strong> until you link it to another channel.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setExportFirst((v) => !v)}
            className={cn(
              "flex w-full items-start gap-2.5 rounded-lg border bg-background px-3 py-2.5 text-left transition-colors",
              exportFirst ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
            )}
          >
            <div className={cn(
              "mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded border",
              exportFirst ? "border-primary bg-primary" : "border-muted-foreground/40"
            )}>
              {exportFirst && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-foreground">Export recordings before unlinking</p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                Download all {recCount} recordings ({storageGb.toFixed(2)} GB) as a ZIP archive before disconnecting.
              </p>
            </div>
          </button>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          {exportFirst && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { onExportFirst(); onConfirm(); }}>
              <Download className="size-3.5" />
              Export &amp; Unlink
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            className="gap-1.5"
            onClick={onConfirm}
          >
            <Unlink className="size-3.5" />
            Unlink without Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Add NVR modal ───────────────────────────────────────────────────────── */

interface AddNvrFields {
  id: string;          // auto-generated
  name: string;
  /** "" while the user hasn't picked a model — surfaces a "Select model" placeholder option. */
  model: string;
  siteId: string;
  areaId: string;
  ipAddress: string;
  /** String-typed in form to keep "empty placeholder" UX; parsed on submit. */
  httpPort: string;
  totalStorageGb: string;
  /** String so the field can be empty before user picks; parsed on submit. */
  channelCount: string;
  retentionDays: string;
  cleanupSchedule: NvrData["cleanupSchedule"] | "";
}

function nextNvrId(takenIds: string[]): string {
  let n = 1;
  while (takenIds.includes(`NVR-${String(n).padStart(3, "0")}`)) n++;
  return `NVR-${String(n).padStart(3, "0")}`;
}

function AddNvrModal({
  open, takenIds, onClose, onConfirm,
}: {
  open: boolean;
  takenIds: string[];
  onClose: () => void;
  onConfirm: (fields: AddNvrFields) => void;
}) {
  const blank = (): AddNvrFields => ({
    id: nextNvrId(takenIds),
    name: "",
    model: "",
    siteId: "",
    areaId: "",
    ipAddress: "",
    httpPort: "",
    totalStorageGb: "",
    channelCount: "",
    retentionDays: "",
    cleanupSchedule: "",
  });

  const [fields, setFields] = React.useState<AddNvrFields>(blank);

  React.useEffect(() => {
    if (open) setFields(blank());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function set<K extends keyof AddNvrFields>(key: K, value: AddNvrFields[K]) {
    setFields((curr) => ({ ...curr, [key]: value }));
  }

  const canSubmit =
    fields.name.trim() &&
    fields.model.trim() &&
    fields.siteId &&
    fields.areaId &&
    fields.ipAddress.trim() &&
    Number(fields.channelCount) > 0 &&
    Number(fields.totalStorageGb) > 0 &&
    fields.cleanupSchedule !== "";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Add NVR</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Register a new Network Video Recorder. NVR ID is generated automatically.
          </p>
        </DialogHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* Auto-generated ID preview */}
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
              NVR ID (auto-generated)
            </p>
            <p className="mt-1 font-mono text-md font-bold text-primary">{fields.id}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">NVR Name</label>
              <input
                value={fields.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. FedEx Changi · NVR-A"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Model</label>
              <select
                value={fields.model}
                onChange={(e) => set("model", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-base text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Select an NVR model</option>
                <option value="Hikvision DS-9664NI-I8">Hikvision DS-9664NI-I8 (64-ch)</option>
                <option value="Hikvision DS-7716NI-I4">Hikvision DS-7716NI-I4 (16-ch)</option>
                <option value="Dahua NVR5864-4KS2">Dahua NVR5864-4KS2 (64-ch)</option>
                <option value="Dahua NVR4232-4KS2">Dahua NVR4232-4KS2 (32-ch)</option>
                <option value="Uniview NVR308-32E2">Uniview NVR308-32E2 (32-ch)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Site</label>
              <select
                value={fields.siteId}
                onChange={(e) => set("siteId", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Select a site</option>
                {CAMERA_SITES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Area</label>
              <select
                value={fields.areaId}
                onChange={(e) => set("areaId", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Select an area</option>
                {CAMERA_AREAS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">IP Address</label>
              <input
                value={fields.ipAddress}
                onChange={(e) => set("ipAddress", e.target.value)}
                placeholder="10.10.0.10"
                className="h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">HTTP Port</label>
              <input
                type="number"
                value={fields.httpPort}
                onChange={(e) => set("httpPort", e.target.value)}
                placeholder="80"
                className="h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Channel Count</label>
              <select
                value={fields.channelCount}
                onChange={(e) => set("channelCount", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Select channels</option>
                {[4, 8, 16, 32, 64].map((c) => (
                  <option key={c} value={c}>{c} channels</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Storage (GB)</label>
              <input
                type="number"
                value={fields.totalStorageGb}
                onChange={(e) => set("totalStorageGb", e.target.value)}
                placeholder="8000"
                className="h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Retention (days)</label>
              <input
                type="number"
                value={fields.retentionDays}
                onChange={(e) => set("retentionDays", e.target.value)}
                placeholder="30"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cleanup Mode</label>
              <select
                value={fields.cleanupSchedule}
                onChange={(e) => set("cleanupSchedule", e.target.value as NvrData["cleanupSchedule"])}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Select cleanup mode</option>
                <option value="auto-age">Auto · Age based</option>
                <option value="auto-channel">Auto · Channel based</option>
                <option value="manual">Manual only</option>
              </select>
            </div>
          </div>

          <div className="rounded-lg border border-info/30 bg-info/[0.06] px-3 py-2.5 text-sm text-muted-foreground">
            New NVRs start with all channels free. Link cameras to channels after creation from the
            <strong className="text-foreground"> Channel Management</strong> tab.
          </div>
        </div>
        <div className="flex flex-shrink-0 justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!canSubmit} onClick={() => onConfirm(fields)} className="gap-1.5">
            <Plus className="size-3.5" />
            Add NVR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Edit NVR modal ──────────────────────────────────────────────────────── */

interface NvrFormFields {
  name: string;
  siteId: string;
  areaId: string;
  ipAddress: string;
  httpPort: string;
  totalStorageGb: string;
  retentionDays: string;
  cleanupSchedule: NvrData["cleanupSchedule"] | "";
}

function EditNvrModal({
  open, nvr, onClose, onConfirm,
}: {
  open: boolean;
  nvr: NvrData | null;
  onClose: () => void;
  onConfirm: (fields: NvrFormFields) => void;
}) {
  const [fields, setFields] = React.useState<NvrFormFields>({
    name: "", siteId: "", areaId: "", ipAddress: "", httpPort: "", totalStorageGb: "", retentionDays: "", cleanupSchedule: "",
  });

  React.useEffect(() => {
    if (open && nvr) {
      setFields({
        name: nvr.name,
        siteId: nvr.siteId,
        areaId: nvr.areaId,
        ipAddress: nvr.ipAddress,
        httpPort: String(nvr.httpPort),
        totalStorageGb: String(nvr.totalStorageGb),
        retentionDays: String(nvr.retentionDays),
        cleanupSchedule: nvr.cleanupSchedule,
      });
    }
  }, [open, nvr]);

  if (!nvr) return null;

  function set<K extends keyof NvrFormFields>(key: K, value: NvrFormFields[K]) {
    setFields((curr) => ({ ...curr, [key]: value }));
  }

  const canSubmit = fields.name.trim() && fields.ipAddress.trim() && fields.siteId && fields.areaId;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Edit NVR</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Update fields for {nvr.id}. Model and channel count cannot be changed after registration.
          </p>
        </DialogHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* Read-only header */}
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">NVR ID</p>
                <p className="mt-0.5 font-mono text-primary">{nvr.id}</p>
              </div>
              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Model</p>
                <p className="mt-0.5 font-mono text-foreground">{nvr.model}</p>
              </div>
              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Channels</p>
                <p className="mt-0.5 font-semibold text-foreground">{nvr.channelsInUse} / {nvr.channelCount} in use</p>
              </div>
              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Total Storage</p>
                <p className="mt-0.5 font-mono text-foreground">{nvr.totalStorageGb.toLocaleString()} GB</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">NVR Name</label>
              <input
                value={fields.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. FedEx Changi · NVR-A"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Site</label>
              <select
                value={fields.siteId}
                onChange={(e) => set("siteId", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Select a site</option>
                {CAMERA_SITES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Area</label>
              <select
                value={fields.areaId}
                onChange={(e) => set("areaId", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Select an area</option>
                {CAMERA_AREAS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">IP Address</label>
              <input
                value={fields.ipAddress}
                onChange={(e) => set("ipAddress", e.target.value)}
                placeholder="10.10.0.10"
                className="h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">HTTP Port</label>
              <input
                type="number"
                value={fields.httpPort}
                onChange={(e) => set("httpPort", e.target.value)}
                placeholder="80"
                className="h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Storage (GB)</label>
              <input
                type="number"
                value={fields.totalStorageGb}
                onChange={(e) => set("totalStorageGb", e.target.value)}
                placeholder="8000"
                className="h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Retention (days)</label>
              <input
                type="number"
                value={fields.retentionDays}
                onChange={(e) => set("retentionDays", e.target.value)}
                placeholder="30"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cleanup Mode</label>
              <select
                value={fields.cleanupSchedule}
                onChange={(e) => set("cleanupSchedule", e.target.value as NvrFormFields["cleanupSchedule"])}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Select cleanup mode</option>
                <option value="auto-age">Auto · Age based</option>
                <option value="auto-channel">Auto · Channel based</option>
                <option value="manual">Manual only</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!canSubmit} onClick={() => onConfirm(fields)} className="gap-1.5">
            <Check className="size-3.5" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Delete NVR modal ────────────────────────────────────────────────────── */

function DeleteNvrModal({
  open, nvr, onClose, onConfirm,
}: {
  open: boolean;
  nvr: NvrData | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!nvr) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold text-destructive">Delete NVR</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">This action cannot be undone.</p>
        </DialogHeader>
        <div className="px-5 py-4">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="mt-0.5 size-4 flex-shrink-0 text-destructive" />
              <div>
                <p className="text-base font-semibold text-foreground">You are about to remove:</p>
                <p className="mt-1 font-mono text-sm text-muted-foreground">{nvr.id}</p>
                <p className="mt-0.5 text-base text-muted-foreground">{nvr.name} ({nvr.model})</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            All <strong className="text-foreground">{nvr.channelsInUse}</strong> linked cameras will lose recording storage immediately.
            Stored recordings ({nvr.usedStorageGb.toLocaleString()} GB) cannot be recovered.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" variant="destructive" className="gap-1.5" onClick={onConfirm}>
            <Trash2 className="size-3.5" />
            Delete NVR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Toast ───────────────────────────────────────────────────────────────── */

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function NvrDevicesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const updateCameraInStore = useCamerasStore((s) => s.updateCamera);
  const [nvrs, setNvrs] = React.useState<NvrData[]>(() => [...MOCK_NVRS]);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<NvrFilters>(EMPTY_FILTERS);
  const [kpiFilter, setKpiFilter] = React.useState<KpiFilter>("all");
  const [drawerId, setDrawerId] = React.useState<string | null>(searchParams.get("nvr"));
  const [page, setPage] = React.useState(1);
  const [modal, setModal] = React.useState<
    | { kind: "cleanup" }
    | { kind: "cleanup-running"; methodLabel: string; totalToProcess: number; freed: number; previous: number; processed: number }
    | { kind: "cleanup-done"; previous: number; freed: number; current: number; total: number; processed: { processed: number; outOf: number } }
    | { kind: "export" }
    | { kind: "edit" }
    | { kind: "add" }
    | { kind: "link"; channel: number }
    | { kind: "unlink"; channel: number }
    | { kind: "delete" }
    | null
  >(null);
  const cleanupTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageSize = 10;

  React.useEffect(() => {
    const q = searchParams.get("nvr");
    if (q && q !== drawerId) setDrawerId(q);
    if (!q && drawerId) setDrawerId(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = React.useMemo(() => {
    return nvrs.filter((n) => {
      const band = storageBandFor(n.usedStorageGb, n.totalStorageGb);
      if (kpiFilter === "storage-critical" && band !== "critical") return false;
      if (kpiFilter !== "all" && kpiFilter !== "storage-critical" && n.status !== kpiFilter) return false;
      if (filters.site.length > 0 && !filters.site.includes(n.siteId)) return false;
      if (filters.area.length > 0 && !filters.area.includes(n.areaId)) return false;
      if (filters.status.length > 0 && !filters.status.includes(n.status)) return false;
      if (filters.storage.length > 0 && !filters.storage.includes(band)) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [n.id, n.name, n.model, n.ipAddress, n.areaName, n.siteName].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [nvrs, kpiFilter, filters, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const drawerNvr = drawerId ? nvrs.find((n) => n.id === drawerId) ?? null : null;
  const hasFilters = !!(search || Object.values(filters).some((a) => a.length > 0) || kpiFilter !== "all");

  function openDrawer(id: string) {
    setDrawerId(id);
    setSearchParams({ nvr: id });
  }
  function closeDrawer() {
    setDrawerId(null);
    setSearchParams({});
  }
  function handleKpiClick(key: KpiFilter) {
    setKpiFilter((current) => (current === key ? "all" : key));
    setPage(1);
  }

  function handleCleanup(method: CleanupMethod, payload: { ageDays?: number; channels?: number[] }) {
    if (!drawerNvr) return;
    const previous = drawerNvr.usedStorageGb;
    let freed = 0;
    if (method === "age") {
      const ratio = Math.max(0.05, Math.min(0.5, 30 / Math.max(7, payload.ageDays ?? 30) * 0.18));
      freed = Math.round(previous * ratio);
    } else {
      const rows = buildChannelRows(drawerNvr);
      freed = Math.round((payload.channels ?? []).reduce((acc, ch) => {
        const r = rows.find((row) => row.channel === ch);
        return acc + (r?.storageGb ?? 0);
      }, 0));
    }
    const processedCount = method === "channel"
      ? (payload.channels?.length ?? 0) * 31
      : Math.max(1, Math.round((freed / previous) * 73));
    const totalToProcess = Math.max(processedCount, 1);
    const methodLabel = method === "age"
      ? `Age based · older than ${payload.ageDays ?? 30} days`
      : `Channel based · ${(payload.channels ?? []).length} channel${(payload.channels ?? []).length === 1 ? "" : "s"}`;

    // Show progress state, then commit after ~2.4s
    setModal({
      kind: "cleanup-running",
      methodLabel,
      totalToProcess,
      freed,
      previous,
      processed: totalToProcess,
    });

    cleanupTimerRef.current = setTimeout(() => {
      const current = Math.max(0, previous - freed);
      setNvrs((curr) => curr.map((n) => n.id === drawerNvr.id ? { ...n, usedStorageGb: current } : n));
      setModal({
        kind: "cleanup-done",
        previous, freed, current,
        total: drawerNvr.totalStorageGb,
        processed: { processed: totalToProcess, outOf: totalToProcess },
      });
      cleanupTimerRef.current = null;
    }, 2400);
  }

  function handleCleanupCancel() {
    if (cleanupTimerRef.current) {
      clearTimeout(cleanupTimerRef.current);
      cleanupTimerRef.current = null;
    }
    setModal(null);
    toast.success("Cleanup cancelled — no recordings were removed");
  }

  function handleLink(channel: number, cameraId: string) {
    if (!drawerNvr) return;
    const cam = MOCK_CAMERAS.find((c) => c.id === cameraId);
    setNvrs((curr) => curr.map((n) => {
      if (n.id !== drawerNvr.id) return n;
      const channels = n.channels.map((c) =>
        c.channel === channel ? { ...c, cameraId, cameraName: cam?.name ?? null } : c
      );
      return { ...n, channels, channelsInUse: channels.filter((c) => c.cameraId).length };
    }));
    // Keep the camera record in sync (it stores its own nvrId / nvrName / channel).
    updateCameraInStore(cameraId, { nvrId: drawerNvr.id, nvrName: drawerNvr.name, channel });
    setModal(null);
    toast.success(`${cam?.name ?? cameraId} linked to Channel ${channel}`);
  }

  function handleUnlink(channel: number) {
    if (!drawerNvr) return;
    const ch = drawerNvr.channels.find((c) => c.channel === channel);
    const camId = ch?.cameraId ?? null;
    const camName = ch?.cameraName ?? ch?.cameraId;
    setNvrs((curr) => curr.map((n) => {
      if (n.id !== drawerNvr.id) return n;
      const channels = n.channels.map((c) =>
        c.channel === channel ? { ...c, cameraId: null, cameraName: null } : c
      );
      return { ...n, channels, channelsInUse: channels.filter((c) => c.cameraId).length };
    }));
    if (camId) updateCameraInStore(camId, { nvrId: null, nvrName: null, channel: null });
    setModal(null);
    toast.success(`${camName} unlinked from Channel ${channel}`);
  }

  function handleDelete() {
    if (!drawerNvr) return;
    const target = drawerNvr;
    setNvrs((curr) => curr.filter((n) => n.id !== target.id));
    setModal(null);
    closeDrawer();
    toast.success(`${target.name} deleted`);
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>NVR Devices</PageHeader.Title>
          <PageHeader.Description>
            Network Video Recorders storing camera footage — channel management, storage health, and cleanup.
          </PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button size="sm" className="gap-1.5" onClick={() => setModal({ kind: "add" })}>
            <Plus className="size-4" />
            Add NVR
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* KPI cards */}
      <KpiGrid cols={5}>
        {KPI_CONFIGS.map((cfg) => (
          <KpiCard
            key={cfg.key}
            label={cfg.label}
            value={cfg.getValue(nvrs)}
            sub={cfg.sub}
            accent={cfg.accent}
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

      {/* Count */}
      <p className="text-base text-muted-foreground">
        <strong className="text-foreground">{filtered.length}</strong>{" "}
        {filtered.length === 1 ? "NVR" : "NVRs"} match current filters
        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); setKpiFilter("all"); }}
            className="ml-2 text-muted-foreground underline hover:text-primary"
          >
            Clear filters
          </button>
        )}
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <HardDrive className="size-10 opacity-20" />
          <p className="text-sm">No NVRs match the current filters.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); setKpiFilter("all"); }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="border-b border-border text-left">
                  {["ID", "NAME · MODEL", "STATUS", "CHANNELS", "STORAGE", "LOCATION", "LAST ACTIVE", "ACTION"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 font-mono text-2xs uppercase tracking-[0.15em] text-muted-foreground/60"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pageItems.map((n) => (
                  <tr
                    key={n.id}
                    onClick={() => openDrawer(n.id)}
                    className="group cursor-pointer text-base transition-colors hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-muted-foreground transition-colors group-hover:text-primary">
                        {n.id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground transition-colors group-hover:text-primary">
                          {n.name}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">{n.model}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><StatusPill status={n.status} /></td>
                    <td className="px-4 py-3 text-foreground">
                      <span className="font-mono">
                        {n.channelsInUse} <span className="text-muted-foreground">/ {n.channelCount}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StorageBar used={n.usedStorageGb} total={n.totalStorageGb} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-foreground">{n.areaName}</span>
                        <span className="text-xs">{n.siteName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3" />
                        {n.lastSeenDisplay}
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex size-7 items-center justify-center rounded border border-transparent text-muted-foreground/50 transition-colors hover:border-border hover:bg-muted hover:text-foreground">
                            <MoreHorizontal className="size-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-44 p-1" align="end">
                          <button
                            onClick={() => openDrawer(n.id)}
                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
                          >
                            <HardDrive className="size-3.5 text-muted-foreground" />
                            View details
                          </button>
                          <button
                            onClick={() => { openDrawer(n.id); setTimeout(() => setModal({ kind: "cleanup" }), 100); }}
                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
                          >
                            <Sparkles className="size-3.5 text-muted-foreground" />
                            Cleanup now
                          </button>
                          <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted">
                            <Pencil className="size-3.5 text-muted-foreground" />
                            Edit NVR
                          </button>
                          <div className="my-1 border-t border-border" />
                          <button
                            onClick={() => { openDrawer(n.id); setTimeout(() => setModal({ kind: "delete" }), 100); }}
                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-sev-critical hover:bg-sev-critical/10"
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </button>
                        </PopoverContent>
                      </Popover>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {filtered.length === 0
                ? "0 of 0"
                : `${(page - 1) * pageSize + 1} – ${Math.min(page * pageSize, filtered.length)} of ${filtered.length}`}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <span className="px-2 text-sm text-foreground">
                {page} <span className="text-muted-foreground/60">of {pageCount}</span>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer */}
      <NvrDrawer
        nvr={drawerNvr}
        open={drawerId !== null}
        onClose={closeDrawer}
        onOpenCamera={(cameraId) => {
          closeDrawer();
          navigate(`/site/cameras?camera=${cameraId}`);
        }}
        onEdit={() => setModal({ kind: "edit" })}
        onDelete={() => setModal({ kind: "delete" })}
        onCleanup={() => setModal({ kind: "cleanup" })}
        onExportAll={() => setModal({ kind: "export" })}
        onLinkCamera={(channel) => setModal({ kind: "link", channel })}
        onUnlink={(channel) => setModal({ kind: "unlink", channel })}
      />

      {/* Modals */}
      <CleanupStorageModal
        open={modal?.kind === "cleanup"}
        nvr={drawerNvr}
        onClose={() => setModal(null)}
        onConfirm={handleCleanup}
      />
      {modal?.kind === "cleanup-running" && (
        <CleanupRunningModal
          open
          methodLabel={modal.methodLabel}
          totalToProcess={modal.totalToProcess}
          onCancel={handleCleanupCancel}
        />
      )}
      <AddNvrModal
        open={modal?.kind === "add"}
        takenIds={nvrs.map((n) => n.id)}
        onClose={() => setModal(null)}
        onConfirm={(fields) => {
          const site = CAMERA_SITES.find((s) => s.value === fields.siteId);
          const area = CAMERA_AREAS.find((a) => a.value === fields.areaId);
          // Parse string-typed form fields into the numbers the data model expects.
          const channelCount  = Number(fields.channelCount)  || 16;
          const httpPort      = Number(fields.httpPort)      || 80;
          const totalStorage  = Number(fields.totalStorageGb) || 8000;
          const retentionDays = Number(fields.retentionDays) || 30;
          const cleanup       = (fields.cleanupSchedule || "auto-age") as NvrData["cleanupSchedule"];
          const channels = Array.from({ length: channelCount }, (_, i) => ({
            channel: i + 1,
            cameraId: null,
            cameraName: null,
          }));
          const now = new Date();
          const newNvr: NvrData = {
            id: fields.id,
            name: fields.name.trim(),
            model: fields.model,
            siteId: fields.siteId,
            siteName: site?.label ?? fields.siteId,
            areaId: fields.areaId,
            areaName: area?.label ?? fields.areaId,
            status: "online",
            ipAddress: fields.ipAddress.trim(),
            httpPort,
            totalStorageGb: totalStorage,
            usedStorageGb: 0,
            retentionDays,
            cleanupSchedule: cleanup,
            channels,
            channelsInUse: 0,
            channelCount,
            lastSeenAt: now.toISOString(),
            lastSeenDisplay: "Just now",
            activeAt: now.toISOString(),
            activeAtDisplay: now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
          };
          setNvrs((curr) => [newNvr, ...curr]);
          setModal(null);
          toast.success(`${newNvr.name} added`);
        }}
      />
      <EditNvrModal
        open={modal?.kind === "edit"}
        nvr={drawerNvr}
        onClose={() => setModal(null)}
        onConfirm={(fields) => {
          if (!drawerNvr) return;
          const site = CAMERA_SITES.find((s) => s.value === fields.siteId);
          const area = CAMERA_AREAS.find((a) => a.value === fields.areaId);
          setNvrs((curr) => curr.map((n) => n.id === drawerNvr.id ? {
            ...n,
            name: fields.name.trim(),
            siteId: fields.siteId,
            siteName: site?.label ?? n.siteName,
            areaId: fields.areaId,
            areaName: area?.label ?? n.areaName,
            ipAddress: fields.ipAddress.trim(),
            httpPort: Number(fields.httpPort) || n.httpPort,
            totalStorageGb: Number(fields.totalStorageGb) || n.totalStorageGb,
            retentionDays: Number(fields.retentionDays) || n.retentionDays,
            cleanupSchedule: (fields.cleanupSchedule || n.cleanupSchedule) as NvrData["cleanupSchedule"],
          } : n));
          setModal(null);
          toast.success(`${fields.name} updated`);
        }}
      />
      <ExportRecordingsModal
        open={modal?.kind === "export"}
        nvr={drawerNvr}
        onClose={() => setModal(null)}
        onConfirm={({ channels, recordingCount, totalGb, format }) => {
          setModal(null);
          toast.success(`Exporting ${recordingCount} recordings (${totalGb.toFixed(2)} GB) from ${channels.length} channel${channels.length === 1 ? "" : "s"} as ${format === "zip" ? "ZIP" : format === "mp4-pack" ? "MP4 pack" : "manifest"}…`);
        }}
      />
      {modal?.kind === "cleanup-done" && (
        <CleanupCompletedModal
          open={modal.kind === "cleanup-done"}
          previous={modal.previous}
          freed={modal.freed}
          current={modal.current}
          total={modal.total}
          processed={modal.processed}
          onClose={() => setModal(null)}
        />
      )}
      <LinkCameraModal
        open={modal?.kind === "link"}
        nvr={drawerNvr}
        channel={modal?.kind === "link" ? modal.channel : null}
        onClose={() => setModal(null)}
        onConfirm={(cameraId) => modal?.kind === "link" && handleLink(modal.channel, cameraId)}
      />
      <UnlinkConfirmModal
        open={modal?.kind === "unlink"}
        nvr={drawerNvr}
        channel={modal?.kind === "unlink" ? modal.channel : null}
        onClose={() => setModal(null)}
        onConfirm={() => modal?.kind === "unlink" && handleUnlink(modal.channel)}
        onExportFirst={() => toast.success(`Exporting recordings from Channel ${modal?.kind === "unlink" ? modal.channel : ""}…`)}
      />
      <DeleteNvrModal
        open={modal?.kind === "delete"}
        nvr={drawerNvr}
        onClose={() => setModal(null)}
        onConfirm={handleDelete}
      />

    </div>
  );
}
