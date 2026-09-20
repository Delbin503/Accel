import * as React from "react";
import {
  AlertTriangle,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  MapPin,
  PanelsTopLeft,
  Pause,
  Play,
  Radio,
  RotateCcw,
  RotateCw,
  Search,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PageHeader } from "@/components/layout/PageHeader";
import { TruncatedText } from "@/components/shared/TruncatedText";
import { cn } from "@/lib/utils";
import { useCamerasStore } from "@/stores/useCamerasStore";
import { useSitesStore } from "@/stores/useSitesStore";
import type { CameraData } from "@/types/cameras";
import {
  BUFFER_SEC,
  LIVE_STATE,
  SPEEDS,
  detCount,
  fmtOffset,
  isZoomed,
  timestampAt,
  zoomTransform,
  type PlaybackState,
} from "./playback";
import { ScrubTrack, ZoomSurface } from "./playbackControls";
import { CameraPlayerModal, TILE_GRADIENT, TilePlayerBar } from "./cameraPlayer";
import { FloatingBar } from "./FloatingBar";

/* Live Monitoring, rebuilt for the Phase 1.3 synchronised-playback proposal.

   Two things are new against the shipped page:
   1. Every tile is selectable — hovering reveals a checkbox, and a selection
      bar collects what you picked, matching the pattern on Detection Feed.
   2. Every tile is scrubbable — hovering reveals a player bar with a draggable
      timeline, a LIVE tag and a settings dropdown. Pull the timeline back and
      that tile leaves the live edge on its own; open Playback settings from the
      selection bar and the whole selection moves together instead. */

type ViewMode = "hero" | "wall";

const VIEW_MODES: { key: ViewMode; label: string; icon: React.ElementType; description: string }[] = [
  { key: "hero", label: "Hero", icon: PanelsTopLeft, description: "Featured camera + sidebar of all cams" },
  { key: "wall", label: "Wall", icon: LayoutGrid, description: "Uniform grid for all cameras" },
];

/* ── Visitor analytics ───────────────────────────────────────────────── */

/** People already inside when counting started, per the entry-line spec. */
const BASELINE_INSIDE = 100;

interface VisitorStats {
  entries: number;
  exits: number;
  inside: number;
  male: number;
  female: number;
  adult: number;
  child: number;
}

function seedOf(id: string): number {
  return id.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

/**
 * Entry-line counts rolled up from whichever cameras are in view, so the strip
 * answers for the current site filter rather than the whole estate. Seeded from
 * the camera id, so a given selection always reports the same numbers.
 */
function visitorStats(cameras: CameraData[]): VisitorStats {
  let entries = 0;
  let exits = 0;
  let male = 0;
  let adult = 0;

  cameras
    .filter((c) => c.status === "online")
    .forEach((c) => {
      const seed = seedOf(c.id);
      const inCount = 18 + (seed % 44);
      const outCount = Math.max(0, inCount - 4 + (seed % 9));
      entries += inCount;
      exits += outCount;
      // Gender and age are classified per entry, so both splits total the entries.
      male += Math.round(inCount * (0.46 + (seed % 13) / 100));
      adult += Math.round(inCount * (0.66 + (seed % 11) / 100));
    });

  return {
    entries,
    exits,
    inside: Math.max(0, BASELINE_INSIDE + entries - exits),
    male,
    female: entries - male,
    adult,
    child: entries - adult,
  };
}

/* A split count reads as a fraction inside a KPI card — "168 / 163" looks like
   168 out of 163, not two categories. These cards name each side, give it its
   own colour, and show the balance as a bar. */

type StatTone = "primary" | "success" | "warning" | "info" | "purple";

const TONE_VALUE: Record<StatTone, string> = {
  primary: "text-foreground",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
  purple: "text-purple",
};

const TONE_BAR: Record<StatTone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
  purple: "bg-purple",
};

function StatShell({ label, meta, accent, children }: {
  label: string;
  meta?: React.ReactNode;
  accent: StatTone;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[132px] flex-col overflow-hidden rounded-xl border border-border bg-card p-4">
      <div className={cn("absolute inset-x-0 top-0 h-0.5", TONE_BAR[accent])} />
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        {meta && <span className="shrink-0 font-mono text-2xs text-muted-foreground">{meta}</span>}
      </div>
      {children}
    </div>
  );
}

function SingleStat({ label, value, sub, accent }: {
  label: string; value: number; sub: string; accent: StatTone;
}) {
  return (
    <StatShell label={label} accent={accent}>
      <p className={cn("text-4xl font-bold leading-none", TONE_VALUE[accent])}>{value}</p>
      <p className="mt-auto pt-2 text-xs leading-tight text-muted-foreground">{sub}</p>
    </StatShell>
  );
}

interface StatPart {
  label: string;
  value: number;
  tone: StatTone;
}

function SplitStat({ label, parts }: { label: string; parts: [StatPart, StatPart] }) {
  const total = parts[0].value + parts[1].value;
  const share = (v: number) => (total === 0 ? 50 : (v / total) * 100);

  return (
    <StatShell label={label} accent={parts[0].tone} meta={`${total} total`}>
      <div className="flex items-stretch gap-3">
        {parts.map((part, i) => (
          <div key={part.label} className={cn("min-w-0 flex-1", i === 1 && "border-l border-border pl-3")}>
            <p className={cn("flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider", TONE_VALUE[part.tone])}>
              <span className={cn("size-1.5 shrink-0 rounded-full", TONE_BAR[part.tone])} />
              {part.label}
            </p>
            <p className={cn("mt-0.5 text-2xl font-bold leading-none", TONE_VALUE[part.tone])}>{part.value}</p>
          </div>
        ))}
      </div>

      {/* The balance, so the split reads without doing the arithmetic. */}
      <div className="mt-auto flex h-1.5 overflow-hidden rounded-full bg-muted">
        {parts.map((part) => (
          <span key={part.label} className={cn("h-full", TONE_BAR[part.tone])} style={{ width: `${share(part.value)}%` }} />
        ))}
      </div>
      <p className="mt-1.5 flex justify-between text-2xs text-muted-foreground">
        <span>{Math.round(share(parts[0].value))}%</span>
        <span>{Math.round(share(parts[1].value))}%</span>
      </p>
    </StatShell>
  );
}

function VisitorKpis({ stats }: { stats: VisitorStats }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <SingleStat
        label="Visitors Inside"
        value={stats.inside}
        sub={`${BASELINE_INSIDE} at start-up + entries − exits`}
        accent="primary"
      />
      <SplitStat
        label="Visitor Count"
        parts={[
          { label: "Entries", value: stats.entries, tone: "success" },
          { label: "Exits", value: stats.exits, tone: "warning" },
        ]}
      />
      <SplitStat
        label="Gender"
        parts={[
          { label: "Male", value: stats.male, tone: "info" },
          { label: "Female", value: stats.female, tone: "purple" },
        ]}
      />
      <SplitStat
        label="Age Group"
        parts={[
          { label: "Adult", value: stats.adult, tone: "warning" },
          { label: "Child", value: stats.child, tone: "info" },
        ]}
      />
    </div>
  );
}

/* ── Camera tile ─────────────────────────────────────────────────────── */

function CameraTile({
  camera,
  size = "md",
  checked,
  onToggleCheck,
  active,
  onActivate,
  pb,
  onPb,
  now,
  syncing,
  onExpand,
}: {
  camera: CameraData;
  size?: "sm" | "md" | "lg";
  checked: boolean;
  onToggleCheck: () => void;
  active?: boolean;
  onActivate?: () => void;
  pb: PlaybackState;
  onPb: (next: Partial<PlaybackState>) => void;
  now: Date;
  /** Driven by the shared synchronised-playback bar. */
  syncing?: boolean;
  /** Set on tiles too small to zoom inside — swaps zoom for an expand button. */
  onExpand?: () => void;
}) {
  const isOnline = camera.status === "online";
  const count = detCount(camera.id);
  const compact = size === "sm";
  const [zoomArmed, setZoomArmed] = React.useState(false);
  const live = pb.offsetSec <= 0;

  return (
    <div
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-lg border bg-neutral-950 text-left transition-all",
        checked
          ? "border-primary shadow-[0_0_0_2px_var(--primary)]"
          : active
            ? "border-primary/70"
            : "border-border hover:border-primary/40"
      )}
    >
      <div className="relative aspect-video w-full flex-1 overflow-hidden">
        {isOnline ? (
          <>
            {/* Zoom magnifies around the focal point the operator scrolled to. */}
            <div
              className="absolute inset-0 origin-top-left transition-transform duration-[var(--duration-normal)] ease-standard"
              style={{ background: TILE_GRADIENT, transform: zoomTransform(pb.zoom) }}
            />
            {count > 0 && !isZoomed(pb.zoom) && (
              <div
                className={cn("absolute border-[1.5px]", count > 2 ? "border-warning" : "border-info")}
                style={{ left: "38%", top: "36%", width: "22%", height: "32%" }}
              />
            )}
            {onActivate && (
              <button
                type="button"
                aria-label={`Show ${camera.id} in the main view`}
                onClick={onActivate}
                className="absolute inset-0 z-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-neutral-950/95 text-sev-critical/80">
            <AlertTriangle className="size-5" />
            <span className="text-2xs font-bold uppercase tracking-widest">Offline</span>
          </div>
        )}

        {/* Selection checkbox — revealed on hover, pinned open once checked. */}
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          aria-label={`Select ${camera.id} for synchronised playback`}
          onClick={(e) => { e.stopPropagation(); onToggleCheck(); }}
          className={cn(
            "absolute left-2 top-2 z-20 flex size-5 items-center justify-center rounded border backdrop-blur-sm transition-opacity duration-[var(--duration-fast)] ease-standard",
            checked
              ? "border-primary bg-primary opacity-100"
              : "border-white/60 bg-black/50 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          )}
        >
          {checked && <Check className="size-3 text-primary-foreground" strokeWidth={3} />}
        </button>

        {isOnline && (
          <span
            className={cn(
              "absolute top-2 z-10 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-3xs font-bold uppercase tracking-widest text-white transition-all",
              live ? "bg-sev-critical/95" : "bg-black/70",
              checked ? "left-9" : "left-2 group-hover:left-9"
            )}
          >
            {live ? "Live" : "Playback"}
          </span>
        )}

        {count > 0 && (
          <span className="absolute right-2 top-2 z-10 inline-flex size-5 items-center justify-center rounded-full bg-warning text-2xs font-bold text-neutral-900">
            {count}
          </span>
        )}

        <span className={cn(
          "absolute bottom-2 left-2 z-10 rounded bg-black/60 px-1.5 py-0.5 font-mono text-white/90 backdrop-blur-sm transition-opacity group-hover:opacity-0",
          compact ? "text-3xs" : "text-2xs",
          !live && "opacity-0"
        )}>
          {camera.id}
        </span>

        {zoomArmed && (
          <ZoomSurface
            zoom={pb.zoom}
            onChange={(z) => onPb({ zoom: z })}
            onExit={() => setZoomArmed(false)}
            compact={compact}
          />
        )}

        {/* Player bar — on hover, or whenever this tile has left the live edge. */}
        {isOnline && (
          <div className={cn(
            "opacity-0 transition-opacity duration-[var(--duration-fast)] ease-standard group-hover:opacity-100 focus-within:opacity-100",
            (!live || syncing) && "opacity-100"
          )}>
            <TilePlayerBar
              camera={camera}
              pb={pb}
              onChange={onPb}
              now={now}
              compact={compact}
              readOnly={syncing}
              zoomArmed={zoomArmed}
              onArmZoom={() => setZoomArmed(true)}
              onExitZoom={() => setZoomArmed(false)}
              onExpand={onExpand}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Hero view ───────────────────────────────────────────────────────── */

function CategoryChip({ label, count, active, muted }: { label: string; count: number; active?: boolean; muted?: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-2xs font-semibold",
      active ? "border-primary/40 bg-primary/15 text-primary"
        : muted ? "border-border bg-muted text-muted-foreground"
          : "border-warning/30 bg-warning/15 text-warning"
    )}>
      {label} <strong>{count}</strong>
    </span>
  );
}

function HeroView({
  cameras, selectedCameraId, setSelectedCameraId, checkedIds, onToggleCheck, pbFor, setPb, now,
}: {
  cameras: CameraData[];
  selectedCameraId: string;
  setSelectedCameraId: (id: string) => void;
  checkedIds: string[];
  onToggleCheck: (id: string) => void;
  pbFor: (id: string) => PlaybackState;
  setPb: (id: string, next: Partial<PlaybackState>) => void;
  now: Date;
}) {
  const [zoomArmed, setZoomArmed] = React.useState(false);
  /* The sidebar tile the operator expanded, if any. Held as an id so a filter
     that drops the camera closes the pop-up with it. */
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const camera = cameras.find((c) => c.id === selectedCameraId) ?? cameras[0];
  if (!camera) return null;

  const pb = pbFor(camera.id);
  const live = pb.offsetSec <= 0;
  const checked = checkedIds.includes(camera.id);

  const bySite = cameras.reduce<Record<string, { siteName: string; areas: Record<string, { areaName: string; cams: CameraData[] }> }>>((acc, c) => {
    if (!acc[c.siteId]) acc[c.siteId] = { siteName: c.siteName, areas: {} };
    if (!acc[c.siteId].areas[c.areaId]) acc[c.siteId].areas[c.areaId] = { areaName: c.areaName, cams: [] };
    acc[c.siteId].areas[c.areaId].cams.push(c);
    return acc;
  }, {});

  const onlineCount = cameras.filter((c) => c.status === "online").length;
  const offlineCount = cameras.length - onlineCount;
  const multiSite = Object.keys(bySite).length > 1;
  const expanded = cameras.find((c) => c.id === expandedId) ?? null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="group relative aspect-[16/9] w-full overflow-hidden bg-neutral-950">
            <div
              className="absolute inset-0 origin-top-left transition-transform duration-[var(--duration-normal)] ease-standard"
              style={{ background: TILE_GRADIENT, transform: zoomTransform(pb.zoom) }}
            />
            {zoomArmed && (
              <ZoomSurface
                zoom={pb.zoom}
                onChange={(z) => setPb(camera.id, { zoom: z })}
                onExit={() => setZoomArmed(false)}
              />
            )}
            <button
              type="button"
              role="checkbox"
              aria-checked={checked}
              aria-label={`Select ${camera.id} for synchronised playback`}
              onClick={() => onToggleCheck(camera.id)}
              className={cn(
                "absolute left-3 top-3 z-20 flex size-5 items-center justify-center rounded border backdrop-blur-sm transition-opacity",
                checked ? "border-primary bg-primary opacity-100"
                  : "border-white/60 bg-black/50 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              )}
            >
              {checked && <Check className="size-3 text-primary-foreground" strokeWidth={3} />}
            </button>
            <span className={cn(
              "absolute top-3 z-10 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-2xs font-bold uppercase tracking-widest text-white transition-all",
              live ? "bg-sev-critical/95" : "bg-black/70",
              checked ? "left-10" : "left-3 group-hover:left-10"
            )}>
              {live && <span className="size-1.5 animate-pulse rounded-full bg-white" />}
              {live ? "Live" : "Playback"}
            </span>
            <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-0.5 font-mono text-2xs text-white/85 backdrop-blur-sm">
              {camera.id} · <span className="inline-flex items-center gap-1 text-sev-critical"><span className="size-1.5 animate-pulse rounded-full bg-sev-critical" />REC</span> · <span className="text-info">AI</span>
            </span>
            <div className="absolute bottom-16 left-3 z-10 rounded bg-black/60 px-2 py-1 font-mono text-xs text-white/90 backdrop-blur-sm">
              {new Date(now.getTime() - pb.offsetSec * 1000)
                .toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })
                .replace(",", " ·")}
            </div>
            <TilePlayerBar
              camera={camera}
              pb={pb}
              onChange={(n) => setPb(camera.id, n)}
              now={now}
              zoomArmed={zoomArmed}
              onArmZoom={() => setZoomArmed(true)}
              onExitZoom={() => setZoomArmed(false)}
            />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3">
            <div className="min-w-0">
              <TruncatedText text={`${camera.siteName} · ${camera.id}`} className="text-md font-bold text-foreground" />
              <TruncatedText
                text={`${camera.areaName} · ${camera.stream.resolution} · ${camera.stream.frameRate}fps · accel-vms v4.2.1 active`}
                className="text-xs text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-2">
              {!live && (
                <span className="rounded-md border border-warning/30 bg-warning/10 px-2 py-1 font-mono text-2xs font-semibold text-warning">
                  −{fmtOffset(pb.offsetSec)} · {timestampAt(now, pb.offsetSec)}
                </span>
              )}
              <Button variant="outline" size="sm" className="gap-1.5" disabled={live}
                onClick={() => setPb(camera.id, { offsetSec: 0, playing: true })}>
                <Radio className="size-3.5" />
                Go live
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="flex max-h-[calc(100vh-12rem)] flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex-shrink-0 border-b border-border px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Cameras {multiSite ? `· ${Object.keys(bySite).length} sites` : `· ${Object.values(bySite)[0]?.siteName ?? ""}`}
            </p>
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">{cameras.length}</strong> · <strong className="text-success">{onlineCount}</strong> on
              {offlineCount > 0 && <> · <strong className="text-sev-critical">{offlineCount}</strong> off</>}
            </p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <CategoryChip label="All" count={cameras.length} active />
            <CategoryChip label="Incident Detected" count={cameras.filter((c) => detCount(c.id) > 0).length} />
            <CategoryChip label="Offline" count={offlineCount} muted />
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
          {Object.entries(bySite).map(([siteId, siteData]) => (
            <div key={siteId} className="space-y-1.5">
              {Object.entries(siteData.areas).map(([areaKey, group]) => (
                <details key={areaKey} open className="group/area">
                  <summary className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-1.5 py-1.5 hover:bg-muted">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <ChevronDown className="size-3 -rotate-90 transition-transform group-open/area:rotate-0" />
                        {group.areaName}
                      </p>
                      <p className="ml-4 inline-flex items-center gap-0.5 text-2xs text-muted-foreground">
                        <MapPin className="size-2.5" />
                        {siteData.siteName}
                      </p>
                    </div>
                    <span className="text-2xs text-muted-foreground">{group.cams.length}</span>
                  </summary>
                  <div className="mt-1 grid grid-cols-2 gap-1.5">
                    {group.cams.map((c) => (
                      <CameraTile
                        key={c.id}
                        camera={c}
                        size="sm"
                        checked={checkedIds.includes(c.id)}
                        onToggleCheck={() => onToggleCheck(c.id)}
                        active={c.id === camera.id}
                        onActivate={() => setSelectedCameraId(c.id)}
                        pb={pbFor(c.id)}
                        onPb={(n) => setPb(c.id, n)}
                        now={now}
                        onExpand={() => setExpandedId(c.id)}
                      />
                    ))}
                  </div>
                </details>
              ))}
            </div>
          ))}
        </div>
      </div>

      <CameraPlayerModal
        camera={expanded}
        open={!!expanded}
        onClose={() => setExpandedId(null)}
        pb={expanded ? pbFor(expanded.id) : LIVE_STATE}
        onPb={(n) => expanded && setPb(expanded.id, n)}
        now={now}
      />
    </div>
  );
}

/* ── Wall view ───────────────────────────────────────────────────────── */

function WallView({
  cameras, gridSize, setGridSize, page, setPage, checkedIds, onToggleCheck, pbFor, setPb, now,
}: {
  cameras: CameraData[];
  gridSize: number; setGridSize: (n: number) => void;
  page: number; setPage: (n: number) => void;
  checkedIds: string[]; onToggleCheck: (id: string) => void;
  pbFor: (id: string) => PlaybackState;
  setPb: (id: string, next: Partial<PlaybackState>) => void;
  now: Date;
}) {
  /* Same story as the hero sidebar: a wall tile is too small to zoom inside,
     so it expands into the pop-up player instead. */
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const total = cameras.length;
  const perPage = gridSize * gridSize;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const pageItems = cameras.slice((page - 1) * perPage, page * perPage);
  const expanded = cameras.find((c) => c.id === expandedId) ?? null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-base font-semibold text-foreground">
          Wall view · Cameras {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
        </p>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} aria-label="Previous page"
            className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40">
            <ChevronLeft className="size-3.5" />
          </button>
          <button onClick={() => setPage(Math.min(pageCount, page + 1))} disabled={page === pageCount} aria-label="Next page"
            className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40">
            <ChevronRight className="size-3.5" />
          </button>
          <Select value={String(gridSize)} onValueChange={(v) => { setGridSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="h-7 w-auto"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2×2 grid (4)</SelectItem>
              <SelectItem value="3">3×3 grid (9)</SelectItem>
              <SelectItem value="4">4×4 grid (16)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
        {pageItems.map((c) => (
          <CameraTile
            key={c.id}
            camera={c}
            size={gridSize > 3 ? "sm" : "md"}
            checked={checkedIds.includes(c.id)}
            onToggleCheck={() => onToggleCheck(c.id)}
            pb={pbFor(c.id)}
            onPb={(n) => setPb(c.id, n)}
            now={now}
            onExpand={() => setExpandedId(c.id)}
          />
        ))}
        {Array.from({ length: Math.max(0, perPage - pageItems.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-video rounded-lg border border-dashed border-border bg-muted/20" />
        ))}
      </div>

      <CameraPlayerModal
        camera={expanded}
        open={!!expanded}
        onClose={() => setExpandedId(null)}
        pb={expanded ? pbFor(expanded.id) : LIVE_STATE}
        onPb={(n) => expanded && setPb(expanded.id, n)}
        now={now}
      />
    </div>
  );
}

/* ── Synchronised grid (after Playback settings is opened) ───────────── */

function SyncGrid({
  cameras, pb, onPb, now, onToggleCheck,
}: {
  cameras: CameraData[];
  pb: PlaybackState;
  onPb: (next: Partial<PlaybackState>) => void;
  now: Date;
  onToggleCheck: (id: string) => void;
}) {
  const cols = cameras.length === 1 ? 1 : cameras.length <= 4 ? 2 : 3;
  return (
    <div className="rounded-xl border border-primary/40 bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-base font-semibold text-foreground">
            Synchronised playback · {cameras.length} camera{cameras.length === 1 ? "" : "s"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Every channel moves together — scrubbing and speed apply to all of them at once.
          </p>
        </div>
        <span className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-2xs font-semibold",
          pb.offsetSec <= 0 ? "border-sev-critical/40 bg-sev-critical/10 text-sev-critical" : "border-warning/30 bg-warning/10 text-warning"
        )}>
          <span className={cn("size-1.5 rounded-full", pb.offsetSec <= 0 ? "animate-pulse bg-sev-critical" : "bg-warning")} />
          {pb.offsetSec <= 0 ? "LIVE" : `−${fmtOffset(pb.offsetSec)} · ${timestampAt(now, pb.offsetSec)}`}
        </span>
      </div>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {cameras.map((c) => (
          <CameraTile
            key={c.id}
            camera={c}
            size={cols > 2 ? "sm" : "md"}
            checked
            onToggleCheck={() => onToggleCheck(c.id)}
            pb={pb}
            onPb={onPb}
            now={now}
            syncing
          />
        ))}
      </div>
    </div>
  );
}

/* ── Bottom bars ─────────────────────────────────────────────────────── */

function SelectionBar({ count, onClear, onOpenPlayback }: { count: number; onClear: () => void; onOpenPlayback: () => void }) {
  if (count === 0) return null;
  return (
    <FloatingBar className="flex flex-wrap items-center gap-3 rounded-xl border border-primary bg-card px-4 py-3 shadow-[0_16px_48px_hsl(var(--primary)/0.25)]">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CheckSquare className="size-3.5" />
        </div>
        <span className="text-base font-semibold text-foreground">
          {count} camera{count > 1 ? "s" : ""} selected
        </span>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={onClear}>
          <X className="size-3.5" />
          Clear selection
        </Button>
        <div className="mx-1 h-4 w-px bg-border" />
        <Button size="sm" className="gap-1.5" onClick={onOpenPlayback}>
          <SlidersHorizontal className="size-3.5" />
          Playback settings
        </Button>
      </div>
    </FloatingBar>
  );
}

function SyncPlaybackBar({
  count, pb, onChange, now, onExit,
}: {
  count: number;
  pb: PlaybackState;
  onChange: (next: Partial<PlaybackState>) => void;
  now: Date;
  onExit: () => void;
}) {
  const live = pb.offsetSec <= 0;
  return (
    <FloatingBar className="rounded-xl border border-primary bg-card px-4 py-3 shadow-[0_16px_48px_hsl(var(--primary)/0.25)]">
      {/* Shared timeline */}
      <div className="flex items-center gap-3">
        <span className="shrink-0 font-mono text-2xs text-muted-foreground">−06:00:00</span>
        <div className="flex-1 rounded-md bg-neutral-950 px-2 py-2">
          <ScrubTrack offsetSec={pb.offsetSec} onChange={(v) => onChange({ offsetSec: v })} now={now} label="Synchronised playback position" />
        </div>
        <span className="shrink-0 font-mono text-2xs text-muted-foreground">LIVE</span>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <SlidersHorizontal className="size-3.5" />
          </div>
          <div className="leading-tight">
            <p className="text-base font-semibold text-foreground">{count} camera{count > 1 ? "s" : ""} in sync</p>
            <p className="font-mono text-2xs text-muted-foreground">
              {live ? "At the live edge" : `−${fmtOffset(pb.offsetSec)} · ${timestampAt(now, pb.offsetSec)}`}
            </p>
          </div>
        </div>

        {/* Transport */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button aria-label="Back 30 seconds"
                onClick={() => onChange({ offsetSec: Math.min(BUFFER_SEC, pb.offsetSec + 30) })}
                className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted">
                <RotateCcw className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Back 30s</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button aria-label={pb.playing ? "Pause all" : "Play all"}
                onClick={() => onChange({ playing: !pb.playing })}
                className="flex size-8 items-center justify-center rounded-md border border-primary bg-primary text-primary-foreground hover:opacity-90">
                {pb.playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{pb.playing ? "Pause all" : "Play all"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button aria-label="Forward 30 seconds" disabled={live}
                onClick={() => onChange({ offsetSec: Math.max(0, pb.offsetSec - 30) })}
                className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted disabled:opacity-40">
                <RotateCw className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Forward 30s</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button aria-label={pb.muted ? "Unmute" : "Mute"}
                onClick={() => onChange({ muted: !pb.muted })}
                className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted">
                {pb.muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{pb.muted ? "Unmute" : "Mute"}</TooltipContent>
          </Tooltip>
        </div>

        {/* Speed — zoom stays per-tile, since each operator frames their own area. */}
        <div className="flex items-center gap-1.5">
          <label className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Speed</label>
          <Select value={String(pb.speed)} onValueChange={(v) => onChange({ speed: Number(v) })}>
            <SelectTrigger className="h-8 w-auto" aria-label="Playback speed"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SPEEDS.map((s) => <SelectItem key={s} value={String(s)}>{s}×</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="gap-1.5" disabled={live}
            onClick={() => onChange({ offsetSec: 0, playing: true, speed: 1 })}>
            <Radio className="size-3.5" />
            Go live
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={onExit}>
            <X className="size-3.5" />
            Exit playback
          </Button>
        </div>
      </div>
    </FloatingBar>
  );
}

/* ── Site selector ───────────────────────────────────────────────────── */

function MultiSiteSelector({ sites, selected, onChange }: {
  sites: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const isAll = selected.length === 0 || selected.length === sites.length;
  const display = isAll
    ? "All Sites"
    : selected.length === 1 ? sites.find((s) => s.id === selected[0])?.name ?? "1 site"
      : `${selected.length} sites`;

  function toggle(id: string) {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else onChange([...selected, id]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn(
          "inline-flex h-9 items-center justify-between gap-2 rounded-md border bg-background pl-3 pr-2 text-base font-semibold transition-colors",
          open ? "border-primary" : "border-input",
          isAll ? "text-muted-foreground" : "text-foreground"
        )} style={{ minWidth: "160px" }}>
          {display}
          <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-[280px] w-56 overflow-y-auto p-1.5">
        <button onClick={() => onChange([])}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-base text-muted-foreground hover:bg-muted hover:text-foreground">
          <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
            isAll ? "border-primary bg-primary" : "border-muted-foreground/40")}>
            {isAll && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
          </div>
          All Sites
        </button>
        <div className="my-1 border-t border-border" />
        {sites.map((s) => {
          const checked = !isAll && selected.includes(s.id);
          return (
            <button key={s.id} onClick={() => toggle(s.id)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-base text-muted-foreground hover:bg-muted hover:text-foreground">
              <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                checked ? "border-primary bg-primary" : "border-muted-foreground/40")}>
                {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
              </div>
              {s.name}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export function SyncPlaybackMonitoring() {
  const allCameras = useCamerasStore((s) => s.cameras);
  const sites = useSitesStore((s) => s.sites);

  const [siteFilter, setSiteFilter] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("");
  const [viewMode, setViewMode] = React.useState<ViewMode>("hero");
  const [gridSize, setGridSize] = React.useState(4);
  const [page, setPage] = React.useState(1);
  const [selectedCameraId, setSelectedCameraId] = React.useState("");

  const [checkedIds, setCheckedIds] = React.useState<string[]>([]);
  const [syncMode, setSyncMode] = React.useState(false);
  const [syncPb, setSyncPb] = React.useState<PlaybackState>(LIVE_STATE);
  const [tilePb, setTilePb] = React.useState<Record<string, PlaybackState>>({});

  /* One clock for every tile — synchronised playback only means anything if
     all channels read from the same time base. */
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const pbFor = React.useCallback((id: string) => tilePb[id] ?? LIVE_STATE, [tilePb]);
  const setPb = React.useCallback((id: string, next: Partial<PlaybackState>) => {
    setTilePb((curr) => ({ ...curr, [id]: { ...(curr[id] ?? LIVE_STATE), ...next } }));
  }, []);

  function toggleCheck(id: string) {
    setCheckedIds((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]));
  }

  const filteredCameras = React.useMemo(() => {
    return allCameras
      .filter((c) => {
        if (siteFilter.length > 0 && !siteFilter.includes(c.siteId)) return false;
        if (search) {
          const q = search.toLowerCase();
          if (![c.id, c.name, c.areaName, c.siteName].join(" ").toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [allCameras, siteFilter, search]);

  /* The hero camera is derived, not stored — a filter that hides the current
     pick falls through to the first match rather than needing a sync effect. */
  const heroCameraId =
    filteredCameras.find((c) => c.id === selectedCameraId)?.id ?? filteredCameras[0]?.id ?? "";

  const checkedCameras = filteredCameras.filter((c) => checkedIds.includes(c.id));
  /* Clearing the selection drops straight back out of playback mode. */
  const inSync = syncMode && checkedCameras.length > 0;
  const onlineCount = filteredCameras.filter((c) => c.status === "online").length;
  const stats = React.useMemo(() => visitorStats(filteredCameras), [filteredCameras]);
  const siteLabel = siteFilter.length === 1 ? sites.find((s) => s.id === siteFilter[0])?.name ?? "" : "All sites";

  return (
    <div className={cn("flex flex-col gap-4", checkedIds.length > 0 && (inSync ? "pb-44" : "pb-24"))}>
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Live Monitoring</PageHeader.Title>
          <PageHeader.Description>
            Real-time camera feeds across all sites — select cameras from any view and scrub them
            back together while the feed keeps running.
          </PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          {/* View mode is about the page, not the camera list — it sits with the title. */}
          <div data-slot="button-group" className="flex items-center rounded-lg border border-border bg-background p-0.5">
            {VIEW_MODES.map((vm) => {
              const Icon = vm.icon;
              const active = viewMode === vm.key;
              return (
                <button key={vm.key} onClick={() => setViewMode(vm.key)} title={vm.description} disabled={inSync}
                  className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-40",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                  <Icon className="size-3.5" />
                  {vm.label}
                </button>
              );
            })}
          </div>
        </PageHeader.Actions>
      </PageHeader>

      {/* Counts answer for what is on screen, so they sit above the filters. */}
      <VisitorKpis stats={stats} />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
        <MultiSiteSelector sites={sites.map((s) => ({ id: s.id, name: s.name }))} selected={siteFilter} onChange={setSiteFilter} />
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${filteredCameras.length} cameras…`}
            className="h-9 w-full border-0 bg-transparent pl-9 text-base focus-visible:ring-0" />
        </div>
        {checkedIds.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
            <CheckSquare className="size-3" />
            {checkedIds.length} selected
          </span>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
        <strong className="text-foreground">{siteLabel}</strong> · {filteredCameras.length} cameras total · {onlineCount} online
        {inSync && <> · <strong className="text-primary">{checkedCameras.length} in synchronised playback</strong></>}
      </div>

      {inSync ? (
        <SyncGrid
          cameras={checkedCameras}
          pb={syncPb}
          onPb={(n) => setSyncPb((c) => ({ ...c, ...n }))}
          now={now}
          onToggleCheck={toggleCheck}
        />
      ) : viewMode === "hero" ? (
        <HeroView
          cameras={filteredCameras}
          selectedCameraId={heroCameraId}
          setSelectedCameraId={setSelectedCameraId}
          checkedIds={checkedIds}
          onToggleCheck={toggleCheck}
          pbFor={pbFor}
          setPb={setPb}
          now={now}
        />
      ) : (
        <WallView
          cameras={filteredCameras}
          gridSize={gridSize} setGridSize={setGridSize}
          page={page} setPage={setPage}
          checkedIds={checkedIds} onToggleCheck={toggleCheck}
          pbFor={pbFor} setPb={setPb} now={now}
        />
      )}

      {inSync ? (
        <SyncPlaybackBar
          count={checkedCameras.length}
          pb={syncPb}
          onChange={(n) => setSyncPb((c) => ({ ...c, ...n }))}
          now={now}
          onExit={() => setSyncMode(false)}
        />
      ) : (
        <SelectionBar
          count={checkedIds.length}
          onClear={() => { setCheckedIds([]); setSyncMode(false); }}
          onOpenPlayback={() => setSyncMode(true)}
        />
      )}
    </div>
  );
}
