import * as React from "react";
import { toast } from "sonner";
import {
  CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  ChevronLeft, ChevronRight, CircleCheck, CircleX, Crosshair, Dumbbell, FileDown, Info, Maximize2, Pause, Play,
  RotateCcw, RotateCw, Share2, TrendingDown, TrendingUp, Video,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { KpiCard, KpiGrid } from "@/components/shared/KpiCard";
import laneCctv from "@/assets/live-monitoring/warehouse-aisle.webp";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  CLICK_MM, CUES, FIRER, FLINCH_LIMIT_MM, MISS_MM, PREVIOUS, RANKED_RECS, RING_MM, SESSION, SESSION_INFO,
  SETTLE_LIMIT_MM, SHOTS, STATS, WOBBLE_LIMIT_MM, WORKING_WELL, breathingSeries, firedInPause, flinchSeries,
  flinched, fmtClip, isHit, points, radius, recoilSeries, settled, sightAdvice, wobbleSeries, wobbled,
  type BreathPhase, type Shot,
} from "./aarSession";
import { WobblePlot } from "./aarParts";

/* AAR — the Firer AAR results for one indoor-range session, once shooting has
   finished. It reads top-down: the verdict (who fired, the score, the trend and
   the biggest fault), then the session as a whole (footage, target, ranked
   recommendations), then Shot analysis, where every panel — recoil, event
   markers, breathing, stability, flinch and the wobble bubble — follows the
   shot picked on the target board. */

const TOOLTIP_STYLE = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 };
const AXIS = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false } as const;

const BREATH_LABEL: Record<BreathPhase, string> = { pause: "Natural pause", inhale: "Inhale", exhale: "Exhale" };

/* The three time charts share one window and one hover line, so a moment in
   one chart can be read off the others. */
const SHOT_WINDOW: [number, number] = [-8, 1];
const SHOT_TICKS = [-8, -6, -4, -2, 0, 1];
const SYNC = { syncId: "aar-shot", syncMethod: "value" } as const;
const inWindow = <T extends { t: number }>(d: T[]) => d.filter((p) => p.t >= SHOT_WINDOW[0] && p.t <= SHOT_WINDOW[1]);

/** A small ⓘ that explains a metric on hover. */
function InfoTip({ text }: { text: string }) {
  return (
    <UiTooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={text} className="inline-flex text-muted-foreground/70 transition-colors hover:text-foreground">
          <Info className="size-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-xs leading-snug">{text}</TooltipContent>
    </UiTooltip>
  );
}

const shotByN = (n: number) => SHOTS.find((s) => s.n === n)!;

function scrollToPanel(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const PANEL_ID: Record<string, string> = {
  Breathing: "aar-breathing",
  "Flinch Indicator": "aar-flinch",
  "Stability / Wobble": "aar-stability",
  "Wobble Bubble": "aar-wobble",
};

/* ── Page ────────────────────────────────────────────────────────────── */

export function AarDashboard() {
  /* The last shot is selected first — it's the one the session ended on. */
  const [selected, setSelected] = React.useState(SHOTS[SHOTS.length - 1].n);
  const shot = shotByN(selected);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>After Action Review</PageHeader.Title>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success(`Shared with the ${SESSION_INFO.instructor.toLowerCase()}`, { description: `${FIRER.name} · ${SESSION_INFO.date}` })}
          >
            <Share2 className="size-4" />
            Share
          </Button>
          <Button size="sm" onClick={() => toast.success("Report exported", { description: `AAR_${FIRER.id}_${SESSION.lane.replace(" ", "")}.pdf` })}>
            <FileDown className="size-4" />
            Export PDF
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* The results and the firer on the left, what to fix on the right */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="flex flex-col gap-4 xl:col-span-7">
          <VerdictCard />
          <SessionKpis />
        </div>
        {/* Laid over its grid cell, so the left column alone sets the row height and the list scrolls inside. */}
        <div className="relative xl:col-span-5">
          <KeyRecommendations className="flex max-h-[640px] flex-col xl:absolute xl:inset-0 xl:max-h-none" onSelect={setSelected} />
        </div>
      </div>

      {/* The session footage beside where the shots landed */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <SessionFootage className="xl:col-span-7" shot={shot} onSelect={setSelected} />
        <TargetBoard className="xl:col-span-5" shot={shot} onSelect={setSelected} />
      </div>

      {/* Shot by shot — everything below follows the shot picked on the target board */}
      <ShotAnalysisHeading shot={shot} />
      <SelectedShot shot={shot} onSelect={setSelected} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <RecoilMuzzle className="lg:col-span-7" shot={shot} />
        <EventMarkers className="lg:col-span-5" selected={selected} onSelect={setSelected} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Breathing shot={shot} />
        <Stability shot={shot} />
        <FlinchIndicator shot={shot} />
      </div>

      <WobbleAndSummary shot={shot} selected={selected} onSelect={setSelected} />
    </div>
  );
}

/* ── Session KPIs ────────────────────────────────────────────────────── */

/* The six results as KPI cards, each against the firer's previous session. */
function SessionKpis() {
  const score: { label: string; value: string; tone?: string; info: string; now: number; before: number; lowerIsBetter: boolean; unit: string }[] = [
    { label: "Points", value: `${STATS.points} / ${STATS.maxPoints}`, tone: "text-success", info: `Up to ${10} a shot, by distance from the aim point.`, now: STATS.points, before: PREVIOUS.points, lowerIsBetter: false, unit: "" },
    { label: "Hits", value: `${STATS.hits} / ${STATS.shots}`, info: `Shots inside the ${MISS_MM} mm scoring area.`, now: STATS.hits, before: STATS.shots - PREVIOUS.misses, lowerIsBetter: false, unit: "" },
    { label: "Missed", value: String(STATS.misses), tone: STATS.misses ? "text-sev-critical" : undefined, info: `Shots outside ${MISS_MM} mm of the aim point.`, now: STATS.misses, before: PREVIOUS.misses, lowerIsBetter: true, unit: "" },
    { label: "Mean radius", value: `${STATS.meanRadius.toFixed(1)} mm`, info: "Average distance of each shot from the centre of the group. Measures consistency, not aim.", now: STATS.meanRadius, before: PREVIOUS.meanRadius, lowerIsBetter: true, unit: " mm" },
    { label: "CEP (50%)", value: `${STATS.cep50.toFixed(1)} mm`, info: "Circular error probable: the radius of a circle around the group centre that holds half the shots.", now: STATS.cep50, before: PREVIOUS.cep50, lowerIsBetter: true, unit: " mm" },
    { label: "Group size", value: `${STATS.groupMm.toFixed(1)} mm`, info: "Distance between the two shots farthest apart.", now: STATS.groupMm, before: PREVIOUS.groupMm, lowerIsBetter: true, unit: " mm" },
  ];
  const accents: Record<string, "success" | "primary" | "sev-critical" | "info" | "purple" | "warning"> = {
    Points: "success", Hits: "primary", Missed: "sev-critical", "Mean radius": "info", "CEP (50%)": "purple", "Group size": "warning",
  };
  return (
    <KpiGrid cols={3}>
      {score.map((m) => {
        const delta = m.now - m.before;
        const better = m.lowerIsBetter ? delta < 0 : delta > 0;
        const Arrow = delta > 0 ? TrendingUp : TrendingDown;
        return (
          <KpiCard
            key={m.label}
            label={<span className="inline-flex items-center gap-1.5">{m.label}<InfoTip text={m.info} /></span>}
            value={m.value}
            accent={accents[m.label]}
            sub={
              <span className={cn("inline-flex items-center gap-1", delta === 0 ? "text-muted-foreground" : better ? "text-success" : "text-sev-critical")}>
                {delta !== 0 && <Arrow className="size-3" />}
                {delta === 0 ? "Same as" : `${delta > 0 ? "+" : "−"}${Math.abs(delta) % 1 ? Math.abs(delta).toFixed(1) : Math.abs(delta)}${m.unit} vs`} {PREVIOUS.date}
              </span>
            }
          />
        );
      })}
    </KpiGrid>
  );
}

/* ── Verdict ─────────────────────────────────────────────────────────── */

/* Who fired, the result in one sentence, and what to keep doing. */
function VerdictCard({ className }: { className?: string }) {
  const [top, next] = RANKED_RECS;
  const gained = STATS.points - PREVIOUS.points;
  const shotsText = (ns: number[]) => `shot${ns.length === 1 ? "" : "s"} ${ns.join(", ")}`;

  return (
    <div className={cn("flex flex-col overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="flex flex-wrap items-start gap-4 px-5 pb-4 pt-5">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/15 text-md font-bold text-primary">{FIRER.initials}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-lg font-bold text-foreground">{FIRER.name}</p>
            <span className="font-mono text-xs text-muted-foreground">{FIRER.id} · {FIRER.unit}</span>
            <StatusBadge tone="success">Session complete</StatusBadge>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {SESSION_INFO.date} · {SESSION.lane} · {SESSION_INFO.weapon} · {SESSION_INFO.distance}
          </p>
          <p className="mt-3 max-w-4xl text-md leading-relaxed text-foreground">
            <strong className="font-bold">{STATS.points}/{STATS.maxPoints}</strong> with {STATS.misses} miss{STATS.misses === 1 ? "" : "es"}
            {gained !== 0 && <>, {gained > 0 ? "up" : "down"} {Math.abs(gained)} on {PREVIOUS.date}</>}.{" "}
            {top && (
              <>
                The biggest loss is <strong className="font-bold">{top.short}</strong> ({shotsText(top.shots)})
                {next && <>, then {next.short} ({shotsText(next.shots)})</>}.
              </>
            )}
          </p>
        </div>
      </div>
      {WORKING_WELL.length > 0 && (
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border bg-success/[0.04] px-5 py-3">
          <span className="text-2xs font-bold uppercase tracking-widest text-success">Keep doing</span>
          {WORKING_WELL.map((w) => (
            <span key={w} className="flex items-center gap-1.5 text-sm text-foreground">
              <CircleCheck className="size-4 shrink-0 text-success" />
              {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Session footage ─────────────────────────────────────────────────── */

const SPEEDS = [0.5, 1, 2] as const;
const STEP_SEC = 5;

/* The session clip in the Live Monitoring player style: the side-camera frame,
   a Playback tag, the camera chip, and a bottom bar with transport and a
   scrubber carrying every shot. It follows the selected shot — picking a shot jumps
   the clip to it — and clicking a shot on the scrubber picks that shot. */
function SessionFootage({ className, shot, onSelect }: { className?: string; shot: Shot; onSelect: (n: number) => void }) {
  const frameRef = React.useRef<HTMLDivElement>(null);
  const [t, setT] = React.useState(shot.at);
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState<(typeof SPEEDS)[number]>(1);
  // Follow the selected shot (adjusted during render rather than in an effect).
  const [followed, setFollowed] = React.useState(shot.n);
  if (followed !== shot.n) {
    setFollowed(shot.n);
    setT(shot.at);
  }

  const ended = t >= SESSION.clipLength;
  const running = playing && !ended;
  React.useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setT((v) => Math.min(SESSION.clipLength, v + 0.1 * speed)), 100);
    return () => window.clearInterval(id);
  }, [running, speed]);

  // The frame shows the latest shot the clip has reached.
  const frameShot = [...SHOTS].reverse().find((s) => s.at <= t + 0.05) ?? SHOTS[0];
  const pct = (sec: number) => `${(sec / SESSION.clipLength) * 100}%`;
  const seek = (sec: number) => setT(Math.max(0, Math.min(SESSION.clipLength, sec)));

  function scrubFrom(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - r.left) / r.width) * SESSION.clipLength);
  }

  const meta: [string, string][] = [
    ["Clip length", fmtClip(SESSION.clipLength)],
    ["Analysis mode", SESSION.analysisMode],
    ["Sources", SESSION.sources],
    ["Tracking", `${SESSION.trackingFps} fps`],
  ];
  // Many dropped frames means fast movement (flinch, recoil) may fall between frames.
  const highDrop = SESSION.droppedFrames > 1000;

  return (
    <div className={cn("flex flex-col rounded-xl border border-border bg-card", className)}>
      <div className="flex flex-wrap items-center gap-3 px-5 pb-3 pt-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <Video className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-md font-bold text-foreground">{SESSION.clip}</p>
          <p className="truncate text-sm text-muted-foreground">Indoor range · {SESSION.lane} · side camera</p>
        </div>
      </div>

      {/* Player — same chrome as a Live Monitoring tile */}
      <div className="px-5">
        <div ref={frameRef} className="group relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-camera-feed">
          <CctvFrame shot={frameShot} />

          <div className="absolute left-2 top-2 z-10 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-3xs font-bold uppercase tracking-widest text-white">
              <span className={cn("size-1.5 rounded-full", running ? "animate-pulse bg-primary" : "bg-white/60")} />
              Playback
            </span>
            <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-2xs text-white/90 backdrop-blur-sm">
              Cam-10 · {SESSION.lane} side
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-1 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-2 pb-1.5 pt-8">
            {/* Scrubber with every shot on it */}
            <div
              role="slider"
              tabIndex={0}
              aria-label="Clip position"
              aria-valuemin={0}
              aria-valuemax={SESSION.clipLength}
              aria-valuenow={Number(t.toFixed(1))}
              aria-valuetext={fmtClip(t)}
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); scrubFrom(e); }}
              onPointerMove={(e) => e.buttons === 1 && scrubFrom(e)}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") seek(t - STEP_SEC);
                if (e.key === "ArrowRight") seek(t + STEP_SEC);
              }}
              className="relative h-4 cursor-pointer focus-visible:outline-none"
            >
              <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/20" />
              <div className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary" style={{ width: pct(t) }} />
              {SHOTS.map((s) => (
                <button
                  key={s.n}
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onSelect(s.n)}
                  aria-label={`Shot ${s.n} at ${fmtClip(s.at)}`}
                  title={`Shot ${s.n} · ${fmtClip(s.at)}`}
                  className={cn(
                    "absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-black/60 transition-transform hover:scale-150",
                    s.n === shot.n ? "bg-white" : points(s) === 10 ? "bg-success" : isHit(s) ? "bg-info" : "bg-sev-critical"
                  )}
                  style={{ left: pct(s.at) }}
                />
              ))}
              <div className="pointer-events-none absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow" style={{ left: pct(t) }} />
            </div>

            <div className="flex items-center gap-1 text-white">
              <PlayerButton label={`Back ${STEP_SEC} seconds`} onClick={() => seek(t - STEP_SEC)}><RotateCcw className="size-4" /></PlayerButton>
              <PlayerButton
                label={running ? "Pause" : "Play"}
                onClick={() => {
                  if (ended) setT(0);
                  setPlaying(!running);
                }}
              >
                {running ? <Pause className="size-4" /> : <Play className="size-4" />}
              </PlayerButton>
              <PlayerButton label={`Forward ${STEP_SEC} seconds`} onClick={() => seek(t + STEP_SEC)}><RotateCw className="size-4" /></PlayerButton>
              <span className="ml-1 font-mono text-2xs text-white/85">{fmtClip(t)} / {fmtClip(SESSION.clipLength)}</span>
              <span className="ml-2 hidden font-mono text-2xs text-white/60 sm:inline">Shot {frameShot.n}/{SHOTS.length}</span>
              <button
                type="button"
                onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])}
                aria-label={`Playback speed ${speed}×`}
                className="ml-auto rounded px-1.5 py-0.5 font-mono text-2xs font-semibold text-white/85 hover:bg-white/10"
              >
                {speed}×
              </button>
              <PlayerButton label="Full screen" onClick={() => void frameRef.current?.requestFullscreen?.()}><Maximize2 className="size-4" /></PlayerButton>
            </div>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 pt-4 sm:grid-cols-4">
        {meta.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">{k}</dt>
            <dd className="mt-1 truncate text-sm font-semibold text-foreground" title={v}>{v}</dd>
          </div>
        ))}
      </dl>
      <details className="group px-5 pb-4 pt-3">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
          <ChevronRight className="size-3.5 transition-transform duration-[var(--duration-fast)] group-open:rotate-90" />
          Analysis details
          {highDrop && <StatusBadge tone="warning" dot={false}>High frame drop</StatusBadge>}
        </summary>
        <p className="mt-2 font-mono text-2xs text-muted-foreground">
          loop {SESSION.loop} · running {SESSION.running} · background features {SESSION.backgroundFeatures} · lag {SESSION.lagSec} s · dropped {SESSION.droppedFrames.toLocaleString()}
        </p>
        {highDrop && (
          <p className="mt-1.5 text-xs text-warning">
            {SESSION.droppedFrames.toLocaleString()} frames were dropped, so fast movement can fall between frames. Read the flinch and recoil numbers with care.
          </p>
        )}
      </details>
    </div>
  );
}

/* The lane camera as Live Monitoring shows a feed: the CCTV still scaled past
   its burned-in name and clock (the tile carries its own), a box tracking the
   firer — red when posture or shoulder movement is flagged — and the PTZ
   close-up inset. Box coordinates are in the frame as shown, 0–1. */
const FIRER_BOX = { x0: 0.276, y0: 0.205, x1: 0.382, y1: 0.689 };

function CctvFrame({ shot }: { shot: Shot }) {
  const fault = shot.cues.posture || shot.cues.shoulder;
  const tone = fault ? "border-sev-critical" : "border-success";
  const label = fault ? "bg-sev-critical" : "bg-success";
  return (
    <div className="absolute inset-0">
      <img src={laneCctv} alt={`${SESSION.lane} side camera`} draggable={false} className="absolute inset-0 size-full scale-[1.18] object-cover" />
      <div
        className={cn("absolute border-2", tone)}
        style={{ left: `${FIRER_BOX.x0 * 100}%`, top: `${FIRER_BOX.y0 * 100}%`, width: `${(FIRER_BOX.x1 - FIRER_BOX.x0) * 100}%`, height: `${(FIRER_BOX.y1 - FIRER_BOX.y0) * 100}%` }}
      >
        <span className={cn("absolute -top-5 left-[-2px] whitespace-nowrap rounded-t px-1.5 py-px font-mono text-3xs font-bold text-white", label)}>
          FIRER · {fault ? "FAULT" : "TRACKED"}
        </span>
      </div>
      {/* PTZ close-up on the firer */}
      <div className="absolute right-2 top-2 aspect-video w-[30%] overflow-hidden rounded border border-white/20 shadow-lg">
        <img src={laneCctv} alt="" aria-hidden draggable={false} className="absolute max-w-none" style={{ width: "200%", left: "-21%", top: "-41%" }} />
        <div className={cn("absolute border-2", tone)} style={{ left: "41%", top: "9%", width: "18%", height: "82%" }} />
        <span className="absolute left-1 top-1 rounded bg-black/60 px-1 font-mono text-3xs text-white/90">PTZ · CLOSE-UP</span>
      </div>
    </div>
  );
}

function PlayerButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="grid size-7 place-items-center rounded text-white/90 transition-colors hover:bg-white/10 hover:text-white">
      {children}
    </button>
  );
}

/* ── Target board ────────────────────────────────────────────────────── */

const HALF = 25; // mm either side of the aim point

function TargetBoard({ className, shot, onSelect }: { className?: string; shot: Shot; onSelect: (n: number) => void }) {
  const selected = shot.n;
  const mr = 1.5;
  const advice = sightAdvice();
  const mpi = STATS.mpi;
  const side = (v: number, pos: string, neg: string) => `${Math.abs(v).toFixed(1)} mm ${v >= 0 ? pos : neg}`;

  return (
    <SectionCard
      className={className}
      title="Target Board"
      description={`${STATS.shots} shots · ${RING_MM} mm rings score 10 to 6, outside ${MISS_MM} mm is a miss · pick a shot to review it`}
    >
      <div className="flex flex-col gap-4">
        <div className="mx-auto aspect-square w-full max-w-[320px] shrink-0">
          <svg viewBox={`${-HALF} ${-HALF} ${HALF * 2} ${HALF * 2}`} className="block size-full overflow-hidden rounded-lg" role="img" aria-label={`Target board, ${STATS.hits} hits and ${STATS.misses} miss`}>
            <defs>
              <marker id="aar-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="1.6" markerHeight="1.6" markerUnits="userSpaceOnUse" orient="auto">
                <path d="M0 0 L6 3 L0 6 z" fill="var(--foreground)" />
              </marker>
            </defs>
            <rect x={-HALF} y={-HALF} width={HALF * 2} height={HALF * 2} fill="var(--sev-critical)" fillOpacity="0.05" />
            {[5, 4, 3, 2, 1].map((k) => (
              <circle key={k} r={k * RING_MM} fill="var(--primary)" fillOpacity={0.04 + (6 - k) * 0.03} stroke="var(--border)" vectorEffect="non-scaling-stroke" />
            ))}
            {[5, 4, 3, 2].map((k) => (
              <text key={k} x={(k - 0.5) * RING_MM} y="0.6" textAnchor="middle" className="font-mono" fontSize="1.6" fill="var(--muted-foreground)">{11 - k}</text>
            ))}
            <text x={0.5 * RING_MM} y="0.6" textAnchor="middle" className="font-mono" fontSize="1.6" fill="var(--muted-foreground)">10</text>
            <line x1={-HALF} x2={HALF} y1="0" y2="0" stroke="var(--border)" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
            <line y1={-HALF} y2={HALF} x1="0" x2="0" stroke="var(--border)" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
            <text x={-HALF + 1} y={-HALF + 2.4} className="font-mono" fontSize="1.6" fill="var(--sev-critical)" opacity="0.8">MISS</text>

            {/* half the shots fall inside this circle around the group centre */}
            <circle cx={mpi.x} cy={-mpi.y} r={STATS.cep50} fill="var(--foreground)" fillOpacity="0.04" stroke="var(--foreground)" strokeOpacity="0.5" strokeDasharray="1 1" vectorEffect="non-scaling-stroke" />
            {/* where the group has to move: from its centre to the aim point */}
            <line x1={mpi.x} y1={-mpi.y} x2={0} y2={0} stroke="var(--foreground)" strokeWidth="0.35" strokeDasharray="0.8 0.6" markerEnd="url(#aar-arrow)" />
            <g stroke="var(--foreground)" strokeWidth="1.5">
              <line x1={mpi.x - 1.2} x2={mpi.x + 1.2} y1={-mpi.y} y2={-mpi.y} vectorEffect="non-scaling-stroke" />
              <line x1={mpi.x} x2={mpi.x} y1={-mpi.y - 1.2} y2={-mpi.y + 1.2} vectorEffect="non-scaling-stroke" />
            </g>

            {SHOTS.map((s) => {
              const hit = isHit(s);
              const active = s.n === selected;
              const fill = !hit ? "var(--sev-critical)" : points(s) === 10 ? "var(--success)" : "var(--info)";
              return (
                <g
                  key={s.n}
                  transform={`translate(${s.x} ${-s.y})`}
                  className="cursor-pointer outline-none"
                  role="button"
                  tabIndex={0}
                  aria-label={`Shot ${s.n}: ${hit ? `${points(s)} points` : "miss"}, ${radius(s).toFixed(1)} mm from aim`}
                  onClick={() => onSelect(s.n)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(s.n)}
                >
                  <title>{`Shot ${s.n} · ${hit ? `${points(s)} pts` : "Miss"} · ${radius(s).toFixed(1)} mm`}</title>
                  {active && <circle r={mr * 1.7} fill="none" stroke="var(--foreground)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />}
                  <circle r={mr} fill={fill} stroke="var(--card)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                  <text y={mr * 0.38} textAnchor="middle" fontSize={mr * 1.1} fontWeight="700" fill="var(--primary-foreground)" className="pointer-events-none font-mono">{s.n}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Sight advice from the group centre */}
        <div className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
          <Crosshair className="mt-0.5 size-4 shrink-0 text-foreground" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              {advice.text}
              <InfoTip text={`Moves the group centre onto the aim point. Worked out from all ${STATS.shots} shots at ${CLICK_MM} mm a click (${SESSION_INFO.distance}). A miss pulls the centre, so confirm with a fresh group.`} />
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Group centre is {side(mpi.x, "right", "left")} and {side(mpi.y, "high", "low")} of the aim point.
            </p>
          </div>
        </div>

        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-2xs text-muted-foreground">
          <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-success" />10 points</li>
          <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-info" />Hit, 9 to 6</li>
          <li className="flex items-center gap-2"><span className="size-2 rounded-full bg-sev-critical" />Miss</li>
          <li className="flex items-center gap-2"><span className="size-2.5 rounded-full border border-dashed border-foreground/60" />Half the shots (CEP)</li>
          <li className="flex items-center gap-2"><Crosshair className="size-2.5 text-foreground" />Group centre</li>
        </ul>

      </div>
    </SectionCard>
  );
}

/* ── Recommendations ─────────────────────────────────────────────────── */

function KeyRecommendations({ className, onSelect }: { className?: string; onSelect: (n: number) => void }) {
  return (
    <SectionCard
      className={className}
      title="Key Recommendations"
      description="Ranked by how many points each fault cost a shot. Each comes with a drill for the next session."
      bodyClassName="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-1">
        {RANKED_RECS.map((r, i) => (
          <div key={r.key} className={cn("flex items-start gap-3 rounded-lg border bg-background px-3 py-3", i === 0 ? "border-sev-critical/35" : "border-border")}>
            <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold", i === 0 ? "bg-sev-critical/15 text-sev-critical" : "bg-muted text-muted-foreground")}>{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{r.title}</p>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-sev-critical/30 bg-sev-critical/10 px-1.5 py-0.5 font-mono text-2xs font-semibold text-sev-critical">
                  −{r.cost.toFixed(1)} pts a shot
                  <InfoTip text={`Shots with this fault averaged ${r.withAvg.toFixed(1)} points; shots without it averaged ${r.withoutAvg.toFixed(1)}.`} />
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{r.evidence}</p>
              <p className="mt-2 flex items-start gap-1.5 text-xs text-foreground">
                <Dumbbell className="mt-px size-3.5 shrink-0 text-muted-foreground" />
                <span><span className="font-semibold">Drill:</span> {r.drill}</span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {r.shots.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => onSelect(n)}
                    className="rounded border border-border bg-card px-1.5 py-px font-mono text-2xs text-foreground hover:border-foreground/40"
                  >
                    Shot {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    if (r.shots[0]) onSelect(r.shots[0]);
                    scrollToPanel(PANEL_ID[r.panel]);
                  }}
                  className="ml-auto text-2xs font-semibold text-primary hover:underline"
                >
                  See {r.panel}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ── Shot analysis heading ───────────────────────────────────────────── */

function ShotAnalysisHeading({ shot }: { shot: Shot }) {
  return (
    <div className="mt-4 flex flex-wrap items-end justify-between gap-2 border-t border-border pt-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Shot analysis</h2>
        <p className="text-sm text-muted-foreground">Pick a shot here or on the target board. Every panel below follows it.</p>
      </div>
      <p className="text-sm text-muted-foreground">
        Reviewing <strong className="text-foreground">Shot {shot.n}</strong> · {isHit(shot) ? `${points(shot)} points` : "Miss"} · {fmtClip(shot.at)} into the clip
      </p>
    </div>
  );
}

/* ── Selected shot ───────────────────────────────────────────────────── */

/* The shot picker for Shot analysis: one tab per shot carrying its score, and
   the picked shot's five verdicts beneath. It stays pinned while the panels
   below scroll, so the shot in review is always in view. */
function SelectedShot({ shot, onSelect }: { shot: Shot; onSelect: (n: number) => void }) {
  const idx = SHOTS.indexOf(shot);
  const prev = SHOTS[idx - 1];
  const next = SHOTS[idx + 1];
  const facts: [string, string, boolean][] = [
    ["Result", isHit(shot) ? `${points(shot)} points` : "Miss", isHit(shot)],
    ["Breathing", BREATH_LABEL[shot.breath], firedInPause(shot)],
    ["Wobble", `${shot.wobbleMm.toFixed(1)} mm`, !wobbled(shot)],
    ["Flinch", shot.flinchMm === null ? "n/a" : `${shot.flinchMm.toFixed(1)} mm`, !flinched(shot)],
    ["Settled", settled(shot) ? "Yes" : `${shot.settleMm.toFixed(1)} mm off`, settled(shot)],
  ];
  const passed = facts.filter(([, , ok]) => ok).length;
  return (
    <div className="sticky top-0 z-[var(--z-sticky)] overflow-hidden rounded-xl border border-border bg-card/95 shadow-sm backdrop-blur-sm">
      <div className="flex items-stretch gap-1.5 border-b border-border p-2">
        <Button variant="ghost" size="icon" className="h-auto w-8 shrink-0" disabled={!prev} onClick={() => prev && onSelect(prev.n)} aria-label="Previous shot">
          <ChevronLeft className="size-4" />
        </Button>
        <div role="tablist" aria-label="Shots" className="grid flex-1 grid-cols-3 gap-1.5 sm:grid-cols-6">
          {SHOTS.map((s) => {
            const active = s.n === shot.n;
            const hit = isHit(s);
            return (
              <button
                key={s.n}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelect(s.n)}
                className={cn(
                  "flex flex-col items-center rounded-lg border px-2 py-1.5 transition-colors duration-[var(--duration-fast)]",
                  active ? "border-primary bg-primary/10 text-foreground shadow-[inset_0_0_0_1px_var(--primary)]" : "border-border bg-background hover:border-primary/40"
                )}
              >
                <span className="text-xs font-bold">Shot {s.n}</span>
                <span className={cn("font-mono text-2xs font-semibold", !hit ? "text-sev-critical" : points(s) === 10 ? "text-success" : "text-info")}>
                  {hit ? `${points(s)} pts` : "Miss"}
                </span>
              </button>
            );
          })}
        </div>
        <Button variant="ghost" size="icon" className="h-auto w-8 shrink-0" disabled={!next} onClick={() => next && onSelect(next.n)} aria-label="Next shot">
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <div className="flex flex-col justify-center border-r border-border px-4 py-2.5">
          <dt className="text-2xs font-bold uppercase tracking-widest text-muted-foreground">Shot {shot.n}</dt>
          <dd className={cn("mt-0.5 text-sm font-semibold", passed === facts.length ? "text-success" : "text-foreground")}>
            {passed}/{facts.length} checks passed
          </dd>
        </div>
        {facts.map(([k, v, ok]) => (
          <div key={k} className={cn("relative border-r border-border px-4 py-2.5 last:border-r-0", !ok && "bg-sev-critical/[0.05]")}>
            <span className={cn("absolute inset-x-0 top-0 h-0.5", ok ? "bg-success/60" : "bg-sev-critical")} />
            <dt className="flex items-center gap-1.5 text-2xs text-muted-foreground">
              {ok ? <CircleCheck className="size-3 text-success" aria-label="Pass" /> : <CircleX className="size-3 text-sev-critical" aria-label="Fail" />}
              {k}
            </dt>
            <dd className={cn("mt-0.5 truncate font-mono text-sm font-semibold", ok ? "text-foreground" : "text-sev-critical")}>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ── Recoil & muzzle movement ────────────────────────────────────────── */

function RecoilMuzzle({ className, shot }: { className?: string; shot: Shot }) {
  const data = React.useMemo(() => inWindow(recoilSeries(shot)), [shot]);
  return (
    <SectionCard
      className={className}
      title="Recoil & Muzzle Movement"
      description={`Shot ${shot.n} · 8 s before to 1 s after · each line scaled to its own peak (0–1)`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded bg-sev-critical" />Muzzle {shot.muzzlePeakMm} mm</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded bg-info" />Shoulder {shot.shoulderPeakMm} mm</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-0.5 bg-success" />Bolt carrier</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-0.5 bg-warning" />Ejection</span>
        <span className="flex items-center gap-1.5"><span className="h-0 w-3 border-t border-dashed border-foreground" />Shot</span>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} {...SYNC}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
            <XAxis dataKey="t" type="number" domain={SHOT_WINDOW} ticks={SHOT_TICKS} {...AXIS} />
            <YAxis domain={[0, 1]} ticks={[0, 0.5, 1]} {...AXIS} label={{ value: "Relative", angle: -90, position: "insideLeft", offset: 18, fontSize: 10, fill: "var(--muted-foreground)" }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(t) => `${t} s`} formatter={(v, n) => [Number(v).toFixed(2), n === "muzzle" ? "Muzzle" : "Shoulder"]} />
            <ReferenceLine x={0} stroke="var(--foreground)" strokeDasharray="4 3" />
            {shot.cues.bolt && <ReferenceLine x={0.1} stroke="var(--success)" />}
            {shot.cues.ejection && <ReferenceLine x={0.2} stroke="var(--warning)" />}
            <Line type="monotone" dataKey="shoulder" stroke="var(--info)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="muzzle" stroke="var(--sev-critical)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-center text-2xs text-muted-foreground">Time from shot (s)</p>
    </SectionCard>
  );
}

/* ── Event markers ───────────────────────────────────────────────────── */

function EventMarkers({ className, selected, onSelect }: { className?: string; selected: number; onSelect: (n: number) => void }) {
  return (
    <SectionCard className={className} title="Event Markers" description={`Last ${SHOTS.length} shots · what was picked up on each`}>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-1">
          <thead>
            <tr>
              <th className="text-left text-2xs font-bold uppercase tracking-widest text-muted-foreground">Marker</th>
              {SHOTS.map((s) => (
                <th key={s.n} className="w-8 px-0.5">
                  <button
                    type="button"
                    onClick={() => onSelect(s.n)}
                    className={cn(
                      "w-full rounded py-0.5 font-mono text-2xs font-semibold",
                      s.n === selected ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary" : isHit(s) ? "text-muted-foreground hover:bg-muted" : "text-sev-critical hover:bg-muted"
                    )}
                  >
                    {s.n}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CUES.map((c) => (
              <tr key={c.key}>
                <td className="py-1 pr-2 text-xs text-foreground">
                  <span className="flex items-center gap-2">
                    <span className={cn("size-2 shrink-0 rounded-sm", c.fault ? "bg-sev-critical" : "bg-info")} />
                    <span className="truncate">{c.label}</span>
                  </span>
                </td>
                {SHOTS.map((s) => {
                  const on = s.cues[c.key];
                  return (
                    <td key={s.n} className={cn("text-center", s.n === selected && "bg-muted")}>
                      <span
                        title={`Shot ${s.n} · ${c.label} ${on ? "detected" : "not detected"}`}
                        className={cn("mx-auto block size-2.5 rounded-full", on ? (c.fault ? "bg-sev-critical" : "bg-info") : "border border-border")}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-2xs text-muted-foreground">Blue: detected · red: a fault · hollow: not seen. The highlighted column is the selected shot.</p>
    </SectionCard>
  );
}

/* ── Breathing ───────────────────────────────────────────────────────── */

const PHASE_FILL: Record<BreathPhase, string> = { inhale: "var(--info)", exhale: "var(--muted-foreground)", pause: "var(--success)" };

function phaseBands(data: { t: number; phase: BreathPhase }[]) {
  const bands: { from: number; to: number; phase: BreathPhase }[] = [];
  for (const d of data) {
    const last = bands[bands.length - 1];
    if (last && last.phase === d.phase) last.to = d.t;
    else bands.push({ from: d.t, to: d.t, phase: d.phase });
  }
  return bands;
}

function Breathing({ shot }: { shot: Shot }) {
  const data = React.useMemo(() => inWindow(breathingSeries(shot)), [shot]);
  const bands = React.useMemo(() => phaseBands(data), [data]);
  const inPause = firedInPause(shot);
  return (
    <SectionCard id="aar-breathing" title="Breathing" description={`Shot ${shot.n} · ${SESSION.sources.split(" · ")[0]}`} className="scroll-mt-24">
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} {...SYNC}>
            {bands.map((b) => (
              <ReferenceArea key={`${b.from}-${b.phase}`} x1={b.from} x2={b.to + 0.1} fill={PHASE_FILL[b.phase]} fillOpacity={0.12} strokeOpacity={0} />
            ))}
            <XAxis dataKey="t" type="number" domain={SHOT_WINDOW} ticks={SHOT_TICKS} {...AXIS} />
            <YAxis domain={[0, 1.4]} ticks={[0, 0.5, 1]} {...AXIS} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(t) => `${t} s`} formatter={(v) => [Number(v).toFixed(2), "Chest"]} />
            <ReferenceLine x={0} stroke={inPause ? "var(--success)" : "var(--sev-critical)"} strokeWidth={2} label={{ value: "Shot", position: "insideTopLeft", fontSize: 10, fill: "var(--muted-foreground)" }} />
            <Line type="monotone" dataKey="chest" stroke="var(--info)" strokeWidth={1.8} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-2xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-info/40" />Inhale</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-muted-foreground/40" />Exhale</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-success/40" />Natural pause</span>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Phase at shot" value={inPause ? "Pause" : BREATH_LABEL[shot.breath]} bad={!inPause} />
        <Stat label="Rate" value={`${SESSION.breathingRate} /min`} info="Breaths per minute." />
        <Stat label="Depth" value={`${SESSION.breathingAmplitude.toFixed(2)}×`} info="How deep the breaths are, relative to a normal resting breath (1.00×)." />
      </dl>
    </SectionCard>
  );
}

function Stat({ label, value, bad, info }: { label: string; value: string; bad?: boolean; info?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-background px-2.5 py-1.5">
      <dt className="flex items-center gap-1 truncate text-2xs text-muted-foreground">{label}{info && <InfoTip text={info} />}</dt>
      <dd className={cn("mt-0.5 truncate font-mono text-sm font-semibold", bad ? "text-sev-critical" : "text-foreground")}>{value}</dd>
    </div>
  );
}

/* ── Stability / wobble ──────────────────────────────────────────────── */

function Stability({ shot }: { shot: Shot }) {
  const data = React.useMemo(() => wobbleSeries(shot), [shot]);
  return (
    <SectionCard id="aar-stability" title="Stability / Wobble" description={`Shot ${shot.n} · how much the aim moved, 8 s before to 1 s after`} className="scroll-mt-24">
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} {...SYNC}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
            <XAxis dataKey="t" type="number" domain={SHOT_WINDOW} ticks={SHOT_TICKS} {...AXIS} />
            <YAxis domain={[0, 14]} ticks={[0, 5, 10]} {...AXIS} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(t) => `${t} s`} formatter={(v) => [`${Number(v).toFixed(2)} mm`, "Wobble RMS"]} />
            <ReferenceLine x={0} stroke="var(--foreground)" strokeDasharray="4 3" />
            <Line type="monotone" dataKey="rms" stroke="var(--warning)" strokeWidth={1.8} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-2xs text-muted-foreground">Average sway of the aim point (RMS, mm) · the jump at 0 s is recoil.</p>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Last 1 s before" value={`${shot.wobbleMm.toFixed(1)} mm`} bad={wobbled(shot)} info={`Sway in the final second before the shot. Over ${WOBBLE_LIMIT_MM} mm means the rifle hadn't settled.`} />
        <Stat label="1 s after" value={`${shot.afterRmsMm.toFixed(1)} mm`} info="Sway in the second after the shot, recoil included." />
        <Stat label="Stability" value={`${shot.stability} / 5`} bad={shot.stability < 3} info="Overall steadiness score; 3 or more is acceptable." />
      </dl>
    </SectionCard>
  );
}

/* ── Flinch indicator ────────────────────────────────────────────────── */

function FlinchIndicator({ shot }: { shot: Shot }) {
  /* One row per sample, one column per shot, so the selected shot draws over the others. */
  const data = React.useMemo(() => {
    const series = SHOTS.filter((s) => s.flinchMm !== null).map((s) => ({ n: s.n, pts: flinchSeries(s) }));
    return series[0].pts.map((p, i) => ({ ms: p.ms, ...Object.fromEntries(series.map((s) => [`s${s.n}`, s.pts[i].dev])) }));
  }, []);
  const measured = SHOTS.filter((s) => s.flinchMm !== null);
  const verdict = shot.flinchMm === null ? "Not measured" : flinched(shot) ? `FLINCH, max ${shot.flinchMm.toFixed(1)} mm` : `No flinch, max ${shot.flinchMm.toFixed(1)} mm`;

  return (
    <SectionCard
      id="aar-flinch"
      title="Flinch Indicator"
      description={`Shot ${shot.n}: ${verdict}`}
      className="scroll-mt-24"
      action={flinched(shot) ? <StatusBadge tone="critical" dot={false}>Flinch</StatusBadge> : undefined}
    >
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
            <XAxis dataKey="ms" type="number" domain={[-500, 100]} ticks={[-400, -200, 0]} {...AXIS} />
            <YAxis domain={[-5, 12]} ticks={[-5, 0, 5, 10]} {...AXIS} />
            <ReferenceLine y={FLINCH_LIMIT_MM} stroke="var(--sev-critical)" strokeDasharray="4 3" />
            {measured.filter((s) => s.n !== shot.n).map((s) => (
              <Line key={s.n} type="monotone" dataKey={`s${s.n}`} stroke="var(--muted-foreground)" strokeOpacity={0.4} strokeWidth={1} dot={false} isAnimationActive={false} />
            ))}
            {shot.flinchMm !== null && (
              <Line type="monotone" dataKey={`s${shot.n}`} stroke="var(--primary)" strokeWidth={2} dot={false} isAnimationActive={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-2xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded bg-primary" />Selected shot</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded bg-muted-foreground/40" />Other shots</span>
        <span className="flex items-center gap-1.5"><span className="h-0 w-3 border-t border-dashed border-sev-critical" />Threshold {FLINCH_LIMIT_MM} mm</span>
        <span className="ml-auto">Time relative to shot (ms)</span>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Max deviation" value={shot.flinchMm === null ? "n/a" : `${shot.flinchMm.toFixed(1)} mm`} bad={flinched(shot)} />
        <Stat label="Flinches" value={`${SHOTS.filter(flinched).length} / ${measured.length}`} bad={SHOTS.some(flinched)} />
        <Stat label="Threshold" value={`${FLINCH_LIMIT_MM} mm`} />
      </dl>
    </SectionCard>
  );
}

/* ── Wobble bubble / shot summary ────────────────────────────────────── */

function WobbleAndSummary({ shot, selected, onSelect }: { shot: Shot; selected: number; onSelect: (n: number) => void }) {
  const [tab, setTab] = React.useState<"bubble" | "summary">("bubble");
  return (
    <SectionCard
      id="aar-wobble"
      className="scroll-mt-24"
      title={tab === "bubble" ? "Wobble Bubble" : "Shot Summary"}
      description={
        tab === "bubble"
          ? `Shot ${shot.n} · ring = 95% sway ellipse (${SESSION.swayEllipseMm} mm long axis) · dominant sway: ${SESSION.dominantSway.toLowerCase()}`
          : "Every shot of the session. Click a row to review it."
      }
      action={
        <Tabs value={tab} onValueChange={(v) => setTab(v as "bubble" | "summary")}>
          <TabsList className="h-8">
            <TabsTrigger value="bubble" className="px-2.5 text-xs">Wobble Bubble</TabsTrigger>
            <TabsTrigger value="summary" className="px-2.5 text-xs">Shot Summary</TabsTrigger>
          </TabsList>
        </Tabs>
      }
      flushBody={tab === "summary"}
    >
      {tab === "bubble" ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
            {shot.sway.map((w) => <WobblePlot key={w.t} shot={shot} w={w} />)}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-2xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-info" />Before the shot · sway and its ellipse</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" />After the shot · where the muzzle went</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-sev-critical" />Flinch over {FLINCH_LIMIT_MM} mm, or ends over {SETTLE_LIMIT_MM} mm off aim</span>
          </div>
        </>
      ) : (
        <ShotSummary selected={selected} onSelect={onSelect} />
      )}
    </SectionCard>
  );
}

function ShotSummary({ selected, onSelect }: { selected: number; onSelect: (n: number) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-5">Shot</TableHead>
          <TableHead>Clip time</TableHead>
          <TableHead>Points</TableHead>
          <TableHead className="text-right">From aim</TableHead>
          <TableHead>Breathing</TableHead>
          <TableHead className="text-right">Wobble</TableHead>
          <TableHead className="text-right">Flinch</TableHead>
          <TableHead className="text-right">Ends off aim</TableHead>
          <TableHead className="text-right">Muzzle / Shoulder</TableHead>
          <TableHead className="pr-5">Result</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {SHOTS.map((s) => {
          const hit = isHit(s);
          return (
            <TableRow
              key={s.n}
              tabIndex={0}
              onClick={() => onSelect(s.n)}
              onKeyDown={(e) => e.key === "Enter" && onSelect(s.n)}
              data-state={s.n === selected ? "selected" : undefined}
              className={cn("cursor-pointer", s.n === selected && "bg-muted", !hit && s.n !== selected && "bg-sev-critical/5")}
            >
              <TableCell className="pl-5 font-mono font-semibold text-foreground">#{s.n}</TableCell>
              <TableCell className="font-mono text-muted-foreground">{fmtClip(s.at)}</TableCell>
              <TableCell className={cn("font-mono font-semibold", hit ? "text-foreground" : "text-sev-critical")}>{points(s)}</TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">{radius(s).toFixed(1)} mm</TableCell>
              <TableCell className={firedInPause(s) ? "text-muted-foreground" : "text-sev-critical"}>{BREATH_LABEL[s.breath]}</TableCell>
              <TableCell className={cn("text-right font-mono", wobbled(s) ? "text-sev-critical" : "text-muted-foreground")}>{s.wobbleMm.toFixed(1)} mm</TableCell>
              <TableCell className={cn("text-right font-mono", flinched(s) ? "text-sev-critical" : "text-muted-foreground")}>{s.flinchMm === null ? "n/a" : `${s.flinchMm.toFixed(1)} mm`}</TableCell>
              <TableCell className={cn("text-right font-mono", settled(s) ? "text-muted-foreground" : "text-sev-critical")}>{s.settleMm.toFixed(1)} mm</TableCell>
              <TableCell className="text-right font-mono text-muted-foreground">{s.muzzlePeakMm} / {s.shoulderPeakMm} mm</TableCell>
              <TableCell className="pr-5">
                <StatusBadge tone={!hit ? "critical" : points(s) === 10 ? "success" : "primary"} dot={false}>
                  {!hit ? "Miss" : points(s) === 10 ? "10 points" : "Hit"}
                </StatusBadge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

