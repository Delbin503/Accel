import * as React from "react";
import { toast } from "sonner";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Film,
  HardDrive,
  MapPin,
  Lock,
  MoreHorizontal,
  Play,
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
import { formatDate } from "@/lib/formatters";
import { RECORDING_TYPES, TONE_CLASSES, type RecordingTypeId } from "./recordingTypes";
import {
  ALL_RECORDINGS,
  DAYS,
  buildCameraDays,
  fmtSize,
  motionClipsFor,
  type CameraDay,
  type DayRecording,
} from "./dayRecordings";
import { EMPTY_FILTERS, type RecordingFilters } from "./recordingFilters";
import { FilterPanel } from "./recordingsChrome";
import { RecordingPlayerModal } from "./RecordingPlayerModal";
import { FloatingBar } from "./FloatingBar";
import { MOCK_NVRS } from "@/mocks/nvr";

/* Recordings, reshaped for Phase 1.3.

   A row is no longer one file — a camera produces one recording per enabled
   type per day, so a row is a camera-day and its chip counts what is inside.
   It's a list, not a grid of cards: recordings carry no thumbnail in the
   build, so a thumbnail slot would only ever be a placeholder. Opening a row
   leads with the recording info and lists the day's recordings; picking one
   opens the player in a pop-up. */

/* ── Chips ───────────────────────────────────────────────────────────────── */

/**
 * Pill like User Management's status pill; `types` puts one dot per recording
 * type where its dot sits. `bare` drops the word, for a column already headed
 * "Recordings".
 */
function CountChip({ count, types, bare }: { count: number; types?: RecordingTypeId[]; bare?: boolean }) {
  const label = `${count} Recording${count === 1 ? "" : "s"}`;
  return (
    <span title={bare ? label : undefined} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-primary/30 bg-primary/15 px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-primary">
      {types && <TypeDots types={types} />}
      {bare ? count : label}
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
        bookmarked ? "text-warning" : "text-white/70 hover:text-white",
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

/* ── Camera-day list ─────────────────────────────────────────────────────── */

/** The day's date and first start, e.g. "25 May 2026" and "00:00". */
function dayDateDisplay(day: CameraDay): { date: string; time: string } {
  // DAYS runs newest first and ends on a dated label, so the others count back from it.
  const last = DAYS.length - 1;
  const date = new Date(DAYS[last]);
  date.setDate(date.getDate() + (last - day.dayIndex));
  return { date: formatDate(date, { day: "numeric", month: "short", year: "numeric" }), time: day.firstStartDisplay.slice(0, 5) };
}

/* Built like the User Management table — same header, dividers, ID column,
   pills and "⋯" action menu — so the two lists read alike. */
const HEAD = "whitespace-nowrap px-4 py-2.5 font-mono text-2xs font-normal uppercase tracking-[0.15em] text-muted-foreground/60";
const CELL = "px-4 py-3";
const MENU_ITEM = "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted";

function CameraDayTable({ days, selectedKeys, bookmarkedKeys, onToggle, onToggleAll, onToggleBookmark, onOpen, onDelete }: {
  days: CameraDay[];
  selectedKeys: Set<string>;
  bookmarkedKeys: Set<string>;
  onToggle: (key: string) => void;
  onToggleAll: (select: boolean) => void;
  onToggleBookmark: (key: string) => void;
  onOpen: (key: string) => void;
  onDelete: (key: string) => void;
}) {
  const selectedHere = days.filter((d) => selectedKeys.has(d.key)).length;
  const all = selectedHere === days.length;
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
                  aria-label="Select every camera-day on this page"
                />
              </th>
              {["REC ID", "Recording Title", "Date", "Recordings", "Duration / Size", "Action"].map((h) => (
                <th key={h} className={HEAD}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {days.map((day) => {
              const selected = selectedKeys.has(day.key);
              const bookmarked = bookmarkedKeys.has(day.key);
              const label = `${day.cameraName} · ${day.dateLabel}`;
              return (
                <tr
                  key={day.key}
                  tabIndex={0}
                  onClick={() => onOpen(day.key)}
                  onKeyDown={(e) => e.key === "Enter" && onOpen(day.key)}
                  className={cn("group cursor-pointer text-base transition-colors hover:bg-muted/20", selected && "bg-primary/5")}
                >
                  <td className={CELL} onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected} onCheckedChange={() => onToggle(day.key)} aria-label={`Select ${label}`} />
                  </td>
                  <td className={CELL}>
                    {/* A camera-day is filed under its first recording's id. */}
                    <span className="whitespace-nowrap font-mono text-sm font-semibold text-muted-foreground transition-colors group-hover:text-primary">
                      {day.recordings[0]?.id ?? "—"}
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
                          <TruncatedText text={day.cameraName} className="font-semibold text-foreground transition-colors group-hover:text-primary" />
                          {/* A bookmark keeps a camera-day out of any delete. */}
                          {bookmarked && <Star className="size-3 shrink-0 fill-warning text-warning" aria-label="Bookmarked" />}
                        </div>
                        <TruncatedText text={`${day.cameraId} · ${day.areaName} · ${day.siteName}`} className="text-xs text-muted-foreground" />
                      </div>
                    </div>
                  </td>
                  {/* Date over time, each with its icon as the other modules' tables show them. */}
                  <td className={cn(CELL, "whitespace-nowrap")}>
                    <p className="flex items-center gap-1.5 text-sm text-foreground">
                      <Calendar className="size-3 shrink-0 text-muted-foreground" />
                      {dayDateDisplay(day).date}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3 shrink-0" />
                      {dayDateDisplay(day).time}
                    </p>
                  </td>
                  <td className={CELL}>
                    {/* The pill counts the day's recordings — a camera no longer has one mode. */}
                    <CountChip count={day.recordings.length} types={day.recordings.map((r) => r.type)} bare />
                  </td>
                  <td className={cn(CELL, "whitespace-nowrap")}>
                    <p className="text-foreground">{day.totalDurationDisplay}</p>
                    <p className="text-xs text-muted-foreground">{day.totalSizeDisplay}</p>
                  </td>
                  <td className={CELL} onClick={(e) => e.stopPropagation()}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button aria-label={`Actions for ${label}`} className="flex size-7 items-center justify-center rounded border border-transparent text-muted-foreground/50 transition-colors hover:border-border hover:bg-muted hover:text-foreground">
                          <MoreHorizontal className="size-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-44 p-1" align="end">
                        <button onClick={() => onOpen(day.key)} className={cn(MENU_ITEM, "text-foreground")}>
                          <Play className="size-3.5 text-muted-foreground" />
                          View recordings
                        </button>
                        <button onClick={() => onToggleBookmark(day.key)} className={cn(MENU_ITEM, "text-foreground")}>
                          <Star className={cn("size-3.5", bookmarked ? "fill-warning text-warning" : "text-muted-foreground")} />
                          {bookmarked ? "Remove bookmark" : "Bookmark"}
                        </button>
                        <div className="my-1 border-t border-border" />
                        <button onClick={() => onDelete(day.key)} className={cn(MENU_ITEM, "text-sev-critical hover:bg-sev-critical/10")}>
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

function RecordingRow({ rec, onPlay, nested, label }: {
  rec: DayRecording;
  onPlay: () => void;
  /** A motion clip listed under its standby recording. */
  nested?: boolean;
  /** Replaces the id chip — "Clip 3 of 6" reads better than a suffixed id. */
  label?: string;
}) {
  return (
    <button
      onClick={onPlay}
      className={cn(
        "group/row flex w-full items-center gap-3 text-left transition-colors hover:bg-muted/40",
        nested ? "py-2.5 pl-10 pr-3.5" : "px-3.5 py-3"
      )}
    >
      {/* Thumbnail doubles as the play affordance. */}
      <span className={cn(
        "relative shrink-0 overflow-hidden rounded-md border border-border bg-neutral-900",
        nested ? "h-9 w-16" : "h-11 w-20"
      )}>
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
          <span className="rounded border border-border bg-muted px-1.5 py-px font-mono text-2xs text-muted-foreground">{label ?? rec.id}</span>
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

/**
 * Standby with its motion clips folded underneath. Motion runs inside the
 * standby window and fires in bursts, so a busy day can hold a dozen clips —
 * listing them flat would bury the other recording types. The standby row
 * carries the count; the chevron opens the clips.
 */
function StandbyGroup({ standby, motion, onPlay }: {
  standby: DayRecording;
  motion: DayRecording | undefined;
  onPlay: (rec: DayRecording) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const clips = motion ? motionClipsFor(motion) : [];
  const tone = TONE_CLASSES[RECORDING_TYPES.find((t) => t.id === "motion")?.tone ?? "warning"];

  return (
    <div>
      <div className="flex items-stretch">
        <div className="min-w-0 flex-1">
          <RecordingRow rec={standby} onPlay={() => onPlay(standby)} />
        </div>
        {clips.length > 0 && (
          /* A sibling of the play row, not inside it — a button cannot hold a button. */
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={`${open ? "Hide" : "Show"} ${clips.length} motion-based clip${clips.length === 1 ? "" : "s"}`}
            className="flex shrink-0 items-center gap-1.5 border-l border-border px-3 text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-2xs font-semibold", tone.chip)}>
              <strong>{clips.length}</strong> Motion
            </span>
            <ChevronDown className={cn(
              "size-3.5 transition-transform duration-[var(--duration-fast)] ease-standard",
              open && "rotate-180"
            )} />
          </button>
        )}
      </div>

      {open && (
        <div className="divide-y divide-border border-t border-border bg-muted/20">
          {clips.map((clip, i) => (
            <RecordingRow
              key={clip.id}
              rec={clip}
              nested
              label={`Clip ${i + 1} of ${clips.length}`}
              onPlay={() => onPlay(clip)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CameraDayDrawer({ day, open, bookmarked, onClose, onDelete, onToggleBookmark, onPlay }: {
  day: CameraDay | null;
  open: boolean;
  bookmarked: boolean;
  onClose: () => void;
  onDelete: () => void;
  onToggleBookmark: () => void;
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
            <div className="mt-0.5 flex flex-shrink-0 items-center gap-1">
              <BookmarkButton
                bookmarked={bookmarked}
                onToggle={onToggleBookmark}
                label={`${day.cameraName} · ${day.dateLabel}`}
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
              {day.recordings.map((rec) => {
                const motion = day.recordings.find((r) => r.type === "motion");
                const standby = day.recordings.find((r) => r.type === "standby");
                // Motion lives under standby; it only stands alone if standby is somehow missing.
                if (rec.type === "motion" && standby) return null;
                if (rec.type === "standby") {
                  return <StandbyGroup key={rec.id} standby={rec} motion={motion} onPlay={onPlay} />;
                }
                return <RecordingRow key={rec.id} rec={rec} onPlay={() => onPlay(rec)} />;
              })}
            </div>
            <p className="mt-2 text-2xs text-muted-foreground">
              Types that are switched off in System Configuration › Recording Schedule produce nothing, so they do not appear here.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border bg-card px-5 py-3.5">
          {bookmarked && (
            <p className="mr-auto inline-flex items-center gap-1.5 text-xs text-warning">
              <Lock className="size-3" />
              Bookmarked — remove the bookmark before it can be deleted.
            </p>
          )}
          <Button
            variant="outline"
            disabled={bookmarked}
            aria-label={bookmarked ? `${day.cameraName} · ${day.dateLabel} is bookmarked and cannot be deleted` : "Delete recordings"}
            className="gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10"
            onClick={onDelete}
          >
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

/* Date filter mirrors the Phase 1 Recordings page — same pills, same keys, same
   Custom Date popover. The camera-day data only reaches three days back, so
   This Week and This Month resolve to the whole set here. */
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

/** A camera-day's calendar date, derived from how many days back it sits. */
function dayTimestamp(dayIndex: number): number {
  const d = new Date(NOW_REF);
  d.setDate(d.getDate() - dayIndex);
  d.setHours(12, 0, 0, 0);
  return d.getTime();
}

export function RecordingsByDay() {
  const [source, setSource] = React.useState<DayRecording[]>(ALL_RECORDINGS);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<RecordingFilters>(EMPTY_FILTERS);
  const [datePreset, setDatePreset] = React.useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [sortOpen, setSortOpen] = React.useState(false);
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set());
  /* Seeded so the bookmarked state is visible without bookmarking one first. */
  const [bookmarkedKeys, setBookmarkedKeys] = React.useState<Set<string>>(() => new Set(["Cam-04::Today"]));
  const [drawerKey, setDrawerKey] = React.useState<string | null>(null);
  const [playing, setPlaying] = React.useState<DayRecording | null>(null);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{ keys: string[]; days: { key: string; label: string; count: number }[] }>({ keys: [], days: [] });
  const [page, setPage] = React.useState(1);
  const pageSize = 12;

  const allDays = React.useMemo(() => buildCameraDays(source), [source]);

  const filtered = React.useMemo(() => {
    const list = allDays.filter((d) => {
      if (datePreset !== "all") {
        if (datePreset === "today"     && d.dayIndex !== 0) return false;
        if (datePreset === "yesterday" && d.dayIndex !== 1) return false;
        if (datePreset === "week"      && d.dayIndex > 6)  return false;
        if (datePreset === "month"     && d.dayIndex > 29) return false;
        if (datePreset === "custom") {
          const ts = dayTimestamp(d.dayIndex);
          if (dateFrom && ts < new Date(dateFrom + "T00:00:00").getTime()) return false;
          if (dateTo   && ts > new Date(dateTo   + "T23:59:59").getTime()) return false;
        }
      }
      // Selecting both options constrains nothing, same as selecting neither.
      if (filters.bookmark.length === 1) {
        const wantBookmarked = filters.bookmark[0] === "bookmarked";
        if (bookmarkedKeys.has(d.key) !== wantBookmarked) return false;
      }
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
  }, [allDays, datePreset, dateFrom, dateTo, filters, search, sort, bookmarkedKeys]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const drawerDay = drawerKey ? allDays.find((d) => d.key === drawerKey) ?? null : null;
  const hasFilters = !!(search || Object.values(filters).some((a) => a.length > 0) || datePreset !== "all");

  const totalFiles = filtered.reduce((s, d) => s + d.recordings.length, 0);
  const totalMb = filtered.reduce((s, d) => s + d.totalMb, 0);
  const todayDays = allDays.filter((d) => d.dateLabel === "Today").length;

  function toggleBookmark(key: string) {
    setBookmarkedKeys((curr) => {
      const next = new Set(curr);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function requestDelete(requested: string[]) {
    if (requested.length === 0) return;
    /* Bookmarked recordings are held back rather than silently deleted — the
       operator bookmarked them precisely so this could not happen. */
    const protectedKeys = requested.filter((k) => bookmarkedKeys.has(k));
    const keys = requested.filter((k) => !bookmarkedKeys.has(k));
    if (keys.length === 0) {
      toast.error(
        protectedKeys.length === 1
          ? "That recording is bookmarked — remove the bookmark before deleting."
          : `All ${protectedKeys.length} selected recordings are bookmarked — remove their bookmarks before deleting.`
      );
      return;
    }
    if (protectedKeys.length > 0) {
      toast.message(`${protectedKeys.length} bookmarked camera-day${protectedKeys.length === 1 ? "" : "s"} kept`, {
        description: "Bookmarked recordings cannot be deleted.",
      });
    }
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
    <div className={cn("flex flex-col gap-4", selectedKeys.size > 0 && "pb-24")}>
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Recordings</PageHeader.Title>
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
          <strong className="text-foreground">{filtered.length}</strong> camera-day{filtered.length === 1 ? "" : "s"}
          {" · "}
          <strong className="text-foreground">{totalFiles}</strong> recording{totalFiles === 1 ? "" : "s"} match current filters
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
        <CameraDayTable
          days={pageItems}
          selectedKeys={selectedKeys}
          bookmarkedKeys={bookmarkedKeys}
          onToggle={toggleDay}
          onToggleAll={(select) =>
            setSelectedKeys((curr) => {
              const next = new Set(curr);
              pageItems.forEach((d) => (select ? next.add(d.key) : next.delete(d.key)));
              return next;
            })
          }
          onToggleBookmark={toggleBookmark}
          onOpen={setDrawerKey}
          onDelete={(key) => requestDelete([key])}
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

      <CameraDayDrawer
        day={drawerDay}
        open={drawerKey !== null}
        bookmarked={!!drawerDay && bookmarkedKeys.has(drawerDay.key)}
        onClose={() => setDrawerKey(null)}
        onDelete={() => drawerDay && requestDelete([drawerDay.key])}
        onToggleBookmark={() => drawerDay && toggleBookmark(drawerDay.key)}
        onPlay={(rec) => setPlaying(rec)}
      />

      <RecordingPlayerModal recording={playing} open={playing !== null} onClose={() => setPlaying(null)} />

      {selectedKeys.size > 0 && (
        <FloatingBar className="flex flex-wrap items-center gap-3 rounded-xl border border-primary bg-card px-4 py-3 shadow-[0_16px_48px_hsl(var(--primary)/0.25)]">
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
        </FloatingBar>
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
