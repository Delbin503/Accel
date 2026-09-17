
/* Shared playback vocabulary for the synchronised-playback proposal.
   One buffer window, one state shape — a tile playing on its own and four
   tiles playing in sync run through exactly the same controls. */

/** How far back a live stream can be scrubbed (seconds). */
export const BUFFER_SEC = 6 * 60 * 60;

export const SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4, 8] as const;
/** A region of the frame to magnify, normalised 0..1 against the tile. */
export interface ZoomRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlaybackState {
  /** Seconds behind live. 0 = live edge. */
  offsetSec: number;
  playing: boolean;
  speed: number;
  muted: boolean;
  /** Set by dragging a box on the frame; null is the full frame. */
  zoomRect: ZoomRect | null;
}

export const LIVE_STATE: PlaybackState = {
  offsetSec: 0,
  playing: true,
  speed: 1,
  muted: true,
  zoomRect: null,
};

/** CSS transform that magnifies `rect` to fill the tile. */
export function zoomTransform(rect: ZoomRect | null): string {
  if (!rect) return "none";
  // Fit the longer side, so the whole selected region stays visible.
  const scale = 1 / Math.max(rect.w, rect.h, 0.05);
  return `scale(${scale.toFixed(3)}) translate(${(-rect.x * 100).toFixed(2)}%, ${(-rect.y * 100).toFixed(2)}%)`;
}

/** "1:37:24" — hours dropped when the offset is under an hour. */
export function fmtOffset(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const mm = String(m).padStart(2, "0");
  const sss = String(ss).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${sss}` : `${mm}:${sss}`;
}

/** Wall-clock time of a point `offsetSec` behind `now`. */
export function timestampAt(now: Date, offsetSec: number): string {
  const d = new Date(now.getTime() - offsetSec * 1000);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
