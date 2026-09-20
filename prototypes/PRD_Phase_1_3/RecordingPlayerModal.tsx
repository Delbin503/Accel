import * as React from "react";
import {
  CircleDot,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Video,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Modal, ModalContent } from "@/components/shared/Modal";
import { DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { RECORDING_TYPES, TONE_CLASSES } from "./recordingTypes";
import { IconButton, PlaybackSettingsMenu, ZoomSurface } from "./playbackControls";
import { LIVE_STATE, NO_ZOOM, isZoomed, zoomPercent, zoomTransform, type PlaybackState } from "./playback";
import { periodsFor, type DayRecording } from "./dayRecordings";

/* The player is a pop-up now, not the first thing in the drawer — a camera-day
   holds several recordings, so there is no single video to lead with. The
   drawer lists the day's recordings and this opens the one you pick. */

function fmtClock(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* Mounted under a key of the recording id, so picking a different recording
   starts a fresh player instead of resetting one through an effect. */
function PlayerBody({ recording, zoomArmed, setZoomArmed }: {
  recording: DayRecording;
  /* Owned by the modal: Radix reads Escape in the capture phase, so the pop-up
     itself has to know it is in zoom mode to swallow that first press. */
  zoomArmed: boolean;
  setZoomArmed: (v: boolean) => void;
}) {
  const [currentSec, setCurrentSec] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  /* Same state shape the live tiles use, so the controls behave identically. */
  const [pb, setPb] = React.useState<PlaybackState>(LIVE_STATE);

  const totalSec = recording.durationMinutes * 60;

  React.useEffect(() => {
    if (!isPlaying || totalSec === 0) return;
    const id = setInterval(() => {
      setCurrentSec((s) => {
        if (s >= totalSec) {
          setIsPlaying(false);
          return totalSec;
        }
        return s + 30;
      });
    }, 500 / pb.speed);
    return () => clearInterval(id);
  }, [isPlaying, totalSec, pb.speed]);

  const def = RECORDING_TYPES.find((t) => t.id === recording.type) ?? RECORDING_TYPES[0];
  const tone = TONE_CLASSES[def.tone];
  const periods = periodsFor(recording);
  const progress = totalSec > 0 ? (currentSec / totalSec) * 100 : 0;

  function seekTo(fraction: number) {
    setCurrentSec(Math.round(Math.min(1, Math.max(0, fraction)) * totalSec));
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border bg-card px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider", tone.chip)}>
              {def.label}
            </span>
            <span className="rounded border border-border bg-muted px-1.5 py-px font-mono text-2xs text-muted-foreground">
              {recording.id}
            </span>
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            {recording.cameraName} · {recording.dateLabel}
          </DialogTitle>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Video className="size-3" />
            {recording.cameraId}
            <span className="text-muted-foreground/40">·</span>
            {recording.startsAtDisplay} – {recording.endsAtDisplay}
            <span className="text-muted-foreground/40">·</span>
            <span className="font-mono">{recording.durationDisplay}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="font-mono">{recording.resolution}</span>
          </p>
        </div>
      </div>

      {/* Player */}
      <div className="overflow-y-auto p-5">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="relative aspect-video w-full overflow-hidden bg-neutral-950">
            <div
              className="absolute inset-0 origin-top-left transition-transform duration-[var(--duration-normal)] ease-standard"
              style={{
                background: "radial-gradient(120% 80% at 50% 60%, rgba(180,140,80,0.18) 0%, rgba(60,40,20,0.1) 40%, rgba(0,0,0,0.95) 100%)",
                transform: zoomTransform(pb.zoom),
              }}
            />
            <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-0.5 text-2xs font-bold uppercase tracking-widest text-white/90 backdrop-blur-sm">
              <span className={cn("size-1.5 rounded-full", isPlaying ? "animate-pulse bg-sev-critical" : "bg-white/60")} />
              {isPlaying ? "Playing" : "Paused"}
            </span>
            <button
              type="button"
              onClick={() => setIsPlaying((v) => !v)}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="flex size-16 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm transition-transform hover:scale-105">
                {isPlaying ? <Pause className="size-6 text-white" /> : <Play className="size-6 text-white" />}
              </span>
            </button>

            {zoomArmed && (
              <ZoomSurface
                zoom={pb.zoom}
                onChange={(z) => setPb((c) => ({ ...c, zoom: z }))}
                onExit={() => setZoomArmed(false)}
              />
            )}

            {/* Overlay controls — the same bar the live tiles carry. */}
            <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-1 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-3 pb-2 pt-8">
              <div className="flex items-center justify-between gap-2 text-3xs text-white/70">
                <span className="font-mono">{recording.startsAtDisplay}</span>
                <span className="inline-flex items-center gap-1">
                  <CircleDot className="size-3 text-success" />
                  <strong className="text-white">{periods.length}</strong> detected period{periods.length === 1 ? "" : "s"}
                </span>
                <span className="font-mono">{recording.endsAtDisplay}</span>
              </div>

              <div
                role="slider"
                tabIndex={0}
                aria-label="Playback position"
                aria-valuemin={0}
                aria-valuemax={totalSec}
                aria-valuenow={currentSec}
                aria-valuetext={fmtClock(currentSec)}
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  seekTo((e.clientX - r.left) / r.width);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowLeft") { e.preventDefault(); setCurrentSec((c) => Math.max(0, c - 30)); }
                  if (e.key === "ArrowRight") { e.preventDefault(); setCurrentSec((c) => Math.min(totalSec, c + 30)); }
                }}
                className="group/track relative flex h-4 w-full cursor-pointer items-center"
              >
                <div className="absolute inset-x-0 h-1 rounded-full bg-white/25" />
                <div className="absolute left-0 h-1 rounded-full bg-sev-critical" style={{ width: `${progress}%` }} />
                {periods.map((p) => (
                  <span key={p.label + p.at} title={p.label}
                    className={cn("absolute size-1.5 -translate-x-1/2 rounded-full",
                      p.tone === "info" && "bg-info",
                      p.tone === "warning" && "bg-warning",
                      p.tone === "critical" && "bg-sev-critical")}
                    style={{ left: `${p.at * 100}%` }} />
                ))}
                <span className="absolute size-3 -translate-x-1/2 scale-0 rounded-full bg-sev-critical transition-transform group-hover/track:scale-100"
                  style={{ left: `${progress}%` }} />
              </div>

              <div className="flex items-center gap-1">
                <IconButton label="Back 30 seconds" onClick={() => setCurrentSec((c) => Math.max(0, c - 30))}>
                  <RotateCcw className="size-4" />
                </IconButton>
                <IconButton label={isPlaying ? "Pause" : "Play"} onClick={() => setIsPlaying((v) => !v)}>
                  {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                </IconButton>
                <IconButton label="Forward 30 seconds" onClick={() => setCurrentSec((c) => Math.min(totalSec, c + 30))}>
                  <RotateCw className="size-4" />
                </IconButton>
                <IconButton label={pb.muted ? "Unmute" : "Mute"} onClick={() => setPb((c) => ({ ...c, muted: !c.muted }))}>
                  {pb.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </IconButton>
                <span className="ml-1 font-mono text-3xs text-white/85">
                  {fmtClock(currentSec)} / {recording.durationDisplay}
                </span>

                <div className="ml-auto flex items-center gap-0.5">
                  {pb.speed !== 1 && (
                    <span className="rounded bg-white/15 px-1 font-mono text-3xs font-semibold text-white">{pb.speed}×</span>
                  )}
                  {isZoomed(pb.zoom) && (
                    <span className="rounded bg-white/15 px-1 font-mono text-3xs font-semibold text-white">
                      {zoomPercent(pb.zoom)}
                    </span>
                  )}
                  {/* Arm zoom, leave zoom mode, reset the frame — in that order. */}
                  <IconButton
                    label={zoomArmed ? "Exit zoom mode" : isZoomed(pb.zoom) ? "Reset zoom" : "Zoom — scroll or + / −"}
                    active={zoomArmed || isZoomed(pb.zoom)}
                    onClick={() => {
                      if (zoomArmed) setZoomArmed(false);
                      else if (isZoomed(pb.zoom)) setPb((c) => ({ ...c, zoom: NO_ZOOM }));
                      else setZoomArmed(true);
                    }}
                  >
                    {!zoomArmed && isZoomed(pb.zoom) ? <ZoomOut className="size-4" /> : <ZoomIn className="size-4" />}
                  </IconButton>
                  <PlaybackSettingsMenu pb={pb} onChange={(next) => setPb((c) => ({ ...c, ...next }))} />
                  <IconButton label="Fullscreen">
                    <Maximize2 className="size-4" />
                  </IconButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detected periods, so the pop-up carries the triage context too */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Detected Periods</p>
          <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {periods.map((p) => (
              <button key={p.label + p.at} onClick={() => seekTo(p.at)}
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-muted/40">
                <span className={cn("size-2 shrink-0 rounded-full",
                  p.tone === "info" && "bg-info",
                  p.tone === "warning" && "bg-warning",
                  p.tone === "critical" && "bg-sev-critical")} />
                <span className="min-w-0 flex-1 truncate text-base text-foreground">{p.label}</span>
                <span className="shrink-0 font-mono text-2xs text-muted-foreground">
                  {fmtClock(Math.round(p.at * totalSec))}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function RecordingPlayerModal({ recording, open, onClose }: {
  recording: DayRecording | null;
  open: boolean;
  onClose: () => void;
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
        {recording && (
          <PlayerBody
            key={recording.id}
            recording={recording}
            zoomArmed={zoomArmed}
            setZoomArmed={setZoomArmed}
          />
        )}
      </ModalContent>
    </Modal>
  );
}
