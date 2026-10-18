/* One indoor-range session as the Firer AAR analyser leaves it once shooting
   has finished: the clip it ran on, the six shots it detected, and what it
   measured around each one. Mock data — every total on the page (points,
   misses, group size, the recommendation counts) is derived from SHOTS.

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
  clipLength: 69.5, // s
  position: 57.2, // s — where the clip was when analysis finished
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
  },
  {
    n: 2, at: 19.7, x: -2.1, y: 2.9, breath: "exhale", wobbleMm: 1.2, afterRmsMm: 9.6, stability: 3, flinchMm: 2.4,
    settleMm: 4.2, muzzlePeakMm: 19, shoulderPeakMm: 47,
    sway: sway([1.3, 1.2, 1.2], [6.1, 5.6, 5.5], [2.4, 2.9, 3.6, 4.2]), cues: allCues(),
  },
  {
    n: 3, at: 31.2, x: 4.7, y: 1.9, breath: "pause", wobbleMm: 1.6, afterRmsMm: 10.4, stability: 2, flinchMm: 6.8,
    settleMm: 5.0, muzzlePeakMm: 20, shoulderPeakMm: 51,
    sway: sway([1.5, 1.4, 1.6], [6.9, 6.6, 7.4], [6.8, 3.1, 4.4, 5.0]), cues: allCues({ shoulder: true }),
  },
  {
    n: 4, at: 42.9, x: 0.4, y: 3.8, breath: "inhale", wobbleMm: 1.1, afterRmsMm: 9.2, stability: 3, flinchMm: 3.1,
    settleMm: 3.6, muzzlePeakMm: 19, shoulderPeakMm: 48,
    sway: sway([1.1, 1.0, 1.1], [5.2, 4.9, 5.3], [3.1, 2.6, 3.2, 3.6]), cues: allCues({ ejection: false }),
  },
  {
    n: 5, at: 53.5, x: 0.1, y: 0.3, breath: "pause", wobbleMm: 0.8, afterRmsMm: 8.4, stability: 4, flinchMm: 1.9,
    settleMm: 1.8, muzzlePeakMm: 18, shoulderPeakMm: 47,
    sway: sway([0.9, 0.8, 0.8], [4.4, 3.9, 3.8], [1.9, 1.2, 1.5, 1.8]), cues: allCues(),
  },
  {
    n: 6, at: 65.0, x: -20.7, y: 6.8, breath: "exhale", wobbleMm: 2.4, afterRmsMm: 11.72, stability: 2, flinchMm: 10.9,
    settleMm: 6.9, muzzlePeakMm: 19, shoulderPeakMm: 49,
    sway: sway([1.4, 1.0, 1.3], [7.0, 4.8, 6.3], [10.9, 2.8, 3.6, 6.9]), cues: allCues({ shoulder: true, posture: true }),
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

const mpi = {
  x: SHOTS.reduce((t, s) => t + s.x, 0) / SHOTS.length,
  y: SHOTS.reduce((t, s) => t + s.y, 0) / SHOTS.length,
};
const fromMpi = SHOTS.map((s) => Math.hypot(s.x - mpi.x, s.y - mpi.y)).sort((a, b) => a - b);

function extremeSpread() {
  let max = 0;
  for (const a of SHOTS) for (const b of SHOTS) max = Math.max(max, Math.hypot(a.x - b.x, a.y - b.y));
  return max;
}

export const STATS = {
  shots: SHOTS.length,
  hits: SHOTS.filter(isHit).length,
  misses: SHOTS.filter((s) => !isHit(s)).length,
  points: SHOTS.reduce((t, s) => t + points(s), 0),
  maxPoints: SHOTS.length * MAX_POINTS,
  mpi,
  meanRadius: fromMpi.reduce((t, d) => t + d, 0) / fromMpi.length,
  /** Radius from the group centre holding half the shots. */
  cep50: (fromMpi[2] + fromMpi[3]) / 2,
  groupMm: extremeSpread(),
};

/* ── Who fired, and how it compares ───────────────────────────────────── */

export const FIRER = { name: "Pte. Arjun Nair", initials: "AN", unit: "Alpha Coy · Recruit", id: "T-0421" };
export const SESSION_INFO = { date: "18 Oct 2026 · 09:40", weapon: "SAR 21 · 5.56 mm", distance: "25 m", instructor: "Range Instructor" };

/** The firer's previous session on this lane, for the trend. */
export const PREVIOUS = { date: "11 Oct", points: 44, misses: 2, meanRadius: 8.4, cep50: 6.1, groupMm: 31.4 };

/** Sight adjustment per click at this distance, mm. */
export const CLICK_MM = 1.5;

/** Clicks to move the group centre onto the aim point (+ right / + up). */
export function sightAdvice() {
  const right = Math.round(-STATS.mpi.x / CLICK_MM);
  const up = Math.round(-STATS.mpi.y / CLICK_MM);
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
