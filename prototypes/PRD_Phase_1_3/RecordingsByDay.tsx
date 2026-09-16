import * as React from "react";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Film,
  HardDrive,
  MapPin,
  Play,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageHeader } from "@/components/layout/PageHeader";
import { DateRangeBar } from "@/components/shared/DateRangeBar";
import { TruncatedText } from "@/components/shared/TruncatedText";
import { KpiCard, KpiGrid } from "@/components/shared/KpiCard";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/shared/Modal";
import { cn } from "@/lib/utils";
import { RECORDING_TYPES, TONE_CLASSES, type RecordingTypeId } from "./recordingTypes";
import {
  ALL_RECORDINGS,
  DAYS,
  buildCameraDays,
  fmtSize,
  type CameraDay,
  type DayRecording,
} from "./dayRecordings";
import { EMPTY_FILTERS, type RecordingFilters } from "./recordingFilters";
import { FilterPanel } from "./recordingsChrome";
import { RecordingPlayerModal } from "./RecordingPlayerModal";

/* Recordings, reshaped for Phase 1.3.

   A card is no longer one file — a camera produces one recording per enabled
   type per day, so a card is a camera-day and its chip counts what is inside.
   Opening it leads with the recording info and lists the day's recordings;
   picking one opens the player in a pop-up. */

/* ── Chips ───────────────────────────────────────────────────────────────── */

function CountChip({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-primary">
      {count} Recording{count === 1 ? "" : "s"}
    </span>
  );
}

function TypeChip({ type }: { type: RecordingTypeId }) {
  const def = RECORDING_TYPES.find((t) => t.id === type) ?? RECORDING_TYPES[0];
  return (
    <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider", TONE_CLASSES[def.tone].chip)}>
      {def.label}
    </span>
  );
}

/** The dots on a card, one per type the day produced. */
function TypeDots({ types }: { types: RecordingTypeId[] }) {
  return (
    <span className="inline-flex items-center gap-1">
      {types.map((t) => {
        const def = RECORDING_TYPES.find((x) => x.id === t) ?? RECORDING_TYPES[0];
        return <span key={t} title={def.label} className={cn("size-1.5 rounded-full", TONE_CLASSES[def.tone].dot)} />;
      })}
    </span>
  );
}

/* ── Camera-day card ─────────────────────────────────────────────────────── */

function CameraDayCard({ day, selected, onToggle, onOpen }: {
  day: CameraDay;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <div className={cn(
      "group relative flex flex-col items-stretch overflow-hidden rounded-xl border bg-card text-left transition-all hover:-translate-y-px hover:shadow-md",
      selected ? "border-primary" : "border-border hover:border-primary/40"
    )}>
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        aria-label={`Select ${day.cameraName} · ${day.dateLabel}`}
        className={cn(
          "absolute left-2.5 top-2.5 z-20 flex size-5 items-center justify-center rounded border-2 transition-colors",
          selected ? "border-primary bg-primary opacity-100" : "border-white/60 bg-black/40 opacity-0 hover:border-white group-hover:opacity-100"
        )}
      >
        {selected && <Check className="size-3 text-primary-foreground" strokeWidth={3} />}
      </button>

      <button onClick={onOpen} className="flex flex-col items-stretch text-left">
        <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(120% 80% at 50% 60%, rgba(180,140,80,0.18) 0%, rgba(60,40,20,0.1) 40%, rgba(0,0,0,0.95) 100%)" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-transform group-hover:scale-110">
              <Play className="size-4 text-white" />
            </div>
          </div>
          <div className="absolute right-2.5 top-2.5 rounded bg-black/60 px-1.5 py-0.5 font-mono text-2xs text-white/90 backdrop-blur-sm">
            {day.totalDurationDisplay}
          </div>
          {/* The chip counts the day's recordings — a camera no longer has one mode. */}
          <div className={cn("absolute top-2.5 transition-all", selected ? "left-9" : "left-2.5 group-hover:left-9")}>
            <CountChip count={day.recordings.length} />
          </div>
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 text-2xs text-white/90">
            <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono backdrop-blur-sm">{day.firstStartDisplay}</span>
            <span className="rounded bg-black/60 px-1.5 py-0.5 backdrop-blur-sm">{day.totalSizeDisplay}</span>
          </div>
        </div>

        <div className="p-3.5">
          <div className="mb-1 flex items-start justify-between gap-2">
            <TruncatedText text={day.cameraName} className="text-base font-bold text-foreground transition-colors group-hover:text-primary" />
            <p className="flex-shrink-0 font-mono text-2xs text-muted-foreground">{day.cameraId}</p>
          </div>
          <p className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-2.5" />
            {day.areaName} · {day.siteName}
          </p>
          <div className="flex items-center justify-between border-t border-border/60 pt-2">
            <TypeDots types={day.recordings.map((r) => r.type)} />
            <span className="font-mono text-2xs text-muted-foreground">{day.dateLabel}</span>
          </div>
        </div>
      </button>
    </div>
  );
}

/* ── Drawer ──────────────────────────────────────────────────────────────── */

function InfoGrid({ day }: { day: CameraDay }) {
  const rows: [string, React.ReactNode][] = [
    ["Camera", <span className="font-mono text-xs">{day.cameraId}</span>],
    ["Camera Name", day.cameraName],
    ["Site", day.siteName],
    ["Area", day.areaName],
    ["NVR", <span className="inline-flex items-center gap-1.5"><HardDrive className="size-3 text-info" /><span className="font-mono">{day.nvrId ?? "—"}</span></span>],
    ["Resolution", <span className="font-mono text-xs">{day.resolution}</span>],
    ["Day", day.dateLabel],
    ["Recordings", <span className="font-mono text-xs">{day.recordings.length} of {RECORDING_TYPES.length} types</span>],
    ["Total Duration", <span className="font-mono text-xs">{day.totalDurationDisplay}</span>],
    ["Total Size", <span className="font-mono text-xs">{day.totalSizeDisplay}</span>],
    ["First Starts At", <span className="font-mono text-xs">{day.firstStartDisplay}</span>],
    ["Clips", <span className="font-mono text-xs">{day.clipCount}</span>],
  ];

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-border bg-card p-4">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-col gap-0.5">
          <span className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
          <span className="text-base font-medium text-foreground">{value}</span>
        </div>
      ))}
    </div>
  );
}

function RecordingRow({ rec, onPlay }: { rec: DayRecording; onPlay: () => void }) {
  return (
    <button
      onClick={onPlay}
      className="group/row flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/40"
    >
      {/* Thumbnail doubles as the play affordance. */}
      <span className="relative h-11 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-neutral-900">
        <span className="absolute inset-0"
          style={{ background: "radial-gradient(120% 80% at 50% 60%, rgba(180,140,80,0.18) 0%, rgba(60,40,20,0.1) 40%, rgba(0,0,0,0.95) 100%)" }} />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-6 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm transition-transform group-hover/row:scale-110">
            <Play className="size-3 text-white" />
          </span>
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="mb-1 flex flex-wrap items-center gap-1.5">
          <TypeChip type={rec.type} />
          <span className="rounded border border-border bg-muted px-1.5 py-px font-mono text-2xs text-muted-foreground">{rec.id}</span>
        </span>
        <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-2.5" />
          <span className="font-mono">{rec.startsAtDisplay} – {rec.endsAtDisplay}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className="font-mono">{rec.durationDisplay}</span>
          {rec.clipCount > 1 && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="font-mono">{rec.clipCount} clips</span>
            </>
          )}
        </span>
      </span>

      <span className="shrink-0 text-right">
        <span className="block font-mono text-xs text-foreground">{rec.fileSizeDisplay}</span>
        <span className="mt-0.5 inline-flex items-center gap-1 text-2xs font-semibold text-primary opacity-0 transition-opacity group-hover/row:opacity-100">
          Play
          <Play className="size-2.5" />
        </span>
      </span>
    </button>
  );
}

function CameraDayDrawer({ day, open, onClose, onDelete, onPlay }: {
  day: CameraDay | null;
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
  onPlay: (rec: DayRecording) => void;
}) {
  if (!day) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" showCloseButton={false} className="flex w-[min(860px,58vw)] max-w-[95vw] flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border bg-card px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <CountChip count={day.recordings.length} />
              </div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <SheetTitle className="min-w-0 text-lg font-bold">
                  <TruncatedText text={`Recording · ${day.dateLabel}`} />
                </SheetTitle>
                <span className="rounded border border-border bg-muted px-1.5 py-px font-mono text-2xs text-muted-foreground">{day.cameraId}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Video className="size-3" />
                {day.cameraName} ({day.cameraId})
                <span className="text-muted-foreground/40">·</span>
                <MapPin className="size-3" />
                {day.areaName} · {day.siteName}
                <span className="text-muted-foreground/40">·</span>
                <Clock className="size-3" />
                <span className="font-mono">{day.totalDurationDisplay}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="font-mono">{day.totalSizeDisplay}</span>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close"
              className="mt-0.5 flex size-7 flex-shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Info leads — there is no single video to open on. */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recording Info</p>
            <InfoGrid day={day} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recordings</p>
              <p className="text-2xs text-muted-foreground">
                {day.recordings.length} type{day.recordings.length === 1 ? "" : "s"} captured · {day.dateLabel}
              </p>
            </div>
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {day.recordings.map((rec) => (
                <RecordingRow key={rec.id} rec={rec} onPlay={() => onPlay(rec)} />
              ))}
            </div>
            <p className="mt-2 text-2xs text-muted-foreground">
              Types that are switched off in System Configuration › Recording Schedule produce nothing, so they do not appear here.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-card px-5 py-3.5">
          <Button variant="outline" className="gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10" onClick={onDelete}>
            <Trash2 className="size-3.5" />
            Delete Recordings
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Delete confirmation ─────────────────────────────────────────────────── */

function DeleteDaysModal({ open, days, onClose, onConfirm }: {
  open: boolean;
  days: { key: string; label: string; count: number }[];
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (days.length === 0) return null;
  const fileCount = days.reduce((s, d) => s + d.count, 0);
  const isBulk = days.length > 1;

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title={isBulk ? `Delete Recordings (${fileCount})` : "Delete Recordings"}
          description="This action cannot be undone."
          tone="destructive"
        />
        <ModalBody>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="mt-0.5 size-4 flex-shrink-0 text-destructive" />
              <div className="min-w-0">
                <p className="text-base font-semibold text-foreground">You are about to remove:</p>
                {isBulk ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {fileCount} recordings across {days.length} camera-days will be deleted immediately.
                  </p>
                ) : (
                  <p className="mt-1 text-base text-muted-foreground">
                    {days[0].label} — <span className="font-mono text-sm">{days[0].count} recording{days[0].count === 1 ? "" : "s"}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            A camera-day holds one recording per enabled type — deleting it removes all of them.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" variant="destructive" className="gap-1.5" onClick={onConfirm}>
            <Trash2 className="size-3.5" />
            Delete {fileCount} Recording{fileCount === 1 ? "" : "s"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

type SortKey = "newest" | "oldest" | "most" | "largest";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest First" },
  { key: "oldest", label: "Oldest First" },
  { key: "most", label: "Most Recordings" },
  { key: "largest", label: "Largest Size" },
];

const DAY_PRESETS = [{ key: "all", label: "All days" }, ...DAYS.map((d) => ({ key: d, label: d }))];

export function RecordingsByDay() {
  const [source, setSource] = React.useState<DayRecording[]>(ALL_RECORDINGS);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<RecordingFilters>(EMPTY_FILTERS);
  const [dayPreset, setDayPreset] = React.useState<string>("all");
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [sortOpen, setSortOpen] = React.useState(false);
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set());
  const [drawerKey, setDrawerKey] = React.useState<string | null>(null);
  const [playing, setPlaying] = React.useState<DayRecording | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{ keys: string[]; days: { key: string; label: string; count: number }[] }>({ keys: [], days: [] });
  const [page, setPage] = React.useState(1);
  const pageSize = 12;

  const allDays = React.useMemo(() => buildCameraDays(source), [source]);

  const filtered = React.useMemo(() => {
    const list = allDays.filter((d) => {
      if (dayPreset !== "all" && d.dateLabel !== dayPreset) return false;
      if (filters.site.length > 0 && !filters.site.includes(d.siteId)) return false;
      if (filters.area.length > 0 && !filters.area.includes(d.areaId)) return false;
      if (filters.camera.length > 0 && !filters.camera.includes(d.cameraId)) return false;
      if (filters.type.length > 0 && !d.recordings.some((r) => filters.type.includes(r.type))) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [d.cameraId, d.cameraName, d.areaName, d.siteName, d.dateLabel, ...d.recordings.map((r) => r.id)]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sort === "oldest") return b.dayIndex - a.dayIndex || a.cameraId.localeCompare(b.cameraId);
      if (sort === "most") return b.recordings.length - a.recordings.length;
      if (sort === "largest") return b.totalMb - a.totalMb;
      return a.dayIndex - b.dayIndex || a.cameraId.localeCompare(b.cameraId);
    });
  }, [allDays, dayPreset, filters, search, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const drawerDay = drawerKey ? allDays.find((d) => d.key === drawerKey) ?? null : null;
  const hasFilters = !!(search || Object.values(filters).some((a) => a.length > 0) || dayPreset !== "all");

  const totalFiles = filtered.reduce((s, d) => s + d.recordings.length, 0);
  const totalMb = filtered.reduce((s, d) => s + d.totalMb, 0);
  const todayDays = allDays.filter((d) => d.dateLabel === "Today").length;

  function requestDelete(keys: string[]) {
    if (keys.length === 0) return;
    const days = keys
      .map((k) => allDays.find((d) => d.key === k))
      .filter((d): d is CameraDay => !!d)
      .map((d) => ({ key: d.key, label: `${d.cameraName} · ${d.dateLabel}`, count: d.recordings.length }));
    setDeleteTarget({ keys, days });
    setDeleteOpen(true);
  }

  function confirmDelete() {
    const { keys } = deleteTarget;
    if (keys.length === 0) return;
    const removed = allDays.filter((d) => keys.includes(d.key));
    const ids = new Set(removed.flatMap((d) => d.recordings.map((r) => r.id)));
    setSource((curr) => curr.filter((r) => !ids.has(r.id)));
    setSelectedKeys((curr) => {
      const next = new Set(curr);
      keys.forEach((k) => next.delete(k));
      return next;
    });
    if (drawerKey && keys.includes(drawerKey)) setDrawerKey(null);
    setDeleteOpen(false);
    toast.success(
      keys.length === 1
        ? `${ids.size} recording${ids.size === 1 ? "" : "s"} deleted`
        : `${ids.size} recordings across ${keys.length} camera-days deleted`
    );
  }

  function toggleDay(key: string) {
    setSelectedKeys((curr) => {
      const next = new Set(curr);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Recordings</PageHeader.Title>
          <PageHeader.Description>
            Browse all camera recordings — filter by site, camera or day, and replay the footage.
            Each card is one camera's day, and its chip counts the recordings inside it.
          </PageHeader.Description>
        </PageHeader.Content>
      </PageHeader>

      <KpiGrid cols={3}>
        <KpiCard label="Total Recordings" value={String(totalFiles)} sub="Across the shown camera-days" accent="primary" icon={Film} />
        <KpiCard
          label="Today"
          value={String(todayDays)}
          sub="Camera-days recorded today"
          accent="success"
          icon={Video}
          active={dayPreset === "Today"}
          onClick={() => { setDayPreset((c) => (c === "Today" ? "all" : "Today")); setPage(1); }}
        />
        <KpiCard label="Storage" value={fmtSize(totalMb)} sub="Across the shown camera-days" accent="info" icon={HardDrive} />
      </KpiGrid>

      <DateRangeBar
        label="Day"
        presets={DAY_PRESETS}
        active={dayPreset}
        onSelect={(k) => { setDayPreset(k); setPage(1); }}
        showCustom={false}
      />

      <FilterPanel
        filters={filters}
        onChange={(f) => { setFilters(f); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        additionalActiveCount={dayPreset !== "all" ? 1 : 0}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base text-muted-foreground">
          <strong className="text-foreground">{filtered.length}</strong> camera-day{filtered.length === 1 ? "" : "s"}
          {" · "}
          <strong className="text-foreground">{totalFiles}</strong> recording{totalFiles === 1 ? "" : "s"} match current filters
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); setDayPreset("all"); setPage(1); }}
              className="ml-2 text-muted-foreground underline hover:text-primary"
            >
              Clear all
            </button>
          )}
        </p>
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
                className={cn("flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                  sort === o.key ? "text-primary" : "text-foreground")}>
                {o.label}
                {sort === o.key && <Check className="size-3.5" />}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <Film className="size-10 opacity-20" />
          {allDays.length === 0 ? (
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
          {pageItems.map((d) => (
            <CameraDayCard
              key={d.key}
              day={d}
              selected={selectedKeys.has(d.key)}
              onToggle={() => toggleDay(d.key)}
              onOpen={() => setDrawerKey(d.key)}
            />
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {`${(safePage - 1) * pageSize + 1} – ${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length}`}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage === 1} aria-label="Previous page"
              className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40">
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="px-2 text-sm text-foreground">
              {safePage} <span className="text-muted-foreground/60">of {pageCount}</span>
            </span>
            <button onClick={() => setPage(Math.min(pageCount, safePage + 1))} disabled={safePage === pageCount} aria-label="Next page"
              className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40">
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      <CameraDayDrawer
        day={drawerDay}
        open={drawerKey !== null}
        onClose={() => setDrawerKey(null)}
        onDelete={() => drawerDay && requestDelete([drawerDay.key])}
        onPlay={(rec) => setPlaying(rec)}
      />

      <RecordingPlayerModal recording={playing} open={playing !== null} onClose={() => setPlaying(null)} />

      {selectedKeys.size > 0 && (
        <div className="fixed inset-x-6 bottom-6 z-[var(--z-sticky)] mx-auto flex max-w-4xl flex-wrap items-center gap-3 rounded-xl border border-primary bg-card px-4 py-3 shadow-[0_16px_48px_hsl(var(--primary)/0.25)]">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Check className="size-3.5" strokeWidth={3} />
            </div>
            <span className="text-base font-semibold text-foreground">
              {selectedKeys.size} camera-day{selectedKeys.size > 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <Button variant="ghost" className="gap-1.5 text-sm text-muted-foreground" onClick={() => setSelectedKeys(new Set())}>
              <X className="size-3.5" />
              Clear selection
            </Button>
            <div className="mx-1 h-4 w-px bg-border" />
            <Button variant="outline" className="gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10"
              onClick={() => requestDelete([...selectedKeys])}>
              <Trash2 className="size-3.5" />
              Delete {selectedKeys.size}
            </Button>
          </div>
        </div>
      )}

      <DeleteDaysModal
        open={deleteOpen}
        days={deleteTarget.days}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
