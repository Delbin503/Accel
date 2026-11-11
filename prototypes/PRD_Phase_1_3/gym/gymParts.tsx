import * as React from "react";
import { cn } from "@/lib/utils";
import {
  PX_PER_CM, SEG, SESSION, TARGET, barPathOf, bodyAt, depthAt, fmtClock, phaseTime, type Phase, type Rep,
} from "./gymSession";

/* Drawn pieces of the Lift Analysis page: the side-camera frame with the 2D
   pose and the traced bar path, and the bar path plot. */

const OK = "var(--success)";
const BAD = "var(--sev-critical)";
const HUD = "rgb(255 255 255 / 0.62)";
const GHOST = "var(--info)";

type Pt = [number, number];
type Pose = Record<"head" | "shoulder" | "elbow" | "hand" | "hip" | "knee" | "ankle" | "heel" | "toe" | "bar", Pt>;

/* The lifter faces right. Ankle fixed on the platform; mid-foot sits 4 units ahead of it. */
const ANKLE: Pt = [222, 236];
const FLOOR = 240;
const MIDFOOT_X = ANKLE[0] + 4;
const RAD = Math.PI / 180;

function poseAt(r: Rep, d: number, up: boolean, phase?: Phase): Pose {
  const b = bodyAt(r, d, up);
  const heel = phase === "bottom" || phase === "ascent" ? r.heelLift * PX_PER_CM * (phase === "bottom" ? 1 : 0.6) : 0;
  const ankle: Pt = [ANKLE[0], ANKLE[1] - heel];
  const knee: Pt = [ankle[0] + SEG.shin * Math.sin(b.theta * RAD), ankle[1] - SEG.shin * Math.cos(b.theta * RAD)];
  const hip: Pt = [knee[0] - SEG.thigh * Math.sin(b.beta * RAD), knee[1] - SEG.thigh * Math.cos(b.beta * RAD)];
  const shoulder: Pt = [hip[0] + SEG.torso * Math.sin(b.alpha * RAD), hip[1] - SEG.torso * Math.cos(b.alpha * RAD)];
  const bar: Pt = [shoulder[0] - 2, shoulder[1] + 3];
  /* Elbows point back and down from the bar; the head sits a little more upright than the torso. */
  const a = b.alpha * RAD;
  const elbow: Pt = [bar[0] - 14 * Math.cos(a) - 16 * Math.sin(a), bar[1] - 14 * Math.sin(a) + 16 * Math.cos(a)];
  const ha = b.alpha * 0.55 * RAD;
  const head: Pt = [shoulder[0] + 15 * Math.sin(ha) + 4, shoulder[1] - 15 * Math.cos(ha) - 4];
  return { head, shoulder, elbow, hand: [bar[0] + 2, bar[1] + 1], hip, knee, ankle, heel: [ankle[0] - 12, FLOOR], toe: [ankle[0] + 24, FLOOR], bar };
}

/** Where the rep is at each key moment. */
function stateAt(r: Rep, phase: Phase) {
  return depthAt(r, phaseTime(r, phase));
}

/** Joints drawn in red at this moment: the rep's faults, where they show. */
function badJoints(r: Rep, phase: Phase): Set<string> {
  const bad = new Set<string>();
  const low = phase === "bottom" || phase === "ascent";
  if (low && r.lean > TARGET.lean) ["shoulder", "hip"].forEach((j) => bad.add(j));
  if (phase === "bottom" && r.depth < TARGET.depth) ["hip", "knee"].forEach((j) => bad.add(j));
  if (phase === "ascent" && r.hipRise > TARGET.hipRise) ["hip", "shoulder"].forEach((j) => bad.add(j));
  if (low && r.backRound > TARGET.backRound) bad.add("spine");
  if (low && r.heelLift > TARGET.heelLift) ["heel", "ankle"].forEach((j) => bad.add(j));
  if (phase === "lockout" && r.lockout < TARGET.lockout) ["hip", "knee"].forEach((j) => bad.add(j));
  if (phase === "setup" && r.setup > TARGET.setup) bad.add("bar");
  return bad;
}

const BONES: [keyof Pose, keyof Pose][] = [["head", "shoulder"], ["shoulder", "hip"], ["hip", "knee"], ["knee", "ankle"], ["ankle", "heel"], ["ankle", "toe"], ["heel", "toe"], ["bar", "elbow"]];

function Skeleton({ pose, bad, ghost }: { pose: Pose; bad: Set<string>; ghost?: boolean }) {
  const tone = (a: string, b: string) => (ghost ? GHOST : bad.has(a) || bad.has(b) || ((a === "shoulder" && b === "hip") && bad.has("spine")) ? BAD : OK);
  return (
    <g opacity={ghost ? 0.75 : 1}>
      {BONES.map(([a, b]) => (
        <line key={a + b} x1={pose[a][0]} y1={pose[a][1]} x2={pose[b][0]} y2={pose[b][1]} stroke={tone(a, b)} strokeWidth="2" strokeDasharray={ghost ? "4 3" : undefined} />
      ))}
      {(Object.entries(pose) as [string, Pt][]).filter(([k]) => k !== "bar" && k !== "hand").map(([k, [x, y]]) => (
        <circle key={k} cx={x} cy={y} r={ghost ? 3 : 4.2} fill={ghost ? GHOST : bad.has(k) ? BAD : OK} stroke="rgb(0 0 0 / 0.7)" strokeWidth="1.5" />
      ))}
    </g>
  );
}

/** The lifter's body as soft shapes under the pose, as the camera would see it. */
function Body({ pose }: { pose: Pose }) {
  const seg = (a: Pt, b: Pt, w: number) => <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={w} />;
  return (
    <g stroke="rgb(255 255 255 / 0.14)" strokeLinecap="round" fill="none">
      {seg(pose.shoulder, pose.hip, 26)}
      {seg(pose.hip, pose.knee, 20)}
      {seg(pose.knee, pose.ankle, 13)}
      {seg(pose.bar, pose.elbow, 9)}
      {seg(pose.heel, pose.toe, 7)}
      <circle cx={pose.head[0]} cy={pose.head[1]} r="11" fill="rgb(255 255 255 / 0.14)" stroke="none" />
    </g>
  );
}

/** Plates seen end-on along the bar, with the sleeve. */
function Plates({ at, ghost }: { at: Pt; ghost?: boolean }) {
  return (
    <g opacity={ghost ? 0.5 : 1}>
      <circle cx={at[0]} cy={at[1]} r="27" fill={ghost ? "none" : "rgb(255 255 255 / 0.05)"} stroke={ghost ? GHOST : "rgb(255 255 255 / 0.35)"} strokeWidth="2" strokeDasharray={ghost ? "4 3" : undefined} />
      {!ghost && <circle cx={at[0]} cy={at[1]} r="20" fill="none" stroke="rgb(255 255 255 / 0.12)" />}
      <circle cx={at[0]} cy={at[1]} r="3.5" fill={ghost ? GHOST : "rgb(255 255 255 / 0.85)"} />
    </g>
  );
}

/** The bar's path through the whole rep, traced off the pose. */
function repTrace(r: Rep): Pt[] {
  const pts: Pt[] = [];
  const steps = 20;
  for (let i = 0; i <= steps; i++) pts.push(poseAt(r, i / steps, false).bar);
  for (let i = steps; i >= 0; i--) pts.push(poseAt(r, i / steps, true).bar);
  return pts;
}

/** `speed` overrides the mean speed shown on the ascent label; `speedEst` marks it as estimated from video (no bar speed sensor). */
export function RepFrame({ rep, phase, showPose = true, showPath = true, ghost, hud = true, speed, speedEst = false, className, children }: {
  rep: Rep; phase: Phase; showPose?: boolean; showPath?: boolean; ghost?: Rep; hud?: boolean; speed?: number; speedEst?: boolean; className?: string; children?: React.ReactNode;
}) {
  const { d, up } = stateAt(rep, phase);
  const pose = poseAt(rep, d, up, phase);
  const bad = badJoints(rep, phase);
  const g = ghost ? stateAt(ghost, phase) : null;
  const ghostPose = ghost && g ? poseAt(ghost, g.d, g.up, phase) : null;
  const trace = repTrace(rep);
  const driftBad = rep.drift > TARGET.drift;
  const clock = fmtClock(rep.at + phaseTime(rep, phase));
  const bottomKnee = poseAt(rep, 1, false).knee;
  return (
    <svg viewBox="0 0 480 270" preserveAspectRatio="xMidYMid meet" className={cn("block size-full bg-camera-feed", className)} role="img"
      aria-label={`Side camera, set ${rep.set} rep ${rep.rep} at ${phase}`}>
      <defs>
        <pattern id="gym-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="rgb(255 255 255 / 0.05)" />
        </pattern>
      </defs>
      <rect width="480" height="270" fill="url(#gym-grid)" />
      {/* rack uprights and platform */}
      <g stroke="rgb(255 255 255 / 0.1)" strokeWidth="6">
        <line x1="150" y1="18" x2="150" y2={FLOOR} />
        <line x1="300" y1="18" x2="300" y2={FLOOR} />
      </g>
      <rect y={FLOOR} width="480" height={270 - FLOOR} fill="rgb(255 255 255 / 0.04)" />
      <line x1="0" y1={FLOOR} x2="480" y2={FLOOR} stroke="rgb(255 255 255 / 0.14)" />

      {/* mid-foot line: where the bar should stay */}
      <line x1={MIDFOOT_X} y1="20" x2={MIDFOOT_X} y2={FLOOR} stroke="rgb(255 255 255 / 0.28)" strokeDasharray="3 3" />
      {/* parallel line: the top of the knee at the bottom */}
      {phase === "bottom" && <line x1={bottomKnee[0] - 90} y1={bottomKnee[1]} x2={bottomKnee[0] + 20} y2={bottomKnee[1]} stroke={rep.depth < TARGET.depth ? BAD : "rgb(255 255 255 / 0.3)"} strokeDasharray="3 3" />}

      <Body pose={pose} />
      {showPath && (
        <polyline points={trace.map((p) => p.join(",")).join(" ")} fill="none" stroke={driftBad ? BAD : "var(--warning)"} strokeWidth="1.6" strokeOpacity="0.9" strokeLinejoin="round" />
      )}
      {ghostPose && <Skeleton pose={ghostPose} bad={new Set()} ghost />}
      {ghostPose && <Plates at={ghostPose.bar} ghost />}
      {showPose && <Skeleton pose={pose} bad={bad} />}
      <Plates at={pose.bar} />
      {showPose && <Labels rep={rep} phase={phase} speed={speed ?? rep.meanVel} speedEst={speedEst} />}

      {hud && (
        <g className="font-mono" fontSize="10" fill={HUD}>
          <text x="12" y="20">● REC  {SESSION.rack.toUpperCase()} · SIDE · {SESSION.trackingFps} FPS</text>
          <text x="12" y="34">{clock} · SET {rep.set} · REP {rep.rep} · {phase.toUpperCase()}</text>
          <text x="12" y="48">{SESSION.load} KG</text>
        </g>
      )}
      {children}
    </svg>
  );
}

function Labels({ rep, phase, speed, speedEst }: { rep: Rep; phase: Phase; speed: number; speedEst: boolean }) {
  const row = (y: number, bad: boolean, text: string) => <text key={text} x="322" y={y} fill={bad ? BAD : OK}>{text}</text>;
  const rows: React.ReactNode[] = [];
  if (phase === "setup") rows.push(row(110, rep.setup > TARGET.setup, `BAR +${rep.setup.toFixed(1)} CM OF MID-FOOT`));
  if (phase === "descent") rows.push(row(110, rep.ecc < TARGET.ecc[0], `DESCENT ${rep.ecc.toFixed(1)} S`));
  if (phase === "bottom") {
    rows.push(row(110, rep.depth < TARGET.depth, `DEPTH ${rep.depth >= 0 ? "+" : "−"}${Math.abs(rep.depth).toFixed(1)} CM`));
    rows.push(row(124, rep.lean > TARGET.lean, `LEAN ${rep.lean}°`));
    if (rep.heelLift > 0) rows.push(row(138, rep.heelLift > TARGET.heelLift, `HEEL ${rep.heelLift.toFixed(1)} CM`));
  }
  if (phase === "ascent") {
    rows.push(row(110, rep.drift > TARGET.drift, `BAR DRIFT ${rep.drift.toFixed(1)} CM`));
    rows.push(row(124, rep.hipRise > TARGET.hipRise, `HIPS FIRST +${rep.hipRise}°`));
    rows.push(row(138, false, speedEst ? `≈${speed.toFixed(2)} M/S · EST.` : `${speed.toFixed(2)} M/S`));
  }
  if (phase === "lockout") rows.push(row(110, rep.lockout < TARGET.lockout, `HIP ${rep.lockout}°`));
  return <g className="font-mono" fontSize="10">{rows}</g>;
}

/* ── Bar path plot ───────────────────────────────────────────────────── */

const X_SPAN = 10; // cm either side of mid-foot
const Y_TOP = 62;

/** Side-view bar path of the picked rep against the mid-foot line, the rest of its set faint behind it. */
export function BarPathPlot({ rep, others, onSelect, className }: { rep: Rep; others: Rep[]; onSelect: (id: string) => void; className?: string }) {
  const W = 100;
  const H = 120;
  const x = (cm: number) => ((cm + X_SPAN) / (X_SPAN * 2)) * W;
  const y = (cm: number) => H - (cm / Y_TOP) * H;
  const line = (r: Rep) => barPathOf(r).map((p) => `${x(p.x).toFixed(2)},${y(p.y).toFixed(2)}`).join(" ");
  const bad = rep.drift > TARGET.drift;
  const peak = barPathOf(rep).reduce((a, p) => (p.x > a.x ? p : a));
  return (
    <svg viewBox={`-12 -6 ${W + 20} ${H + 16}`} className={cn("block size-full", className)} role="img" aria-label={`Bar path of set ${rep.set} rep ${rep.rep}, ${rep.drift.toFixed(1)} cm drift`}>
      <rect x="0" y="0" width={W} height={H} rx="3" fill="var(--muted)" fillOpacity="0.25" stroke="var(--border)" vectorEffect="non-scaling-stroke" />
      {/* allowed drift band */}
      <rect x={x(-TARGET.drift)} y="0" width={x(TARGET.drift) - x(-TARGET.drift)} height={H} fill="var(--success)" fillOpacity="0.07" />
      {[-5, 5].map((c) => (
        <line key={c} x1={x(c)} x2={x(c)} y1="0" y2={H} stroke="var(--success)" strokeOpacity="0.35" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
      ))}
      {[0, 20, 40, 60].map((c) => (
        <g key={c}>
          <line x1="0" x2={W} y1={y(c)} y2={y(c)} stroke="var(--border)" strokeOpacity="0.5" vectorEffect="non-scaling-stroke" />
          <text x="-2" y={y(c) + 1.4} textAnchor="end" fontSize="4" fill="var(--muted-foreground)" className="font-mono">{c}</text>
        </g>
      ))}
      {/* ideal: straight up and down over mid-foot */}
      <line x1={x(0)} x2={x(0)} y1="0" y2={H} stroke="var(--foreground)" strokeOpacity="0.55" strokeDasharray="3 2" vectorEffect="non-scaling-stroke" />
      <text x={x(0)} y={H + 7} textAnchor="middle" fontSize="4" fill="var(--muted-foreground)" className="font-mono">mid-foot</text>
      <text x={x(-X_SPAN) + 1} y={H + 7} fontSize="4" fill="var(--muted-foreground)" className="font-mono">−{X_SPAN}</text>
      <text x={x(X_SPAN) - 1} y={H + 7} textAnchor="end" fontSize="4" fill="var(--muted-foreground)" className="font-mono">+{X_SPAN} cm</text>
      {others.filter((o) => o.id !== rep.id).map((o) => (
        <g key={o.id} role="button" tabIndex={0} className="cursor-pointer outline-none" aria-label={`Set ${o.set} rep ${o.rep}`}
          onClick={() => onSelect(o.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(o.id)}>
          <title>{`Rep ${o.rep} · ${o.drift.toFixed(1)} cm drift`}</title>
          <polyline points={line(o)} fill="none" stroke="var(--muted-foreground)" strokeOpacity="0.35" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
      <polyline points={line(rep)} fill="none" stroke={bad ? BAD : "var(--primary)"} strokeWidth="2.2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {/* largest drift */}
      <line x1={x(0)} x2={x(peak.x)} y1={y(peak.y)} y2={y(peak.y)} stroke={bad ? BAD : "var(--primary)"} strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <circle cx={x(peak.x)} cy={y(peak.y)} r="2" fill={bad ? BAD : "var(--primary)"} />
      <text x={x(peak.x) + 3} y={y(peak.y) + 1.5} fontSize="4.4" fontWeight="700" fill={bad ? BAD : "var(--primary)"} className="font-mono">{rep.drift.toFixed(1)} cm</text>
      <text x="-2" y="-2" textAnchor="end" fontSize="4" fill="var(--muted-foreground)" className="font-mono">cm</text>
    </svg>
  );
}
