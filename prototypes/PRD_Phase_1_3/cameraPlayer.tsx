import * as React from "react";
import {
  Expand,
  Maximize2,
  Pause,
  Play,
  Radio,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogTitle } from "@/components/ui/dialog";
import { Modal, ModalContent } from "@/components/shared/Modal";
import { cn } from "@/lib/utils";
import type { CameraData } from "@/types/cameras";
import {
  BUFFER_SEC,
  NO_ZOOM,
  fmtOffset,
  markersFor,
  isZoomed,
  timestampAt,
  zoomPercent,
  zoomTransform,
  type PlaybackState,
} from "./playback";
import { IconButton, PlaybackSettingsMenu, ScrubTrack, ZoomSurface } from "./playbackControls";

/* The frame and the bar that sits over it — shared by the wall tiles, the hero
   player and the expand pop-up, so all three behave identically. */

export const TILE_GRADIENT =
  "radial-gradient(120% 80% at 40% 60%, rgba(180,140,80,0.18) 0%, rgba(40,30,15,0.1) 45%, rgba(0,0,0,0.95) 100%)";

/* ── Tile player bar (hover) ─────────────────────────────────────────── */

export function TilePlayerBar({
  camera,
  pb,
  onChange,
  now,
  compact,
  readOnly,
  zoomArmed,
  onArmZoom = () => {},
  onExitZoom = () => {},
  onExpand,
}: {
  camera: CameraData;
  pb: PlaybackState;
  onChange: (next: Partial<PlaybackState>) => void;
  now: Date;
  compact?: boolean;
  /** In synchronised mode the shared bar drives playback, so per-tile transport is hidden. */
  readOnly?: boolean;
  /** True while the tile is in zoom mode and the wheel / keys are steering it. */
  zoomArmed?: boolean;
  onArmZoom?: () => void;
  onExitZoom?: () => void;
  /**
   * When set, the tile is too small to zoom inside and the zoom control is
   * replaced by an expand button that opens this camera in the pop-up player.
   */
  onExpand?: () => void;
}) {
  const live = pb.offsetSec <= 0;
  const zoomed = isZoomed(pb.zoom);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "absolute inset-x-0 bottom-0 z-20 flex flex-col gap-1 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-2 pb-1.5 pt-6",
        compact ? "gap-0.5" : "gap-1"
      )}
    >
      <ScrubTrack
        offsetSec={pb.offsetSec}
        onChange={(v) => onChange({ offsetSec: v })}
        now={now}
        markers={markersFor(camera.id)}
        size={compact ? "sm" : "md"}
        label={`${camera.id} playback position`}
      />
      <div className="flex items-center gap-1">
        {!readOnly && (
          <>
            <IconButton label="Back 30 seconds" compact={compact}
              onClick={() => onChange({ offsetSec: Math.min(BUFFER_SEC, pb.offsetSec + 30) })}>
              <RotateCcw className={compact ? "size-3.5" : "size-4"} />
            </IconButton>
            <IconButton label={pb.playing ? "Pause" : "Play"} compact={compact}
              onClick={() => onChange({ playing: !pb.playing })}>
              {pb.playing ? <Pause className={compact ? "size-3.5" : "size-4"} /> : <Play className={compact ? "size-3.5" : "size-4"} />}
            </IconButton>
            <IconButton label="Forward 30 seconds" compact={compact} disabled={live}
              onClick={() => onChange({ offsetSec: Math.max(0, pb.offsetSec - 30) })}>
              <RotateCw className={compact ? "size-3.5" : "size-4"} />
            </IconButton>
            <IconButton label={pb.muted ? "Unmute" : "Mute"} compact={compact}
              onClick={() => onChange({ muted: !pb.muted })}>
              {pb.muted ? <VolumeX className={compact ? "size-3.5" : "size-4"} /> : <Volume2 className={compact ? "size-3.5" : "size-4"} />}
            </IconButton>
          </>
        )}

        {/* Live tag / how far back this tile is sitting */}
        <button
          type="button"
          onClick={() => onChange({ offsetSec: 0, playing: true })}
          disabled={live}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-3xs font-bold uppercase tracking-wider transition-colors",
            live ? "text-white/90" : "bg-white/15 text-white hover:bg-sev-critical"
          )}
        >
          <span className={cn("size-1.5 rounded-full", live ? "animate-pulse bg-sev-critical" : "bg-white/60")} />
          {live ? "Live" : `−${fmtOffset(pb.offsetSec)}`}
        </button>

        {!live && !compact && (
          <span className="font-mono text-3xs text-white/70">{timestampAt(now, pb.offsetSec)}</span>
        )}

        <div className="ml-auto flex items-center gap-0.5">
          {pb.speed !== 1 && (
            <span className="rounded bg-white/15 px-1 font-mono text-3xs font-semibold text-white">{pb.speed}×</span>
          )}

          {onExpand ? (
            /* Sidebar tiles are a few hundred pixels wide — there is nothing to
               see zoomed in. Expand opens the camera full size instead. */
            <IconButton label="Expand this camera" compact={compact} onClick={onExpand}>
              <Expand className={compact ? "size-3.5" : "size-4"} />
            </IconButton>
          ) : (
            <>
              {zoomed && (
                <span className="rounded bg-white/15 px-1 font-mono text-3xs font-semibold text-white">
                  {zoomPercent(pb.zoom)}
                </span>
              )}
              {/* One button, three steps: arm zoom, leave zoom mode, reset the
                  frame. Without the middle step there is no way back out of
                  zoom mode at 100% except the keyboard. */}
              <IconButton
                label={zoomArmed ? "Exit zoom mode" : zoomed ? "Reset zoom" : "Zoom — scroll or + / −"}
                compact={compact}
                active={zoomArmed || zoomed}
                onClick={() => {
                  if (zoomArmed) onExitZoom();
                  else if (zoomed) onChange({ zoom: NO_ZOOM });
                  else onArmZoom();
                }}
              >
                {!zoomArmed && zoomed
                  ? <ZoomOut className={compact ? "size-3.5" : "size-4"} />
                  : <ZoomIn className={compact ? "size-3.5" : "size-4"} />}
              </IconButton>
            </>
          )}

          {!readOnly && <PlaybackSettingsMenu pb={pb} onChange={onChange} compact={compact} />}
          {!compact && (
            <IconButton label="Fullscreen" compact={compact}>
              <Maximize2 className="size-4" />
            </IconButton>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Expand pop-up ───────────────────────────────────────────────────── */

function ExpandedPlayer({
  camera, pb, onPb, now, zoomArmed, setZoomArmed,
}: {
  camera: CameraData;
  pb: PlaybackState;
  onPb: (next: Partial<PlaybackState>) => void;
  now: Date;
  /* Owned by the modal: Radix reads Escape in the capture phase, so the pop-up
     itself has to know it is in zoom mode to swallow that first press. */
  zoomArmed: boolean;
  setZoomArmed: (v: boolean) => void;
}) {
  const live = pb.offsetSec <= 0;
  const isOnline = camera.status === "online";

  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-border bg-card px-5 py-4">
        <div className="min-w-0">
          <DialogTitle className="text-lg font-bold text-foreground">
            {camera.name} · {camera.id}
          </DialogTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {camera.siteName} · {camera.areaName} · {camera.stream.resolution} · {camera.stream.frameRate}fps
          </p>
        </div>
        <span className={cn(
          "mr-8 shrink-0 rounded-md border px-2 py-1 font-mono text-2xs font-semibold",
          live ? "border-sev-critical/40 bg-sev-critical/10 text-sev-critical" : "border-warning/30 bg-warning/10 text-warning"
        )}>
          {live ? "LIVE" : `−${fmtOffset(pb.offsetSec)} · ${timestampAt(now, pb.offsetSec)}`}
        </span>
      </div>

      <div className="overflow-y-auto p-5">
        <div className="group relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-neutral-950">
          {isOnline ? (
            <>
              <div
                className="absolute inset-0 origin-top-left transition-transform duration-[var(--duration-normal)] ease-standard"
                style={{ background: TILE_GRADIENT, transform: zoomTransform(pb.zoom) }}
              />
              {zoomArmed && (
                <ZoomSurface
                  zoom={pb.zoom}
                  onChange={(z) => onPb({ zoom: z })}
                  onExit={() => setZoomArmed(false)}
                />
              )}
              <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-0.5 text-2xs font-bold uppercase tracking-widest text-white/90 backdrop-blur-sm">
                <span className={cn("size-1.5 rounded-full", live ? "animate-pulse bg-sev-critical" : "bg-white/60")} />
                {live ? "Live" : "Playback"}
              </span>
              <div className="absolute bottom-16 left-3 z-10 rounded bg-black/60 px-2 py-1 font-mono text-xs text-white/90 backdrop-blur-sm">
                {new Date(now.getTime() - pb.offsetSec * 1000)
                  .toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })
                  .replace(",", " ·")}
              </div>
              <TilePlayerBar
                camera={camera}
                pb={pb}
                onChange={onPb}
                now={now}
                zoomArmed={zoomArmed}
                onArmZoom={() => setZoomArmed(true)}
                onExitZoom={() => setZoomArmed(false)}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sev-critical/80">
              <span className="text-2xs font-bold uppercase tracking-widest">Camera offline</span>
              <p className="text-sm text-muted-foreground">No stream to play for {camera.id}.</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Scroll or press + / − over the frame to zoom, arrow keys to pan.
          </p>
          <Button variant="outline" size="sm" className="gap-1.5" disabled={live || !isOnline}
            onClick={() => onPb({ offsetSec: 0, playing: true })}>
            <Radio className="size-3.5" />
            Go live
          </Button>
        </div>
      </div>
    </>
  );
}

/**
 * Expand pop-up for one camera. Mounted under the camera id, so opening a
 * different tile starts a fresh player rather than resetting one in an effect.
 */
export function CameraPlayerModal({ camera, open, onClose, pb, onPb, now }: {
  camera: CameraData | null;
  open: boolean;
  onClose: () => void;
  pb: PlaybackState;
  onPb: (next: Partial<PlaybackState>) => void;
  now: Date;
}) {
  const [zoomArmed, setZoomArmed] = React.useState(false);

  return (
    <Modal
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setZoomArmed(false);
          onClose();
        }
      }}
    >
      <ModalContent
        size="xl"
        className="gap-0"
        aria-describedby={undefined}
        // First Escape leaves zoom mode, the next one closes the pop-up.
        onEscapeKeyDown={(e) => {
          if (zoomArmed) {
            e.preventDefault();
            setZoomArmed(false);
          }
        }}
      >
        {camera && (
          <ExpandedPlayer
            key={camera.id}
            camera={camera}
            pb={pb}
            onPb={onPb}
            now={now}
            zoomArmed={zoomArmed}
            setZoomArmed={setZoomArmed}
          />
        )}
      </ModalContent>
    </Modal>
  );
}
