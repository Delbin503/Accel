import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Film,
  Play,
  Pause,
  Clock,
  MapPin,
  Video,
  HardDrive,
  CircleDot,
  Maximize2,
  SkipBack,
  SkipForward,
  Trash2,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageHeader } from "@/components/layout/PageHeader";
import { DateRangeBar } from "@/components/shared/DateRangeBar";
import { TruncatedText } from "@/components/shared/TruncatedText";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cn } from "@/lib/utils";
import { MOCK_RECORDINGS, type RecordingDisplay } from "@/mocks/recordings";
import { MOCK_CAMERAS, CAMERA_SITES, CAMERA_AREAS } from "@/mocks/cameras";
import { MOCK_NVRS } from "@/mocks/nvr";
import { MOCK_EVENTS } from "@/mocks/detectionFeed";
import { RecordingCard, RecordingModeChip } from "@/components/shared/RecordingCard";
import type { DetectionEvent } from "@/types/detection";

/* ── KPI strip ───────────────────────────────────────────────────────────── */

import { KpiCard, KpiGrid, type KpiAccent } from "@/components/shared/KpiCard";

type KpiFilter = "all" | "today" | "continuous";

const KPI_CONFIGS: {
  key: KpiFilter; label: string; sub: string; accent: KpiAccent;
  getValue: (items: RecordingDisplay[]) => number;
}[] = [
  { key: "all",         label: "Total Recordings", sub: "Across all cameras",  accent: "primary", getValue: (items) => items.length },
  { key: "today",       label: "Today",            sub: "Recorded today",      accent: "success", getValue: (items) => items.filter((r) => r.dateLabel === "Today").length },
  { key: "continuous",  label: "Continuous",       sub: "24/7 recording mode", accent: "info",    getValue: (items) => items.filter((r) => r.mode === "continuous").length },
];

/* ── Multi-select dropdown ───────────────────────────────────────────────── */

interface FilterOption { value: string; label: string }

function FilterDropdown({ label, options, selected, onChange }: { label: string; options: readonly FilterOption[]; selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = React.useState(false);
  const hasValue = selected.length > 0;
  const displayLabel = hasValue
    ? selected.length === 1 ? (options.find((o) => o.value === selected[0])?.label ?? label) : `${selected.length} selected`
    : label;
  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn("flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-base transition-colors hover:border-primary", open ? "border-primary" : "border-border", hasValue ? "text-primary" : "text-muted-foreground")}>
          <TruncatedText text={displayLabel} className="font-medium" />
          <ChevronDown className={cn("size-3.5 flex-shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-[260px] w-56 overflow-y-auto p-1.5">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <button key={opt.value} onClick={() => toggle(opt.value)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-base text-muted-foreground hover:bg-muted hover:text-foreground">
              <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors", checked ? "border-primary bg-primary" : "border-muted-foreground/40")}>
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

interface RecordingFilters { site: string[]; area: string[]; camera: string[]; mode: string[] }
const EMPTY_FILTERS: RecordingFilters = { site: [], area: [], camera: [], mode: [] };

const MODE_OPTS: FilterOption[] = [
  { value: "continuous", label: "Continuous" },
  { value: "event",      label: "Event" },
  { value: "scheduled",  label: "Scheduled" },
];

function FilterPanel({
  filters,
  onChange,
  search,
  onSearchChange,
  additionalActiveCount = 0,
}: {
  filters: RecordingFilters;
  onChange: (f: RecordingFilters) => void;
  search: string;
  onSearchChange: (v: string) => void;
  additionalActiveCount?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const filterCount = Object.values(filters).reduce((s, arr) => s + arr.length, 0);
  const activeCount = filterCount + (search ? 1 : 0) + additionalActiveCount;
  function setGroup(group: keyof RecordingFilters, values: string[]) { onChange({ ...filters, [group]: values }); }
  const CAMERA_OPTS = MOCK_CAMERAS.map((c) => ({ value: c.id, label: `${c.id} · ${c.name}` }));

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-base font-semibold text-foreground">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary px-2 py-px text-xs font-semibold text-primary-foreground">{activeCount} active</span>
          ) : (
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {["All sites", "All areas", "All cameras", "All modes"].map((l) => (
                <span key={l} className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{l}</span>
              ))}
            </div>
          )}
        </button>
        <div className="flex items-center gap-3">
          <button type="button" aria-label={open ? "Collapse filters" : "Expand filters"} onClick={() => setOpen((v) => !v)}>
            {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search by recording ID, camera, or area…" className="h-9 w-full pl-9 text-base" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { key: "site"   as const, label: "Site",   opts: CAMERA_SITES },
              { key: "area"   as const, label: "Area",   opts: CAMERA_AREAS },
              { key: "camera" as const, label: "Camera", opts: CAMERA_OPTS },
              { key: "mode"   as const, label: "Mode",   opts: MODE_OPTS },
            ].map(({ key, label, opts }) => (
              <div key={key}>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
                <FilterDropdown label={`All ${label.toLowerCase()}s`} options={opts} selected={filters[key]} onChange={(v) => setGroup(key, v)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Derived detected periods ────────────────────────────────────────────── */

interface DetectedPeriod {
  event: DetectionEvent;
  offsetSec: number;
  durationSec: number;
}

function periodsForRecording(rec: RecordingDisplay): DetectedPeriod[] {
  const start = new Date(rec.startsAt).getTime();
  const end = new Date(rec.endsAt).getTime();
  const real = MOCK_EVENTS
    .filter((e) => {
      if (e.camera !== rec.cameraId) return false;
      const t = new Date(`${e.date}T${e.time}`).getTime();
      return t >= start && t <= end;
    })
    .map((e) => {
      const eventTs = new Date(`${e.date}T${e.time}`).getTime();
      const offsetSec = Math.max(0, Math.round((eventTs - start) / 1000));
      return { event: e, offsetSec, durationSec: 8 + (e.severity === "critical" ? 4 : 0) };
    });
  if (real.length > 0) return real;

  // No mock events fell inside this recording window — emit synthetic samples
  // so the drawer always demonstrates the linked-incidents UX.
  const seed = rec.id.split("").reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const sampleCount = (seed % 3) + 1;
  const durationSec = Math.max(60, Math.round((end - start) / 1000));
  const samples: DetectedPeriod[] = [];
  for (let i = 0; i < sampleCount; i++) {
    const src = MOCK_EVENTS[(seed + i * 3) % MOCK_EVENTS.length];
    if (!src) continue;
    const offsetSec = Math.round(((i + 1) / (sampleCount + 1)) * durationSec);
    const eventMs = start + offsetSec * 1000;
    const d = new Date(eventMs);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    const ss = String(d.getUTCSeconds()).padStart(2, "0");
    samples.push({
      event: {
        ...src,
        id: `${src.id}::${rec.id}::${i}`,
        camera: rec.cameraId,
        siteDisplay: rec.siteName,
        areaDisplay: rec.areaName,
        date: rec.startsAt.slice(0, 10),
        time: `${hh}:${mm}:${ss}`,
      },
      offsetSec,
      durationSec: 8 + (src.severity === "critical" ? 4 : 0),
    });
  }
  return samples;
}

function fmtClock(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ── Faux player ─────────────────────────────────────────────────────────── */

function FauxPlayer({ rec, periods, currentSec, onSeek, isPlaying, onPlayToggle }: {
  rec: RecordingDisplay; periods: DetectedPeriod[];
  currentSec: number; onSeek: (sec: number) => void;
  isPlaying: boolean; onPlayToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 50% 60%, rgba(180,140,80,0.18) 0%, rgba(60,40,20,0.1) 40%, rgba(0,0,0,0.95) 100%)" }} />
        <button onClick={onPlayToggle} className="absolute inset-0 flex items-center justify-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-transform hover:scale-105">
            {isPlaying ? <Pause className="size-6 text-white" /> : <Play className="size-6 text-white" />}
          </div>
        </button>
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-0.5 text-2xs font-bold uppercase tracking-widest text-white backdrop-blur-sm">
          <span className={cn("size-1.5 rounded-full", isPlaying ? "animate-pulse bg-sev-critical" : "bg-muted-foreground")} />
          {isPlaying ? "Playing" : "Paused"}
        </div>
        <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-0.5 font-mono text-2xs text-white/80 backdrop-blur-sm">
          {rec.cameraName} · {rec.areaName}
        </div>
        <div className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-0.5 font-mono text-2xs text-white/80 backdrop-blur-sm">
          {fmtClock(currentSec)} / {rec.durationDisplay}
        </div>
      </div>

      <div className="border-t border-border bg-background/40 p-3">
        <div className="mb-1.5 flex items-center justify-between text-2xs text-muted-foreground">
          <span className="font-mono">{rec.startsAtDisplay}</span>
          <span className="inline-flex items-center gap-1.5">
            <CircleDot className="size-3 text-success" />
            <strong className="text-foreground">{periods.length}</strong> detected period{periods.length === 1 ? "" : "s"}
          </span>
          <span className="font-mono">{rec.endsAtDisplay}</span>
        </div>
        <div className="relative h-3 w-full">
          <div className="absolute inset-0 rounded-full bg-muted" />
          <div className="absolute inset-y-0 left-0 rounded-full bg-primary/40" style={{ width: `${(currentSec / rec.durationSeconds) * 100}%` }} />
          {periods.map((p) => (
            <button key={p.event.id} onClick={() => onSeek(p.offsetSec)} title={`${p.event.typeLabel} at ${p.event.time}`}
              className="absolute top-0 bottom-0 rounded-sm bg-sev-critical/80 transition-all hover:bg-sev-critical hover:scale-y-[1.6]"
              style={{ left: `${(p.offsetSec / rec.durationSeconds) * 100}%`, width: `max(3px, ${(p.durationSec / rec.durationSeconds) * 100}%)` }} />
          ))}
          <input type="range" min={0} max={rec.durationSeconds} step={1} value={currentSec}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
          <div className="pointer-events-none absolute -top-1 size-5 -translate-x-1/2 rounded-full border-2 border-primary bg-card shadow-md"
            style={{ left: `${(currentSec / rec.durationSeconds) * 100}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-center gap-2.5">
          <Button variant="outline" className="gap-1.5" onClick={() => onSeek(Math.max(0, currentSec - 30))}>
            <SkipBack className="size-3.5" />
            -30s
          </Button>
          <Button className="gap-1.5" onClick={onPlayToggle}>
            {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => onSeek(Math.min(rec.durationSeconds, currentSec + 30))}>
            +30s
            <SkipForward className="size-3.5" />
          </Button>
          <Button variant="outline" className="ml-2 gap-1.5">
            <Maximize2 className="size-3.5" />
            Fullscreen
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Recording Drawer ────────────────────────────────────────────────────── */

function RecordingDrawer({ recording, open, onClose, onDeleteRecording }: {
  recording: RecordingDisplay | null; open: boolean; onClose: () => void;
  onDeleteRecording: (id: string) => void;
}) {
  const [currentSec, setCurrentSec] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    if (open) { setCurrentSec(0); setIsPlaying(false); }
  }, [open, recording?.id]);

  React.useEffect(() => {
    if (!isPlaying || !recording) return;
    const id = setInterval(() => {
      setCurrentSec((s) => {
        if (s >= recording.durationSeconds) { setIsPlaying(false); return recording.durationSeconds; }
        return s + 30;
      });
    }, 500);
    return () => clearInterval(id);
  }, [isPlaying, recording]);

  if (!recording) return null;
  const periods = periodsForRecording(recording);
  const camera = MOCK_CAMERAS.find((c) => c.id === recording.cameraId);
  const nvr = MOCK_NVRS.find((n) => n.id === recording.nvrId);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" showCloseButton={false} className="flex w-[min(860px,58vw)] max-w-[95vw] flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border bg-card px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <RecordingModeChip mode={recording.mode} />
              </div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <SheetTitle className="min-w-0 text-lg font-bold">
                  <TruncatedText text={`Recording · ${recording.dateLabel}`} />
                </SheetTitle>
                <span className="rounded border border-border bg-muted px-1.5 py-px font-mono text-2xs text-muted-foreground">{recording.id}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Video className="size-3" />
                {recording.cameraName} ({recording.cameraId})
                <span className="text-muted-foreground/40">·</span>
                <MapPin className="size-3" />
                {recording.areaName} · {recording.siteName}
                <span className="text-muted-foreground/40">·</span>
                <Clock className="size-3" />
                {recording.startsAtDisplay} – {recording.endsAtDisplay}
                <span className="text-muted-foreground/40">·</span>
                <span className="font-mono">{recording.durationDisplay}</span>
              </div>
            </div>
            <button onClick={onClose} className="mt-0.5 flex size-7 flex-shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <FauxPlayer rec={recording} periods={periods} currentSec={currentSec} onSeek={(s) => setCurrentSec(s)} isPlaying={isPlaying} onPlayToggle={() => setIsPlaying((v) => !v)} />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recording Info</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-border bg-card p-4">
              {([
                ["Recording ID", <span className="font-mono text-xs text-primary">{recording.id}</span>],
                ["Mode",         <RecordingModeChip mode={recording.mode} />],
                ["Camera",       <span className="font-mono text-xs">{recording.cameraId}</span>],
                ["Camera Name",  recording.cameraName],
                ["Site",         recording.siteName],
                ["Area",         recording.areaName],
                ["NVR",          <span className="inline-flex items-center gap-1.5"><HardDrive className="size-3 text-info" /><span className="font-mono">{nvr?.id ?? "—"}</span></span>],
                ["Resolution",   <span className="font-mono text-xs">{camera?.stream.resolution ?? "—"}</span>],
                ["Duration",     <span className="font-mono text-xs">{recording.durationDisplay}</span>],
                ["File Size",    <span className="font-mono text-xs">{recording.fileSizeDisplay}</span>],
                ["Starts At",    <span className="font-mono text-xs">{recording.startsAtDisplay}</span>],
                ["Ends At",      <span className="font-mono text-xs">{recording.endsAtDisplay}</span>],
              ] as [string, React.ReactNode][]).map(([label, value]) => (
                <div key={label as string} className="flex flex-col gap-0.5">
                  <span className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
                  <span className="text-base font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-card px-5 py-3.5">
          <Button variant="outline" className="gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10"
            onClick={() => onDeleteRecording(recording.id)}>
            <Trash2 className="size-3.5" />
            Delete Recording
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

type SortKey = "newest" | "oldest" | "duration-desc";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest",        label: "Newest First" },
  { key: "oldest",        label: "Oldest First" },
  { key: "duration-desc", label: "Longest Duration" },
];

type DatePreset = "all" | "today" | "yesterday" | "week" | "month" | "custom";
const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: "all",       label: "All time" },
  { key: "today",     label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week",      label: "This Week" },
  { key: "month",     label: "This Month" },
];

const NOW_REF = new Date("2026-05-25T10:15:00").getTime();

export default function RecordingsPage({
  forcedState = "normal",
}: {
  forcedState?: "normal" | "empty";
} = {}) {
  const isEmptyState = forcedState === "empty";
  const navigate = useNavigate();
  const location = useLocation();
  React.useEffect(() => {
    const incoming = (location.state as { openRecordingId?: string } | null)?.openRecordingId;
    if (incoming) {
      setDrawerId(incoming);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, location.pathname]);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<RecordingFilters>(EMPTY_FILTERS);
  const [kpiFilter, setKpiFilter] = React.useState<KpiFilter>("all");
  const [datePreset, setDatePreset] = React.useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [sortOpen, setSortOpen] = React.useState(false);
  const [recordings, setRecordings] = React.useState<RecordingDisplay[]>(() =>
    isEmptyState ? [] : [...MOCK_RECORDINGS]
  );
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [drawerId, setDrawerId] = React.useState<string | null>(null);
  /*
   * Delete confirmation. `open` is tracked separately from the staged target so
   * the target (and its copy) survives the dialog's exit animation — clearing
   * it on confirm would flash "Delete 0 recordings?" on the way out. `label` is
   * snapshotted at request time for the same reason: the recording is gone from
   * state by the time the dialog finishes closing.
   */
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{ ids: string[]; label: string | null }>({ ids: [], label: null });
  const [page, setPage] = React.useState(1);
  const pageSize = 12;

  const filtered = React.useMemo(() => {
    let list = recordings.filter((r) => {
      if (kpiFilter === "today" && r.dateLabel !== "Today") return false;
      if (kpiFilter === "continuous" && r.mode !== "continuous") return false;
      if (filters.site.length > 0) {
        const cam = MOCK_CAMERAS.find((c) => c.id === r.cameraId);
        if (!cam || !filters.site.includes(cam.siteId)) return false;
      }
      if (filters.area.length > 0) {
        const cam = MOCK_CAMERAS.find((c) => c.id === r.cameraId);
        if (!cam || !filters.area.includes(cam.areaId)) return false;
      }
      if (filters.camera.length > 0 && !filters.camera.includes(r.cameraId)) return false;
      if (filters.mode.length > 0 && !filters.mode.includes(r.mode)) return false;
      if (datePreset !== "all") {
        const ts = new Date(r.startsAt).getTime();
        if (datePreset === "today" && ts < NOW_REF - 24 * 60 * 60 * 1000) return false;
        if (datePreset === "yesterday") {
          const d = NOW_REF - 24 * 60 * 60 * 1000;
          if (ts < d - 24 * 60 * 60 * 1000 || ts > d) return false;
        }
        if (datePreset === "week"  && ts < NOW_REF - 7  * 24 * 60 * 60 * 1000) return false;
        if (datePreset === "month" && ts < NOW_REF - 30 * 24 * 60 * 60 * 1000) return false;
        if (datePreset === "custom") {
          if (dateFrom && ts < new Date(dateFrom + "T00:00:00").getTime()) return false;
          if (dateTo   && ts > new Date(dateTo   + "T23:59:59").getTime()) return false;
        }
      }
      if (search) {
        const q = search.toLowerCase();
        const hay = [r.id, r.cameraName, r.cameraId, r.areaName, r.siteName, r.dateLabel].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "oldest")        return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      if (sort === "duration-desc") return b.durationSeconds - a.durationSeconds;
      return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
    });
    return list;
  }, [recordings, kpiFilter, filters, search, sort, datePreset, dateFrom, dateTo]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const drawerRecording = drawerId ? recordings.find((r) => r.id === drawerId) ?? null : null;
  const deleteCount = deleteTarget.ids.length;
  const hasFilters = !!(search || Object.values(filters).some((a) => a.length > 0) || kpiFilter !== "all" || datePreset !== "all");

  /*
   * Deleting is irreversible, so both paths — the drawer's single "Delete
   * Recording" and the selection bar's bulk delete — stage their ids here and
   * let the confirm step commit them. One funnel keeps the copy and the
   * guard identical for either entry point.
   */
  function requestDelete(ids: string[]) {
    if (ids.length === 0) return;
    const only = ids.length === 1 ? recordings.find((r) => r.id === ids[0]) : undefined;
    setDeleteTarget({
      ids,
      label: ids.length === 1 ? `${only?.id ?? ids[0]}${only ? ` from ${only.cameraName}` : ""}` : null,
    });
    setDeleteOpen(true);
  }
  function confirmDelete() {
    const { ids } = deleteTarget;
    if (ids.length === 0) return;
    setRecordings((curr) => curr.filter((r) => !ids.includes(r.id)));
    setSelectedIds((curr) => {
      const next = new Set(curr);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    if (drawerId && ids.includes(drawerId)) setDrawerId(null);
    setDeleteOpen(false);
    toast.success(
      ids.length === 1 ? `Recording ${ids[0]} deleted` : `${ids.length} recordings deleted`
    );
  }
  function toggleRecording(id: string) {
    setSelectedIds((curr) => {
      const next = new Set(curr);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }


  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Recordings</PageHeader.Title>
          <PageHeader.Description>
            Browse all camera recordings — filter by site, camera or date, and replay the footage.
          </PageHeader.Description>
        </PageHeader.Content>
      </PageHeader>

      <KpiGrid cols={3}>
        {KPI_CONFIGS.map((cfg) => (
          <KpiCard key={cfg.key}
            label={cfg.label}
            value={cfg.getValue(recordings)}
            sub={cfg.sub}
            accent={cfg.accent}
            active={cfg.key !== "all" && kpiFilter === cfg.key}
            onClick={() => { setKpiFilter((c) => (c === cfg.key ? "all" : cfg.key)); setPage(1); }} />
        ))}
      </KpiGrid>

      <DateRangeBar
        presets={DATE_PRESETS}
        active={datePreset}
        onSelect={(k) => { setDatePreset(k as DatePreset); if (k !== "custom") { setDateFrom(""); setDateTo(""); } setPage(1); }}
        customFrom={dateFrom}
        customTo={dateTo}
        onCustomChange={(f, t) => { setDateFrom(f); setDateTo(t); }}
        onCustomApply={(f, t) => { setDateFrom(f); setDateTo(t); setPage(1); }}
        onCustomReset={() => { setDatePreset("all"); setDateFrom(""); setDateTo(""); setPage(1); }}
      />

      <FilterPanel
        filters={filters}
        onChange={(f) => { setFilters(f); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        additionalActiveCount={(kpiFilter !== "all" ? 1 : 0) + (datePreset !== "all" ? 1 : 0)}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base text-muted-foreground">
          <strong className="text-foreground">{filtered.length}</strong>{" "}
          recording{filtered.length === 1 ? "" : "s"} match current filters
          {hasFilters && (
            <button onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); setKpiFilter("all"); setDatePreset("all"); setDateFrom(""); setDateTo(""); }}
              className="ml-2 text-muted-foreground underline hover:text-primary">
              Clear all
            </button>
          )}
        </p>
        <div className="flex items-center gap-2">
          <Popover open={sortOpen} onOpenChange={setSortOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-1.5">
                {SORT_OPTIONS.find((o) => o.key === sort)?.label}
                <ChevronDown className="size-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-1">
              {SORT_OPTIONS.map((o) => (
                <button key={o.key} onClick={() => { setSort(o.key); setSortOpen(false); }}
                  className={cn("flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted", sort === o.key ? "text-primary" : "text-foreground")}>
                  {o.label}
                  {sort === o.key && <Check className="size-3.5" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <Film className="size-10 opacity-20" />
          {recordings.length === 0 ? (
            <>
              <p className="text-sm font-medium text-foreground">No recordings found</p>
              <p className="text-sm">Recordings appear here once cameras with attached NVRs capture footage.</p>
            </>
          ) : (
            <p className="text-sm">No recordings match the current filters.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((r) => {
            const isSelected = selectedIds.has(r.id);
            return (
              <RecordingCard
                key={r.id}
                recording={r}
                variant="page"
                selected={isSelected}
                onToggle={() => toggleRecording(r.id)}
                onOpen={() => setDrawerId(r.id)}
              />
            );
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {`${(page - 1) * pageSize + 1} – ${Math.min(page * pageSize, filtered.length)} of ${filtered.length}`}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40">
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="px-2 text-sm text-foreground">
              {page} <span className="text-muted-foreground/60">of {pageCount}</span>
            </span>
            <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount}
              className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40">
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      <RecordingDrawer recording={drawerRecording} open={drawerId !== null} onClose={() => setDrawerId(null)}
        onDeleteRecording={(id) => requestDelete([id])} />


      {/* Floating selection bar — mirrors Detection Feed */}
      {selectedIds.size > 0 && (
        <div className="fixed inset-x-6 bottom-6 z-50 mx-auto flex max-w-4xl flex-wrap items-center gap-3 rounded-xl border border-primary bg-card px-4 py-3 shadow-[0_16px_48px_hsl(var(--primary)/0.25)]">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Check className="size-3.5" strokeWidth={3} />
            </div>
            <span className="text-base font-semibold text-foreground">
              {selectedIds.size} recording{selectedIds.size > 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <Button variant="ghost" className="gap-1.5 text-sm text-muted-foreground"
              onClick={() => setSelectedIds(new Set())}>
              <X className="size-3.5" />
              Clear selection
            </Button>
            <div className="mx-1 h-4 w-px bg-border" />
            <Button variant="outline" className="gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10"
              onClick={() => requestDelete([...selectedIds])}>
              <Trash2 className="size-3.5" />
              Delete {selectedIds.size}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={deleteCount === 1 ? "Delete this recording?" : `Delete ${deleteCount} recordings?`}
        description={
          deleteTarget.label
            ? `${deleteTarget.label} will be removed, along with its footage. This can't be undone.`
            : `${deleteCount} recordings will be removed, along with their footage. This can't be undone.`
        }
        confirmLabel={deleteCount === 1 ? "Delete recording" : `Delete ${deleteCount} recordings`}
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
