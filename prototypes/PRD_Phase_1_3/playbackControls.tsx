import * as React from "react";
import { cn } from "@/lib/utils";
import { BUFFER_SEC, fmtOffset, timestampAt } from "./playback";

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
