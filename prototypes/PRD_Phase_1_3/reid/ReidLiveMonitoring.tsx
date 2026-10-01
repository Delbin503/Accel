/* Model (Re-ID) Module — Live Monitoring.

   Its own copy of the Phase 1.3 Live Monitoring (SyncPlaybackMonitoring.tsx),
   so the Re-ID module can change without touching the Phase 1.3 proposal.
   Shared building blocks (players, playback controls, visitor stats) are still
   imported from the Phase 1.3 folder. */

import * as React from "react";
import {
  AlertTriangle,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  LayoutGrid,
  MapPin,
  PanelRightClose,
  PanelRightOpen,
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
} from "../playback";
import { ScrubTrack, ZoomSurface } from "../playbackControls";
import { CameraPlayerModal, TILE_GRADIENT, TilePlayerBar } from "../cameraPlayer";
import { FloatingBar } from "../FloatingBar";
import { mapForCamera, mapLabel, useReidMapsStore } from "./reidMaps";
import { allTrackStates, type TrackState } from "./weaponTracks";
import { MapExpandModal, TrackingPanel, WeaponBadges } from "./ReidTracking";

/* Live Monitoring, rebuilt for the Phase 1.3 synchronised-playback proposal,
   laid out as one camera wall: sites · grid view · search, then the grid,
   with an optional Cameras & Tracking panel on the right.

   Two things are new against the shipped page:
   1. Every tile is selectable — hovering reveals a checkbox, and a selection
      bar collects what you picked, matching the pattern on Detection Feed.
   2. Every tile is scrubbable — hovering reveals a player bar with a draggable
      timeline, a LIVE tag and a settings dropdown. Pull the timeline back and
      that tile leaves the live edge on its own; open Playback settings from the
      selection bar and the whole selection moves together instead. */

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
  overlay,
  "data-panel-camera": panelAnchor,
}: {
  /** Lets the side panel scroll a picked camera into view. */
  "data-panel-camera"?: string;
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
  /** Re-ID weapon badges, stacked under the detection count. */
  overlay?: React.ReactNode;
}) {
  const isOnline = camera.status === "online";
  const count = detCount(camera.id);
  const compact = size === "sm";
  const [zoomArmed, setZoomArmed] = React.useState(false);
  const live = pb.offsetSec <= 0;

  return (
    <div
      data-panel-camera={panelAnchor}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-lg border bg-neutral-950 text-left transition-all",
        checked
          ? "border-primary shadow-[0_0_0_2px_var(--primary)]"
          : active
            ? "border-primary shadow-[0_0_0_1px_var(--primary)]"
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
                aria-label={`Pick ${camera.id} — outline it on the wall and show its Re-ID map`}
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

        {overlay && <div className="absolute right-2 top-8 z-20 flex flex-col items-end gap-1">{overlay}</div>}

        <span className={cn(
          "absolute bottom-2 left-2 z-10 rounded px-1.5 py-0.5 font-mono backdrop-blur-sm transition-opacity group-hover:opacity-0",
          active ? "bg-primary font-semibold text-primary-foreground" : "bg-black/60 text-white/90",
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

/* ── Camera wall ─────────────────────────────────────────────────────── */

/** "auto" fits as many tiles across as the width allows; N is an N×N page. */
type GridOption = "auto" | "1" | "2" | "3" | "4";

const GRID_OPTIONS: { value: GridOption; label: string }[] = [
  { value: "auto", label: "Auto · fit to width" },
  { value: "1", label: "1×1" },
  { value: "2", label: "2×2" },
  { value: "3", label: "3×3" },
  { value: "4", label: "4×4" },
];

function CameraWall({
  cameras, grid, page, activeId, onActivate, checkedIds, onToggleCheck, pbFor, setPb, now, badgesFor,
}: {
  cameras: CameraData[];
  grid: GridOption;
  page: number;
  /** The camera picked in the side panel, or the one the highlighted weapon is in. */
  activeId: string | null;
  onActivate: (id: string) => void;
  checkedIds: string[]; onToggleCheck: (id: string) => void;
  pbFor: (id: string) => PlaybackState;
  setPb: (id: string, next: Partial<PlaybackState>) => void;
  now: Date;
  badgesFor: (cameraId: string) => React.ReactNode;
}) {
  /* Small tiles are too small to zoom inside, so they expand into the pop-up player instead. */
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const expanded = cameras.find((c) => c.id === expandedId) ?? null;

  const n = grid === "auto" ? 0 : Number(grid);
  const perPage = n ? n * n : cameras.length;
  const pageItems = n ? cameras.slice((page - 1) * perPage, page * perPage) : cameras;
  const size = n === 1 ? "lg" : n === 2 ? "md" : "sm";

  if (cameras.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-muted-foreground">
        <Search className="size-5" />
        <p className="text-sm">No cameras match these filters.</p>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "grid gap-3",
          n === 0 && "grid-cols-[repeat(auto-fill,minmax(220px,1fr))]",
          n === 1 && "grid-cols-1",
          n === 2 && "grid-cols-1 sm:grid-cols-2",
          n === 3 && "grid-cols-2 lg:grid-cols-3",
          n === 4 && "grid-cols-2 lg:grid-cols-4"
        )}
      >
        {pageItems.map((c) => (
          <div key={c.id} data-wall-camera={c.id} className="scroll-mt-4">
            <CameraTile
              camera={c}
              size={size}
              checked={checkedIds.includes(c.id)}
              onToggleCheck={() => onToggleCheck(c.id)}
              active={c.id === activeId}
              onActivate={() => onActivate(c.id)}
              pb={pbFor(c.id)}
              onPb={(next) => setPb(c.id, next)}
              now={now}
              onExpand={n === 1 ? undefined : () => setExpandedId(c.id)}
              overlay={badgesFor(c.id)}
            />
          </div>
        ))}
        {/* A fixed grid keeps its shape on the last page. */}
        {n > 1 &&
          Array.from({ length: Math.max(0, perPage - pageItems.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-video rounded-lg border border-dashed border-border bg-muted/20" />
          ))}
      </div>

      <CameraPlayerModal
        camera={expanded}
        open={!!expanded}
        onClose={() => setExpandedId(null)}
        pb={expanded ? pbFor(expanded.id) : LIVE_STATE}
        onPb={(next) => expanded && setPb(expanded.id, next)}
        now={now}
      />
    </>
  );
}

/* ── Side panel — Cameras & Tracking ─────────────────────────────────── */

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

type PanelTab = "cameras" | "tracking";

function SidePanel({
  cameras, activeId, onActivate, tab, setTab, trackCount, trackingPanel,
  checkedIds, onToggleCheck, pbFor, setPb, now, badgesFor,
}: {
  cameras: CameraData[];
  activeId: string | null;
  onActivate: (id: string) => void;
  tab: PanelTab;
  setTab: (t: PanelTab) => void;
  trackCount: number;
  trackingPanel: React.ReactNode;
  checkedIds: string[];
  onToggleCheck: (id: string) => void;
  pbFor: (id: string) => PlaybackState;
  setPb: (id: string, next: Partial<PlaybackState>) => void;
  now: Date;
  badgesFor: (cameraId: string) => React.ReactNode;
}) {
  /* Panel tiles are too small to zoom inside, so they expand into the pop-up player. */
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const expanded = cameras.find((c) => c.id === expandedId) ?? null;

  const bySite = cameras.reduce<Record<string, { siteName: string; areas: Record<string, { areaName: string; cams: CameraData[] }> }>>((acc, c) => {
    if (!acc[c.siteId]) acc[c.siteId] = { siteName: c.siteName, areas: {} };
    if (!acc[c.siteId].areas[c.areaId]) acc[c.siteId].areas[c.areaId] = { areaName: c.areaName, cams: [] };
    acc[c.siteId].areas[c.areaId].cams.push(c);
    return acc;
  }, {});
  const onlineCount = cameras.filter((c) => c.status === "online").length;
  const offlineCount = cameras.length - onlineCount;
  const siteCount = Object.keys(bySite).length;

  return (
    /* On desktop the panel is laid over its grid cell, so the wall alone sets the
       row's height and the panel's list scrolls inside it — the two end flush. */
    <div className="relative lg:min-h-[420px]">
      <aside
        aria-label="Cameras and tracking"
        className="flex max-h-[80vh] min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card lg:absolute lg:inset-0 lg:max-h-none"
      >
        <div role="tablist" aria-label="Side panel" className="flex flex-shrink-0 border-b border-border">
          {(["cameras", "tracking"] as PanelTab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "-mb-px inline-flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2.5 text-xs font-semibold transition-colors",
                tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "cameras" ? "Cameras" : <><Crosshair className="size-3.5" /> Tracking</>}
              {t === "tracking" && trackCount > 0 && (
                <span className="rounded-full bg-sev-critical/15 px-1.5 text-3xs font-bold text-sev-critical">{trackCount}</span>
              )}
            </button>
          ))}
        </div>

        {tab === "tracking" ? (
          <div className="flex min-h-0 flex-1 flex-col pt-3">{trackingPanel}</div>
        ) : (
          <>
            <div className="flex-shrink-0 border-b border-border px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Cameras · {siteCount === 1 ? Object.values(bySite)[0].siteName : `${siteCount} sites`}
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
              <p className="mt-2 text-2xs text-muted-foreground">Click a camera to find it on the wall.</p>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
              {cameras.length === 0 && (
                <p className="py-8 text-center text-xs text-muted-foreground">No cameras match these filters.</p>
              )}
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
                            data-panel-camera={c.id}
                            camera={c}
                            size="sm"
                            checked={checkedIds.includes(c.id)}
                            onToggleCheck={() => onToggleCheck(c.id)}
                            active={c.id === activeId}
                            onActivate={() => onActivate(c.id)}
                            pb={pbFor(c.id)}
                            onPb={(next) => setPb(c.id, next)}
                            now={now}
                            onExpand={() => setExpandedId(c.id)}
                            overlay={badgesFor(c.id)}
                          />
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}

        <CameraPlayerModal
          camera={expanded}
          open={!!expanded}
          onClose={() => setExpandedId(null)}
          pb={expanded ? pbFor(expanded.id) : LIVE_STATE}
          onPb={(next) => expanded && setPb(expanded.id, next)}
          now={now}
        />
      </aside>
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
    <div className="min-h-full rounded-xl border border-primary/40 bg-card p-4">
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

export function ReidLiveMonitoring({
  onSelectionChange,
}: {
  /** Reports how many cameras are selected, so a host page can keep clear of the selection bar. */
  onSelectionChange?: (count: number) => void;
} = {}) {
  const allCameras = useCamerasStore((s) => s.cameras);
  const sites = useSitesStore((s) => s.sites);

  const [siteFilter, setSiteFilter] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("");
  const [grid, setGrid] = React.useState<GridOption>("auto");
  const [page, setPage] = React.useState(1);
  /** The Cameras & Tracking panel on the right — the wall reflows around it. */
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [panelTab, setPanelTab] = React.useState<PanelTab>("cameras");
  /** A camera picked by hand, in the panel or on the wall. */
  const [pickedCameraId, setPickedCameraId] = React.useState<string | null>(null);

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

  /* ── Re-ID tracking — badges on tiles, the Tracking tab, the enlarged map ── */
  const maps = useReidMapsStore((s) => s.maps);
  const [trackStates, setTrackStates] = React.useState<TrackState[]>(() => allTrackStates(maps, Date.now() / 1000));
  /** The weapon highlighted on the map — its camera is outlined on the wall. */
  const [focusId, setFocusId] = React.useState<string | null>(null);
  /** A map picked from the Tracking tab's list. */
  const [manualMapId, setManualMapId] = React.useState<string | null>(null);
  const [mapOpen, setMapOpen] = React.useState(false);
  const mapsRef = React.useRef(maps);
  React.useEffect(() => {
    mapsRef.current = maps;
  });
  React.useEffect(() => {
    const tick = window.setInterval(() => setTrackStates(allTrackStates(mapsRef.current, Date.now() / 1000)), 500);
    return () => window.clearInterval(tick);
  }, []);

  const focusState = trackStates.find((x) => x.track.id === focusId) ?? null;
  /* While a weapon is highlighted, the camera it's in is the active one — it moves as the weapon does. */
  const activeCameraId = focusState ? focusState.cameraId ?? focusState.lastCameraId : pickedCameraId;
  const tracksOn = (mapId: string) => trackStates.filter((x) => x.mapId === mapId).length;
  const activeMap = activeCameraId ? mapForCamera(maps, activeCameraId) : null;
  const busiestMap = [...maps].sort((a, b) => tracksOn(b.id) - tracksOn(a.id))[0] ?? null;
  const shownMap =
    (focusState && maps.find((m) => m.id === focusState.mapId)) ||
    (manualMapId && maps.find((m) => m.id === manualMapId)) ||
    activeMap ||
    busiestMap;
  const mapReason = focusState
    ? `Highlighting ${focusState.track.id} — the camera it's in is outlined on the wall`
    : manualMapId && shownMap
      ? "Picked from the list — resets when you pick a camera or a weapon"
      : activeMap
        ? `Showing the map for ${activeCameraId}, the camera you picked`
        : "Showing the busiest map — pick a camera or a weapon to change it";

  /** A weapon tag, track row or map dot highlights that weapon; picking it again clears it. */
  function focusWeapon(trackId: string) {
    if (trackId === focusId) {
      setFocusId(null);
      return;
    }
    setFocusId(trackId);
    setManualMapId(null);
    setPanelOpen(true);
    setPanelTab("tracking");
  }

  /** Picking a camera by hand takes over from a highlighted weapon and a hand-picked map. */
  function pickCamera(id: string) {
    setPickedCameraId(id);
    setFocusId(null);
    setManualMapId(null);
    revealOnWall(id);
  }

  const pbFor = React.useCallback((id: string) => tilePb[id] ?? LIVE_STATE, [tilePb]);
  const setPb = React.useCallback((id: string, next: Partial<PlaybackState>) => {
    setTilePb((curr) => ({ ...curr, [id]: { ...(curr[id] ?? LIVE_STATE), ...next } }));
  }, []);

  function toggleCheck(id: string) {
    setCheckedIds((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]));
  }

  const matchesSearch = React.useCallback(
    (c: CameraData) => !search || [c.id, c.name, c.areaName, c.siteName].join(" ").toLowerCase().includes(search.toLowerCase()),
    [search]
  );
  const filteredCameras = React.useMemo(() => {
    return allCameras
      .filter((c) => (siteFilter.length === 0 || siteFilter.includes(c.siteId)) && matchesSearch(c))
      .sort((a, b) => a.id.localeCompare(b.id));
  }, [allCameras, siteFilter, matchesSearch]);

  const checkedCameras = filteredCameras.filter((c) => checkedIds.includes(c.id));
  const badgesFor = (id: string) => (
    <WeaponBadges states={trackStates.filter((x) => x.cameraId === id)} pinnedId={focusId} onPin={focusWeapon} />
  );

  /* On the Tracking tab the wall shows only the shown map's cameras — the map is
     an explicit pick, so it reaches past the site filter (search still applies).
     Back on the Cameras tab, the wall is the default view again. */
  const mapView = panelOpen && panelTab === "tracking" && !!shownMap;
  const wallCameras = React.useMemo(
    () =>
      mapView && shownMap
        ? allCameras.filter((c) => shownMap.cameraIds.includes(c.id) && matchesSearch(c)).sort((a, b) => a.id.localeCompare(b.id))
        : filteredCameras,
    [mapView, shownMap, allCameras, matchesSearch, filteredCameras]
  );

  // Paging only applies to a fixed N×N grid; a filter change can shrink the page count under us.
  const n = grid === "auto" ? 0 : Number(grid);
  const perPage = n ? n * n : wallCameras.length;
  const pageCount = n ? Math.max(1, Math.ceil(wallCameras.length / perPage)) : 1;
  const currentPage = Math.min(page, pageCount);
  const shownFrom = wallCameras.length ? (currentPage - 1) * perPage + 1 : 0;
  const shownTo = Math.min(currentPage * perPage, wallCameras.length);

  /** Turns to the camera's page on a fixed grid, then scrolls its tile into view — on the wall and in the panel list. */
  function revealOnWall(id: string) {
    const idx = wallCameras.findIndex((c) => c.id === id);
    if (n && idx >= 0) setPage(Math.floor(idx / perPage) + 1);
    window.requestAnimationFrame(() => {
      document.querySelector(`[data-wall-camera="${id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      document.querySelector(`[data-panel-camera="${id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }

  /* Clearing the selection drops straight back out of playback mode. */
  const inSync = syncMode && checkedCameras.length > 0;
  const onlineCount = wallCameras.filter((c) => c.status === "online").length;

  React.useEffect(() => {
    onSelectionChange?.(checkedIds.length);
  }, [checkedIds.length, onSelectionChange]);
  const siteLabel = siteFilter.length === 1 ? sites.find((s) => s.id === siteFilter[0])?.name ?? "" : "All sites";

  return (
    <div className={cn("flex flex-col gap-4 lg:h-full", checkedIds.length > 0 && (inSync ? "pb-44" : "pb-24"))}>
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Live Monitoring</PageHeader.Title>
          <PageHeader.Description>
            Real-time camera feeds across all sites — select cameras and scrub them back together while the feed keeps
            running. Weapon tags on a tile open its Re-ID map.
          </PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          {/* Opens the Cameras & Tracking panel on the right; the wall reflows around it. */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPanelOpen((o) => !o)}
            aria-pressed={panelOpen}
            aria-expanded={panelOpen}
            title={panelOpen ? "Hide the Cameras & Tracking panel" : "Show the Cameras & Tracking panel"}
            className={cn("gap-1.5", panelOpen && "border-primary/50 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary")}
          >
            {panelOpen ? <PanelRightClose className="size-3.5" /> : <PanelRightOpen className="size-3.5" />}
            Cameras &amp; Tracking
            {trackStates.length > 0 && (
              <span className="rounded-full bg-sev-critical/15 px-1.5 text-3xs font-bold text-sev-critical">{trackStates.length}</span>
            )}
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Filter bar — sites · grid view · search */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
        <MultiSiteSelector
          sites={sites.map((s) => ({ id: s.id, name: s.name }))}
          selected={siteFilter}
          onChange={(ids) => { setSiteFilter(ids); setPage(1); }}
        />
        <Select value={grid} onValueChange={(v) => { setGrid(v as GridOption); setPage(1); }} disabled={inSync}>
          <SelectTrigger className="h-9 w-48 text-base" aria-label="Grid view">
            <span className="flex items-center gap-2">
              <LayoutGrid className="size-3.5 text-muted-foreground" />
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent>
            {GRID_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
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

      {/* Summary — and the pager when a fixed grid can't fit every camera */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {mapView && shownMap ? (
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1 rounded-md border border-sev-critical/30 bg-sev-critical/10 px-1.5 py-0.5 text-2xs font-semibold text-sev-critical">
              <Crosshair className="size-3" /> Map view
            </span>
            <span>
              <strong className="text-foreground">{mapLabel(shownMap)}</strong> · {wallCameras.length} camera
              {wallCameras.length === 1 ? "" : "s"} on this map · {onlineCount} online
            </span>
            <button type="button" onClick={() => setPanelTab("cameras")} className="text-xs font-semibold text-primary hover:underline">
              Show all cameras
            </button>
          </span>
        ) : (
          <span>
            <strong className="text-foreground">{siteLabel}</strong> · {filteredCameras.length} cameras total · {onlineCount} online
            {inSync && <> · <strong className="text-primary">{checkedCameras.length} in synchronised playback</strong></>}
          </span>
        )}
        {!inSync && pageCount > 1 && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-xs">
              Cameras {shownFrom}–{shownTo} of {wallCameras.length}
            </span>
            <button onClick={() => setPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} aria-label="Previous page"
              className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40">
              <ChevronLeft className="size-3.5" />
            </button>
            <button onClick={() => setPage(Math.min(pageCount, currentPage + 1))} disabled={currentPage === pageCount} aria-label="Next page"
              className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40">
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className={cn("grid min-h-0 flex-1 grid-cols-1 gap-4", panelOpen && "lg:grid-cols-[minmax(0,1fr)_340px]")}>
        <div className={cn("min-w-0", !inSync && "rounded-xl border border-border bg-card p-3")}>
          {inSync ? (
            <SyncGrid
              cameras={checkedCameras}
              pb={syncPb}
              onPb={(next) => setSyncPb((c) => ({ ...c, ...next }))}
              now={now}
              onToggleCheck={toggleCheck}
            />
          ) : (
            <CameraWall
              cameras={wallCameras}
              grid={grid}
              page={currentPage}
              activeId={activeCameraId}
              onActivate={pickCamera}
              checkedIds={checkedIds}
              onToggleCheck={toggleCheck}
              pbFor={pbFor}
              setPb={setPb}
              now={now}
              badgesFor={badgesFor}
            />
          )}
        </div>

        {panelOpen && (
          <SidePanel
            cameras={filteredCameras}
            activeId={activeCameraId}
            onActivate={pickCamera}
            tab={panelTab}
            setTab={setPanelTab}
            trackCount={trackStates.length}
            trackingPanel={
              <TrackingPanel
                maps={maps}
                states={trackStates}
                shownMap={shownMap}
                reason={mapReason}
                heroCameraId={activeCameraId ?? ""}
                pinnedId={focusId}
                onPin={focusWeapon}
                onPickMap={(id) => { setManualMapId(id); setFocusId(null); }}
                onExpand={() => setMapOpen(true)}
              />
            }
            checkedIds={checkedIds}
            onToggleCheck={toggleCheck}
            pbFor={pbFor}
            setPb={setPb}
            now={now}
            badgesFor={badgesFor}
          />
        )}
      </div>

      <MapExpandModal
        open={mapOpen && !!shownMap}
        map={shownMap}
        states={trackStates}
        heroCameraId={activeCameraId ?? ""}
        pinnedId={focusId}
        onPin={focusWeapon}
        hint="Click a weapon on the map or in the list to highlight it — the camera it's in is outlined on the wall."
        onClose={() => setMapOpen(false)}
      />

      {inSync ? (
        <SyncPlaybackBar
          count={checkedCameras.length}
          pb={syncPb}
          onChange={(next) => setSyncPb((c) => ({ ...c, ...next }))}
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
