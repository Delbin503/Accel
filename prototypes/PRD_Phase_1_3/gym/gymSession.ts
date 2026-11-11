/* One lifter's back-squat workout at a rack: 4 sets × 5 reps at 100 kg, read
   off one side camera (2D pose, 60 fps) with a bar speed sensor on the bar.
   The unit of analysis is a rep, grouped into sets. Every number on the Lift
   Analysis page is derived from the reps below. Fatigue shows in the last reps
   of the later sets: the bar slows, the torso tips forward and the bar drifts. */

export const LIFTER = { name: "Jason Teo", id: "DT-0418", training: "5 yrs training", bodyweight: 82 };

export const SESSION = {
  gym: "Downtown gym",
  rack: "Rack 5",
  lift: "Back squat",
  load: 100,
  plannedSets: 4,
  plannedReps: 5,
  coach: "Coach Sarah Koh",
  className: "6 pm barbell class",
  date: "10 Nov 2026 · 18:12",
  lengthSec: 1020,
  cameras: "Side · 60 fps",
  /** Rack 5 has no front camera, so knee tracking isn't measured. */
  frontCamera: false,
  sensor: "BS-2 · connected",
  trackingFps: 60,
  model: "Strength Technique Assessment v1.0",
};

export const METHOD_NOTE =
  "Joint angles, depth and bar path come from 2D pose on the side camera at 60 fps. Bar speed comes from the bar speed sensor. Knee tracking needs the optional front camera, which Rack 5 doesn't have.";

/* ── Reps ────────────────────────────────────────────────────────────── */

export type Rep = {
  /** "set.rep", e.g. "2.3". */
  id: string;
  set: number;
  rep: number;
  /** 1–20 across the workout. */
  n: number;
  /** Seconds into the session recording. */
  at: number;
  /** Hip crease below (+) or above (−) the top of the knee at the bottom, cm. */
  depth: number;
  /** Torso lean at the bottom, ° from vertical. */
  lean: number;
  /** Largest bar drift off the mid-foot line, cm. */
  drift: number;
  /** Knee cave, °. Null when there's no front camera. */
  knee: number | null;
  /** Bar ahead of mid-foot at the start, cm. */
  setup: number;
  /** Lower-back flexion change top → bottom, ° (brace lost). */
  backRound: number;
  /** Descent, pause at the bottom, and ascent time, s. */
  ecc: number;
  pause: number;
  con: number;
  /** Mean concentric bar speed, m/s (sensor). */
  meanVel: number;
  /** Bar travel, cm. */
  rom: number;
  /** Extra torso lean in the first third of the ascent, ° (hips rising first). */
  hipRise: number;
  /** Hip angle at the top, °. */
  lockout: number;
  /** Heel lift at the bottom, cm. */
  heelLift: number;
};

const SET_START = [62, 318, 566, 830];
const R = (
  set: number, rep: number, depth: number, lean: number, drift: number, setup: number, backRound: number,
  ecc: number, pause: number, meanVel: number, hipRise: number, lockout: number, heelLift: number,
): Omit<Rep, "at" | "n"> => {
  const rom = Math.round(58 + Math.min(0, depth) * 0.8);
  const con = +(rom / 100 / meanVel).toFixed(2);
  return {
    id: `${set}.${rep}`, set, rep, depth, lean, drift, knee: null, setup, backRound, ecc, pause, con, meanVel, rom, hipRise, lockout, heelLift,
  };
};

const RAW = [
  R(1, 1, 4.0, 38, 2.6, 1.2, 4, 1.7, 0.15, 0.58, 3, 178, 0),
  R(1, 2, 4.4, 39, 2.9, 1.0, 4, 1.6, 0.15, 0.57, 3, 178, 0),
  R(1, 3, 3.8, 39, 3.1, 1.4, 5, 1.6, 0.12, 0.56, 4, 177, 0),
  R(1, 4, 3.5, 40, 3.4, 1.1, 5, 1.5, 0.12, 0.54, 4, 177, 0),
  R(1, 5, 3.1, 41, 3.8, 1.5, 6, 1.5, 0.1, 0.52, 5, 176, 0),
  R(2, 1, 4.2, 38, 2.8, 1.0, 4, 1.7, 0.15, 0.57, 3, 178, 0),
  R(2, 2, 3.9, 39, 3.0, 1.3, 5, 1.6, 0.14, 0.55, 4, 178, 0),
  R(2, 3, 3.6, 40, 3.5, 1.2, 5, 1.5, 0.12, 0.53, 4, 177, 0),
  R(2, 4, 2.9, 42, 4.1, 1.6, 6, 1.4, 0.1, 0.51, 6, 176, 0),
  R(2, 5, 2.2, 43, 4.6, 1.8, 7, 1.3, 0.08, 0.48, 7, 175, 0),
  R(3, 1, 3.9, 39, 3.0, 1.1, 5, 1.6, 0.14, 0.55, 4, 178, 0),
  R(3, 2, 3.4, 40, 3.3, 1.4, 5, 1.5, 0.12, 0.53, 5, 177, 0),
  R(3, 3, -1.2, 42, 4.0, 1.5, 6, 1.4, 0.1, 0.51, 6, 176, 0),
  R(3, 4, 2.4, 44, 4.8, 1.9, 7, 1.3, 0.08, 0.48, 7, 175, 0.4),
  R(3, 5, 1.6, 46, 5.4, 2.2, 8, 1.2, 0.06, 0.45, 9, 174, 0.6),
  R(4, 1, 3.6, 40, 3.2, 1.3, 5, 1.5, 0.12, 0.52, 5, 177, 0),
  R(4, 2, 2.8, 42, 4.0, 1.6, 6, 1.4, 0.1, 0.49, 6, 176, 0),
  R(4, 3, 2.0, 45, 4.9, 2.0, 7, 1.3, 0.08, 0.45, 8, 175, 0.5),
  R(4, 4, 0.6, 48, 6.2, 2.4, 9, 1.1, 0.05, 0.4, 11, 173, 0.9),
  R(4, 5, -1.8, 52, 7.4, 2.9, 11, 0.9, 0.04, 0.35, 14, 171, 1.6),
];

/* Reps follow each other ~1.4 s apart inside a set; sets start after the rest. */
export const REPS: Rep[] = (() => {
  const out: Rep[] = [];
  let t = 0;
  RAW.forEach((r, i) => {
    if (r.rep === 1) t = SET_START[r.set - 1];
    out.push({ ...r, n: i + 1, at: Math.round(t) });
    t += r.ecc + r.pause + r.con + 1.4;
  });
  return out;
})();

export const SETS = Array.from(new Set(REPS.map((r) => r.set)));
export const repsOf = (set: number) => REPS.filter((r) => r.set === set);
export const repById = (id: string) => REPS.find((r) => r.id === id)!;

/* ── Targets ─────────────────────────────────────────────────────────── */

/** The coach's back-squat reference: the use case's criteria plus tempo and lockout. */
export const TARGET = {
  depth: 0, // hip crease at or below the knee
  lean: 45,
  drift: 5,
  knee: 8,
  setup: 3,
  backRound: 8,
  hipRise: 8,
  ecc: [1.2, 2.2] as const,
  lockout: 174,
  heelLift: 1,
  velLoss: 25,
};

/** Share of the set's first-rep speed left when the bar has slowed by the velocity-loss cut-off. */
export const STOP_AT = 1 - TARGET.velLoss / 100;

/* ── Scoring ─────────────────────────────────────────────────────────── */

/** Less is better: 100 up to `good`, 75 at `max`, then `per` points off per unit over. */
function atMost(v: number, good: number, max: number, per: number) {
  if (v <= good) return 100;
  if (v <= max) return Math.round(100 - (25 * (v - good)) / (max - good));
  return Math.max(0, Math.round(75 - (v - max) * per));
}
/** More is better: 100 from `good`, 75 at `min`, then `per` points off per unit under. */
function atLeast(v: number, good: number, min: number, per: number) {
  if (v >= good) return 100;
  if (v >= min) return Math.round(100 - (25 * (good - v)) / (good - min));
  return Math.max(0, Math.round(75 - (min - v) * per));
}
function within(v: number, [lo, hi]: readonly [number, number], per: number) {
  if (v >= lo && v <= hi) return 100;
  return Math.max(0, Math.round(75 - (v < lo ? lo - v : v - hi) * per));
}

export type FundKey = "setup" | "depth" | "torso" | "barPath" | "tempo" | "lockout";

export const FUNDAMENTALS: { key: FundKey; label: string; measures: string }[] = [
  { key: "setup", label: "Setup & brace", measures: "Bar over mid-foot at the start, and the lower back held flat to the bottom." },
  { key: "depth", label: "Depth", measures: "Hip crease at or below the top of the knee at the bottom." },
  { key: "torso", label: "Torso angle", measures: "Torso lean at the bottom (≤ 45°), and chest and hips rising together." },
  { key: "barPath", label: "Bar path", measures: "How far the bar drifts off the mid-foot line (≤ 5 cm)." },
  { key: "tempo", label: "Tempo", measures: "A controlled descent of 1.2–2.2 s." },
  { key: "lockout", label: "Lockout", measures: "Hips fully open at the top (hip angle 174°+)." },
];

export function fundScores(r: Rep): Record<FundKey, number> {
  return {
    setup: Math.round((atMost(r.setup, 1, TARGET.setup, 12) + atMost(r.backRound, 4, TARGET.backRound, 6)) / 2),
    depth: atLeast(r.depth, 3, TARGET.depth, 14),
    torso: Math.round((atMost(r.lean, 34, TARGET.lean, 5) + atMost(r.hipRise, 4, TARGET.hipRise, 5)) / 2),
    barPath: atMost(r.drift, 2.5, TARGET.drift, 10),
    tempo: within(r.ecc, TARGET.ecc, 60),
    lockout: atLeast(r.lockout, 177, TARGET.lockout, 8),
  };
}

/** Depth, torso and bar path decide whether the rep counts and how safe it is, so they count for more. */
const WEIGHT: Record<FundKey, number> = { setup: 0.8, depth: 1.3, torso: 1.3, barPath: 1.2, tempo: 0.6, lockout: 0.7 };

export function repScore(r: Rep) {
  const f = fundScores(r);
  const keys = Object.keys(WEIGHT) as FundKey[];
  return Math.round(keys.reduce((a, k) => a + f[k] * WEIGHT[k], 0) / keys.reduce((a, k) => a + WEIGHT[k], 0));
}

export const GRADE_BANDS: [string, number][] = [["A", 90], ["B", 80], ["C", 70], ["D", 55], ["F", 0]];
export const gradeOf = (score: number) => GRADE_BANDS.find(([, min]) => score >= min)![0];

/** Summarise each movement fundamental across the selected workout. */
export function fundamentalsFor(reps: Rep[]) {
  return FUNDAMENTALS.map((fundamental) => {
    const scores = reps.map((rep) => fundScores(rep)[fundamental.key]);
    const score = Math.round(scores.reduce((total, value) => total + value, 0) / Math.max(1, scores.length));
    return {
      ...fundamental,
      score,
      met: scores.filter((value) => value >= 75).length,
      previous: PREVIOUS.fund[fundamental.key],
    };
  });
}

/* ── Faults ──────────────────────────────────────────────────────────── */

export type FaultKey = "hipsRiseFirst" | "forwardLean" | "barDrift" | "shallowDepth" | "backRounding" | "heelLift" | "kneeCave";
export type Confidence = "High" | "Medium" | "Low";

export const FAULTS: Record<FaultKey, { label: string; what: string; cue: string; drill: string; weight: number }> = {
  hipsRiseFirst: {
    label: "Hips rise first",
    what: "Hips shoot up out of the bottom and the chest stays down.",
    cue: "Chest and hips up together",
    drill: "Pause squat 3 × 3 @ 80 kg",
    weight: 1.15,
  },
  forwardLean: {
    label: "Forward lean",
    what: "Torso tips past 45° at the bottom.",
    cue: "Big breath, elbows under the bar",
    drill: "Tempo squat 3-1-1 · 3 × 5 @ 75 kg",
    weight: 1,
  },
  barDrift: {
    label: "Bar drift",
    what: "Bar moves forward of the mid-foot line.",
    cue: "Keep the bar over mid-foot",
    drill: "Box squat 3 × 5 @ 80 kg",
    weight: 0.8,
  },
  shallowDepth: {
    label: "Shallow depth",
    what: "Hip crease stays above the knee.",
    cue: "Sit between the heels",
    drill: "Goblet squat to box 2 × 8",
    weight: 1.2,
  },
  backRounding: {
    label: "Back rounding",
    what: "Lower back flexes at the bottom (brace lost).",
    cue: "Brace before every rep",
    drill: "Dead bug + pause squat",
    weight: 1.3,
  },
  heelLift: {
    label: "Heel lift",
    what: "Heels come off the floor at the bottom.",
    cue: "Whole foot down",
    drill: "Ankle mobility 2 × 10",
    weight: 0.9,
  },
  kneeCave: {
    label: "Knee cave",
    what: "Knees collapse inward. Needs the front camera.",
    cue: "Knees over toes",
    drill: "Banded squat 3 × 8",
    weight: 1.1,
  },
};

export type Finding = { key: FaultKey; confidence: Confidence; detail: string };

export function findingsFor(r: Rep): Finding[] {
  const out: Finding[] = [];
  if (r.hipRise > TARGET.hipRise) out.push({ key: "hipsRiseFirst", confidence: r.hipRise > 11 ? "High" : "Medium", detail: `+${r.hipRise}° lean off the bottom` });
  if (r.lean > TARGET.lean) out.push({ key: "forwardLean", confidence: "High", detail: `${r.lean}° at the bottom` });
  if (r.drift > TARGET.drift) out.push({ key: "barDrift", confidence: r.drift > 6 ? "High" : "Medium", detail: `${r.drift.toFixed(1)} cm forward` });
  if (r.depth < TARGET.depth) out.push({ key: "shallowDepth", confidence: r.depth < -1.5 ? "High" : "Medium", detail: `${Math.abs(r.depth).toFixed(1)} cm above parallel` });
  if (r.backRound > TARGET.backRound) out.push({ key: "backRounding", confidence: "Low", detail: `${r.backRound}° lower-back flexion` });
  if (r.heelLift > TARGET.heelLift) out.push({ key: "heelLift", confidence: "Medium", detail: `${r.heelLift.toFixed(1)} cm` });
  if (r.knee !== null && r.knee > TARGET.knee) out.push({ key: "kneeCave", confidence: "Medium", detail: `${r.knee}° inward` });
  return out;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

/** Faults across the workout, ranked by impact: reps hit × how much the fault matters. */
export function rankedFaults(reps: Rep[]) {
  return (Object.keys(FAULTS) as FaultKey[])
    .map((key) => {
      const hit = reps.filter((r) => findingsFor(r).some((f) => f.key === key));
      const clean = reps.filter((r) => !hit.includes(r));
      const velCost = hit.length && clean.length ? +(mean(clean.map((r) => r.meanVel)) - mean(hit.map((r) => r.meanVel))).toFixed(2) : 0;
      const example = [...hit].sort((a, b) => repScore(a) - repScore(b))[0];
      const firstSet = hit.length ? Math.min(...hit.map((r) => r.set)) : 0;
      return { key, ...FAULTS[key], count: hit.length, velCost, impact: hit.length * FAULTS[key].weight, example: example?.id, firstSet };
    })
    .filter((f) => f.count > 0)
    .sort((a, b) => b.impact - a.impact);
}

/* ── Session stats ───────────────────────────────────────────────────── */

/** % slower from the set's first rep to its last. */
export function velLossOf(set: number) {
  const rs = repsOf(set);
  return Math.round((1 - rs[rs.length - 1].meanVel / rs[0].meanVel) * 100);
}
/** % slower than the first rep of its set. */
export const repLoss = (r: Rep) => Math.round((1 - r.meanVel / repsOf(r.set)[0].meanVel) * 100);

/** Load–velocity estimate: ~0.30 m/s at a 1RM, each 0.15 m/s faster ≈ 10% lighter. */
export const e1rmFrom = (load: number, vel: number) => Math.round(load / (1 - (vel - 0.3) * (0.1 / 0.15)));

export function statsFor(reps: Rep[]) {
  const firsts = SETS.map((s) => repsOf(s)[0].meanVel);
  const good = reps.filter((r) => findingsFor(r).length === 0).length;
  const sorted = [...reps].sort((a, b) => repScore(b) - repScore(a));
  return {
    sets: SETS.length,
    reps: reps.length,
    good,
    score: Math.round(mean(reps.map(repScore))),
    volume: reps.length * SESSION.load,
    avgVel: mean(reps.map((r) => r.meanVel)),
    e1rm: e1rmFrom(SESSION.load, mean(firsts)),
    velLoss: Math.max(...SETS.map(velLossOf)),
    firstVel: mean(firsts),
    best: sorted[0].id,
    weakest: sorted[sorted.length - 1].id,
  };
}

export const STATS = statsFor(REPS);
export const BEST_REP = STATS.best;
export const WEAKEST_REP = STATS.weakest;

/** Last session's results, for the "vs last session" comparisons. */
export const PREVIOUS = {
  date: "3 Nov",
  load: 95,
  sets: 4,
  plannedSets: 4,
  good: 17,
  reps: 20,
  score: 80,
  volume: 1900,
  avgVel: 0.52,
  e1rm: 115,
  velLoss: 24,
  fund: { setup: 92, depth: 90, torso: 76, barPath: 81, tempo: 96, lockout: 93 } as Record<FundKey, number>,
};

/** Every back-squat session so far, oldest first. The last row is this one. */
export const HISTORY = [
  { date: "13 Oct", load: 85, volume: 1700, e1rm: 108, avgVel: 0.55, velLoss: 22, goodPct: 70, score: 71 },
  { date: "20 Oct", load: 90, volume: 1800, e1rm: 111, avgVel: 0.53, velLoss: 25, goodPct: 75, score: 74 },
  { date: "27 Oct", load: 92.5, volume: 1850, e1rm: 113, avgVel: 0.53, velLoss: 23, goodPct: 80, score: 77 },
  { date: "3 Nov", load: PREVIOUS.load, volume: PREVIOUS.volume, e1rm: PREVIOUS.e1rm, avgVel: PREVIOUS.avgVel, velLoss: PREVIOUS.velLoss, goodPct: 85, score: PREVIOUS.score },
  {
    date: "10 Nov", load: SESSION.load, volume: STATS.volume, e1rm: STATS.e1rm, avgVel: +STATS.avgVel.toFixed(2), velLoss: STATS.velLoss,
    goodPct: Math.round((STATS.good / STATS.reps) * 100), score: STATS.score,
  },
];

export const PERSONAL_BESTS = [
  { label: "Est. 1RM", value: `${STATS.e1rm} kg`, was: `${Math.max(...HISTORY.slice(0, -1).map((h) => h.e1rm))} kg`, isNew: true },
  { label: "Top load", value: `${SESSION.load} kg × 5`, was: `${PREVIOUS.load} kg × 5`, isNew: true },
  { label: "Volume", value: `${STATS.volume.toLocaleString()} kg`, was: `${PREVIOUS.volume.toLocaleString()} kg`, isNew: true },
  { label: "Fastest rep", value: `${Math.max(...REPS.map((r) => r.meanVel)).toFixed(2)} m/s`, was: "@ 100 kg", isNew: false },
];

/** Next session's load: hold it while the last set falls apart, add 2.5 kg once it doesn't. */
export function nextLoad() {
  const lastSet = repsOf(SETS[SETS.length - 1]);
  const lastSetFaults = lastSet.filter((r) => findingsFor(r).length).length;
  const hold = STATS.velLoss > TARGET.velLoss || lastSetFaults >= 2;
  return {
    load: hold ? SESSION.load : SESSION.load + 2.5,
    hold,
    stopVel: +(STATS.firstVel * STOP_AT).toFixed(2),
  };
}

/* ── Phases & signals ────────────────────────────────────────────────── */

export type Phase = "setup" | "descent" | "bottom" | "ascent" | "lockout";
export const PHASES: { key: Phase; label: string }[] = [
  { key: "setup", label: "Setup" },
  { key: "descent", label: "Descent" },
  { key: "bottom", label: "Bottom" },
  { key: "ascent", label: "Ascent" },
  { key: "lockout", label: "Lockout" },
];

/** The rep starts moving this long into the signal window. */
const LEAD = 0.3;
/** The signal charts share one window so reps line up: 0 → 4.2 s. */
export const WINDOW: [number, number] = [0, 4.2];

/** When each phase happens, seconds into the window. */
export function phaseTime(r: Rep, p: Phase) {
  return {
    setup: LEAD * 0.5,
    descent: LEAD + r.ecc * 0.55,
    bottom: LEAD + r.ecc + r.pause / 2,
    ascent: LEAD + r.ecc + r.pause + r.con * 0.38,
    lockout: Math.min(WINDOW[1] - 0.05, LEAD + r.ecc + r.pause + r.con + 0.15),
  }[p];
}

const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** How deep the lifter is at time t: 0 standing, 1 at the bottom. `up` is true on the way up. */
export function depthAt(r: Rep, t: number): { d: number; up: boolean } {
  const bottom = LEAD + r.ecc;
  const rise = bottom + r.pause;
  if (t <= LEAD) return { d: 0, up: false };
  if (t <= bottom) return { d: smooth((t - LEAD) / r.ecc), up: false };
  if (t <= rise) return { d: 1, up: true };
  /* Ascent: slower through the sticking point ~40% of the way up. */
  const u = Math.min(1, (t - rise) / r.con);
  const stick = 0.07 * Math.sin(Math.PI * Math.min(1, u / 0.8)) * (1 - u);
  return { d: 1 - Math.min(1, Math.max(0, smooth(u) - stick)), up: true };
}

/* ── Body model (side view) ──────────────────────────────────────────── */

/** Segment lengths on the side camera frame, SVG units. */
export const SEG = { shin: 58, thigh: 60, torso: 68 };
/** SVG units per cm on the side camera frame. */
export const PX_PER_CM = 1.4;

/** Bar offset ahead of the mid-foot line, cm, at depth d. Largest just off the bottom on the way up. */
export function barOffset(r: Rep, d: number, up: boolean) {
  const g = !up ? 0.45 * d : (() => {
    const p = 1 - d;
    return p < 0.45 ? 0.45 + 0.55 * Math.sin((p / 0.45) * (Math.PI / 2)) : 1 - (p - 0.45) / 0.55;
  })();
  return r.setup + (r.drift - r.setup) * g;
}

/** Segment angles at depth `d`: thigh from vertical (β), torso lean (α), and the shin from vertical (θ) solved so the bar sits over mid-foot plus its drift. */
export function bodyAt(r: Rep, d: number, up: boolean) {
  const delta = (Math.asin(Math.max(-0.4, Math.min(0.4, r.depth / 45))) * 180) / Math.PI;
  const top = up ? 180 - r.lockout - 3 : 2;
  const beta = lerp(top, 90 + delta, d);
  const extra = up ? r.hipRise * Math.exp(-(((d - 0.72) / 0.2) ** 2)) : 0;
  const alpha = lerp(3, r.lean, d ** 1.15) + extra;
  const off = barOffset(r, d, up);
  const rad = Math.PI / 180;
  /* Bar x relative to the ankle = shin·sinθ − thigh·sinβ + torso·sinα − 2 (bar sits just behind the shoulder) = 4 (mid-foot) + offset. */
  const sinT = (4 + off * PX_PER_CM + SEG.thigh * Math.sin(beta * rad) - SEG.torso * Math.sin(alpha * rad) + 2) / SEG.shin;
  const theta = Math.asin(Math.max(-0.2, Math.min(0.8, sinT))) / rad;
  return {
    beta, alpha, theta, off,
    hipAngle: Math.round(180 - beta - alpha),
    kneeAngle: Math.round(180 - beta - theta),
  };
}

/** Bar speed, joint angles and lean through the rep, every 50 ms. */
export function repSeries(r: Rep) {
  const rows: { t: number; vel: number; hip: number; knee: number; lean: number }[] = [];
  const dt = 0.05;
  const height = (t: number) => (1 - depthAt(r, t).d) * r.rom;
  for (let i = 0; i <= Math.round(WINDOW[1] / dt); i++) {
    const t = +(i * dt).toFixed(2);
    const raw = (height(t + dt / 2) - height(t - dt / 2)) / dt / 100;
    const { d, up } = depthAt(r, t);
    const b = bodyAt(r, d, up);
    rows.push({ t, vel: +raw.toFixed(2), hip: b.hipAngle, knee: b.kneeAngle, lean: +b.alpha.toFixed(1) });
  }
  return rows;
}

/** Peak concentric bar speed, m/s. */
export const peakVelOf = (r: Rep) => Math.max(...repSeries(r).map((p) => p.vel));

/** Bar path of a rep, side view: x = cm ahead of mid-foot, y = cm above the bottom. */
export function barPathOf(r: Rep, steps = 24) {
  const pts: { x: number; y: number; up: boolean }[] = [];
  for (let i = 0; i <= steps; i++) pts.push({ x: barOffset(r, i / steps, false), y: r.rom * (1 - i / steps), up: false });
  for (let i = steps; i >= 0; i--) pts.push({ x: barOffset(r, i / steps, true), y: r.rom * (1 - i / steps), up: true });
  return pts;
}

export const fmtClock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
export const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";
