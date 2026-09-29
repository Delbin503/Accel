import type { TrmsDetection } from "./trmsData";

/* Formatters shared by the TRMS pages. Kept out of the component files so
   those only export components. */

export function hhmmss(iso: string): string {
  return new Date(iso).toTimeString().slice(0, 8);
}

export function relativeTime(iso: string, now: number): string {
  const secs = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

export function whereLabel(d: TrmsDetection): string {
  return `${d.stationId} › Lane ${d.lane} · ${d.cameraId}`;
}

/** "00:23:14" — hours kept, since an assignment runs for most of a shift. */
export function elapsedClock(fromIso: string, now: number): string {
  const s = Math.max(0, Math.floor((now - new Date(fromIso).getTime()) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return [h, m, s % 60].map((n) => String(n).padStart(2, "0")).join(":");
}
