import { create } from "zustand";

/* Training Assessment module — shared data.

   One source for every page in the module: the three use cases (golf, gym,
   physio), the venues they run at with their cameras, the external devices
   paired alongside those cameras, and the assessment sessions with their
   results and reports. Content follows the approved lo-fi
   (prototypes/PRD_Training_Assessment/lofi.html). */

/* ── Use cases ─────────────────────────────────────────────────────────── */

export type UseCaseKey = "golf" | "gym" | "physio";

export const USE_CASE_KEYS: UseCaseKey[] = ["golf", "gym", "physio"];

export type PoseMode = "3d" | "2d";

export interface UseCase {
  key: UseCaseKey;
  label: string;
  full: string;
  person: string;
  people: string;
  unit: string;
  units: string;
  /** What an attempt is called: a swing, a set, a test. */
  item: string;
  items: string;
  /** Activities the model can assess, picked when the model is created. */
  activities: string[];
  defaultActivities: string[];
  /** Pose defaults, set in System Configuration › Camera Defaults. */
  pose: {
    mode: PoseMode;
    fps: number;
    fpsOptions: number[];
    smoothing: "Light" | "Medium" | "Strong";
    keypoints: string;
  };
  /** Camera positions each unit needs, per pose mode. The first `required` are required. */
  positions: Record<PoseMode, { names: string[]; required: number; why: string }>;
  resolution: string;
  placement: string;
  /** What happens when a unit has fewer cameras than the pose mode needs. */
  fewer: { reduced: string; reducedAllowed: boolean; block: string; def: "reduced" | "block" };
  criteria: [string, string][];
  faults: string[];
  /** External devices this use case pairs with a unit. */
  deviceTypes: DeviceType[];
}

export const USE_CASES: Record<UseCaseKey, UseCase> = {
  golf: {
    key: "golf", label: "Golf", full: "Golf swing", person: "golfer", people: "golfers", unit: "bay", units: "bays",
    item: "swing", items: "swings",
    activities: ["Driver", "Woods", "Irons", "Wedges", "Putting", "Chipping"],
    defaultActivities: ["Driver", "Woods", "Irons", "Wedges"],
    pose: { mode: "3d", fps: 240, fpsOptions: [60, 120, 240], smoothing: "Light", keypoints: "Body + hands + feet" },
    positions: {
      "3d": { names: ["Face-on", "Down-the-line"], required: 2, why: "3D turn, X-factor and spine angle need two views 90° apart." },
      "2d": { names: ["Down-the-line", "Face-on"], required: 1, why: "One view gives sway, tempo and head movement. Turn and X-factor need 3D." },
    },
    resolution: "1080p",
    placement: "Face-on ≈ 3 m in front at chest height · Down-the-line ≈ 3 m behind on the hand line",
    fewer: { reduced: "One view, so 2D only: no turn or X-factor. Sway and tempo still work.", reducedAllowed: true, block: "The bay can't go live until it has both cameras.", def: "reduced" },
    criteria: [["Posture hold (spine angle lost)", "≤ 5°"], ["Turn (X-factor at top)", "35–50°"], ["Sway", "≤ 4 cm"], ["Tempo", "3 : 1"]],
    faults: ["Early extension", "Over-the-top", "Sway", "Out of sequence", "Reverse pivot"],
    deviceTypes: ["Launch monitor"],
  },
  gym: {
    key: "gym", label: "Gym", full: "Gym / weightlifting", person: "lifter", people: "lifters", unit: "rack", units: "racks",
    item: "set", items: "sets",
    activities: ["Back squat", "Deadlift", "Bench press", "Overhead press", "Front squat"],
    defaultActivities: ["Back squat", "Deadlift", "Bench press", "Overhead press"],
    pose: { mode: "2d", fps: 60, fpsOptions: [30, 60, 120], smoothing: "Medium", keypoints: "Body + feet" },
    positions: {
      "3d": { names: ["Side", "Front"], required: 2, why: "3D knee tracking and bar path need a side and a front view." },
      "2d": { names: ["Side", "Front (optional)"], required: 1, why: "One side view gives depth, torso lean and bar path. A front view adds knee tracking." },
    },
    resolution: "1080p",
    placement: "Side ≈ 1 m high, 3–4 m away, looking along the bar · front camera optional for knee tracking",
    fewer: { reduced: "Not needed in 2D: one side camera is the requirement.", reducedAllowed: true, block: "The rack can't go live until it has the cameras its mode needs.", def: "reduced" },
    criteria: [["Depth (hip crease vs knee)", "Below parallel"], ["Torso lean at bottom", "≤ 45°"], ["Bar path drift", "≤ 5 cm"], ["Knee tracking", "≤ 8°"]],
    faults: ["Knee cave", "Shallow depth", "Forward lean", "Back rounding", "Hips rise first", "Heel lift", "Bar drift"],
    deviceTypes: ["Bar speed sensor"],
  },
  physio: {
    key: "physio", label: "Physio", full: "Physio / rehab", person: "patient", people: "patients", unit: "room", units: "rooms",
    item: "test", items: "tests",
    activities: ["Range of motion", "Gait", "Standard tests", "Exercises", "Balance"],
    defaultActivities: ["Range of motion", "Gait", "Standard tests", "Exercises"],
    pose: { mode: "3d", fps: 60, fpsOptions: [30, 60, 120], smoothing: "Strong", keypoints: "Body + feet, left and right" },
    positions: {
      "3d": { names: ["Room front", "Room side", "Walkway side"], required: 2, why: "Clinical joint angles need two views 90° apart. The walkway camera times gait." },
      "2d": { names: ["Room side", "Walkway side"], required: 1, why: "One view gives timed tests and gait speed only. No clinical joint angles." },
    },
    resolution: "1080p",
    placement: "Room cameras ≈ 1 m high, ≈ 3 m away, 90° apart · walkway side camera ≈ 4–5 m back",
    fewer: { reduced: "Not allowed: clinical angles need both views.", reducedAllowed: false, block: "The room can't go live until it has both cameras. Timed tests can still run on one camera.", def: "block" },
    criteria: [["Knee flexion", "Patient goal 125°"], ["Knee extension lag", "≤ 5°"], ["Left–right difference", "≤ 10%"]],
    faults: ["Trunk lean", "Hip hike", "Knee cave", "Shoulder shrug"],
    deviceTypes: ["Depth camera", "Force plate"],
  },
};

export const useCaseOf = (k: UseCaseKey) => USE_CASES[k];

/* ── Venues: sites, areas and cameras ──────────────────────────────────── */

export interface TaArea {
  id: string;
  name: string;
  siteId: string;
  useCase: UseCaseKey;
  /** Bays, racks or rooms in this area. */
  units: string[];
}

export interface TaSite {
  id: string;
  name: string;
  useCase: UseCaseKey;
  areas: TaArea[];
}

export interface TaCamera {
  id: string;
  name: string;
  siteId: string;
  siteName: string;
  areaId: string;
  areaName: string;
  unit: string;
  position: string;
  fps: number;
  status: "online" | "offline";
  nvrId: string | null;
}

export const TA_SITES: TaSite[] = [
  {
    id: "ma", name: "Main academy", useCase: "golf",
    areas: [
      { id: "ma-bays", name: "Hitting bays", siteId: "ma", useCase: "golf", units: ["Bay 1", "Bay 2", "Bay 3", "Bay 4", "Bay 5", "Bay 6"] },
      { id: "ma-short", name: "Short game area", siteId: "ma", useCase: "golf", units: ["Green 1"] },
    ],
  },
  {
    id: "dt", name: "Downtown gym", useCase: "gym",
    areas: [
      { id: "dt-floor", name: "Strength floor", siteId: "dt", useCase: "gym", units: ["Rack 1", "Rack 2", "Rack 3", "Rack 4", "Rack 5", "Rack 6", "Rack 7", "Rack 8"] },
    ],
  },
  {
    id: "ca", name: "Clinic A", useCase: "physio",
    areas: [
      { id: "ca-rehab", name: "Rehab wing", siteId: "ca", useCase: "physio", units: ["Room 1", "Room 2", "Room 3"] },
      { id: "ca-walk", name: "Gait walkway", siteId: "ca", useCase: "physio", units: ["Walkway"] },
    ],
  },
];

export const TA_AREAS: TaArea[] = TA_SITES.flatMap((s) => s.areas);

export const siteName = (id: string) => TA_SITES.find((s) => s.id === id)?.name ?? id;
export const areaName = (id: string) => TA_AREAS.find((a) => a.id === id)?.name ?? id;

/* Cameras are generated from the units: every unit gets the positions its use
   case needs in 3D, with a few deliberate gaps (an offline camera, a bay short
   of its second view, a rack without the optional front camera). */
function buildCameras(): TaCamera[] {
  const cams: TaCamera[] = [];
  let n = 1;
  for (const site of TA_SITES) {
    for (const area of site.areas) {
      const uc = USE_CASES[area.useCase];
      for (const unit of area.units) {
        let positions = uc.positions["3d"].names;
        if (area.id === "ma-short") positions = ["Down-the-line"];
        if (area.id === "ca-walk") positions = ["Walkway side"];
        if (area.id === "ca-rehab") positions = ["Room front", "Room side"];
        if (area.useCase === "gym") positions = unit === "Rack 1" || unit === "Rack 2" ? ["Side", "Front"] : ["Side"];
        if (unit === "Bay 6") positions = ["Face-on"];
        for (const position of positions) {
          const id = `CAM-${String(n).padStart(2, "0")}`;
          cams.push({
            id,
            name: `${unit} · ${position}`,
            siteId: site.id,
            siteName: site.name,
            areaId: area.id,
            areaName: area.name,
            unit,
            position,
            fps: area.useCase === "golf" ? (unit === "Bay 2" && position === "Down-the-line" ? 60 : 240) : area.useCase === "gym" ? (unit === "Rack 4" ? 30 : 60) : 60,
            status: unit === "Bay 5" && position === "Down-the-line" ? "offline" : "online",
            nvrId: unit === "Green 1" ? null : `NVR-${site.id.toUpperCase()}`,
          });
          n += 1;
        }
      }
    }
  }
  return cams;
}

export const TA_CAMERAS: TaCamera[] = buildCameras();

/* ── External devices ──────────────────────────────────────────────────── */

export const DEVICE_TYPES = ["Launch monitor", "Bar speed sensor", "Depth camera", "Force plate"] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];

export const DEVICE_TYPE_INFO: Record<DeviceType, { measures: string; connection: Connection; useCase: UseCaseKey }> = {
  "Launch monitor": { measures: "Club speed, ball speed, launch, spin, carry, path, face", connection: "Wi-Fi", useCase: "golf" },
  "Bar speed sensor": { measures: "Mean and peak bar speed, range of motion per rep", connection: "Bluetooth", useCase: "gym" },
  "Depth camera": { measures: "Depth map for 3D joint angles in one view", connection: "USB via edge box", useCase: "physio" },
  "Force plate": { measures: "Ground reaction force, weight shift, balance sway", connection: "Ethernet", useCase: "physio" },
};

export type Connection = "Wi-Fi" | "Bluetooth" | "Ethernet" | "USB via edge box";
export const CONNECTIONS: Connection[] = ["Wi-Fi", "Bluetooth", "Ethernet", "USB via edge box"];

export type DeviceStatus = "online" | "offline" | "pairing";

export interface ExternalDevice {
  id: string;
  name: string;
  type: DeviceType;
  model: string;
  serial: string;
  siteId: string;
  siteName: string;
  areaId: string;
  areaName: string;
  /** The bay, rack or room it is paired to. */
  unit: string;
  connection: Connection;
  address: string;
  status: DeviceStatus;
  firmware: string;
  /** Data from this device is added to assessment results. */
  useInSessions: boolean;
  lastSeenDisplay: string;
  addedDisplay: string;
}

function device(
  id: string, type: DeviceType, model: string, siteId: string, areaId: string, unit: string,
  extra: Partial<ExternalDevice> = {},
): ExternalDevice {
  const info = DEVICE_TYPE_INFO[type];
  return {
    id, name: `${unit} · ${type}`, type, model, serial: `SN-${id.replace("-", "")}-${(id.length * 7919) % 9000 + 1000}`,
    siteId, siteName: siteName(siteId), areaId, areaName: areaName(areaId), unit,
    connection: info.connection,
    address: info.connection === "Bluetooth" ? `BLE ${id.slice(-1)}C:4F:2A` : info.connection === "USB via edge box" ? `EDGE-01 · USB ${id.slice(-1)}` : `10.20.4.${30 + Number(id.split("-")[1])}`,
    status: "online", firmware: "2.4.1", useInSessions: true, lastSeenDisplay: "Just now", addedDisplay: "12 Oct 2026",
    ...extra,
  };
}

const SEED_DEVICES: ExternalDevice[] = [
  device("LM-1", "Launch monitor", "Radar LM Pro", "ma", "ma-bays", "Bay 1"),
  device("LM-2", "Launch monitor", "Radar LM Pro", "ma", "ma-bays", "Bay 2"),
  device("LM-3", "Launch monitor", "Radar LM Pro", "ma", "ma-bays", "Bay 3", { lastSeenDisplay: "2 min ago" }),
  device("LM-4", "Launch monitor", "Radar LM Pro", "ma", "ma-bays", "Bay 4"),
  device("LM-5", "Launch monitor", "Photometric LM Mini", "ma", "ma-bays", "Bay 5", { status: "offline", lastSeenDisplay: "Yesterday, 21:40", firmware: "1.9.0" }),
  device("BS-1", "Bar speed sensor", "Linear transducer V2", "dt", "dt-floor", "Rack 1"),
  device("BS-2", "Bar speed sensor", "Linear transducer V2", "dt", "dt-floor", "Rack 2"),
  device("BS-3", "Bar speed sensor", "Linear transducer V2", "dt", "dt-floor", "Rack 4", { status: "pairing", lastSeenDisplay: "Pairing…" }),
  device("BS-4", "Bar speed sensor", "Wearable bar sensor", "dt", "dt-floor", "Rack 5", { useInSessions: false, firmware: "3.1.0" }),
  device("DC-1", "Depth camera", "Stereo depth D4", "ca", "ca-rehab", "Room 1"),
  device("FP-1", "Force plate", "Dual force plate 60", "ca", "ca-walk", "Walkway"),
];

interface DevicesState {
  devices: ExternalDevice[];
  setDevices: (next: ExternalDevice[] | ((prev: ExternalDevice[]) => ExternalDevice[])) => void;
}

/** External devices — added in Site › External Devices, picked in Model Deployment. */
export const useDevicesStore = create<DevicesState>((set) => ({
  devices: SEED_DEVICES,
  setDevices: (next) => set((s) => ({ devices: typeof next === "function" ? next(s.devices) : next })),
}));

export function nextDeviceId(type: DeviceType, taken: string[]): string {
  const prefix = { "Launch monitor": "LM", "Bar speed sensor": "BS", "Depth camera": "DC", "Force plate": "FP" }[type];
  let i = 1;
  while (taken.includes(`${prefix}-${i}`)) i += 1;
  return `${prefix}-${i}`;
}

/* ── Sessions ──────────────────────────────────────────────────────────── */

export type SessionStatus = "scheduled" | "live" | "complete";

export const SESSION_STATUS_LABEL: Record<SessionStatus, string> = {
  scheduled: "Scheduled",
  live: "Live",
  complete: "Complete",
};

export interface Participant {
  name: string;
  detail: string;
  unit: string;
  attempts: number;
  /** "78 · B", "77", or "78%" for physio progress to goal. */
  score: string;
  change: string;
  topFault: string;
  consent: boolean;
}

export interface TaSession {
  id: string;
  name: string;
  useCase: UseCaseKey;
  modelName: string;
  siteId: string;
  deployment: string;
  units: string[];
  date: string;
  time: string;
  source: "Live" | "Recorded";
  status: SessionStatus;
  coach: string;
  participants: Participant[];
  /** Attempts analysed / captured. */
  analysed: number;
  captured: number;
  flagged: number;
  devices: string[];
}

const GOLF_PEOPLE: Participant[] = [
  { name: "Marcus Tan", detail: "HCP 14", unit: "Bay 4", attempts: 22, score: "78 · B", change: "+7", topFault: "Early extension", consent: true },
  { name: "Aiden Lee", detail: "HCP 9", unit: "Bay 1", attempts: 19, score: "84 · B", change: "+2", topFault: "—", consent: true },
  { name: "Wei Jie Ong", detail: "HCP 16", unit: "Bay 3", attempts: 17, score: "69 · C", change: "+1", topFault: "Sway", consent: true },
  { name: "Priya Nair", detail: "HCP 18", unit: "Bay 2", attempts: 12, score: "66 · C", change: "new", topFault: "Over-the-top", consent: true },
  { name: "Ethan Lim", detail: "HCP 12", unit: "Bay 5", attempts: 20, score: "81 · B", change: "+4", topFault: "Early extension", consent: true },
  { name: "Chloe Ng", detail: "HCP 21", unit: "Bay 6", attempts: 18, score: "62 · D", change: "−2", topFault: "Early extension", consent: true },
];

const GYM_PEOPLE: Participant[] = [
  { name: "Hannah Goh", detail: "1 yr training", unit: "Rack 4", attempts: 5, score: "77", change: "+5", topFault: "Knee cave", consent: true },
  { name: "Ravi Kumar", detail: "3 yrs training", unit: "Rack 2", attempts: 6, score: "84", change: "+3", topFault: "—", consent: true },
  { name: "Jason Teo", detail: "5 yrs training", unit: "Rack 5", attempts: 5, score: "72", change: "new", topFault: "Forward lean", consent: true },
  { name: "Ben Ong", detail: "2 yrs training", unit: "Rack 1", attempts: 5, score: "86", change: "+1", topFault: "—", consent: true },
  { name: "Nur Aisyah", detail: "6 months", unit: "Rack 3", attempts: 4, score: "70", change: "+6", topFault: "Knee cave", consent: true },
];

const PHYSIO_PEOPLE: Participant[] = [
  { name: "Mei Ling Chua", detail: "Left knee · post-op week 8", unit: "Room 1", attempts: 4, score: "78%", change: "+8%", topFault: "Trunk lean", consent: true },
  { name: "Ahmad Rahim", detail: "Right knee · week 6", unit: "Room 1", attempts: 4, score: "64%", change: "+5%", topFault: "Hip hike", consent: true },
  { name: "Grace Tan", detail: "Left knee · week 3", unit: "Room 2", attempts: 3, score: "52%", change: "new", topFault: "—", consent: true },
  { name: "Daniel Wong", detail: "ACL repair · week 10", unit: "Room 2", attempts: 4, score: "81%", change: "+6%", topFault: "Trunk lean", consent: true },
];

const SEED_SESSIONS: TaSession[] = [
  {
    id: "SES-1042", name: "Junior squad clinic", useCase: "golf", modelName: "Golf Swing Assessment", siteId: "ma",
    deployment: "Main academy bays", units: ["Bay 1", "Bay 2", "Bay 3", "Bay 4", "Bay 5", "Bay 6"], date: "Sat 8 Nov 2026", time: "09:00–10:30",
    source: "Live", status: "complete", coach: "Daniel Lim", participants: GOLF_PEOPLE, analysed: 148, captured: 162, flagged: 7, devices: ["LM-1", "LM-2", "LM-3", "LM-4"],
  },
  {
    id: "SES-1047", name: "6 pm barbell class", useCase: "gym", modelName: "Strength Technique Assessment", siteId: "dt",
    deployment: "Strength floor", units: ["Rack 1", "Rack 2", "Rack 3", "Rack 4", "Rack 5"], date: "Mon 10 Nov 2026", time: "18:00–19:00",
    source: "Live", status: "complete", coach: "Sarah Koh", participants: GYM_PEOPLE, analysed: 268, captured: 284, flagged: 11, devices: ["BS-1", "BS-2"],
  },
  {
    id: "SES-1048", name: "Knee rehab class", useCase: "physio", modelName: "Rehab Movement Assessment", siteId: "ca",
    deployment: "Clinic A rehab", units: ["Room 1", "Room 2", "Walkway"], date: "Tue 11 Nov 2026", time: "10:00–11:00",
    source: "Live", status: "live", coach: "Dr. Lim", participants: PHYSIO_PEOPLE, analysed: 9, captured: 11, flagged: 1, devices: ["DC-1", "FP-1"],
  },
  {
    id: "SES-1049", name: "Academy squad lesson", useCase: "golf", modelName: "Golf Swing Assessment", siteId: "ma",
    deployment: "Main academy bays", units: ["Bay 1", "Bay 2", "Bay 3"], date: "Wed 12 Nov 2026", time: "16:00–17:30",
    source: "Live", status: "scheduled", coach: "Daniel Lim", participants: GOLF_PEOPLE.slice(0, 3).map((p) => ({ ...p, attempts: 0, score: "—", change: "—", topFault: "—" })), analysed: 0, captured: 0, flagged: 0, devices: ["LM-1", "LM-2", "LM-3"],
  },
  {
    id: "SES-1050", name: "Follow-up · Mei Ling Chua", useCase: "physio", modelName: "Rehab Movement Assessment", siteId: "ca",
    deployment: "Clinic A rehab", units: ["Room 1"], date: "Thu 13 Nov 2026", time: "09:30–10:15",
    source: "Live", status: "scheduled", coach: "Dr. Lim", participants: [{ ...PHYSIO_PEOPLE[0], attempts: 0, score: "—", change: "—", topFault: "—" }], analysed: 0, captured: 0, flagged: 0, devices: ["DC-1"],
  },
  {
    id: "SES-1039", name: "PT session · Ravi Kumar", useCase: "gym", modelName: "Strength Technique Assessment", siteId: "dt",
    deployment: "Strength floor", units: ["Rack 2"], date: "Thu 6 Nov 2026", time: "07:00–08:00",
    source: "Recorded", status: "complete", coach: "Sarah Koh", participants: [GYM_PEOPLE[1]], analysed: 31, captured: 32, flagged: 1, devices: [],
  },
  {
    id: "SES-1036", name: "Falls prevention class", useCase: "physio", modelName: "Rehab Movement Assessment", siteId: "ca",
    deployment: "Clinic A rehab", units: ["Room 3", "Walkway"], date: "Tue 4 Nov 2026", time: "14:00–15:00",
    source: "Live", status: "complete", coach: "Dr. Lim", participants: PHYSIO_PEOPLE.slice(1), analysed: 21, captured: 23, flagged: 0, devices: ["FP-1"],
  },
];

interface SessionsState {
  sessions: TaSession[];
  setSessions: (next: TaSession[] | ((prev: TaSession[]) => TaSession[])) => void;
}

export const useSessionsStore = create<SessionsState>((set) => ({
  sessions: SEED_SESSIONS,
  setSessions: (next) => set((s) => ({ sessions: typeof next === "function" ? next(s.sessions) : next })),
}));

/* ── Results (group view per use case) ─────────────────────────────────── */

export interface GroupResults {
  scoreLabel: string;
  scoreValue: string;
  scoreSub: string;
  trendTitle: string;
  trend: { session: string; score: number }[];
  faultsTitle: string;
  faults: [string, number][];
  /** Physio never ranks patients against each other. */
  noRank: boolean;
  fundamentals: [string, string][];
  drill: [string, string];
}

export const GROUP_RESULTS: Record<UseCaseKey, GroupResults> = {
  golf: {
    scoreLabel: "Group score", scoreValue: "74 · C", scoreSub: "+3 vs last clinic",
    trendTitle: "Group score by clinic",
    trend: [{ session: "11 Oct", score: 66 }, { session: "18 Oct", score: 68 }, { session: "25 Oct", score: 70 }, { session: "1 Nov", score: 71 }, { session: "8 Nov", score: 74 }],
    faultsTitle: "Common faults across the group",
    faults: [["Early extension", 5], ["Sway", 3], ["Over-the-top", 2], ["Out of sequence", 1]],
    noRank: false,
    fundamentals: [["Setup", "A"], ["Turn", "B"], ["Sway", "C"], ["Posture hold", "D"], ["Sequence", "B"], ["Tempo", "A"]],
    drill: ["Chair drill", "For early extension · 3 × 10 swings"],
  },
  gym: {
    scoreLabel: "Class form score", scoreValue: "81", scoreSub: "+2 vs last class",
    trendTitle: "Class form score by class",
    trend: [{ session: "13 Oct", score: 74 }, { session: "20 Oct", score: 76 }, { session: "27 Oct", score: 79 }, { session: "3 Nov", score: 79 }, { session: "10 Nov", score: 81 }],
    faultsTitle: "Most common faults today",
    faults: [["Knee cave", 5], ["Forward lean", 3], ["Shallow depth", 2], ["Heel lift", 1]],
    noRank: false,
    fundamentals: [["Depth", "A"], ["Torso lean", "C"], ["Knee tracking", "D"], ["Bar path", "B"], ["Tempo", "B"]],
    drill: ["Cue: “knees out”", "For knee cave · next 3 sets"],
  },
  physio: {
    scoreLabel: "On track", scoreValue: "5 of 6", scoreSub: "Against their own goals",
    trendTitle: "Attendance · last 5 classes",
    trend: [{ session: "14 Oct", score: 5 }, { session: "21 Oct", score: 6 }, { session: "28 Oct", score: 6 }, { session: "4 Nov", score: 5 }, { session: "11 Nov", score: 6 }],
    faultsTitle: "Common compensations in the class",
    faults: [["Trunk lean", 3], ["Hip hike", 2], ["Knee cave", 1]],
    noRank: true,
    fundamentals: [["Knee flexion L", "112°"], ["Knee flexion R", "138°"], ["Extension lag", "4°"], ["Gait speed", "1.02 m/s"], ["Sit-to-stand", "11"]],
    drill: ["Heel slides", "Home programme · 3 × 15 daily"],
  },
};

/* ── Reports ───────────────────────────────────────────────────────────── */

export type ReportStatus = "draft" | "ready" | "sent";

export interface TaReport {
  id: string;
  sessionId: string;
  kind: "Individual" | "Group";
  /** Participant name, or the session name for a group report. */
  subject: string;
  title: string;
  status: ReportStatus;
  /** Clinical reports wait for a clinician's sign-off. */
  needsSignOff: boolean;
  sharedVia: string[];
  updatedDisplay: string;
}

export const REPORT_TITLE: Record<UseCaseKey, { individual: string; group: string; sections: string[]; share: string[] }> = {
  golf: { individual: "Swing report", group: "Clinic summary", sections: ["Score & grade", "Best swing clip", "Faults", "Swing log", "Drills", "Coach notes"], share: ["Golfer app", "Email", "PDF"] },
  gym: { individual: "Lifter summary", group: "Class report", sections: ["Form score", "Rep clips", "Top fault + cue", "Rep & set log", "PT notes"], share: ["Lifter app", "CSV", "PDF"] },
  physio: { individual: "Visit report", group: "Class summary", sections: ["Measures vs goal", "Video clips (face blurred)", "Test log", "Home programme", "Clinician notes"], share: ["Patient app", "PDF", "Referrer email"] },
};

/** Sessions just finished, whose reports are still being reviewed rather than sent. */
const FRESH_SESSIONS = new Set(["SES-1047"]);

/**
 * A complete session's reports: one for the group, one per person. A session
 * that finishes in the prototype gets fresh ones — drafts, nothing sent yet.
 */
export function reportsFor(s: TaSession, fresh = FRESH_SESSIONS.has(s.id)): TaReport[] {
  const t = REPORT_TITLE[s.useCase];
  // An individual session (one person) has no group summary — only that person's report.
  const out: TaReport[] = s.participants.length > 1 ? [{
    id: `RPT-${s.id.slice(4)}-G`, sessionId: s.id, kind: "Group", subject: s.name, title: t.group,
    status: fresh ? "draft" : "sent", needsSignOff: false, sharedVia: fresh ? [] : ["Email"], updatedDisplay: s.date,
  }] : [];
  s.participants.forEach((p, i) => {
    const status: ReportStatus = fresh ? (i < 2 ? "ready" : "draft") : i === 1 ? "ready" : "sent";
    out.push({
      id: `RPT-${s.id.slice(4)}-${i + 1}`, sessionId: s.id, kind: "Individual", subject: p.name, title: t.individual, status,
      needsSignOff: s.useCase === "physio" && status !== "sent", sharedVia: status === "sent" ? [t.share[0]] : [], updatedDisplay: s.date,
    });
  });
  return out;
}

function buildReports(sessions: TaSession[]): TaReport[] {
  return sessions.filter((s) => s.status === "complete").flatMap((s) => reportsFor(s));
}

interface ReportsState {
  reports: TaReport[];
  setReports: (next: TaReport[] | ((prev: TaReport[]) => TaReport[])) => void;
}

export const useReportsStore = create<ReportsState>((set) => ({
  reports: buildReports(SEED_SESSIONS),
  setReports: (next) => set((s) => ({ reports: typeof next === "function" ? next(s.reports) : next })),
}));
