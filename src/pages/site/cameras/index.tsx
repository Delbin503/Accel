import * as React from "react";
import { ItemButton } from "@accel/ui/components/ui/item";
import { SegmentedControl, SegmentedControlItem } from "@accel/ui/components/ui/segmented-control";
import { DataTable, type DataTableColumn } from "@accel/ui/components/shared/DataTable";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import cameraLiveSample from "@/assets/camera-live-sample.webp";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Check,
  X,
  Plus,
  Video,
  WifiOff,
  AlertTriangle,
  HardDrive,
  MapPin,
  Calendar,
  Trash2,
  MoreHorizontal,
  Pencil,
  Play,
  Link2,
  Radio,
  FileVideo,
  Layers,
  Unlink,
  RefreshCw,
  Eye,
  EyeOff,
  Settings,
} from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@accel/ui/components/shared/Modal";
import { ToolbarSearch } from "@accel/ui/components/shared/Toolbar";
import { Button } from "@accel/ui/components/ui/button";
import { Input } from "@accel/ui/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@accel/ui/components/ui/popover";
import { Checkbox } from "@accel/ui/components/ui/checkbox";
import { TimeSelect } from "@accel/ui/components/shared/TimeSelect";
import {
  CheckList,
  CheckListEmpty,
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
import { PageHeader } from "@accel/ui/components/layout/PageHeader";
import { cn } from "@accel/ui/lib/utils";
import { CAMERA_SITES, CAMERA_AREAS } from "@/mocks/cameras";
import { useCamerasStore } from "@/stores/useCamerasStore";
import { MOCK_NVRS } from "@/mocks/nvr";
import { MOCK_DEPLOYMENTS } from "@/mocks/deployments";
import { getRecordingsForCamera } from "@/mocks/recordings";
import type { CameraData, CameraStatus } from "@/types/cameras";
import { KpiCard, KpiGrid, type KpiTone } from "@accel/ui/components/shared/KpiCard";
import { TruncatedText } from "@accel/ui/components/shared/TruncatedText";
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
import { StatusBadge } from "@accel/ui/components/shared/StatusBadge";
import { RecordingCard } from "@/components/app/RecordingCard";
import { SyncProgressModal } from "@/components/app/SyncProgressModal";
import type { DeploymentData } from "@/types/deployments";

/* ── Status pill ─────────────────────────────────────────────────────────── */

const STATUS_STYLES: Record<CameraStatus, { bg: string; text: string; dot: string; label: string }> = {
  online:              { bg: "bg-success/15 border-success/30",           text: "text-success",          dot: "bg-success",          label: "Online" },
  offline:             { bg: "bg-muted border-border",                    text: "text-muted-foreground", dot: "bg-muted-foreground", label: "Offline" },
  "connection-failed": { bg: "bg-severity-critical/15 border-severity-critical/30", text: "text-severity-critical",     dot: "bg-severity-critical",     label: "Failed" },
};

/** Masked credential with a reveal toggle — kept hidden by default so the drawer
    can be shown on shared screens without exposing the camera password. */
function RevealValue({ value }: { value: string }) {
  const [shown, setShown] = React.useState(false);
  if (!value) return <span className="font-mono text-xs">—</span>;
  return (
    <span className="flex items-center gap-1.5">
      <span className="font-mono text-xs">{shown ? value : "•".repeat(Math.min(value.length, 12))}</span>
      <Button variant="ghost" size="icon-xs"
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? "Hide password" : "Show password"}
        className="size-auto rounded-none p-0 text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
      >
        {shown ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      </Button>
    </span>
  );
}

function StatusPill({ status }: { status: CameraStatus }) {
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

/* ── Network signal strength (deterministic per camera, no field on the model) ── */

function networkSignalPercent(cameraId: string, status: CameraStatus): number {
  let hash = 0;
  for (let i = 0; i < cameraId.length; i++) hash = (hash * 31 + cameraId.charCodeAt(i)) >>> 0;
  if (status === "offline") return 0;
  const range = status === "online" ? [78, 99] : [4, 22];
  return range[0] + (hash % (range[1] - range[0] + 1));
}

/* ── KPI cards ───────────────────────────────────────────────────────────── */

type KpiFilter = "all" | "online" | "offline" | "connection-failed" | "unlinked";

const KPI_CONFIGS: {
  key: KpiFilter;
  label: string;
  sub: string;
  accent: KpiTone;
  getValue: (items: CameraData[]) => number;
}[] = [
  { key: "all",               label: "Total Cameras",     sub: "Across all sites",        accent: "primary",      getValue: (i) => i.length },
  { key: "online",            label: "Online",            sub: "Streaming + healthy",     accent: "success",      getValue: (i) => i.filter((c) => c.status === "online").length },
  { key: "offline",           label: "Offline",           sub: "Last seen > threshold",   accent: "muted",        getValue: (i) => i.filter((c) => c.status === "offline").length },
  { key: "connection-failed", label: "Connection Failed", sub: "RTSP unreachable",        accent: "severity-critical", getValue: (i) => i.filter((c) => c.status === "connection-failed").length },
  { key: "unlinked",          label: "Unlinked to NVR",   sub: "Events have no footage",  accent: "warning",      getValue: (i) => !i ? 0 : i.filter((c) => !c.nvrId).length },
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
            "justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-base transition-colors hover:border-primary",
            open ? "border-primary" : "border-border",
            hasValue ? "text-primary-ink" : "text-muted-foreground"
          )}
        >
          <TruncatedText text={displayLabel} className="font-medium" />
          <ChevronDown
            className={cn("size-3.5 flex-shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </ItemButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1.5">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <ItemButton variant="plain"
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className="gap-2 rounded px-2 py-1.5 text-base text-muted-foreground hover:bg-muted hover:text-foreground"
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

interface CameraFilters {
  site: string[];
  area: string[];
  status: string[];
  nvr: string[];
}
const EMPTY_FILTERS: CameraFilters = { site: [], area: [], status: [], nvr: [] };


function FilterPanel({
  filters,
  onChange,
  search,
  onSearchChange,
  additionalActiveCount = 0,
}: {
  filters: CameraFilters;
  onChange: (f: CameraFilters) => void;
  search: string;
  onSearchChange: (v: string) => void;
  additionalActiveCount?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const filterCount = Object.values(filters).reduce((s, arr) => s + arr.length, 0);
  const activeCount = filterCount + (search ? 1 : 0) + additionalActiveCount;

  function setGroup(group: keyof CameraFilters, values: string[]) {
    onChange({ ...filters, [group]: values });
  }

  const NVR_OPTS = [
    { value: "linked", label: "Linked" },
    { value: "unlinked", label: "Unlinked" },
  ];

  return (
    <div data-slot="cameras-filter-panel" className="rounded-xl border border-border bg-card">
      <div
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <ItemButton variant="plain"
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-auto flex-1 gap-2.5"
        >
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-base font-semibold text-foreground">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary-fill px-2 py-px text-xs font-semibold text-primary-foreground">
              {activeCount} active
            </span>
          ) : (
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {["All sites", "All areas", "All NVRs"].map((l) => (
                <span
                  key={l}
                  className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {l}
                </span>
              ))}
            </div>
          )}
        </ItemButton>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-xs" className="size-auto rounded-none p-0 hover:bg-transparent dark:hover:bg-transparent"
            type="button"
            aria-label={open ? "Collapse filters" : "Expand filters"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      {open && (
        <div data-slot="cameras-filter-panel-body" className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
          <ToolbarSearch value={search} onChange={onSearchChange} placeholder="Search by ID, name, IP, or NVR…" className="sm:w-full" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { key: "site"   as const, label: "Site",   opts: CAMERA_SITES },
              { key: "area"   as const, label: "Area",   opts: CAMERA_AREAS },
              { key: "nvr"    as const, label: "NVR",    opts: NVR_OPTS },
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

/* ── Drawer sub-components ───────────────────────────────────────────────── */

// Unified compact StatCard — delegates to the shared KpiCard so accent bar + sizing match.
function StatCard({
  label,
  value,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  icon: _icon,
  valueClass,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  valueClass?: string;
  sub?: string;
}) {
  // Derive accent from valueClass (text-success / text-info / text-severity-critical / text-warning).
  const accent: KpiTone =
    valueClass?.includes("text-success")      ? "success" :
    valueClass?.includes("text-info")         ? "info" :
    valueClass?.includes("text-severity-critical") ? "severity-critical" :
    valueClass?.includes("text-warning")      ? "warning" :
    valueClass?.includes("text-violet")       ? "violet" :
    "primary";
  return <KpiCard compact label={label} value={value} sub={sub} tone={accent} />;
}

/* ── Deployment status pill (mini, drawer-only) ──────────────────────────── */

// Status colors mirror the Model Deployment History KPI cards exactly:
//   active=success  paused=warning  pending=info  stopped=muted  failed=severity-critical
/* ── Draw zone modal ─────────────────────────────────────────────────────── */

/* ── Camera Drawer ───────────────────────────────────────────────────────── */

type DrawerTab = "overview" | "recordings";

/* Drawer body — loading skeleton (mirrors the overview layout). */
function CameraDrawerSkeleton() {
  return (
    <div data-slot="camera-drawer-skeleton" className="flex-1 space-y-5 overflow-y-auto p-5">
      <div className="aspect-video w-full animate-pulse rounded-xl bg-muted" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="space-y-2.5">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="space-y-2.5">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-16 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}

/* Drawer body — error state with retry. */
function CameraDrawerError({ onRetry }: { onRetry: () => void }) {
  return (
    <div data-slot="camera-drawer-error" className="flex flex-1 flex-col items-center justify-center gap-3 p-5 text-muted-foreground">
      <AlertTriangle className="size-8 text-severity-critical" />
      <p className="text-sm text-foreground">Couldn't load camera details.</p>
      <p className="text-xs">The feed and configuration for this camera are unavailable.</p>
      <Button variant="outline" size="sm" className="mt-1 gap-1.5" onClick={onRetry}>
        <RefreshCw className="size-3.5" />
        Retry
      </Button>
    </div>
  );
}

/** Stable empty list for the forced empty state (keeps memo deps stable). */
const NO_CAMERAS: CameraData[] = [];

const RECORDING_DATE_FILTERS: { key: string; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "today",     label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week",      label: "This Week" },
  { key: "month",     label: "This Month" },
  { key: "custom",    label: "Custom Date" },
];

/* ── Link NVR modal — pick an NVR + free channel at the camera's site ── */

export function LinkNvrModal({
  open, camera, onClose, onLink,
}: {
  open: boolean;
  camera: CameraData | null;
  onClose: () => void;
  onLink: (cameraId: string, nvrId: string, nvrName: string, channel: number) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [selection, setSelection] = React.useState<{ nvrId: string; channel: number } | null>(null);

  // Reset each time the modal opens.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) { setSearch(""); setSelection(null); }
  }

  if (!camera) return null;

  const siteNvrs = MOCK_NVRS.filter((n) => n.siteId === camera.siteId);

  // Build the candidate channel rows — only free channels are linkable.
  const rows = siteNvrs.flatMap((n) =>
    n.channels.map((ch) => ({
      nvrId: n.id,
      nvrName: n.name,
      nvrModel: n.model,
      nvrIp: n.ipAddress,
      channel: ch.channel,
      cameraId: ch.cameraId,
      nvrManaged: !!ch.nvrManaged,
    }))
  );
  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) =>
        `${r.nvrId} ${r.nvrName} ${r.nvrModel} ${r.nvrIp} ch${r.channel} ${r.cameraId ?? ""}`.toLowerCase().includes(q)
      )
    : rows;

  function commit() {
    if (!selection || !camera) return;
    const row = rows.find((r) => r.nvrId === selection.nvrId && r.channel === selection.channel);
    if (!row) return;
    onLink(camera.id, row.nvrId, row.nvrName, row.channel);
    onClose();
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader title="Link NVR Channel" description={`Choose a channel for ${camera.id} · ${camera.name}`} />
        <ModalBody className="space-y-4">
          <p className={MODAL_NOTE}>
            Pick a free channel for <strong>{camera.id} · {camera.name}</strong>. Only NVRs at the same site are listed.
          </p>
          <ModalSearchInput value={search} onChange={setSearch} placeholder="Search by NVR, model, IP or channel…" />
          <CheckList
            empty={
              siteNvrs.length === 0 ? (
                <CheckListEmpty>No NVRs at this site yet.</CheckListEmpty>
              ) : filtered.length === 0 ? (
                <CheckListEmpty>No channels match &ldquo;{search}&rdquo;.</CheckListEmpty>
              ) : undefined
            }
          >
            {filtered.map((r) => {
              const inUse = !!r.cameraId || r.nvrManaged;
              const selected = selection?.nvrId === r.nvrId && selection?.channel === r.channel;
              const meta = `${r.nvrModel} · ${r.nvrIp}`;
              return (
                <CheckRow
                  key={`${r.nvrId}-${r.channel}`}
                  checked={selected}
                  disabled={inUse}
                  // One channel per camera: ticking a row unticks the others.
                  onToggle={() => setSelection(selected ? null : { nvrId: r.nvrId, channel: r.channel })}
                  label={`${r.nvrName} channel ${r.channel}`}
                  title={
                    <>
                      {r.nvrName} <span className="font-mono text-muted-foreground">· Ch {String(r.channel).padStart(2, "0")}</span>
                    </>
                  }
                  // The badge uppercases its text, so the camera ID goes in the meta line.
                  meta={r.cameraId ? `${meta} · used by ${r.cameraId}` : meta}
                  aside={
                    inUse ? (
                      <StatusBadge tone="neutral" dot={false}>In use</StatusBadge>
                    ) : (
                      <StatusBadge tone="success">Available</StatusBadge>
                    )
                  }
                />
              );
            })}
          </CheckList>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" onClick={commit} disabled={!selection}>Link Channel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

type DrawerAsync = "idle" | "loading" | "error";

interface CameraDrawerProps {
  camera: CameraData | null;
  deployments: DeploymentData[];
  open: boolean;
  /** Async detail-fetch state. "idle" shows content immediately. */
  asyncState?: DrawerAsync;
  onClose: () => void;
  onOpenNvr: (nvrId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onNvrSync: () => void;
  onLinkNvrRequest: (cameraId: string) => void;
  onUnlinkNvr: (cameraId: string) => void;
  /** Extra full-width Device Info entries, from columns that define a drawer view. */
  extraFields?: CameraExtraColumn[];
}

export function CameraDrawer({
  camera,
  deployments,
  open,
  asyncState = "idle",
  onClose,
  onOpenNvr,
  onEdit,
  onDelete,
  onNvrSync,
  onLinkNvrRequest,
  onUnlinkNvr,
  extraFields = [],
}: CameraDrawerProps) {
  const navigate = useNavigate();
  const [tab, setTab] = React.useState<DrawerTab>("overview");
  const [recordingSearch, setRecordingSearch] = React.useState("");
  const [recordingDate, setRecordingDate] = React.useState("all");
  const [customFrom, setCustomFrom] = React.useState("");
  const [customTo, setCustomTo] = React.useState("");
  const [selectedRecordingIds, setSelectedRecordingIds] = React.useState<Set<string>>(new Set());
  // Detail-fetch phase. Retry clears the forced async state back to content.
  const [retried, setRetried] = React.useState(false);
  const phase: DrawerAsync = retried ? "idle" : asyncState;

  // Reset the drawer whenever it opens or switches to another camera.
  const cameraId = camera?.id;
  const [prevReset, setPrevReset] = React.useState({ open, cameraId });
  if (prevReset.open !== open || prevReset.cameraId !== cameraId) {
    setPrevReset({ open, cameraId });
    if (open) {
      setTab("overview");
      setRecordingSearch("");
      setRecordingDate("all");
      setCustomFrom("");
      setCustomTo("");
      setSelectedRecordingIds(new Set());
      setRetried(false);
    }
  }

  const recordings = React.useMemo(
    () => (camera ? getRecordingsForCamera(camera.id) : []),
    [camera]
  );
  const nvr = camera && camera.nvrId ? MOCK_NVRS.find((n) => n.id === camera.nvrId) : null;

  const filteredRecordings = recordings.filter((r) => {
    if (recordingSearch) {
      const q = recordingSearch.toLowerCase();
      if (!`${r.id} ${r.areaName} ${r.dateLabel}`.toLowerCase().includes(q)) return false;
    }
    if (recordingDate === "today") return r.dateLabel === "Today";
    if (recordingDate === "yesterday") return r.dateLabel === "Yesterday";
    if (recordingDate === "week") return r.dateLabel === "Today" || r.dateLabel === "Yesterday";
    if (recordingDate === "custom") {
      if (!customFrom && !customTo) return true;
      const startsAt = new Date(r.startsAt).getTime();
      if (customFrom) {
        const fromTs = new Date(customFrom + "T00:00:00").getTime();
        if (startsAt < fromTs) return false;
      }
      if (customTo) {
        const toTs = new Date(customTo + "T23:59:59").getTime();
        if (startsAt > toTs) return false;
      }
      return true;
    }
    return true;
  });

  return (
    <DetailDrawer open={open} onOpenChange={(v) => !v && onClose()} size="lg">
      {/* Header */}
      <DetailDrawerHeader data-slot="camera-drawer-header">
        {camera ? (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusPill status={camera.status} />
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <DetailDrawerTitle><TruncatedText text={camera.name} /></DetailDrawerTitle>
              <span className="rounded border border-border bg-muted px-1.5 py-px font-mono text-2xs text-muted-foreground">
                {camera.id}
              </span>
            </div>
            <DetailDrawerDescription className="gap-x-1.5">
              <MapPin />
              {camera.siteName} · {camera.areaName}
            </DetailDrawerDescription>
          </>
        ) : (
          <DetailDrawerTitle className="text-md font-normal text-muted-foreground">Camera not found</DetailDrawerTitle>
        )}

        {/* Tabs */}
        {camera && (
          <div data-slot="camera-drawer-tabs" className="mt-1.5 flex items-center gap-1 border-b border-transparent">
            {[
              { key: "overview" as const,   label: "Overview",   icon: Layers },
              { key: "recordings" as const, label: "Recordings", icon: FileVideo, badge: recordings.length },
            ].map(({ key, label, icon: Icon, badge }) => (
              <ItemButton variant="plain" selected={tab === key}
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "relative w-auto gap-1.5 px-3 py-2 text-base font-semibold transition-colors",
                  tab === key
                    ? "text-primary-ink"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3.5" />
                {label}
                {badge != null && badge > 0 && (
                  <span className="ml-0.5 rounded-full bg-muted px-1.5 py-px text-2xs font-semibold text-muted-foreground">
                    {badge}
                  </span>
                )}
                {tab === key && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
                )}
              </ItemButton>
            ))}
          </div>
        )}
      </DetailDrawerHeader>

        {/* Detail-fetch states */}
        {camera && phase === "loading" && <CameraDrawerSkeleton />}
        {camera && phase === "error" && (
          <CameraDrawerError onRetry={() => setRetried(true)} />
        )}

        {/* Body */}
        {camera && phase === "idle" && tab === "overview" && (
          <DetailDrawerBody data-slot="camera-drawer-body">
            {/* Live feed */}
            <div data-slot="camera-drawer-live-feed" className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="relative aspect-video w-full overflow-hidden bg-media-raised">
                {camera.status === "online" ? (
                  <>
                    <img
                      src={cameraLiveSample}
                      alt={`Live feed — ${camera.siteName} / ${camera.areaName}`}
                      className="absolute inset-0 size-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-scrim/40 via-transparent to-scrim/50" />
                  </>
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(120% 80% at 50% 60%, rgba(180,140,80,0.18) 0%, rgba(60,40,20,0.1) 40%, rgba(0,0,0,0.95) 100%)",
                    }}
                  />
                )}
                {camera.status === "online" ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-scrim/40 backdrop-blur-sm">
                      <Play className="size-5 text-media-foreground" />
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <WifiOff className="size-7 opacity-60" />
                    <p className="text-xs">Feed unavailable</p>
                  </div>
                )}
                <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-scrim/50 px-2 py-0.5 text-2xs font-bold uppercase tracking-widest text-media-foreground backdrop-blur-sm">
                  <span className="size-1.5 animate-pulse rounded-full bg-severity-critical" />
                  Live
                </div>
                <div className="absolute bottom-3 left-3 rounded bg-scrim/60 px-2 py-0.5 font-mono text-2xs text-media-foreground/80 backdrop-blur-sm">
                  {camera.siteName} / {camera.areaName}
                </div>
              </div>
            </div>

            {/* 3-up stat strip */}
            <div data-slot="camera-drawer-stats" className="grid grid-cols-3 gap-3">
              <StatCard
                label="Recordings"
                value={recordings.length}
                icon={<FileVideo className="size-3 text-primary-ink" />}
                sub="Last 14 days"
              />
              <StatCard
                label="Network"
                value={camera.status === "offline" ? "—" : `${networkSignalPercent(camera.id, camera.status)}%`}
                valueClass={
                  camera.status === "online" ? "text-success"
                  : camera.status === "connection-failed" ? "text-severity-critical"
                  : "text-muted-foreground"
                }
                icon={<Radio className={cn(
                  "size-3",
                  camera.status === "online" ? "text-success"
                  : camera.status === "connection-failed" ? "text-severity-critical"
                  : "text-muted-foreground"
                )} />}
                sub={camera.lastSeenDisplay}
              />
              <StatCard
                label="NVR Status"
                value={nvr ? (nvr.status === "online" ? "Recording" : nvr.status === "degraded" ? "Degraded" : "Offline") : "Not Linked"}
                valueClass={
                  !nvr ? "text-warning"
                  : nvr.status === "online" ? "text-success"
                  : nvr.status === "degraded" ? "text-warning"
                  : "text-muted-foreground"
                }
                icon={<HardDrive className={cn(
                  "size-3",
                  !nvr ? "text-warning"
                  : nvr.status === "online" ? "text-success"
                  : nvr.status === "degraded" ? "text-warning"
                  : "text-muted-foreground"
                )} />}
                sub={nvr ? `${nvr.id} · Ch ${camera.channel}` : "Footage unavailable"}
              />
            </div>

            {/* Device Info — full KV grid */}
            <DetailDrawerSection data-slot="camera-drawer-device-info" title="Device Info">
              <DescriptionList columns={2} variant="card">
                <DescriptionItem label="Camera Name">{camera.name}</DescriptionItem>
                <DescriptionItem label="Camera ID" mono><span className="text-primary-ink">{camera.id}</span></DescriptionItem>
                <DescriptionItem label="Status"><StatusPill status={camera.status} /></DescriptionItem>
                <DescriptionItem label="Last Activity">{camera.lastSeenDisplay}</DescriptionItem>
                <DescriptionItem label="Site Location">{camera.siteName}</DescriptionItem>
                <DescriptionItem label="Area Name">{camera.areaName}</DescriptionItem>
                <DescriptionItem label="IP Address" mono>{camera.ipAddress}</DescriptionItem>
                <DescriptionItem label="RTSP Port" mono>{camera.rtspPort}</DescriptionItem>
                <DescriptionItem label="Username" mono>{camera.username || "—"}</DescriptionItem>
                <DescriptionItem label="Password"><RevealValue value={camera.password} /></DescriptionItem>
                <DescriptionItem label="Active Since">{camera.activeAtDisplay}</DescriptionItem>
                <DescriptionItem label="Events (24h)"><span className="font-semibold">{camera.recentEventCount}</span></DescriptionItem>
                <DescriptionItem label="Active Models"><span className="font-semibold">{deployments.filter((d) => d.status === "active").length}</span></DescriptionItem>
                <DescriptionItem label="Retention">{`${camera.recording.retentionDays} days`}</DescriptionItem>
                {extraFields.map((field) =>
                  field.drawerCell ? (
                    <DescriptionItem
                      key={field.header}
                      wide
                      label={field.drawerLabel ?? field.header}
                      className="gap-1.5 border-t border-border pt-2.5"
                    >
                      {field.drawerCell(camera)}
                    </DescriptionItem>
                  ) : null
                )}
              </DescriptionList>
            </DetailDrawerSection>

            {/* Stream + Video Specs */}
            <DetailDrawerSection data-slot="camera-drawer-stream" title="Stream Specifications">
              <DescriptionList columns={2} variant="card">
                <DescriptionItem label="Codec">{camera.stream.codec.toUpperCase()}</DescriptionItem>
                <DescriptionItem label="Resolution" mono>{camera.stream.resolution}</DescriptionItem>
                <DescriptionItem label="Frame Rate">{`${camera.stream.frameRate} fps`}</DescriptionItem>
                <DescriptionItem label="Bitrate" mono>{camera.recording.bitrateKbps} kbps</DescriptionItem>
                <DescriptionItem label="Schedule"><span className="capitalize">{camera.recording.schedule.replace(/-/g, " ")}</span></DescriptionItem>
                <DescriptionItem label="RTSP URL" mono wide><span className="break-all">{camera.rtspUrl}</span></DescriptionItem>
              </DescriptionList>
            </DetailDrawerSection>

            {/* NVR Storage */}
            <DetailDrawerSection data-slot="camera-drawer-storage" title="NVR Storage">
              {nvr && camera.nvrId && camera.nvrName ? (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-3">
                  <ItemButton variant="plain"
                    onClick={() => onOpenNvr(camera.nvrId!)}
                    className="group w-auto flex-1 gap-3 transition-colors"
                  >
                    <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg border border-info/30 bg-info/10">
                      <HardDrive className="size-4 text-info" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <TruncatedText
                        text={camera.nvrName}
                        className="text-base font-semibold text-foreground transition-colors group-hover:text-primary-ink"
                      />
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {nvr.model} · {camera.nvrId} · Channel {camera.channel} · IP {nvr.ipAddress}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Used: <span className="font-semibold text-foreground">{nvr.usedStorageGb.toFixed(1)}</span> / {nvr.totalStorageGb.toFixed(1)} TB
                      </p>
                    </div>
                  </ItemButton>
                  <Button variant="outline" size="xs"
                    onClick={() => onUnlinkNvr(camera.id)}
                    title="Unlink NVR"
                    className="h-auto gap-1.5 rounded-md border border-severity-critical/30 bg-transparent px-2.5 py-1 text-xs font-semibold text-severity-critical transition-colors hover:bg-severity-critical/10 hover:text-severity-critical dark:border-severity-critical/30 dark:bg-transparent dark:hover:bg-severity-critical/10"
                  >
                    <Unlink className="size-3" />
                    Unlink
                  </Button>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/[0.06] px-3.5 py-3">
                  <AlertTriangle className="size-4 flex-shrink-0 text-warning" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Not linked to any NVR</p>
                    <p className="text-xs text-muted-foreground">
                      Detection events from this camera will have no replayable footage.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onLinkNvrRequest(camera.id)}>
                    <Link2 className="size-3.5" />
                    Link NVR
                  </Button>
                </div>
              )}
            </DetailDrawerSection>
          </DetailDrawerBody>
        )}

        {camera && phase === "idle" && tab === "recordings" && (
          <DetailDrawerBody data-slot="camera-drawer-recordings" className="gap-4">
            {/* Search + date filters */}
            <div data-slot="camera-drawer-recordings-filters" className="space-y-3">
              <ToolbarSearch value={recordingSearch} onChange={setRecordingSearch} placeholder="Search by recording ID or area…" className="sm:w-full" />
              <SegmentedControl
                type="single"
                variant="outline"
                value={recordingDate}
                onValueChange={(next) => next && setRecordingDate(next as typeof recordingDate)}
                className="flex w-full flex-wrap items-center gap-1.5"
              >
                {RECORDING_DATE_FILTERS.map((f) => (
                  <SegmentedControlItem value={f.key}
                    key={f.key}
                    className={cn(
                      "h-auto rounded-md border px-2.5 py-1 text-sm font-semibold transition-colors",
                      recordingDate === f.key
                        ? "data-[state=on]:border-primary data-[state=on]:bg-primary-fill data-[state=on]:text-primary-foreground hover:bg-primary-fill hover:text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-card hover:text-foreground"
                    )}
                  >
                    {f.label}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>

              {recordingDate === "custom" && (
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-background p-3">
                  <div>
                    <label className="mb-1 block text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
                      From
                    </label>
                    <Input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      max={customTo || undefined}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 py-0 text-sm text-foreground shadow-none focus:border-primary focus:outline-none focus-visible:border-primary focus-visible:ring-0 md:text-sm dark:bg-background"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
                      To
                    </label>
                    <Input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      min={customFrom || undefined}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 py-0 text-sm text-foreground shadow-none focus:border-primary focus:outline-none focus-visible:border-primary focus-visible:ring-0 md:text-sm dark:bg-background"
                    />
                  </div>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{filteredRecordings.length}</strong>{" "}
              recording{filteredRecordings.length === 1 ? "" : "s"}
              {camera.nvrId && (
                <>
                  <span className="mx-1.5 text-muted-foreground">·</span>
                  Stored on {camera.nvrName} · Channel {camera.channel}
                </>
              )}
            </p>

            {/* Recordings grid */}
            {!camera.nvrId ? (
              <div data-slot="camera-drawer-recordings-empty" className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-muted-foreground">
                <FileVideo className="size-9 opacity-30" />
                <p className="text-base font-medium">No NVR linked</p>
                <p className="max-w-xs text-center text-xs">
                  Link an NVR to start recording footage from this camera.
                </p>
                <Button variant="outline" size="sm" className="mt-2 gap-1.5" onClick={() => onLinkNvrRequest(camera.id)}>
                  <Link2 className="size-3.5" />
                  Link NVR
                </Button>
              </div>
            ) : filteredRecordings.length === 0 ? (
              <div data-slot="camera-drawer-recordings-empty" className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-muted-foreground">
                <FileVideo className="size-9 opacity-30" />
                <p className="text-base">No recordings match this filter.</p>
              </div>
            ) : (
              <>
                <div data-slot="camera-drawer-recordings-grid" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {filteredRecordings.map((r) => (
                    <RecordingCard
                      key={r.id}
                      recording={r}
                      variant="drawer"
                      selected={selectedRecordingIds.has(r.id)}
                      onToggle={() => setSelectedRecordingIds((curr) => {
                        const next = new Set(curr);
                        if (next.has(r.id)) next.delete(r.id);
                        else next.add(r.id);
                        return next;
                      })}
                      onOpen={() => navigate("/recordings", { state: { openRecordingId: r.id } })}
                    />
                  ))}
                </div>
              </>
            )}
          </DetailDrawerBody>
        )}

        {/* Floating selection bar inside drawer */}
        {camera && phase === "idle" && tab === "recordings" && selectedRecordingIds.size > 0 && (
          <div data-slot="camera-drawer-selection-bar" className="absolute inset-x-4 bottom-20 z-40 mx-auto flex max-w-[640px] flex-wrap items-center gap-3 rounded-xl border border-primary bg-card px-4 py-3 shadow-[0_16px_48px_hsl(var(--primary)/0.25)]">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary-fill text-primary-foreground">
                <Check className="size-3.5" strokeWidth={3} />
              </div>
              <span className="text-base font-semibold text-foreground">
                {selectedRecordingIds.size} recording{selectedRecordingIds.size > 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              <Button variant="ghost" className="gap-1.5 text-sm text-muted-foreground"
                onClick={() => setSelectedRecordingIds(new Set())}>
                <X className="size-3.5" />
                Clear selection
              </Button>
              <div className="mx-1 h-4 w-px bg-border" />
              <Button variant="outline" className="gap-1.5 border-severity-critical/40 text-severity-critical hover:bg-severity-critical/10"
                onClick={() => {
                  const count = selectedRecordingIds.size;
                  setSelectedRecordingIds(new Set());
                  toast.success(`${count} recording${count === 1 ? "" : "s"} deleted`);
                }}>
                <Trash2 className="size-3.5" />
                Delete {selectedRecordingIds.size}
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        {camera && phase === "idle" && (
          <DetailDrawerFooter data-slot="camera-drawer-footer" className="gap-2">
            <DetailDrawerFooterStart className="gap-2">
              <Button size="sm" className="gap-1.5" onClick={onEdit}>
                <Pencil className="size-3.5" />
                Edit Camera
              </Button>
              {camera.nvrId && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={onNvrSync}>
                  <RefreshCw className="size-3.5" />
                  NVR Sync
                </Button>
              )}
            </DetailDrawerFooterStart>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-severity-critical/40 text-severity-critical hover:bg-severity-critical/10"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
              Delete Camera
            </Button>
          </DetailDrawerFooter>
        )}
    </DetailDrawer>
  );
}

/* ── NVR Sync stages ─────────────────────────────────────────────────────── */

const CAMERA_SYNC_STAGES = [
  "Connecting to NVR…",
  "Verifying channel link…",
  "Reconciling recording index…",
  "Refreshing stream status…",
  "Finalising…",
];

/* ── Camera form modal (Add + Edit) ──────────────────────────────────────── */

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_DAYS = [1, 2, 3, 4, 5]; // Mon–Fri

type RecordingMode = "continuous" | "scheduled";

export interface CameraFormFields {
  id: string;
  name: string;
  siteId: string;
  areaId: string;
  ipAddress: string;
  /** Credentials the camera stream is authenticated with. */
  username: string;
  password: string;
  /** String-typed in the form so empty inputs render as placeholders; parsed on submit. */
  rtspPort: string;
  rtspUrl: string;          // full RTSP URL the user provides (or auto-built from IP:port)
  resolution: string;
  /** String-typed in the form so empty inputs render as placeholders; parsed on submit. */
  frameRate: string;
  /** String-typed in the form so empty inputs render as placeholders; parsed on submit. */
  retentionDays: string;
  nvrId: string;
  channel: number | null;
  /** "" while the user hasn't picked yet — surfaces a "Select mode" placeholder option. */
  recordingMode: RecordingMode | "";
  scheduleDays: number[];
  scheduleStart: string;
  scheduleEnd: string;
}

function nextCameraId(takenIds: string[]): string {
  let n = 1;
  while (takenIds.includes(`Cam-${String(n).padStart(2, "0")}`)) n++;
  return `Cam-${String(n).padStart(2, "0")}`;
}

function emptyForm(takenIds: string[]): CameraFormFields {
  return {
    id: nextCameraId(takenIds),
    name: "",
    siteId: "",
    areaId: "",
    ipAddress: "",
    username: "",
    password: "",
    rtspPort: "",
    resolution: "",
    frameRate: "",
    retentionDays: "",
    nvrId: "",
    channel: null,
    rtspUrl: "",
    recordingMode: "",
    scheduleDays: [],
    scheduleStart: "",
    scheduleEnd: "",
  };
}

function fromCamera(c: CameraData): CameraFormFields {
  // Recording mode: derive from schedule shape. Always-on = continuous; otherwise scheduled.
  const mode: RecordingMode =
    c.recording.schedule === "always" ||
    ((c.recording.scheduleDays ?? []).length === 7 && (c.recording.scheduleStart ?? "00:00") <= "00:00" && (c.recording.scheduleEnd ?? "23:59") >= "23:59")
      ? "continuous"
      : "scheduled";
  return {
    id: c.id,
    name: c.name,
    siteId: c.siteId,
    areaId: c.areaId,
    ipAddress: c.ipAddress,
    username: c.username,
    password: c.password,
    rtspPort: String(c.rtspPort),
    rtspUrl: c.rtspUrl,
    resolution: c.stream.resolution,
    frameRate: String(c.stream.frameRate),
    retentionDays: String(c.recording.retentionDays),
    nvrId: c.nvrId ?? "",
    channel: c.channel,
    recordingMode: mode,
    scheduleDays: c.recording.scheduleDays ?? [...DEFAULT_DAYS],
    scheduleStart: c.recording.scheduleStart ?? "00:00",
    scheduleEnd: c.recording.scheduleEnd ?? "23:59",
  };
}

const RESOLUTION_OPTIONS = [
  { value: "1280x720", label: "1280×720 (HD)" },
  { value: "1920x1080", label: "1920×1080 (Full HD)" },
  { value: "2560x1440", label: "2560×1440 (2K)" },
  { value: "3840x2160", label: "3840×2160 (4K)" },
];
const FRAME_RATE_OPTIONS = ["15", "20", "25", "30", "60"].map((v) => ({ value: v, label: `${v} fps` }));

export function CameraFormModal({
  open,
  mode,
  initial,
  takenIds,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "add" | "edit";
  initial: CameraFormFields | null;
  takenIds: string[];
  onClose: () => void;
  onSubmit: (fields: CameraFormFields) => void;
}) {
  const [fields, setFields] = React.useState<CameraFormFields>(() => emptyForm(takenIds));
  const [errors, setErrors] = React.useState<{ name?: string; ipAddress?: string; siteId?: string; areaId?: string; username?: string; password?: string }>({});
  const [linkNvr, setLinkNvr] = React.useState(false);

  // Load the form each time the modal opens (or the camera being edited changes).
  const [prevLoad, setPrevLoad] = React.useState<{ open: boolean; initial: CameraFormFields | null }>({ open: false, initial: null });
  if (prevLoad.open !== open || prevLoad.initial !== initial) {
    setPrevLoad({ open, initial });
    if (open) {
      const next = initial ?? emptyForm(takenIds);
      setFields(next);
      setErrors({});
      setLinkNvr(!!next.nvrId);
    }
  }

  function toggleLinkNvr(checked: boolean) {
    setLinkNvr(checked);
    if (!checked) setFields((curr) => ({ ...curr, nvrId: "", channel: null }));
  }

  function set<K extends keyof CameraFormFields>(key: K, value: CameraFormFields[K]) {
    setFields((curr) => ({ ...curr, [key]: value }));
    if (key in errors) setErrors((curr) => ({ ...curr, [key]: undefined }));
  }
  function toggleDay(day: number) {
    setFields((curr) => ({
      ...curr,
      scheduleDays: curr.scheduleDays.includes(day)
        ? curr.scheduleDays.filter((d) => d !== day)
        : [...curr.scheduleDays, day].sort((a, b) => a - b),
    }));
  }

  // NVRs available for the current site
  const siteNvrs = MOCK_NVRS.filter((n) => n.siteId === fields.siteId);
  const selectedNvr = MOCK_NVRS.find((n) => n.id === fields.nvrId);

  // Available channels for the selected NVR (free channels OR the channel this camera currently occupies)
  const availableChannels = React.useMemo(() => {
    if (!selectedNvr) return [] as number[];
    const ownChannel = mode === "edit" && initial?.nvrId === selectedNvr.id ? initial.channel : null;
    return selectedNvr.channels
      .filter((c) => (!c.cameraId && !c.nvrManaged) || c.channel === ownChannel)
      .map((c) => c.channel);
  }, [selectedNvr, mode, initial]);

  // When site changes, reset NVR if it's not at the new site.
  // (`undefined` initial value so this also runs on the first render, as the effect did.)
  const [prevSiteId, setPrevSiteId] = React.useState<string | undefined>(undefined);
  if (fields.siteId !== prevSiteId) {
    setPrevSiteId(fields.siteId);
    if (fields.nvrId && selectedNvr && selectedNvr.siteId !== fields.siteId) {
      setFields((curr) => ({ ...curr, nvrId: "", channel: null }));
    }
  }

  // When NVR changes, ensure channel is valid; default to first available
  const nvrKey = `${fields.nvrId}|${availableChannels.length}`;
  const [prevNvrKey, setPrevNvrKey] = React.useState<string | undefined>(undefined);
  if (nvrKey !== prevNvrKey) {
    setPrevNvrKey(nvrKey);
    if (!fields.nvrId || availableChannels.length === 0) {
      if (fields.channel != null) setFields((curr) => ({ ...curr, channel: null }));
    } else if (fields.channel == null || !availableChannels.includes(fields.channel)) {
      setFields((curr) => ({ ...curr, channel: availableChannels[0] }));
    }
  }

  /**
   * The schedule is only asked for once the camera has somewhere to record to.
   * See the card below: no NVR, no schedule.
   */
  const scheduleShown = linkNvr && !!fields.nvrId;

  /**
   * A schedule nobody was shown cannot hold up the form.
   *
   * This gates Submit, so leaving it unconditional would have left an unlinked
   * camera stuck behind "select at least one day" for a day-picker that is not
   * on screen — a disabled-feeling button with no visible reason, which is the
   * worst kind of validation.
   */
  const scheduleValid =
    !scheduleShown ||
    fields.recordingMode === "continuous" ||
    (fields.scheduleDays.length > 0 && fields.scheduleStart < fields.scheduleEnd);

  // In edit mode, keep Save disabled until the user actually changes something.
  const isDirty =
    mode === "add" || (initial != null && JSON.stringify(fields) !== JSON.stringify(initial));

  function handleSubmit() {
    const next: { name?: string; ipAddress?: string; siteId?: string; areaId?: string; username?: string; password?: string } = {};
    if (!fields.name.trim()) next.name = "Camera name is required.";
    if (!fields.ipAddress.trim()) next.ipAddress = "IP address is required.";
    if (!fields.username.trim()) next.username = "Username is required.";
    if (!fields.password) next.password = "Password is required.";
    if (!fields.siteId) next.siteId = "Select a site.";
    if (!fields.areaId) next.areaId = "Select an area.";
    setErrors(next);
    if (Object.keys(next).length === 0 && scheduleValid) onSubmit(fields);
  }

  /* An NVR can only be linked once a site is chosen — NVRs are site-scoped.
     Before that, saying "no NVR at this site" is just wrong: no site has been
     picked yet. Three distinct states, each with its own copy. */
  const noSiteYet = !fields.siteId;
  const nvrPlaceholder = noSiteYet ? "Select a site first" : siteNvrs.length === 0 ? "No NVR at this site" : "Select an NVR";
  const nvrHint = noSiteYet ? "Pick a site first." : siteNvrs.length === 0 ? "No NVRs at this site." : undefined;
  const camLabel = mode === "edit" && initial ? `${initial.id} · ${initial.name}` : fields.id;

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title={mode === "add" ? "Add Camera" : "Edit Camera"}
          description={mode === "add" ? "Register a new camera. Camera ID is generated automatically." : `Update fields for ${initial?.id}. Camera ID cannot be changed.`}
        />
        <ModalBody className="space-y-5">
          <p className={MODAL_NOTE}>
            {mode === "add" ? (
              <>This camera will get the ID <strong>{fields.id}</strong> automatically.</>
            ) : (
              <>Editing <strong>{camLabel}</strong>. The camera ID can&apos;t be changed.</>
            )}
          </p>

          <ModalFormSection title="Camera">
            <ModalField label="Camera Name" error={errors.name}>
              <ModalTextInput value={fields.name} onChange={(v) => set("name", v)} placeholder="e.g. Loading Bay 3 — Dock" invalid={!!errors.name} />
            </ModalField>
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
                <ModalTextInput value={fields.ipAddress} onChange={(v) => set("ipAddress", v)} placeholder="10.10.0.101" mono invalid={!!errors.ipAddress} />
              </ModalField>
              <ModalField label="RTSP Port">
                <ModalTextInput value={fields.rtspPort} onChange={(v) => set("rtspPort", v)} placeholder="554" type="number" mono />
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
            <ModalField label="RTSP URL (Optional)" hint="Leave blank to build it from the IP and port.">
              <ModalTextInput
                value={fields.rtspUrl}
                onChange={(v) => set("rtspUrl", v)}
                placeholder={`rtsp://${fields.ipAddress || "10.10.0.x"}:${fields.rtspPort || "554"}/Streaming/Channels/101`}
                mono
              />
            </ModalField>
          </ModalFormSection>

          <ModalFormSection title="Video">
            <ModalFieldPair>
              <ModalField label="Resolution">
                <ModalSelect value={fields.resolution} onChange={(v) => set("resolution", v)} placeholder="Select resolution" options={RESOLUTION_OPTIONS} />
              </ModalField>
              <ModalField label="Frame Rate">
                <ModalSelect value={fields.frameRate} onChange={(v) => set("frameRate", v)} placeholder="Select frame rate" options={FRAME_RATE_OPTIONS} />
              </ModalField>
            </ModalFieldPair>
          </ModalFormSection>

          {/* NVR link first, then retention and schedule — each revealed by the
              answer above it. A camera with no NVR has nowhere to record to, so
              the schedule only appears once an NVR is chosen. */}
          <ModalFormSection title="Recording">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
              <Checkbox checked={linkNvr} onCheckedChange={(v) => toggleLinkNvr(v === true)} />
              Link this camera to an NVR
            </label>
            {linkNvr && (
              <ModalFieldPair>
                <ModalField label="NVR" hint={nvrHint}>
                  <ModalSelect
                    value={fields.nvrId}
                    onChange={(v) => set("nvrId", v)}
                    placeholder={nvrPlaceholder}
                    options={siteNvrs.map((n) => ({ value: n.id, label: n.name }))}
                    disabled={noSiteYet || siteNvrs.length === 0}
                  />
                </ModalField>
                <ModalField
                  label="Channel"
                  hint={
                    selectedNvr
                      ? availableChannels.length === 0
                        ? "All channels in use."
                        : `${availableChannels.length} of ${selectedNvr.channelCount} free.`
                      : undefined
                  }
                >
                  <ModalSelect
                    value={fields.channel != null ? String(fields.channel) : ""}
                    onChange={(v) => set("channel", v ? Number(v) : null)}
                    placeholder={selectedNvr ? "Select a channel" : "Pick an NVR first"}
                    options={availableChannels.map((ch) => ({ value: String(ch), label: `Channel ${ch}` }))}
                    disabled={!fields.nvrId || availableChannels.length === 0}
                  />
                </ModalField>
              </ModalFieldPair>
            )}
            {scheduleShown && (
              <>
                <ModalFieldPair>
                  <ModalField label="Retention (Days)" hint={selectedNvr ? `NVR default: ${selectedNvr.retentionDays} days.` : undefined}>
                    <ModalTextInput
                      value={fields.retentionDays}
                      onChange={(v) => set("retentionDays", v)}
                      placeholder={String(selectedNvr?.retentionDays ?? 30)}
                      type="number"
                    />
                  </ModalField>
                  <ModalField label="Mode">
                    <ModalSelect
                      value={fields.recordingMode}
                      onChange={(v) => set("recordingMode", v as RecordingMode)}
                      placeholder="Select mode"
                      options={[
                        { value: "continuous", label: "Continuous · 24/7" },
                        { value: "scheduled", label: "Scheduled" },
                      ]}
                    />
                  </ModalField>
                </ModalFieldPair>
                {fields.recordingMode === "scheduled" && (
                  <>
                    <ModalField label="Days" error={fields.scheduleDays.length === 0 ? "Pick at least one day." : undefined}>
                      <OptionChips
                        multi
                        value={fields.scheduleDays}
                        options={DAY_LABELS.map((d, i) => ({ value: i, label: d }))}
                        onChange={toggleDay}
                      />
                    </ModalField>
                    <ModalFieldPair>
                      <ModalField
                        label="Start"
                        error={fields.scheduleStart >= fields.scheduleEnd ? "Must be before the end." : undefined}
                      >
                        <TimeSelect value={fields.scheduleStart} onChange={(v) => set("scheduleStart", v)} aria-label="Recording start time" />
                      </ModalField>
                      <ModalField label="End">
                        <TimeSelect value={fields.scheduleEnd} onChange={(v) => set("scheduleEnd", v)} aria-label="Recording end time" />
                      </ModalField>
                    </ModalFieldPair>
                  </>
                )}
              </>
            )}
          </ModalFormSection>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" disabled={mode === "edit" && !isDirty} onClick={handleSubmit}>
            {mode === "add" ? "Add Camera" : "Save Changes"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Confirm modal ───────────────────────────────────────────────────────── */

export function ConfirmModal({
  open,
  title,
  description,
  detail,
  confirmLabel,
  destructive,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  /** One-line header summary. */
  description: string;
  /** Longer consequence copy, shown in the body callout. */
  detail: React.ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="sm">
        <ModalHeader title={title} description={description} />
        <ModalBody>
          <p className="text-sm leading-relaxed text-muted-foreground">{detail}</p>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" variant={destructive ? "destructive" : "default"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Toast ───────────────────────────────────────────────────────────────── */


/* ─── Page ───────────────────────────────────────────────────────────────── */

/**
 * An extra table column a deployment can add without forking this page — TRMS
 * uses it for the base stations a camera has covered. Rendered before ACTION.
 */
export interface CameraExtraColumn {
  header: string;
  cell: (camera: CameraData) => React.ReactNode;
  /** Optional full-width entry at the end of the drawer's Device Info. */
  drawerLabel?: string;
  drawerCell?: (camera: CameraData) => React.ReactNode;
}

export default function CamerasPage({
  drawerAsync = "idle",
  forcedState = "normal",
  title = "Cameras",
  extraColumns = [],
}: {
  /** Prototype hook — forces the camera drawer's detail-fetch state. */
  drawerAsync?: DrawerAsync;
  /** Prototype hook — forces the page's empty dev-state. */
  forcedState?: "normal" | "empty";
  /** Page heading — a deployment may call these devices rather than cameras. */
  title?: string;
  /** Columns inserted before ACTION. Empty by default, so the table is unchanged. */
  extraColumns?: CameraExtraColumn[];
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isEmptyState = forcedState === "empty";
  const storeCameras = useCamerasStore((s) => s.cameras);
  const cameras = isEmptyState ? NO_CAMERAS : storeCameras;
  const addCamera = useCamerasStore((s) => s.addCamera);
  const updateCamera = useCamerasStore((s) => s.updateCamera);
  const deleteCameraFromStore = useCamerasStore((s) => s.deleteCamera);
  const [deployments, setDeployments] = React.useState<DeploymentData[]>(() => [...MOCK_DEPLOYMENTS]);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<CameraFilters>(EMPTY_FILTERS);
  const [kpiFilter, setKpiFilter] = React.useState<KpiFilter>("all");
  // A camera to open can arrive as router state (e.g. from the ⌘K palette).
  const incomingCameraId = (location.state as { openCameraId?: string } | null)?.openCameraId;
  const [drawerId, setDrawerId] = React.useState<string | null>(incomingCameraId ?? null);
  const [prevLocationState, setPrevLocationState] = React.useState(location.state);
  if (location.state !== prevLocationState) {
    setPrevLocationState(location.state);
    if (incomingCameraId) setDrawerId(incomingCameraId);
  }

  React.useEffect(() => {
    if (incomingCameraId) {
      // Clear the state so a back/forward doesn't re-trigger.
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [incomingCameraId, location.state, location.pathname, navigate]);
  const [page, setPage] = React.useState(1);
  const [modal, setModal] = React.useState<
    | { kind: "add" }
    | { kind: "edit"; cameraId: string }
    | { kind: "delete"; cameraId: string }
    | { kind: "undeploy"; deploymentId: string }
    | { kind: "nvr-sync"; cameraId: string }
    | null
    // ⌘K quick action "Add Camera" arrives as router state.
  >((location.state as { openAddCamera?: boolean } | null)?.openAddCamera ? { kind: "add" } : null);
  const syncTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageSize = 10;

  const filtered = React.useMemo(() => {
    return cameras.filter((c) => {
      if (kpiFilter === "unlinked" && c.nvrId) return false;
      if (kpiFilter !== "all" && kpiFilter !== "unlinked" && c.status !== kpiFilter) return false;
      if (filters.site.length > 0 && !filters.site.includes(c.siteId)) return false;
      if (filters.area.length > 0 && !filters.area.includes(c.areaId)) return false;
      if (filters.status.length > 0 && !filters.status.includes(c.status)) return false;
      if (filters.nvr.length > 0 && !filters.nvr.includes(c.nvrId ? "linked" : "unlinked")) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [c.id, c.name, c.ipAddress, c.nvrName ?? "", c.areaName, c.siteName].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [cameras, kpiFilter, filters, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const drawerCamera = drawerId ? cameras.find((c) => c.id === drawerId) ?? null : null;
  const [linkNvrCameraId, setLinkNvrCameraId] = React.useState<string | null>(null);
  const hasFilters = !!(search || Object.values(filters).some((a) => a.length > 0) || kpiFilter !== "all");

  function handleKpiClick(key: KpiFilter) {
    setKpiFilter((current) => (current === key ? "all" : key));
    setPage(1);
  }

  function buildCameraFromFields(fields: CameraFormFields, base?: CameraData): CameraData {
    const site = CAMERA_SITES.find((s) => s.value === fields.siteId);
    const area = CAMERA_AREAS.find((a) => a.value === fields.areaId);
    const nvr = fields.nvrId ? MOCK_NVRS.find((n) => n.id === fields.nvrId) : null;
    // Parse string-typed form numerics into actual numbers, with sensible defaults when empty.
    const rtspPort      = Number(fields.rtspPort)      || 554;
    const frameRate     = Number(fields.frameRate)     || 25;
    const retentionDays = Number(fields.retentionDays) || 30;
    const recordingMode = fields.recordingMode || "continuous";
    return {
      id: fields.id.trim(),
      name: fields.name.trim(),
      username: fields.username.trim(),
      password: fields.password,
      siteId: fields.siteId,
      siteName: site?.label ?? fields.siteId,
      areaId: fields.areaId,
      areaName: area?.label ?? fields.areaId,
      status: base?.status ?? "offline",
      ipAddress: fields.ipAddress.trim(),
      rtspPort,
      rtspUrl: fields.rtspUrl.trim() || `rtsp://${fields.ipAddress.trim()}:${rtspPort}/Streaming/Channels/101`,
      stream: {
        codec: base?.stream.codec ?? "h264",
        resolution: fields.resolution || "1920x1080",
        frameRate,
      },
      recording: {
        retentionDays,
        bitrateKbps: base?.recording.bitrateKbps ?? 4096,
        schedule: recordingMode === "continuous" ? "always" : "custom",
        scheduleDays: recordingMode === "continuous" ? [0, 1, 2, 3, 4, 5, 6] : fields.scheduleDays,
        scheduleStart: recordingMode === "continuous" ? "00:00" : (fields.scheduleStart || "08:00"),
        scheduleEnd:   recordingMode === "continuous" ? "23:59" : (fields.scheduleEnd   || "18:00"),
      },
      nvrId: fields.nvrId || null,
      nvrName: nvr?.name ?? null,
      channel: fields.nvrId ? fields.channel : null,
      boundaryZones: base?.boundaryZones ?? [],
      recentEventCount: base?.recentEventCount ?? 0,
      lastSeenAt: base?.lastSeenAt ?? new Date().toISOString(),
      lastSeenDisplay: base?.lastSeenDisplay ?? "Just now",
      activeAt: base?.activeAt ?? new Date().toISOString(),
      activeAtDisplay: base?.activeAtDisplay ?? new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    };
  }

  function handleAdd(fields: CameraFormFields) {
    const newCam = buildCameraFromFields(fields);
    addCamera(newCam);
    setModal(null);
    toast.success(`${newCam.name} added`);
  }
  function handleEdit(fields: CameraFormFields) {
    const updated = buildCameraFromFields(fields, cameras.find((c) => c.id === fields.id));
    updateCamera(fields.id, updated);
    setModal(null);
    toast.success("Camera updated");
  }
  function handleDelete(cameraId: string) {
    const target = cameras.find((c) => c.id === cameraId);
    deleteCameraFromStore(cameraId);
    setDeployments((curr) => curr.filter((d) => d.cameraId !== cameraId));
    setModal(null);
    setDrawerId(null);
    toast.success(`${target?.name ?? "Camera"} deleted`);
  }
  function handleUndeploy(deploymentId: string) {
    setDeployments((curr) => curr.filter((d) => d.id !== deploymentId));
    setModal(null);
    toast.success("Model undeployed from camera");
  }
  function handleNvrSync() {
    if (!drawerCamera) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    setModal({ kind: "nvr-sync", cameraId: drawerCamera.id });
    // Simulated sync — commit a success toast once the animated progress finishes.
    syncTimerRef.current = setTimeout(() => {
      setModal(null);
      syncTimerRef.current = null;
      toast.success(`${drawerCamera.name} synced with ${drawerCamera.nvrName ?? "NVR"}`);
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

  const editingCamera = modal?.kind === "edit" ? cameras.find((c) => c.id === modal.cameraId) : null;
  // Stable while the edited camera is unchanged — CameraFormModal reloads its
  // fields whenever `initial` changes identity, so building it inline would
  // wipe what the user typed on every re-render of this page.
  const editingInitial = React.useMemo(() => (editingCamera ? fromCamera(editingCamera) : null), [editingCamera]);
  const deletingCamera = modal?.kind === "delete" ? cameras.find((c) => c.id === modal.cameraId) : null;
  const syncingCamera = modal?.kind === "nvr-sync" ? cameras.find((c) => c.id === modal.cameraId) : null;
  const undeployingDep = modal?.kind === "undeploy" ? deployments.find((d) => d.id === modal.deploymentId) : null;

  // Sync the global MOCK_DEPLOYMENTS so the deployments shown in the drawer reflect local state
  React.useEffect(() => {
    MOCK_DEPLOYMENTS.length = 0;
    MOCK_DEPLOYMENTS.push(...deployments);
  }, [deployments]);

  const cameraColumns: DataTableColumn<CameraData>[] = [
    {
      key: "id",
      header: "ID",
      cell: (c) => (
        <span className="font-mono text-sm font-semibold text-muted-foreground transition-colors group-hover:text-primary-ink">
          {c.id}
        </span>
      ),
    },
    {
      key: "name",
      header: "NAME",
      cell: (c) => (
        <span className="font-semibold text-foreground transition-colors group-hover:text-primary-ink">
          {c.name}
        </span>
      ),
    },
    { key: "status", header: "STATUS", cell: (c) => <StatusPill status={c.status} /> },
    {
      key: "ip",
      header: "IP",
      className: "font-mono text-sm text-muted-foreground",
      headClassName: "",
      cell: (c) => c.ipAddress,
    },
    {
      key: "location",
      header: "LOCATION",
      className: "text-muted-foreground",
      headClassName: "",
      cell: (c) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-foreground">{c.areaName}</span>
          <span className="text-xs">{c.siteName}</span>
        </div>
      ),
    },
    {
      key: "nvr",
      header: "NVR · CH",
      className: "text-muted-foreground",
      headClassName: "",
      cell: (c) =>
        c.nvrId && c.channel ? (
          <Button variant="outline" size="xs"
            onClick={(e) => { e.stopPropagation(); navigate(`/site/nvr?nvr=${c.nvrId}`); }}
            className="h-auto gap-1.5 rounded-md border border-info/20 bg-info/5 px-2 py-1 text-xs font-normal text-info hover:bg-info/15 hover:text-info dark:border-info/20 dark:bg-info/5 dark:hover:bg-info/15"
          >
            <HardDrive className="size-3" />
            <span className="font-mono">{c.nvrId}</span>
            <span className="text-muted-foreground">· Ch {c.channel}</span>
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md border border-warning/20 bg-warning/5 px-2 py-1 text-xs text-warning">
            <AlertTriangle className="size-3" />
            Unlinked
          </span>
        ),
    },
    {
      key: "events",
      header: "EVENTS 24H",
      className: "font-semibold text-foreground",
      headClassName: "",
      cell: (c) => c.recentEventCount,
    },
    {
      key: "active",
      header: "ACTIVE",
      className: "text-muted-foreground",
      headClassName: "",
      cell: (c) => (
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3" />
          {c.lastSeenDisplay}
        </div>
      ),
    },
    ...extraColumns.map((col): DataTableColumn<CameraData> => ({
      key: `extra-${col.header}`,
      header: col.header,
      stopRowClick: true,
      cell: (c) => col.cell(c),
    })),
    {
      key: "action",
      header: "ACTION",
      stopRowClick: true,
      cell: (c) => (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${c.name}`} className="size-7 rounded border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground dark:hover:bg-muted">
              <MoreHorizontal className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="end">
            <ItemButton variant="plain"
              onClick={() => setDrawerId(c.id)}
              className="gap-2 rounded px-2 py-1.5 text-sm text-foreground hover:bg-muted"
            >
              <Video className="size-3.5 text-muted-foreground" />
              View details
            </ItemButton>
            <ItemButton variant="plain"
              onClick={() => setModal({ kind: "edit", cameraId: c.id })}
              className="gap-2 rounded px-2 py-1.5 text-sm text-foreground hover:bg-muted"
            >
              <Pencil className="size-3.5 text-muted-foreground" />
              Edit camera
            </ItemButton>
            <ItemButton variant="plain"
              onClick={() => setModal({ kind: "edit", cameraId: c.id })}
              className="gap-2 rounded px-2 py-1.5 text-sm text-foreground hover:bg-muted"
            >
              <Settings className="size-3.5 text-muted-foreground" />
              Edit Config
            </ItemButton>
            {c.nvrId && (
              <ItemButton variant="plain"
                onClick={() => navigate(`/site/nvr?nvr=${c.nvrId}`)}
                className="gap-2 rounded px-2 py-1.5 text-sm text-foreground hover:bg-muted"
              >
                <HardDrive className="size-3.5 text-muted-foreground" />
                Open NVR
              </ItemButton>
            )}
            <div className="my-1 border-t border-border" />
            <ItemButton variant="plain"
              onClick={() => setModal({ kind: "delete", cameraId: c.id })}
              className="gap-2 rounded px-2 py-1.5 text-sm text-severity-critical hover:bg-severity-critical/10"
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
    <div data-slot="cameras-page" className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>{title}</PageHeader.Title>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button size="sm" className="gap-1.5" onClick={() => setModal({ kind: "add" })}>
            <Plus className="size-4" />
            Add Camera
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* KPI cards */}
      <KpiGrid cols={5}>
        {KPI_CONFIGS.map((cfg) => (
          <KpiCard
            key={cfg.key}
            label={cfg.label}
            value={cfg.getValue(cameras)}
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
      <p data-slot="cameras-page-results" className="text-base text-muted-foreground">
        <strong className="text-foreground">{filtered.length}</strong>{" "}
        {filtered.length === 1 ? "camera" : "cameras"} match current filters
        {hasFilters && (
          <Button variant="link"
            onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); setKpiFilter("all"); }}
            className="ml-2 h-auto border-0 p-0 text-base font-normal text-muted-foreground underline hover:text-primary-ink"
          >
            Clear all
          </Button>
        )}
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div data-slot="cameras-page-empty" className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <Video className="size-10 opacity-20" />
          {cameras.length === 0 ? (
            <>
              <p className="text-sm font-medium text-foreground">No cameras yet</p>
              <p className="text-sm">Add a camera to start streaming RTSP feeds and linking NVRs.</p>
              <Button size="sm" className="gap-1.5" onClick={() => setModal({ kind: "add" })}>
                <Plus className="size-4" />
                Add Camera
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm">No cameras match the current filters.</p>
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
        <div data-slot="cameras-page-table" className="overflow-hidden rounded-xl border border-border bg-card">
          <DataTable
            variant="list"
            columns={cameraColumns}
            data={pageItems}
            getRowId={(c) => c.id}
            onRowClick={(c) => setDrawerId(c.id)}
            getRowClassName={() => "transition-colors"}
          />

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p data-slot="cameras-page-pagination" className="text-sm text-muted-foreground">
              {filtered.length === 0
                ? "0 of 0"
                : `${(page - 1) * pageSize + 1} – ${Math.min(page * pageSize, filtered.length)} of ${filtered.length}`}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="size-7 rounded border border-border bg-transparent text-muted-foreground hover:border-primary/30 hover:bg-transparent hover:text-foreground disabled:opacity-40 dark:border-border dark:bg-transparent dark:hover:bg-transparent"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <span className="px-2 text-sm text-foreground">
                {page} <span className="text-muted-foreground">of {pageCount}</span>
              </span>
              <Button variant="outline" size="icon-sm"
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
      <CameraDrawer
        camera={drawerCamera}
        deployments={deployments.filter((deployment) => deployment.cameraId === drawerCamera?.id)}
        open={drawerId !== null}
        asyncState={drawerAsync}
        onClose={() => setDrawerId(null)}
        onOpenNvr={(nvrId) => {
          setDrawerId(null);
          navigate(`/site/nvr?nvr=${nvrId}`);
        }}
        onEdit={() => drawerCamera && setModal({ kind: "edit", cameraId: drawerCamera.id })}
        onDelete={() => drawerCamera && setModal({ kind: "delete", cameraId: drawerCamera.id })}
        onNvrSync={handleNvrSync}
        onLinkNvrRequest={(cameraId) => setLinkNvrCameraId(cameraId)}
        extraFields={extraColumns}
        onUnlinkNvr={(cameraId) => {
          const target = cameras.find((c) => c.id === cameraId);
          if (!target) return;
          updateCamera(cameraId, { nvrId: null, nvrName: null, channel: null });
          toast.success(`Unlinked ${target.id} from ${target.nvrName ?? "NVR"}`);
        }}
      />

      {/* Link NVR */}
      <LinkNvrModal
        open={linkNvrCameraId !== null}
        camera={linkNvrCameraId ? cameras.find((c) => c.id === linkNvrCameraId) ?? null : null}
        onClose={() => setLinkNvrCameraId(null)}
        onLink={(cameraId, nvrId, nvrName, channel) => {
          updateCamera(cameraId, { nvrId, nvrName, channel });
          toast.success(`Linked to ${nvrName} · Ch ${channel}`);
        }}
      />

      {/* Modals */}
      <CameraFormModal
        open={modal?.kind === "add"}
        mode="add"
        initial={null}
        takenIds={cameras.map((c) => c.id)}
        onClose={() => setModal(null)}
        onSubmit={handleAdd}
      />
      <CameraFormModal
        open={modal?.kind === "edit"}
        mode="edit"
        initial={editingInitial}
        takenIds={cameras.map((c) => c.id)}
        onClose={() => setModal(null)}
        onSubmit={handleEdit}
      />
      <ConfirmModal
        open={modal?.kind === "delete"}
        title="Delete Camera"
        description="This action cannot be undone."
        destructive
        confirmLabel="Delete Camera"
        onClose={() => setModal(null)}
        onConfirm={() => deletingCamera && handleDelete(deletingCamera.id)}
        detail={
          <>
            Are you sure you want to delete <strong className="text-foreground">{deletingCamera?.name}</strong> ({deletingCamera?.id})? Deployed
            models are detached; recordings on its NVR stay until retention expires.
          </>
        }
      />
      {modal?.kind === "nvr-sync" && (
        <SyncProgressModal
          title="Syncing with NVR…"
          deviceLabel={syncingCamera?.name ?? "Camera"}
          stages={CAMERA_SYNC_STAGES}
          onCancel={handleSyncCancel}
        />
      )}
      <ConfirmModal
        open={modal?.kind === "undeploy"}
        title="Undeploy Model"
        description="Detection stops on this camera until the model is redeployed."
        confirmLabel="Undeploy"
        onClose={() => setModal(null)}
        onConfirm={() => undeployingDep && handleUndeploy(undeployingDep.id)}
        detail={
          <>
            Are you sure you want to undeploy <strong className="text-foreground">{undeployingDep?.modelName}</strong> from{" "}
            <strong className="text-foreground">{undeployingDep?.cameraName}</strong>? It stops producing detection events.
          </>
        }
      />

    </div>
  );
}
