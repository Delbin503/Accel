import type { DetectionEvent, Severity } from "@/types/detection";

/* TRMS domain for the prototype — base stations, registered weapons, the
   active assignment, which stations each camera has covered, and the
   detections those cameras raise.

   Live Monitoring, Alert Log and Devices all read from here, so a detection
   raised on one page is the same record, with the same id, on the others. */

/* ── Base stations ───────────────────────────────────────────────────── */

export interface Station {
  id: string;
  name: string;
  lanes: number;
}

export const STATIONS: Station[] = [
  { id: "IMT-01", name: "IMT-01 · North Armoury", lanes: 12 },
  { id: "IMT-02", name: "IMT-02 · Range Complex", lanes: 16 },
  { id: "IMT-03", name: "IMT-03 · Training Block", lanes: 8 },
  { id: "IMT-04", name: "IMT-04 · Vehicle Bay", lanes: 6 },
  { id: "IMT-05", name: "IMT-05 · South Gate", lanes: 4 },
];

export function stationName(id: string): string {
  return STATIONS.find((s) => s.id === id)?.name ?? id;
}

/* ── Camera ↔ station history ────────────────────────────────────────── */

export interface StationStint {
  stationId: string;
  /** Display date the camera started covering this station. */
  from: string;
  /** Absent while the camera is still here. */
  to?: string;
}

/**
 * Every station a camera has been mounted at, current stint first. Cameras
 * get moved between stations as ranges are reconfigured, so the count is how
 * many a camera has covered over its life — not how many it covers now.
 */
export const CAMERA_STATIONS: Record<string, StationStint[]> = {
  "Cam-01": [
    { stationId: "IMT-01", from: "02 Mar 2026" },
    { stationId: "IMT-03", from: "14 Nov 2025", to: "01 Mar 2026" },
  ],
  "Cam-04": [{ stationId: "IMT-02", from: "18 Jan 2026" }],
  "Cam-07": [
    { stationId: "IMT-02", from: "09 Apr 2026" },
    { stationId: "IMT-04", from: "22 Dec 2025", to: "08 Apr 2026" },
    { stationId: "IMT-01", from: "03 Sep 2025", to: "21 Dec 2025" },
  ],
  "Cam-09": [{ stationId: "IMT-03", from: "11 Feb 2026" }],
  "Cam-12": [
    { stationId: "IMT-01", from: "27 May 2026" },
    { stationId: "IMT-05", from: "06 Jan 2026", to: "26 May 2026" },
  ],
  "Cam-15": [{ stationId: "IMT-04", from: "30 Mar 2026" }],
  "Cam-18": [
    { stationId: "IMT-05", from: "15 Jun 2026" },
    { stationId: "IMT-02", from: "10 Oct 2025", to: "14 Jun 2026" },
    { stationId: "IMT-03", from: "01 Jul 2025", to: "09 Oct 2025" },
    { stationId: "IMT-01", from: "12 Mar 2025", to: "30 Jun 2025" },
  ],
  "Cam-22": [{ stationId: "IMT-02", from: "04 Aug 2026" }],
  "Cam-24": [
    { stationId: "IMT-03", from: "19 Feb 2026" },
    { stationId: "IMT-04", from: "08 Sep 2025", to: "18 Feb 2026" },
  ],
  "Cam-30": [{ stationId: "IMT-04", from: "25 Jul 2026" }],
  "Cam-32": [
    { stationId: "IMT-05", from: "13 May 2026" },
    { stationId: "IMT-01", from: "20 Jan 2026", to: "12 May 2026" },
  ],
};

export function stationsForCamera(cameraId: string): StationStint[] {
  return CAMERA_STATIONS[cameraId] ?? [];
}

export function currentStation(cameraId: string): string {
  return stationsForCamera(cameraId)[0]?.stationId ?? "IMT-01";
}

/* ── Weapons & the active assignment ─────────────────────────────────── */

/** Registered weapons across all stations. */
export const REGISTERED_WEAPONS = Array.from({ length: 20 }, (_, i) => ({
  serial: `SAR21 #A-${String(380 + i * 3).padStart(4, "0")}`,
  stationId: STATIONS[i % STATIONS.length].id,
}));

export interface Assignment {
  id: string;
  person: string;
  personId: string;
  weaponSerial: string;
  stationId: string;
  lane: number;
  cameraId: string;
  /** ISO — the person timer counts up from here. */
  startedAt: string;
}

/** Started a little before the page loaded, so the timer is already running. */
const BOOT = Date.now();

export const ACTIVE_ASSIGNMENT: Assignment = {
  id: "ASG-2026-0142",
  person: "Pte. Tan Wei Ming",
  personId: "PER-3308",
  weaponSerial: "SAR21 #A-0421",
  stationId: "IMT-02",
  lane: 11,
  cameraId: "Cam-04",
  startedAt: new Date(BOOT - (23 * 60 + 14) * 1000).toISOString(),
};

/* ── Detections ──────────────────────────────────────────────────────── */

export type DetectionKind = "person" | "weapon";
export type DetectionStatus = "pending" | "escalated" | "dismissed";

export interface TrmsDetection {
  id: string;
  kind: DetectionKind;
  severity: Severity;
  status: DetectionStatus;
  cameraId: string;
  stationId: string;
  lane: number;
  assignmentId?: string;
  /** Person name for a person detection, weapon serial for a weapon one. */
  subject: string;
  confidence: number;
  /** ISO timestamp. */
  at: string;
  caseId?: string;
}

export const KIND_LABEL: Record<DetectionKind, string> = {
  person: "Person detected",
  weapon: "Weapon detected",
};

let detectionCounter = 1;

export function nextDetectionId(): string {
  return `DET-${String(detectionCounter++).padStart(4, "0")}`;
}

const PEOPLE = ["Pte. Tan Wei Ming", "Cpl. Aisyah Rahman", "LCP Marcus Lim", "Pte. Daniel Goh", "Sgt. Priya Nair"];
const ONLINE_CAMERAS = ["Cam-01", "Cam-04", "Cam-07", "Cam-09", "Cam-12", "Cam-15", "Cam-18", "Cam-22"];

/**
 * A weapon seen without a live assignment behind it is the case that needs a
 * human — so it is the one that comes in critical, not every weapon sighting.
 */
export function makeDetection(kind: DetectionKind, seed: number, at: Date): TrmsDetection {
  const cameraId = ONLINE_CAMERAS[seed % ONLINE_CAMERAS.length];
  const stationId = currentStation(cameraId);
  const onAssignment = seed % 4 !== 3;
  const weapon = REGISTERED_WEAPONS[seed % REGISTERED_WEAPONS.length];
  return {
    id: nextDetectionId(),
    kind,
    severity: kind === "weapon" ? (onAssignment ? "medium" : "critical") : "low",
    status: "pending",
    cameraId,
    stationId,
    lane: (seed % 12) + 1,
    assignmentId: onAssignment ? ACTIVE_ASSIGNMENT.id : undefined,
    subject: kind === "person" ? PEOPLE[seed % PEOPLE.length] : weapon.serial,
    confidence: 0.82 + (seed % 15) / 100,
    at: at.toISOString(),
  };
}

/** Today's history, oldest first, spread over the last few hours. */
export function seedDetections(): TrmsDetection[] {
  const out: TrmsDetection[] = [];
  for (let i = 0; i < 12; i++) {
    const kind: DetectionKind = i % 3 === 1 ? "person" : "weapon";
    const minutesAgo = 12 + (12 - i) * 17;
    out.push(makeDetection(kind, i + 2, new Date(BOOT - minutesAgo * 60 * 1000)));
  }
  return out.reverse();
}

/* ── Adapter for the shared incident-cases module ────────────────────── */

function hhmmss(d: Date): string {
  return d.toTimeString().slice(0, 8);
}

/**
 * Shapes a TRMS detection as the app's DetectionEvent, so the real Incident
 * Cases drawer can show the detections linked to a case instead of listing
 * their ids as unresolved.
 */
export function toDetectionEvent(d: TrmsDetection): DetectionEvent {
  const at = new Date(d.at);
  const label = KIND_LABEL[d.kind];
  const subjectRef = d.kind === "person" ? d.subject : d.subject.replace("SAR21 ", "");
  return {
    id: d.id,
    severity: d.severity,
    status: d.status,
    // The app's type union has no weapon/person members; the label carries the TRMS meaning.
    type: d.kind === "weapon" ? "movement" : "unauth",
    typeLabel: label,
    useCaseId: d.kind === "weapon" ? "Mdl_TRMS_W" : "Mdl_TRMS_P",
    useCaseTitle: label,
    model: d.kind === "weapon" ? "Weapon Tracking" : "Person Detection",
    modelKey: d.kind === "weapon" ? "trms-weapon" : "trms-person",
    summary: `${label} — [[${subjectRef}]] at **${d.stationId} › Lane ${d.lane}**${
      d.assignmentId ? ` on ${d.assignmentId}` : " !!with no active assignment!!"
    }`,
    vlmReasoning: `${label} on ${d.cameraId} with ${(d.confidence * 100).toFixed(0)}% confidence.`,
    site: "trms",
    siteDisplay: "IMT Camp",
    area: d.stationId,
    areaDisplay: `${d.stationId} › Lane ${d.lane}`,
    camera: d.cameraId,
    time: hhmmss(at),
    date: at.toISOString().slice(0, 10),
    dateDisplay: at.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    confidence: d.confidence,
    precision: d.confidence - 0.04,
    bboxes: [{
      top: "30%", left: "38%", width: "22%", height: d.kind === "person" ? "52%" : "18%",
      label: d.kind === "person" ? "Person" : "SAR21", variant: d.kind === "person" ? "person" : "default",
    }],
    caseId: d.caseId,
    personId: d.kind === "person" ? ACTIVE_ASSIGNMENT.personId : undefined,
    modelTrainedDate: "02 Aug 2026",
    modelTrainingSamples: "48,200",
    modelMaP: "0.91",
    syntheticPct: 12,
  };
}
