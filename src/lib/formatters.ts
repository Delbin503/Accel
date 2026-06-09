/**
 * Shared formatting helpers. Dependency-free (native Intl/Date).
 * Consolidates the per-page relTime / formatEta / daysBetween / toLocaleString
 * implementations so date, duration, size and currency formatting are uniform.
 */

type DateInput = string | number | Date;

const toDate = (v: DateInput): Date => (v instanceof Date ? v : new Date(v));

/**
 * Relative time label ("just now", "5 min ago", "3 hrs ago", "2 days ago",
 * then an absolute "07 Jun" date past a week). Pass `now` to pin the reference
 * point (used by the prototype's stable REFERENCE_TODAY).
 */
export function formatRelativeTime(value: DateInput, now: DateInput = new Date()): string {
  const nowMs = toDate(now).getTime();
  const t = toDate(value).getTime();
  const diff = Math.max(0, nowMs - t);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return toDate(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/** Whole days between two dates (rounded). */
export function daysBetween(from: DateInput, to: DateInput): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / 86_400_000);
}

/** Shift a YYYY-MM-DD date string by `days` and return the same format. */
export function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Format a date with Intl options (defaults to "07 Jun 2026"). */
export function formatDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }
): string {
  return toDate(value).toLocaleDateString("en-GB", options);
}

/**
 * Compact duration from seconds.
 *  - "clock": 1:05:09 / 5:09
 *  - "long":  "1h 05m 09s" / "5m 09s" / "9s"
 */
export function formatDuration(totalSeconds: number, style: "clock" | "long" = "clock"): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (style === "clock") {
    return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`;
  }
  if (hrs > 0) return `${hrs}h ${pad(mins)}m ${pad(secs)}s`;
  if (mins > 0) return `${mins}m ${pad(secs)}s`;
  return `${secs}s`;
}

/** "almost done" / "~45s remaining" / "~2m 05s remaining" ETA label. */
export function formatEta(seconds: number): string {
  if (seconds <= 5) return "almost done";
  if (seconds < 60) return `~${seconds}s remaining`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `~${m}m ${s.toString().padStart(2, "0")}s remaining`;
}

/** Human-readable byte size ("1.4 GB", "512 MB"). */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : decimals)} ${units[i]}`;
}

/** Currency formatter (defaults to USD, no fractional cents). */
export function formatCurrency(
  amount: number,
  options: Intl.NumberFormatOptions = { style: "currency", currency: "USD", maximumFractionDigits: 0 }
): string {
  return new Intl.NumberFormat("en-US", options).format(amount);
}

/** Thousands-separated number. */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat("en-US", options).format(value);
}
