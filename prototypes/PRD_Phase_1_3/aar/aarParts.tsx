import { cn } from "@/lib/utils";
import { FLINCH_LIMIT_MM, SESSION, SETTLE_LIMIT_MM, SHOTS, flinched, swayPath, type Shot, type SwayWindow } from "./aarSession";

/* Drawn pieces of the AAR dashboard. */

/* ── Posture tracking frame ──────────────────────────────────────────── */

/* The lane's side camera with the pose read off it, after the Marksmanship AAR
   report: the prone firer, the keypoints (green when the position is right, red
   where it breaks down), the stance angles, and a sight-picture inset with the
   aim estimated at the break from muzzle direction and impact. */
const OK = "var(--success)";
const BAD = "var(--sev-critical)";
const HUD = "rgb(255 255 255 / 0.62)";

export function PostureFrame({ shot, live, clock, className }: { shot: Shot; live?: boolean; clock: string; className?: string }) {
  const p = shot.posture;
  const bodyBad = p.bodyOffDeg > 6;
  const legsBad = Math.abs(p.legsOpenDeg - 35) > 5;
  const elbowBad = !p.elbowsSet;
  const holdBad = shot.hold < 80;
  const flinchBad = flinched(shot);

  const head: [number, number] = bodyBad ? [343, 152] : [345, 164];
  const elb: [number, number] = elbowBad ? [354, 214] : [345, 206];
  const muzzle: [number, number] = bodyBad ? [458, 184] : [460, 170];
  const kp = { ankle: [70, 205], knee: [135, 200], hip: [200, 195], sh: [312, 180], elb, wr: [385, 182], fe: [298, 207], fw: [326, 186], head } as Record<string, [number, number]>;
  const bad = new Set<string>([...(legsBad ? ["ankle", "knee"] : []), ...(elbowBad ? ["elb", "wr"] : []), ...(bodyBad ? ["hip", "sh", "head"] : [])]);
  const bones = [["ankle", "knee"], ["knee", "hip"], ["hip", "sh"], ["sh", "elb"], ["elb", "wr"], ["sh", "fe"], ["fe", "fw"], ["sh", "head"]];
  // Sight picture: the shot's offset from aim, at the inset's scale (±25 mm → ±30 px).
  const ret = [Math.max(-30, Math.min(30, shot.x * 1.2)), Math.max(-30, Math.min(30, -shot.y * 1.2))];

  return (
    <svg viewBox="0 0 480 270" preserveAspectRatio="xMidYMid meet" className={cn("block size-full bg-camera-feed", className)} role="img"
      aria-label={`Side camera, shot ${shot.n}: body ${p.bodyOffDeg}° off line, legs ${p.legsOpenDeg}°, elbows ${p.elbowsSet ? "set" : "not set"}`}>
      <defs>
        <pattern id="aar-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="rgb(255 255 255 / 0.05)" />
        </pattern>
      </defs>
      <rect width="480" height="270" fill="url(#aar-grid)" />
      <rect y="214" width="480" height="56" fill="rgb(255 255 255 / 0.03)" />
      <line x1="0" y1="214" x2="480" y2="214" stroke="rgb(255 255 255 / 0.1)" />

      {/* prone firer */}
      <g stroke="rgb(255 255 255 / 0.16)" strokeLinecap="round" fill="none">
        <line x1="70" y1="205" x2="200" y2="195" strokeWidth="22" />
        <line x1="200" y1="195" x2="312" y2="182" strokeWidth="34" />
        <line x1="312" y1="182" x2={elb[0]} y2={elb[1]} strokeWidth="12" />
        <line x1={elb[0]} y1={elb[1]} x2="385" y2="182" strokeWidth="11" />
        <line x1="312" y1="186" x2="298" y2="207" strokeWidth="12" />
        <line x1="298" y1="207" x2="326" y2="186" strokeWidth="11" />
      </g>
      <circle cx={head[0]} cy={head[1]} r="15" fill="rgb(255 255 255 / 0.16)" />
      <line x1="300" y1="176" x2={muzzle[0]} y2={muzzle[1]} stroke="rgb(255 255 255 / 0.3)" strokeWidth="7" strokeLinecap="round" />

      {/* pose keypoints */}
      {bones.map(([a, b]) => (
        <line key={a + b} x1={kp[a][0]} y1={kp[a][1]} x2={kp[b][0]} y2={kp[b][1]} stroke={bad.has(a) || bad.has(b) ? BAD : OK} strokeWidth="2" />
      ))}
      {Object.entries(kp).map(([k, [x, y]]) => (
        <circle key={k} cx={x} cy={y} r="4.5" fill={bad.has(k) ? BAD : OK} stroke="rgb(0 0 0 / 0.7)" strokeWidth="1.5" />
      ))}

      {/* measurements */}
      <g className="font-mono" fontSize="10">
        <line x1="135" y1="200" x2="120" y2="150" stroke={legsBad ? BAD : OK} />
        <text x="60" y="144" fill={legsBad ? BAD : OK}>LEGS OPEN · {p.legsOpenDeg}°</text>
        <line x1={elb[0]} y1={elb[1]} x2="250" y2="244" stroke={elbowBad ? BAD : OK} />
        <text x="150" y="256" fill={elbowBad ? BAD : OK}>{elbowBad ? "ELBOW OFF THE GROUND" : "ELBOWS SET"}</text>
        <line x1="200" y1="195" x2="200" y2="96" stroke={bodyBad ? BAD : OK} strokeDasharray="3 3" />
        <text x="150" y="90" fill={bodyBad ? BAD : OK}>BODY {p.bodyOffDeg}° OFF LINE</text>
        <text x="342" y="232" fill={holdBad ? BAD : OK}>HOLD {shot.hold}/100</text>
        <text x="342" y="246" fill={flinchBad ? BAD : OK}>
          {shot.flinchMm === null ? "FLINCH · NOT MEASURED" : flinchBad ? `FLINCH · ${shot.flinchMm.toFixed(1)} MM` : "FLINCH · NONE"}
        </text>
      </g>

      {/* HUD */}
      <g className="font-mono" fontSize="10" fill={HUD}>
        <text x="12" y="20">{live ? "● LIVE" : "● REC"}  {SESSION.lane.toUpperCase()} · CAM 2 · POSE</text>
        <text x="12" y="34">{clock} · SHOT {shot.n} / {SHOTS.length}</text>
      </g>

      {/* sight picture at the break */}
      <g transform="translate(424 58)">
        <circle r="40" fill="rgb(0 0 0 / 0.6)" stroke={HUD} strokeWidth="1.2" />
        <circle r="16" fill="none" stroke="rgb(255 255 255 / 0.18)" strokeWidth="5" />
        <circle r="7" fill="rgb(255 255 255 / 0.14)" />
        {/* uncertainty in the estimated aim (dashed ring) */}
        <circle cx={ret[0]} cy={ret[1]} r="9" fill="none" stroke={HUD} strokeWidth="1" strokeDasharray="2 2" />
        <g transform={`translate(${ret[0]} ${ret[1]})`} stroke={flinchBad || shot.hold < 60 ? BAD : OK} strokeWidth="1.2">
          <line x1="-30" y1="0" x2="-5" y2="0" /><line x1="5" y1="0" x2="30" y2="0" /><line x1="0" y1="5" x2="0" y2="30" />
          <circle r="1.6" fill={flinchBad || shot.hold < 60 ? BAD : OK} />
        </g>
        <text y="54" textAnchor="middle" className="font-mono" fontSize="9" fill={HUD}>EST. AIM @ BREAK</text>
      </g>
      {flinchBad && <title>{`Flinch over ${FLINCH_LIMIT_MM} mm`}</title>}
    </svg>
  );
}

/* ── Wobble bubble ───────────────────────────────────────────────────── */

const SPAN = 12; // ±mm shown in each plot

/** One window of the wobble bubble: the sway path and its 95% ellipse before
    the shot, the flinch at the break, or the path the muzzle took after it.
    Sized by its container, so a row of them fits whatever height is left. */
export function WobblePlot({ shot, w }: { shot: Shot; w: SwayWindow }) {
  const pts = swayPath(shot, w);
  const before = w.rms !== undefined;
  const atShot = w.t === 0;
  const bad = atShot ? (shot.flinchMm ?? 0) > FLINCH_LIMIT_MM : !before && (w.offAimMm ?? 0) > SETTLE_LIMIT_MM;
  const color = bad ? "var(--sev-critical)" : before ? "var(--info)" : "var(--primary)";
  const scale = 40 / SPAN;
  const d = pts.map((p, i) => `${i ? "L" : "M"}${(p.x * scale).toFixed(1)} ${(-p.y * scale).toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];

  const label = before ? `${w.t} s` : atShot ? "At shot" : `+${w.t} s`;
  const detail = before
    ? `ring ${w.ringMm?.toFixed(1)} mm`
    : atShot
      ? shot.flinchMm === null
        ? "not measured"
        : `${bad ? "flinch " : ""}${shot.flinchMm.toFixed(1)} mm`
      : `${w.offAimMm?.toFixed(1)} mm off`;

  return (
    <div className={cn("flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-md border bg-background p-1", bad ? "border-sev-critical/40" : "border-border")}>
      <span className="font-mono text-3xs font-semibold text-foreground">{label}</span>
      <span className={cn("truncate font-mono text-3xs", bad ? "text-sev-critical" : "text-muted-foreground")}>{detail}</span>
      <svg viewBox="-44 -44 88 88" className="block min-h-0 w-full flex-1" role="img" aria-label={`${label}: ${detail}`}>
        {[10, 20, 30, 40].map((r) => (
          <circle key={r} r={r} fill="none" stroke="var(--border)" strokeOpacity={r === 40 ? 1 : 0.6} />
        ))}
        <line x1="-44" x2="44" y1="0" y2="0" stroke="var(--border)" strokeDasharray="2 2" />
        <line y1="-44" y2="44" x1="0" x2="0" stroke="var(--border)" strokeDasharray="2 2" />
        {before && w.ringMm !== undefined && (
          <ellipse rx={(w.ringMm / 2) * scale} ry={(w.ringMm / 2) * 0.42 * scale} transform="rotate(-37)" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1.2" />
        )}
        {atShot && <circle r={FLINCH_LIMIT_MM * scale} fill="none" stroke="var(--sev-critical)" strokeOpacity="0.6" strokeDasharray="3 2" />}
        <path d={d} fill="none" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
        <circle cx={last.x * scale} cy={-last.y * scale} r="2.4" fill={color} stroke="var(--card)" />
      </svg>
    </div>
  );
}
