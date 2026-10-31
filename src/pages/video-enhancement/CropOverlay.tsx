import * as React from "react";
import { cn } from "@/lib/utils";
import { dragRect, type CropRect, type Handle } from "./cropRect";

/* The box drawn over the video while cropping. Drag inside it to move it,
   drag a handle to resize it. Everything outside the box dims, so the part
   being cut is still visible. */

const CORNERS: { id: Handle; className: string }[] = [
  { id: "nw", className: "-left-1.5 -top-1.5 cursor-nwse-resize" },
  { id: "ne", className: "-right-1.5 -top-1.5 cursor-nesw-resize" },
  { id: "sw", className: "-bottom-1.5 -left-1.5 cursor-nesw-resize" },
  { id: "se", className: "-bottom-1.5 -right-1.5 cursor-nwse-resize" },
];

const EDGES: { id: Handle; className: string }[] = [
  { id: "n", className: "left-1/2 -top-1 h-2 w-8 -translate-x-1/2 cursor-ns-resize" },
  { id: "s", className: "left-1/2 -bottom-1 h-2 w-8 -translate-x-1/2 cursor-ns-resize" },
  { id: "w", className: "top-1/2 -left-1 h-8 w-2 -translate-y-1/2 cursor-ew-resize" },
  { id: "e", className: "top-1/2 -right-1 h-8 w-2 -translate-y-1/2 cursor-ew-resize" },
];

export function CropOverlay({
  rect,
  ratio,
  onChange,
}: {
  rect: CropRect;
  /** Pixel width ÷ height to hold, or null for a free box. */
  ratio: number | null;
  onChange: (rect: CropRect) => void;
}) {
  const frameRef = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ handle: Handle; px: number; py: number; start: CropRect } | null>(null);

  // One handler for the box and every handle; `data-handle` says which was grabbed.
  function begin(e: React.PointerEvent) {
    const handle = (e.target as HTMLElement).closest<HTMLElement>("[data-handle]")?.dataset.handle as Handle | undefined;
    if (!handle) return;
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { handle, px: e.clientX, py: e.clientY, start: rect };
  }

  function move(e: React.PointerEvent) {
    const d = drag.current;
    const box = frameRef.current?.getBoundingClientRect();
    if (!d || !box) return;
    const dx = (e.clientX - d.px) / box.width;
    const dy = (e.clientY - d.py) / box.height;
    onChange(dragRect(d.start, d.handle, dx, dy, ratio));
  }

  function end() {
    drag.current = null;
  }

  const pct = (v: number) => `${v * 100}%`;

  return (
    <div
      ref={frameRef}
      className="absolute inset-0 touch-none select-none"
      onPointerDown={begin}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div
        className="absolute cursor-move border-2 border-primary shadow-[0_0_0_9999px_rgb(0_0_0/0.55)]"
        style={{ left: pct(rect.x), top: pct(rect.y), width: pct(rect.w), height: pct(rect.h) }}
        data-handle="move"
      >
        {/* Rule-of-thirds guides */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-y-0 left-1/3 w-px bg-white/30" />
          <div className="absolute inset-y-0 left-2/3 w-px bg-white/30" />
          <div className="absolute inset-x-0 top-1/3 h-px bg-white/30" />
          <div className="absolute inset-x-0 top-2/3 h-px bg-white/30" />
        </div>
        {CORNERS.map((h) => (
          <span
            key={h.id}
            data-handle={h.id}
            className={cn("absolute size-3 rounded-sm border-2 border-primary bg-background", h.className)}
          />
        ))}
        {!ratio &&
          EDGES.map((h) => (
            <span key={h.id} data-handle={h.id} className={cn("absolute rounded-full bg-primary", h.className)} />
          ))}
        {/* Size label sits above the box, or just inside it when the box is at the top edge. */}
        <span
          className={cn(
            "pointer-events-none absolute left-0 rounded bg-primary px-1.5 py-px font-mono text-3xs font-bold text-primary-foreground",
            rect.y < 0.08 ? "left-1 top-1" : "-top-6"
          )}
        >
          {Math.round(rect.w * 100)}% × {Math.round(rect.h * 100)}%
        </span>
      </div>
    </div>
  );
}
