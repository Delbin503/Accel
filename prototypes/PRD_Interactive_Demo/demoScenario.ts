/* The scripted scenario behind the interactive demo: one house, three sensors,
   and the assessment Accel reaches from whichever of them are switched on. */

export type SensorId = "camera" | "door" | "motion";

export interface SensorEvent {
  id: SensorId;
  /** The system the signal comes from. */
  source: string;
  device: string;
  /** The raw event as that system reports it — no interpretation. */
  raw: string;
  time: string;
  /** Where it sits on the house map, once context is added. */
  place: string;
}

/** In time order — this is the order they land on the timeline. */
export const SENSOR_EVENTS: SensorEvent[] = [
  { id: "camera", source: "Camera system", device: "Porch camera", raw: "Person detected · confidence 0.93", time: "21:42:08", place: "Front porch" },
  { id: "door", source: "Access control", device: "Front door contact", raw: "Contact opened", time: "21:42:31", place: "Front door" },
  { id: "motion", source: "Alarm panel", device: "Hallway motion sensor", raw: "Motion triggered · zone 2", time: "21:42:44", place: "Hallway" },
];

export const SENSOR_ORDER: SensorId[] = SENSOR_EVENTS.map((e) => e.id);
export const eventFor = (id: SensorId) => SENSOR_EVENTS.find((e) => e.id === id)!;

/** What the house knows beyond the sensors — revealed by "Add context". */
export const CONTEXT_FACTS = [
  { key: "mode", label: "Home mode", value: "Away", detail: "Armed at 18:05 — nobody is expected home." },
  { key: "unlock", label: "Authorised unlock", value: "None recorded", detail: "No code, key fob or app unlock since 08:12." },
] as const;

export type Level = "critical" | "medium" | "low";

export interface Assessment {
  title: string;
  level: Level;
  levelLabel: string;
  /** 0–100, how well the available evidence supports the title. */
  confidence: number;
  summary: string;
  /** Which signals support it, and how. */
  supports: { sensor: SensorId; text: string }[];
  /** What the missing sensors would have settled. */
  gaps: { sensor: SensorId; text: string }[];
}

const SUPPORT: Record<SensorId, string> = {
  camera: "A person was at the front porch at 21:42:08.",
  door: "The front door opened at 21:42:31 with no authorised unlock.",
  motion: "Movement followed inside the hallway at 21:42:44.",
};

const GAP: Record<SensorId, string> = {
  camera: "No camera signal — nobody was seen approaching the door.",
  door: "No door signal — the way in is not confirmed.",
  motion: "No motion signal — movement inside is not confirmed.",
};

const key = (ids: SensorId[]) => SENSOR_ORDER.filter((s) => ids.includes(s)).join("+");

const VERDICTS: Record<string, Pick<Assessment, "title" | "level" | "levelLabel" | "confidence" | "summary">> = {
  "camera+door+motion": {
    title: "Possible unauthorised entry", level: "critical", levelLabel: "High priority", confidence: 92,
    summary: "A person arrived, the door opened without an authorised unlock, and movement followed inside — all within 36 seconds, while the home is in Away mode.",
  },
  "door+motion": {
    title: "Possible unauthorised entry", level: "critical", levelLabel: "High priority", confidence: 78,
    summary: "The door opened without an authorised unlock and movement followed inside while the home is in Away mode. Nobody was seen arriving.",
  },
  "camera+door": {
    title: "Possible unauthorised entry", level: "medium", levelLabel: "Needs review", confidence: 70,
    summary: "A person was at the porch and the door opened without an authorised unlock while the home is in Away mode. Movement inside is not confirmed.",
  },
  "camera+motion": {
    title: "Unexplained activity inside", level: "medium", levelLabel: "Needs review", confidence: 58,
    summary: "A person was at the porch and movement followed inside while the home is in Away mode, but nothing shows how they got in.",
  },
  camera: {
    title: "Person at the front door", level: "low", levelLabel: "Low priority", confidence: 30,
    summary: "Someone was at the porch while the home is in Away mode. A visitor or a delivery fits this just as well — nothing indicates entry.",
  },
  door: {
    title: "Door opened while Away", level: "medium", levelLabel: "Needs review", confidence: 45,
    summary: "The front door opened without an authorised unlock while the home is in Away mode. On its own this could also be a faulty contact.",
  },
  motion: {
    title: "Motion inside while Away", level: "low", levelLabel: "Low priority", confidence: 28,
    summary: "Movement was picked up in the hallway while the home is in Away mode. A pet or a draught fits this just as well.",
  },
};

/** The assessment follows the evidence: same house, different sensors, different answer. */
export function assess(selected: SensorId[]): Assessment | null {
  const verdict = VERDICTS[key(selected)];
  if (!verdict) return null;
  return {
    ...verdict,
    supports: SENSOR_ORDER.filter((s) => selected.includes(s)).map((s) => ({ sensor: s, text: SUPPORT[s] })),
    gaps: SENSOR_ORDER.filter((s) => !selected.includes(s)).map((s) => ({ sensor: s, text: GAP[s] })),
  };
}

export type ResponseId = "camera" | "household" | "notify";

export const RESPONSES: { id: ResponseId; label: string; hint: string; outcome: string; record: string }[] = [
  { id: "camera", label: "Check live camera", hint: "Look before deciding", outcome: "Live porch camera opened for the operator.", record: "Operator opened the live porch camera to verify." },
  { id: "household", label: "Contact household", hint: "Ask the people who live there", outcome: "Call placed to the primary contact, Maya Tan.", record: "Operator contacted the household (primary contact)." },
  { id: "notify", label: "Approve security notification", hint: "Hand it to security", outcome: "Notification approved and sent to the security provider.", record: "Operator approved a security notification." },
];

export const INCIDENT_ID = "INC-2026-0412";
