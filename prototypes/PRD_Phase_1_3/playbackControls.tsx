import * as React from "react";
import { Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  BUFFER_SEC,
  NO_ZOOM,
  SPEEDS,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STEP,
  fmtOffset,
  panZoom,
  timestampAt,
  zoomBy,
  zoomPercent,
  type PlaybackState,
  type ZoomState,
} from "./playback";

/* Playback controls shared by a single tile and the synchronised bar. */

/* ── Scrub track ─────────────────────────────────────────────────────── */

/**
 * Draggable timeline. The right edge is live, the left edge is the far end of
 * the buffer, so dragging left goes back in time. Pointer capture keeps the
 * drag alive when the cursor leaves the tile.
 */
export function ScrubTrack({
  offsetSec,
  onChange,
  now,
  markers = [],
  size = "md",
  className,
  label = "Playback position",
}: {
  offsetSec: number;
  onChange: (next: number) => void;
  now: Date;
  markers?: { at: number; tone: "info" | "warning" | "critical"; label: string }[];
  size?: "sm" | "md";
  className?: string;
  label?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [hoverPct, setHoverPct] = React.useState<number | null>(null);

  const pct = ((BUFFER_SEC - offsetSec) / BUFFER_SEC) * 100;

  function offsetFromEvent(e: React.PointerEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return 0;
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    return Math.round((1 - frac) * BUFFER_SEC);
  }

  return (
    <div className={cn("relative w-full select-none", className)}>
      {/* Preview bubble — the frame you would land on, like a scrub preview. */}
      {(dragging || hoverPct !== null) && (
        <div
          className="pointer-events-none absolute -top-7 z-10 -translate-x-1/2 rounded bg-black/85 px-1.5 py-0.5 font-mono text-3xs text-white"
          style={{ left: `${dragging ? pct : (hoverPct ?? 0)}%` }}
        >
          {dragging
            ? offsetSec <= 0 ? "LIVE" : `−${fmtOffset(offsetSec)}`
            : timestampAt(now, Math.round((1 - (hoverPct ?? 0) / 100) * BUFFER_SEC))}
        </div>
      )}

      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={BUFFER_SEC}
        aria-valuenow={BUFFER_SEC - offsetSec}
        aria-valuetext={offsetSec <= 0 ? "Live" : `${fmtOffset(offsetSec)} behind live`}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
          onChange(offsetFromEvent(e));
        }}
        onPointerMove={(e) => {
          const rect = ref.current?.getBoundingClientRect();
          if (rect) {
            setHoverPct(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)));
          }
          if (dragging) onChange(offsetFromEvent(e));
        }}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          setDragging(false);
        }}
        onPointerLeave={() => setHoverPct(null)}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 600 : 30;
          if (e.key === "ArrowLeft") { e.preventDefault(); onChange(Math.min(BUFFER_SEC, offsetSec + step)); }
          if (e.key === "ArrowRight") { e.preventDefault(); onChange(Math.max(0, offsetSec - step)); }
          if (e.key === "End") { e.preventDefault(); onChange(0); }
        }}
        className={cn(
          "group/track relative flex w-full cursor-pointer items-center focus-visible:outline-none",
          size === "sm" ? "h-3" : "h-4"
        )}
      >
        {/* Buffer */}
        <div className={cn("absolute inset-x-0 rounded-full bg-white/25", size === "sm" ? "h-[3px]" : "h-1")} />
        {/* Watched region up to the playhead */}
        <div
          className={cn("absolute left-0 rounded-full bg-sev-critical", size === "sm" ? "h-[3px]" : "h-1")}
          style={{ width: `${pct}%` }}
        />
        {/* Event markers */}
        {markers.map((m) => (
          <span
            key={m.label + m.at}
            title={m.label}
            className={cn(
              "absolute size-1.5 -translate-x-1/2 rounded-full",
              m.tone === "info" && "bg-info",
              m.tone === "warning" && "bg-warning",
              m.tone === "critical" && "bg-sev-critical"
            )}
            style={{ left: `${((BUFFER_SEC - m.at) / BUFFER_SEC) * 100}%` }}
          />
        ))}
        {/* Playhead */}
        <span
          className={cn(
            "absolute -translate-x-1/2 rounded-full bg-sev-critical transition-transform",
            dragging ? "scale-125" : "scale-0 group-hover/track:scale-100",
            size === "sm" ? "size-2.5" : "size-3"
          )}
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── Chip row used inside the settings dropdown ──────────────────────── */

export function ChipRow<T extends string | number>({
  options,
  value,
  onChange,
  format,
  label,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  format: (v: T) => string;
  label: string;
}) {
  return (
    <div>
      <p className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={String(o)}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={o === value}
            className={cn(
              "rounded-md border px-2 py-1 font-mono text-2xs font-semibold transition-colors",
              o === value
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            {format(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Overlay controls ────────────────────────────────────────────────── */

export function IconButton({ label, onClick, children, compact, disabled, active }: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  compact?: boolean;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={cn(
        "inline-flex items-center justify-center rounded-md transition-colors disabled:opacity-40",
        active ? "bg-white/25 text-white" : "text-white/85 hover:bg-white/15 hover:text-white",
        compact ? "size-6" : "size-7"
      )}
    >
      {children}
    </button>
  );
}

/**
 * Zoom layer over a frame. Armed from the zoom button, it magnifies on the
 * scroll wheel under the cursor and on the + / − keys, and reports the level as
 * a percentage. There is no box to draw, so a 160px sidebar tile zooms exactly
 * as well as the hero player does.
 */
export function ZoomSurface({ zoom, onChange, onExit, compact }: {
  zoom: ZoomState;
  onChange: (next: ZoomState) => void;
  onExit: () => void;
  compact?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  /* The native wheel listener reads the latest zoom through a ref: it is bound
     once, and rebinding it on every level change would drop notches mid-scroll. */
  const latest = React.useRef({ zoom, onChange });
  React.useEffect(() => {
    latest.current = { zoom, onChange };
  });

  /* React registers `wheel` passively at the root, so preventDefault there is a
     no-op and the page scrolls out from under the tile. Bind it natively. */
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const focus = {
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top) / r.height,
      };
      // Trackpads fire many small deltas and mice one large one — cap a single
      // event at one notch so both feel the same.
      const notches = Math.max(-1, Math.min(1, -e.deltaY / 100));
      latest.current.onChange(zoomBy(latest.current.zoom, notches * ZOOM_STEP * 2, focus));
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /* Take focus when armed, so + / − reach the frame and not the page. */
  React.useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  const atMax = zoom.level >= ZOOM_MAX;
  const atMin = zoom.level <= ZOOM_MIN;

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="slider"
      aria-label="Zoom level"
      aria-valuemin={Math.round(ZOOM_MIN * 100)}
      aria-valuemax={Math.round(ZOOM_MAX * 100)}
      aria-valuenow={Math.round(zoom.level * 100)}
      aria-valuetext={zoomPercent(zoom)}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        const step = e.shiftKey ? ZOOM_STEP * 4 : ZOOM_STEP;
        switch (e.key) {
          case "+":
          case "=":
            e.preventDefault();
            onChange(zoomBy(zoom, step));
            break;
          case "-":
          case "_":
            e.preventDefault();
            onChange(zoomBy(zoom, -step));
            break;
          case "0":
            e.preventDefault();
            onChange(NO_ZOOM);
            break;
          case "ArrowLeft":
            e.preventDefault();
            onChange(panZoom(zoom, -1, 0));
            break;
          case "ArrowRight":
            e.preventDefault();
            onChange(panZoom(zoom, 1, 0));
            break;
          case "ArrowUp":
            e.preventDefault();
            onChange(panZoom(zoom, 0, -1));
            break;
          case "ArrowDown":
            e.preventDefault();
            onChange(panZoom(zoom, 0, 1));
            break;
          case "Escape":
            // Kept off the Dialog above: Escape leaves zoom mode, it does not
            // close the pop-up the frame is sitting in.
            e.preventDefault();
            e.stopPropagation();
            onExit();
            break;
          default:
        }
      }}
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 ring-2 ring-inset ring-primary/70",
        "focus-visible:outline-none",
        atMax ? "cursor-zoom-out" : "cursor-zoom-in"
      )}
    >
      {/* The live readout — the percentage the operator is steering. */}
      <span
        className={cn(
          "rounded-md bg-black/75 font-mono font-bold text-white backdrop-blur-sm",
          compact ? "px-1.5 py-0.5 text-2xs" : "px-2.5 py-1 text-lg"
        )}
      >
        {zoomPercent(zoom)}
      </span>
      {!compact && (
        <span className="rounded bg-black/65 px-2 py-0.5 text-2xs font-semibold text-white/80 backdrop-blur-sm">
          Scroll or {atMin ? "+" : atMax ? "−" : "+ / −"} to zoom · arrows to pan · Esc to exit
        </span>
      )}
    </div>
  );
}

/* ── Playback settings dropdown ──────────────────────────────────────── */

export function PlaybackSettingsMenu({
  pb,
  onChange,
  compact,
}: {
  pb: PlaybackState;
  onChange: (next: Partial<PlaybackState>) => void;
  compact?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Playback settings"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex items-center justify-center rounded-md text-white/85 transition-colors hover:bg-white/15 hover:text-white",
            compact ? "size-6" : "size-7"
          )}
        >
          <Settings className={compact ? "size-3.5" : "size-4"} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="w-56 p-3" onClick={(e) => e.stopPropagation()}>
        <ChipRow label="Playback speed" options={SPEEDS} value={pb.speed} onChange={(v) => onChange({ speed: v })} format={(v) => `${v}×`} />
      </PopoverContent>
    </Popover>
  );
}
