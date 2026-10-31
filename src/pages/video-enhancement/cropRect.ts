/* Crop geometry for Video Enhancement. A crop is a box in fractions of the
   frame (0–1), so it holds whatever size the viewer is drawn at. */

export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A crop the user drew and saved; one at a time can be switched on. */
export interface SavedCrop {
  id: string;
  name: string;
  rect: CropRect;
}

/** The frame the viewer draws — every Accel camera records 16:9. */
export const FRAME_ASPECT = 16 / 9;

/** Smallest box the handles allow, as a fraction of the frame. */
export const MIN_SIZE = 0.1;

export const ASPECTS = [
  { id: "free", label: "Free", ratio: null },
  { id: "16:9", label: "16:9", ratio: 16 / 9 },
  { id: "4:3", label: "4:3", ratio: 4 / 3 },
  { id: "1:1", label: "Square", ratio: 1 },
] as const;

export type AspectId = (typeof ASPECTS)[number]["id"];

/** Where a new box starts: centred, most of the frame. */
export const START_RECT: CropRect = { x: 0.15, y: 0.15, w: 0.7, h: 0.7 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * The largest box of `ratio` (width ÷ height, in pixels) that fits 80% of the
 * frame, centred on `around`.
 */
export function rectForAspect(ratio: number, around: CropRect): CropRect {
  // In frame fractions a pixel ratio r is w/h = r / FRAME_ASPECT.
  const r = ratio / FRAME_ASPECT;
  let w = 0.8;
  let h = w / r;
  if (h > 0.8) {
    h = 0.8;
    w = h * r;
  }
  const cx = around.x + around.w / 2;
  const cy = around.y + around.h / 2;
  return { x: clamp(cx - w / 2, 0, 1 - w), y: clamp(cy - h / 2, 0, 1 - h), w, h };
}

export type Handle = "move" | "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

/**
 * The box after dragging `handle` by (dx, dy) — fractions of the frame — from
 * `start`. With `ratio` set, corners keep the shape and edges are not offered.
 */
export function dragRect(start: CropRect, handle: Handle, dx: number, dy: number, ratio: number | null): CropRect {
  if (handle === "move") {
    return { ...start, x: clamp(start.x + dx, 0, 1 - start.w), y: clamp(start.y + dy, 0, 1 - start.h) };
  }
  let { x, y, w, h } = start;
  const right = x + w;
  const bottom = y + h;
  if (handle.includes("w")) { x = clamp(x + dx, 0, right - MIN_SIZE); w = right - x; }
  if (handle.includes("e")) { w = clamp(w + dx, MIN_SIZE, 1 - x); }
  if (handle.includes("n")) { y = clamp(y + dy, 0, bottom - MIN_SIZE); h = bottom - y; }
  if (handle.includes("s")) { h = clamp(h + dy, MIN_SIZE, 1 - y); }

  if (ratio) {
    const r = ratio / FRAME_ASPECT;
    // Width leads; height follows, and both shrink if that runs off the frame.
    h = w / r;
    const room = handle.includes("n") ? bottom : 1 - y;
    if (h > room) { h = room; w = h * r; }
    if (handle.includes("w")) x = right - w;
    if (handle.includes("n")) y = bottom - h;
  }
  return { x, y, w, h };
}

/** "62% × 48%" — a saved crop's size, for the list. */
export function describeRect(r: CropRect): string {
  return `${Math.round(r.w * 100)}% × ${Math.round(r.h * 100)}%`;
}
