import * as React from "react";
import { cn } from "@/lib/utils";
import {
  SESSION, SWINGS, TARGET, fmtClock, inRange, phaseTime, shapeOf, spineLost, xFactor, type Phase, type Swing,
} from "./golfSession";

/* Drawn pieces of the Swing Assessment page: the pose frame for each camera,
   the coach's drawing layer, and the shot dispersion plot. */

export type View = "face" | "dtl";

const OK = "var(--success)";
const BAD = "var(--sev-critical)";
const HUD = "rgb(255 255 255 / 0.62)";
const GHOST = "var(--info)";

type Pt = [number, number];
type Pose = Record<string, Pt>;

/* ── Face-on poses ───────────────────────────────────────────────────── */

/* The golfer faces the camera, so the lead side (target side) is on the right. */
const FACE: Record<Phase, Pose> = {
  address: { head: [240, 62], neck: [240, 84], rSh: [219, 94], lSh: [261, 94], rEl: [228, 132], lEl: [252, 132], hands: [242, 162], rHip: [226, 148], lHip: [254, 148], rKn: [220, 192], lKn: [262, 192], rAn: [214, 238], lAn: [268, 238], club: [234, 240] },
  takeaway: { head: [239, 62], neck: [240, 84], rSh: [222, 94], lSh: [256, 96], rEl: [212, 128], lEl: [232, 138], hands: [206, 154], rHip: [227, 148], lHip: [253, 148], rKn: [220, 192], lKn: [260, 192], rAn: [214, 238], lAn: [268, 238], club: [150, 150] },
  top: { head: [237, 62], neck: [239, 84], rSh: [228, 92], lSh: [250, 100], rEl: [200, 96], lEl: [222, 106], hands: [204, 64], rHip: [229, 147], lHip: [252, 149], rKn: [222, 192], lKn: [252, 194], rAn: [214, 238], lAn: [268, 238], club: [264, 52] },
  impact: { head: [235, 63], neck: [238, 85], rSh: [218, 98], lSh: [260, 92], rEl: [234, 134], lEl: [256, 130], hands: [250, 164], rHip: [234, 150], lHip: [262, 146], rKn: [230, 194], lKn: [264, 190], rAn: [216, 236], lAn: [268, 238], club: [240, 240] },
  finish: { head: [252, 64], neck: [252, 86], rSh: [240, 96], lSh: [262, 96], rEl: [272, 82], lEl: [282, 96], hands: [272, 62], rHip: [246, 148], lHip: [262, 148], rKn: [252, 198], lKn: [266, 192], rAn: [232, 232], lAn: [268, 238], club: [214, 58] },
};
const FACE_BONES = [["head", "neck"], ["rSh", "lSh"], ["rSh", "rEl"], ["rEl", "hands"], ["lSh", "lEl"], ["lEl", "hands"], ["rSh", "rHip"], ["lSh", "lHip"], ["rHip", "lHip"], ["rHip", "rKn"], ["rKn", "rAn"], ["lHip", "lKn"], ["lKn", "lAn"]];

function facePose(s: Swing, phase: Phase): { pose: Pose; bad: Set<string> } {
  const pose = Object.fromEntries(Object.entries(FACE[phase]).map(([k, p]) => [k, [...p] as Pt])) as Pose;
  const bad = new Set<string>();
  const shift = (keys: string[], dx: number) => keys.forEach((k) => (pose[k] = [pose[k][0] + dx, pose[k][1]]));
  if (phase === "top" || phase === "takeaway") {
    const k = phase === "top" ? 1 : 0.4;
    shift(["rHip", "lHip", "rKn", "lKn"], -s.pelvisSway * 2 * k);
    shift(["head", "neck"], -s.headMove * 1.2 * k);
    if (phase === "top" && s.pelvisSway > TARGET.pelvisSway[1]) ["rHip", "lHip", "rKn"].forEach((j) => bad.add(j));
    if (phase === "top" && s.headMove > TARGET.headMove[1]) bad.add("head");
  }
  if (phase === "impact") {
    shift(["rHip", "lHip", "rKn", "lKn"], (s.weightLead - 82) * 0.35);
    shift(["head", "neck"], -s.headMove * 0.8);
    if (s.weightLead < TARGET.weightLead[0]) ["rHip", "lHip", "lKn"].forEach((j) => bad.add(j));
    if (s.headMove > TARGET.headMove[1]) bad.add("head");
  }
  return { pose, bad };
}

/* ── Down-the-line poses ─────────────────────────────────────────────── */

/* Seen from behind the hands, looking at the target: the golfer is on the left,
   bent toward the ball on the right. The spine is drawn from the hip at the
   swing's own forward bend, so early extension shows as the hips moving right
   and the chest standing up. */
const SPINE_LEN = 64;
const ADDR_HIP: Pt = [196, 150];
const HIP_LINE_X = ADDR_HIP[0] - 14;

function dtlPose(s: Swing, phase: Phase): { pose: Pose; bad: Set<string>; spine: number } {
  const plan: Record<Phase, { hip: Pt; spine: number; kn: Pt; hands: Pt; club: Pt; elOff?: Pt }> = {
    address: { hip: ADDR_HIP, spine: s.spineAddr, kn: [216, 194], hands: [254, 172], club: [306, 238] },
    takeaway: { hip: [195, 150], spine: s.spineAddr, kn: [216, 194], hands: [240, 168], club: [276, 198] },
    top: { hip: [194, 150], spine: s.spineAddr - 1, kn: [214, 194], hands: [214, 70], club: [262, 56], elOff: [14, 8] },
    impact: { hip: [196 + s.pelvisThrust * 2, 150 - s.pelvisThrust * 0.4], spine: s.spineImpact, kn: [218 + s.pelvisThrust, 192], hands: [258, 174], club: [306, 238] },
    finish: { hip: [204 + s.pelvisThrust * 2, 152], spine: 12, kn: [224, 196], hands: [196, 72], club: [166, 92], elOff: [10, 10] },
  };
  const p = plan[phase];
  const a = (p.spine * Math.PI) / 180;
  const sh: Pt = [p.hip[0] + SPINE_LEN * Math.sin(a), p.hip[1] - SPINE_LEN * Math.cos(a)];
  const head: Pt = [sh[0] + 6 + 12 * Math.sin(a), sh[1] - 22];
  const el: Pt = [(sh[0] + p.hands[0]) / 2 - 4 + (p.elOff?.[0] ?? 0), (sh[1] + p.hands[1]) / 2 + 4 + (p.elOff?.[1] ?? 0)];
  const pose: Pose = { head, sh, el, hands: p.hands, hip: p.hip, kn: p.kn, an: [204, 238], club: p.club };
  const bad = new Set<string>();
  const ee = spineLost(s) > TARGET.spineLost[1] || s.pelvisThrust > TARGET.pelvisThrust[1];
  if ((phase === "impact" || phase === "finish") && ee) ["hip", "sh", "head"].forEach((j) => bad.add(j));
  if (phase === "address" && !inRange(s.spineAddr, TARGET.spineAddr)) ["hip", "sh"].forEach((j) => bad.add(j));
  return { pose, bad, spine: p.spine };
}
const DTL_BONES = [["head", "sh"], ["sh", "el"], ["el", "hands"], ["sh", "hip"], ["hip", "kn"], ["kn", "an"]];

/* ── Swing frame ─────────────────────────────────────────────────────── */

function poseFor(s: Swing, view: View, phase: Phase) {
  return view === "face" ? facePose(s, phase) : dtlPose(s, phase);
}

function Skeleton({ pose, bad, bones, ghost }: { pose: Pose; bad: Set<string>; bones: string[][]; ghost?: boolean }) {
  return (
    <g opacity={ghost ? 0.75 : 1}>
      <line x1={pose.hands[0]} y1={pose.hands[1]} x2={pose.club[0]} y2={pose.club[1]} stroke={ghost ? GHOST : "rgb(255 255 255 / 0.85)"} strokeWidth="1.6" strokeDasharray={ghost ? "4 3" : undefined} />
      {bones.map(([a, b]) => (
        <line key={a + b} x1={pose[a][0]} y1={pose[a][1]} x2={pose[b][0]} y2={pose[b][1]}
          stroke={ghost ? GHOST : bad.has(a) || bad.has(b) ? BAD : OK} strokeWidth="2" strokeDasharray={ghost ? "4 3" : undefined} />
      ))}
      {Object.entries(pose).filter(([k]) => k !== "club" && k !== "neck").map(([k, [x, y]]) => (
        <circle key={k} cx={x} cy={y} r={ghost ? 3 : 4.5} fill={ghost ? GHOST : bad.has(k) ? BAD : OK} stroke="rgb(0 0 0 / 0.7)" strokeWidth="1.5" />
      ))}
    </g>
  );
}

/** The golfer's body as soft shapes under the pose, as the camera would see it. */
function Body({ pose, bones }: { pose: Pose; bones: string[][] }) {
  return (
    <g stroke="rgb(255 255 255 / 0.15)" strokeLinecap="round" fill="none">
      {bones.filter(([a]) => a !== "head").map(([a, b]) => (
        <line key={a + b} x1={pose[a][0]} y1={pose[a][1]} x2={pose[b][0]} y2={pose[b][1]}
          strokeWidth={a.includes("Hip") || b.includes("Hip") || a === "hip" || b === "hip" ? 20 : a.includes("Sh") && b.includes("Sh") ? 18 : 12} />
      ))}
      <circle cx={pose.head[0]} cy={pose.head[1]} r="15" fill="rgb(255 255 255 / 0.15)" stroke="none" />
      <line x1={pose.hands[0]} y1={pose.hands[1]} x2={pose.club[0]} y2={pose.club[1]} strokeWidth="3" stroke="rgb(255 255 255 / 0.3)" />
    </g>
  );
}

/** `ball` false: no launch-monitor data for this swing, so the club path readout is left off. */
export function SwingFrame({ swing, view, phase, showPose = true, ghost, hud = true, ball = true, className, children }: {
  swing: Swing; view: View; phase: Phase; showPose?: boolean; ghost?: Swing; hud?: boolean; ball?: boolean; className?: string; children?: React.ReactNode;
}) {
  const { pose, bad } = poseFor(swing, view, phase);
  const bones = view === "face" ? FACE_BONES : DTL_BONES;
  const ghostPose = ghost ? poseFor(ghost, view, phase).pose : null;
  const clock = fmtClock(swing.at + phaseTime(swing, phase) + 2);
  const phaseLabel = phase.toUpperCase();
  return (
    <svg viewBox="0 0 480 270" preserveAspectRatio="xMidYMid meet" className={cn("block size-full bg-camera-feed", className)} role="img"
      aria-label={`${view === "face" ? "Face-on" : "Down-the-line"} camera, swing ${swing.n} at ${phase}`}>
      <defs>
        <pattern id="golf-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="rgb(255 255 255 / 0.05)" />
        </pattern>
      </defs>
      <rect width="480" height="270" fill="url(#golf-grid)" />
      {/* hitting mat and ball */}
      <rect y="238" width="480" height="32" fill="rgb(255 255 255 / 0.04)" />
      <line x1="0" y1="238" x2="480" y2="238" stroke="rgb(255 255 255 / 0.12)" />
      {(phase === "address" || phase === "takeaway" || phase === "top") && <circle cx={view === "face" ? 236 : 310} cy="235" r="3.5" fill="rgb(255 255 255 / 0.85)" />}

      {view === "face" ? <FaceGuides swing={swing} phase={phase} /> : <DtlGuides swing={swing} phase={phase} />}

      <Body pose={pose} bones={bones} />
      {ghostPose && <Skeleton pose={ghostPose} bad={new Set()} bones={bones} ghost />}
      {showPose && <Skeleton pose={pose} bad={bad} bones={bones} />}
      {showPose && (view === "face" ? <FaceLabels swing={swing} phase={phase} /> : <DtlLabels swing={swing} phase={phase} ball={ball} />)}

      {hud && (
        <g className="font-mono" fontSize="10" fill={HUD}>
          <text x="12" y="20">● REC  {SESSION.bay.toUpperCase()} · {view === "face" ? "FACE-ON" : "DOWN-THE-LINE"} · {SESSION.trackingFps} FPS</text>
          <text x="12" y="34">{clock} · SWING {swing.n} / {SWINGS.length} · {phaseLabel}</text>
        </g>
      )}
      {children}
    </svg>
  );
}

/* Reference lines drawn from the address position, so movement off them shows. */
function FaceGuides({ swing, phase }: { swing: Swing; phase: Phase }) {
  const swayBad = swing.pelvisSway > TARGET.pelvisSway[1];
  const headBad = swing.headMove > TARGET.headMove[1];
  if (phase === "address" || phase === "finish") return null;
  return (
    <g strokeDasharray="3 3" fill="none">
      <line x1={FACE.address.rHip[0] - 8} y1="110" x2={FACE.address.rHip[0] - 8} y2="238" stroke={phase === "top" && swayBad ? BAD : "rgb(255 255 255 / 0.3)"} />
      <circle cx={FACE.address.head[0]} cy={FACE.address.head[1]} r="17" stroke={headBad && phase !== "takeaway" ? BAD : "rgb(255 255 255 / 0.3)"} />
    </g>
  );
}

function FaceLabels({ swing, phase }: { swing: Swing; phase: Phase }) {
  const swayBad = swing.pelvisSway > TARGET.pelvisSway[1];
  const headBad = swing.headMove > TARGET.headMove[1];
  const turnOk = inRange(swing.chestTurn, TARGET.chestTurn) && inRange(swing.pelvisTurn, TARGET.pelvisTurn);
  const xOk = inRange(xFactor(swing), TARGET.xFactor);
  const weightBad = swing.weightLead < TARGET.weightLead[0];
  return (
    <g className="font-mono" fontSize="10">
      {phase === "top" && (
        <>
          <text x="300" y="120" fill={turnOk ? OK : BAD}>CHEST {swing.chestTurn}° · PELVIS {swing.pelvisTurn}°</text>
          <text x="300" y="134" fill={xOk ? OK : BAD}>X-FACTOR {xFactor(swing)}°</text>
          <text x="60" y="226" fill={swayBad ? BAD : OK}>SWAY {swing.pelvisSway.toFixed(1)} CM</text>
          <text x="60" y="56" fill={headBad ? BAD : OK}>HEAD {swing.headMove.toFixed(1)} CM</text>
        </>
      )}
      {phase === "impact" && (
        <>
          <text x="300" y="120" fill={weightBad ? BAD : OK}>WEIGHT ON LEAD {swing.weightLead}%</text>
          <text x="60" y="56" fill={headBad ? BAD : OK}>HEAD {swing.headMove.toFixed(1)} CM</text>
        </>
      )}
      {phase === "address" && <text x="300" y="120" fill={OK}>SETUP · FACE-ON</text>}
    </g>
  );
}

function DtlGuides({ swing, phase }: { swing: Swing; phase: Phase }) {
  const thrustBad = swing.pelvisThrust > TARGET.pelvisThrust[1];
  const a = (swing.spineAddr * Math.PI) / 180;
  const x2 = ADDR_HIP[0] + 92 * Math.sin(a);
  const y2 = ADDR_HIP[1] - 92 * Math.cos(a);
  return (
    <g strokeDasharray="3 3" fill="none">
      {/* hip line: the back of the hips at address */}
      <line x1={HIP_LINE_X} y1="96" x2={HIP_LINE_X} y2="238" stroke={(phase === "impact" || phase === "finish") && thrustBad ? BAD : "rgb(255 255 255 / 0.3)"} />
      {/* spine line at address */}
      {phase !== "address" && <line x1={ADDR_HIP[0]} y1={ADDR_HIP[1]} x2={x2} y2={y2} stroke="rgb(255 255 255 / 0.3)" />}
      {/* swing plane at address: ball to the base of the neck */}
      {phase !== "finish" && <line x1="310" y1="235" x2="150" y2="40" stroke="rgb(255 255 255 / 0.12)" />}
    </g>
  );
}

function DtlLabels({ swing, phase, ball }: { swing: Swing; phase: Phase; ball: boolean }) {
  const lostBad = spineLost(swing) > TARGET.spineLost[1];
  const thrustBad = swing.pelvisThrust > TARGET.pelvisThrust[1];
  const pathBad = !inRange(swing.clubPath, TARGET.clubPath);
  const setupBad = !inRange(swing.spineAddr, TARGET.spineAddr);
  return (
    <g className="font-mono" fontSize="10">
      {phase === "address" && <text x="300" y="120" fill={setupBad ? BAD : OK}>SPINE {swing.spineAddr}° FORWARD</text>}
      {phase === "top" && (
        <>
          <text x="300" y="120" fill={OK}>SPINE {swing.spineAddr - 1}°</text>
          <text x="300" y="134" fill={Math.abs(swing.leadWristTop) > 8 ? BAD : OK}>LEAD WRIST {swing.leadWristTop > 0 ? "+" : ""}{swing.leadWristTop}° {swing.leadWristTop > 0 ? "CUPPED" : "FLAT"}</text>
        </>
      )}
      {phase === "impact" && (
        <>
          <text x="300" y="106" fill={lostBad ? BAD : OK}>SPINE {swing.spineAddr}° → {swing.spineImpact}°</text>
          <text x="300" y="120" fill={thrustBad ? BAD : OK}>HIPS +{swing.pelvisThrust.toFixed(1)} CM TO BALL</text>
          {ball && (
            <>
              <text x="300" y="134" fill={pathBad ? BAD : OK}>PATH {swing.clubPath > 0 ? "+" : ""}{swing.clubPath.toFixed(1)}° {swing.clubPath < 0 ? "OUT-TO-IN" : "IN-TO-OUT"}</text>
              <PathArrow path={swing.clubPath} bad={pathBad} />
            </>
          )}
        </>
      )}
    </g>
  );
}

/* The club's path through the ball, seen from above the line: drawn at the ball. */
function PathArrow({ path, bad }: { path: number; bad: boolean }) {
  const a = (path * 4 * Math.PI) / 180; // exaggerated so a few degrees read
  const len = 34;
  const cx = 310;
  const cy = 252;
  const dx = len * Math.cos(a);
  const dy = len * Math.sin(a);
  return (
    <g stroke={bad ? BAD : OK} fill="none" strokeWidth="1.6">
      <line x1={cx - dx} y1={cy + dy} x2={cx + dx} y2={cy - dy} />
      <path d={`M${cx + dx} ${cy - dy} l-7 -3 m7 3 l-4 6`} />
    </g>
  );
}

/* ── Drawing layer ───────────────────────────────────────────────────── */

export type Tool = "none" | "line" | "angle";
export type Mark = { kind: "line" | "angle"; pts: Pt[] };

function angleAt(a: Pt, b: Pt, c: Pt) {
  const v1 = [a[0] - b[0], a[1] - b[1]];
  const v2 = [c[0] - b[0], c[1] - b[1]];
  const cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]) || 1);
  return Math.round((Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI);
}

/** The coach's lines and angles over the frame. Click to place points: two for a line, three for an angle (the middle one is the vertex). */
export function DrawLayer({ tool, marks, onAdd }: { tool: Tool; marks: Mark[]; onAdd: (m: Mark) => void }) {
  const [draft, setDraft] = React.useState<Pt[]>([]);
  const [prevTool, setPrevTool] = React.useState(tool);
  if (prevTool !== tool) {
    setPrevTool(tool);
    setDraft([]);
  }
  const need = tool === "line" ? 2 : 3;
  function click(e: React.MouseEvent<SVGRectElement>) {
    if (tool === "none") return;
    const svg = e.currentTarget.ownerSVGElement!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const next = [...draft, [Math.round(p.x), Math.round(p.y)] as Pt];
    if (next.length >= need) {
      onAdd({ kind: tool, pts: next });
      setDraft([]);
    } else setDraft(next);
  }
  const all: Mark[] = [...marks, ...(draft.length ? [{ kind: tool === "angle" ? "angle" : "line", pts: draft } as Mark] : [])];
  return (
    <g>
      <rect width="480" height="270" fill="transparent" onClick={click} className={tool === "none" ? "pointer-events-none" : "cursor-crosshair"} />
      <g className="pointer-events-none" stroke="var(--primary)" strokeWidth="1.8" fill="none">
        {all.map((m, i) => (
          <g key={i}>
            <polyline points={m.pts.map((p) => p.join(",")).join(" ")} />
            {m.pts.map((p, j) => <circle key={j} cx={p[0]} cy={p[1]} r="3" fill="var(--primary)" stroke="none" />)}
            {m.kind === "angle" && m.pts.length === 3 && (
              <text x={m.pts[1][0] + 8} y={m.pts[1][1] - 8} fill="var(--primary)" stroke="none" fontSize="12" fontWeight="700" className="font-mono">
                {angleAt(m.pts[0], m.pts[1], m.pts[2])}°
              </text>
            )}
          </g>
        ))}
      </g>
    </g>
  );
}

/* ── Shot dispersion ─────────────────────────────────────────────────── */

const X_SPAN = 30; // yards either side of the target line
const Y_MIN = 120;
const Y_MAX = 175;

/** Where each ball landed, seen from above: carry up the page, left/right of the target line across it. */
export function Dispersion({ swings, focus, onSelect, className }: { swings: Swing[]; focus: number; onSelect: (n: number) => void; className?: string }) {
  const W = 120;
  const H = 120;
  const x = (yd: number) => ((yd + X_SPAN) / (X_SPAN * 2)) * W;
  const y = (carry: number) => H - ((carry - Y_MIN) / (Y_MAX - Y_MIN)) * H;
  const avg = swings.reduce((a, s) => a + s.carry, 0) / swings.length;
  return (
    <svg viewBox={`-10 -4 ${W + 16} ${H + 16}`} className={cn("block size-full", className)} role="img" aria-label="Shot dispersion from above">
      <rect x="0" y="0" width={W} height={H} rx="3" fill="var(--success)" fillOpacity="0.05" stroke="var(--border)" vectorEffect="non-scaling-stroke" />
      {[130, 140, 150, 160, 170].map((c) => (
        <g key={c}>
          <line x1="0" x2={W} y1={y(c)} y2={y(c)} stroke="var(--border)" strokeOpacity="0.6" vectorEffect="non-scaling-stroke" />
          <text x="-2" y={y(c) + 1.4} textAnchor="end" fontSize="4" fill="var(--muted-foreground)" className="font-mono">{c}</text>
        </g>
      ))}
      <line x1={x(0)} x2={x(0)} y1="0" y2={H} stroke="var(--foreground)" strokeOpacity="0.5" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
      <line x1="0" x2={W} y1={y(avg)} y2={y(avg)} stroke="var(--primary)" strokeOpacity="0.7" strokeDasharray="3 2" vectorEffect="non-scaling-stroke" />
      <text x={W - 1} y={y(avg) - 1.5} textAnchor="end" fontSize="4" fill="var(--primary)" className="font-mono">avg {Math.round(avg)}</text>
      <text x={x(-X_SPAN) + 1} y={H + 7} fontSize="4" fill="var(--muted-foreground)" className="font-mono">L {X_SPAN}</text>
      <text x={x(X_SPAN) - 1} y={H + 7} textAnchor="end" fontSize="4" fill="var(--muted-foreground)" className="font-mono">R {X_SPAN}</text>
      <text x={x(0)} y={H + 7} textAnchor="middle" fontSize="4" fill="var(--muted-foreground)" className="font-mono">target</text>
      {swings.map((s) => {
        const shape = shapeOf(s);
        const fill = shape === "Slice" || shape === "Hook" ? "var(--sev-critical)" : shape === "Fade" || shape === "Draw" ? "var(--info)" : "var(--success)";
        const active = s.n === focus;
        return (
          <g key={s.n} transform={`translate(${x(s.offline)} ${y(s.carry)})`} role="button" tabIndex={0} className="cursor-pointer outline-none"
            aria-label={`Swing ${s.n}: ${s.carry} yards, ${Math.abs(s.offline)} ${s.offline >= 0 ? "right" : "left"}, ${shape}`}
            onClick={() => onSelect(s.n)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(s.n)}>
            <title>{`Swing ${s.n} · ${s.carry} yd · ${Math.abs(s.offline)} yd ${s.offline >= 0 ? "right" : "left"} · ${shape}`}</title>
            {active && <circle r="5.2" fill="none" stroke="var(--foreground)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />}
            <circle r="3.4" fill={fill} stroke="var(--card)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <text y="1.3" textAnchor="middle" fontSize="3.6" fontWeight="700" fill="var(--primary-foreground)" className="pointer-events-none font-mono">{s.n}</text>
          </g>
        );
      })}
    </svg>
  );
}
