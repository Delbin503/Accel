import { MOCK_CAMERAS } from "@/mocks/cameras";
import { DEFAULT_CONFIG, RECORDING_TYPES, type RecordingTypeId } from "./recordingTypes";

/* Derived recordings for the Phase 1.3 proposals.

   One recording per enabled type, per camera, per day — built once here so the
   "Recordings by type" list and the camera-day Recordings page describe the
   same footage instead of inventing it twice. */

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
  clipCount: number;
}

export const DAYS = ["Today", "Yesterday", "23 May 2026"] as const;

/** Minutes a type covers in a day, from its configured window. */
export function windowMinutes(id: RecordingTypeId): number {
  const cfg = DEFAULT_CONFIG[id];
  const [sh, sm] = cfg.startTime.split(":").map(Number);
  const [eh, em] = cfg.endTime.split(":").map(Number);
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  return end > start ? end - start : 1440 - start + end;
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

/**
 * One recording per type, per camera, per day. Motion is the exception: it
 * captures in bursts, so its row stands for a set of clips.
 */
function buildRecordings(): DayRecording[] {
  const cameras = MOCK_CAMERAS.filter((c) => c.nvrId && c.status === "online");
  const out: DayRecording[] = [];
  let n = 1;

  DAYS.forEach((dateLabel, dayIdx) => {
    cameras.forEach((c) => {
      RECORDING_TYPES.forEach((t) => {
        const cfg = DEFAULT_CONFIG[t.id];
        if (!cfg.enabled) return;
        // A nested type only records while its parent is recording.
        if (t.parent && !DEFAULT_CONFIG[t.parent].enabled) return;
        const mins = windowMinutes(t.id);
        // Motion recording only runs while something moves — a fraction of the window.
        const effective = t.id === "motion" ? Math.round(mins * 0.08) + (c.recentEventCount % 17) : mins;
        const clips = t.id === "motion" ? Math.max(1, c.recentEventCount - dayIdx * 2) : 1;
        const mb = megabytesFor(t.id, effective);

        out.push({
          id: `REC-${String(n++).padStart(4, "0")}`,
          cameraId: c.id,
          cameraName: c.name,
          areaName: c.areaName,
          siteName: c.siteName,
          siteId: c.siteId,
          areaId: c.areaId,
          nvrId: c.nvrId,
          resolution: cfg.resolution,
          dateLabel,
          type: t.id,
          startsAt: cfg.startTime,
          endsAt: cfg.endTime,
          startsAtDisplay: `${cfg.startTime}:00`,
          endsAtDisplay: `${cfg.endTime}:00`,
          durationMinutes: effective,
          durationDisplay: fmtDuration(effective),
          fileSizeMb: mb,
          fileSizeDisplay: fmtSize(mb),
          clipCount: clips,
        });
      });
    });
  });

  return out;
}

export const ALL_RECORDINGS: DayRecording[] = buildRecordings();

/* ── Camera-day grouping ─────────────────────────────────────────────────── */

/**
 * A camera's whole day. This is the unit the Recordings page lists, because a
 * camera no longer produces one file a day — it produces one per enabled type.
 */
export interface CameraDay {
  key: string;
  cameraId: string;
  cameraName: string;
  areaName: string;
  siteName: string;
  siteId: string;
  areaId: string;
  nvrId: string | null;
  resolution: string;
  dateLabel: string;
  /** Day index — 0 is today. Used for sorting without parsing the label. */
  dayIndex: number;
  recordings: DayRecording[];
  totalMinutes: number;
  totalMb: number;
  totalSizeDisplay: string;
  totalDurationDisplay: string;
  clipCount: number;
  /** Earliest start across the day's recordings, for the card's time chip. */
  firstStartDisplay: string;
}

export function buildCameraDays(source: DayRecording[] = ALL_RECORDINGS): CameraDay[] {
  const map = new Map<string, CameraDay>();

  source.forEach((r) => {
    const key = `${r.cameraId}::${r.dateLabel}`;
    let day = map.get(key);
    if (!day) {
      day = {
        key,
        cameraId: r.cameraId,
        cameraName: r.cameraName,
        areaName: r.areaName,
        siteName: r.siteName,
        siteId: r.siteId,
        areaId: r.areaId,
        nvrId: r.nvrId,
        resolution: r.resolution,
        dateLabel: r.dateLabel,
        dayIndex: DAYS.indexOf(r.dateLabel as (typeof DAYS)[number]),
        recordings: [],
        totalMinutes: 0,
        totalMb: 0,
        totalSizeDisplay: "",
        totalDurationDisplay: "",
        clipCount: 0,
        firstStartDisplay: r.startsAtDisplay,
      };
      map.set(key, day);
    }
    day.recordings.push(r);
    day.totalMinutes += r.durationMinutes;
    day.totalMb += r.fileSizeMb;
    day.clipCount += r.clipCount;
    if (r.startsAt < day.firstStartDisplay.slice(0, 5)) day.firstStartDisplay = r.startsAtDisplay;
  });

  return [...map.values()].map((d) => ({
    ...d,
    totalSizeDisplay: fmtSize(d.totalMb),
    totalDurationDisplay: fmtDuration(d.totalMinutes),
  }));
}

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
