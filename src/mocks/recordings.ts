import type { RecordingEntry } from "@/types/cameras";
import { MOCK_CAMERAS } from "./cameras";

export interface RecordingDisplay extends RecordingEntry {
  startsAtDisplay: string;
  endsAtDisplay: string;
  dateLabel: string; // "Today" | "Yesterday" | "Mar 23, 2025"
  durationDisplay: string; // "06h 30m"
  fileSizeDisplay: string; // "1.55 GB"
  mode: "continuous" | "event" | "scheduled";
  eventCount: number;
  areaName: string;
  siteName: string;
  cameraName: string;
}

const PROJECT_NOW = new Date("2026-05-25T10:15:00");

function fmtDateLabel(d: Date): string {
  const diff = Math.floor((PROJECT_NOW.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function fmtTime(d: Date): string {
  return d.toTimeString().slice(0, 8);
}

function buildRecording(seed: {
  id: string;
  cameraId: string;
  nvrId: string;
  daysAgo: number;
  startHour: number;
  startMinute: number;
  durationMin: number;
  fileSizeMb: number;
  mode: RecordingDisplay["mode"];
  eventCount: number;
}): RecordingDisplay {
  const camera = MOCK_CAMERAS.find((c) => c.id === seed.cameraId);
  const startsAt = new Date(PROJECT_NOW);
  startsAt.setDate(startsAt.getDate() - seed.daysAgo);
  startsAt.setHours(seed.startHour, seed.startMinute, 0, 0);
  const endsAt = new Date(startsAt.getTime() + seed.durationMin * 60 * 1000);
  const durationSeconds = seed.durationMin * 60;

  const hours = Math.floor(seed.durationMin / 60);
  const mins = seed.durationMin % 60;
  const durationDisplay = `${String(hours).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m`;
  const fileSizeDisplay = seed.fileSizeMb >= 1024
    ? `${(seed.fileSizeMb / 1024).toFixed(2)} GB`
    : `${seed.fileSizeMb.toFixed(0)} MB`;

  return {
    id: seed.id,
    cameraId: seed.cameraId,
    nvrId: seed.nvrId,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    durationSeconds,
    fileSizeMb: seed.fileSizeMb,
    startsAtDisplay: fmtTime(startsAt),
    endsAtDisplay: fmtTime(endsAt),
    dateLabel: fmtDateLabel(startsAt),
    durationDisplay,
    fileSizeDisplay,
    mode: seed.mode,
    eventCount: seed.eventCount,
    cameraName: camera?.name ?? seed.cameraId,
    siteName: camera?.siteName ?? "",
    areaName: camera?.areaName ?? "",
  };
}

/** Recordings only exist for cameras that are linked to an NVR. */
function buildAll(): RecordingDisplay[] {
  const list: RecordingDisplay[] = [];
  const camerasWithNvr = MOCK_CAMERAS.filter((c) => c.nvrId);
  let counter = 1;

  camerasWithNvr.forEach((c) => {
    // Today + Yesterday + 3 days back + 5 days back + 12 days back
    const days = [0, 1, 3, 5, 12];
    days.forEach((daysAgo, i) => {
      list.push(
        buildRecording({
          id: `REC-${String(counter++).padStart(3, "0")}`,
          cameraId: c.id,
          nvrId: c.nvrId!,
          daysAgo,
          startHour: 6 + i * 4,
          startMinute: 0,
          durationMin: 380 + (i * 7),
          fileSizeMb: 1450 + i * 90 + (c.recentEventCount % 200),
          mode: i % 3 === 0 ? "continuous" : i % 3 === 1 ? "event" : "scheduled",
          eventCount: Math.max(0, c.recentEventCount - i * 2),
        })
      );
    });
  });

  return list;
}

export const MOCK_RECORDINGS: RecordingDisplay[] = buildAll();

export function getRecordingsForCamera(cameraId: string): RecordingDisplay[] {
  return MOCK_RECORDINGS.filter((r) => r.cameraId === cameraId).sort(
    (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
  );
}
