import * as React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Check,
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
  MapPin,
  CircleDot,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import {
  DetailDrawer,
  DetailDrawerBody,
  DetailDrawerDescription,
  DetailDrawerFooter,
  DetailDrawerFooterStart,
  DetailDrawerHeader,
  DetailDrawerSection,
  DetailDrawerTitle,
} from "@accel/ui/components/shared/DetailDrawer";
import { DescriptionItem, DescriptionList } from "@accel/ui/components/shared/DescriptionList";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@accel/ui/components/shared/Modal";
import { Toolbar, ToolbarSearch } from "@accel/ui/components/shared/Toolbar";
import { Button } from "@accel/ui/components/ui/button";
import { DataTable, type DataTableColumn } from "@accel/ui/components/shared/DataTable";
import { ItemButton } from "@accel/ui/components/ui/item";
import { Checkbox } from "@accel/ui/components/ui/checkbox";
import { ProgressRow } from "@accel/ui/components/shared/ProgressRow";
import { Progress } from "@accel/ui/components/ui/progress";
import { StatusBadge } from "@accel/ui/components/shared/StatusBadge";
import {
  CheckList,
  CheckListEmpty,
  CheckListSelectAll,
  CheckRow,
  MODAL_NOTE,
  ModalField,
  ModalFieldPair,
  ModalFormSection,
  ModalPasswordInput,
  ModalSearchInput,
  ModalSelect,
  ModalTextInput,
  OptionChips,
} from "@accel/ui/components/shared/ModalForm";
import { Popover, PopoverContent, PopoverTrigger } from "@accel/ui/components/ui/popover";
import { PageHeader } from "@accel/ui/components/layout/PageHeader";
import { cn } from "@accel/ui/lib/utils";
import { MOCK_NVRS } from "@/mocks/nvr";
import { MOCK_CAMERAS, CAMERA_SITES, CAMERA_AREAS } from "@/mocks/cameras";
import { useCamerasStore } from "@/stores/useCamerasStore";
import { MOCK_RECORDINGS } from "@/mocks/recordings";
import { storageBandFor } from "@/types/nvr";
import type { NvrData, NvrStatus, StorageBand, NvrChannel } from "@/types/nvr";
import type { CameraData } from "@/types/cameras";
import { KpiCard, KpiGrid, type KpiTone } from "@accel/ui/components/shared/KpiCard";
import { TruncatedText } from "@accel/ui/components/shared/TruncatedText";
import { SyncProgressModal } from "@/components/app/SyncProgressModal";

/* ── Status pill ─────────────────────────────────────────────────────────── */

const STATUS_STYLES: Record<NvrStatus, { bg: string; text: string; dot: string; label: string }> = {
  online:   { bg: "bg-success/15 border-success/30",   text: "text-success",          dot: "bg-success",          label: "Online" },
  offline:  { bg: "bg-muted border-border",            text: "text-muted-foreground", dot: "bg-muted-foreground", label: "Offline" },
  degraded: { bg: "bg-warning/15 border-warning/30",   text: "text-warning",          dot: "bg-warning",          label: "Degraded" },
};

/** Masked credential with a reveal toggle — kept hidden by default so the drawer
    can be shown on shared screens without exposing the recorder password. */
function RevealValue({ value }: { value: string }) {
  const [shown, setShown] = React.useState(false);
  if (!value) return <span className="font-mono text-xs">—</span>;
  return (
    <span className="flex items-center gap-1.5">
      <span className="font-mono text-xs">{shown ? value : "•".repeat(Math.min(value.length, 12))}</span>
      <Button variant="ghost"
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? "Hide password" : "Show password"}
        className="h-auto px-0 border-0 rounded-none font-normal gap-0 text-[length:inherit] whitespace-normal hover:bg-transparent dark:hover:bg-transparent text-muted-foreground transition-colors hover:text-foreground"
      >
        {shown ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </Button>
    </span>
  );
}

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
  critical: { bar: "bg-severity-critical", text: "text-severity-critical", label: "Critical" },
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
  const colour = band === "critical" ? "var(--severity-critical)" : band === "warning" ? "var(--warning)" : "var(--success)";
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
  accent: KpiTone;
  getValue: (items: NvrData[]) => number;
}[] = [
  { key: "all",              label: "Total NVRs",       sub: "Across all sites",      accent: "primary",      getValue: (i) => i.length },
  { key: "online",           label: "Online",           sub: "Recording active",      accent: "success",      getValue: (i) => i.filter((n) => n.status === "online").length },
  { key: "offline",          label: "Offline",          sub: "No recent contact",     accent: "muted",        getValue: (i) => i.filter((n) => n.status === "offline").length },
  { key: "degraded",         label: "Degraded",         sub: "Partial functionality", accent: "warning",      getValue: (i) => i.filter((n) => n.status === "degraded").length },
  { key: "storage-critical", label: "Storage Critical", sub: "≥ 90% utilised",        accent: "severity-critical", getValue: (i) => i.filter((n) => storageBandFor(n.usedStorageGb, n.totalStorageGb) === "critical").length },
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
        <ItemButton variant="plain"
          className={cn("text-center", 
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
  filters, onChange, search, onSearchChange, additionalActiveCount = 0,
}: {
  filters: NvrFilters;
  onChange: (f: NvrFilters) => void;
  search: string;
  onSearchChange: (v: string) => void;
  additionalActiveCount?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const filterCount = Object.values(filters).reduce((s, arr) => s + arr.length, 0);
  const activeCount = filterCount + (search ? 1 : 0) + additionalActiveCount;

  function setGroup(group: keyof NvrFilters, values: string[]) {
    onChange({ ...filters, [group]: values });
  }

  return (
    <div data-slot="nvr-filter-panel" className="rounded-xl border border-border bg-card">
      <div
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <ItemButton variant="plain"
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-[length:inherit] text-inherit flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-base font-semibold text-foreground">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary-fill px-2 py-px text-xs font-semibold text-primary-foreground">
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
        </ItemButton>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="h-auto px-0 border-0 rounded-none font-normal gap-0 text-[length:inherit] whitespace-normal hover:bg-transparent dark:hover:bg-transparent"
            type="button"
            aria-label={open ? "Collapse filters" : "Expand filters"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </Button>
        </div>
      </div>

      {open && (
        <div data-slot="nvr-filter-panel-body" className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
          <ToolbarSearch value={search} onChange={onSearchChange} placeholder="Search by ID, name, model, or IP…" className="sm:w-full" />
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
      cameraStatus: cam
        ? (cam.status === "online" ? "live" : "offline")
        : ch.nvrManaged
        ? (ch.nvrRecording ? "live" : "offline")
        : undefined,
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

// Unified compact StatCard — delegates to shared KpiCard so accent bar + sizing match.
function StatCard({ icon, label, value, valueClass, sub }: {
  icon?: React.ReactNode; label: string; value: React.ReactNode; valueClass?: string; sub?: string;
}) {
  void icon;
  const accent: KpiTone =
    valueClass?.includes("text-success")      ? "success" :
    valueClass?.includes("text-info")         ? "info" :
    valueClass?.includes("text-severity-critical") ? "severity-critical" :
    valueClass?.includes("text-warning")      ? "warning" :
    valueClass?.includes("text-violet")       ? "violet" :
    "primary";
  return <KpiCard compact label={label} value={value} sub={sub} tone={accent} />;
}

function ChannelRecordingStatusPill({ status, hasCamera }: { status?: "live" | "offline"; hasCamera: boolean }) {
  if (!hasCamera) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-muted-foreground">
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
  onManualSync: () => void;
  onLinkCamera: (channel: number) => void;
  onUnlink: (channel: number) => void;
}

export function NvrDrawer({
  nvr, open, onClose, onOpenCamera, onEdit, onDelete, onCleanup, onExportAll, onManualSync, onLinkCamera, onUnlink,
}: NvrDrawerProps) {
  const [tab, setTab] = React.useState<DrawerTab>("overview");
  const [channelSearch, setChannelSearch] = React.useState("");

  // Reset whenever the drawer opens or switches to another NVR.
  const nvrId = nvr?.id;
  const [prevReset, setPrevReset] = React.useState({ open, nvrId });
  if (prevReset.open !== open || prevReset.nvrId !== nvrId) {
    setPrevReset({ open, nvrId });
    if (open) { setTab("overview"); setChannelSearch(""); }
  }

  if (!nvr) {
    return (
      <DetailDrawer open={open} onOpenChange={(v) => !v && onClose()} size="lg">
        <DetailDrawerHeader data-slot="nvr-drawer-header">
          <DetailDrawerTitle className="text-md font-normal text-muted-foreground">NVR not found</DetailDrawerTitle>
        </DetailDrawerHeader>
      </DetailDrawer>
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

  /* Channel tables use tighter px-3 / py-2.5 cells than the page list. */
  const chHead = "px-3";
  const chCell = "px-3 py-2.5";
  const channelCol: DataTableColumn<ChannelRow> = {
    key: "ch",
    header: "CH",
    className: cn(chCell, "font-mono text-sm text-muted-foreground"),
    headClassName: chHead,
    cell: (ch) => `Ch ${String(ch.channel).padStart(2, "0")}`,
  };
  const recordingCol: DataTableColumn<ChannelRow> = {
    key: "recording",
    header: "RECORDING",
    className: chCell,
    headClassName: chHead,
    cell: (ch) => <ChannelRecordingStatusPill status={ch.cameraStatus} hasCamera={!!ch.cameraId || !!ch.nvrManaged} />,
  };
  const locationCol: DataTableColumn<ChannelRow> = {
    key: "location",
    header: "LOCATION",
    className: cn(chCell, "text-muted-foreground"),
    headClassName: chHead,
    cell: (ch) =>
      ch.cameraArea ? (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1 text-foreground">
            <MapPin className="size-2.5" />
            {ch.cameraArea}
          </span>
          <span className="text-xs">{ch.cameraSite}</span>
        </div>
      ) : (
        "—"
      ),
  };

  const statsColumns: DataTableColumn<ChannelRow>[] = [
    channelCol,
    {
      key: "camera",
      header: "CAMERA",
      className: chCell,
      headClassName: chHead,
      cell: (ch) => (
        <>
          <Button variant="ghost"
            onClick={() => ch.cameraId && onOpenCamera(ch.cameraId)}
            className="h-auto font-normal justify-start whitespace-normal dark:hover:bg-info/15 inline-flex items-center gap-1.5 rounded-md border border-info/20 bg-info/5 px-2 py-1 text-xs text-info hover:bg-info/15 hover:text-info"
          >
            <Video className="size-3" />
            <span className="font-mono">{ch.cameraId}</span>
          </Button>
          {ch.cameraName && (
            <p className="mt-1 text-xs text-muted-foreground">{ch.cameraName}</p>
          )}
        </>
      ),
    },
    recordingCol,
    locationCol,
    {
      key: "storage",
      header: "STORAGE USED",
      className: chCell,
      headClassName: chHead,
      cell: (ch) => (
        <span className="font-mono text-sm font-semibold text-foreground">
          {ch.storageGb.toFixed(2)} GB
        </span>
      ),
    },
    {
      key: "recordings",
      header: "RECORDINGS",
      className: cn(chCell, "font-semibold text-foreground"),
      headClassName: chHead,
      cell: (ch) => ch.recordings,
    },
  ];

  const manageColumns: DataTableColumn<ChannelRow>[] = [
    channelCol,
    {
      key: "camera",
      header: "CAMERA",
      className: chCell,
      headClassName: chHead,
      cell: (ch) => (
        <>
          {ch.cameraId ? (
            <Button variant="ghost"
              onClick={() => onOpenCamera(ch.cameraId!)}
              className="h-auto font-normal justify-start whitespace-normal dark:hover:bg-info/15 inline-flex items-center gap-1.5 rounded-md border border-info/20 bg-info/5 px-2 py-1 text-xs text-info hover:bg-info/15 hover:text-info"
            >
              <Video className="size-3" />
              <span className="font-mono">{ch.cameraId}</span>
            </Button>
          ) : ch.nvrManaged ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-warning/30 bg-warning/10 px-2 py-1 text-xs font-semibold text-warning">
              In use on NVR
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md border border-success/30 bg-success/10 px-2 py-1 text-xs font-semibold text-success">
              Available
            </span>
          )}
          {ch.cameraName && (
            <p className="mt-1 text-xs text-muted-foreground">{ch.cameraName}</p>
          )}
        </>
      ),
    },
    recordingCol,
    locationCol,
    {
      key: "ip",
      header: "IP",
      className: cn(chCell, "font-mono text-sm text-muted-foreground"),
      headClassName: chHead,
      cell: (ch) => {
        const cam = ch.cameraId ? MOCK_CAMERAS.find((c) => c.id === ch.cameraId) : null;
        return cam?.ipAddress ?? ch.nvrIpAddress ?? "—";
      },
    },
    {
      key: "linkedOn",
      header: "LINKED ON",
      className: cn(chCell, "text-muted-foreground"),
      headClassName: chHead,
      cell: (ch) =>
        ch.linkedAtDisplay ? (
          <div className="inline-flex items-center gap-1 text-sm">
            <Calendar className="size-3 opacity-60" />
            {ch.linkedAtDisplay}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: "action",
      header: "ACTION",
      className: chCell,
      headClassName: chHead,
      cell: (ch) =>
        ch.cameraId ? (
          <Button variant="ghost" size="icon-sm"
            onClick={() => onUnlink(ch.channel)}
            title="Unlink camera"
            aria-label="Unlink camera"
            className="px-0 font-normal gap-0 text-[length:inherit] whitespace-normal dark:hover:bg-severity-critical/10 flex size-7 items-center justify-center rounded-md border border-severity-critical/30 text-severity-critical transition-colors hover:bg-severity-critical/10 hover:text-severity-critical"
          >
            <Unlink className="size-3.5" />
          </Button>
        ) : ch.nvrManaged ? (
          <span className="text-xs text-muted-foreground">NVR managed</span>
        ) : (
          <Button variant="ghost" size="icon-sm"
            onClick={() => onLinkCamera(ch.channel)}
            title="Link camera"
            aria-label="Link camera"
            className="px-0 font-normal gap-0 text-[length:inherit] whitespace-normal dark:hover:bg-primary/20 flex size-7 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary-ink transition-colors hover:bg-primary/20 hover:text-primary-ink"
          >
            <Link2 className="size-3.5" />
          </Button>
        ),
    },
  ];

  return (
    <DetailDrawer open={open} onOpenChange={(v) => !v && onClose()} size="lg">
        {/* Header */}
        <DetailDrawerHeader data-slot="nvr-drawer-header">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusPill status={nvr.status} />
            {nvr.status === "offline" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-severity-critical/30 bg-severity-critical/10 px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-severity-critical">
                <AlertTriangle className="size-3" />
                NVR is offline
              </span>
            )}
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <DetailDrawerTitle><TruncatedText text={nvr.name} /></DetailDrawerTitle>
            <span className="rounded border border-border bg-muted px-1.5 py-px font-mono text-2xs text-muted-foreground">
              {nvr.id}
            </span>
          </div>
          <DetailDrawerDescription className="gap-x-1.5">
            <MapPin />
            {nvr.siteName} · {nvr.areaName}
            <span className="text-muted-foreground">·</span>
            <span className="font-mono">{nvr.model}</span>
          </DetailDrawerDescription>

          {/* Tabs */}
          <div data-slot="nvr-drawer-tabs" className="mt-1.5 flex items-center gap-1">
            {[
              { key: "overview" as const, label: "Overview",           icon: Layers },
              { key: "channels" as const, label: "Channel Management", icon: Cable, badge: nvr.channelCount },
            ].map(({ key, label, icon: Icon, badge }) => (
              <ItemButton variant="plain" selected={tab === key}
                key={key}
                onClick={() => setTab(key)}
                className={cn("w-auto text-center", 
                  "relative flex items-center gap-1.5 px-3 py-2 text-base font-semibold transition-colors",
                  tab === key ? "text-primary-ink" : "text-muted-foreground hover:text-foreground"
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
              </ItemButton>
            ))}
          </div>
        </DetailDrawerHeader>

        {/* Overview tab */}
        {tab === "overview" && (
          <DetailDrawerBody data-slot="nvr-drawer-overview">
            {/* 4 KPI strip */}
            <div data-slot="nvr-drawer-kpis" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
            <DetailDrawerSection data-slot="nvr-drawer-device-info" title="Device Information">
              <DescriptionList columns={2} variant="card">
                <DescriptionItem label="Device Type">NVR</DescriptionItem>
                <DescriptionItem label="NVR Name">{nvr.name}</DescriptionItem>
                <DescriptionItem label="NVR ID" mono><span className="text-primary-ink">{nvr.id}</span></DescriptionItem>
                <DescriptionItem label="Status"><StatusPill status={nvr.status} /></DescriptionItem>
                <DescriptionItem label="Manufacturer">{nvr.model.split(" ")[0] || "—"}</DescriptionItem>
                <DescriptionItem label="Model" mono>{nvr.model}</DescriptionItem>
                <DescriptionItem label="Site Location">{nvr.siteName}</DescriptionItem>
                <DescriptionItem label="Area">{nvr.areaName}</DescriptionItem>
                <DescriptionItem label="IP Address" mono>{nvr.ipAddress}</DescriptionItem>
                <DescriptionItem label="HTTP Port" mono>{nvr.httpPort}</DescriptionItem>
                <DescriptionItem label="Username" mono>{nvr.username || "—"}</DescriptionItem>
                <DescriptionItem label="Password"><RevealValue value={nvr.password} /></DescriptionItem>
                <DescriptionItem label="Channels"><span className="font-semibold">{nvr.channelsInUse} / {nvr.channelCount} in use</span></DescriptionItem>
                <DescriptionItem label="Cleanup"><span className="capitalize">{nvr.cleanupSchedule.replace(/-/g, " ")}</span></DescriptionItem>
              </DescriptionList>
            </DetailDrawerSection>

            {/* NVR Recording Storage */}
            <DetailDrawerSection data-slot="nvr-drawer-storage" title="NVR Recording Storage">
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
                          "border-severity-critical/30 bg-severity-critical/10"
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
                      estDaysRemaining < 7 ? "text-severity-critical" : estDaysRemaining < 30 ? "text-warning" : "text-success"
                    )}>
                      {estDaysRemaining} days
                    </p>
                  </div>
                </div>

                {band === "critical" && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-severity-critical/30 bg-severity-critical/[0.06] px-3 py-2.5 text-xs text-muted-foreground">
                    <AlertTriangle className="size-3.5 flex-shrink-0 text-severity-critical" />
                    Auto-cleanup is deleting recordings older than the retention window. Events older than that lose replayable footage.
                  </div>
                )}
              </div>
            </DetailDrawerSection>

            {/* Recording Statistics by Channel */}
            <DetailDrawerSection
              data-slot="nvr-drawer-channel-stats"
              title={`Recording Statistics by Channel (${linkedChannels.length})`}
              action={
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={onCleanup}>
                    <Sparkles className="size-3.5" />
                    Clean Up Storage
                  </Button>
                </div>
              }
            >
              {nvr.status === "offline" && (
                <div className="flex items-start gap-2 rounded-lg border border-severity-critical/30 bg-severity-critical/[0.06] px-3 py-2 text-xs">
                  <AlertTriangle className="size-3.5 flex-shrink-0 text-severity-critical" />
                  <p className="text-muted-foreground">
                    <strong className="text-severity-critical">Recording Disabled:</strong> This NVR is currently offline and recording is paused until it reconnects.
                  </p>
                </div>
              )}
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <DataTable
                  variant="list"
                  columns={statsColumns}
                  data={linkedChannels}
                  getRowId={(ch) => String(ch.channel)}
                  empty={{ variant: "inline", title: "No cameras linked to this NVR yet." }}
                />
              </div>
            </DetailDrawerSection>
          </DetailDrawerBody>
        )}

        {/* Channel Management tab */}
        {tab === "channels" && (
          <DetailDrawerBody data-slot="nvr-drawer-channels" className="gap-4">
            <Toolbar data-slot="nvr-drawer-channels-toolbar" className="flex-nowrap justify-between gap-3">
              <ToolbarSearch value={channelSearch} onChange={setChannelSearch} placeholder="Search by channel, camera ID, or area…" className="max-w-sm flex-1 sm:w-full" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{filteredChannels.length}</strong> / {nvr.channelCount} channels
              </p>
            </Toolbar>

            <div data-slot="nvr-drawer-channels-table" className="overflow-hidden rounded-xl border border-border bg-card">
              <DataTable
                variant="list"
                columns={manageColumns}
                data={filteredChannels}
                getRowId={(ch) => String(ch.channel)}
                empty={{ variant: "inline", title: "No channels match the search." }}
              />
            </div>
          </DetailDrawerBody>
        )}

        {/* Footer */}
        <DetailDrawerFooter data-slot="nvr-drawer-footer" className="gap-2">
          <DetailDrawerFooterStart className="gap-2">
            <Button size="sm" className="gap-1.5" onClick={onEdit}>
              <Pencil className="size-3.5" />
              Edit NVR
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onExportAll}>
              <Download className="size-3.5" />
              Export Recordings
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onManualSync}>
              <RefreshCw className="size-3.5" />
              Manual Sync
            </Button>
          </DetailDrawerFooterStart>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-severity-critical/40 text-severity-critical hover:bg-severity-critical/10"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
            Delete NVR
          </Button>
        </DetailDrawerFooter>
    </DetailDrawer>
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

export function ExportRecordingsModal({
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

  // Load defaults when the modal opens (or the NVR changes while open).
  const nvrId = nvr?.id;
  const [prevLoad, setPrevLoad] = React.useState<{ open: boolean; nvrId: string | undefined } | null>(null);
  if (prevLoad === null || prevLoad.open !== open || prevLoad.nvrId !== nvrId) {
    setPrevLoad({ open, nvrId });
    if (open && nvr) {
      // Pre-select all linked channels
      setChannels(nvr.channels.filter((c) => c.cameraId).map((c) => c.channel));
      setRange("all");
      setFormat("zip");
    }
  }

  if (!nvr) return null;

  const rows = buildChannelRows(nvr).filter((c) => c.cameraId);
  const allSelected = rows.length > 0 && rows.every((r) => channels.includes(r.channel));

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
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader title="Export Recordings" description={`Download recordings from selected channels on ${nvr.name}.`} />
        <ModalBody className="space-y-5">
          <p className={MODAL_NOTE}>
            Download recordings from <strong>{nvr.name}</strong>.
          </p>
          <ModalField label="Channels">
            <CheckList
              head={
                rows.length > 1 ? (
                  <CheckListSelectAll checked={allSelected} onToggle={toggleAll} count={`${selectedRows.length} of ${rows.length}`} />
                ) : undefined
              }
              empty={rows.length === 0 ? <CheckListEmpty>No channels with recordings.</CheckListEmpty> : undefined}
            >
              {rows.map((ch) => (
                <CheckRow
                  key={ch.channel}
                  checked={channels.includes(ch.channel)}
                  onToggle={() => toggleChannel(ch.channel)}
                  label={`Export channel ${ch.channel}`}
                  title={
                    <>
                      {ch.cameraName} <span className="font-mono text-muted-foreground">· Ch {ch.channel}</span>
                    </>
                  }
                  meta={[ch.cameraSite, ch.cameraArea].filter(Boolean).join(" · ")}
                  aside={
                    <span className="font-mono text-2xs text-muted-foreground">
                      {ch.storageGb.toFixed(2)} GB · {ch.recordings} files
                    </span>
                  }
                />
              ))}
            </CheckList>
          </ModalField>
          <ModalField label="Date Range">
            <OptionChips value={range} options={EXPORT_RANGES} onChange={setRange} />
          </ModalField>
          <ModalField label="Format" hint={EXPORT_FORMATS.find((x) => x.value === format)?.desc}>
            <ModalSelect value={format} onChange={(v) => setFormat(v as ExportFormat)} placeholder="Select format" options={EXPORT_FORMATS} />
          </ModalField>
        </ModalBody>
        <ModalFooter align="between">
          <span className="min-w-0 truncate text-xs text-muted-foreground">
            {canSubmit
              ? `${selectedRows.length} channel${selectedRows.length === 1 ? "" : "s"} · ${recordingCount} files · ${totalGb.toFixed(2)} GB`
              : "No channels selected"}
          </span>
          <Button size="sm" disabled={!canSubmit} onClick={() => onConfirm({ channels, range, format, totalGb, recordingCount })}>
            Export
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Clean Up Storage modal ──────────────────────────────────────────────── */

type CleanupMethod = "age" | "channel";

export function CleanupStorageModal({
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

  // Reset whenever the modal opens or switches to another NVR.
  const nvrId = nvr?.id;
  const [prevReset, setPrevReset] = React.useState({ open, nvrId });
  if (prevReset.open !== open || prevReset.nvrId !== nvrId) {
    setPrevReset({ open, nvrId });
    if (open) { setMethod("age"); setAgeDays(30); setPicked([]); }
  }

  if (!nvr) return null;

  const usedPct = Math.min(100, Math.round((nvr.usedStorageGb / nvr.totalStorageGb) * 100));
  const linkedChannels = buildChannelRows(nvr).filter((c) => c.cameraId);
  const canSubmit = method === "age" ? ageDays > 0 : picked.length > 0;

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader title="Clean up Storage" description="Free space by removing recordings that fall outside the retention window." />
        <ModalBody className="space-y-5">
          <div className="space-y-2">
            <p className={MODAL_NOTE}>
              <strong>{nvr.name}</strong> is using <strong>{nvr.usedStorageGb.toLocaleString()} GB</strong> of{" "}
              {nvr.totalStorageGb.toLocaleString()} GB ({usedPct}%).
            </p>
            <Progress value={usedPct} aria-label="Storage used" className="h-1.5 bg-muted" />
          </div>
          <ModalField label="Clean up by">
            <OptionChips
              value={method}
              options={[
                { value: "age" as const, label: "Age" },
                { value: "channel" as const, label: "Channel" },
              ]}
              onChange={setMethod}
            />
          </ModalField>
          {method === "age" ? (
            <ModalField label="Remove recordings older than">
              <OptionChips value={ageDays} options={CLEANUP_AGE_OPTIONS} onChange={setAgeDays} />
            </ModalField>
          ) : (
            <ModalField label="Channels to clean up">
              <CheckList empty={linkedChannels.length === 0 ? <CheckListEmpty>No channels with recordings.</CheckListEmpty> : undefined}>
                {linkedChannels.map((ch) => (
                  <CheckRow
                    key={ch.channel}
                    checked={picked.includes(ch.channel)}
                    onToggle={() =>
                      setPicked((curr) => (curr.includes(ch.channel) ? curr.filter((c) => c !== ch.channel) : [...curr, ch.channel]))
                    }
                    label={`Clean up channel ${ch.channel}`}
                    title={
                      <>
                        {ch.cameraName} <span className="font-mono text-muted-foreground">· Ch {ch.channel}</span>
                      </>
                    }
                    meta={[ch.cameraSite, ch.cameraArea].filter(Boolean).join(" · ")}
                    aside={
                      <span className="font-mono text-2xs text-muted-foreground">
                        {ch.storageGb.toFixed(2)} GB · {ch.recordings} files
                      </span>
                    }
                  />
                ))}
              </CheckList>
            </ModalField>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="destructive"
            size="sm"
            disabled={!canSubmit}
            onClick={() => onConfirm(method, method === "age" ? { ageDays } : { channels: picked })}
          >
            Clean Up
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/** Age presets for storage cleanup, shared by the cleanup modal and the NVR forms. */
const CLEANUP_AGE_OPTIONS = [7, 14, 30, 60, 90].map((d) => ({ value: d, label: `${d} days` }));

/* ── Clean Up Running (progress) modal ───────────────────────────────────── */

export function CleanupRunningModal({
  open, methodLabel, totalToProcess, onCancel,
}: {
  open: boolean;
  methodLabel: string;
  totalToProcess: number;
  onCancel: () => void;
}) {
  const [progress, setProgress] = React.useState(0);
  const [processed, setProcessed] = React.useState(0);

  // Reset progress when the modal closes.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) { setProgress(0); setProcessed(0); }
  }

  React.useEffect(() => {
    if (!open) return;
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

  const done = progress >= 100;

  return (
    <Modal open={open} onOpenChange={() => { /* not dismissible by overlay */ }}>
      <ModalContent size="sm">
        <ModalHeader title={done ? "Cleanup complete" : "Cleaning up storage…"} />
        <ModalBody className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {done ? (
              <>Removed <strong className="text-foreground">{totalToProcess} recordings</strong> · {methodLabel}.</>
            ) : (
              <>
                Removing recordings · <strong className="text-foreground">{methodLabel}</strong>. Keep this window open
                until it finishes.
              </>
            )}
          </p>
          <ProgressRow progress={progress} label={`${processed} of ${totalToProcess} files`} />
        </ModalBody>
        <ModalFooter>
          {/* At 100% the page moves on to "Clean Up Completed" itself; Cancel would misreport. */}
          {done ? (
            <Button size="sm" disabled>Finishing…</Button>
          ) : (
            <Button variant="destructive" size="sm" onClick={onCancel}>Cancel Cleanup</Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Manual Sync stages ──────────────────────────────────────────────────── */

const SYNC_STAGES = [
  "Connecting to NVR…",
  "Reading channel list…",
  "Reconciling recording index…",
  "Updating storage stats…",
  "Finalising…",
];

/* ── Clean Up Completed modal ────────────────────────────────────────────── */

export function CleanupCompletedModal({
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
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader title="Clean up complete" description={`${processed.processed} of ${processed.outOf} files processed`} />
        <ModalBody className="space-y-5">
          <p className={MODAL_NOTE}>
            Freed <strong>{freed.toLocaleString()} GB</strong> from {processed.processed} of {processed.outOf} files.
          </p>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="text-muted-foreground">
                {current.toLocaleString()} GB of {total.toLocaleString()} GB used
              </span>
              <span className="font-mono font-semibold tabular-nums text-foreground">{pct}%</span>
            </div>
            <Progress value={pct} aria-label="Storage used" className="h-1.5 bg-muted" />
            <p className="font-mono text-2xs text-muted-foreground">
              {previous.toLocaleString()} GB → {current.toLocaleString()} GB{" "}
              <span className="text-success">(−{freed.toLocaleString()} GB)</span>
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" onClick={onClose}>Done</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Link Camera modal ───────────────────────────────────────────────────── */

export function LinkCameraModal({
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

  // Reset whenever the modal opens or targets another channel.
  const [prevReset, setPrevReset] = React.useState({ open, channel });
  if (prevReset.open !== open || prevReset.channel !== channel) {
    setPrevReset({ open, channel });
    if (open) { setPicked(null); setSearch(""); setAreaFilter("all"); }
  }

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

  const statusTone = (st: CameraData["status"]) => (st === "online" ? "success" : st === "offline" ? "neutral" : "warning");

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title={`Link Camera to Channel ${channel}`}
          description={`Only cameras at ${nvr.siteName} (same site as this NVR) can be linked.`}
        />
        <ModalBody className="space-y-4">
          <p className={MODAL_NOTE}>
            Pick a camera for <strong>channel {channel}</strong> on <strong>{nvr.name}</strong>. Only unlinked cameras at{" "}
            {nvr.siteName} are listed.
          </p>
          {candidates.length > 0 && (
            <div className={cn("grid gap-2", areas.length > 1 ? "grid-cols-[1fr_11rem]" : "grid-cols-1")}>
              <ModalSearchInput value={search} onChange={setSearch} placeholder="Search by camera name, ID or area…" />
              {areas.length > 1 && (
                <ModalSelect
                  value={areaFilter}
                  onChange={setAreaFilter}
                  placeholder="All areas"
                  ariaLabel="Filter by area"
                  options={[
                    { value: "all", label: `All areas (${candidates.length})` },
                    ...areas.map((ar) => ({ value: ar.id, label: ar.label })),
                  ]}
                />
              )}
            </div>
          )}
          <CheckList
            empty={
              candidates.length === 0 ? (
                <CheckListEmpty>
                  No unlinked cameras at {nvr.siteName}. Add one first, or unlink a camera to free it.
                </CheckListEmpty>
              ) : filtered.length === 0 ? (
                <CheckListEmpty>No cameras match the filters.</CheckListEmpty>
              ) : undefined
            }
          >
            {filtered.map((c) => (
              <CheckRow
                key={c.id}
                checked={picked === c.id}
                // One camera per channel: ticking a row unticks the others.
                onToggle={() => setPicked(picked === c.id ? null : c.id)}
                label={`Link ${c.id}`}
                title={c.name}
                meta={`${c.id} · ${c.areaName}`}
                aside={<StatusBadge tone={statusTone(c.status)}>{c.status}</StatusBadge>}
              />
            ))}
          </CheckList>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" disabled={!picked} onClick={() => picked && onConfirm(picked)}>
            Link Camera
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Unlink confirmation modal ───────────────────────────────────────────── */

export function UnlinkConfirmModal({
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
  // Reset whenever the modal opens or targets another channel.
  const [prevReset, setPrevReset] = React.useState({ open, channel });
  if (prevReset.open !== open || prevReset.channel !== channel) {
    setPrevReset({ open, channel });
    if (open) setExportFirst(true);
  }

  if (!nvr || channel == null) return null;
  const ch = nvr.channels.find((c) => c.channel === channel);
  if (!ch) return null;
  const cam = ch.cameraId ? MOCK_CAMERAS.find((c) => c.id === ch.cameraId) : null;
  const recCount = ch.cameraId ? MOCK_RECORDINGS.filter((r) => r.nvrId === nvr.id && r.cameraId === ch.cameraId).length : 0;
  const storageGb = channelStorageGb(nvr.id, ch);

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="sm">
        <ModalHeader title="Unlink Camera" />
        <ModalBody className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Are you sure you want to unlink <strong className="text-foreground">{cam?.name ?? ch.cameraName ?? "this camera"}</strong>?
            Recording stops; its {recCount} files ({storageGb.toFixed(2)} GB) stay until retention ends.
          </p>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
            <Checkbox checked={exportFirst} onCheckedChange={(v) => setExportFirst(v === true)} />
            Export recordings before unlinking
          </label>
        </ModalBody>
        <ModalFooter>
          {exportFirst && (
            <Button variant="outline" size="sm" onClick={() => { onExportFirst(); onConfirm(); }}>
              Export &amp; Unlink
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={onConfirm}>Unlink without Export</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
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
  /** Credentials the recorder is polled with. */
  username: string;
  password: string;
  /** String-typed in form to keep "empty placeholder" UX; parsed on submit. */
  httpPort: string;
  totalStorageGb: string;
  /** String so the field can be empty before user picks; parsed on submit. */
  channelCount: string;
  retentionDays: string;
  cleanupSchedule: NvrData["cleanupSchedule"] | "";
  /** Age-based cleanup: "remove recordings older than" (days). */
  cleanupAgeDays: string;
  /** Channel-based cleanup: channels selected for cleanup. */
  cleanupChannels: number[];
}

function nextNvrId(takenIds: string[]): string {
  let n = 1;
  while (takenIds.includes(`NVR-${String(n).padStart(3, "0")}`)) n++;
  return `NVR-${String(n).padStart(3, "0")}`;
}

/** The fields Add NVR and Edit NVR share. */
type NvrSharedFields = Pick<
  AddNvrFields,
  | "name" | "siteId" | "areaId" | "ipAddress" | "httpPort" | "username" | "password"
  | "totalStorageGb" | "retentionDays" | "cleanupSchedule" | "cleanupAgeDays" | "cleanupChannels"
>;

const NVR_MODEL_OPTIONS = [
  { value: "Hikvision DS-9664NI-I8", label: "Hikvision DS-9664NI-I8 (64-ch)" },
  { value: "Hikvision DS-7716NI-I4", label: "Hikvision DS-7716NI-I4 (16-ch)" },
  { value: "Dahua NVR5864-4KS2", label: "Dahua NVR5864-4KS2 (64-ch)" },
  { value: "Dahua NVR4232-4KS2", label: "Dahua NVR4232-4KS2 (32-ch)" },
  { value: "Uniview NVR308-32E2", label: "Uniview NVR308-32E2 (32-ch)" },
];
const CHANNEL_COUNT_OPTIONS = [4, 8, 16, 32, 64].map((c) => ({ value: String(c), label: `${c} channels` }));
const CLEANUP_MODE_OPTIONS = [
  { value: "auto-age", label: "Automatic · by age" },
  { value: "auto-channel", label: "Automatic · by channel" },
];

/**
 * Add / Edit NVR body: plain-headed groups (NVR, Connection, Storage) with
 * paired fields. `identity` is the slot for Add's model + channel count.
 */
function NvrFormFieldsBody({ fields, set, errors, channelCount, identity }: {
  fields: NvrSharedFields;
  set: <K extends keyof NvrSharedFields>(key: K, value: NvrSharedFields[K]) => void;
  errors: Record<string, string>;
  /** Channels on the NVR — the options for channel-based cleanup. */
  channelCount: number;
  identity?: React.ReactNode;
}) {
  return (
    <>
      <ModalFormSection title="NVR">
        <ModalField label="NVR Name" error={errors.name}>
          <ModalTextInput value={fields.name} onChange={(v) => set("name", v)} placeholder="e.g. FedEx Changi · NVR-A" invalid={!!errors.name} />
        </ModalField>
        {identity}
        <ModalFieldPair>
          <ModalField label="Site" error={errors.siteId}>
            <ModalSelect value={fields.siteId} onChange={(v) => set("siteId", v)} placeholder="Select a site" options={CAMERA_SITES} invalid={!!errors.siteId} />
          </ModalField>
          <ModalField label="Area" error={errors.areaId}>
            <ModalSelect value={fields.areaId} onChange={(v) => set("areaId", v)} placeholder="Select an area" options={CAMERA_AREAS} invalid={!!errors.areaId} />
          </ModalField>
        </ModalFieldPair>
      </ModalFormSection>

      <ModalFormSection title="Connection">
        <ModalFieldPair>
          <ModalField label="IP Address" error={errors.ipAddress}>
            <ModalTextInput value={fields.ipAddress} onChange={(v) => set("ipAddress", v)} placeholder="10.10.0.10" mono invalid={!!errors.ipAddress} />
          </ModalField>
          <ModalField label="HTTP Port (Optional)">
            <ModalTextInput value={fields.httpPort} onChange={(v) => set("httpPort", v)} placeholder="80" type="number" mono />
          </ModalField>
        </ModalFieldPair>
        <ModalFieldPair>
          <ModalField label="Username" error={errors.username}>
            <ModalTextInput value={fields.username} onChange={(v) => set("username", v)} placeholder="admin" mono invalid={!!errors.username} />
          </ModalField>
          <ModalField label="Password" error={errors.password}>
            <ModalPasswordInput value={fields.password} onChange={(v) => set("password", v)} invalid={!!errors.password} />
          </ModalField>
        </ModalFieldPair>
      </ModalFormSection>

      <ModalFormSection title="Storage">
        <ModalFieldPair>
          <ModalField label="Total Storage (GB)" error={errors.totalStorageGb}>
            <ModalTextInput
              value={fields.totalStorageGb}
              onChange={(v) => set("totalStorageGb", v)}
              placeholder="8000"
              type="number"
              invalid={!!errors.totalStorageGb}
            />
          </ModalField>
          <ModalField label="Retention (Days, Optional)">
            <ModalTextInput value={fields.retentionDays} onChange={(v) => set("retentionDays", v)} placeholder="30" type="number" />
          </ModalField>
        </ModalFieldPair>
        <ModalField label="Cleanup Mode" error={errors.cleanupSchedule}>
          <ModalSelect
            value={fields.cleanupSchedule === "manual" ? "" : fields.cleanupSchedule}
            onChange={(v) => set("cleanupSchedule", v as NvrSharedFields["cleanupSchedule"])}
            placeholder="Select cleanup mode"
            options={CLEANUP_MODE_OPTIONS}
            invalid={!!errors.cleanupSchedule}
          />
        </ModalField>
        {fields.cleanupSchedule === "auto-age" && (
          <ModalField label="Remove recordings older than" error={errors.cleanupAgeDays}>
            <OptionChips
              value={Number(fields.cleanupAgeDays)}
              options={CLEANUP_AGE_OPTIONS}
              onChange={(d) => set("cleanupAgeDays", String(d))}
            />
          </ModalField>
        )}
        {fields.cleanupSchedule === "auto-channel" && (
          <ModalField
            label="Channels to clean up"
            error={errors.cleanupChannels}
            hint={channelCount === 0 ? "Pick a channel count first." : undefined}
          >
            <OptionChips
              multi
              value={fields.cleanupChannels}
              options={Array.from({ length: channelCount }, (_, i) => ({ value: i + 1, label: String(i + 1) }))}
              onChange={(c) =>
                set(
                  "cleanupChannels",
                  fields.cleanupChannels.includes(c) ? fields.cleanupChannels.filter((x) => x !== c) : [...fields.cleanupChannels, c]
                )
              }
            />
          </ModalField>
        )}
      </ModalFormSection>
    </>
  );
}

export function AddNvrModal({
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
    username: "",
    password: "",
    httpPort: "",
    totalStorageGb: "",
    channelCount: "",
    retentionDays: "",
    cleanupSchedule: "",
    cleanupAgeDays: "",
    cleanupChannels: [],
  });

  const [fields, setFields] = React.useState<AddNvrFields>(blank);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Reset the form each time the modal opens.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) { setFields(blank()); setErrors({}); }
  }

  function set<K extends keyof AddNvrFields>(key: K, value: AddNvrFields[K]) {
    setFields((curr) => ({ ...curr, [key]: value }));
    setErrors((curr) => {
      if (!curr[key as string]) return curr;
      const next = { ...curr };
      delete next[key as string];
      return next;
    });
  }

  // The shared form body only sets the fields Add and Edit have in common.
  const setShared = <K extends keyof NvrSharedFields>(key: K, value: NvrSharedFields[K]) => set(key, value as AddNvrFields[K]);

  function handleSubmit() {
    const next: Record<string, string> = {};
    if (!fields.name.trim()) next.name = "NVR name is required.";
    if (!fields.model.trim()) next.model = "Select a model.";
    if (!fields.siteId) next.siteId = "Select a site.";
    if (!fields.areaId) next.areaId = "Select an area.";
    if (!fields.ipAddress.trim()) next.ipAddress = "IP address is required.";
    if (!(Number(fields.channelCount) > 0)) next.channelCount = "Channel count is required.";
    if (!(Number(fields.totalStorageGb) > 0)) next.totalStorageGb = "Total storage is required.";
    if (fields.cleanupSchedule === "") next.cleanupSchedule = "Select a cleanup schedule.";
    if (fields.cleanupSchedule === "auto-age" && !fields.cleanupAgeDays)
      next.cleanupAgeDays = "Select how old recordings must be before cleanup.";
    if (fields.cleanupSchedule === "auto-channel" && fields.cleanupChannels.length === 0)
      next.cleanupChannels = "Select at least one channel to clean up.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onConfirm(fields);
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader title="Add NVR" description="Register a new Network Video Recorder. NVR ID is generated automatically." />
        <ModalBody className="space-y-5">
          <p className={MODAL_NOTE}>
            This NVR will get the ID <strong>{fields.id}</strong>. All its channels start free; link cameras after it&apos;s
            added.
          </p>
          <NvrFormFieldsBody
            fields={fields}
            set={setShared}
            errors={errors}
            channelCount={Number(fields.channelCount) || 0}
            identity={
              <ModalFieldPair>
                <ModalField label="Model" error={errors.model}>
                  <ModalSelect value={fields.model} onChange={(v) => set("model", v)} placeholder="Select a model" options={NVR_MODEL_OPTIONS} invalid={!!errors.model} />
                </ModalField>
                <ModalField label="Channels" error={errors.channelCount}>
                  <ModalSelect
                    value={fields.channelCount}
                    onChange={(v) => set("channelCount", v)}
                    placeholder="Select channels"
                    options={CHANNEL_COUNT_OPTIONS}
                    invalid={!!errors.channelCount}
                  />
                </ModalField>
              </ModalFieldPair>
            }
          />
        </ModalBody>
        <ModalFooter>
          <Button size="sm" onClick={handleSubmit}>Add NVR</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Edit NVR modal ──────────────────────────────────────────────────────── */

interface NvrFormFields {
  name: string;
  username: string;
  password: string;
  siteId: string;
  areaId: string;
  ipAddress: string;
  httpPort: string;
  totalStorageGb: string;
  retentionDays: string;
  cleanupSchedule: NvrData["cleanupSchedule"] | "";
  cleanupAgeDays: string;
  cleanupChannels: number[];
}

function buildNvrFormFields(nvr: NvrData): NvrFormFields {
  return {
    name: nvr.name,
    username: nvr.username,
    password: nvr.password,
    siteId: nvr.siteId,
    areaId: nvr.areaId,
    ipAddress: nvr.ipAddress,
    httpPort: String(nvr.httpPort),
    totalStorageGb: String(nvr.totalStorageGb),
    retentionDays: String(nvr.retentionDays),
    cleanupSchedule: nvr.cleanupSchedule,
    cleanupAgeDays: nvr.cleanupSchedule === "auto-age" ? String(nvr.retentionDays) : "",
    cleanupChannels: [],
  };
}

function serializeNvrFormFields(fields: NvrFormFields): string {
  return JSON.stringify({
    ...fields,
    cleanupChannels: [...fields.cleanupChannels].sort((a, b) => a - b),
  });
}

export function EditNvrModal({
  open, nvr, onClose, onConfirm,
}: {
  open: boolean;
  nvr: NvrData | null;
  onClose: () => void;
  onConfirm: (fields: NvrFormFields) => void;
}) {
  const [fields, setFields] = React.useState<NvrFormFields>({
    name: "", username: "", password: "", siteId: "", areaId: "", ipAddress: "", httpPort: "", totalStorageGb: "", retentionDays: "", cleanupSchedule: "",
    cleanupAgeDays: "", cleanupChannels: [],
  });
  const [initialFields, setInitialFields] = React.useState<NvrFormFields | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Load the NVR's values when the modal opens (or the NVR changes while open).
  const [prevLoad, setPrevLoad] = React.useState<{ open: boolean; nvr: NvrData | null }>({ open: false, nvr: null });
  if (prevLoad.open !== open || prevLoad.nvr !== nvr) {
    setPrevLoad({ open, nvr });
    if (open && nvr) {
      const next = buildNvrFormFields(nvr);
      setFields(next);
      setInitialFields(next);
      setErrors({});
    }
  }

  function set<K extends keyof NvrFormFields>(key: K, value: NvrFormFields[K]) {
    setFields((curr) => ({ ...curr, [key]: value }));
    setErrors((curr) => {
      if (!curr[key as string]) return curr;
      const next = { ...curr };
      delete next[key as string];
      return next;
    });
  }

  function handleSubmit() {
    const next: Record<string, string> = {};
    if (!fields.name.trim()) next.name = "NVR name is required.";
    if (!fields.siteId) next.siteId = "Select a site.";
    if (!fields.areaId) next.areaId = "Select an area.";
    if (!fields.ipAddress.trim()) next.ipAddress = "IP address is required.";
    if (!fields.username.trim()) next.username = "Username is required.";
    if (!fields.password) next.password = "Password is required.";
    if (!(Number(fields.totalStorageGb) > 0)) next.totalStorageGb = "Total storage is required.";
    if (fields.cleanupSchedule === "") next.cleanupSchedule = "Select a cleanup schedule.";
    if (fields.cleanupSchedule === "auto-age" && !fields.cleanupAgeDays)
      next.cleanupAgeDays = "Select how old recordings must be before cleanup.";
    if (fields.cleanupSchedule === "auto-channel" && fields.cleanupChannels.length === 0)
      next.cleanupChannels = "Select at least one channel to clean up.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onConfirm(fields);
  }

  if (!nvr) return null;

  const isDirty = initialFields !== null && serializeNvrFormFields(fields) !== serializeNvrFormFields(initialFields);

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader title="Edit NVR" description={`Update fields for ${nvr.id}. Model and channel count cannot be changed after registration.`} />
        <ModalBody className="space-y-5">
          <p className={MODAL_NOTE}>
            Editing <strong>{nvr.id} · {nvr.name}</strong> ({nvr.model}, {nvr.channelsInUse} of {nvr.channelCount} channels in
            use). Model and channel count can&apos;t be changed.
          </p>
          <NvrFormFieldsBody fields={fields} set={set} errors={errors} channelCount={nvr.channelCount} />
        </ModalBody>
        <ModalFooter>
          <Button size="sm" disabled={!isDirty} onClick={handleSubmit}>Save Changes</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Delete NVR modal ────────────────────────────────────────────────────── */

export function DeleteNvrModal({
  open, nvr, onClose, onConfirm,
}: {
  open: boolean;
  nvr: NvrData | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!nvr) return null;
  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="sm">
        <ModalHeader title="Delete NVR" />
        <ModalBody>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Are you sure you want to delete <strong className="text-foreground">{nvr.name}</strong>? Its{" "}
            <strong className="text-foreground">{nvr.channelsInUse}</strong> cameras lose storage and{" "}
            {nvr.usedStorageGb.toLocaleString()} GB of recordings can&apos;t be recovered.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" variant="destructive" onClick={onConfirm}>Delete NVR</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Toast ───────────────────────────────────────────────────────────────── */

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function NvrDevicesPage({
  forcedState = "normal",
}: {
  forcedState?: "normal" | "empty";
} = {}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const updateCameraInStore = useCamerasStore((s) => s.updateCamera);
  const isEmptyState = forcedState === "empty";
  const [nvrs, setNvrs] = React.useState<NvrData[]>(() => (isEmptyState ? [] : [...MOCK_NVRS]));
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<NvrFilters>(EMPTY_FILTERS);
  const [kpiFilter, setKpiFilter] = React.useState<KpiFilter>("all");
  // The open drawer follows the ?nvr=<id> search param.
  const drawerId = searchParams.get("nvr");
  const [page, setPage] = React.useState(1);
  const [modal, setModal] = React.useState<
    | { kind: "cleanup" }
    | { kind: "cleanup-running"; methodLabel: string; totalToProcess: number; freed: number; previous: number; processed: number }
    | { kind: "cleanup-done"; previous: number; freed: number; current: number; total: number; processed: { processed: number; outOf: number } }
    | { kind: "sync-running" }
    | { kind: "export" }
    | { kind: "edit" }
    | { kind: "add" }
    | { kind: "link"; channel: number }
    | { kind: "unlink"; channel: number }
    | { kind: "delete" }
    | null
  >(null);
  const cleanupTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => () => {
    if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
  }, []);
  const pageSize = 10;

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
    setSearchParams({ nvr: id });
  }
  function closeDrawer() {
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

  function handleManualSync() {
    if (!drawerNvr) return;
    // Drop any in-flight sync timer so its completion can't close this run's modal.
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    setModal({ kind: "sync-running" });

    // Progress is animated inside the modal; commit the refreshed timestamps
    // once the simulated sync finishes.
    syncTimerRef.current = setTimeout(() => {
      const now = new Date();
      setNvrs((curr) => curr.map((n) => n.id === drawerNvr.id ? {
        ...n,
        lastSeenAt: now.toISOString(),
        lastSeenDisplay: "Just now",
        activeAt: now.toISOString(),
        activeAtDisplay: now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      } : n));
      setModal(null);
      syncTimerRef.current = null;
      toast.success(`${drawerNvr.name} synced`);
    }, 2600);
  }

  function handleSyncCancel() {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    setModal(null);
    toast.success("Sync cancelled — no changes were applied");
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

  const nvrColumns: DataTableColumn<NvrData>[] = [
    {
      key: "id",
      header: "ID",
      cell: (n) => (
        <span className="font-mono text-sm font-semibold text-muted-foreground transition-colors group-hover:text-primary-ink">
          {n.id}
        </span>
      ),
    },
    {
      key: "name",
      header: "NAME · MODEL",
      cell: (n) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-foreground transition-colors group-hover:text-primary-ink">
            {n.name}
          </span>
          <span className="font-mono text-xs text-muted-foreground">{n.model}</span>
        </div>
      ),
    },
    { key: "status", header: "STATUS", cell: (n) => <StatusPill status={n.status} /> },
    {
      key: "channels",
      header: "CHANNELS",
      className: "text-foreground",
      headClassName: "",
      cell: (n) => (
        <span className="font-mono">
          {n.channelsInUse} <span className="text-muted-foreground">/ {n.channelCount}</span>
        </span>
      ),
    },
    {
      key: "storage",
      header: "STORAGE",
      cell: (n) => <StorageBar used={n.usedStorageGb} total={n.totalStorageGb} />,
    },
    {
      key: "location",
      header: "LOCATION",
      className: "text-muted-foreground",
      headClassName: "",
      cell: (n) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground">{n.areaName}</span>
          <span className="text-xs">{n.siteName}</span>
        </div>
      ),
    },
    {
      key: "lastActive",
      header: "LAST ACTIVE",
      className: "text-muted-foreground",
      headClassName: "",
      cell: (n) => (
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3" />
          {n.lastSeenDisplay}
        </div>
      ),
    },
    {
      key: "action",
      header: "ACTION",
      stopRowClick: true,
      cell: (n) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${n.name}`} className="px-0 font-normal gap-0 text-[length:inherit] whitespace-normal dark:hover:bg-muted aria-expanded:bg-transparent flex size-7 items-center justify-center rounded border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground aria-expanded:text-muted-foreground/50">
              <MoreHorizontal className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="end">
            <ItemButton variant="plain"
              onClick={() => openDrawer(n.id)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
            >
              <HardDrive className="size-3.5 text-muted-foreground" />
              View details
            </ItemButton>
            <ItemButton variant="plain"
              onClick={() => { openDrawer(n.id); setTimeout(() => setModal({ kind: "cleanup" }), 100); }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
            >
              <Sparkles className="size-3.5 text-muted-foreground" />
              Cleanup now
            </ItemButton>
            <ItemButton variant="plain" className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted">
              <Pencil className="size-3.5 text-muted-foreground" />
              Edit NVR
            </ItemButton>
            <div className="my-1 border-t border-border" />
            <ItemButton variant="plain"
              onClick={() => { openDrawer(n.id); setTimeout(() => setModal({ kind: "delete" }), 100); }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-severity-critical hover:bg-severity-critical/10"
            >
              <Trash2 className="size-3.5" />
              Delete
            </ItemButton>
          </PopoverContent>
        </Popover>
      ),
    },
  ];

  return (
    <div data-slot="nvr-devices-page" className="flex flex-col gap-section">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>NVR Devices</PageHeader.Title>
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
            tone={cfg.accent}
            active={cfg.key !== "all" && kpiFilter === cfg.key}
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
        additionalActiveCount={kpiFilter !== "all" ? 1 : 0}
      />

      {/* Count */}
      <p data-slot="nvr-devices-page-results" className="text-base text-muted-foreground">
        <strong className="text-foreground">{filtered.length}</strong>{" "}
        {filtered.length === 1 ? "NVR" : "NVRs"} match current filters
        {hasFilters && (
          <Button variant="link"
            onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); setKpiFilter("all"); }}
            className="h-auto px-0 border-0 rounded-none font-normal gap-0 text-[length:inherit] whitespace-normal ml-2 text-muted-foreground underline hover:text-primary-ink"
          >
            Clear all
          </Button>
        )}
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div data-slot="nvr-devices-page-empty" className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <HardDrive className="size-10 opacity-20" />
          {nvrs.length === 0 ? (
            <>
              <p className="text-sm font-medium text-foreground">No NVR devices yet</p>
              <p className="text-sm">Add a Network Video Recorder to start storing camera footage.</p>
              <Button size="sm" className="gap-1.5" onClick={() => setModal({ kind: "add" })}>
                <Plus className="size-4" />
                Add NVR
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm">No NVRs match the current filters.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); setKpiFilter("all"); }}
              >
                Clear filters
              </Button>
            </>
          )}
        </div>
      ) : (
        <div data-slot="nvr-devices-page-table" className="overflow-hidden rounded-xl border border-border bg-card">
          <DataTable
            variant="list"
            columns={nvrColumns}
            data={pageItems}
            getRowId={(n) => n.id}
            onRowClick={(n) => openDrawer(n.id)}
            getRowClassName={() => "transition-colors"}
          />

          {/* Pagination */}
          <div data-slot="nvr-devices-page-pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              {filtered.length === 0
                ? "0 of 0"
                : `${(page - 1) * pageSize + 1} – ${Math.min(page * pageSize, filtered.length)} of ${filtered.length}`}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" aria-label="Previous page"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="size-7 rounded border border-border bg-transparent text-muted-foreground hover:border-primary/30 hover:bg-transparent hover:text-foreground disabled:opacity-40 dark:border-border dark:bg-transparent dark:hover:bg-transparent"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="px-2 text-sm text-foreground">
                {page} <span className="text-muted-foreground">of {pageCount}</span>
              </span>
              <Button variant="outline" size="icon-sm" aria-label="Next page"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className="size-7 rounded border border-border bg-transparent text-muted-foreground hover:border-primary/30 hover:bg-transparent hover:text-foreground disabled:opacity-40 dark:border-border dark:bg-transparent dark:hover:bg-transparent"
              >
                <ChevronRight className="size-3.5" />
              </Button>
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
        onManualSync={handleManualSync}
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
      {modal?.kind === "sync-running" && (
        <SyncProgressModal
          title="Syncing NVR…"
          deviceLabel={drawerNvr?.name ?? "NVR"}
          stages={SYNC_STAGES}
          onCancel={handleSyncCancel}
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
            username: fields.username.trim(),
            password: fields.password,
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
            username: fields.username.trim(),
            password: fields.password,
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
