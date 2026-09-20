/* Shared playback vocabulary for the synchronised-playback proposal.
   One buffer window, one state shape — a tile playing on its own and four
   tiles playing in sync run through exactly the same controls. */

/** How far back a live stream can be scrubbed (seconds). */
export const BUFFER_SEC = 6 * 60 * 60;

export const SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4, 8] as const;

/* ── Seeded demo data ────────────────────────────────────────────────── */

/** Standing detections on a camera, derived from its id so it never flickers. */
export function detCount(id: string): number {
  const h = id.split("").reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return h % 5;
}

/** Deterministic per-camera event markers so the timeline is not empty. */
export function markersFor(id: string) {
  const base = id.split("").reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const tones = ["info", "warning", "critical"] as const;
  return Array.from({ length: 3 }, (_, i) => ({
    at: ((base * (i + 3)) % (BUFFER_SEC - 600)) + 300,
    tone: tones[(base + i) % 3],
    label: ["Person detected", "PPE violation", "Unattended object"][(base + i) % 3],
  }));
}

/* ── Zoom ────────────────────────────────────────────────────────────── */

/**
 * Magnification of a frame: how far in, and the point it centres on. Drawing a
 * box was unusable on a sidebar tile a few hundred pixels wide, so zoom is a
 * level the operator steps through with the scroll wheel or the + / − keys.
 */
export interface ZoomState {
  /** 1 = the whole frame. */
  level: number;
  /** Focal point the magnified view centres on, normalised 0..1. */
  cx: number;
  cy: number;
}

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 8;
/** One press of + / −. One wheel notch moves twice as far. */
export const ZOOM_STEP = 0.25;

export const NO_ZOOM: ZoomState = { level: ZOOM_MIN, cx: 0.5, cy: 0.5 };

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Holds the level in range and keeps the focal point far enough from the edges
 * that the magnified frame still covers the tile — no blank margins.
 */
export function clampZoom(zoom: ZoomState): ZoomState {
  const level = clamp(zoom.level, ZOOM_MIN, ZOOM_MAX);
  const half = 0.5 / level;
  return {
    level,
    cx: clamp(zoom.cx, half, 1 - half),
    cy: clamp(zoom.cy, half, 1 - half),
  };
}

/** Steps the level by `delta`, pulling the view towards `focus` as it goes. */
export function zoomBy(zoom: ZoomState, delta: number, focus?: { x: number; y: number }): ZoomState {
  const level = clamp(zoom.level + delta, ZOOM_MIN, ZOOM_MAX);
  if (level <= ZOOM_MIN) return NO_ZOOM;
  // Zooming in chases the cursor; zooming out drifts back towards the middle,
  // so scrolling all the way out always lands on the whole frame again.
  const pull = delta > 0 ? 0.5 : 0.25;
  const target = focus ?? { x: zoom.cx, y: zoom.cy };
  return clampZoom({
    level,
    cx: zoom.cx + (target.x - zoom.cx) * pull,
    cy: zoom.cy + (target.y - zoom.cy) * pull,
  });
}

/** Shifts the focal point without changing the level. Steps shrink as you zoom in. */
export function panZoom(zoom: ZoomState, dx: number, dy: number): ZoomState {
  const step = 0.15 / zoom.level;
  return clampZoom({ ...zoom, cx: zoom.cx + dx * step, cy: zoom.cy + dy * step });
}

export function isZoomed(zoom: ZoomState): boolean {
  return zoom.level > ZOOM_MIN + 0.001;
}

/** "250%" — what the zoom readout shows. */
export function zoomPercent(zoom: ZoomState): string {
  return `${Math.round(zoom.level * 100)}%`;
}

/** CSS transform that magnifies the frame around the focal point. */
export function zoomTransform(zoom: ZoomState): string {
  const { level, cx, cy } = clampZoom(zoom);
  if (level <= ZOOM_MIN) return "none";
  // Origin is the top-left corner, so translate first and scale about (0,0):
  // the focal point lands dead centre of the tile.
  const tx = (0.5 / level - cx) * 100;
  const ty = (0.5 / level - cy) * 100;
  return `scale(${level.toFixed(3)}) translate(${tx.toFixed(2)}%, ${ty.toFixed(2)}%)`;
}

/* ── Playback ────────────────────────────────────────────────────────── */

export interface PlaybackState {
  /** Seconds behind live. 0 = live edge. */
  offsetSec: number;
  playing: boolean;
  speed: number;
  muted: boolean;
  /** Magnification of the frame. `NO_ZOOM` is the full frame. */
  zoom: ZoomState;
}

export const LIVE_STATE: PlaybackState = {
  offsetSec: 0,
  playing: true,
  speed: 1,
  muted: true,
  zoom: NO_ZOOM,
};

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
