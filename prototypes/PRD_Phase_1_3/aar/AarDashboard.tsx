import * as React from "react";
import { toast } from "sonner";
import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Award, CircleCheck, CircleDashed, CircleX, Crosshair, Dumbbell, FileDown, Info, Pause, Play, RotateCcw, Share2, TrendingDown, TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import laneCctv from "@/assets/aar/prone-shooter-lane.webp";
import { cn } from "@/lib/utils";
import {
  BADGES, BEST_SHOT, CLICK_MM, COMPARISONS, CUES, FIRER, HOME_DRILLS, METHOD_NOTE, PLATOON_BINS, PREVIOUS_MET_TOTAL, SESSION_META,
  UNIT_AVERAGES, WEAKEST_SHOT, factorsMetTotal, shotNotes, FLINCH_LIMIT_MM, GRADE_BANDS, MISS_MM, PEERS, PREVIOUS, PREVIOUS_OVERALL, RANKED_RECS, REC_DETAIL,
  RING_MM, SESSION, SESSION_INFO, SETTLE_LIMIT_MM, SHOTS, TREND, WOBBLE_LIMIT_MM, WORKING_WELL, breathingSeries, factorsFor, firedInPause,
  flinchSeries, flinched, fmtClip, gradeOf, isHit, muzzleSeries, overallFor, points, radius, recoilSeries, settled, sightAdvice,
  stanceScore, statsFor, wobbleSeries, type BreathPhase, type RecKey, type Shot,
} from "./aarSession";
import { PostureFrame, WobblePlot } from "./aarParts";

/* AAR — one firer's indoor-range session on a single screen, in two modes.
   Live follows the session as it's shot: the shots so far, the shot being
   aimed, its posture and signals as they come in, and cues for the next shot.
   Results is the finished review: every shot, the four fundamentals graded
   A–F against last session, what to work on, and how the firer stands.

   The layout is compact on purpose (dense type, small panels) so the whole
   dashboard fits a laptop screen without scrolling; below lg it stacks. */

type Mode = "live" | "review";

const TOOLTIP_STYLE = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 };
const AXIS = { stroke: "var(--muted-foreground)", fontSize: 9, tickLine: false, axisLine: false } as const;
const BREATH_LABEL: Record<BreathPhase, string> = { pause: "Natural pause", inhale: "Inhale", exhale: "Exhale" };
const SPEEDS = [1, 2, 4] as const;
/** A shot stays "current" in live view until its 2 s follow-through is over. */
const FOLLOW_THROUGH = 2;

const shotByN = (n: number) => SHOTS.find((s) => s.n === n)!;
const STATS_ALL = statsFor(SHOTS);
const gradeTone = (g: string) => (g === "A" || g === "B" ? "success" : g === "C" ? "warning" : "sev-critical");
const TONE_TEXT = { success: "text-success", warning: "text-warning", "sev-critical": "text-sev-critical" } as const;
const TONE_FILL = { success: "bg-success/15", warning: "bg-warning/15", "sev-critical": "bg-sev-critical/15" } as const;

/* ── Page ────────────────────────────────────────────────────────────── */

export function AarDashboard() {
  const [mode, setMode] = React.useState<Mode>("review");
  const [selected, setSelected] = React.useState(SHOTS[SHOTS.length - 1].n);
  const [t, setT] = React.useState(0);
  const [speed, setSpeed] = React.useState<(typeof SPEEDS)[number]>(1);
  /* A recommendation's "See" link picks its shot and scrolls to the full panel below. */
  function openPanel(n: number, id: string) {
    setSelected(n);
    window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const complete = t >= SESSION.clipLength;
  React.useEffect(() => {
    if (mode !== "live" || complete) return;
    const id = window.setInterval(() => setT((v) => Math.min(SESSION.clipLength, v + 0.1 * speed)), 100);
    return () => window.clearInterval(id);
  }, [mode, complete, speed]);

  function switchMode(next: Mode) {
    if (next === "live") setT(0);
    setMode(next);
  }

  const live = mode === "live";
  const fired = live ? SHOTS.filter((s) => s.at <= t) : SHOTS;
  // Live: the shot being aimed, or the one still in its follow-through. Review: the picked shot.
  const focus = live ? SHOTS.find((s) => t <= s.at + FOLLOW_THROUGH) ?? SHOTS[SHOTS.length - 1] : shotByN(selected);
  /** Seconds from the focus shot: negative while aiming. Review shows the whole window. */
  const rel = live ? t - focus.at : Infinity;
  const clock = fmtClip(live ? t : focus.at);

  return (
    <div className="flex flex-col gap-6">
    {/* The overview is pinned to the viewport (less the top bar and page padding), so
        it fits a laptop screen; the full report follows below it. */}
    <div className="flex flex-col gap-3 lg:h-[calc(100svh-6rem)] lg:min-h-[600px]">
      <PageHeader>
        <PageHeader.Content className="flex-row items-center gap-3">
          <PageHeader.Title>After Action Review</PageHeader.Title>
          <Tabs value={mode} onValueChange={(v) => switchMode(v as Mode)}>
            <TabsList className="h-8">
              <TabsTrigger value="live" className="gap-1.5 px-2.5 text-xs">
                <span className={cn("size-1.5 rounded-full", live && !complete ? "animate-pulse bg-sev-critical" : "bg-muted-foreground/50")} />
                Live
              </TabsTrigger>
              <TabsTrigger value="review" className="px-2.5 text-xs">Results</TabsTrigger>
            </TabsList>
          </Tabs>
        </PageHeader.Content>
        <PageHeader.Actions>
          {live ? (
            <>
              <span className="font-mono text-xs text-muted-foreground">
                {complete ? "Session complete" : `Shot ${Math.min(fired.length + 1, SHOTS.length)} of ${SHOTS.length}`} · {fmtClip(t)} / {fmtClip(SESSION.clipLength)}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length])} aria-label={`Playback speed ${speed}×`}>
                {speed}×
              </Button>
              <Button variant="outline" size="sm" onClick={() => setT(0)}>
                <RotateCcw className="size-4" />
                Restart
              </Button>
              <Button size="sm" variant={complete ? "default" : "outline"} onClick={() => switchMode("review")}>
                View results
              </Button>
            </>
          ) : (
            <>
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
            </>
          )}
        </PageHeader.Actions>
      </PageHeader>

      {/* The report's header block */}
      <dl className="-mt-1 flex shrink-0 flex-wrap items-baseline gap-x-5 gap-y-0.5">
        {([["Unit", SESSION_META.unit], ["Weapon / position", SESSION_META.weaponPosition], ["Range / distance", SESSION_META.range], ["Date / detail", SESSION_META.detail]] as const).map(([k, v]) => (
          <div key={k} className="flex items-baseline gap-1.5">
            <dt className="text-3xs font-semibold uppercase text-muted-foreground">{k}</dt>
            <dd className="text-2xs font-semibold text-foreground">{v}</dd>
          </div>
        ))}
      </dl>

      <SummaryStrip shots={fired} live={live} complete={complete} />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-12 lg:grid-rows-[minmax(0,1.12fr)_minmax(0,1fr)]">
        <CameraPanel className="lg:col-span-5" shot={focus} fired={fired} live={live} t={t} clock={clock} onSelect={setSelected} />
        <TargetPanel className="lg:col-span-3" shots={fired} focus={focus} live={live} onSelect={setSelected} />
        <ShotPanel className="lg:col-span-4" shot={focus} rel={rel} live={live} onSelect={setSelected} />
        <SignalsPanel className="lg:col-span-5" shot={focus} rel={rel} />
        <FundamentalsPanel className="lg:col-span-3" shots={fired} live={live && !complete} />
        {live ? (
          <LiveCuesPanel className="lg:col-span-4" shot={focus} rel={rel} fired={fired} />
        ) : (
          <CoachingPanel className="lg:col-span-4" onSelect={setSelected} onOpen={openPanel} />
        )}
      </div>
    </div>

    {live ? (
      <p className="rounded-xl border border-dashed border-border px-4 py-3 text-center text-sm text-muted-foreground">
        The full report — every shot in detail, the grades table, trend and standing — opens in <strong className="text-foreground">Results</strong> once the session ends.
      </p>
    ) : (
      <FullReport selected={selected} onSelect={setSelected} onOpen={openPanel} />
    )}
    </div>
  );
}

/* ── Building blocks ─────────────────────────────────────────────────── */

/** A compact titled panel; the body fills what's left of its grid cell. */
function Panel({ title, meta, action, className, bodyClassName, children }: {
  title: string; meta?: React.ReactNode; action?: React.ReactNode; className?: string; bodyClassName?: string; children: React.ReactNode;
}) {
  return (
    <section className={cn("flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card", className)}>
      <header className="flex h-9 shrink-0 items-center gap-2 border-b border-border px-3">
        <h2 className="shrink-0 text-sm font-bold text-foreground">{title}</h2>
        {meta && <span className="min-w-0 truncate text-2xs text-muted-foreground">{meta}</span>}
        {action && <div className="ml-auto shrink-0">{action}</div>}
      </header>
      <div className={cn("flex min-h-0 flex-1 flex-col p-3", bodyClassName)}>{children}</div>
    </section>
  );
}

/** The compact tab switch panels use in their header to swap views. */
function PanelTabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: [T, string][] }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as T)}>
      <TabsList className="h-7">
        {tabs.map(([v, label]) => (
          <TabsTrigger key={v} value={v} className="px-2 text-2xs">{label}</TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

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

function GradeBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const g = gradeOf(score);
  const tone = gradeTone(g);
  return (
    <span className={cn(
      "grid shrink-0 place-items-center rounded-md font-bold",
      TONE_FILL[tone], TONE_TEXT[tone],
      size === "lg" ? "size-9 text-xl" : size === "md" ? "size-7 text-md" : "size-5 text-xs"
    )}>
      {g}
    </span>
  );
}

function Delta({ now, before, lowerIsBetter = false, unit = "", label }: { now: number; before: number; lowerIsBetter?: boolean; unit?: string; label?: string }) {
  const d = now - before;
  if (Math.abs(d) < 0.05) return <span className="text-muted-foreground">Same{label ? ` as ${label}` : ""}</span>;
  const better = lowerIsBetter ? d < 0 : d > 0;
  const Arrow = d > 0 ? TrendingUp : TrendingDown;
  const abs = Math.abs(d) % 1 ? Math.abs(d).toFixed(1) : String(Math.abs(d));
  return (
    <span className={cn("inline-flex items-center gap-1", better ? "text-success" : "text-sev-critical")}>
      <Arrow className="size-3" />
      {d > 0 ? "+" : "−"}{abs}{unit}{label && ` vs ${label}`}
    </span>
  );
}

/* ── Summary strip ───────────────────────────────────────────────────── */

/* The firer and their overall grade, then the six results, each against last session. */
function SummaryStrip({ shots, live, complete }: { shots: Shot[]; live: boolean; complete: boolean }) {
  const s = statsFor(shots);
  const any = shots.length > 0;
  // Spread needs at least two shots to mean anything.
  const group = shots.length > 1;
  const overall = any ? overallFor(shots) : 0;
  const kpis: { label: string; value: string; tone?: string; info: string; delta?: React.ReactNode }[] = [
    { label: "Points", value: `${s.points} / ${live ? SHOTS.length * 10 : s.maxPoints}`, tone: "text-success", info: "Up to 10 a shot, by distance from the aim point.", delta: !live && <Delta now={s.points} before={PREVIOUS.points} /> },
    { label: "Hits", value: `${s.hits} / ${s.shots}`, info: `Shots inside the ${MISS_MM} mm scoring area.`, delta: !live && <Delta now={s.hits} before={SHOTS.length - PREVIOUS.misses} /> },
    { label: "Missed", value: String(s.misses), tone: s.misses ? "text-sev-critical" : undefined, info: `Shots outside ${MISS_MM} mm of the aim point.`, delta: !live && <Delta now={s.misses} before={PREVIOUS.misses} lowerIsBetter /> },
    { label: "Mean radius", value: group ? `${s.meanRadius.toFixed(1)} mm` : "—", tone: "text-info", info: "Average distance of each shot from the centre of the group. Measures consistency, not aim.", delta: !live && <Delta now={s.meanRadius} before={PREVIOUS.meanRadius} lowerIsBetter unit=" mm" /> },
    { label: "CEP (50%)", value: group ? `${s.cep50.toFixed(1)} mm` : "—", tone: "text-purple", info: "Radius of a circle around the group centre that holds half the shots.", delta: !live && <Delta now={s.cep50} before={PREVIOUS.cep50} lowerIsBetter unit=" mm" /> },
    { label: "Group size", value: group ? `${s.groupMm.toFixed(1)} mm` : "—", tone: "text-warning", info: "Distance between the two shots farthest apart.", delta: !live && <Delta now={s.groupMm} before={PREVIOUS.groupMm} lowerIsBetter unit=" mm" /> },
  ];

  return (
    <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.3fr)_repeat(6,minmax(0,1fr))]">
      <div className="col-span-2 flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2 lg:col-span-1">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-2xs font-bold text-primary">{FIRER.initials}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-foreground" title={`${FIRER.name} · ${FIRER.id} · ${FIRER.unit}`}>{FIRER.name}</p>
          <p className="truncate font-mono text-2xs text-muted-foreground" title={`${SESSION_INFO.date} · ${SESSION_INFO.weapon} · ${SESSION_INFO.distance} · prone`}>
            {FIRER.id}
          </p>
        </div>
      </div>
      <div className="col-span-2 flex items-center rounded-xl border border-border bg-card px-2.5 py-2 lg:col-span-1">
        <div className="flex min-w-0 items-center gap-2">
          {any ? <GradeBadge score={overall} size="lg" /> : <span className="grid size-9 place-items-center rounded-md bg-muted text-md text-muted-foreground">—</span>}
          <div className="min-w-0 leading-tight">
            <p className="truncate text-3xs font-semibold uppercase text-muted-foreground">{live && !complete ? "Grade so far" : "Overall"}</p>
            <p className="font-mono text-sm font-bold text-foreground">{any ? overall : "—"}<span className="text-muted-foreground">/100</span></p>
            {!live && <p className="truncate text-3xs" title={`${PREVIOUS_OVERALL} (${gradeOf(PREVIOUS_OVERALL)}) on ${PREVIOUS.date}`}><Delta now={overall} before={PREVIOUS_OVERALL} /> <span className="text-muted-foreground">from {gradeOf(PREVIOUS_OVERALL)}</span></p>}
          </div>
        </div>
      </div>
      {kpis.map((k) => (
        <div key={k.label} title={k.info} className="min-w-0 cursor-help rounded-xl border border-border bg-card px-2.5 py-2">
          <p className="truncate text-3xs font-semibold uppercase text-muted-foreground">{k.label}</p>
          <p className={cn("mt-0.5 truncate text-lg font-bold leading-tight", k.tone ?? "text-foreground")}>{k.value}</p>
          <p className="truncate text-3xs" title={live ? undefined : `Change since ${PREVIOUS.date}`}>{k.delta || <span className="text-muted-foreground">{live ? "Live · so far" : " "}</span>}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Camera: posture tracking + lane feed ────────────────────────────── */

const FIRER_BOX = { x0: 0.045, y0: 0.335, x1: 0.575, y1: 0.93 };

function CameraPanel({ className, shot, fired, live, t, clock, onSelect }: {
  className?: string; shot: Shot; fired: Shot[]; live: boolean; t: number; clock: string; onSelect: (n: number) => void;
}) {
  const [view, setView] = React.useState<"pose" | "cctv">("pose");
  /* Results: the clip can be played through; picking a shot jumps the playhead to it. */
  const [head, setHead] = React.useState(shot.at);
  const [playing, setPlaying] = React.useState(false);
  const [followed, setFollowed] = React.useState(shot.n);
  if (followed !== shot.n) {
    setFollowed(shot.n);
    setHead(shot.at);
  }
  const ended = head >= SESSION.clipLength;
  React.useEffect(() => {
    if (live || !playing || ended) return;
    const id = window.setInterval(() => setHead((v) => Math.min(SESSION.clipLength, v + 0.1)), 100);
    return () => window.clearInterval(id);
  }, [live, playing, ended]);
  const pos = live ? t : head;
  // Playing in Results shows the latest shot the clip has reached.
  const shown = live ? shot : [...SHOTS].reverse().find((s) => s.at <= head + 0.05) ?? SHOTS[0];
  const pct = (sec: number) => `${(sec / SESSION.clipLength) * 100}%`;
  return (
    <Panel
      className={className}
      title="Posture Tracking"
      meta={`${SESSION.lane} · shot ${shown.n}`}
      bodyClassName="p-0"
      action={
        <div className="flex items-center gap-1.5">
          <ClipInfo />
          <PanelTabs value={view} onChange={setView} tabs={[["pose", "Pose"], ["cctv", "Camera"]]} />
        </div>
      }
    >
      <div className="relative min-h-0 flex-1 overflow-hidden bg-camera-feed max-lg:aspect-video">
        {view === "pose" ? (
          <PostureFrame shot={shown} live={live} clock={live ? clock : fmtClip(head)} className="absolute inset-0" />
        ) : (
          <CctvFrame shot={shown} live={live} clock={live ? clock : fmtClip(head)} />
        )}
      </div>
      {/* Session timeline: every shot, the playhead, click a shot to review it */}
      <div className="flex h-8 shrink-0 items-center gap-2 border-t border-border px-2">
        {!live && (
          <button
            type="button"
            aria-label={playing && !ended ? "Pause" : "Play"}
            onClick={() => {
              if (ended) setHead(0);
              setPlaying(!(playing && !ended));
            }}
            className="grid size-6 shrink-0 place-items-center rounded text-foreground hover:bg-muted"
          >
            {playing && !ended ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </button>
        )}
        <span className="font-mono text-2xs text-muted-foreground">{fmtClip(pos)}</span>
        <div className="relative h-4 flex-1">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
          <div className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary/60" style={{ width: pct(pos) }} />
          {SHOTS.map((s) => {
            const reached = !live || fired.includes(s);
            return (
              <button
                key={s.n}
                type="button"
                disabled={!reached || live}
                onClick={() => onSelect(s.n)}
                aria-label={`Shot ${s.n} at ${fmtClip(s.at)}`}
                title={`Shot ${s.n} · ${fmtClip(s.at)}`}
                className={cn(
                  "absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card transition-transform enabled:hover:scale-150",
                  !reached ? "bg-muted-foreground/30" : s.n === shown.n ? "bg-foreground" : points(s) === 10 ? "bg-success" : isHit(s) ? "bg-info" : "bg-sev-critical"
                )}
                style={{ left: pct(s.at) }}
              />
            );
          })}
        </div>
        <span className="font-mono text-2xs text-muted-foreground">{fmtClip(SESSION.clipLength)}</span>
      </div>
    </Panel>
  );
}

/* What the analysis ran on — the clip, how it was tracked, and dropped frames. */
function ClipInfo() {
  const rows: [string, string][] = [
    ["Clip", SESSION.clip], ["Length", fmtClip(SESSION.clipLength)], ["Analysis", SESSION.analysisMode],
    ["Sources", SESSION.sources], ["Tracking", `${SESSION.trackingFps} fps · lag ${SESSION.lagSec} s`],
    ["Dropped", `${SESSION.droppedFrames.toLocaleString()} frames`],
  ];
  return (
    <UiTooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label="Clip details" className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
          <Info className="size-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="w-64 text-xs">
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
          {rows.map(([k, v]) => (
            <React.Fragment key={k}><dt className="text-muted-foreground">{k}</dt><dd className="truncate font-mono">{v}</dd></React.Fragment>
          ))}
        </dl>
        {SESSION.droppedFrames > 1000 && <p className="mt-1.5 text-warning">Many dropped frames: fast movement can fall between them, so read flinch and recoil with care.</p>}
        <p className="mt-1.5 text-muted-foreground">{METHOD_NOTE}</p>
      </TooltipContent>
    </UiTooltip>
  );
}

/* The lane CCTV, as Live Monitoring shows a feed: the still scaled past its
   burned-in name and clock, and the firer box — red when posture is flagged. */
function CctvFrame({ shot, live, clock }: { shot: Shot; live: boolean; clock: string }) {
  const fault = shot.cues.posture || shot.cues.shoulder;
  return (
    <div className="absolute inset-0">
      <img src={laneCctv} alt={`${SESSION.lane} prone firing position, side camera`} draggable={false} className="absolute inset-0 size-full object-cover" />
      <div
        className={cn("absolute border-2", fault ? "border-sev-critical" : "border-success")}
        style={{ left: `${FIRER_BOX.x0 * 100}%`, top: `${FIRER_BOX.y0 * 100}%`, width: `${(FIRER_BOX.x1 - FIRER_BOX.x0) * 100}%`, height: `${(FIRER_BOX.y1 - FIRER_BOX.y0) * 100}%` }}
      >
        <span className={cn("absolute -top-4 left-[-2px] whitespace-nowrap rounded-t px-1 font-mono text-3xs font-bold text-white", fault ? "bg-sev-critical" : "bg-success")}>
          FIRER · {fault ? "FAULT" : "TRACKED"}
        </span>
      </div>
      <div className="absolute left-2 top-2 flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-3xs font-bold uppercase tracking-widest text-white">
          <span className={cn("size-1.5 rounded-full", live ? "animate-pulse bg-sev-critical" : "bg-white/60")} />
          {live ? "Live" : "Playback"}
        </span>
        <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-3xs text-white/90">Cam-10 · {clock}</span>
      </div>
    </div>
  );
}

/* ── Target board ────────────────────────────────────────────────────── */

const HALF = 25; // mm either side of the aim point

function TargetPanel({ className, shots, focus, live, onSelect }: { className?: string; shots: Shot[]; focus: Shot; live: boolean; onSelect: (n: number) => void }) {
  const s = statsFor(shots);
  const advice = sightAdvice(s.mpi);
  const latest = shots[shots.length - 1];
  const mr = 1.5;
  return (
    <Panel className={className} title="Target Board" meta={`${shots.length}/${SHOTS.length} shots · ${RING_MM} mm rings`}>
      <div className="grid min-h-0 flex-1 place-items-center max-lg:aspect-square">
        <svg viewBox={`${-HALF} ${-HALF} ${HALF * 2} ${HALF * 2}`} className="block size-full max-h-full" role="img" aria-label={`Target board, ${s.hits} hits and ${s.misses} misses`}>
          <rect x={-HALF} y={-HALF} width={HALF * 2} height={HALF * 2} rx="1.5" fill="var(--sev-critical)" fillOpacity="0.05" />
          {[5, 4, 3, 2, 1].map((k) => (
            <circle key={k} r={k * RING_MM} fill="var(--primary)" fillOpacity={0.04 + (6 - k) * 0.03} stroke="var(--border)" vectorEffect="non-scaling-stroke" />
          ))}
          {[5, 4, 3, 2, 1].map((k) => (
            <text key={k} x={(k - 0.5) * RING_MM} y="0.6" textAnchor="middle" className="font-mono" fontSize="1.6" fill="var(--muted-foreground)">{11 - k}</text>
          ))}
          <line x1={-HALF} x2={HALF} y1="0" y2="0" stroke="var(--border)" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
          <line y1={-HALF} y2={HALF} x1="0" x2="0" stroke="var(--border)" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
          {shots.length > 1 && (
            <>
              <circle cx={s.mpi.x} cy={-s.mpi.y} r={s.cep50} fill="var(--foreground)" fillOpacity="0.04" stroke="var(--foreground)" strokeOpacity="0.5" strokeDasharray="1 1" vectorEffect="non-scaling-stroke" />
              <g stroke="var(--foreground)" strokeWidth="1.5">
                <line x1={s.mpi.x - 1.2} x2={s.mpi.x + 1.2} y1={-s.mpi.y} y2={-s.mpi.y} vectorEffect="non-scaling-stroke" />
                <line x1={s.mpi.x} x2={s.mpi.x} y1={-s.mpi.y - 1.2} y2={-s.mpi.y + 1.2} vectorEffect="non-scaling-stroke" />
              </g>
            </>
          )}
          {shots.map((shot) => {
            const hit = isHit(shot);
            const active = live ? shot === latest : shot.n === focus.n;
            const fill = !hit ? "var(--sev-critical)" : points(shot) === 10 ? "var(--success)" : "var(--info)";
            return (
              <g
                key={shot.n}
                transform={`translate(${shot.x} ${-shot.y})`}
                className={cn("outline-none", !live && "cursor-pointer")}
                role={live ? undefined : "button"}
                tabIndex={live ? undefined : 0}
                aria-label={`Shot ${shot.n}: ${hit ? `${points(shot)} points` : "miss"}, ${radius(shot).toFixed(1)} mm from aim`}
                onClick={() => !live && onSelect(shot.n)}
                onKeyDown={(e) => !live && (e.key === "Enter" || e.key === " ") && onSelect(shot.n)}
              >
                <title>{`Shot ${shot.n} · ${hit ? `${points(shot)} pts` : "Miss"} · ${radius(shot).toFixed(1)} mm`}</title>
                {active && live && <circle r={mr * 2.4} fill="none" stroke="var(--primary)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" className="animate-ping [transform-box:fill-box] [transform-origin:center]" />}
                {active && <circle r={mr * 1.7} fill="none" stroke="var(--foreground)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />}
                <circle r={mr} fill={fill} stroke="var(--card)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
                <text y={mr * 0.38} textAnchor="middle" fontSize={mr * 1.1} fontWeight="700" fill="var(--primary-foreground)" className="pointer-events-none font-mono">{shot.n}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-2 flex shrink-0 items-center gap-1.5 text-xs font-semibold text-foreground">
        <Crosshair className="size-3.5 shrink-0" />
        <span className="leading-tight">{shots.length ? advice.text : "Waiting for the first shot"}</span>
        {shots.length > 0 && <InfoTip text={`Moves the group centre onto the aim point, at ${CLICK_MM} mm a click (${SESSION_INFO.distance}). A miss pulls the centre, so confirm with a fresh group.`} />}
      </p>
      <ul className="mt-1 flex shrink-0 flex-wrap gap-x-3 gap-y-0.5 text-3xs text-muted-foreground">
        <li className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-success" />10</li>
        <li className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-info" />9–6</li>
        <li className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-sev-critical" />Miss</li>
        <li className="flex items-center gap-1"><span className="size-2 rounded-full border border-dashed border-foreground/60" />CEP</li>
      </ul>
    </Panel>
  );
}

/* ── Shot review ─────────────────────────────────────────────────────── */

type Check = { label: string; ok: boolean | null; note: string };

/* The five checks on one shot, after the report's "factors met" list. In live
   view each one is pending until the moment it can be judged. */
function shotChecks(shot: Shot, rel: number): Check[] {
  const p = shot.posture;
  const fired = rel >= 0;
  const after = rel >= FOLLOW_THROUGH;
  return [
    { label: "Stance", ok: stanceScore(shot) >= 80, note: `${p.legsOpenDeg}° legs · body ${p.bodyOffDeg}° · elbows ${p.elbowsSet ? "set" : "off"}` },
    { label: "Hold stability", ok: rel >= -1 ? shot.hold >= 80 : null, note: rel >= -1 ? `${shot.hold}/100 (target 80)` : "Settling…" },
    { label: "Breath control", ok: fired ? firedInPause(shot) : null, note: fired ? BREATH_LABEL[shot.breath] : "At the break" },
    { label: "Trigger / flinch", ok: fired ? (shot.flinchMm === null ? null : !flinched(shot)) : null, note: !fired ? "At the break" : shot.flinchMm === null ? "Not measured" : flinched(shot) ? `${shot.flinchMm.toFixed(1)} mm jump` : "None" },
    { label: "Follow-through", ok: after ? settled(shot) : null, note: after ? (settled(shot) ? "Back on aim" : `${shot.settleMm.toFixed(1)} mm off aim`) : "2 s after" },
  ];
}

function ShotPanel({ className, shot, rel, live, onSelect }: { className?: string; shot: Shot; rel: number; live: boolean; onSelect: (n: number) => void }) {
  const checks = shotChecks(shot, rel);
  const fired = rel >= 0;
  const passed = checks.filter((c) => c.ok).length;
  const status = !fired ? "aiming" : `${isHit(shot) ? `${points(shot)} pts` : "miss"}, ${radius(shot).toFixed(1)} mm`;
  const tag = shot.n === BEST_SHOT ? "Best shot" : shot.n === WEAKEST_SHOT ? "Weakest shot" : null;
  return (
    <Panel
      className={className}
      title={live ? "Current Shot" : "Shot Review"}
      meta={live ? `#${shot.n}` : "Pick a shot"}
    >
      {!live && (
        <div role="tablist" aria-label="Shots" className="mb-2 grid shrink-0 grid-cols-6 gap-1">
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
                  "flex flex-col items-center rounded-md border py-0.5 transition-colors duration-[var(--duration-fast)]",
                  active ? "border-primary bg-primary/10 shadow-[inset_0_0_0_1px_var(--primary)]" : "border-border bg-background hover:border-primary/40"
                )}
              >
                <span className="flex items-center gap-0.5 text-2xs font-bold text-foreground">
                  #{s.n}
                  {s.n === BEST_SHOT && <span title="Best shot" className="size-1.5 rounded-full bg-success" />}
                  {s.n === WEAKEST_SHOT && <span title="Weakest shot" className="size-1.5 rounded-full bg-sev-critical" />}
                </span>
                <span className={cn("font-mono text-3xs font-semibold", !hit ? "text-sev-critical" : points(s) === 10 ? "text-success" : "text-info")}>
                  {hit ? `${points(s)} pts` : "Miss"}
                </span>
              </button>
            );
          })}
        </div>
      )}
      <p className="mb-1 flex shrink-0 items-center gap-2 font-mono text-2xs text-muted-foreground">
        <span>Shot {shot.n}: <span className={cn("font-semibold", !fired ? "text-foreground" : isHit(shot) ? "text-foreground" : "text-sev-critical")}>{status}</span> · {passed}/{checks.length} met</span>
        {!live && tag && (
          <span className={cn("ml-auto rounded px-1.5 py-px font-sans text-3xs font-bold uppercase tracking-wider", shot.n === BEST_SHOT ? "bg-success/15 text-success" : "bg-sev-critical/15 text-sev-critical")}>{tag}</span>
        )}
      </p>
      <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
        {checks.map((c) => (
          <li
            key={c.label}
            className={cn(
              "flex min-h-0 flex-1 items-center gap-2 rounded-md px-2",
              c.ok === false ? "bg-sev-critical/[0.07]" : "bg-background"
            )}
          >
            {c.ok === null ? (
              <CircleDashed className="size-4 shrink-0 text-muted-foreground" aria-label="Pending" />
            ) : c.ok ? (
              <CircleCheck className="size-4 shrink-0 text-success" aria-label="Met" />
            ) : (
              <CircleX className="size-4 shrink-0 text-sev-critical" aria-label="Not met" />
            )}
            <span className="shrink-0 text-xs font-semibold text-foreground">{c.label}</span>
            <span className={cn("ml-auto line-clamp-2 text-right font-mono text-2xs leading-tight", c.ok === false ? "text-sev-critical" : "text-muted-foreground")}>{c.note}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* The report's notes for one shot: what went well, what went wrong, and the
   home drills (no rifle needed) for each fundamental it missed. */
const DRILL_FOR = { breath: (s: Shot) => !firedInPause(s), wobble: (s: Shot) => s.hold < 80, flinch: flinched } as const;

function ShotNotes({ shot }: { shot: Shot }) {
  const { well, wrong } = shotNotes(shot);
  const drills = HOME_DRILLS.filter((d) => DRILL_FOR[d.key](shot));
  const list = (items: string[], ok: boolean) => (
    <ul className="flex flex-col gap-0.5">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-1.5 text-2xs leading-snug text-foreground">
          <span className={cn("mt-1 size-1 shrink-0 rounded-full", ok ? "bg-success" : "bg-sev-critical")} />
          {t}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
      {well.length > 0 && <><p className="text-3xs font-bold uppercase tracking-wider text-success">What went well</p>{list(well, true)}</>}
      {wrong.length > 0 && <><p className="text-3xs font-bold uppercase tracking-wider text-sev-critical">What went wrong</p>{list(wrong, false)}</>}
      {drills.length > 0 && (
        <div className="rounded-md border-l-2 border-warning bg-warning/10 px-2 py-1.5">
          <p className="text-3xs font-bold uppercase tracking-wider text-warning">Home drills · no rifle · 15 min a day</p>
          {drills.map((d) => (
            <p key={d.key} className="mt-0.5 text-2xs leading-snug text-foreground"><strong>{d.label}:</strong> {d.text}</p>
          ))}
        </div>
      )}
    </div>
  );
}

/* Every shot of the session in one table — the old Shot Summary. */
function ShotTable({ selected, onSelect }: { selected: number; onSelect: (n: number) => void }) {
  const head = "px-1.5 py-1.5 text-left text-3xs font-semibold uppercase text-muted-foreground";
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-card">
          <tr className="border-b border-border">
            {([["#", "Shot"], ["Pts", "Points"], ["Aim", "From aim, mm"], ["Breath", "Breathing at the shot"], ["Wob", "Wobble in the last 1 s, mm"], ["Flinch", "Flinch, mm"], ["Off", "Ends off aim 2 s after, mm"], ["M/S", "Muzzle / shoulder peak, mm"]] as const).map(([h, full]) => <th key={h} title={full} className={head}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {SHOTS.map((s) => {
            const hit = isHit(s);
            const cell = "px-1.5 py-1.5 font-mono text-2xs";
            return (
              <tr
                key={s.n}
                tabIndex={0}
                onClick={() => onSelect(s.n)}
                onKeyDown={(e) => e.key === "Enter" && onSelect(s.n)}
                className={cn("cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/50", s.n === selected && "bg-muted", !hit && "bg-sev-critical/[0.05]")}
              >
                <td className={cn(cell, "font-semibold text-foreground")}>{s.n}</td>
                <td className={cn(cell, hit ? "text-foreground" : "text-sev-critical")}>{hit ? points(s) : "Miss"}</td>
                <td className={cn(cell, "text-muted-foreground")}>{radius(s).toFixed(1)}</td>
                <td className={cn(cell, firedInPause(s) ? "text-muted-foreground" : "text-sev-critical")}>{BREATH_LABEL[s.breath].replace("Natural ", "")}</td>
                <td className={cn(cell, s.wobbleMm > WOBBLE_LIMIT_MM ? "text-sev-critical" : "text-muted-foreground")}>{s.wobbleMm.toFixed(1)}</td>
                <td className={cn(cell, flinched(s) ? "text-sev-critical" : "text-muted-foreground")}>{s.flinchMm === null ? "n/a" : s.flinchMm.toFixed(1)}</td>
                <td className={cn(cell, settled(s) ? "text-muted-foreground" : "text-sev-critical")}>{s.settleMm.toFixed(1)}</td>
                <td className={cn(cell, "text-muted-foreground")}>{s.muzzlePeakMm}/{s.shoulderPeakMm}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="px-2 py-1.5 text-3xs text-muted-foreground">Distances in mm. Red: missed the limit (wobble {WOBBLE_LIMIT_MM}, flinch {FLINCH_LIMIT_MM}, settle {SETTLE_LIMIT_MM}).</p>
    </div>
  );
}

/* ── Signals ─────────────────────────────────────────────────────────── */

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

/* The shot's signals, T−3 s to T+2 s, after the report's traces. In live view
   they draw in as the shot is aimed and fired. Hovering one chart marks the
   same moment on the others. */
const WINDOW: [number, number] = [-3, 2];
const TICKS = [-3, -2, -1, 0, 1, 2];
const SYNC = { syncId: "aar-signals", syncMethod: "value" } as const;

function SignalsPanel({ className, shot, rel }: { className?: string; shot: Shot; rel: number }) {
  const upTo = <T extends { t: number }>(d: T[]) => d.filter((p) => p.t >= WINDOW[0] && p.t <= Math.min(WINDOW[1], rel));
  const muzzle = React.useMemo(() => muzzleSeries(shot), [shot]);
  const breath = React.useMemo(() => breathingSeries(shot), [shot]);
  const hold = React.useMemo(() => wobbleSeries(shot), [shot]);
  const flinch = React.useMemo(() => flinchSeries(shot), [shot]);
  const muzzleData = upTo(muzzle);
  const breathData = upTo(breath);
  const holdData = upTo(hold);
  const flinchData = flinch.filter((p) => p.ms <= rel * 1000);
  const waiting = rel < WINDOW[0];
  const waitText = `Starts 3 s before shot ${shot.n}`;
  const inPause = firedInPause(shot);
  const flinchCount = `${SHOTS.filter(flinched).length}/${SHOTS.filter((x) => x.flinchMm !== null).length} flinched`;
  const meta = waiting ? `in ${Math.ceil(-rel)} s` : "Live";

  return (
    <Panel
      className={className}
      title="Shot Signals"
      action={<InfoTip text={METHOD_NOTE} />}
      bodyClassName="grid grid-cols-2 grid-rows-2 gap-2 max-lg:auto-rows-[110px]"
    >
      <MiniChart title={`Muzzle · #${shot.n}`} empty={waiting ? waitText : undefined} value={rel >= 0 ? (flinched(shot) ? "Flinch at break" : "Steady at break") : meta} bad={rel >= 0 && flinched(shot)}
        legend={<><Swatch c="bg-foreground" />L–R <Swatch c="bg-warning" />U–D <Swatch c="bg-muted-foreground/30" />Hold <Swatch c="bg-primary/30" />After</>}>
        <LineChart data={muzzleData} margin={{ top: 4, right: 4, left: -30, bottom: -6 }} {...SYNC}>
          <ReferenceArea x1={-3} x2={0} fill="var(--muted-foreground)" fillOpacity={0.06} strokeOpacity={0} />
          <ReferenceArea x1={0} x2={2} fill="var(--primary)" fillOpacity={0.07} strokeOpacity={0} />
          <ReferenceArea y1={-1.5} y2={1.5} fill="var(--success)" fillOpacity={0.1} strokeOpacity={0} />
          <XAxis dataKey="t" type="number" domain={WINDOW} ticks={TICKS} {...AXIS} />
          <YAxis domain={[-8, 8]} ticks={[-6, 0, 6]} {...AXIS} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `${v} s`} formatter={(v, n) => [`${Number(v).toFixed(1)} mm`, n === "lr" ? "Left–right" : "Up–down"]} />
          <ReferenceLine x={0} stroke="var(--foreground)" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="lr" stroke="var(--foreground)" strokeWidth={1.4} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="ud" stroke="var(--warning)" strokeWidth={1.4} dot={false} isAnimationActive={false} />
        </LineChart>
      </MiniChart>
      <MiniChart title="Breathing" empty={waiting ? waitText : undefined} value={rel >= 0 ? (inPause ? "In the pause" : `On ${BREATH_LABEL[shot.breath].toLowerCase()}`) : "Live"} bad={rel >= 0 && !inPause}
        legend={<><Swatch c="bg-success/50" />Pause <Swatch c="bg-info/50" />Inhale · {SESSION.breathingRate}/min · {SESSION.breathingAmplitude.toFixed(2)}×</>}>
        <LineChart data={breathData} margin={{ top: 4, right: 4, left: -30, bottom: -6 }} {...SYNC}>
          {phaseBands(breathData).map((b) => (
            <ReferenceArea key={`${b.from}-${b.phase}`} x1={b.from} x2={b.to + 0.1} fill={PHASE_FILL[b.phase]} fillOpacity={0.14} strokeOpacity={0} />
          ))}
          <XAxis dataKey="t" type="number" domain={WINDOW} ticks={TICKS} {...AXIS} />
          <YAxis domain={[0, 1.4]} ticks={[0, 1]} {...AXIS} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `${v} s`} formatter={(v) => [Number(v).toFixed(2), "Chest"]} />
          <ReferenceLine x={0} stroke={rel >= 0 ? (inPause ? "var(--success)" : "var(--sev-critical)") : "var(--border)"} strokeWidth={2} />
          <Line type="monotone" dataKey="chest" stroke="var(--info)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </MiniChart>
      <MiniChart title="Hold" empty={waiting ? waitText : undefined} value={rel >= -1 ? `${shot.hold}/100` : "Live"} bad={rel >= -1 && shot.hold < 80}
        legend={<><Swatch c="bg-warning" />RMS mm · after {shot.afterRmsMm.toFixed(1)} · {shot.stability}/5</>}>
        <LineChart data={holdData} margin={{ top: 4, right: 4, left: -30, bottom: -6 }} {...SYNC}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
          <XAxis dataKey="t" type="number" domain={WINDOW} ticks={TICKS} {...AXIS} />
          <YAxis domain={[0, 14]} ticks={[0, 7, 14]} {...AXIS} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `${v} s`} formatter={(v) => [`${Number(v).toFixed(2)} mm`, "Sway RMS"]} />
          <ReferenceLine x={0} stroke="var(--foreground)" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="rms" stroke="var(--warning)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </MiniChart>
      <MiniChart title="Flinch" empty={rel < -0.5 ? "Read as the shot breaks" : undefined} value={rel >= 0 ? (shot.flinchMm === null ? "Not measured" : `${shot.flinchMm.toFixed(1)} mm max`) : "At the break"} bad={rel >= 0 && flinched(shot)}
        legend={<><Swatch c="bg-sev-critical" />Limit {FLINCH_LIMIT_MM} mm · {flinchCount}</>}>
        <LineChart data={flinchData} margin={{ top: 4, right: 4, left: -30, bottom: -6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
          <XAxis dataKey="ms" type="number" domain={[-500, 100]} ticks={[-400, -200, 0]} {...AXIS} />
          <YAxis domain={[-5, 12]} ticks={[0, 5, 10]} {...AXIS} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `${v} ms`} formatter={(v) => [`${Number(v).toFixed(1)} mm`, "Deviation"]} />
          <ReferenceLine y={FLINCH_LIMIT_MM} stroke="var(--sev-critical)" strokeDasharray="4 3" />
          <Line type="monotone" dataKey="dev" stroke="var(--primary)" strokeWidth={1.6} dot={false} isAnimationActive={false} />
        </LineChart>
      </MiniChart>
    </Panel>
  );
}

function Swatch({ c }: { c: string }) {
  return <span className={cn("ml-1.5 inline-block h-1.5 w-2.5 rounded-sm align-middle first:ml-0", c)} />;
}

function MiniChart({ title, value, bad, legend, empty, children }: {
  title: string; value: string; bad?: boolean; legend: React.ReactNode; empty?: string; children: React.ReactElement;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-col rounded-lg border border-border bg-background px-2 pt-1.5">
      <div className="flex items-baseline gap-2">
        <span className="shrink-0 text-2xs font-semibold text-foreground">{title}</span>
        <span className={cn("ml-auto truncate font-mono text-3xs font-semibold", bad ? "text-sev-critical" : "text-muted-foreground")}>{value}</span>
      </div>
      <div className="relative min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
        {empty && <p className="absolute inset-0 grid place-items-center text-center text-2xs text-muted-foreground">{empty}</p>}
      </div>
      <p className="truncate pb-1 text-3xs text-muted-foreground">{legend}</p>
    </div>
  );
}

/* Recoil & muzzle movement — the old Recoil panel: each line scaled to its own peak. */
function RecoilChart({ shot, rel }: { shot: Shot; rel: number }) {
  const data = React.useMemo(() => recoilSeries(shot).filter((p) => p.t >= -8 && p.t <= 1), [shot]);
  const shown = data.filter((p) => p.t <= rel);
  return (
    <>
      <div className="flex shrink-0 flex-wrap gap-x-3 gap-y-0.5 text-3xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-0.5 w-3 rounded bg-sev-critical" />Muzzle {shot.muzzlePeakMm} mm</span>
        <span className="flex items-center gap-1"><span className="h-0.5 w-3 rounded bg-info" />Shoulder {shot.shoulderPeakMm} mm</span>
        <span className="flex items-center gap-1"><span className="h-2 w-0.5 bg-success" />Bolt carrier</span>
        <span className="flex items-center gap-1"><span className="h-2 w-0.5 bg-warning" />Ejection</span>
      </div>
      <div className="relative min-h-0 flex-1 max-lg:h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={shown} margin={{ top: 6, right: 6, left: -26, bottom: -4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
            <XAxis dataKey="t" type="number" domain={[-8, 1]} ticks={[-8, -6, -4, -2, 0, 1]} {...AXIS} />
            <YAxis domain={[0, 1]} ticks={[0, 0.5, 1]} {...AXIS} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `${v} s`} formatter={(v, n) => [Number(v).toFixed(2), n === "muzzle" ? "Muzzle" : "Shoulder"]} />
            <ReferenceLine x={0} stroke="var(--foreground)" strokeDasharray="4 3" />
            {rel >= 0.1 && shot.cues.bolt && <ReferenceLine x={0.1} stroke="var(--success)" />}
            {rel >= 0.2 && shot.cues.ejection && <ReferenceLine x={0.2} stroke="var(--warning)" />}
            <Line type="monotone" dataKey="shoulder" stroke="var(--info)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="muzzle" stroke="var(--sev-critical)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
        {shown.length === 0 && <p className="absolute inset-0 grid place-items-center text-2xs text-muted-foreground">Starts 8 s before shot {shot.n}</p>}
      </div>
      <p className="shrink-0 text-center text-3xs text-muted-foreground">Time from shot (s) · relative to each line's peak</p>
    </>
  );
}

/* Event markers — the old panel: each cue the analyser picked up, per shot. */
function EventMarkers({ selected }: { selected: number }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <table className="w-full border-separate border-spacing-y-0.5">
        <thead>
          <tr>
            <th className="text-left text-3xs font-semibold uppercase text-muted-foreground">Marker</th>
            {SHOTS.map((s) => (
              <th key={s.n} className={cn("w-8 rounded font-mono text-2xs font-semibold", s.n === selected ? "bg-primary/15 text-primary" : isHit(s) ? "text-muted-foreground" : "text-sev-critical")}>{s.n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CUES.map((c) => (
            <tr key={c.key}>
              <td className="py-0.5 pr-2 text-xs text-foreground">
                <span className="flex items-center gap-1.5">
                  <span className={cn("size-1.5 shrink-0 rounded-sm", c.fault ? "bg-sev-critical" : "bg-info")} />
                  <span className="truncate">{c.label}</span>
                </span>
              </td>
              {SHOTS.map((s) => {
                const on = s.cues[c.key];
                return (
                  <td key={s.n} className={cn("text-center", s.n === selected && "bg-muted")}>
                    <span title={`Shot ${s.n} · ${c.label} ${on ? "detected" : "not seen"}`} className={cn("mx-auto block size-2.5 rounded-full", on ? (c.fault ? "bg-sev-critical" : "bg-info") : "border border-border")} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-auto pt-1 text-3xs text-muted-foreground">Blue: detected · red: a fault · hollow: not seen. The highlighted column is the selected shot.</p>
    </div>
  );
}

/* ── Fundamentals ────────────────────────────────────────────────────── */

/* The four fundamentals graded A–F, each against last session: the grey bar is
   last time, the solid bar this time. */
function FundamentalsPanel({ className, shots, live }: { className?: string; shots: Shot[]; live: boolean }) {
  const factors = factorsFor(shots);
  const total = factorsMetTotal(shots);
  const delta = total.met - PREVIOUS_MET_TOTAL;
  return (
    <Panel
      className={className}
      title="Fundamentals"
      meta={live ? "Provisional" : `vs ${PREVIOUS.date}`}
      action={<InfoTip text={`Each fundamental is scored 0–100 on every shot and graded on the average: ${GRADE_BANDS.map(([g, m]) => `${g} ${m}+`).join(" · ")}.`} />}
    >
      <p className="mb-1.5 shrink-0 text-2xs text-muted-foreground">
        Factors met, all shots <span className="font-mono font-semibold text-foreground">{total.met}/{total.of}</span>
        {!live && <span className={cn("font-mono font-semibold", delta >= 0 ? "text-success" : "text-sev-critical")}> {delta >= 0 ? "▲ +" : "▼ −"}{Math.abs(delta)}</span>}
      </p>
      <ul className="flex min-h-0 flex-1 flex-col justify-between gap-1.5">
        {factors.map((f) => {
          const any = f.of > 0;
          const d = f.score - f.prev;
          return (
            <li key={f.key} className="flex min-h-0 items-center gap-2">
              {any ? <GradeBadge score={f.score} /> : <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-xs text-muted-foreground">—</span>}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <UiTooltip>
                    <TooltipTrigger asChild>
                      <span className="truncate text-xs font-semibold text-foreground">{f.label}</span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-64 text-xs">{f.measure}</TooltipContent>
                  </UiTooltip>
                </div>
                <div className="mt-1 flex flex-col gap-0.5">
                  <div className="h-1 rounded-full bg-muted"><div className="h-full rounded-full bg-muted-foreground/40" style={{ width: `${f.prev}%` }} /></div>
                  <div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-foreground" style={{ width: `${any ? f.score : 0}%` }} /></div>
                </div>
                <p className="mt-0.5 truncate font-mono text-3xs text-muted-foreground">{f.met}/{f.of} shots met</p>
              </div>
              <div className="w-9 shrink-0 text-right leading-tight">
                <p className="font-mono text-sm font-bold text-foreground">{any ? f.score : "—"}</p>
                {!live && any && <p className={cn("font-mono text-3xs font-semibold", d >= 0 ? "text-success" : "text-sev-critical")}>{d >= 0 ? "▲ +" : "▼ −"}{Math.abs(d)}</p>}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 flex shrink-0 items-center gap-3 text-3xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-1 w-3 rounded-full bg-muted-foreground/40" />{PREVIOUS.date}</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-foreground" />This session</span>
      </p>
    </Panel>
  );
}

/* The report's factor grades table, its grade scale, and what improved or got worse. */
function GradesTable({ shots, full = false }: { shots: Shot[]; full?: boolean }) {
  const factors = factorsFor(shots);
  const up = factors.filter((f) => f.score > f.prev).sort((a, b) => b.score - b.prev - (a.score - a.prev));
  const down = factors.filter((f) => f.score < f.prev);
  const overall = overallFor(shots);
  const cell = "px-1 py-1 text-2xs";
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border text-left text-3xs uppercase text-muted-foreground">
            <th className="px-1 py-1 font-semibold">Factor</th>{full && <th className="px-1 py-1 font-semibold">What the system measured</th>}<th className="px-1 py-1 font-semibold">Met</th>
            <th className="px-1 py-1 font-semibold">Now</th><th className="px-1 py-1 font-semibold">{PREVIOUS.date}</th><th className="px-1 py-1 font-semibold" title="Change since last session">±</th>
          </tr>
        </thead>
        <tbody>
          {factors.map((f) => {
            const d = f.score - f.prev;
            return (
              <tr key={f.key} className="border-b border-border/60 last:border-0" title={f.measure}>
                <td className={cn(cell, "font-semibold text-foreground")}>{f.label}</td>
                {full && <td className={cn(cell, "text-muted-foreground")}>{f.measure}</td>}
                <td className={cn(cell, "font-mono text-muted-foreground")}>{f.met}/{f.of}</td>
                <td className={cell}><span className="flex items-center gap-1 font-mono text-foreground"><GradeBadge score={f.score} size="sm" />{f.score}</span></td>
                <td className={cell}><span className="flex items-center gap-1 font-mono text-muted-foreground"><GradeBadge score={f.prev} size="sm" />{f.prev}</span></td>
                <td className={cn(cell, "font-mono font-semibold", d >= 0 ? "text-success" : "text-sev-critical")}>{d >= 0 ? `▲ +${d}` : `▼ −${-d}`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="flex flex-wrap gap-x-2 gap-y-0.5 font-mono text-3xs text-muted-foreground">
        {GRADE_BANDS.map(([g, m], i) => <span key={g}>{g} {i === 0 ? "90–100" : i === GRADE_BANDS.length - 1 ? "<50" : `${m}–${m + 9}`}</span>)}
      </p>
      {up.length > 0 && (
        <p className="rounded-md bg-success/10 px-2 py-1 text-2xs leading-snug text-foreground">
          <strong className="text-success">▲ Improved:</strong> {up.map((f) => `${f.label.toLowerCase()} +${f.score - f.prev}`).join(", ")}. Overall {gradeOf(PREVIOUS_OVERALL)} → {gradeOf(overall)}.
        </p>
      )}
      {down.map((f) => (
        <p key={f.key} className="rounded-md bg-sev-critical/10 px-2 py-1 text-2xs leading-snug text-foreground">
          <strong className="text-sev-critical">▼ Got worse:</strong> {f.label.toLowerCase()} −{f.prev - f.score}; {f.of - f.met} of {f.of} shots missed it. Make this the focus next session.
        </p>
      ))}
    </div>
  );
}

/* ── Coaching (results) ──────────────────────────────────────────────── */

/* What to work on, ranked by the points each fault cost a shot, then where the
   session sits: the trend over five sessions, the platoon, and badges earned. */
/** The full-report panel that shows each recommendation's evidence. */
const PANEL_ID: Record<string, string> = {
  Breathing: "aar-breathing", "Flinch Indicator": "aar-flinch", "Stability / Wobble": "aar-stability", "Wobble Bubble": "aar-wobble",
};

function SeeLink({ r, onOpen }: { r: (typeof RANKED_RECS)[number]; onOpen: (n: number, id: string) => void }) {
  return (
    <button type="button" onClick={() => r.shots[0] && onOpen(r.shots[0], PANEL_ID[r.panel] ?? "aar-analysis")} className="shrink-0 text-3xs font-semibold text-primary hover:underline">
      See {r.panel}
    </button>
  );
}

function CoachingPanel({ className, onSelect, onOpen }: { className?: string; onSelect: (n: number) => void; onOpen: (n: number, id: string) => void }) {
  const recs = RANKED_RECS.slice(0, 2);
  return (
    <Panel
      className={className}
      title="Coaching"
      meta="By points lost a shot"
      action={
        <button type="button" onClick={() => document.getElementById("aar-report")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="text-2xs font-semibold text-primary hover:underline">
          Full report ↓
        </button>
      }
      bodyClassName="gap-2"
    >
      <ol className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden" aria-label="Top two things to work on">
        {recs.map((r, i) => (
          <li key={r.key} className={cn("shrink-0 rounded-lg border bg-background px-2.5 py-1.5", i === 0 ? "border-sev-critical/35" : "border-border")}>
            <div className="flex items-center gap-2">
              <span className={cn("grid size-4 shrink-0 place-items-center rounded-full text-3xs font-bold", i === 0 ? "bg-sev-critical/15 text-sev-critical" : "bg-muted text-muted-foreground")}>{i + 1}</span>
              <span className="line-clamp-2 text-xs font-semibold leading-tight text-foreground">{r.title}</span>
              <span className="ml-auto shrink-0 font-mono text-3xs font-semibold text-sev-critical">−{r.cost.toFixed(1)} pts</span>
            </div>
            <p className="mt-0.5 flex items-start gap-1 text-2xs leading-snug text-muted-foreground">
              <Dumbbell className="mt-px size-3 shrink-0" />
              <span className="line-clamp-1">{r.drill}</span>
              <span className="ml-auto flex shrink-0 gap-1">
                {r.shots.map((n) => (
                  <button key={n} type="button" onClick={() => onSelect(n)} className="rounded border border-border bg-card px-1 font-mono text-3xs text-foreground hover:border-foreground/40">
                    #{n}
                  </button>
                ))}
              </span>
            </p>
            <div className="flex justify-end"><SeeLink r={r} onOpen={onOpen} /></div>
          </li>
        ))}
      </ol>
      <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-2">
        <div className="rounded-lg border border-border bg-background px-2 pt-1.5">
          <p className="flex items-baseline justify-between text-2xs font-semibold text-foreground">
            Trend <span className="font-mono text-3xs text-muted-foreground">last {TREND.length}</span>
          </p>
          <div className="h-[72px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TREND} margin={{ top: 12, right: 10, left: 10, bottom: 2 }}>
                <XAxis dataKey="date" {...AXIS} interval={0} tickFormatter={(d: string) => d.split(" ")[0]} height={12} />
                <YAxis hide domain={[50, 90]} />
                <ReferenceLine y={80} stroke="var(--success)" strokeDasharray="3 3" label={{ value: "B", position: "insideRight", fontSize: 8, fill: "var(--success)" }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [String(v), "Overall"]} />
                <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={1.8} dot={{ r: 2 }} isAnimationActive={false}>
                  <LabelList dataKey="score" position="top" offset={4} fontSize={8} fill="var(--muted-foreground)" />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5">
          <p className="truncate text-2xs text-muted-foreground" title={`${PEERS.betterThanPct}% of ${PEERS.group} scored lower`}>
            Beat <span className="font-mono text-md font-bold text-primary">{PEERS.betterThanPct}%</span> of {PEERS.group}
          </p>
          <p className="truncate font-mono text-3xs text-muted-foreground">{PEERS.rank}th of {PEERS.of} · avg {PEERS.average}</p>
          <div className="flex flex-wrap gap-1 overflow-hidden [max-height:38px]">
            {BADGES.map((b) => (
              <UiTooltip key={b.title}>
                <TooltipTrigger asChild>
                  <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full border border-warning/30 bg-warning/10 px-1.5 py-px text-3xs font-semibold text-warning">
                    <Award className="size-2.5" />{b.title}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-xs">{b.detail}</TooltipContent>
              </UiTooltip>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

/* The full list — the old verdict, every recommendation with its evidence and
   drill, and what's working well. */
function AllRecommendations({ onSelect, onOpen }: { onSelect: (n: number) => void; onOpen: (n: number, id: string) => void }) {
  const [top, next] = RANKED_RECS;
  const gained = STATS_ALL.points - PREVIOUS.points;
  const shotsText = (ns: number[]) => `shot${ns.length === 1 ? "" : "s"} ${ns.join(", ")}`;
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
      <p className="shrink-0 text-xs leading-snug text-foreground">
        <strong>{STATS_ALL.points}/{STATS_ALL.maxPoints}</strong> with {STATS_ALL.misses} miss{STATS_ALL.misses === 1 ? "" : "es"}
        {gained !== 0 && <>, {gained > 0 ? "up" : "down"} {Math.abs(gained)} on {PREVIOUS.date}</>}.
        {top && <> Biggest loss: <strong>{top.short}</strong> ({shotsText(top.shots)}){next && <>, then {next.short} ({shotsText(next.shots)})</>}.</>}
      </p>
      {RANKED_RECS.map((r, i) => (
        <div key={r.key} className={cn("shrink-0 rounded-lg border bg-background px-2.5 py-1.5", i === 0 ? "border-sev-critical/35" : "border-border")}>
          <div className="flex items-start gap-2">
            <span className="text-xs font-semibold leading-tight text-foreground">{i + 1}. {r.title}</span>
            <span className="ml-auto shrink-0 font-mono text-3xs font-semibold text-sev-critical">−{r.cost.toFixed(1)} pts</span>
          </div>
          <p className="text-2xs text-muted-foreground">{r.evidence} · avg {r.withAvg.toFixed(1)} vs {r.withoutAvg.toFixed(1)} pts without</p>
          <p className="mt-0.5 flex items-start gap-1 text-2xs leading-snug text-foreground"><Dumbbell className="mt-px size-3 shrink-0 text-muted-foreground" />{r.drill}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {r.shots.map((n) => (
              <button key={n} type="button" onClick={() => onSelect(n)} className="rounded border border-border bg-card px-1 font-mono text-3xs text-foreground hover:border-foreground/40">Shot {n}</button>
            ))}
            <span className="ml-auto"><SeeLink r={r} onOpen={onOpen} /></span>
          </div>
        </div>
      ))}
      <div className="shrink-0 rounded-md border-l-2 border-warning bg-warning/10 px-2 py-1.5">
        <p className="text-3xs font-bold uppercase tracking-wider text-warning">Home coaching drills · no rifle needed · 15 min a day</p>
        {HOME_DRILLS.map((d) => <p key={d.key} className="mt-0.5 text-2xs leading-snug text-foreground"><strong>{d.label}:</strong> {d.text}</p>)}
      </div>
      {WORKING_WELL.map((w) => (
        <p key={w} className="flex shrink-0 items-center gap-1.5 text-2xs text-foreground">
          <span className="font-bold uppercase tracking-widest text-success">Keep doing</span>
          <CircleCheck className="size-3.5 text-success" />{w}
        </p>
      ))}
    </div>
  );
}

/* Where the session sits against the platoon, company and batch — the report's
   comparisons and achievements. */
function Standing() {
  const you = TREND[TREND.length - 1].score;
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
      <div className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
        <span className="font-mono text-2xl font-bold text-primary">{PEERS.betterThanPct}%</span>
        <p className="text-2xs leading-snug text-muted-foreground">of {PEERS.group} scored lower this session. You placed <strong className="text-foreground">{PEERS.rank}th of {PEERS.of}</strong>.</p>
      </div>
      <div className="grid shrink-0 grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-border bg-background px-2 pt-1">
          <p className="text-3xs font-semibold uppercase text-muted-foreground">{PEERS.group} scores</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PLATOON_BINS} margin={{ top: 12, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="band" {...AXIS} fontSize={10} interval={0} height={16} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [String(v), "Firers"]} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="count" radius={[2, 2, 0, 0]} isAnimationActive={false}>
                  {PLATOON_BINS.map((b) => <Cell key={b.band} fill={b.you ? "var(--primary)" : "var(--muted-foreground)"} fillOpacity={b.you ? 1 : 0.35} />)}
                  <LabelList dataKey="count" position="top" fontSize={10} fill="var(--muted-foreground)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="min-w-0 rounded-lg border border-border bg-background px-2 pt-1">
          <p className="text-3xs font-semibold uppercase text-muted-foreground">Average by unit · you {you}</p>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={UNIT_AVERAGES} layout="vertical" margin={{ top: 2, right: 4, left: 0, bottom: 0 }} barCategoryGap={1}>
                <XAxis type="number" domain={[50, 80]} hide />
                <YAxis type="category" dataKey="unit" {...AXIS} fontSize={10} width={52} interval={0} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [String(v), "Average"]} cursor={{ fill: "var(--muted)" }} />
                <ReferenceLine x={you} stroke="var(--primary)" strokeWidth={1.5} />
                <Bar dataKey="avg" fill="var(--muted-foreground)" fillOpacity={0.35} radius={[0, 2, 2, 0]} isAnimationActive={false}>
                  <LabelList dataKey="avg" position="right" fontSize={9} fill="var(--muted-foreground)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <table className="w-full shrink-0 border-collapse">
        <thead>
          <tr className="border-b border-border text-left text-3xs uppercase text-muted-foreground">
            <th className="py-1 pr-1 font-semibold">Compared with</th><th className="px-1 py-1 font-semibold">Place</th><th className="px-1 py-1 font-semibold">Better than</th><th className="px-1 py-1 font-semibold">Avg</th>
          </tr>
        </thead>
        <tbody>
          {COMPARISONS.map((c) => (
            <tr key={c.group} className="border-b border-border/60 text-2xs last:border-0">
              <td className="py-1 pr-1 font-semibold text-foreground">{c.group}</td>
              <td className="px-1 py-1 font-mono text-muted-foreground">{c.place}</td>
              <td className="px-1 py-1 font-mono text-muted-foreground">{c.betterThan}%</td>
              <td className="px-1 py-1 font-mono text-muted-foreground">{c.average}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="grid shrink-0 grid-cols-2 gap-1">
        {BADGES.map((b) => (
          <div key={b.title} className="flex items-start gap-1.5 rounded-md border border-border bg-background px-2 py-1">
            <Award className="mt-px size-3.5 shrink-0 text-warning" />
            <div className="min-w-0"><p className="text-2xs font-semibold text-foreground">{b.title}</p><p className="text-3xs leading-snug text-muted-foreground">{b.detail}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Live cues ───────────────────────────────────────────────────────── */

/* While shooting: one cue for the shot being aimed, read off the breathing and
   hold as they come in, then what each fired shot said to fix. */
const CUE_FOR: Record<RecKey, (s: Shot) => boolean> = {
  trigger: flinched,
  breath: (s) => !firedInPause(s),
  settle: (s) => s.hold < 80,
  hold: (s) => !settled(s),
};

function LiveCuesPanel({ className, shot, rel, fired }: { className?: string; shot: Shot; rel: number; fired: Shot[] }) {
  const breath = breathingSeries(shot);
  const now = breath.find((p) => p.t >= Math.min(0, rel)) ?? breath[breath.length - 1];
  const cue =
    rel >= 0 ? { tone: "info", text: rel < FOLLOW_THROUGH ? "Follow through — keep the sight picture" : "Reset for the next shot" }
    : rel < -3 ? { tone: "muted", text: "Settle into position and acquire the target" }
    : now.phase === "pause" ? { tone: "success", text: "In the natural pause — squeeze now" }
    : { tone: "warning", text: `${BREATH_LABEL[now.phase]} — wait for the pause` };
  const toneCls = { info: "border-info/35 bg-info/10 text-info", muted: "border-border bg-background text-muted-foreground", success: "border-success/40 bg-success/10 text-success", warning: "border-warning/40 bg-warning/10 text-warning" }[cue.tone];
  const notes = [...fired].reverse().flatMap((s) =>
    (Object.keys(CUE_FOR) as RecKey[]).filter((k) => CUE_FOR[k](s)).map((k) => ({ n: s.n, key: k, text: REC_DETAIL[k].short }))
  );
  return (
    <Panel className={className} title="Live Cues" meta={`Shot ${shot.n} · ${rel >= 0 ? "fired" : "aiming"}`} bodyClassName="gap-2">
      <div className={cn("shrink-0 rounded-lg border px-3 py-2.5", toneCls)}>
        <p className="text-3xs font-bold uppercase tracking-widest opacity-80">Now</p>
        <p className="text-md font-bold leading-snug">{cue.text}</p>
      </div>
      <p className="shrink-0 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">From shots so far</p>
      <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
        {notes.length === 0 ? (
          <li className="text-xs text-muted-foreground">{fired.length ? "Clean so far — keep it up." : "Cues appear here after each shot."}</li>
        ) : (
          notes.slice(0, 5).map((c) => (
            <li key={`${c.n}-${c.key}`} className="flex items-center gap-2 rounded-md bg-background px-2 py-1">
              <span className="font-mono text-2xs font-bold text-foreground">#{c.n}</span>
              <span className="truncate text-xs text-foreground first-letter:uppercase">{c.text}</span>
              <CircleX className="ml-auto size-3.5 shrink-0 text-sev-critical" />
            </li>
          ))
        )}
      </ul>
    </Panel>
  );
}

/* ── Full report (below the overview) ────────────────────────────────── */

/* Everything the overview summarises, at full size: the selected shot's
   analysis, best vs weakest shot, the grades table, the trend, standing,
   every recommendation, and how the session was analysed. The page scrolls
   to it; nothing here is hidden behind tabs. */
function FullReport({ selected, onSelect, onOpen }: { selected: number; onSelect: (n: number) => void; onOpen: (n: number, id: string) => void }) {
  const shot = shotByN(selected);
  return (
    <div id="aar-report" className="flex scroll-mt-4 flex-col gap-4 border-t border-border pt-5">
      <div>
        <h2 className="text-lg font-bold text-foreground">Full report</h2>
        <p className="text-sm text-muted-foreground">Everything from the session in detail. Scroll back up for the overview.</p>
      </div>

      {/* Shot analysis — follows the picked shot */}
      <section id="aar-analysis" className="flex scroll-mt-4 flex-col gap-3">
        <div className="sticky top-12 z-[var(--z-sticky)] -mx-1 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/95 px-3 py-2 backdrop-blur-sm">
          <h3 className="text-md font-bold text-foreground">Shot analysis</h3>
          <span className="text-xs text-muted-foreground">Every panel in this section follows the picked shot.</span>
          <div role="tablist" aria-label="Shots" className="ml-auto flex gap-1">
            {SHOTS.map((s) => (
              <button
                key={s.n}
                type="button"
                role="tab"
                aria-selected={s.n === shot.n}
                onClick={() => onSelect(s.n)}
                className={cn(
                  "rounded-md border px-2 py-0.5 font-mono text-2xs font-semibold transition-colors",
                  s.n === shot.n ? "border-primary bg-primary/10 text-foreground shadow-[inset_0_0_0_1px_var(--primary)]" : "border-border bg-background hover:border-primary/40",
                  !isHit(s) && s.n !== shot.n && "text-sev-critical"
                )}
              >
                #{s.n} · {isHit(s) ? points(s) : "Miss"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <Panel className="lg:col-span-7" title="Recoil & Muzzle Movement" meta={`Shot ${shot.n} · 8 s before to 1 s after`} bodyClassName="h-64">
            <RecoilChart shot={shot} rel={Infinity} />
          </Panel>
          <Panel className="lg:col-span-5" title="Event Markers" meta={`Last ${SHOTS.length} shots`}>
            <EventMarkers selected={shot.n} />
          </Panel>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <BreathingDetail shot={shot} />
          <StabilityDetail shot={shot} />
          <FlinchDetail shot={shot} />
        </div>

        <div id="aar-wobble" className="scroll-mt-28">
          <Panel title="Wobble Bubble" meta={`Shot ${shot.n} · ring = 95% sway ellipse (${SESSION.swayEllipseMm} mm long axis over the session) · ${SESSION.dominantSway.toLowerCase()} sway`}>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {shot.sway.map((w) => <div key={w.t} className="h-36"><WobblePlot shot={shot} w={w} /></div>)}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-2xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-info" />Before the shot · sway and its ellipse</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" />After the shot · where the muzzle went</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-sev-critical" />Flinch over {FLINCH_LIMIT_MM} mm, or ends over {SETTLE_LIMIT_MM} mm off aim</span>
            </div>
          </Panel>
        </div>

        <Panel title="Shot Summary" meta="Every shot of the session · click a row to review it" bodyClassName="p-0">
          <ShotTable selected={shot.n} onSelect={onSelect} />
        </Panel>
      </section>

      {/* Best vs weakest, as the report sets them side by side */}
      <section className="flex flex-col gap-3">
        <h3 className="text-md font-bold text-foreground">Shot review · best and weakest</h3>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ShotCard shot={shotByN(BEST_SHOT)} kind="best" onSelect={onSelect} />
          <ShotCard shot={shotByN(WEAKEST_SHOT)} kind="weakest" onSelect={onSelect} />
        </div>
      </section>

      {/* Grades, and how they moved */}
      <section className="flex flex-col gap-3">
        <h3 className="text-md font-bold text-foreground">Factor grades</h3>
        <Panel title="Fundamentals" meta={`This session vs ${PREVIOUS.date} · hover a row for detail`}>
          <GradesTable shots={SHOTS} full />
        </Panel>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <PreviousVsCurrent />
          <TrendCard />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-md font-bold text-foreground">Comparisons and achievements</h3>
        <Panel title="Standing" meta="Same practice, SAR 21, 25 m">
          <Standing />
        </Panel>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <Panel className="lg:col-span-7" title="Recommendations" meta="Every fault, biggest cost per shot first">
          <AllRecommendations onSelect={onSelect} onOpen={onOpen} />
        </Panel>
        <SessionDetails className="lg:col-span-5" />
      </section>
    </div>
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

const DETAIL_WINDOW: [number, number] = [-8, 1];
const DETAIL_TICKS = [-8, -6, -4, -2, 0, 1];
const DETAIL_SYNC = { syncId: "aar-detail", syncMethod: "value" } as const;

function BreathingDetail({ shot }: { shot: Shot }) {
  const data = React.useMemo(() => breathingSeries(shot).filter((p) => p.t >= DETAIL_WINDOW[0]), [shot]);
  const inPause = firedInPause(shot);
  return (
    <div id="aar-breathing" className="scroll-mt-28">
      <Panel title="Breathing" meta={`Shot ${shot.n} · ${SESSION.sources.split(" · ")[0]}`}>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, left: -26, bottom: 0 }} {...DETAIL_SYNC}>
              {phaseBands(data).map((b) => (
                <ReferenceArea key={`${b.from}-${b.phase}`} x1={b.from} x2={b.to + 0.1} fill={PHASE_FILL[b.phase]} fillOpacity={0.12} strokeOpacity={0} />
              ))}
              <XAxis dataKey="t" type="number" domain={DETAIL_WINDOW} ticks={DETAIL_TICKS} {...AXIS} />
              <YAxis domain={[0, 1.4]} ticks={[0, 0.5, 1]} {...AXIS} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `${v} s`} formatter={(v) => [Number(v).toFixed(2), "Chest"]} />
              <ReferenceLine x={0} stroke={inPause ? "var(--success)" : "var(--sev-critical)"} strokeWidth={2} />
              <Line type="monotone" dataKey="chest" stroke="var(--info)" strokeWidth={1.8} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 flex flex-wrap gap-x-3 text-3xs text-muted-foreground">
          <span><Swatch c="bg-info/40" />Inhale</span><span><Swatch c="bg-muted-foreground/40" />Exhale</span><span><Swatch c="bg-success/40" />Natural pause</span>
        </p>
        <dl className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
          <Stat label="Phase at shot" value={inPause ? "Pause" : BREATH_LABEL[shot.breath]} bad={!inPause} />
          <Stat label="Rate" value={`${SESSION.breathingRate} /min`} info="Breaths per minute." />
          <Stat label="Depth" value={`${SESSION.breathingAmplitude.toFixed(2)}×`} info="How deep the breaths are, relative to a normal resting breath (1.00×)." />
        </dl>
      </Panel>
    </div>
  );
}

function StabilityDetail({ shot }: { shot: Shot }) {
  const data = React.useMemo(() => wobbleSeries(shot), [shot]);
  return (
    <div id="aar-stability" className="scroll-mt-28">
      <Panel title="Stability / Wobble" meta={`Shot ${shot.n} · how much the aim moved`}>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, left: -26, bottom: 0 }} {...DETAIL_SYNC}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
              <XAxis dataKey="t" type="number" domain={DETAIL_WINDOW} ticks={DETAIL_TICKS} {...AXIS} />
              <YAxis domain={[0, 14]} ticks={[0, 5, 10]} {...AXIS} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `${v} s`} formatter={(v) => [`${Number(v).toFixed(2)} mm`, "Wobble RMS"]} />
              <ReferenceLine x={0} stroke="var(--foreground)" strokeDasharray="4 3" />
              <Line type="monotone" dataKey="rms" stroke="var(--warning)" strokeWidth={1.8} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 text-3xs text-muted-foreground">Average sway of the aim point (RMS, mm) · the jump at 0 s is recoil.</p>
        <dl className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
          <Stat label="Last 1 s" value={`${shot.wobbleMm.toFixed(1)} mm`} bad={shot.wobbleMm > WOBBLE_LIMIT_MM} info={`Sway in the final second before the shot. Over ${WOBBLE_LIMIT_MM} mm means the rifle hadn't settled.`} />
          <Stat label="1 s after" value={`${shot.afterRmsMm.toFixed(1)} mm`} info="Sway in the second after the shot, recoil included." />
          <Stat label="Steadiness" value={`${shot.stability} / 5`} bad={shot.stability < 3} info="Overall steadiness score; 3 or more is acceptable." />
          <Stat label="Hold" value={`${shot.hold}/100`} bad={shot.hold < 80} info="Hold stability T−3 s to the shot; target 80." />
        </dl>
      </Panel>
    </div>
  );
}

function FlinchDetail({ shot }: { shot: Shot }) {
  const data = React.useMemo(() => {
    const series = SHOTS.filter((s) => s.flinchMm !== null).map((s) => ({ n: s.n, pts: flinchSeries(s) }));
    return series[0].pts.map((p, i) => ({ ms: p.ms, ...Object.fromEntries(series.map((s) => [`s${s.n}`, s.pts[i].dev])) }));
  }, []);
  const measured = SHOTS.filter((s) => s.flinchMm !== null);
  return (
    <div id="aar-flinch" className="scroll-mt-28">
      <Panel title="Flinch Indicator" meta={`Shot ${shot.n}: ${shot.flinchMm === null ? "not measured" : flinched(shot) ? `flinch, ${shot.flinchMm.toFixed(1)} mm` : `no flinch, ${shot.flinchMm.toFixed(1)} mm`}`}>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, left: -26, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
              <XAxis dataKey="ms" type="number" domain={[-500, 100]} ticks={[-400, -200, 0]} {...AXIS} />
              <YAxis domain={[-5, 12]} ticks={[-5, 0, 5, 10]} {...AXIS} />
              <ReferenceLine y={FLINCH_LIMIT_MM} stroke="var(--sev-critical)" strokeDasharray="4 3" />
              {measured.filter((s) => s.n !== shot.n).map((s) => (
                <Line key={s.n} type="monotone" dataKey={`s${s.n}`} stroke="var(--muted-foreground)" strokeOpacity={0.4} strokeWidth={1} dot={false} isAnimationActive={false} />
              ))}
              {shot.flinchMm !== null && <Line type="monotone" dataKey={`s${shot.n}`} stroke="var(--primary)" strokeWidth={2} dot={false} isAnimationActive={false} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 flex flex-wrap gap-x-3 text-3xs text-muted-foreground">
          <span><Swatch c="bg-primary" />Selected shot</span><span><Swatch c="bg-muted-foreground/40" />Other shots</span><span><Swatch c="bg-sev-critical" />Limit {FLINCH_LIMIT_MM} mm</span><span className="ml-auto">ms from the shot</span>
        </p>
        <dl className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
          <Stat label="Max deviation" value={shot.flinchMm === null ? "n/a" : `${shot.flinchMm.toFixed(1)} mm`} bad={flinched(shot)} />
          <Stat label="Flinches" value={`${SHOTS.filter(flinched).length} / ${measured.length}`} bad={SHOTS.some(flinched)} />
          <Stat label="Threshold" value={`${FLINCH_LIMIT_MM} mm`} />
        </dl>
      </Panel>
    </div>
  );
}

/* One shot as the report lays it out: the camera frame with the pose, the
   muzzle and breathing traces, the factors met, notes, and drills. */
function ShotCard({ shot, kind, onSelect }: { shot: Shot; kind: "best" | "weakest"; onSelect: (n: number) => void }) {
  const muzzle = React.useMemo(() => muzzleSeries(shot), [shot]);
  const breath = React.useMemo(() => breathingSeries(shot).filter((p) => p.t >= -3), [shot]);
  const checks = shotChecks(shot, Infinity);
  const best = kind === "best";
  return (
    <Panel
      title={`Shot ${shot.n} · ${isHit(shot) ? `${points(shot)} points` : "Miss"}, ${radius(shot).toFixed(1)} mm from aim`}
      meta={best ? "Best of session" : "Weakest of session"}
      action={
        <div className="flex items-center gap-2">
          <span className={cn("rounded px-1.5 py-0.5 text-3xs font-bold uppercase tracking-wider", best ? "bg-success/15 text-success" : "bg-sev-critical/15 text-sev-critical")}>{best ? "Good shot" : "Bad shot"}</span>
          <button type="button" onClick={() => onSelect(shot.n)} className="text-2xs font-semibold text-primary hover:underline">Review</button>
        </div>
      }
      bodyClassName="gap-3"
    >
      <div className="aspect-video overflow-hidden rounded-lg bg-camera-feed">
        <PostureFrame shot={shot} clock={fmtClip(shot.at)} />
      </div>
      <p className="-mt-2 text-3xs text-muted-foreground">Side camera, {SESSION.lane}. Aim at the break is estimated from muzzle direction and impact; the dashed ring shows the uncertainty.</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border bg-background px-2 pt-1.5">
          <p className="text-2xs font-semibold text-foreground">Muzzle movement</p>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={muzzle} margin={{ top: 4, right: 4, left: -30, bottom: -6 }}>
                <ReferenceArea x1={-3} x2={0} fill="var(--muted-foreground)" fillOpacity={0.06} strokeOpacity={0} />
                <ReferenceArea x1={0} x2={2} fill="var(--primary)" fillOpacity={0.07} strokeOpacity={0} />
                <ReferenceArea y1={-1.5} y2={1.5} fill="var(--success)" fillOpacity={0.1} strokeOpacity={0} />
                <XAxis dataKey="t" type="number" domain={WINDOW} ticks={TICKS} {...AXIS} />
                <YAxis domain={[-8, 8]} ticks={[-6, 0, 6]} {...AXIS} />
                <ReferenceLine x={0} stroke={flinched(shot) ? "var(--sev-critical)" : "var(--success)"} strokeWidth={2} />
                <Line type="monotone" dataKey="lr" stroke="var(--foreground)" strokeWidth={1.4} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="ud" stroke="var(--warning)" strokeWidth={1.4} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="pb-1 text-3xs text-muted-foreground"><Swatch c="bg-foreground" />L–R <Swatch c="bg-warning" />U–D · shaded: hold, then follow-through</p>
        </div>
        <div className="rounded-lg border border-border bg-background px-2 pt-1.5">
          <p className="text-2xs font-semibold text-foreground">Breathing · {firedInPause(shot) ? "fired in the pause" : `fired on ${BREATH_LABEL[shot.breath].toLowerCase()}`}</p>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={breath} margin={{ top: 4, right: 4, left: -30, bottom: -6 }}>
                {phaseBands(breath).map((b) => (
                  <ReferenceArea key={`${b.from}-${b.phase}`} x1={b.from} x2={b.to + 0.1} fill={PHASE_FILL[b.phase]} fillOpacity={0.14} strokeOpacity={0} />
                ))}
                <XAxis dataKey="t" type="number" domain={WINDOW} ticks={TICKS} {...AXIS} />
                <YAxis domain={[0, 1.4]} ticks={[0, 1]} {...AXIS} />
                <ReferenceLine x={0} stroke={firedInPause(shot) ? "var(--success)" : "var(--sev-critical)"} strokeWidth={2} />
                <Line type="monotone" dataKey="chest" stroke="var(--info)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="pb-1 text-3xs text-muted-foreground"><Swatch c="bg-success/50" />Pause <Swatch c="bg-info/50" />Inhale</p>
        </div>
      </div>
      <div>
        <p className="mb-1 text-3xs font-bold uppercase tracking-wider text-muted-foreground">{best ? "Factors met" : "Factors not met"}</p>
        <ul className="grid gap-1">
          {checks.map((c) => (
            <li key={c.label} className={cn("flex items-center gap-2 rounded-md px-2 py-1", c.ok === false ? "bg-sev-critical/[0.07]" : "bg-background")}>
              {c.ok === false ? <CircleX className="size-4 shrink-0 text-sev-critical" /> : <CircleCheck className="size-4 shrink-0 text-success" />}
              <span className="text-xs font-semibold text-foreground">{c.label}</span>
              <span className={cn("ml-auto text-right font-mono text-2xs", c.ok === false ? "text-sev-critical" : "text-muted-foreground")}>{c.note}</span>
            </li>
          ))}
        </ul>
      </div>
      <ShotNotes shot={shot} />
    </Panel>
  );
}

/* Score by factor, last session (grey) against this one, as the report draws it. */
function PreviousVsCurrent() {
  const factors = factorsFor(SHOTS);
  return (
    <Panel title="Previous vs current" meta={`${PREVIOUS.date} against 18 Oct, by factor`}>
      <div className="flex flex-col gap-3">
        {factors.map((f) => {
          const d = f.score - f.prev;
          return (
            <div key={f.key} className="grid grid-cols-[110px_minmax(0,1fr)_52px] items-center gap-3">
              <span className="text-xs font-semibold text-foreground">{f.label}</span>
              <div className="flex flex-col gap-1">
                <div className="h-2 rounded-sm bg-muted"><div className="h-full rounded-sm bg-muted-foreground/40" style={{ width: `${f.prev}%` }} /></div>
                <div className="h-3 rounded-sm bg-muted"><div className="h-full rounded-sm bg-foreground" style={{ width: `${f.score}%` }} /></div>
              </div>
              <span className={cn("text-right font-mono text-xs font-semibold", d >= 0 ? "text-success" : "text-sev-critical")}>{d >= 0 ? `▲ +${d}` : `▼ −${-d}`}</span>
            </div>
          );
        })}
        <p className="flex gap-4 text-3xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-muted-foreground/40" />{PREVIOUS.date}</span>
          <span className="flex items-center gap-1"><span className="h-2 w-3 rounded-sm bg-foreground" />18 Oct</span>
        </p>
      </div>
    </Panel>
  );
}

/* Overall score over the last five sessions, with the B line. */
function TrendCard() {
  return (
    <Panel title="Overall trend" meta={`Last ${TREND.length} sessions`}>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={TREND} margin={{ top: 16, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
            <XAxis dataKey="date" {...AXIS} fontSize={10} />
            <YAxis domain={[50, 100]} ticks={[50, 60, 70, 80, 90, 100]} {...AXIS} fontSize={10} />
            <ReferenceLine y={80} stroke="var(--success)" strokeDasharray="4 4" label={{ value: "GRADE B LINE", position: "insideBottomRight", fontSize: 9, fill: "var(--success)" }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [String(v), "Overall"]} />
            <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false}>
              <LabelList dataKey="score" position="top" offset={6} fontSize={10} fill="var(--foreground)" />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

/* How the session was captured and analysed. */
function SessionDetails({ className }: { className?: string }) {
  const rows: [string, string][] = [
    ["Clip", SESSION.clip], ["Clip length", fmtClip(SESSION.clipLength)], ["Analysis mode", SESSION.analysisMode],
    ["Sources", SESSION.sources], ["Tracking", `${SESSION.trackingFps} fps`], ["Lag", `${SESSION.lagSec} s`],
    ["Loop", String(SESSION.loop)], ["Running", SESSION.running], ["Background features", String(SESSION.backgroundFeatures)],
    ["Dropped frames", SESSION.droppedFrames.toLocaleString()],
  ];
  return (
    <Panel className={className} title="Session details" meta="How the session was captured and analysed">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        {rows.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-3xs font-semibold uppercase text-muted-foreground">{k}</dt>
            <dd className="break-words font-mono text-xs text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
      {SESSION.droppedFrames > 1000 && (
        <p className="mt-3 text-xs text-warning">{SESSION.droppedFrames.toLocaleString()} frames were dropped, so fast movement can fall between frames. Read the flinch and recoil numbers with care.</p>
      )}
      <p className="mt-3 text-2xs leading-relaxed text-muted-foreground">{METHOD_NOTE}</p>
    </Panel>
  );
}
