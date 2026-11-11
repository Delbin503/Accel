import * as React from "react";
import { cn } from "@/lib/utils";
import {
  EXERCISES, HEALTHY, LIMIT, MOMENTS, BASELINE, compAt, fmtClock, gaitHip, gaitPhase, kneeAt, momentTime, repsOf, type Moment, type Rep, type View,
} from "./physioSession";

/* Drawn pieces of the Rehab Analysis page: the room / walkway camera frame
   with the 3D pose read off it (face always blurred, knee angle drawn on the
   joint), and the range-of-motion gauge. */

const OK = "var(--success)";
const BAD = "var(--sev-critical)";
const WARN = "var(--warning)";
const GHOST = "var(--info)";
const HUD = "rgb(255 255 255 / 0.62)";
const DIM = "rgb(255 255 255 / 0.3)";

type Pt = [number, number];
type Pose = Record<string, Pt>;
type Label = { x: number; y: number; text: string; bad?: boolean; anchor?: "start" | "end" };

type Frame = {
  pose: Pose;
  bones: [string, string][];
  bad: Set<string>;
  /** The far leg, drawn as a dashed ghost (the healthy side). */
  far?: { pose: Pose; bones: [string, string][] };
  head: Pt;
  arc?: { hip: Pt; knee: Pt; ankle: Pt; rays?: [number, string][] };
  labels: Label[];
  guides?: React.ReactNode;
  props?: React.ReactNode;
};

const rad = (d: number) => (d * Math.PI) / 180;
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const along = (p: Pt, deg: number, len: number): Pt => [p[0] + len * Math.cos(rad(deg)), p[1] + len * Math.sin(rad(deg))];
const fromVertical = (p: Pt, deg: number, len: number, up = true): Pt => [p[0] + len * Math.sin(rad(deg)), p[1] + (up ? -1 : 1) * len * Math.cos(rad(deg))];
const r0 = (v: number) => Math.round(v);

/* ── Knee bend (seated on the plinth) ────────────────────────────────── */

const PLINTH = (
  <g fill="rgb(255 255 255 / 0.06)" stroke="rgb(255 255 255 / 0.14)">
    {/* the far (left) leg resting at 90°, body only */}
    <path d="M206 146 L262 146 L262 204 L276 204" fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="120" y="158" width="160" height="10" rx="2" />
    <line x1="132" y1="168" x2="132" y2="238" />
    <line x1="268" y1="168" x2="268" y2="238" />
  </g>
);

function romSide(r: Rep, m: Moment): Frame {
  const t = momentTime(r, m);
  const f = kneeAt(r, t);
  const c = compAt(r, t);
  const hip: Pt = [200, 150];
  const knee: Pt = [258, 150];
  const ankle = along(knee, f, 58);
  const toe: Pt = [ankle[0] + 16 * Math.sin(rad(f)), ankle[1] - 16 * Math.cos(rad(f))];
  const lean = 4 + c.lean * 0.5;
  const sh = fromVertical(hip, -lean, 64);
  sh[1] -= c.shrug * 3;
  const head: Pt = [sh[0] + 4 - 18 * Math.sin(rad(lean)), sh[1] - 22];
  const pose: Pose = { sh, el: [sh[0] - 12, sh[1] + 34], hand: [180, 154], hip, knee, ankle, toe };
  const bad = new Set<string>();
  if (m === 2 && r.flex < LIMIT.weekTarget) bad.add("knee");
  if ((m === 0 || m === 3) && r.lag > LIMIT.lag) bad.add("knee");
  if (m >= 1 && r.trunkLean > LIMIT.trunkLean) bad.add("sh");
  const near = r.flex >= LIMIT.weekTarget;
  return {
    pose, head, bad,
    bones: [["sh", "el"], ["el", "hand"], ["sh", "hip"], ["hip", "knee"], ["knee", "ankle"], ["ankle", "toe"]],
    arc: { hip, knee, ankle, rays: [[LIMIT.goalFlex, "GOAL"]] },
    props: PLINTH,
    labels: [
      { x: 330, y: 64, text: `KNEE ${r0(f)}°`, bad: m === 2 && !near },
      { x: 330, y: 78, text: `AIM ${LIMIT.weekTarget}° · GOAL ${LIMIT.goalFlex}°` },
      ...(m === 2 ? [{ x: 330, y: 92, text: `HOLD ${r.hold.toFixed(1)} S`, bad: r.hold < LIMIT.hold }] : []),
      ...(m === 1 || m === 3 ? [{ x: 330, y: 92, text: `SPEED ${r.speed}°/S`, bad: r.speed > LIMIT.romSpeed }] : []),
      ...(m === 0 ? [{ x: 330, y: 92, text: `${r.lag}° SHORT OF STRAIGHT`, bad: r.lag > LIMIT.lag }] : []),
    ],
  };
}

function frontBody(midHip: Pt, hike: number, leanDeg: number, trunkLen: number, shrug: number) {
  const rHip: Pt = [midHip[0] - 14, midHip[1] - hike * 3];
  const lHip: Pt = [midHip[0] + 14, midHip[1]];
  const mid: Pt = [(rHip[0] + lHip[0]) / 2, (rHip[1] + lHip[1]) / 2];
  const midSh = fromVertical(mid, leanDeg, trunkLen);
  midSh[1] -= shrug * 3;
  const cs = Math.cos(rad(leanDeg)) * 21;
  const sn = Math.sin(rad(leanDeg)) * 21;
  const rSh: Pt = [midSh[0] - cs, midSh[1] - sn];
  const lSh: Pt = [midSh[0] + cs, midSh[1] + sn];
  const head = fromVertical(midSh, leanDeg, 24);
  return { rHip, lHip, rSh, lSh, midSh, head };
}

function romFront(r: Rep, m: Moment): Frame {
  const t = momentTime(r, m);
  const f = kneeAt(r, t);
  const c = compAt(r, t);
  const b = frontBody([240, 150], c.hike, c.lean, 62, c.shrug);
  const rKn: Pt = [b.rHip[0] - 2, 166 - c.hike];
  const lKn: Pt = [b.lHip[0] + 2, 166];
  const pose: Pose = {
    rSh: b.rSh, lSh: b.lSh, rEl: [b.rSh[0] - 8, b.rSh[1] + 34], lEl: [b.lSh[0] + 8, b.lSh[1] + 34], rHand: [b.rHip[0] - 22, 156], lHand: [b.lHip[0] + 22, 156],
    rHip: b.rHip, lHip: b.lHip, rKn, lKn, rAn: [rKn[0] - 1, rKn[1] + 4 + 52 * Math.sin(rad(f))], lAn: [lKn[0] + 1, lKn[1] + 54],
  };
  const bad = new Set<string>();
  if (m >= 1 && r.hipHike > LIMIT.hipHike) ["rHip", "lHip"].forEach((j) => bad.add(j));
  if (m >= 1 && r.trunkLean > LIMIT.trunkLean) ["rSh", "lSh"].forEach((j) => bad.add(j));
  if (m >= 1 && r.shrug > LIMIT.shrug) ["rSh", "lSh"].forEach((j) => bad.add(j));
  return {
    pose, head: b.head, bad,
    bones: [["rSh", "lSh"], ["rSh", "rEl"], ["rEl", "rHand"], ["lSh", "lEl"], ["lEl", "lHand"], ["rSh", "rHip"], ["lSh", "lHip"], ["rHip", "lHip"], ["rHip", "rKn"], ["rKn", "rAn"], ["lHip", "lKn"], ["lKn", "lAn"]],
    props: (
      <g fill="rgb(255 255 255 / 0.06)" stroke="rgb(255 255 255 / 0.14)">
        <rect x="176" y="160" width="128" height="10" rx="2" />
        <line x1="184" y1="170" x2="184" y2="238" />
        <line x1="296" y1="170" x2="296" y2="238" />
      </g>
    ),
    guides: <FrontGuides mid={[240, 150]} />,
    labels: [
      { x: 150, y: 140, text: `HIP HIKE ${r.hipHike.toFixed(1)} CM`, bad: r.hipHike > LIMIT.hipHike, anchor: "end" },
      { x: 150, y: 190, text: `KNEE ${r0(f)}° (3D)`, anchor: "end" },
      { x: 300, y: 84, text: `TRUNK LEAN ${r.trunkLean}°`, bad: r.trunkLean > LIMIT.trunkLean },
      ...(r.shrug > LIMIT.shrug ? [{ x: 300, y: 98, text: `SHOULDERS UP ${r.shrug.toFixed(1)} CM`, bad: true }] : []),
    ],
  };
}

/** Level-pelvis and upright-trunk reference lines, so hip hike and trunk lean show. */
function FrontGuides({ mid }: { mid: Pt }) {
  return (
    <g strokeDasharray="3 3" fill="none" stroke={DIM}>
      <line x1={mid[0]} y1={mid[1]} x2={mid[0]} y2={mid[1] - 100} />
      <line x1={mid[0] - 40} y1={mid[1]} x2={mid[0] + 40} y2={mid[1]} />
    </g>
  );
}

/* ── Sit-to-stand ────────────────────────────────────────────────────── */

function stsGeometry(r: Rep, f: number) {
  const ankle: Pt = [262, 236];
  const alpha = 4 + f * 0.12;
  const knee = fromVertical(ankle, alpha, 54);
  const u: Pt = [Math.sin(rad(alpha)), -Math.cos(rad(alpha))];
  const b = rad(-f);
  const thigh: Pt = [u[0] * Math.cos(b) - u[1] * Math.sin(b), u[0] * Math.sin(b) + u[1] * Math.cos(b)];
  const hip = add(knee, [thigh[0] * 56, thigh[1] * 56]);
  const k = Math.max(0, Math.min(1, (r.flex - f) / (r.flex - r.lag)));
  const lean = 3 + 9 * (1 - k) + 30 * Math.sin(Math.PI * Math.min(1, k * 1.25));
  return { ankle, knee, hip, lean };
}

const CHAIR_SIDE = (
  <g fill="rgb(255 255 255 / 0.06)" stroke="rgb(255 255 255 / 0.14)">
    <rect x="166" y="176" width="66" height="6" rx="1" />
    <line x1="168" y1="120" x2="168" y2="238" />
    <line x1="228" y1="182" x2="228" y2="238" />
  </g>
);

function stsSide(r: Rep, m: Moment): Frame {
  const t = momentTime(r, m);
  const f = kneeAt(r, t);
  const g = stsGeometry(r, f);
  const sh = fromVertical(g.hip, g.lean, 62);
  const head = fromVertical(sh, g.lean, 22);
  const toChest = (k: number, out: number): Pt => [sh[0] + (g.hip[0] - sh[0]) * k + out * Math.cos(rad(g.lean)), sh[1] + (g.hip[1] - sh[1]) * k + out * Math.sin(rad(g.lean))];
  const pose: Pose = { sh, el: toChest(0.45, 14), hand: toChest(0.15, 12), hip: g.hip, knee: g.knee, ankle: g.ankle, toe: [g.ankle[0] + 18, g.ankle[1]] };
  const bad = new Set<string>();
  if (m === 0 && r.flex < LIMIT.stsDepth) bad.add("knee");
  if (m === 2 && r.lag > LIMIT.lag) bad.add("knee");
  return {
    pose, head, bad,
    bones: [["sh", "el"], ["el", "hand"], ["sh", "hip"], ["hip", "knee"], ["knee", "ankle"], ["ankle", "toe"]],
    arc: { hip: g.hip, knee: g.knee, ankle: g.ankle },
    props: CHAIR_SIDE,
    labels: [
      { x: 330, y: 64, text: `KNEE ${r0(f)}°`, bad: bad.has("knee") },
      { x: 330, y: 78, text: `TRUNK FORWARD ${r0(g.lean)}°` },
      { x: 330, y: 92, text: m === 3 ? `LOWERING ${r.hold.toFixed(1)} S` : `RISE ${r.rise.toFixed(1)} S`, bad: m === 3 && r.hold < LIMIT.stsLower },
    ],
  };
}

function stsFront(r: Rep, m: Moment, noLoad: boolean): Frame {
  const t = momentTime(r, m);
  const f = kneeAt(r, t);
  const c = compAt(r, t);
  const g = stsGeometry(r, f);
  const b = frontBody([240, g.hip[1]], c.hike, c.lean, 62 * Math.cos(rad(g.lean)) + 6, c.shrug);
  const rKn: Pt = [224 + c.cave * 1.4, g.knee[1]];
  const lKn: Pt = [256, g.knee[1]];
  const pose: Pose = {
    rSh: b.rSh, lSh: b.lSh, rEl: [b.rSh[0] + 6, b.rSh[1] + 24], lEl: [b.lSh[0] - 6, b.lSh[1] + 24], rHand: [b.midSh[0] + 12, b.midSh[1] + 14], lHand: [b.midSh[0] - 12, b.midSh[1] + 16],
    rHip: b.rHip, lHip: b.lHip, rKn, lKn, rAn: [222, 236], lAn: [258, 236],
  };
  const bad = new Set<string>();
  const moving = m === 1 || m === 3;
  if (moving && r.hipHike > LIMIT.hipHike) ["rHip", "lHip"].forEach((j) => bad.add(j));
  if (moving && r.trunkLean > LIMIT.trunkLean) ["rSh", "lSh"].forEach((j) => bad.add(j));
  if (moving && r.kneeCave > LIMIT.kneeCave) bad.add("rKn");
  return {
    pose, head: b.head, bad,
    bones: [["rSh", "lSh"], ["rSh", "rEl"], ["rEl", "rHand"], ["lSh", "lEl"], ["lEl", "lHand"], ["rSh", "rHip"], ["lSh", "lHip"], ["rHip", "lHip"], ["rHip", "rKn"], ["rKn", "rAn"], ["lHip", "lKn"], ["lKn", "lAn"]],
    props: (
      <g fill="rgb(255 255 255 / 0.06)" stroke="rgb(255 255 255 / 0.14)">
        <rect x="196" y="176" width="88" height="6" rx="1" />
        <line x1="200" y1="182" x2="200" y2="238" />
        <line x1="280" y1="182" x2="280" y2="238" />
        <rect x="196" y="110" width="88" height="8" rx="1" />
      </g>
    ),
    guides: <FrontGuides mid={[240, g.hip[1]]} />,
    labels: [
      { x: 160, y: g.hip[1] - 6, text: `HIP HIKE ${r.hipHike.toFixed(1)} CM`, bad: r.hipHike > LIMIT.hipHike, anchor: "end" },
      { x: 300, y: 84, text: `TRUNK LEAN ${r.trunkLean}°`, bad: r.trunkLean > LIMIT.trunkLean },
      noLoad ? { x: 300, y: 98, text: "LOAD L–R · NO FORCE PLATE" } : { x: 300, y: 98, text: `LOAD L–R ${r.lr}%`, bad: r.lr > LIMIT.lr },
      { x: 160, y: g.knee[1] + 4, text: `KNEE CAVE ${r.kneeCave}°`, bad: r.kneeCave > LIMIT.kneeCave, anchor: "end" },
    ],
  };
}

/* ── Walk (walkway side camera) ──────────────────────────────────────── */

function leg(hip: Pt, thighDeg: number, flex: number) {
  const knee = fromVertical(hip, thighDeg, 54, false);
  const shank = thighDeg - flex;
  const ankle = fromVertical(knee, shank, 54, false);
  const toe: Pt = [ankle[0] + 15 * Math.cos(rad(shank)), ankle[1] - 15 * Math.sin(rad(shank))];
  return { knee, ankle, toe };
}

function walkSide(r: Rep, m: Moment): Frame {
  const t = momentTime(r, m);
  const phi = gaitPhase(r, t);
  const f = kneeAt(r, t);
  const fl = (() => {
    const p = (phi + 0.5) % 1;
    // healthy knee curve at the opposite phase
    if (p < 0.15) return 12 * (p / 0.15);
    if (p < 0.4) return 12 - 10 * ((p - 0.15) / 0.25);
    if (p < 0.72) return 2 + (HEALTHY.gaitSwing - 2) * ((p - 0.4) / 0.32);
    return HEALTHY.gaitSwing * (1 - (p - 0.72) / 0.28);
  })();
  const near0 = leg([0, 0], gaitHip(phi), f);
  const far0 = leg([0, 0], gaitHip((phi + 0.5) % 1), fl);
  const drop = 236 - Math.max(near0.ankle[1], far0.ankle[1], near0.toe[1], far0.toe[1]);
  const hip: Pt = [240, drop];
  const near = leg(hip, gaitHip(phi), f);
  const far = leg(hip, gaitHip((phi + 0.5) % 1), fl);
  const sh = fromVertical(hip, 4, 62);
  const head = fromVertical(sh, 4, 22);
  const arm = -(gaitHip(phi) - 5) * 0.7;
  const el = fromVertical(sh, arm, 28, false);
  const hand = fromVertical(el, arm + 18, 26, false);
  const bad = new Set<string>();
  if (m === 3 && r.flex < LIMIT.gaitSwing) bad.add("knee");
  if (m === 0 && r.lag > LIMIT.lag) bad.add("knee");
  return {
    pose: { sh, el, hand, hip, knee: near.knee, ankle: near.ankle, toe: near.toe }, head, bad,
    bones: [["sh", "el"], ["el", "hand"], ["sh", "hip"], ["hip", "knee"], ["knee", "ankle"], ["ankle", "toe"]],
    far: { pose: { hip, knee: far.knee, ankle: far.ankle, toe: far.toe }, bones: [["hip", "knee"], ["knee", "ankle"], ["ankle", "toe"]] },
    arc: { hip, knee: near.knee, ankle: near.ankle },
    props: (
      <g className="font-mono" fontSize="8" fill="rgb(255 255 255 / 0.35)">
        {Array.from({ length: 11 }, (_, i) => (
          <g key={i}>
            <line x1={40 + i * 40} y1="238" x2={40 + i * 40} y2="244" stroke="rgb(255 255 255 / 0.25)" />
            <text x={40 + i * 40} y="254" textAnchor="middle">{i} m</text>
          </g>
        ))}
      </g>
    ),
    labels: [
      { x: 330, y: 64, text: `RIGHT KNEE ${r0(f)}°`, bad: bad.has("knee") },
      { x: 330, y: 78, text: `SWING ${r.flex}° · NEED ${LIMIT.gaitSwing}°`, bad: r.flex < LIMIT.gaitSwing },
      { x: 330, y: 92, text: `${r.cadence} STEPS/MIN · ${r.gaitSpeed} M/S`, bad: r.cadence < LIMIT.cadence },
    ],
  };
}

/* ── Frame ───────────────────────────────────────────────────────────── */

function frameFor(r: Rep, view: View, m: Moment, noLoad: boolean): Frame {
  if (r.ex === "gait") return walkSide(r, m);
  if (r.ex === "rom") return view === "front" ? romFront(r, m) : romSide(r, m);
  return view === "side" ? stsSide(r, m) : stsFront(r, m, noLoad);
}

function Skeleton({ pose, bones, bad, ghost }: { pose: Pose; bones: [string, string][]; bad: Set<string>; ghost?: boolean }) {
  return (
    <g opacity={ghost ? 0.8 : 1}>
      {bones.map(([a, b]) => (
        <line key={a + b} x1={pose[a][0]} y1={pose[a][1]} x2={pose[b][0]} y2={pose[b][1]}
          stroke={ghost ? GHOST : bad.has(a) || bad.has(b) ? BAD : OK} strokeWidth="2" strokeDasharray={ghost ? "4 3" : undefined} />
      ))}
      {Object.entries(pose).filter(([k]) => !k.toLowerCase().includes("toe") && !(ghost && k === "hip")).map(([k, [x, y]]) => (
        <circle key={k} cx={x} cy={y} r={ghost ? 3 : 4.5} fill={ghost ? GHOST : bad.has(k) ? BAD : OK} stroke="rgb(0 0 0 / 0.7)" strokeWidth="1.5" />
      ))}
    </g>
  );
}

/** The patient's body as soft shapes under the pose, as the camera would see it. */
function Body({ pose, bones, far }: { pose: Pose; bones: [string, string][]; far?: Frame["far"] }) {
  const thick = (a: string, b: string) => (/hip/i.test(a) && /hip/i.test(b) ? 20 : /hip|sh/i.test(a) && /hip|sh/i.test(b) ? 22 : /hip|kn/i.test(a) ? 14 : 10);
  return (
    <g stroke="rgb(255 255 255 / 0.14)" strokeLinecap="round" fill="none">
      {far?.bones.map(([a, b]) => <line key={`f${a}${b}`} x1={far.pose[a][0]} y1={far.pose[a][1]} x2={far.pose[b][0]} y2={far.pose[b][1]} strokeWidth="11" stroke="rgb(255 255 255 / 0.08)" />)}
      {bones.map(([a, b]) => <line key={a + b} x1={pose[a][0]} y1={pose[a][1]} x2={pose[b][0]} y2={pose[b][1]} strokeWidth={thick(a, b)} />)}
    </g>
  );
}

/** The knee angle as an arc on the joint, from the line of the thigh to the shin. */
function KneeArc({ hip, knee, ankle, bad, rays }: { hip: Pt; knee: Pt; ankle: Pt; bad: boolean; rays?: [number, string][] }) {
  const norm = (p: Pt): Pt => { const l = Math.hypot(p[0], p[1]) || 1; return [p[0] / l, p[1] / l]; };
  const u = norm([knee[0] - hip[0], knee[1] - hip[1]]);
  const v = norm([ankle[0] - knee[0], ankle[1] - knee[1]]);
  const deg = Math.round((Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1]))) * 180) / Math.PI);
  const cross = u[0] * v[1] - u[1] * v[0];
  const sweep = cross >= 0 ? 1 : 0;
  const R = 18;
  const p0 = add(knee, [u[0] * R, u[1] * R]);
  const p1 = add(knee, [v[0] * R, v[1] * R]);
  const bis = deg < 4 ? ([-u[1], u[0]] as Pt) : norm([u[0] + v[0], u[1] + v[1]]);
  const tone = bad ? BAD : "var(--primary)";
  const rot = (a: number): Pt => { const s = (sweep ? 1 : -1) * rad(a); return [u[0] * Math.cos(s) - u[1] * Math.sin(s), u[0] * Math.sin(s) + u[1] * Math.cos(s)]; };
  return (
    <g>
      <line x1={knee[0]} y1={knee[1]} x2={knee[0] + u[0] * 30} y2={knee[1] + u[1] * 30} stroke={DIM} strokeDasharray="2 2" />
      {rays?.map(([a, label]) => {
        const d = rot(a);
        return (
          <g key={label}>
            <line x1={knee[0]} y1={knee[1]} x2={knee[0] + d[0] * 46} y2={knee[1] + d[1] * 46} stroke={label === "GOAL" ? OK : DIM} strokeDasharray="3 3" strokeOpacity="0.8" />
            <text x={knee[0] + d[0] * 58} y={knee[1] + d[1] * 58 + 3} textAnchor="middle" fontSize="8" className="font-mono" fill={label === "GOAL" ? OK : HUD}>{label}</text>
          </g>
        );
      })}
      {deg >= 2 && <path d={`M${p0[0]} ${p0[1]} A${R} ${R} 0 0 ${sweep} ${p1[0]} ${p1[1]}`} fill="none" stroke={tone} strokeWidth="2.5" />}
      <text x={knee[0] + bis[0] * 34} y={knee[1] + bis[1] * 34 + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill={tone} className="font-mono" stroke="rgb(0 0 0 / 0.6)" strokeWidth="3" paintOrder="stroke">{deg}°</text>
    </g>
  );
}

/** A blurred block over the face: faces are never shown, live or in stored clips. */
function BlurredHead({ at, filter }: { at: Pt; filter: string }) {
  const [x, y] = at;
  return (
    <g>
      <g filter={`url(#${filter})`}>
        <circle cx={x} cy={y} r="14" fill="rgb(255 255 255 / 0.3)" />
        <rect x={x - 10} y={y - 10} width="10" height="10" fill="rgb(255 255 255 / 0.4)" />
        <rect x={x} y={y} width="10" height="10" fill="rgb(255 255 255 / 0.35)" />
        <rect x={x} y={y - 10} width="10" height="10" fill="rgb(255 255 255 / 0.18)" />
      </g>
      <rect x={x - 17} y={y - 17} width="34" height="34" rx="5" fill="none" stroke="rgb(255 255 255 / 0.3)" strokeDasharray="2 2" />
    </g>
  );
}

const VIEW_LABEL: Record<View, string> = { front: "ROOM FRONT", side: "ROOM SIDE", walk: "WALKWAY SIDE" };

/** `noLoad`: the force plate gave no load for this rep, so the HUD says so instead of a number. */
export function RoomFrame({ rep, view, moment, showPose = true, noLoad = false, className }: { rep: Rep; view: View; moment: Moment; showPose?: boolean; noLoad?: boolean; className?: string }) {
  const uid = React.useId().replace(/:/g, "");
  const fr = frameFor(rep, view, moment, noLoad);
  const t = momentTime(rep, moment);
  const shown = rep.ex === "gait" ? "walk" : view === "walk" ? "side" : view;
  return (
    <svg viewBox="0 0 480 270" preserveAspectRatio="xMidYMid meet" className={cn("block size-full bg-camera-feed", className)} role="img"
      aria-label={`${VIEW_LABEL[shown]} camera, ${EXERCISES[rep.ex].label} rep ${rep.n} at ${MOMENTS[rep.ex][moment]}`}>
      <defs>
        <pattern id={`${uid}-grid`} width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="rgb(255 255 255 / 0.05)" />
        </pattern>
        <filter id={`${uid}-blur`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>
      <rect width="480" height="270" fill={`url(#${uid}-grid)`} />
      <rect y="238" width="480" height="32" fill="rgb(255 255 255 / 0.04)" />
      <line x1="0" y1="238" x2="480" y2="238" stroke="rgb(255 255 255 / 0.12)" />
      {fr.props}
      {showPose && fr.guides}
      <Body pose={fr.pose} bones={fr.bones} far={fr.far} />
      <BlurredHead at={fr.head} filter={`${uid}-blur`} />
      {showPose && fr.far && <Skeleton pose={fr.far.pose} bones={fr.far.bones} bad={new Set()} ghost />}
      {showPose && <Skeleton pose={fr.pose} bones={fr.bones} bad={fr.bad} />}
      {showPose && fr.arc && <KneeArc {...fr.arc} bad={fr.bad.has("knee")} />}
      {showPose && (
        <g className="font-mono" fontSize="10">
          {fr.labels.map((l) => (
            <text key={l.text} x={l.x} y={l.y} textAnchor={l.anchor ?? "start"} fill={l.bad ? BAD : l.bad === false ? OK : HUD}>{l.text}</text>
          ))}
        </g>
      )}
      <g className="font-mono" fontSize="10" fill={HUD}>
        <text x="12" y="20">● REC  {rep.ex === "gait" ? "WALKWAY" : "ROOM 1"} · {VIEW_LABEL[shown]} · 60 FPS</text>
        <text x="12" y="34">{fmtClock(rep.at + t)} · {EXERCISES[rep.ex].label.toUpperCase()} {rep.n} / {repsOf(rep.ex).length} · {MOMENTS[rep.ex][moment].toUpperCase()}</text>
        <rect x="378" y="10" width="90" height="15" rx="3" fill="rgb(0 0 0 / 0.45)" stroke="rgb(255 255 255 / 0.2)" />
        <text x="423" y="21" textAnchor="middle" fontSize="9">FACES BLURRED</text>
      </g>
    </svg>
  );
}

/* ── Range-of-motion gauge ───────────────────────────────────────────── */

const CX = 120;
const CY = 30;
const pt = (r: number, a: number): Pt => [CX + r * Math.cos(rad(a)), CY + r * Math.sin(rad(a))];
function arc(r: number, a0: number, a1: number) {
  const [x0, y0] = pt(r, a0);
  const [x1, y1] = pt(r, a1);
  return `M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

/** A goniometer: the fixed arm on the thigh, the moving arm on the shin.
 *  The arc shows the range the rep covered, against the goal, week 1 and the healthy knee. */
export function RangeGauge({ rep, best, className }: { rep: Rep; best: number; className?: string }) {
  const need = EXERCISES[rep.ex].need;
  const met = rep.flex >= need;
  const tone = met ? OK : WARN;
  const tick = (a: number, r1: number, r2: number, stroke: string, w = 2) => {
    const [x1, y1] = pt(r1, a);
    const [x2, y2] = pt(r2, a);
    return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={w} />;
  };
  const label = (a: number, r: number, text: string, fill: string, anchor: "start" | "middle" | "end" = "middle") => {
    const [x, y] = pt(r, a);
    return <text x={x} y={y + 3} textAnchor={anchor} fontSize="8" fontWeight="600" fill={fill} className="font-mono">{text}</text>;
  };
  const [ax, ay] = pt(70, rep.flex);
  return (
    <svg viewBox="0 0 240 142" className={cn("block size-full", className)} role="img"
      aria-label={`Knee range ${rep.lag} to ${rep.flex} degrees; goal ${LIMIT.goalFlex}, week 1 ${BASELINE.flex}, left knee ${HEALTHY.flex}`}>
      {/* healthy left knee, as a ghost */}
      <path d={arc(96, HEALTHY.lag, HEALTHY.flex)} fill="none" stroke={GHOST} strokeWidth="1.5" strokeDasharray="3 3" />
      {label(HEALTHY.flex + 4, 106, `L ${HEALTHY.flex}°`, GHOST, "end")}
      {/* track and this rep */}
      <path d={arc(84, 0, 150)} fill="none" stroke="var(--muted)" strokeWidth="11" />
      <path d={arc(84, rep.lag, rep.flex)} fill="none" stroke={tone} strokeWidth="11" />
      {/* week 1 baseline */}
      <path d={arc(70, BASELINE.lag, BASELINE.flex)} fill="none" stroke="var(--muted-foreground)" strokeOpacity="0.6" strokeWidth="4" strokeLinecap="round" />
      {label(BASELINE.flex - 10, 58, "WK 1", "var(--muted-foreground)")}
      {/* goal, need and today's best */}
      {tick(LIMIT.goalFlex, 76, 100, OK, 2.5)}
      {label(LIMIT.goalFlex, 112, `GOAL ${LIMIT.goalFlex}°`, OK)}
      {need !== LIMIT.goalFlex && tick(need, 77, 91, "var(--foreground)", 1.5)}
      {rep.ex === "rom" && best !== rep.flex && tick(best, 78, 90, "var(--primary)", 1.5)}
      {label(0, 104, "0°", "var(--muted-foreground)")}
      {label(90, 104, "90°", "var(--muted-foreground)")}
      {/* goniometer arms */}
      <line x1={CX} y1={CY} x2={CX - 76} y2={CY} stroke="var(--muted-foreground)" strokeWidth="3" strokeLinecap="round" />
      <line x1={CX} y1={CY} x2={ax} y2={ay} stroke="var(--foreground)" strokeWidth="3" strokeLinecap="round" />
      <circle cx={CX} cy={CY} r="5" fill="var(--card)" stroke="var(--foreground)" strokeWidth="2" />
      <text x={CX - 72} y={CY - 6} fontSize="8" fill="var(--muted-foreground)" className="font-mono">THIGH</text>
    </svg>
  );
}
