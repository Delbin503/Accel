import { cn } from "@/lib/utils";
import { FLINCH_LIMIT_MM, SESSION, SETTLE_LIMIT_MM, SHOTS, fmtClip, isHit, swayPath, type Shot, type SwayWindow } from "./aarSession";

/* Drawn pieces of the AAR dashboard: the side-camera frame with its tracking
   boxes, one wobble-bubble plot, and the shot chip used to pick a shot. */

/* ── Video & tracking frame ──────────────────────────────────────────── */

/* Side camera on the lane at the moment the selected shot broke. The main box
   tracks the firer; the inset is the PTZ close-up on the rifle. */
export function TrackingFrame({ shot, className }: { shot: Shot; className?: string }) {
  const fault = shot.cues.posture || shot.cues.shoulder;
  const box = fault ? "var(--sev-critical)" : "var(--success)";
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-camera-feed", className)}>
      <svg viewBox="0 0 480 270" className="block h-auto w-full" role="img" aria-label={`Side camera, shot ${shot.n}`}>
        {/* back wall, floor, lane markings */}
        <rect width="480" height="150" fill="var(--muted-foreground)" fillOpacity="0.1" />
        <rect y="150" width="480" height="120" fill="var(--muted-foreground)" fillOpacity="0.05" />
        <line x1="0" y1="150" x2="480" y2="150" stroke="var(--muted-foreground)" strokeOpacity="0.3" />
        {[60, 170, 280].map((x) => (
          <line key={x} x1={x} y1="150" x2={x - 40} y2="270" stroke="var(--muted-foreground)" strokeOpacity="0.15" />
        ))}
        {/* range staff standing behind the line */}
        <g fill="var(--muted-foreground)" fillOpacity="0.28">
          <circle cx="62" cy="58" r="9" />
          <rect x="52" y="68" width="20" height="44" rx="5" />
          <rect x="54" y="110" width="7" height="36" rx="3" />
          <rect x="63" y="110" width="7" height="36" rx="3" />
        </g>
        {/* prone firer */}
        <g fill="var(--muted-foreground)" fillOpacity="0.38">
          <ellipse cx="150" cy="196" rx="62" ry="12" />
          <circle cx="216" cy="184" r="10" />
          <rect x="196" y="186" width="34" height="9" rx="4" />
        </g>
        <line x1="208" y1="188" x2="284" y2="180" stroke="var(--muted-foreground)" strokeOpacity="0.6" strokeWidth="4" strokeLinecap="round" />
        {/* tracking box + muzzle point */}
        <rect x="86" y="164" width="206" height="48" fill="none" stroke={box} strokeWidth="1.5" />
        <text x="88" y="159" className="font-mono" fontSize="9" fill={box}>FIRER · {fault ? "FAULT" : "TRACKED"}</text>
        <circle cx="284" cy="180" r="4" fill="none" stroke="var(--primary)" strokeWidth="1.5" />
        {/* HUD */}
        <g className="font-mono" fontSize="9" fill="var(--muted-foreground)">
          <text x="10" y="262">{SESSION.lane.toUpperCase()} · SIDE · SHOT {shot.n}/{SHOTS.length}</text>
          <text x="470" y="262" textAnchor="end">{fmtClip(shot.at)} / {fmtClip(SESSION.clipLength)} | running {SESSION.running}</text>
        </g>
      </svg>

      {/* PTZ close-up */}
      <div className="absolute right-2 top-2 w-[34%] overflow-hidden rounded border border-border bg-camera-feed">
        <svg viewBox="0 0 160 110" className="block h-auto w-full" aria-hidden>
          <rect width="160" height="110" fill="var(--muted-foreground)" fillOpacity="0.12" />
          <ellipse cx="40" cy="86" rx="46" ry="18" fill="var(--muted-foreground)" fillOpacity="0.35" />
          <circle cx="70" cy="58" r="14" fill="var(--muted-foreground)" fillOpacity="0.4" />
          <line x1="58" y1="70" x2="158" y2="52" stroke="var(--muted-foreground)" strokeOpacity="0.7" strokeWidth="7" strokeLinecap="round" />
          <rect x="44" y="40" width="46" height="40" fill="none" stroke={shot.cues.shoulder ? "var(--sev-critical)" : "var(--success)"} strokeWidth="1.5" />
          <text x="6" y="12" className="font-mono" fontSize="8" fill="var(--muted-foreground)">PTZ · RIFLE</text>
        </svg>
      </div>
    </div>
  );
}

/* ── Wobble bubble ───────────────────────────────────────────────────── */

const SPAN = 12; // ±mm shown in each plot

/** One window of the wobble bubble: the sway path and its 95% ellipse before
    the shot, the flinch at the break, or the path the muzzle took after it. */
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
    ? `RMS ${w.rms?.toFixed(1)} · ring ${w.ringMm?.toFixed(1)} mm`
    : atShot
      ? shot.flinchMm === null
        ? "Not measured"
        : `${bad ? "FLINCH " : ""}${shot.flinchMm.toFixed(1)} mm up`
      : `ends ${w.offAimMm?.toFixed(1)} mm off aim`;

  return (
    <div className={cn("flex min-w-0 flex-col gap-1 rounded-lg border bg-background p-2", bad ? "border-sev-critical/40" : "border-border")}>
      <span className="font-mono text-2xs font-semibold text-foreground">{label}</span>
      <span className={cn("truncate font-mono text-3xs", bad ? "text-sev-critical" : "text-muted-foreground")}>{detail}</span>
      <svg viewBox="-44 -44 88 88" className="block aspect-square w-full" role="img" aria-label={`${label}: ${detail}`}>
        {[10, 20, 30, 40].map((r) => (
          <circle key={r} r={r} fill="none" stroke="var(--border)" strokeOpacity={r === 40 ? 1 : 0.6} />
        ))}
        <line x1="-44" x2="44" y1="0" y2="0" stroke="var(--border)" strokeDasharray="2 2" />
        <line y1="-44" y2="44" x1="0" x2="0" stroke="var(--border)" strokeDasharray="2 2" />
        {before && w.ringMm !== undefined && (
          <ellipse
            rx={(w.ringMm / 2) * scale}
            ry={(w.ringMm / 2) * 0.42 * scale}
            transform="rotate(-37)"
            fill={color}
            fillOpacity="0.12"
            stroke={color}
            strokeWidth="1.2"
          />
        )}
        {atShot && <circle r={FLINCH_LIMIT_MM * scale} fill="none" stroke="var(--sev-critical)" strokeOpacity="0.6" strokeDasharray="3 2" />}
        <path d={d} fill="none" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
        <circle cx={last.x * scale} cy={-last.y * scale} r="2.4" fill={color} stroke="var(--card)" />
      </svg>
    </div>
  );
}

/* ── Shot chip ───────────────────────────────────────────────────────── */

export function ShotChip({ shot, active, onClick }: { shot: Shot; active?: boolean; onClick?: () => void }) {
  const hit = isHit(shot);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Shot ${shot.n}${hit ? "" : ", miss"}`}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-full border font-mono text-xs font-bold transition-colors duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-foreground bg-foreground text-background"
          : hit
            ? "border-border bg-background text-foreground hover:border-primary/50"
            : "border-sev-critical/40 bg-sev-critical/15 text-sev-critical hover:border-sev-critical"
      )}
    >
      {shot.n}
    </button>
  );
}
