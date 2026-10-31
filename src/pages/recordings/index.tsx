import * as React from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Film,
  HardDrive,
  MapPin,
  Lock,
  MoreHorizontal,
  Play,
  Package,
  Sparkles,
  Star,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/layout/PageHeader";
import { DateRangeBar } from "@/components/shared/DateRangeBar";
import { TruncatedText } from "@/components/shared/TruncatedText";
import { KpiCard, KpiGrid } from "@/components/shared/KpiCard";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/shared/Modal";
import { cn } from "@/lib/utils";
import { formatDate, formatTimeOfDay } from "@/lib/formatters";
import { findSiteById } from "@/mocks/sites";
import { TONE_CLASSES, typeById, type RecordingTypeId } from "@/lib/recordingTypes";
import { ALL_RECORDINGS, DAYS, cameraDayFiles, fmtSize, type DayRecording } from "@/mocks/dayRecordings";
import { EMPTY_FILTERS, type RecordingFilters } from "./recordingFilters";
import { FilterPanel } from "./RecordingsFilterPanel";
import { RecordingPlayerModal } from "./RecordingPlayerModal";
import { FloatingBar } from "@/components/shared/FloatingBar";
import { MOCK_NVRS } from "@/mocks/nvr";
import { MOCK_RECORDINGS } from "@/mocks/recordings";
import { useDownloadsStore } from "@/stores/useDownloadsStore";

/* Recordings — the camera-day list introduced in Phase 1.3, now the app's page
   (the Phase 1.3 prototype renders this same component).

   A row is a camera's day, and there are only two kinds: continuous where the
   site runs round the clock, operation where it keeps hours. Standby is not a
   row — it is the other half of an operation day, so it opens inside that
   recording along with the motion clips caught while it ran. No thumbnails
   anywhere: the build has none, so a slot would only ever be a placeholder.
   Every video plays in a pop-up. */

/* ── Chips ───────────────────────────────────────────────────────────────── */

/** The recording's type, as a pill like User Management's status pill. */
function TypeChip({ type }: { type: RecordingTypeId }) {
  const def = typeById(type);
  const tone = TONE_CLASSES[def.tone];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider", tone.chip)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", tone.dot)} />
      {def.label}
    </span>
  );
}

function BookmarkButton({ bookmarked, onToggle, label, className }: {
  bookmarked: boolean; onToggle: () => void; label: string; className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={bookmarked}
      aria-label={bookmarked ? `Remove bookmark from ${label}` : `Bookmark ${label}`}
      title={bookmarked ? "Bookmarked — cannot be deleted" : "Bookmark to keep this out of any delete"}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={cn(
        "inline-flex size-6 items-center justify-center rounded transition-colors",
        bookmarked ? "text-warning" : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      <Star className={cn("size-4", bookmarked && "fill-warning")} />
    </button>
  );
}

/* ── Storage card ────────────────────────────────────────────────────────────
   Total capacity of the NVRs that record the sites in view (every NVR when no
   site is filtered), over one bar split into used and left. Hovering either
   part of the bar gives its size. */

const fmtGb = (gb: number) => (gb >= 1000 ? `${(gb / 1000).toFixed(2)} TB` : `${gb.toFixed(0)} GB`);

function StorageCard({ siteIds, shownMb }: { siteIds: string[]; shownMb: number }) {
  const nvrs = MOCK_NVRS.filter((n) => siteIds.length === 0 || siteIds.includes(n.siteId));
  const total = nvrs.reduce((t, n) => t + n.totalStorageGb, 0);
  const used = nvrs.reduce((t, n) => t + n.usedStorageGb, 0);
  const left = Math.max(0, total - used);
  const pct = total ? Math.round((used / total) * 100) : 0;
  const full = pct >= 90;
  const parts = [
    { key: "used", label: "Used", gb: used, share: pct, fill: full ? "bg-sev-critical" : "bg-info", round: "rounded-l-full" },
    { key: "left", label: "Left", gb: left, share: 100 - pct, fill: "bg-success", round: "rounded-r-full" },
  ];

  return (
    <div className="relative flex h-[120px] flex-col overflow-hidden rounded-xl border border-border bg-card p-4">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-purple" />
      <span className="mb-1.5 truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">Storage Total</span>
      <div className="truncate text-2xl font-bold text-purple">{fmtGb(total)}</div>
      {/* Each part is a taller hover target than the 4px bar it draws. */}
      <div className="mt-auto flex gap-px">
        {parts.map((part) => (
          <Tooltip key={part.key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`${part.label}: ${fmtGb(part.gb)}, ${part.share}%`}
                className="group/part flex h-3 min-w-0 items-center"
                style={{ width: `${part.share}%` }}
              >
                <span className={cn("h-1 w-full transition-all group-hover/part:h-1.5", part.round, part.fill)} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <span className="flex items-center gap-1.5">
                <span className={cn("size-1.5 rounded-full", part.fill)} />
                <span className="font-semibold">{fmtGb(part.gb)} {part.label.toLowerCase()}</span>
                <span className="text-muted-foreground">· {part.share}% of {fmtGb(total)}</span>
              </span>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <TruncatedText text={`${fmtGb(used)} used · ${fmtGb(left)} left`} title={`${fmtGb(used)} used · ${fmtGb(left)} left · recordings shown take ${fmtSize(shownMb)}`} className="pt-0.5 text-xs leading-tight text-muted-foreground" />
    </div>
  );
}

/* ── Recordings list ─────────────────────────────────────────────────────── */

/** A recording's calendar date and its window, e.g. "25 May 2026" and "18:00 – 06:00". */
function recDate(rec: DayRecording): { date: string; time: string } {
  // DAYS runs newest first and ends on a dated label, so the others count back from it.
  const last = DAYS.length - 1;
  const date = new Date(DAYS[last]);
  date.setDate(date.getDate() + (last - rec.dayIndex));
  return {
    date: formatDate(date, { day: "numeric", month: "short", year: "numeric" }),
    time: `${rec.startsAt} – ${rec.endsAt}`,
  };
}

/* Built like the User Management table — same header, dividers, ID column,
   pills and "⋯" action menu — so the two lists read alike. */
const HEAD = "whitespace-nowrap px-4 py-2.5 font-mono text-2xs font-normal uppercase tracking-[0.15em] text-muted-foreground/60";
const CELL = "px-4 py-3";
const MENU_ITEM = "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted";

function RecordingTable({ items, selectedIds, bookmarkedIds, onToggle, onToggleAll, onToggleBookmark, onOpen, onDelete }: {
  items: DayRecording[];
  selectedIds: Set<string>;
  bookmarkedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (select: boolean) => void;
  onToggleBookmark: (id: string) => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const selectedHere = items.filter((r) => selectedIds.has(r.id)).length;
  const all = selectedHere === items.length;
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr className="border-b border-border text-left">
              <th className={cn(HEAD, "w-10")}>
                <Checkbox
                  checked={all ? true : selectedHere > 0 ? "indeterminate" : false}
                  onCheckedChange={() => onToggleAll(!all)}
                  aria-label="Select every recording on this page"
                />
              </th>
              {["REC ID", "Recording", "Type", "Date", "Duration / Size", "Action"].map((h) => (
                <th key={h} className={HEAD}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((rec) => {
              const selected = selectedIds.has(rec.id);
              const bookmarked = bookmarkedIds.has(rec.id);
              const label = `${rec.id} · ${rec.cameraName}`;
              const { date, time } = recDate(rec);
              return (
                <tr
                  key={rec.id}
                  tabIndex={0}
                  onClick={() => onOpen(rec.id)}
                  onKeyDown={(e) => e.key === "Enter" && onOpen(rec.id)}
                  className={cn("group cursor-pointer text-base transition-colors hover:bg-muted/20", selected && "bg-primary/5")}
                >
                  <td className={CELL} onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected} onCheckedChange={() => onToggle(rec.id)} aria-label={`Select ${label}`} />
                  </td>
                  <td className={CELL}>
                    <span className="whitespace-nowrap font-mono text-sm font-semibold text-muted-foreground transition-colors group-hover:text-primary">
                      {rec.id}
                    </span>
                  </td>
                  {/* About a third of the row: wide enough to read, never the whole gap,
                      and it truncates rather than push the table past the page. */}
                  <td className={cn(CELL, "w-[34%] max-w-0")}>
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                        <Video className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <TruncatedText text={rec.cameraName} className="font-semibold text-foreground transition-colors group-hover:text-primary" />
                          {/* A bookmark keeps a recording out of any delete. */}
                          {bookmarked && <Star className="size-3 shrink-0 fill-warning text-warning" aria-label="Bookmarked" />}
                        </div>
                        <TruncatedText text={`${rec.cameraId} · ${rec.areaName} · ${rec.siteName}`} className="text-xs text-muted-foreground" />
                      </div>
                    </div>
                  </td>
                  <td className={CELL}>
                    <div className="flex flex-col items-start gap-1">
                      <TypeChip type={rec.type} />
                      {/* Plain text, so the type pill stays the one thing that reads as a type. */}
                      {rec.standby && (
                        <span className="whitespace-nowrap pl-1 text-xs text-muted-foreground">
                          + standby
                          {rec.standby.clipCount > 0 && `, ${rec.standby.clipCount} motion clip${rec.standby.clipCount === 1 ? "" : "s"}`}
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Date over time, each with its icon as the other modules' tables show them. */}
                  <td className={cn(CELL, "whitespace-nowrap")}>
                    <p className="flex items-center gap-1.5 text-sm text-foreground">
                      <Calendar className="size-3 shrink-0 text-muted-foreground" />
                      {date}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3 shrink-0" />
                      {time}
                    </p>
                  </td>
                  <td className={cn(CELL, "whitespace-nowrap")}>
                    <p className="text-foreground">{rec.durationDisplay}</p>
                    <p className="text-xs text-muted-foreground">{rec.fileSizeDisplay}</p>
                  </td>
                  <td className={CELL} onClick={(e) => e.stopPropagation()}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button aria-label={`Actions for ${label}`} className="flex size-7 items-center justify-center rounded border border-transparent text-muted-foreground/50 transition-colors hover:border-border hover:bg-muted hover:text-foreground">
                          <MoreHorizontal className="size-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-44 p-1" align="end">
                        <button onClick={() => onOpen(rec.id)} className={cn(MENU_ITEM, "text-foreground")}>
                          <Play className="size-3.5 text-muted-foreground" />
                          View recording
                        </button>
                        <button onClick={() => onToggleBookmark(rec.id)} className={cn(MENU_ITEM, "text-foreground")}>
                          <Star className={cn("size-3.5", bookmarked ? "fill-warning text-warning" : "text-muted-foreground")} />
                          {bookmarked ? "Remove bookmark" : "Bookmark"}
                        </button>
                        <div className="my-1 border-t border-border" />
                        <button onClick={() => onDelete(rec.id)} className={cn(MENU_ITEM, "text-sev-critical hover:bg-sev-critical/10")}>
                          <Trash2 className="size-3.5" />
                          Delete
                        </button>
                      </PopoverContent>
                    </Popover>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Drawer ──────────────────────────────────────────────────────────────── */

/** Where an operation recording's hours came from — the site's own, by default. */
function hoursSource(rec: DayRecording): string | null {
  if (rec.type !== "operation") return null;
  const h = findSiteById(rec.siteId)?.operatingHours;
  return h ? `${rec.siteName} operation hours · ${formatTimeOfDay(h.from)} – ${formatTimeOfDay(h.to)}` : "Site operation hours";
}

function InfoGrid({ rec }: { rec: DayRecording }) {
  const { date } = recDate(rec);
  const source = hoursSource(rec);
  const rows: [string, React.ReactNode][] = [
    ["Recording ID", <span className="font-mono text-xs">{rec.id}</span>],
    ["Type", <TypeChip type={rec.type} />],
    ["Camera", <span className="font-mono text-xs">{rec.cameraId}</span>],
    ["Camera Name", rec.cameraName],
    ["Site", rec.siteName],
    ["Area", rec.areaName],
    ["NVR", <span className="inline-flex items-center gap-1.5"><HardDrive className="size-3 text-info" /><span className="font-mono">{rec.nvrId ?? "—"}</span></span>],
    ["Resolution", <span className="font-mono text-xs">{rec.resolution} · {rec.fps} fps</span>],
    ["Date", date],
    ["Window", <span className="font-mono text-xs">{rec.startsAtDisplay} – {rec.endsAtDisplay}</span>],
    ["Duration", <span className="font-mono text-xs">{rec.durationDisplay}</span>],
    ["Size", <span className="font-mono text-xs">{rec.fileSizeDisplay}</span>],
    ...(rec.standby
      ? ([
          ["Standby Window", <span className="font-mono text-xs">{rec.standby.startsAtDisplay} – {rec.standby.endsAtDisplay} · {rec.standby.durationDisplay}</span>],
          ["Motion-Based Clips", <span className="font-mono text-xs">{rec.standby.clipCount} · {rec.standby.motion?.durationDisplay} in total</span>],
        ] as [string, React.ReactNode][])
      : []),
    ...(source ? [["Hours From", source] as [string, React.ReactNode]] : []),
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

/** One playable video — no thumbnail, the play button leads. `onSelect` adds the
    export checkbox, which only appears once a recording holds more than one. */
function PlayRow({ rec, title, onPlay, selected, onSelect }: {
  rec: DayRecording;
  title: React.ReactNode;
  onPlay: () => void;
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <div className="group/row flex w-full items-center gap-3 px-3.5 py-3 transition-colors hover:bg-muted/40">
      {onSelect && (
        <Checkbox checked={selected} onCheckedChange={onSelect} aria-label={`Include ${rec.id} in the export`} />
      )}
      <button onClick={onPlay} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-muted text-foreground transition-colors group-hover/row:border-primary group-hover/row:bg-primary group-hover/row:text-primary-foreground">
          <Play className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="mb-0.5 flex flex-wrap items-center gap-1.5">{title}</span>
          <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-2.5" />
            <span className="font-mono">{rec.startsAtDisplay} – {rec.endsAtDisplay}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="font-mono">{rec.durationDisplay}</span>
          </span>
        </span>
        <span className="shrink-0 font-mono text-xs text-foreground">{rec.fileSizeDisplay}</span>
      </button>
    </div>
  );
}

export function RecordingDrawer({ rec, open, bookmarked, onClose, onDelete, onExport, onToggleBookmark, onPlay }: {
  rec: DayRecording | null;
  open: boolean;
  bookmarked: boolean;
  onClose: () => void;
  onDelete: () => void;
  onExport: (items: DayRecording[]) => void;
  onToggleBookmark: () => void;
  onPlay: (rec: DayRecording) => void;
}) {
  const standby = rec?.standby;
  /* Everything the drawer lists, in the order it lists them — the recording
     itself, then the standby and each of its clips. */
  const items = React.useMemo(() => (rec ? cameraDayFiles(rec) : []), [rec]);

  /* Selection is only worth having once there is more than one recording.
     Rather than resetting through an effect, it is keyed to the recording: a
     different one reads as everything selected. */
  const [picked, setPicked] = React.useState<{ id: string | null; ids: Set<string> }>({ id: null, ids: new Set() });
  const allIds = React.useMemo(() => new Set(items.map((i) => i.id)), [items]);
  const selected = picked.id === rec?.id ? picked.ids : allIds;
  const setSelected = (ids: Set<string>) => setPicked({ id: rec?.id ?? null, ids });
  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  if (!rec) return null;
  const clips = items.slice(2);
  const multi = items.length > 1;
  const chosen = items.filter((i) => selected.has(i.id));
  const { date } = recDate(rec);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" showCloseButton={false} className="flex w-[min(860px,58vw)] max-w-[95vw] flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border bg-card px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <TypeChip type={rec.type} />
                <span className="rounded border border-border bg-muted px-1.5 py-px font-mono text-2xs text-muted-foreground">{rec.id}</span>
              </div>
              <SheetTitle className="mb-1 min-w-0 text-lg font-bold">
                <TruncatedText text={`${rec.cameraName} · ${date}`} />
              </SheetTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Video className="size-3" />
                {rec.cameraId}
                <span className="text-muted-foreground/40">·</span>
                <MapPin className="size-3" />
                {rec.areaName} · {rec.siteName}
                <span className="text-muted-foreground/40">·</span>
                <Clock className="size-3" />
                <span className="font-mono">{rec.durationDisplay}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="font-mono">{rec.fileSizeDisplay}</span>
              </div>
            </div>
            <div className="mt-0.5 flex flex-shrink-0 items-center gap-1">
              <BookmarkButton
                bookmarked={bookmarked}
                onToggle={onToggleBookmark}
                label={`${rec.id} · ${rec.cameraName}`}
                className={cn("size-7", !bookmarked && "text-muted-foreground hover:text-foreground")}
              />
              <button onClick={onClose} aria-label="Close"
                className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recording Info</p>
            <InfoGrid rec={rec} />
          </div>

          {/* The hours the camera was open for — the recording this row is. */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recording</p>
              {/* Nothing to choose between when a day is one recording. */}
              {multi && (
                <label className="flex cursor-pointer items-center gap-2 text-2xs text-muted-foreground">
                  <Checkbox
                    checked={selected.size === items.length}
                    onCheckedChange={() => setSelected(selected.size === items.length ? new Set() : new Set(allIds))}
                    aria-label="Select every recording for export"
                  />
                  {selected.size} of {items.length} selected for export
                </label>
              )}
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <PlayRow rec={rec} onPlay={() => onPlay(rec)}
                selected={multi ? selected.has(rec.id) : undefined}
                onSelect={multi ? () => toggle(rec.id) : undefined}
                title={<><TypeChip type={rec.type} /><span className="font-mono text-2xs text-muted-foreground">{rec.id}</span></>} />
            </div>
          </div>

          {/* Operation only — the rest of the day. Standby covers the closed
              hours, and the motion it caught splits into a clip each. */}
          {standby && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Outside Operation Hours</p>
                <p className="text-2xs text-muted-foreground">
                  Standby · {standby.durationDisplay}
                  {clips.length > 0 && ` · ${clips.length} motion clip${clips.length === 1 ? "" : "s"}`}
                </p>
              </div>
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                <PlayRow rec={standby} onPlay={() => onPlay(standby)}
                  selected={selected.has(standby.id)}
                  onSelect={() => toggle(standby.id)}
                  title={<><TypeChip type="standby" /><span className="font-mono text-2xs text-muted-foreground">{standby.id}</span></>} />
                {clips.map((clip, i) => (
                  <PlayRow key={clip.id} rec={clip} onPlay={() => onPlay(clip)}
                    selected={selected.has(clip.id)}
                    onSelect={() => toggle(clip.id)}
                    title={<><TypeChip type="motion" /><span className="text-xs text-foreground">Clip {i + 1} of {clips.length}</span></>} />
                ))}
              </div>
              <p className="mt-2 text-2xs text-muted-foreground">
                Standby runs from closing to opening. Motion-based recording runs inside it: each clip starts
                when motion is detected and ends once it stops.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border bg-card px-5 py-3.5">
          {bookmarked && (
            <p className="mr-auto inline-flex items-center gap-1.5 text-xs text-warning">
              <Lock className="size-3" />
              Bookmarked — remove the bookmark before it can be deleted.
            </p>
          )}
          {/* Export is never blocked by a bookmark — it takes a copy, it does not remove anything. */}
          <Button
            variant="outline"
            className="gap-1.5"
            disabled={chosen.length === 0}
            onClick={() => onExport(chosen)}
            aria-label={chosen.length === 0 ? "Select a recording to export" : `Export ${chosen.length} recording${chosen.length === 1 ? "" : "s"} from ${rec.id} as a zip`}
          >
            <Package className="size-3.5" />
            Export{multi && ` (${chosen.length})`}
          </Button>
          <Button
            variant="outline"
            disabled={bookmarked}
            aria-label={bookmarked ? `${rec.id} is bookmarked and cannot be deleted` : "Delete recording"}
            className="gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
            Delete Recording
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Export ──────────────────────────────────────────────────────────────── */

/** One file a zip holds. The drawer decides which recordings are in it. */
function exportFiles(items: DayRecording[]): { name: string; kind: RecordingTypeId; size: string; mb: number }[] {
  return items.map((r) => ({ name: `${r.id}.mp4`, kind: r.type, size: r.fileSizeDisplay, mb: r.fileSizeMb }));
}

/**
 * What an export archives. From the drawer it is one camera-day (`rec` names
 * the zip, `items` is what was ticked); from the selection bar it is several
 * whole camera-days (`recs`).
 */
export type ExportTarget = { items: DayRecording[] } & ({ rec: DayRecording } | { recs: DayRecording[] });

/** The zip's name, without the extension. */
function exportName(target: ExportTarget): string {
  return "rec" in target ? target.rec.id : `Accel-recordings-${target.recs.length}`;
}

export function ExportRecordingModal({ open, target, onClose, onConfirm }: {
  open: boolean;
  target: ExportTarget | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!target) return null;
  const { items } = target;
  const rec = "rec" in target ? target.rec : null;
  const files = exportFiles(items);
  const totalMb = files.reduce((t, f) => t + f.mb, 0);
  const partial = !!rec?.standby && files.length < 2 + (rec.standby.clipCount ?? 0);
  const name = exportName(target);
  const description = rec
    ? `${rec.id} · ${rec.cameraName} · ${recDate(rec).date}`
    : `${"recs" in target ? target.recs.length : 0} recordings, each with its standby and motion clips`;

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title={rec ? "Export Recording" : "Export Recordings"}
          description={description}
        />
        <ModalBody>
          <div className="rounded-lg border border-border bg-background p-4">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-base font-semibold text-foreground">
                <Package className="size-3.5 text-primary" />
                {name}.zip
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {files.length} file{files.length === 1 ? "" : "s"} · {fmtSize(totalMb)}
              </span>
            </div>
            {/* Long on a busy night, so the list scrolls rather than the modal. */}
            <ul className="max-h-56 divide-y divide-border/60 overflow-y-auto rounded-md border border-border">
              {files.map((f) => (
                <li key={f.name} className="flex items-center gap-2 px-3 py-1.5">
                  <span className={cn("size-1.5 shrink-0 rounded-full", TONE_CLASSES[typeById(f.kind).tone].dot)} />
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">{f.name}</span>
                  <span className="shrink-0 text-2xs text-muted-foreground">{typeById(f.kind).label}</span>
                  <span className="w-20 shrink-0 text-right font-mono text-2xs text-muted-foreground">{f.size}</span>
                </li>
              ))}
            </ul>
          </div>
          {rec?.standby && (
            <p className="mt-3 text-xs text-muted-foreground">
              {partial
                ? "Only the recordings picked in the drawer are archived — tick the rest to include them."
                : "The standby recording and its motion clips are part of this camera-day, so they are archived with it."}
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="gap-1.5" onClick={onConfirm}>
            <Download className="size-3.5" />
            Download zip · {fmtSize(totalMb)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Delete confirmation ─────────────────────────────────────────────────── */

export function DeleteRecordingsModal({ open, recs, onClose, onConfirm }: {
  open: boolean;
  recs: DayRecording[];
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (recs.length === 0) return null;
  const isBulk = recs.length > 1;
  const clips = recs.reduce((s, r) => s + (r.standby?.clipCount ?? 0), 0);

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title={isBulk ? `Delete Recordings (${recs.length})` : "Delete Recording"}
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
                  <p className="mt-1 text-sm text-muted-foreground">{recs.length} recordings will be deleted immediately.</p>
                ) : (
                  <p className="mt-1 text-base text-muted-foreground">
                    <span className="font-mono text-sm">{recs[0].id}</span> — {recs[0].cameraName} · {typeById(recs[0].type).label}
                  </p>
                )}
              </div>
            </div>
          </div>
          {clips > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              An operation recording takes its standby, and the motion clips inside it — {clips} clip{clips === 1 ? "" : "s"} in all.
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" variant="destructive" className="gap-1.5" onClick={onConfirm}>
            <Trash2 className="size-3.5" />
            Delete {recs.length} Recording{recs.length === 1 ? "" : "s"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

type SortKey = "newest" | "oldest" | "longest" | "largest";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest First" },
  { key: "oldest", label: "Oldest First" },
  { key: "longest", label: "Longest First" },
  { key: "largest", label: "Largest Size" },
];

/* Date filter mirrors the Phase 1 Recordings page — same pills, same keys, same
   Custom Date popover. The data only reaches three days back, so This Week and
   This Month resolve to the whole set here. */
type DatePreset = "all" | "today" | "yesterday" | "week" | "month" | "custom";
const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: "all",       label: "All time" },
  { key: "today",     label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week",      label: "This Week" },
  { key: "month",     label: "This Month" },
];

/* Same reference clock as the Phase 1 page, so "Today" means the same date. */
const NOW_REF = new Date("2026-05-25T10:15:00");

/** A recording's calendar date, derived from how many days back it sits. */
function dayTimestamp(dayIndex: number): number {
  const d = new Date(NOW_REF);
  d.setDate(d.getDate() - dayIndex);
  d.setHours(12, 0, 0, 0);
  return d.getTime();
}

/** Only continuous and operation are listed, so a row matches its own type. */
function matchesType(rec: DayRecording, types: string[]): boolean {
  return types.includes(rec.type);
}

/**
 * A hand-off can name a recording by its id, or — from screens still on the
 * older per-file recordings (the Cameras drawer) — by an id from MOCK_RECORDINGS.
 * That one resolves to the camera-day it falls in.
 */
function resolveRecordingId(id: string, list: DayRecording[]): string | null {
  if (list.some((r) => r.id === id)) return id;
  const legacy = MOCK_RECORDINGS.find((r) => r.id === id);
  if (!legacy) return null;
  const sameCamera = list.filter((r) => r.cameraId === legacy.cameraId);
  return (sameCamera.find((r) => r.dateLabel === legacy.dateLabel) ?? sameCamera[0])?.id ?? null;
}

export default function RecordingsPage({
  forcedState = "normal",
  enhancePath = "/recordings/enhance",
}: {
  forcedState?: "normal" | "empty";
  /** Where Enhance in the selection bar goes — the Video Enhancement page's route. */
  enhancePath?: string;
} = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  // Seeded from ?q= so the ⌘K palette can hand off a filtered view.
  const [seedParams] = useSearchParams();
  const [source, setSource] = React.useState<DayRecording[]>(() => (forcedState === "empty" ? [] : ALL_RECORDINGS));
  const [search, setSearch] = React.useState(() => seedParams.get("q") ?? "");
  const [filters, setFilters] = React.useState<RecordingFilters>(EMPTY_FILTERS);
  const [datePreset, setDatePreset] = React.useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [sortOpen, setSortOpen] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  /* Seeded so the bookmarked state is visible without bookmarking one first. */
  const [bookmarkedIds, setBookmarkedIds] = React.useState<Set<string>>(() => {
    const seed = ALL_RECORDINGS.find((r) => r.cameraId === "Cam-04" && r.dayIndex === 0 && r.type === "standby");
    return new Set(seed ? [seed.id] : []);
  });
  /* Other screens open a recording by passing its id in router state. */
  const [drawerId, setDrawerId] = React.useState<string | null>(() => {
    const incoming = (location.state as { openRecordingId?: string } | null)?.openRecordingId;
    return incoming ? resolveRecordingId(incoming, source) : null;
  });
  React.useEffect(() => {
    if ((location.state as { openRecordingId?: string } | null)?.openRecordingId) {
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
  }, [location.state, location.pathname, location.search, navigate]);
  const [playing, setPlaying] = React.useState<DayRecording | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<DayRecording[]>([]);
  const [exportTarget, setExportTarget] = React.useState<ExportTarget | null>(null);
  const startDownload = useDownloadsStore((s) => s.start);
  const [page, setPage] = React.useState(1);
  const pageSize = 12;

  const filtered = React.useMemo(() => {
    const list = source.filter((r) => {
      if (datePreset !== "all") {
        if (datePreset === "today"     && r.dayIndex !== 0) return false;
        if (datePreset === "yesterday" && r.dayIndex !== 1) return false;
        if (datePreset === "week"      && r.dayIndex > 6)  return false;
        if (datePreset === "month"     && r.dayIndex > 29) return false;
        if (datePreset === "custom") {
          const ts = dayTimestamp(r.dayIndex);
          if (dateFrom && ts < new Date(dateFrom + "T00:00:00").getTime()) return false;
          if (dateTo   && ts > new Date(dateTo   + "T23:59:59").getTime()) return false;
        }
      }
      // Selecting both options constrains nothing, same as selecting neither.
      if (filters.bookmark.length === 1) {
        const wantBookmarked = filters.bookmark[0] === "bookmarked";
        if (bookmarkedIds.has(r.id) !== wantBookmarked) return false;
      }
      if (filters.site.length > 0 && !filters.site.includes(r.siteId)) return false;
      if (filters.area.length > 0 && !filters.area.includes(r.areaId)) return false;
      if (filters.camera.length > 0 && !filters.camera.includes(r.cameraId)) return false;
      if (filters.type.length > 0 && !matchesType(r, filters.type)) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [r.id, r.cameraId, r.cameraName, r.areaName, r.siteName, r.dateLabel, typeById(r.type).label].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    // Newest first, then by camera, with each camera's main recording before its standby.
    const byTime = (a: DayRecording, b: DayRecording) =>
      a.dayIndex - b.dayIndex || a.cameraId.localeCompare(b.cameraId) || a.id.localeCompare(b.id);
    return [...list].sort((a, b) => {
      if (sort === "oldest") return -byTime(a, b);
      if (sort === "longest") return b.durationMinutes - a.durationMinutes;
      if (sort === "largest") return b.fileSizeMb - a.fileSizeMb;
      return byTime(a, b);
    });
  }, [source, datePreset, dateFrom, dateTo, filters, search, sort, bookmarkedIds]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const drawerRec = drawerId ? source.find((r) => r.id === drawerId) ?? null : null;
  const hasFilters = !!(search || Object.values(filters).some((a) => a.length > 0) || datePreset !== "all");

  const totalMb = filtered.reduce((s, r) => s + r.fileSizeMb, 0);
  const todayCount = source.filter((r) => r.dayIndex === 0).length;

  function toggleBookmark(id: string) {
    setBookmarkedIds((curr) => {
      const next = new Set(curr);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function requestDelete(requested: string[]) {
    if (requested.length === 0) return;
    /* Bookmarked recordings are held back rather than silently deleted — the
       operator bookmarked them precisely so this could not happen. */
    const protectedIds = requested.filter((id) => bookmarkedIds.has(id));
    const ids = requested.filter((id) => !bookmarkedIds.has(id));
    if (ids.length === 0) {
      toast.error(
        protectedIds.length === 1
          ? "That recording is bookmarked — remove the bookmark before deleting."
          : `All ${protectedIds.length} selected recordings are bookmarked — remove their bookmarks before deleting.`
      );
      return;
    }
    if (protectedIds.length > 0) {
      toast.message(`${protectedIds.length} bookmarked recording${protectedIds.length === 1 ? "" : "s"} kept`, {
        description: "Bookmarked recordings cannot be deleted.",
      });
    }
    setDeleteTarget(source.filter((r) => ids.includes(r.id)));
    setDeleteOpen(true);
  }

  function confirmDelete() {
    const ids = new Set(deleteTarget.map((r) => r.id));
    if (ids.size === 0) return;
    setSource((curr) => curr.filter((r) => !ids.has(r.id)));
    setSelectedIds((curr) => new Set([...curr].filter((id) => !ids.has(id))));
    if (drawerId && ids.has(drawerId)) setDrawerId(null);
    setDeleteOpen(false);
    toast.success(`${ids.size} recording${ids.size === 1 ? "" : "s"} deleted`);
  }

  function toggleSelected(id: string) {
    setSelectedIds((curr) => {
      const next = new Set(curr);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className={cn("flex flex-col gap-4", selectedIds.size > 0 && "pb-24")}>
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Recordings</PageHeader.Title>
        </PageHeader.Content>
      </PageHeader>

      <KpiGrid cols={3}>
        <KpiCard label="Total Recordings" value={String(filtered.length)} sub="Matching the current filters" accent="primary" icon={Film} />
        <KpiCard
          label="Today"
          value={String(todayCount)}
          sub="Recorded today"
          accent="success"
          icon={Video}
          active={datePreset === "today"}
          onClick={() => { setDatePreset((c) => (c === "today" ? "all" : "today")); setDateFrom(""); setDateTo(""); setPage(1); }}
        />
        <StorageCard siteIds={filters.site} shownMb={totalMb} />
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
        additionalActiveCount={datePreset !== "all" ? 1 : 0}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base text-muted-foreground">
          <strong className="text-foreground">{filtered.length}</strong> recording{filtered.length === 1 ? "" : "s"} match current filters
          {hasFilters && (
            <button
              onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); setDatePreset("all"); setDateFrom(""); setDateTo(""); setPage(1); }}
              className="ml-2 text-muted-foreground underline hover:text-primary"
            >
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
                  className={cn("flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                    sort === o.key ? "text-primary" : "text-foreground")}>
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
          {source.length === 0 ? (
            <>
              <p className="text-sm font-medium text-foreground">No recordings found</p>
              <p className="text-sm">Recordings appear here once cameras with attached NVRs capture footage.</p>
            </>
          ) : (
            <p className="text-sm">No recordings match the current filters.</p>
          )}
        </div>
      ) : (
        <RecordingTable
          items={pageItems}
          selectedIds={selectedIds}
          bookmarkedIds={bookmarkedIds}
          onToggle={toggleSelected}
          onToggleAll={(select) =>
            setSelectedIds((curr) => {
              const next = new Set(curr);
              pageItems.forEach((r) => (select ? next.add(r.id) : next.delete(r.id)));
              return next;
            })
          }
          onToggleBookmark={toggleBookmark}
          onOpen={setDrawerId}
          onDelete={(id) => requestDelete([id])}
        />
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

      <RecordingDrawer
        rec={drawerRec}
        open={drawerId !== null}
        bookmarked={!!drawerRec && bookmarkedIds.has(drawerRec.id)}
        onClose={() => setDrawerId(null)}
        onDelete={() => drawerRec && requestDelete([drawerRec.id])}
        onExport={(items) => drawerRec && setExportTarget({ rec: drawerRec, items })}
        onToggleBookmark={() => drawerRec && toggleBookmark(drawerRec.id)}
        onPlay={(r) => setPlaying(r)}
      />

      <ExportRecordingModal
        open={exportTarget !== null}
        target={exportTarget}
        onClose={() => setExportTarget(null)}
        onConfirm={() => {
          const target = exportTarget;
          setExportTarget(null);
          if (!target) return;
          const files = exportFiles(target.items);
          const totalMb = files.reduce((t, f) => t + f.mb, 0);
          const fileName = `${exportName(target)}.zip`;
          // Progress shows in the top bar's download indicator.
          startDownload({ fileName, files: files.map((f) => ({ name: f.name, size: f.size })), totalMb });
          toast.success(`Downloading ${fileName}`, {
            description: "Follow its progress from the download icon at the top.",
            duration: 3000,
          });
        }}
      />

      <RecordingPlayerModal recording={playing} open={playing !== null} onClose={() => setPlaying(null)} />

      {selectedIds.size > 0 && (
        <FloatingBar className="flex flex-wrap items-center gap-3 rounded-xl border border-primary bg-card px-4 py-3 shadow-[0_16px_48px_hsl(var(--primary)/0.25)]">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Check className="size-3.5" strokeWidth={3} />
            </div>
            <span className="text-base font-semibold text-foreground">
              {selectedIds.size} recording{selectedIds.size > 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <Button variant="ghost" className="gap-1.5 text-sm text-muted-foreground" onClick={() => setSelectedIds(new Set())}>
              <X className="size-3.5" />
              Clear selection
            </Button>
            <div className="mx-1 h-4 w-px bg-border" />
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                const recs = source.filter((r) => selectedIds.has(r.id));
                // One camera-day exports exactly as it does from its drawer.
                setExportTarget(recs.length === 1
                  ? { rec: recs[0], items: cameraDayFiles(recs[0]) }
                  : { recs, items: recs.flatMap(cameraDayFiles) });
              }}
            >
              <Package className="size-3.5" />
              Export
            </Button>
            <EnhanceButton
              recording={selectedIds.size === 1 ? source.find((r) => selectedIds.has(r.id)) ?? null : null}
              onEnhance={(r) => navigate(enhancePath, { state: { recordingId: r.id } })}
            />
            <Button variant="outline" className="gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10"
              onClick={() => requestDelete([...selectedIds])}>
              <Trash2 className="size-3.5" />
              Delete {selectedIds.size}
            </Button>
          </div>
        </FloatingBar>
      )}

      <DeleteRecordingsModal
        open={deleteOpen}
        recs={deleteTarget}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

/** Enhancement works on one clip at a time, so the button waits for a single selection. */
function EnhanceButton({ recording, onEnhance }: {
  recording: DayRecording | null;
  onEnhance: (rec: DayRecording) => void;
}) {
  const button = (
    <Button variant="outline" className="gap-1.5" disabled={!recording} onClick={() => recording && onEnhance(recording)}>
      <Sparkles className="size-3.5" />
      Enhance
    </Button>
  );
  if (recording) return button;
  return (
    <Tooltip>
      {/* A disabled button fires no pointer events, so the tooltip hangs off a wrapper. */}
      <TooltipTrigger asChild>
        <span tabIndex={0}>{button}</span>
      </TooltipTrigger>
      <TooltipContent>Select one recording to enhance</TooltipContent>
    </Tooltip>
  );
}

/** The Phase 1.3 prototype's version of this page, with Enhance wired to its Video Enhancement page. */
export function RecordingsByDay() {
  return <RecordingsPage enhancePath="/enhancement" />;
}
