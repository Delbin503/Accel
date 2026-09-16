
/* Shared playback vocabulary for the synchronised-playback proposal.
   One buffer window, one state shape — a tile playing on its own and four
   tiles playing in sync run through exactly the same controls. */

/** How far back a live stream can be scrubbed (seconds). */
export const BUFFER_SEC = 6 * 60 * 60;

export const SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4, 8] as const;
export const ZOOMS = [1, 1.5, 2, 3] as const;
export const QUALITIES = ["Auto (1080p)", "1080p", "720p", "480p"] as const;

export interface PlaybackState {
  /** Seconds behind live. 0 = live edge. */
  offsetSec: number;
  playing: boolean;
  speed: number;
  zoom: number;
  muted: boolean;
  /** Detection boxes drawn over the frame. */
  annotations: boolean;
  quality: string;
}

export const LIVE_STATE: PlaybackState = {
  offsetSec: 0,
  playing: true,
  speed: 1,
  zoom: 1,
  muted: true,
  annotations: true,
  quality: "Auto (1080p)",
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
