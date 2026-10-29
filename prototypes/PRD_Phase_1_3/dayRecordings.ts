import { MOCK_CAMERAS } from "@/mocks/cameras";
import { findSiteById } from "@/mocks/sites";
import { DEFAULT_CONFIG, type RecordingTypeId } from "./recordingTypes";

/* Derived recordings for the Phase 1.3 Recordings page.

   Matches the Recording Schedule's per-site modes. A site open round the clock
   records continuously — one recording per camera a day. A site that keeps
   hours records by them (operation), then rests in standby until it opens
   again.

   A camera-day is one listed recording: continuous, or operation. Standby is
   not a recording of its own — it is the other half of an operation day, so it
   hangs off the operation recording, and the motion clips hang off standby. */

export interface DayRecording {
  id: string;
  cameraId: string;
  cameraName: string;
  areaName: string;
  siteName: string;
  siteId: string;
  areaId: string;
  nvrId: string | null;
  resolution: string;
  dateLabel: string;
  type: RecordingTypeId;
  /** "HH:mm" from the type's configured window. */
  startsAt: string;
  endsAt: string;
  startsAtDisplay: string;
  endsAtDisplay: string;
  durationMinutes: number;
  durationDisplay: string;
  fileSizeDisplay: string;
  fileSizeMb: number;
  /** Motion clips inside a standby recording; 1 for everything else. */
  clipCount: number;
  fps: number;
  /** Day index — 0 is today. Used for sorting without parsing the label. */
  dayIndex: number;
  /** Standby only — the motion recording folded inside it, split into clips by motionClipsFor. */
  motion?: DayRecording;
  /** Operation only — the standby that runs outside its hours, carrying the motion clips. */
  standby?: DayRecording;
}

export const DAYS = ["Today", "Yesterday", "23 May 2026"] as const;

/** Minutes from start to end, running past midnight when end comes first. */
export function spanMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const a = sh * 60 + sm;
  const b = eh * 60 + em;
  return b > a ? b - a : 1440 - a + b;
}

/** Rough bitrate per type, so file sizes track resolution and fps sensibly. */
function megabytesFor(id: RecordingTypeId, minutes: number): number {
  const cfg = DEFAULT_CONFIG[id];
  const pixels = cfg.resolution === "1920x1080" ? 2.07 : 0.92;
  const mbPerMin = pixels * (cfg.fps / 30) * 3.4;
  return Math.round(minutes * mbPerMin);
}

export function fmtDuration(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}h ${String(minutes % 60).padStart(2, "0")}m`;
}

export function fmtSize(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb} MB`;
}

function buildRecordings(): DayRecording[] {
  const cameras = MOCK_CAMERAS.filter((c) => c.nvrId && c.status === "online");
  const out: DayRecording[] = [];
  let n = 1;

  DAYS.forEach((dateLabel, dayIdx) => {
    cameras.forEach((c) => {
      const make = (type: RecordingTypeId, start: string, end: string, minutes: number, clips = 1): DayRecording => {
        const cfg = DEFAULT_CONFIG[type];
        const mb = megabytesFor(type, minutes);
        return {
          id: `REC-${String(n).padStart(4, "0")}`,
          cameraId: c.id,
          cameraName: c.name,
          areaName: c.areaName,
          siteName: c.siteName,
          siteId: c.siteId,
          areaId: c.areaId,
          nvrId: c.nvrId,
          resolution: cfg.resolution,
          fps: cfg.fps,
          dateLabel,
          dayIndex: dayIdx,
          type,
          startsAt: start,
          endsAt: end,
          startsAtDisplay: `${start}:00`,
          endsAtDisplay: `${end}:00`,
          durationMinutes: minutes,
          durationDisplay: fmtDuration(minutes),
          fileSizeMb: mb,
          fileSizeDisplay: fmtSize(mb),
          clipCount: clips,
        };
      };

      // Main recording: continuous at a round-the-clock site, else operation hours.
      const hours = findSiteById(c.siteId)?.operatingHours;
      const roundTheClock = !hours || (hours.from === "00:00" && hours.to === "23:59");
      const [type, start, end] = roundTheClock
        ? (["continuous", "00:00", "23:59"] as const)
        : (["operation", hours.from, hours.to] as const);
      const main = make(type, start, end, spanMinutes(start, end));
      out.push(main);
      n++;
      // Continuous has nothing to rest in — standby and motion belong to operation mode.
      if (roundTheClock) return;

      // Standby from closing to opening, with the motion that fired inside it — in bursts.
      const standby = make("standby", hours.to, hours.from, spanMinutes(hours.to, hours.from));
      const clips = Math.max(1, c.recentEventCount - dayIdx * 2);
      const motionMinutes = Math.round(standby.durationMinutes * 0.08) + (c.recentEventCount % 17);
      /* Standby is a phase of the operation day, not a row of its own, so it
         takes the operation recording's id with a suffix rather than the next
         number — the listed ids stay consecutive. */
      standby.id = `${main.id}-SB`;
      // Same id as its standby, so the clips read REC-0001-SB-01, -02 …
      standby.motion = { ...make("motion", hours.to, hours.from, motionMinutes, clips), id: standby.id };
      standby.clipCount = clips;
      main.standby = standby;
    });
  });

  return out;
}

export const ALL_RECORDINGS: DayRecording[] = buildRecordings();

/* ── Detected periods ────────────────────────────────────────────────────── */

export interface DetectedPeriod {
  label: string;
  /** 0..1 along the recording. */
  at: number;
  tone: "info" | "warning" | "critical";
}

const PERIOD_LABELS = ["Person detected", "PPE violation", "Unattended object", "Vehicle entered"];

/** Deterministic markers, so a recording always shows the same detections. */
export function periodsFor(rec: DayRecording): DetectedPeriod[] {
  const seed = rec.id.split("").reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const count = rec.type === "motion" ? Math.min(4, rec.clipCount) : (seed % 3) + 1;
  const tones = ["info", "warning", "critical"] as const;
  return Array.from({ length: count }, (_, i) => ({
    label: PERIOD_LABELS[(seed + i) % PERIOD_LABELS.length],
    at: ((i + 1) / (count + 1)) * 0.92 + ((seed % 7) / 100),
    tone: tones[(seed + i) % 3],
  }));
}

/* ── Motion clips ────────────────────────────────────────────────────────── */

function hhmmToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToClock(total: number): string {
  const m = ((Math.round(total) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/**
 * The individual clips inside a day's motion recording. Motion only fires while
 * something moves, so one "recording" is really several short bursts spread
 * across the standby window it runs inside. Each clip is a full DayRecording so
 * the player opens it exactly like any other recording.
 *
 * Deterministic from the recording id: the same day always splits the same way,
 * and the clips' durations and sizes add back up to the parent's totals.
 */
export function motionClipsFor(motion: DayRecording): DayRecording[] {
  const n = Math.max(1, motion.clipCount);
  const seed = motion.id.split("").reduce((s, ch) => s + ch.charCodeAt(0), 0);

  const start = hhmmToMinutes(motion.startsAt);
  const end = hhmmToMinutes(motion.endsAt);
  const span = end > start ? end - start : 1440 - start + end;

  // Uneven weights so the clips are not all the same length.
  const weights = Array.from({ length: n }, (_, i) => 1 + ((seed * (i + 3)) % 5));
  const weightSum = weights.reduce((a, b) => a + b, 0);

  let minutesLeft = motion.durationMinutes;
  let mbLeft = motion.fileSizeMb;

  return weights.map((w, i) => {
    const last = i === n - 1;
    // The last clip takes the remainder, so the totals always reconcile.
    const minutes = last ? Math.max(1, minutesLeft) : Math.max(1, Math.round((motion.durationMinutes * w) / weightSum));
    const mb = last ? Math.max(1, mbLeft) : Math.max(1, Math.round((motion.fileSizeMb * w) / weightSum));
    minutesLeft -= minutes;
    mbLeft -= mb;

    // Spread the bursts across the window, nudged off an even grid.
    const slot = span / n;
    const jitter = ((seed + i * 37) % 100) / 100;
    const at = start + slot * i + slot * 0.1 + jitter * Math.max(0, slot * 0.8 - minutes);
    const clipStart = minutesToClock(at);
    const clipEnd = minutesToClock(at + minutes);

    return {
      ...motion,
      id: `${motion.id}-${String(i + 1).padStart(2, "0")}`,
      startsAt: clipStart,
      endsAt: clipEnd,
      startsAtDisplay: `${clipStart}:00`,
      endsAtDisplay: `${clipEnd}:00`,
      durationMinutes: minutes,
      durationDisplay: fmtDuration(minutes),
      fileSizeMb: mb,
      fileSizeDisplay: fmtSize(mb),
      clipCount: 1,
    };
  });
}
