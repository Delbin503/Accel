/* One patient's rehab visit in Clinic A: Ahmad Rahim, six weeks after a right
   knee replacement. Knee-bend reps and sit-to-stand in Area 1 (two
   cameras 90° apart), then two 10 m walks past the walkway camera. Every
   number on the Rehab Analysis page is derived from the reps and visits below.

   Physio rules: a patient is only ever compared with their own week-1 baseline
   and goal, never ranked or graded against other patients; the visit report
   needs a clinician's sign-off before it is shared; faces are blurred. */

export const PATIENT = {
  name: "Ahmad Rahim",
  id: "PT-0412",
  age: 58,
  condition: "Right knee replacement",
  side: "Right",
  week: 6,
  surgery: "30 Sep 2026",
};

export const VISIT = {
  clinic: "Clinic A",
  area: "Area 1 + Walkway",
  clinician: "Dr. Lim",
  date: "Tue 11 Nov 2026 · 10:00",
  short: "11 Nov",
  lengthSec: 1080,
  fps: 60,
  cameras: "Front + side · walkway · 60 fps",
  model: "Rehab Movement Assessment v1.0",
};

export const METHOD_NOTE =
  "Joint angles come from 3D pose read off two area cameras 90° apart at 60 fps, strongly smoothed. Walking is timed off the walkway side camera, and left–right difference is step length on the walk. Every number is compared with this patient's own week-1 baseline and goal, never with other patients.";

/* ── Limits ──────────────────────────────────────────────────────────── */

/** The clinician's targets for this patient. */
export const LIMIT = {
  goalFlex: 125,
  weekTarget: 104,
  lag: 5,
  romSpeed: 60,
  hold: 3,
  hipHike: 2,
  trunkLean: 8,
  kneeCave: 8,
  shrug: 1.5,
  lr: 10,
  stsDepth: 90,
  stsLower: 2,
  gaitSwing: 60,
  cadence: 100,
  stsTime: 12,
};

/** The healthy (left) knee, measured at week 1. */
export const HEALTHY = { flex: 136, lag: 0, gaitSwing: 62 };

/* ── Exercises & reps ────────────────────────────────────────────────── */

export type ExKey = "rom" | "sts" | "gait";
export type View = "front" | "side" | "walk";

export const EXERCISES: Record<ExKey, { label: string; short: string; camera: View; need: number; needLabel: string; peak: string }> = {
  rom: { label: "Knee bend", short: "Bend", camera: "side", need: LIMIT.weekTarget, needLabel: "This week", peak: "Bend reached" },
  sts: { label: "Sit-to-stand", short: "Stand", camera: "front", need: LIMIT.stsDepth, needLabel: "To sit", peak: "Bend when seated" },
  gait: { label: "Walk 10 m", short: "Walk", camera: "walk", need: LIMIT.gaitSwing, needLabel: "To walk", peak: "Bend in swing" },
};
export const EX_ORDER: ExKey[] = ["rom", "sts", "gait"];

export type Rep = {
  id: string;
  ex: ExKey;
  n: number;
  /** Seconds into the visit recording. */
  at: number;
  /** Most knee bend in the rep, °. Knee bend: end range · sit-to-stand: seated · walk: swing. */
  flex: number;
  /** Degrees short of straight at the straightest point. */
  lag: number;
  /** Knee bend: peak bend speed, °/s. */
  speed: number;
  /** Knee bend: hold at end range, s · sit-to-stand: lowering time, s. */
  hold: number;
  /** Sit-to-stand: rise time, s. */
  rise: number;
  hipHike: number;
  trunkLean: number;
  kneeCave: number;
  shrug: number;
  /** Walk only: left–right step-length difference, %. */
  lr: number;
  cadence: number;
  stepR: number;
  stepL: number;
  gaitSpeed: number;
};

const base = { speed: 0, hold: 0, rise: 0, kneeCave: 0, shrug: 0, lr: 0, cadence: 0, stepR: 0, stepL: 0, gaitSpeed: 0 };

const rom = (n: number, at: number, flex: number, lag: number, speed: number, hold: number, hipHike: number, trunkLean: number, shrug: number): Rep =>
  ({ ...base, id: `rom-${n}`, ex: "rom", n, at, flex, lag, speed, hold, hipHike, trunkLean, shrug });
const sts = (n: number, at: number, flex: number, lag: number, rise: number, lower: number, hipHike: number, trunkLean: number, kneeCave: number): Rep =>
  ({ ...base, id: `sts-${n}`, ex: "sts", n, at, flex, lag, rise, hold: lower, hipHike, trunkLean, kneeCave, shrug: 0.4 });
const walk = (n: number, at: number, flex: number, lag: number, cadence: number, stepR: number, stepL: number, gaitSpeed: number, hipHike: number, trunkLean: number): Rep =>
  ({ ...base, id: `gait-${n}`, ex: "gait", n, at, flex, lag, cadence, stepR, stepL, gaitSpeed, hipHike, trunkLean, lr: Math.round(((stepL - stepR) / stepL) * 100) });

export const REPS: Rep[] = [
  rom(1, 140, 98, 7, 46, 3.2, 0.8, 3, 0.4),
  rom(2, 172, 101, 6, 44, 3.4, 1.0, 4, 0.5),
  rom(3, 203, 103, 6, 47, 3.1, 0.7, 3, 0.5),
  rom(4, 236, 104, 5, 43, 3.5, 0.9, 2, 0.4),
  rom(5, 268, 106, 4, 41, 3.6, 1.2, 4, 0.6),
  rom(6, 297, 105, 5, 63, 2.2, 2.6, 6, 0.9),
  rom(7, 330, 102, 6, 48, 3.1, 1.1, 4, 0.7),
  rom(8, 361, 99, 7, 66, 1.8, 2.9, 9, 1.8),
  sts(1, 610, 92, 6, 1.6, 2.4, 1.4, 6, 4),
  sts(2, 628, 94, 5, 1.5, 2.2, 2.4, 8, 5),
  sts(3, 645, 93, 5, 1.7, 1.6, 2.6, 10, 9),
  sts(4, 662, 95, 4, 1.4, 2.5, 1.2, 5, 3),
  sts(5, 680, 91, 6, 2.0, 1.4, 2.8, 11, 6),
  walk(1, 900, 54, 6, 98, 0.56, 0.63, 0.92, 1.8, 6),
  walk(2, 960, 56, 5, 101, 0.58, 0.64, 0.98, 1.5, 5),
];

export const repById = (id: string) => REPS.find((r) => r.id === id)!;
export const repsOf = (ex: ExKey) => REPS.filter((r) => r.ex === ex);
export const repName = (r: Rep) => `${EXERCISES[r.ex].label} ${r.n}`;

/* ── Moments & signals ───────────────────────────────────────────────── */

export type Moment = 0 | 1 | 2 | 3;
export const MOMENTS: Record<ExKey, [string, string, string, string]> = {
  rom: ["Start", "Bending", "End range", "Return"],
  sts: ["Seated", "Rising", "Standing", "Sitting"],
  gait: ["Heel strike", "Mid-stance", "Toe-off", "Swing"],
};
/** The moment a rep opens on: where its main measure is read. */
export const KEY_MOMENT: Record<ExKey, Moment> = { rom: 2, sts: 1, gait: 3 };

const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

const romPlan = (r: Rep) => {
  const up = (1.5 * (r.flex - r.lag)) / r.speed;
  return { up, down: up * 0.9 };
};
export const stride = (r: Rep) => 120 / r.cadence;

export function repLength(r: Rep) {
  if (r.ex === "rom") {
    const { up, down } = romPlan(r);
    return 0.5 + up + r.hold + down + 0.5;
  }
  if (r.ex === "sts") return 0.5 + r.rise + 1 + r.hold + 0.5;
  return 2 * stride(r);
}

/** Knee angle through one gait cycle (0 = heel strike). */
function gaitKnee(phi: number, peak: number, lag: number) {
  if (phi < 0.15) return lerp(lag, lag + 12, smooth(phi / 0.15));
  if (phi < 0.4) return lerp(lag + 12, lag + 2, smooth((phi - 0.15) / 0.25));
  if (phi < 0.72) return lerp(lag + 2, peak, smooth((phi - 0.4) / 0.32));
  return lerp(peak, lag, smooth((phi - 0.72) / 0.28));
}
/** Thigh angle from vertical through one gait cycle, ° (+ forward). */
export const gaitHip = (phi: number) => 5 + 20 * Math.cos(2 * Math.PI * (phi - 0.87));
export const gaitPhase = (r: Rep, t: number) => ((t / stride(r)) % 1 + 1) % 1;

/** Knee bend of the treated (right) knee at t seconds into the rep. */
export function kneeAt(r: Rep, t: number) {
  if (r.ex === "rom") {
    const { up, down } = romPlan(r);
    if (t < 0.5) return r.lag;
    if (t < 0.5 + up) return lerp(r.lag, r.flex, smooth((t - 0.5) / up));
    if (t < 0.5 + up + r.hold) return r.flex;
    return lerp(r.flex, r.lag, smooth((t - 0.5 - up - r.hold) / down));
  }
  if (r.ex === "sts") {
    if (t < 0.5) return r.flex;
    if (t < 0.5 + r.rise) return lerp(r.flex, r.lag, smooth((t - 0.5) / r.rise));
    if (t < 1.5 + r.rise) return r.lag;
    return lerp(r.lag, r.flex, smooth((t - 1.5 - r.rise) / r.hold));
  }
  return gaitKnee(gaitPhase(r, t), r.flex, r.lag);
}

/** The healthy (left) knee doing the same movement, for the ghost line. */
export function leftKneeAt(r: Rep, t: number) {
  if (r.ex === "gait") return gaitKnee(gaitPhase(r, t), HEALTHY.gaitSwing, HEALTHY.lag);
  const k = (kneeAt(r, t) - r.lag) / (r.flex - r.lag);
  return r.ex === "rom" ? k * HEALTHY.flex : k * r.flex;
}

/** How far into the movement the rep is, 0–1, where compensations show most. */
function effort(r: Rep, t: number) {
  if (r.ex === "rom") return clamp01((kneeAt(r, t) - r.lag) / (r.flex - r.lag)) ** 1.5;
  if (r.ex === "sts") {
    if (t >= 0.5 && t < 0.5 + r.rise) return Math.sin(Math.PI * ((t - 0.5) / r.rise));
    if (t >= 1.5 + r.rise && t < 1.5 + r.rise + r.hold) return 0.8 * Math.sin(Math.PI * ((t - 1.5 - r.rise) / r.hold));
    return 0;
  }
  const phi = gaitPhase(r, t);
  return phi > 0.6 ? Math.sin((Math.PI * (phi - 0.6)) / 0.4) : 0.15;
}

export const compAt = (r: Rep, t: number) => {
  const e = effort(r, t);
  return { hike: +(r.hipHike * e).toFixed(2), lean: +(r.trunkLean * (r.ex === "gait" ? 1 - e * 0.5 : e)).toFixed(1), cave: +(r.kneeCave * e).toFixed(1), shrug: +(r.shrug * e).toFixed(2) };
};

export function momentTime(r: Rep, m: Moment) {
  if (r.ex === "rom") {
    const { up, down } = romPlan(r);
    return [0.25, 0.5 + up / 2, 0.5 + up + r.hold / 2, 0.5 + up + r.hold + down / 2][m];
  }
  if (r.ex === "sts") return [0.25, 0.5 + r.rise * 0.45, 1 + r.rise, 1.5 + r.rise + r.hold / 2][m];
  const s = stride(r);
  return s * (1 + [0, 0.3, 0.6, 0.72][m]);
}

/** Knee angle (both sides) and compensations through the rep, every 50 ms. */
export function repSeries(r: Rep) {
  const T = repLength(r);
  const rows: { t: number; knee: number; left: number; hike: number; lean: number }[] = [];
  for (let t = 0; t <= T + 1e-6; t += 0.05) {
    const c = compAt(r, t);
    rows.push({ t: +t.toFixed(2), knee: +kneeAt(r, t).toFixed(1), left: +leftKneeAt(r, t).toFixed(1), hike: c.hike, lean: c.lean });
  }
  return rows;
}

/** Every step of a 10 m walk, right and left alternating, cm. */
export function gaitSteps(r: Rep) {
  const n = Math.round(1000 / (((r.stepR + r.stepL) / 2) * 100));
  return Array.from({ length: n }, (_, i) => {
    const side = i % 2 === 0 ? "R" : "L";
    const noise = Math.sin(i * 12.9898 + r.n * 78.233) * 3;
    const ramp = i === 0 || i === n - 1 ? -8 : 0;
    return { i: i + 1, side, len: Math.round((side === "R" ? r.stepR : r.stepL) * 100 + noise + ramp) };
  });
}

/* ── Checks & findings ───────────────────────────────────────────────── */

export type Check = { label: string; ok: boolean; note: string };

export function checksFor(r: Rep): Check[] {
  const hike = { label: "Hip hike", ok: r.hipHike <= LIMIT.hipHike, note: `${r.hipHike.toFixed(1)} cm · max ${LIMIT.hipHike}` };
  const lean = { label: "Trunk lean", ok: r.trunkLean <= LIMIT.trunkLean, note: `${r.trunkLean}° · max ${LIMIT.trunkLean}°` };
  const straight = { label: "Straightens", ok: r.lag <= LIMIT.lag, note: `${r.lag}° short · max ${LIMIT.lag}°` };
  if (r.ex === "rom")
    return [
      { label: "Range reached", ok: r.flex >= LIMIT.weekTarget, note: `${r.flex}° · aim ${LIMIT.weekTarget}°` },
      straight,
      { label: "Controlled speed", ok: r.speed <= LIMIT.romSpeed, note: `${r.speed}°/s · max ${LIMIT.romSpeed}` },
      { label: "Hold at end", ok: r.hold >= LIMIT.hold, note: `${r.hold.toFixed(1)} s · aim ${LIMIT.hold} s` },
      hike,
      lean,
    ];
  if (r.ex === "sts")
    return [
      { label: "Range reached", ok: r.flex >= LIMIT.stsDepth, note: `${r.flex}° seated · need ${LIMIT.stsDepth}°` },
      straight,
      { label: "Controlled lowering", ok: r.hold >= LIMIT.stsLower, note: `${r.hold.toFixed(1)} s · aim ${LIMIT.stsLower} s` },
      hike,
      lean,
    ];
  return [
    { label: "Bend in swing", ok: r.flex >= LIMIT.gaitSwing, note: `${r.flex}° · need ${LIMIT.gaitSwing}°` },
    straight,
    { label: "Cadence", ok: r.cadence >= LIMIT.cadence, note: `${r.cadence} steps/min · aim ${LIMIT.cadence}` },
    hike,
    lean,
    { label: "Step symmetry", ok: r.lr <= LIMIT.lr, note: `R ${Math.round(r.stepR * 100)} · L ${Math.round(r.stepL * 100)} cm · ${r.lr}%` },
  ];
}

export const failedChecks = (r: Rep) => checksFor(r).filter((c) => !c.ok).length;

export type FaultKey = "hipHike" | "trunkLean" | "kneeCave" | "shrug";

export const FAULTS: Record<FaultKey, { label: string; what: string; cue: string; view: View }> = {
  hipHike: { label: "Hip hike", what: "Lifts the right hip to help the knee move.", cue: "Keep both hips level", view: "front" },
  trunkLean: { label: "Trunk lean", what: "Leans the body away to take weight off the knee.", cue: "Chest tall, weight even", view: "front" },
  kneeCave: { label: "Knee cave", what: "Knee drifts inward on the way up.", cue: "Knee over second toe", view: "front" },
  shrug: { label: "Shoulder shrug", what: "Shoulders lift: a sign of effort or pain.", cue: "Relax the shoulders", view: "front" },
};

/** The physio reviews any finding the model is less than this sure of. */
export const REVIEW_BELOW = 80;

export type Finding = { key: FaultKey; conf: number; detail: string };

export function findingsFor(r: Rep): Finding[] {
  const out: Finding[] = [];
  if (r.hipHike > LIMIT.hipHike) out.push({ key: "hipHike", conf: Math.min(97, Math.round(62 + (r.hipHike - LIMIT.hipHike) * 40)), detail: `Right hip up ${r.hipHike.toFixed(1)} cm` });
  if (r.trunkLean > LIMIT.trunkLean) out.push({ key: "trunkLean", conf: Math.min(96, Math.round(60 + (r.trunkLean - LIMIT.trunkLean) * 9)), detail: `${r.trunkLean}° to the left` });
  if (r.kneeCave > LIMIT.kneeCave) out.push({ key: "kneeCave", conf: 72, detail: `${r.kneeCave}° inward` });
  if (r.shrug > LIMIT.shrug) out.push({ key: "shrug", conf: 64, detail: `Shoulders up ${r.shrug.toFixed(1)} cm` });
  return out;
}

/* ── Visits, measures & progress ─────────────────────────────────────── */

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

const romReps = repsOf("rom");
const stsReps = repsOf("sts");
const walkReps = repsOf("gait");

export const TODAY = {
  flex: Math.max(...romReps.map((r) => r.flex)),
  bestRom: [...romReps].sort((a, b) => b.flex - a.flex)[0].id,
  lag: Math.round(mean(romReps.map((r) => r.lag))),
  /** Left–right step-length difference on the walk. */
  lr: Math.round(mean(walkReps.map((r) => r.lr))),
  sts: +stsReps.reduce((a, r) => a + r.rise + r.hold, 0).toFixed(1),
  gaitSpeed: +mean(repsOf("gait").map((r) => r.gaitSpeed)).toFixed(2),
  cadence: Math.round(mean(repsOf("gait").map((r) => r.cadence))),
  reps: REPS.length,
};

/** Every visit so far, oldest first. Week 1 is the baseline; the last row is today.
 *  `lr` is the left–right step-length difference on the walk, read off the walkway camera. */
export const VISITS = [
  { wk: 1, date: "7 Oct", flex: 72, lag: 14, sts: 26.0, lr: 30 },
  { wk: 2, date: "14 Oct", flex: 81, lag: 12, sts: 24.1, lr: 26 },
  { wk: 3, date: "21 Oct", flex: 89, lag: 10, sts: 22.3, lr: 21 },
  { wk: 4, date: "28 Oct", flex: 96, lag: 9, sts: 20.8, lr: 17 },
  { wk: 5, date: "4 Nov", flex: 103, lag: 7, sts: 19.6, lr: 13 },
  { wk: 6, date: VISIT.short, flex: TODAY.flex, lag: TODAY.lag, sts: TODAY.sts, lr: TODAY.lr },
];
export const BASELINE = VISITS[0];
export const PREVIOUS = VISITS[VISITS.length - 2];

export type MeasureKey = "flex" | "lag" | "sts" | "lr";

export const MEASURES: { key: MeasureKey; label: string; title: string; group: string; unit: string; baseline: number; last: number; now: number; goal: number; info: string; digits?: number }[] = [
  { key: "flex", label: "Knee bend", title: "Mobility · bend", group: "Mobility", unit: "°", baseline: BASELINE.flex, last: PREVIOUS.flex, now: TODAY.flex, goal: LIMIT.goalFlex, info: "Most the right knee bent today, seated. Goal 125° lets you climb stairs and get up from a low chair." },
  { key: "lag", label: "Knee straighten", title: "Mobility · straighten", group: "Mobility", unit: "°", baseline: BASELINE.lag, last: PREVIOUS.lag, now: TODAY.lag, goal: LIMIT.lag, info: "How many degrees short of fully straight the knee stops (extension lag), averaged over the knee-bend reps. Goal: within 5°." },
  { key: "sts", label: "5 × sit-to-stand", title: "Strength & control", group: "Strength & control", unit: " s", baseline: BASELINE.sts, last: PREVIOUS.sts, now: TODAY.sts, goal: LIMIT.stsTime, digits: 1, info: "Time for five sit-to-stands without using the arms. Goal 12 s or less." },
  { key: "lr", label: "Left–right difference", title: "Symmetry", group: "Symmetry", unit: "%", baseline: BASELINE.lr, last: PREVIOUS.lr, now: TODAY.lr, goal: LIMIT.lr, info: "How unevenly the legs share the walk: right vs left step length, read off the walkway camera. Goal 10% or less." },
];

/** 0–100: how far a value has come from baseline to goal. Works both ways (lower-is-better goals too). */
export const progressOf = (baseline: number, goal: number, v: number) => Math.round(clamp01((v - baseline) / (goal - baseline)) * 100);

/** Progress to the patient's goal: knee bend from week 1 to 125°. */
export const PROGRESS = {
  now: progressOf(BASELINE.flex, LIMIT.goalFlex, TODAY.flex),
  last: progressOf(BASELINE.flex, LIMIT.goalFlex, PREVIOUS.flex),
};

/** Typical recovery after a knee replacement, by week: a band either side of the usual curve. */
const typical = (wk: number) => 1 - Math.exp(-(wk - 1) / 4);
export const EXPECTED_BAND: Record<"flex" | "lag" | "sts" | "lr", (wk: number) => [number, number]> = {
  flex: (wk) => { const c = 75 + (122 - 75) * typical(wk); return [Math.round(c - 8), Math.round(c + 8)]; },
  lag: (wk) => { const c = 13 - (13 - 3) * typical(wk); return [Math.max(0, Math.round(c - 3)), Math.round(c + 3)]; },
  sts: (wk) => { const c = 25 - (25 - 11) * typical(wk); return [+(c - 2.5).toFixed(1), +(c + 2.5).toFixed(1)]; },
  lr: (wk) => { const c = 32 - (32 - 8) * typical(wk); return [Math.max(0, Math.round(c - 5)), Math.round(c + 5)]; },
};
export const TIMELINE_WEEKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** Weeks to reach the bend goal at the pace of the last three visits. */
export function goalWeek() {
  const recent = VISITS.slice(-3);
  const perWeek = (recent[recent.length - 1].flex - recent[0].flex) / (recent.length - 1);
  if (perWeek <= 0) return null;
  return Math.ceil(PATIENT.week + (LIMIT.goalFlex - TODAY.flex) / perWeek);
}

/* ── Programme change & discharge ────────────────────────────────────── */

export type Plan = "progress" | "hold" | "regress";

export const PLAN_CHANGES: Record<Plan, string[]> = {
  progress: ["Heel slides: add a 5 s hold at end range", "Add step-ups · 10 cm · 3 × 8", "Sit-to-stand: cue level hips"],
  hold: ["Keep the current programme", "Recheck bend and hip hike next visit"],
  regress: ["Sit-to-stand down to 2 × 6", "Ice 15 min after exercise"],
};

/** The model's suggestion and why, from today's numbers against the last visit. */
export function suggestedPlan(): { plan: Plan; reasons: { label: string; ok: boolean }[] } {
  const hikeReps = stsReps.filter((r) => r.hipHike > LIMIT.hipHike).length;
  const signed = (n: number) => `${n >= 0 ? "+" : "−"}${Math.abs(n)}`;
  const reasons = [
    { label: `Bend ${signed(TODAY.flex - PREVIOUS.flex)}°`, ok: TODAY.flex > PREVIOUS.flex },
    { label: `Short of straight ${signed(TODAY.lag - PREVIOUS.lag)}°`, ok: TODAY.lag < PREVIOUS.lag },
    { label: `Hip hike ${hikeReps}/${stsReps.length} stands`, ok: hikeReps <= 1 },
  ];
  /* Bend is the headline goal: progress on one miss as long as bend still improved. */
  const fails = reasons.filter((r) => !r.ok).length;
  return { plan: fails === 0 || (fails === 1 && reasons[0].ok) ? "progress" : fails <= 2 ? "hold" : "regress", reasons };
}

export const DISCHARGE: { label: string; target: string; now: string; met: boolean; note?: string }[] = [
  { label: "Knee bend", target: `≥ ${LIMIT.goalFlex}°`, now: `${TODAY.flex}°`, met: TODAY.flex >= LIMIT.goalFlex },
  { label: "Knee straighten", target: `≤ ${LIMIT.lag}° short`, now: `${TODAY.lag}°`, met: TODAY.lag <= LIMIT.lag },
  { label: "Left–right difference", target: `≤ ${LIMIT.lr}%`, now: `${TODAY.lr}%`, met: TODAY.lr <= LIMIT.lr },
  { label: "5 × sit-to-stand", target: `≤ ${LIMIT.stsTime} s`, now: `${TODAY.sts} s`, met: TODAY.sts <= LIMIT.stsTime },
  { label: "Walking speed", target: "≥ 1.0 m/s", now: `${TODAY.gaitSpeed} m/s`, met: TODAY.gaitSpeed >= 1 },
  { label: "Walks without a stick", target: "Yes", now: "Yes", met: true },
];

export const fmtClock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
