/* One indoor-range session as the Firer AAR analyser leaves it once shooting
   has finished: the clip it ran on, the shots it detected, and what it
   measured around each one. Mock data — every total on the page (points,
   misses, group size, the recommendation counts) is derived from SHOTS, so a
   session can hold any number of shots, not just the first six.

   Target coordinates are millimetres from the point of aim, +x right, +y up.
   The face scores 10 inside 4 mm, one point less per 4 mm ring down to 6;
   outside 20 mm is a miss. */

export const RING_MM = 4;
export const MISS_MM = 20;
export const MAX_POINTS = 10;
export const FLINCH_LIMIT_MM = 5;
export const WOBBLE_LIMIT_MM = 1;
export const SETTLE_LIMIT_MM = 3;

export const SESSION = {
  clip: "range_lane10_side.mp4",
  lane: "Lane 10",
  clipLength: 137.0, // s
  position: 124.7, // s — where the clip was when analysis finished
  loop: 3,
  running: "3:16.1",
  trackingFps: 22.3,
  backgroundFeatures: 172,
  lagSec: 0.24,
  droppedFrames: 6949,
  analysisMode: "Snapshot",
  sources: "Side PTZ cam · External detector",
  breathingRate: 14.3, // breaths per minute
  breathingAmplitude: 1.19,
  /** 95% sway ellipse over every aim of the session. */
  swayEllipseMm: 60.4,
  dominantSway: "Diagonal",
};

export type BreathPhase = "pause" | "inhale" | "exhale";

export const CUES = [
  { key: "flash", label: "Muzzle flash", fault: false },
  { key: "recoil", label: "Muzzle recoil", fault: false },
  { key: "shoulder", label: "Shoulder movement", fault: true },
  { key: "bolt", label: "Bolt carrier", fault: false },
  { key: "ejection", label: "Cartridge ejection", fault: false },
  { key: "posture", label: "Firer posture", fault: true },
] as const;

export type CueKey = (typeof CUES)[number]["key"];

/** One wobble-bubble window around the shot. */
export interface SwayWindow {
  /** Offset from the shot, s. */
  t: number;
  /** Before the shot: sway RMS and the 95% ellipse long axis, mm. */
  rms?: number;
  ringMm?: number;
  /** At or after the shot: how far off aim the muzzle ends, mm. */
  offAimMm?: number;
}

export interface Shot {
  n: number;
  /** Seconds into the clip. */
  at: number;
  x: number;
  y: number;
  breath: BreathPhase;
  /** Wobble RMS in the final 1 s before the shot, mm. */
  wobbleMm: number;
  /** Wobble RMS in the 1 s after the shot (recoil included), mm. */
  afterRmsMm: number;
  /** Stability score, 0–5. */
  stability: number;
  /** Max vertical deviation from baseline as the shot broke, mm. null = not measured. */
  flinchMm: number | null;
  /** Muzzle off aim 1.5 s after the shot, mm. */
  settleMm: number;
  muzzlePeakMm: number;
  shoulderPeakMm: number;
  sway: SwayWindow[];
  cues: Record<CueKey, boolean>;
  /** Hold stability from the camera, 0–100, T−3 s to the shot (target 80+). */
  hold: number;
  /** Prone position read from the pose keypoints as the shot broke. */
  posture: Posture;
}

export interface Posture {
  /** Body angle off the line of fire, degrees. */
  bodyOffDeg: number;
  /** Angle the legs are open, degrees (35° is the drill). */
  legsOpenDeg: number;
  /** Both elbows planted under the rifle. */
  elbowsSet: boolean;
}

function sway(rms: [number, number, number], ring: [number, number, number], off: [number, number, number, number]): SwayWindow[] {
  return [
    { t: -1.5, rms: rms[0], ringMm: ring[0] },
    { t: -1, rms: rms[1], ringMm: ring[1] },
    { t: -0.5, rms: rms[2], ringMm: ring[2] },
    { t: 0, offAimMm: off[0] },
    { t: 0.5, offAimMm: off[1] },
    { t: 1, offAimMm: off[2] },
    { t: 1.5, offAimMm: off[3] },
  ];
}

const allCues = (over: Partial<Record<CueKey, boolean>> = {}): Record<CueKey, boolean> => ({
  flash: true, recoil: true, shoulder: false, bolt: true, ejection: true, posture: false, ...over,
});

export const SHOTS: Shot[] = [
  {
    n: 1, at: 8.4, x: 1.1, y: -1.9, breath: "pause", wobbleMm: 1.3, afterRmsMm: 8.9, stability: 3, flinchMm: null,
    settleMm: 2.1, muzzlePeakMm: 18, shoulderPeakMm: 46,
    sway: sway([1.2, 1.1, 1.3], [5.8, 5.1, 6.0], [0.6, 1.4, 1.9, 2.1]), cues: allCues(),
    hold: 74, posture: { bodyOffDeg: 3, legsOpenDeg: 34, elbowsSet: true },
  },
  {
    n: 2, at: 19.7, x: -2.1, y: 2.9, breath: "exhale", wobbleMm: 1.2, afterRmsMm: 9.6, stability: 3, flinchMm: 2.4,
    settleMm: 4.2, muzzlePeakMm: 19, shoulderPeakMm: 47,
    sway: sway([1.3, 1.2, 1.2], [6.1, 5.6, 5.5], [2.4, 2.9, 3.6, 4.2]), cues: allCues(),
    hold: 76, posture: { bodyOffDeg: 4, legsOpenDeg: 36, elbowsSet: true },
  },
  {
    n: 3, at: 31.2, x: 4.7, y: 1.9, breath: "pause", wobbleMm: 1.6, afterRmsMm: 10.4, stability: 2, flinchMm: 6.8,
    settleMm: 5.0, muzzlePeakMm: 20, shoulderPeakMm: 51,
    sway: sway([1.5, 1.4, 1.6], [6.9, 6.6, 7.4], [6.8, 3.1, 4.4, 5.0]), cues: allCues({ shoulder: true }),
    hold: 61, posture: { bodyOffDeg: 5, legsOpenDeg: 33, elbowsSet: true },
  },
  {
    n: 4, at: 42.9, x: 0.4, y: 3.8, breath: "inhale", wobbleMm: 1.1, afterRmsMm: 9.2, stability: 3, flinchMm: 3.1,
    settleMm: 3.6, muzzlePeakMm: 19, shoulderPeakMm: 48,
    sway: sway([1.1, 1.0, 1.1], [5.2, 4.9, 5.3], [3.1, 2.6, 3.2, 3.6]), cues: allCues({ ejection: false }),
    hold: 79, posture: { bodyOffDeg: 3, legsOpenDeg: 35, elbowsSet: true },
  },
  {
    n: 5, at: 53.5, x: 0.1, y: 0.3, breath: "pause", wobbleMm: 0.8, afterRmsMm: 8.4, stability: 4, flinchMm: 1.9,
    settleMm: 1.8, muzzlePeakMm: 18, shoulderPeakMm: 47,
    sway: sway([0.9, 0.8, 0.8], [4.4, 3.9, 3.8], [1.9, 1.2, 1.5, 1.8]), cues: allCues(),
    hold: 92, posture: { bodyOffDeg: 2, legsOpenDeg: 35, elbowsSet: true },
  },
  {
    n: 6, at: 65.0, x: -20.7, y: 6.8, breath: "exhale", wobbleMm: 2.4, afterRmsMm: 11.72, stability: 2, flinchMm: 10.9,
    settleMm: 6.9, muzzlePeakMm: 19, shoulderPeakMm: 49,
    sway: sway([1.4, 1.0, 1.3], [7.0, 4.8, 6.3], [10.9, 2.8, 3.6, 6.9]), cues: allCues({ shoulder: true, posture: true }),
    hold: 52, posture: { bodyOffDeg: 9, legsOpenDeg: 28, elbowsSet: false },
  },
  {
    n: 7, at: 76.1, x: -3.4, y: -1.2, breath: "pause", wobbleMm: 1.5, afterRmsMm: 9.8, stability: 3, flinchMm: 3.7,
    settleMm: 3.4, muzzlePeakMm: 19, shoulderPeakMm: 48,
    sway: sway([1.5, 1.3, 1.5], [6.4, 5.9, 6.2], [3.7, 2.7, 3.0, 3.4]), cues: allCues({ posture: true }),
    hold: 68, posture: { bodyOffDeg: 6, legsOpenDeg: 31, elbowsSet: true },
  },
  {
    n: 8, at: 85.8, x: 2.6, y: 3.3, breath: "exhale", wobbleMm: 1.1, afterRmsMm: 9.1, stability: 3, flinchMm: 2.2,
    settleMm: 2.7, muzzlePeakMm: 18, shoulderPeakMm: 46,
    sway: sway([1.2, 1.0, 1.1], [5.5, 5.0, 5.2], [2.2, 1.9, 2.4, 2.7]), cues: allCues(),
    hold: 81, posture: { bodyOffDeg: 3, legsOpenDeg: 35, elbowsSet: true },
  },
  {
    n: 9, at: 96.4, x: 6.9, y: -5.1, breath: "inhale", wobbleMm: 2.1, afterRmsMm: 11.0, stability: 2, flinchMm: 7.6,
    settleMm: 5.8, muzzlePeakMm: 21, shoulderPeakMm: 52,
    sway: sway([2.0, 1.8, 2.1], [8.1, 7.4, 7.9], [7.6, 3.4, 4.7, 5.8]), cues: allCues({ shoulder: true, bolt: false }),
    hold: 57, posture: { bodyOffDeg: 7, legsOpenDeg: 30, elbowsSet: false },
  },
  {
    n: 10, at: 107.2, x: -0.8, y: 1.4, breath: "pause", wobbleMm: 0.9, afterRmsMm: 8.6, stability: 4, flinchMm: 1.6,
    settleMm: 2.0, muzzlePeakMm: 18, shoulderPeakMm: 45,
    sway: sway([0.9, 0.8, 0.9], [4.6, 4.1, 4.3], [1.6, 1.3, 1.7, 2.0]), cues: allCues(),
    hold: 88, posture: { bodyOffDeg: 2, legsOpenDeg: 36, elbowsSet: true },
  },
  {
    n: 11, at: 117.9, x: 1.9, y: 0.6, breath: "pause", wobbleMm: 1.0, afterRmsMm: 8.8, stability: 4, flinchMm: null,
    settleMm: 2.3, muzzlePeakMm: 18, shoulderPeakMm: 46,
    sway: sway([1.0, 0.9, 1.0], [4.9, 4.4, 4.7], [0.8, 1.5, 2.0, 2.3]), cues: allCues({ ejection: false }),
    hold: 85, posture: { bodyOffDeg: 2, legsOpenDeg: 35, elbowsSet: true },
  },
  {
    n: 12, at: 128.6, x: 0.6, y: -2.2, breath: "exhale", wobbleMm: 1.2, afterRmsMm: 9.3, stability: 3, flinchMm: 2.8,
    settleMm: 2.9, muzzlePeakMm: 19, shoulderPeakMm: 47,
    sway: sway([1.2, 1.1, 1.2], [5.6, 5.1, 5.4], [2.8, 2.1, 2.5, 2.9]), cues: allCues(),
    hold: 83, posture: { bodyOffDeg: 3, legsOpenDeg: 35, elbowsSet: true },
  },
];

/** Clip time as m:ss.s */
export function fmtClip(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
}

/* ── Derived ──────────────────────────────────────────────────────────── */

export const radius = (s: Pick<Shot, "x" | "y">) => Math.hypot(s.x, s.y);
export const isHit = (s: Shot) => radius(s) <= MISS_MM;
export const points = (s: Shot) => (isHit(s) ? MAX_POINTS - Math.floor(radius(s) / RING_MM) : 0);
export const firedInPause = (s: Shot) => s.breath === "pause";
export const flinched = (s: Shot) => s.flinchMm !== null && s.flinchMm > FLINCH_LIMIT_MM;
export const wobbled = (s: Shot) => s.wobbleMm > WOBBLE_LIMIT_MM;
export const settled = (s: Shot) => s.settleMm <= SETTLE_LIMIT_MM;

/** Results for any set of shots — the whole session, or the shots fired so far in live view. */
export function statsFor(shots: Shot[]) {
  const n = shots.length;
  const mpi = n
    ? { x: shots.reduce((t, s) => t + s.x, 0) / n, y: shots.reduce((t, s) => t + s.y, 0) / n }
    : { x: 0, y: 0 };
  const fromMpi = shots.map((s) => Math.hypot(s.x - mpi.x, s.y - mpi.y)).sort((a, b) => a - b);
  let spread = 0;
  for (const a of shots) for (const b of shots) spread = Math.max(spread, Math.hypot(a.x - b.x, a.y - b.y));
  const mid = fromMpi.length / 2;
  return {
    shots: n,
    hits: shots.filter(isHit).length,
    misses: shots.filter((s) => !isHit(s)).length,
    points: shots.reduce((t, s) => t + points(s), 0),
    maxPoints: n * MAX_POINTS,
    mpi,
    meanRadius: n ? fromMpi.reduce((t, d) => t + d, 0) / n : 0,
    /** Radius from the group centre holding half the shots. */
    cep50: n ? (n % 2 ? fromMpi[Math.floor(mid)] : (fromMpi[mid - 1] + fromMpi[mid]) / 2) : 0,
    groupMm: spread,
  };
}

export const STATS = statsFor(SHOTS);

/* ── Who fired, and how it compares ───────────────────────────────────── */

export const FIRER = { name: "Pte. Arjun Nair", initials: "AN", unit: "Alpha Coy · Recruit", id: "T-0421" };
export const SESSION_INFO = { date: "18 Oct 2026 · 09:40", weapon: "SAR 21 · 5.56 mm", distance: "25 m", instructor: "Range Instructor" };

/** The firer's previous session on this lane, for the trend. */
export const PREVIOUS = { date: "11 Oct", points: 44, misses: 2, meanRadius: 8.4, cep50: 6.1, groupMm: 31.4 };

/** Sight adjustment per click at this distance, mm. */
export const CLICK_MM = 1.5;

/** Clicks to move the group centre onto the aim point (+ right / + up). */
export function sightAdvice(mpi = STATS.mpi) {
  const right = Math.round(-mpi.x / CLICK_MM);
  const up = Math.round(-mpi.y / CLICK_MM);
  const part = (n: number, pos: string, neg: string) => (n === 0 ? null : `${Math.abs(n)} click${Math.abs(n) === 1 ? "" : "s"} ${n > 0 ? pos : neg}`);
  const parts = [part(right, "right", "left"), part(up, "up", "down")].filter(Boolean);
  return { right, up, text: parts.length ? `Adjust ${parts.join(", ")}` : "No sight adjustment needed" };
}

/* ── Key recommendations (session) ────────────────────────────────────── */

export type RecKey = "breath" | "trigger" | "settle" | "hold";

const measuredFlinch = SHOTS.filter((s) => s.flinchMm !== null);

export const RECOMMENDATIONS: {
  key: RecKey;
  title: string;
  evidence: string;
  /** Shots this recommendation is about. */
  shots: number[];
  /** The panel that shows it. */
  panel: string;
}[] = [
  {
    key: "breath",
    title: "Allow breathing to settle; fire in the natural pause.",
    evidence: `${SHOTS.filter((s) => !firedInPause(s)).length}/${SHOTS.length} shots outside the pause`,
    shots: SHOTS.filter((s) => !firedInPause(s)).map((s) => s.n),
    panel: "Breathing",
  },
  {
    key: "trigger",
    title: "Smooth the trigger squeeze.",
    evidence: `Flinch on ${SHOTS.filter(flinched).length}/${measuredFlinch.length} shots`,
    shots: SHOTS.filter(flinched).map((s) => s.n),
    panel: "Flinch Indicator",
  },
  {
    key: "settle",
    title: "Let the rifle settle before firing.",
    evidence: `Wobble above ${WOBBLE_LIMIT_MM} mm on ${SHOTS.filter(wobbled).length}/${SHOTS.length} shots`,
    shots: SHOTS.filter(wobbled).map((s) => s.n),
    panel: "Stability / Wobble",
  },
  {
    key: "hold",
    title: "Hold position after the shot.",
    evidence: `${SHOTS.filter((s) => !settled(s)).length}/${SHOTS.length} shots did not settle`,
    shots: SHOTS.filter((s) => !settled(s)).map((s) => s.n),
    panel: "Wobble Bubble",
  },
];

export const WORKING_WELL = ["Consistent recoil seen at the muzzle."];

/** One practice drill per recommendation, and the short phrase the verdict uses. */
export const REC_DETAIL: Record<RecKey, { drill: string; short: string }> = {
  breath: { drill: "Take three slow breaths, then fire in the 2–3 s pause after you breathe out.", short: "firing mid-breath" },
  trigger: { drill: "Dry-fire 20 reps with a coin on the barrel. Squeeze until the shot surprises you; the coin should stay on.", short: "flinching on the trigger" },
  settle: { drill: "Hold the sight picture still for 3 s before taking up the trigger.", short: "not letting the rifle settle" },
  hold: { drill: "Follow through: keep the sight picture and the trigger pressed for 2 s after the shot.", short: "not holding after the shot" },
};

const avgPoints = (list: Shot[]) => (list.length ? list.reduce((t, s) => t + points(s), 0) / list.length : MAX_POINTS);

/** What a fault cost: average points on the shots that had it against the shots that didn't. */
export function recImpact(r: { shots: number[] }) {
  const withFault = SHOTS.filter((s) => r.shots.includes(s.n));
  const without = SHOTS.filter((s) => !r.shots.includes(s.n));
  const withAvg = avgPoints(withFault);
  const withoutAvg = avgPoints(without);
  return { withAvg, withoutAvg, cost: Math.max(0, withoutAvg - withAvg) };
}

/** Recommendations, biggest cost per shot first. */
export const RANKED_RECS = RECOMMENDATIONS.filter((r) => r.shots.length > 0)
  .map((r) => ({ ...r, ...recImpact(r), ...REC_DETAIL[r.key] }))
  .sort((a, b) => b.cost - a.cost);

/* ── Signals around a shot (deterministic, for the charts) ────────────── */

/* Small seeded noise so every render draws the same lines. */
function noise(seed: number) {
  let x = Math.sin(seed * 9301 + 49297) * 233280;
  return () => {
    x = Math.sin(x) * 10000;
    return x - Math.floor(x);
  };
}

/** Recoil & muzzle movement, −10 s → +1 s, each line relative to its own peak. */
export function recoilSeries(s: Shot) {
  const r = noise(s.n);
  return Array.from({ length: 111 }, (_, i) => {
    const t = -10 + i * 0.1;
    const kick = t >= 0 ? Math.exp(-t * 6) : 0;
    const muzzle = 0.06 + r() * 0.06 + (t > -0.05 && t < 0.6 ? 0.92 * kick : 0);
    const shoulder = 0.3 + 0.12 * Math.sin(t * 1.4 + s.n) + r() * 0.1 + (t >= 0 ? 0.6 * Math.exp(-t * 3) : 0);
    return { t: Number(t.toFixed(1)), muzzle: Math.min(1, muzzle), shoulder: Math.min(1, shoulder) };
  });
}

/** Chest displacement, −12 s → 0 s, with the breathing phase at each sample. */
export function breathingSeries(s: Shot) {
  const period = 60 / SESSION.breathingRate; // ≈ 4.2 s
  return Array.from({ length: 121 }, (_, i) => {
    const t = -12 + i * 0.1;
    /* Shift so the shot lands in the phase recorded for it. */
    const shift = s.breath === "pause" ? 0.62 : s.breath === "exhale" ? 0.35 : 0.1;
    const p = (((t / period + shift) % 1) + 1) % 1;
    let v: number;
    let phase: BreathPhase;
    if (p < 0.4) { v = Math.sin((p / 0.4) * (Math.PI / 2)); phase = "inhale"; }
    else if (p < 0.55) { v = 1 - ((p - 0.4) / 0.15) * 0.15; phase = "exhale"; }
    else if (p < 0.8) { v = 0.85 - ((p - 0.55) / 0.25) * 0.85; phase = "exhale"; }
    else { v = 0; phase = "pause"; }
    return { t: Number(t.toFixed(1)), chest: Number((v * SESSION.breathingAmplitude).toFixed(3)), phase };
  });
}

/** Wobble RMS, −8 s → +1 s. Settles toward the shot, spikes with recoil. */
export function wobbleSeries(s: Shot) {
  const r = noise(s.n + 20);
  return Array.from({ length: 91 }, (_, i) => {
    const t = -8 + i * 0.1;
    const settle = t < -2 ? 1.6 : 1.6 - ((t + 2) / 2) * (1.6 - s.wobbleMm / 2.4);
    const base = (t < 0 ? settle : 0) * 2.4 + r() * 0.5;
    const recoil = t >= 0 ? s.afterRmsMm * Math.min(1, t * 6) : 0;
    return { t: Number(t.toFixed(1)), rms: Number(Math.max(base, recoil).toFixed(2)) };
  });
}

/** Vertical deviation from baseline, −500 ms → +100 ms. */
export function flinchSeries(s: Shot) {
  const r = noise(s.n + 40);
  const peak = s.flinchMm ?? 0;
  return Array.from({ length: 61 }, (_, i) => {
    const ms = -500 + i * 10;
    const wave = ms > -120 ? peak * Math.exp(-(((ms + 20) / 45) ** 2)) : 0;
    return { ms, dev: Number((wave + (r() - 0.5) * 1.2).toFixed(2)) };
  });
}

/** Sway path for one wobble-bubble window, around the aim (mm). */
export function swayPath(s: Shot, w: SwayWindow) {
  const r = noise(s.n * 10 + w.t * 4 + 7);
  if (w.rms !== undefined) {
    const a = (w.ringMm ?? 5) / 2;
    const b = a * 0.42;
    return Array.from({ length: 40 }, (_, i) => {
      const th = (i / 40) * Math.PI * 2 * 1.6;
      const k = 0.55 + r() * 0.45;
      const x = Math.cos(th) * a * k;
      const y = Math.sin(th) * b * k;
      return { x: x * 0.8 - y * 0.6, y: x * 0.6 + y * 0.8 }; // diagonal sway
    });
  }
  /* After the break: the muzzle travels out to its off-aim point. */
  const end = w.offAimMm ?? 0;
  const dir = w.t === 0 ? Math.PI / 2 : Math.PI / 2 + 0.5 + w.t * 0.4;
  return Array.from({ length: 16 }, (_, i) => {
    const k = i / 15;
    return { x: Math.cos(dir) * end * k + (r() - 0.5) * 0.6, y: Math.sin(dir) * end * k + (r() - 0.5) * 0.6 };
  });
}

/* ── Fundamentals grades (Marksmanship AAR report v1.1) ───────────────── */

/* Four fundamentals, each scored 0–100 per shot and graded A–F on the average.
   "Met" counts the shots that passed that fundamental outright. */
export type FactorKey = "stance" | "breath" | "wobble" | "flinch";

export const GRADE_BANDS: [string, number][] = [["A", 90], ["B", 80], ["C", 70], ["D", 60], ["E", 50], ["F", 0]];
export const gradeOf = (score: number) => GRADE_BANDS.find(([, min]) => score >= min)![0];

export const stanceScore = (s: Shot) =>
  Math.max(0, Math.round(100 - 3 * s.posture.bodyOffDeg - (s.posture.elbowsSet ? 0 : 25) - Math.abs(s.posture.legsOpenDeg - 35)));
const breathScore = (s: Shot) => (s.breath === "pause" ? 92 : s.breath === "exhale" ? 50 : 45);
const flinchScore = (s: Shot) => (s.flinchMm === null ? null : Math.max(0, Math.round(100 - s.flinchMm * 6)));

const FACTOR_DEFS: { key: FactorKey; label: string; measure: string; score: (s: Shot) => number | null; met: (s: Shot) => boolean }[] = [
  { key: "stance", label: "Stance", measure: "Body angle to the line of fire, legs open, elbows set", score: stanceScore, met: (s) => stanceScore(s) >= 80 },
  { key: "breath", label: "Breath control", measure: "Shot fired in the natural respiratory pause", score: breathScore, met: firedInPause },
  { key: "wobble", label: "Weapon wobble", measure: "Hold stability T−3 s to the shot (target 80+)", score: (s) => s.hold, met: (s) => s.hold >= 80 },
  { key: "flinch", label: "Weapon flinch", measure: `Muzzle jump as the shot breaks (over ${FLINCH_LIMIT_MM} mm)`, score: flinchScore, met: (s) => s.flinchMm !== null && !flinched(s) },
];

/** The firer's fundamentals last session, for the comparison. */
export const PREVIOUS_FACTORS: Record<FactorKey, number> = { stance: 76, breath: 74, wobble: 65, flinch: 58 };

export function factorsFor(shots: Shot[]) {
  return FACTOR_DEFS.map((f) => {
    const scored = shots.map(f.score).filter((v): v is number => v !== null);
    const score = scored.length ? Math.round(scored.reduce((t, v) => t + v, 0) / scored.length) : 0;
    return { key: f.key, label: f.label, measure: f.measure, score, met: shots.filter(f.met).length, of: scored.length, prev: PREVIOUS_FACTORS[f.key] };
  });
}

export function overallFor(shots: Shot[]) {
  const f = factorsFor(shots);
  return Math.round(f.reduce((t, x) => t + x.score, 0) / f.length);
}

export const PREVIOUS_OVERALL = Math.round(Object.values(PREVIOUS_FACTORS).reduce((t, v) => t + v, 0) / 4);

/** Overall score, last five sessions (the last is this one). */
export const TREND: { date: string; score: number }[] = [
  { date: "13 Sep", score: 58 }, { date: "20 Sep", score: 62 }, { date: "27 Sep", score: 63 },
  { date: PREVIOUS.date, score: PREVIOUS_OVERALL }, { date: "18 Oct", score: overallFor(SHOTS) },
];

/** Standing in the platoon for the same practice. */
export const PEERS = { group: "1st Platoon", rank: 11, of: 30, betterThanPct: 63, average: 67 };

export const BADGES = [
  { title: "Most improved", detail: "Weapon flinch +12 since 11 Oct" },
  { title: "Tight group", detail: "Under 30 mm at 25 m" },
  { title: "4 sessions rising", detail: "Overall score up every session since Sep" },
  { title: "Steady stance", detail: "Stance graded B, the firer's best fundamental" },
];

/** Muzzle movement, T−3 s → T+2 s, left–right and up–down off aim (mm). */
export function muzzleSeries(s: Shot) {
  const r = noise(s.n + 60);
  const amp = ((100 - s.hold) / 100) * 5 + 0.4;
  const dip = flinched(s) ? (s.flinchMm ?? 0) * 0.55 : (s.flinchMm ?? 0) * 0.15;
  return Array.from({ length: 101 }, (_, i) => {
    const t = Number((-3 + i * 0.05).toFixed(2));
    let lr: number;
    let ud: number;
    if (t < 0) {
      const a = amp * (t < -1 ? 1 : 0.55 + 0.45 * -t);
      lr = a * Math.sin(t * 6 + s.n) + (r() - 0.5) * 0.4;
      ud = a * 0.8 * Math.cos(t * 5 + s.n) + (r() - 0.5) * 0.4;
      if (t > -0.15) ud -= dip * ((t + 0.15) / 0.15);
    } else {
      const k = Math.exp(-t * (flinched(s) ? 1.6 : 4));
      lr = (s.settleMm * 0.7) * (1 - Math.exp(-t * 1.5)) + 1.2 * k * Math.sin(t * 9) + (r() - 0.5) * 0.3;
      ud = -dip * k + 5 * Math.exp(-t * 5) * Math.cos(t * 12) + (r() - 0.5) * 0.3;
    }
    return { t, lr: Number(lr.toFixed(2)), ud: Number(ud.toFixed(2)) };
  });
}

/* ── More from the report: session details, shot notes, drills, standing ── */

/** The report's header block. */
export const SESSION_META = {
  unit: "Alpha Coy · 1st Platoon",
  weaponPosition: "SAR 21 · Prone supported",
  range: "Indoor range · Lane 10 · 25 m",
  detail: "18 Oct 2026 · Det 2",
};

/** Fundamentals met by each shot last session, for "factors met, all shots". */
export const PREVIOUS_MET: Record<FactorKey, number> = { stance: 4, breath: 4, wobble: 1, flinch: 2 };

export function factorsMetTotal(shots: Shot[]) {
  const f = factorsFor(shots);
  return { met: f.reduce((t, x) => t + x.met, 0), of: f.reduce((t, x) => t + x.of, 0) };
}
export const PREVIOUS_MET_TOTAL = Object.values(PREVIOUS_MET).reduce((t, v) => t + v, 0);

/** Best and weakest shot of the session, as the report picks them. */
const ranked = [...SHOTS].sort((a, b) => points(b) - points(a) || radius(a) - radius(b));
export const BEST_SHOT = ranked[0].n;
export const WEAKEST_SHOT = ranked[ranked.length - 1].n;

/** What went well and what went wrong on one shot, in the report's words. */
export function shotNotes(s: Shot) {
  const p = s.posture;
  const well: string[] = [];
  const wrong: string[] = [];
  const legsOk = Math.abs(p.legsOpenDeg - 35) <= 5;
  if (stanceScore(s) >= 80) {
    well.push(`Body in line with the rifle, ${p.bodyOffDeg}° off the line of fire. Legs open about ${p.legsOpenDeg}° and both elbows set, with no shift during the shot.`);
  } else {
    wrong.push(`Body ${p.bodyOffDeg}° off the line of fire${legsOk ? "" : `, legs open only ${p.legsOpenDeg}°`}${p.elbowsSet ? "" : ", and an elbow lifted off the ground"}.`);
  }
  if (s.hold >= 80) well.push(`Hold stability scored ${s.hold}/100 from T−3 s to the shot; the muzzle stayed in the steady band through the last second.`);
  else wrong.push(`Hold stability scored ${s.hold}/100 from T−3 s to the shot, against a target of 80. The shot was fired while the muzzle was still moving.`);
  if (firedInPause(s)) well.push("Shot broke in the natural respiratory pause after breathing out.");
  else wrong.push(`Shot fired on the ${s.breath}, not in the natural pause.`);
  if (s.flinchMm !== null) {
    if (flinched(s)) wrong.push(`Flinch detected: the muzzle jumped ${s.flinchMm.toFixed(1)} mm as the shot broke.`);
    else well.push("No flinch. No sudden muzzle movement as the shot broke.");
  }
  if (settled(s)) well.push("Muzzle settled back on the aim within 2 s.");
  else wrong.push(`Muzzle ended ${s.settleMm.toFixed(1)} mm off the aim 2 s after the shot.`);
  return { well, wrong };
}

/** Home coaching drills from the report: no rifle needed, 15 minutes a day. */
export const HOME_DRILLS: { key: "breath" | "wobble" | "flinch"; label: string; text: string }[] = [
  { key: "breath", label: "Breath", text: "Lie on your front with a book under your chest. Breathe normally, then hold for 3–5 s at the natural pause after breathing out, when the book is still. 10 reps." },
  { key: "wobble", label: "Wobble", text: "Lie on your elbows and aim a laser pointer or torch at a coin-sized dot on a wall 3 m away. Keep the light inside the dot for 10 s. 10 reps, then a 3 × 45 s elbow plank." },
  { key: "flinch", label: "Flinch", text: "Hold the laser on the dot and slowly squeeze a clothes peg with your index finger until it closes. The light must not jump. Then have a partner clap without warning while you keep the light steady. 20 reps." },
];

/** Platoon scores this session, for the histogram (the firer's band is marked). */
export const PLATOON_BINS: { band: string; count: number; you?: boolean }[] = [
  { band: "<50", count: 2 }, { band: "50s", count: 5 }, { band: "60s", count: 9 },
  { band: "70s", count: 10, you: true }, { band: "80s", count: 3 }, { band: "90s", count: 1 },
];

/** Same practice, SAR 21, 25 m: where the firer placed in each group. */
export const COMPARISONS = [
  { group: "1st Platoon", place: "11 / 30", betterThan: 63, average: 67 },
  { group: "Alpha Coy", place: "34 / 92", betterThan: 63, average: 66 },
  { group: "Batch 3/26", place: "118 / 310", betterThan: 62, average: 65 },
];

/** Average score by unit; the firer's score is drawn across them. */
export const UNIT_AVERAGES = [
  { unit: "1st Pl", avg: 67 }, { unit: "2nd Pl", avg: 64 }, { unit: "3rd Pl", avg: 68 },
  { unit: "Alpha", avg: 66 }, { unit: "Bravo", avg: 63 }, { unit: "Charlie", avg: 67 }, { unit: "Batch", avg: 65 },
];

/** The report's footnote: where each measure comes from. */
export const METHOD_NOTE =
  "Hold stability and flinch come from the range cameras, from 3 s before to 2 s after each shot. Hits, group size and distance from aim come from the targetry system. The aim point at the break is estimated from muzzle direction and the impact; it is not seen through the sight. Breathing is read by camera.";
