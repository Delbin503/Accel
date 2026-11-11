/* One golfer's 7-iron lesson at an indoor bay: ten swings read off a face-on and
   a down-the-line camera, with launch-monitor data for each. Every number on
   the Swing Assessment page is derived from the swings below. */

import type { DeviceMode } from "../assessment/deviceState";

export const GOLFER = { name: "Marcus Tan", initials: "MT", id: "GA-0217", handicap: 14, academy: "Fairway Performance Academy" };

export const SESSION = {
  bay: "Bay 4",
  club: "7-iron",
  coach: "Coach Daniel Lim",
  date: "8 Nov 2026 · 09:30",
  lengthSec: 1680,
  cameras: "Face-on + down-the-line · 240 fps",
  launchMonitor: "Connected",
  model: "Golf Swing Assessment v1.2",
  trackingFps: 240,
  droppedFrames: 12,
};

export const METHOD_NOTE =
  "Body angles come from 3D pose read off the face-on and down-the-line cameras at 240 fps. Ball and club data come from the bay's launch monitor. Targets are the coach's 7-iron reference for this golfer.";

/** The method note for the launch monitor's state: everything body-related still comes from the cameras. */
export function methodNoteFor(mode: DeviceMode) {
  if (mode === "connected") return METHOD_NOTE;
  const ball = mode === "none"
    ? "Ball and club data weren't captured: no launch monitor was connected."
    : `Ball and club data come from the bay's launch monitor, which went offline at ${fmtClock(swingByN(MONITOR_OFFLINE_FROM).at)}, so swings ${MONITOR_OFFLINE_FROM}–${SWINGS.length} have none.`;
  return `Body angles come from 3D pose read off the face-on and down-the-line cameras at 240 fps. ${ball} Targets are the coach's 7-iron reference for this golfer.`;
}

/* ── Swings ──────────────────────────────────────────────────────────── */

export type Swing = {
  n: number;
  /** Seconds into the lesson recording. */
  at: number;
  chestTurn: number;
  pelvisTurn: number;
  /** Pelvis shift away from the target at the top, cm. */
  pelvisSway: number;
  /** Head movement address → impact, cm. */
  headMove: number;
  /** Forward bend at address and at impact, degrees from vertical. */
  spineAddr: number;
  spineImpact: number;
  /** Hips moving toward the ball by impact, cm (early extension). */
  pelvisThrust: number;
  /** Lead wrist at the top, ° (+ cupped, − bowed). */
  leadWristTop: number;
  /** Weight on the lead foot at impact, %. */
  weightLead: number;
  backswing: number;
  downswing: number;
  /** Peak rotation speed before impact, ms: pelvis, chest, arms, club. */
  peaks: [number, number, number, number];
  clubSpeed: number;
  ballSpeed: number;
  launch: number;
  spin: number;
  carry: number;
  /** Club path, ° (+ in-to-out, − out-to-in). */
  clubPath: number;
  /** Face to target at impact, ° (+ open). */
  faceAngle: number;
  /** Yards off line at landing (+ right). */
  offline: number;
};

const S = (
  n: number, at: number, chestTurn: number, pelvisTurn: number, pelvisSway: number, headMove: number, spineAddr: number, spineImpact: number,
  pelvisThrust: number, leadWristTop: number, weightLead: number, backswing: number, downswing: number, peaks: Swing["peaks"],
  clubSpeed: number, ballSpeed: number, launch: number, spin: number, carry: number, clubPath: number, faceAngle: number, offline: number,
): Swing => ({ n, at, chestTurn, pelvisTurn, pelvisSway, headMove, spineAddr, spineImpact, pelvisThrust, leadWristTop, weightLead, backswing, downswing, peaks, clubSpeed, ballSpeed, launch, spin, carry, clubPath, faceAngle, offline });

export const SWINGS: Swing[] = [
  S(1, 92, 88, 46, 3.1, 4.2, 35, 29, 6.2, 6, 82, 0.98, 0.32, [-95, -70, -48, -12], 78, 106, 18.5, 6900, 152, -2.1, 1.4, 8),
  S(2, 240, 90, 45, 2.6, 3.8, 35, 30, 5.1, 4, 85, 0.95, 0.31, [-98, -75, -50, -10], 79, 108, 18.0, 6700, 156, -1.0, 0.6, 4),
  S(3, 395, 84, 50, 6.4, 7.1, 34, 26, 7.8, 12, 68, 1.02, 0.3, [-80, -88, -60, -14], 76, 101, 20.1, 7600, 141, -5.2, 2.8, 19),
  S(4, 530, 91, 44, 2.2, 3.5, 36, 32, 3.6, 3, 86, 0.96, 0.32, [-100, -76, -52, -11], 80, 110, 17.6, 6500, 159, 0.4, -0.2, -2),
  S(5, 700, 87, 47, 4.8, 5.6, 35, 28, 6.9, 8, 78, 0.99, 0.3, [-92, -74, -50, -12], 78, 105, 19.0, 7000, 150, -3.6, 1.9, 12),
  S(6, 860, 92, 44, 2.4, 3.2, 36, 32, 3.2, 2, 88, 0.94, 0.31, [-102, -78, -51, -10], 81, 111, 17.4, 6400, 161, 1.1, 0.3, 3),
  S(7, 1010, 94, 45, 1.9, 2.8, 36, 33, 2.4, 1, 90, 0.93, 0.31, [-104, -80, -53, -10], 82, 113, 17.2, 6300, 164, 1.6, 0.1, -1),
  S(8, 1180, 89, 46, 3.4, 4.6, 35, 29, 5.6, 5, 83, 0.97, 0.32, [-96, -72, -49, -11], 79, 107, 18.3, 6800, 154, -2.4, 1.2, 7),
  S(9, 1340, 86, 48, 5.3, 6.0, 35, 28, 7.0, 9, 76, 1.0, 0.31, [-88, -84, -56, -13], 77, 103, 19.4, 7200, 146, -4.1, 2.2, 15),
  S(10, 1500, 91, 45, 2.7, 3.6, 36, 31, 4.4, 3, 86, 0.95, 0.31, [-99, -77, -51, -11], 80, 109, 17.8, 6600, 157, -0.6, 0.4, 3),
];

export const swingByN = (n: number) => SWINGS.find((s) => s.n === n)!;

/* ── Launch monitor ──────────────────────────────────────────────────── */

/** In the "went offline" preview, the launch monitor drops out on this swing. */
export const MONITOR_OFFLINE_FROM = 7;

/** Whether a swing has ball and club data (speed, carry, launch, spin, path, face). */
export type HasBall = (s: Swing) => boolean;
export const ALL_BALL: HasBall = () => true;

export function hasBallFor(mode: DeviceMode): HasBall {
  if (mode === "none") return () => false;
  if (mode === "offline") return (s) => s.n < MONITOR_OFFLINE_FROM;
  return ALL_BALL;
}

/* Derived per-swing values */
export const xFactor = (s: Swing) => s.chestTurn - s.pelvisTurn;
export const spineLost = (s: Swing) => s.spineAddr - s.spineImpact;
export const tempo = (s: Swing) => s.backswing / s.downswing;
export const smash = (s: Swing) => s.ballSpeed / s.clubSpeed;
/** Peaks in the right order: pelvis, then chest, then arms, then club. */
export const inSequence = (s: Swing) => s.peaks[0] < s.peaks[1] && s.peaks[1] < s.peaks[2] && s.peaks[2] < s.peaks[3];

export type Shape = "Draw" | "Straight" | "Fade" | "Slice" | "Hook";
export function shapeOf(s: Swing): Shape {
  const d = s.faceAngle - s.clubPath;
  if (d > 4) return "Slice";
  if (d > 1) return "Fade";
  if (d < -4) return "Hook";
  if (d < -1) return "Draw";
  return "Straight";
}

/* ── Targets ─────────────────────────────────────────────────────────── */

/** The coach's 7-iron reference for this golfer. */
export const TARGET = {
  spineAddr: [32, 38],
  chestTurn: [85, 100],
  pelvisTurn: [38, 50],
  xFactor: [40, 52],
  pelvisSway: [0, 4],
  headMove: [0, 5],
  spineLost: [0, 4],
  pelvisThrust: [0, 4],
  tempo: [2.8, 3.3],
  weightLead: [80, 100],
  clubPath: [-2, 3],
} as const satisfies Record<string, readonly [number, number]>;

export const inRange = (v: number, [lo, hi]: readonly [number, number]) => v >= lo && v <= hi;

/** 100 at the ideal, 75 at the edge of the coach's range, then `per` points
 *  off for each unit outside it. A range starting at 0 is "less is better", so
 *  its ideal is 0; otherwise the ideal is the middle. */
function band(v: number, [lo, hi]: readonly [number, number], per: number) {
  if (v >= lo && v <= hi) {
    const k = lo === 0 ? v / hi : Math.abs(v - (lo + hi) / 2) / ((hi - lo) / 2);
    return Math.round(100 - 25 * k);
  }
  const off = v < lo ? lo - v : v - hi;
  return Math.max(0, Math.round(75 - off * per));
}

/* ── Fundamentals ────────────────────────────────────────────────────── */

export type FundKey = "setup" | "turn" | "sway" | "posture" | "sequence" | "tempo";

export const FUNDAMENTALS: { key: FundKey; label: string; measures: string }[] = [
  { key: "setup", label: "Setup", measures: "Forward bend at address, against the coach's range." },
  { key: "turn", label: "Turn", measures: "Chest and pelvis turn at the top, and the gap between them (X-factor)." },
  { key: "sway", label: "Sway control", measures: "How far the pelvis and head drift sideways during the swing." },
  { key: "posture", label: "Posture hold", measures: "Forward bend kept from address to impact, and hips staying off the ball." },
  { key: "sequence", label: "Sequence", measures: "Pelvis, chest, arms and club reach top speed in that order." },
  { key: "tempo", label: "Tempo", measures: "Backswing time divided by downswing time. Around 3 : 1 is typical." },
];

export function fundScores(s: Swing): Record<FundKey, number> {
  const seqGap = s.peaks[1] - s.peaks[0];
  return {
    setup: band(s.spineAddr, TARGET.spineAddr, 10),
    turn: Math.round((band(s.chestTurn, TARGET.chestTurn, 6) + band(s.pelvisTurn, TARGET.pelvisTurn, 6) + band(xFactor(s), TARGET.xFactor, 5)) / 3),
    sway: Math.round((band(s.pelvisSway, TARGET.pelvisSway, 14) + band(s.headMove, TARGET.headMove, 12)) / 2),
    posture: Math.round((band(spineLost(s), TARGET.spineLost, 15) + band(s.pelvisThrust, TARGET.pelvisThrust, 14)) / 2),
    sequence: inSequence(s) ? (seqGap >= 15 ? 95 : 72) : 40,
    tempo: band(tempo(s), TARGET.tempo, 120),
  };
}

/** Posture and turn decide most of the ball flight, so they count for more. */
const WEIGHT: Record<FundKey, number> = { setup: 0.5, turn: 1.2, sway: 1, posture: 1.5, sequence: 1, tempo: 0.8 };

export function swingScore(s: Swing) {
  const f = fundScores(s);
  const keys = Object.keys(WEIGHT) as FundKey[];
  return Math.round(keys.reduce((a, k) => a + f[k] * WEIGHT[k], 0) / keys.reduce((a, k) => a + WEIGHT[k], 0));
}

export const GRADE_BANDS: [string, number][] = [["A", 85], ["B", 75], ["C", 65], ["D", 50], ["F", 0]];
export const gradeOf = (score: number) => GRADE_BANDS.find(([, min]) => score >= min)![0];

export function fundamentalsFor(swings: Swing[]) {
  return FUNDAMENTALS.map((f) => {
    const scores = swings.map((s) => fundScores(s)[f.key]);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length));
    return { ...f, score: avg, met: scores.filter((v) => v >= 75).length, previous: PREVIOUS.fund[f.key] };
  });
}

/* ── Faults ──────────────────────────────────────────────────────────── */

export type FaultKey = "earlyExtension" | "overTheTop" | "sway" | "sequence" | "reversePivot";
export type Confidence = "High" | "Medium" | "Low";

export const FAULTS: Record<FaultKey, { label: string; what: string; drill: string; drillName: string }> = {
  earlyExtension: {
    label: "Early extension",
    what: "Hips move toward the ball and the chest stands up before impact.",
    drillName: "Chair drill",
    drill: "Set up with your backside touching a chair. Make slow half swings and keep the lead hip on the chair through impact. 3 × 10.",
  },
  overTheTop: {
    label: "Over-the-top",
    what: "The club comes down outside the line and cuts across the ball (out-to-in path).",
    drillName: "Headcover gate",
    drill: "Put a headcover just outside and behind the ball. Swing without touching it so the club approaches from inside. 3 × 10.",
  },
  sway: {
    label: "Sway off the ball",
    what: "The pelvis slides away from the target on the backswing instead of turning.",
    drillName: "Trail-hip wall",
    drill: "Stand with your trail hip against a wall or alignment stick. Turn to the top without pushing into it. 3 × 10 slow turns.",
  },
  sequence: {
    label: "Out of sequence",
    what: "The chest starts the downswing before the pelvis, so speed is lost.",
    drillName: "Step-through drill",
    drill: "From the top, step the lead foot toward the target and let the hips pull the chest and arms through. 3 × 8.",
  },
  reversePivot: {
    label: "Reverse pivot",
    what: "Weight stays on the trail foot at impact instead of moving to the lead side.",
    drillName: "Lead-foot finish",
    drill: "Hold the finish for 3 seconds with the trail foot on its toe and 90% of your weight on the lead foot. Every swing.",
  },
};

export type Finding = { key: FaultKey; confidence: Confidence; detail: string };

/** `ball` false: no launch monitor data for the swing, so path-based faults can't be read. */
export function findingsFor(s: Swing, ball = true): Finding[] {
  const out: Finding[] = [];
  const lost = spineLost(s);
  if (lost > 5 || s.pelvisThrust > 5)
    out.push({ key: "earlyExtension", confidence: lost > 6.5 ? "High" : "Medium", detail: `Lost ${lost}° of bend · hips ${s.pelvisThrust.toFixed(1)} cm toward ball` });
  if (ball && s.clubPath < -3) out.push({ key: "overTheTop", confidence: "High", detail: `Path ${s.clubPath.toFixed(1)}° out-to-in` });
  if (s.pelvisSway > 5) out.push({ key: "sway", confidence: s.pelvisSway > 6 ? "High" : "Medium", detail: `Pelvis ${s.pelvisSway.toFixed(1)} cm away from target` });
  if (!inSequence(s)) out.push({ key: "sequence", confidence: "Medium", detail: "Chest peaked before pelvis" });
  if (s.weightLead < 70) out.push({ key: "reversePivot", confidence: "Low", detail: `${s.weightLead}% on lead foot at impact` });
  return out;
}

/** Faults across the session, most common first, with the carry (from swings
 *  with ball data) and the swing score they cost. */
export function rankedFaults(swings: Swing[], hasBall: HasBall = ALL_BALL) {
  const keys = Object.keys(FAULTS) as FaultKey[];
  const cost = (hit: Swing[], clean: Swing[], v: (s: Swing) => number) =>
    hit.length && clean.length ? Math.round(mean(clean.map(v)) - mean(hit.map(v))) : 0;
  return keys
    .map((key) => {
      const hit = swings.filter((s) => findingsFor(s, hasBall(s)).some((f) => f.key === key));
      const clean = swings.filter((s) => !hit.includes(s));
      const costYd = cost(hit.filter(hasBall), clean.filter(hasBall), (s) => s.carry);
      const costPts = cost(hit, clean, swingScore);
      // The clearest example: the swing it hurt most.
      const example = [...hit].sort((a, b) => swingScore(a) - swingScore(b))[0];
      return { key, ...FAULTS[key], count: hit.length, costYd, costPts, example: example?.n };
    })
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count || b.costYd - a.costYd || b.costPts - a.costPts);
}

/* ── Session stats ───────────────────────────────────────────────────── */

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const sd = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};

/** 100 = every swing the same. Spread of the key positions, against each target's width.
 *  Club path counts only over swings with launch-monitor data, and drops out with fewer than two. */
export function consistencyOf(swings: Swing[], hasBall: HasBall = ALL_BALL) {
  if (swings.length < 2) return 0;
  const paths = swings.filter(hasBall).map((s) => s.clubPath);
  const parts: [number[], readonly [number, number]][] = [
    [swings.map((s) => s.chestTurn), TARGET.chestTurn],
    [swings.map((s) => s.pelvisTurn), TARGET.pelvisTurn],
    [swings.map(spineLost), TARGET.spineLost],
    ...(paths.length >= 2 ? [[paths, TARGET.clubPath] as [number[], readonly [number, number]]] : []),
    [swings.map(tempo), TARGET.tempo],
  ];
  const spread = mean(parts.map(([xs, [lo, hi]]) => sd(xs) / (hi - lo)));
  return Math.max(0, Math.round(100 - spread * 100));
}

/** Club speed and carry average only the swings with launch-monitor data (`ballSwings` of them). */
export function statsFor(swings: Swing[], hasBall: HasBall = ALL_BALL) {
  const ball = swings.filter(hasBall);
  return {
    swings: swings.length,
    ballSwings: ball.length,
    score: Math.round(mean(swings.map(swingScore))),
    consistency: consistencyOf(swings, hasBall),
    tempo: mean(swings.map(tempo)),
    clubSpeed: mean(ball.map((s) => s.clubSpeed)),
    carry: mean(ball.map((s) => s.carry)),
    spineLost: mean(swings.map(spineLost)),
    xFactor: mean(swings.map(xFactor)),
    sway: mean(swings.map((s) => s.pelvisSway)),
    best: [...swings].sort((a, b) => swingScore(b) - swingScore(a))[0].n,
    weakest: [...swings].sort((a, b) => swingScore(a) - swingScore(b))[0].n,
  };
}

export const STATS = statsFor(SWINGS);
export const BEST_SWING = STATS.best;
export const WEAKEST_SWING = STATS.weakest;

/** Last lesson's results, for the "vs last lesson" comparisons. */
export const PREVIOUS = {
  date: "25 Oct",
  score: 71,
  consistency: 63,
  tempo: 3.4,
  clubSpeed: 76.4,
  carry: 143,
  spineLost: 7.2,
  xFactor: 34,
  /** Average pelvis sway at the top, cm. */
  sway: 4.6,
  fund: { setup: 92, turn: 72, sway: 70, posture: 41, sequence: 82, tempo: 84 } as Record<FundKey, number>,
};

/** Every lesson so far, oldest first. The last row is this one. */
export const LESSONS = [
  { date: "13 Sep", score: 58, spineLost: 9.1, xFactor: 29, clubSpeed: 74.2, carry: 136, sway: 6.1 },
  { date: "27 Sep", score: 63, spineLost: 8.4, xFactor: 31, clubSpeed: 75.0, carry: 139, sway: 5.5 },
  { date: "11 Oct", score: 67, spineLost: 7.9, xFactor: 33, clubSpeed: 75.8, carry: 141, sway: 5.0 },
  { date: "25 Oct", score: PREVIOUS.score, spineLost: PREVIOUS.spineLost, xFactor: PREVIOUS.xFactor, clubSpeed: PREVIOUS.clubSpeed, carry: PREVIOUS.carry, sway: PREVIOUS.sway },
  { date: "8 Nov", score: STATS.score, spineLost: +STATS.spineLost.toFixed(1), xFactor: Math.round(STATS.xFactor), clubSpeed: +STATS.clubSpeed.toFixed(1), carry: Math.round(STATS.carry), sway: +STATS.sway.toFixed(1) },
];
export const GOAL_SCORE = 85;

/* ── Phases & signals ────────────────────────────────────────────────── */

export type Phase = "address" | "takeaway" | "top" | "impact" | "finish";
export const PHASES: { key: Phase; label: string }[] = [
  { key: "address", label: "Address" },
  { key: "takeaway", label: "Takeaway" },
  { key: "top", label: "Top" },
  { key: "impact", label: "Impact" },
  { key: "finish", label: "Finish" },
];

/** When each phase happens, seconds from impact. */
export function phaseTime(s: Swing, p: Phase) {
  const start = -(s.backswing + s.downswing);
  return { address: start, takeaway: start + 0.3, top: -s.downswing, impact: 0, finish: 0.3 }[p];
}

/** The signal charts share one window so swings line up: 1.5 s before impact to 0.35 s after. */
export const WINDOW: [number, number] = [-1.5, 0.35];

const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Rotation, spine bend and sway through the swing, every 10 ms. */
export function swingSeries(s: Swing) {
  const start = -(s.backswing + s.downswing);
  const top = -s.downswing;
  const rows: { t: number; pelvis: number; chest: number; spine: number; sway: number; thrust: number }[] = [];
  for (let i = 0; i <= 185; i++) {
    const t = +(WINDOW[0] + i * 0.01).toFixed(2);
    const back = smooth((t - start) / s.backswing);
    const down = smooth((t - top) / s.downswing);
    const after = smooth(t / 0.35);
    const pelvis = t < top ? lerp(0, s.pelvisTurn, back) : t < 0 ? lerp(s.pelvisTurn, -38, down) : lerp(-38, -70, after);
    const chest = t < top ? lerp(0, s.chestTurn, back) : t < 0 ? lerp(s.chestTurn, -22, down) : lerp(-22, -95, after);
    const spine = t < top ? lerp(s.spineAddr, s.spineAddr - 1, back) : t < 0 ? lerp(s.spineAddr - 1, s.spineImpact, down) : lerp(s.spineImpact, s.spineImpact - 6, after);
    const sway = t < top ? lerp(0, s.pelvisSway, back) : t < 0 ? lerp(s.pelvisSway, -7, down) : lerp(-7, -10, after);
    const thrust = t < top ? 0 : t < 0 ? lerp(0, s.pelvisThrust, down) : lerp(s.pelvisThrust, s.pelvisThrust + 3, after);
    rows.push({ t, pelvis: +pelvis.toFixed(1), chest: +chest.toFixed(1), spine: +spine.toFixed(1), sway: +sway.toFixed(1), thrust: +thrust.toFixed(1) });
  }
  return rows;
}

const PEAK_DEG_S = [520, 760, 1050, 2100];
/** Rotation speed of each body part in the downswing — the kinematic sequence. */
export function sequenceSeries(s: Swing) {
  const rows: { ms: number; pelvis: number; chest: number; arms: number; club: number }[] = [];
  for (let ms = -320; ms <= 80; ms += 5) {
    const g = (peak: number, amp: number, w: number) => Math.round(amp * Math.exp(-(((ms - peak) / w) ** 2)));
    rows.push({
      ms,
      pelvis: g(s.peaks[0], PEAK_DEG_S[0], 95),
      chest: g(s.peaks[1], PEAK_DEG_S[1], 80),
      arms: g(s.peaks[2], PEAK_DEG_S[2], 60),
      club: g(s.peaks[3], PEAK_DEG_S[3], 45),
    });
  }
  return rows;
}

export const fmtClock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
