import * as React from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Check, ChevronLeft, ChevronRight, CircleCheck, CircleX, Eraser, FileDown, Info, PenLine, Play, Pause, Share2, Target, TrendingDown, TrendingUp, TriangleRight, X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  BEST_SWING, FAULTS, GOAL_SCORE, GOLFER, GRADE_BANDS, LESSONS, METHOD_NOTE, PHASES, PREVIOUS, SESSION, STATS, SWINGS, TARGET, WEAKEST_SWING, WINDOW,
  findingsFor, fmtClock, fundamentalsFor, gradeOf, inRange, inSequence, phaseTime, rankedFaults, sequenceSeries, shapeOf, smash, spineLost,
  swingByN, swingScore, swingSeries, tempo, xFactor, type FaultKey, type Finding, type Phase, type Swing,
} from "./golfSession";
import { Dispersion, DrawLayer, SwingFrame, type Mark, type Tool, type View } from "./golfParts";

/* Swing Analysis — one golfer's lesson at an indoor bay, laid out like the
   range AAR: the overview fits a laptop screen (summary, swing video with the
   pose read off it, the picked swing's review, ball data, signals,
   fundamentals and coaching), and the full report follows below it (compare
   two swings, every swing in a table, progress across lessons, coach notes).

   One swing is "picked" at a time and every panel follows it. */

const TOOLTIP_STYLE = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 };
const AXIS = { stroke: "var(--muted-foreground)", fontSize: 9, tickLine: false, axisLine: false } as const;
const gradeTone = (g: string) => (g === "A" || g === "B" ? "success" : g === "C" ? "warning" : "sev-critical");
const TONE_TEXT = { success: "text-success", warning: "text-warning", "sev-critical": "text-sev-critical" } as const;
const TONE_FILL = { success: "bg-success/15", warning: "bg-warning/15", "sev-critical": "bg-sev-critical/15" } as const;
const TONE_DOT = { success: "bg-success", warning: "bg-warning", "sev-critical": "bg-sev-critical" } as const;

type Review = "confirmed" | "dismissed";
type Reviews = Record<string, Review>;
const reviewKey = (n: number, k: FaultKey) => `${n}:${k}`;

/* ── Page ────────────────────────────────────────────────────────────── */

export function GolfDashboard() {
  // Opened from Results with the golfer's name; the sample golfer otherwise.
  const golfer = useGolfer();
  const [selected, setSelected] = React.useState(BEST_SWING);
  const [phase, setPhase] = React.useState<Phase>("impact");
  const [view, setView] = React.useState<View>("dtl");
  const [reviews, setReviews] = React.useState<Reviews>({});
  const swing = swingByN(selected);

  /* A coaching "See swing" link picks the swing and the view and moment that show the fault. */
  function showFault(n: number, key: FaultKey) {
    setSelected(n);
    setView(key === "sway" || key === "reversePivot" ? "face" : "dtl");
    setPhase(key === "sway" ? "top" : "impact");
    window.requestAnimationFrame(() => document.getElementById("golf-video")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:h-[calc(100svh-6rem)] lg:min-h-[720px]">
        <PageHeader>
          <PageHeader.Content className="flex-row items-center gap-3">
            <PageHeader.Title>Swing Analysis</PageHeader.Title>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5 text-2xs font-semibold text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success" />
              Lesson complete
            </span>
          </PageHeader.Content>
          <PageHeader.Actions>
            <Button variant="outline" size="sm" onClick={() => toast.success(`Shared with ${golfer.name}`, { description: `${SESSION.club} lesson · ${SESSION.date}` })}>
              <Share2 className="size-4" />
              Share with golfer
            </Button>
            <Button size="sm" onClick={() => toast.success("Report exported", { description: `Swing_${GOLFER.id}_${SESSION.bay.replace(" ", "")}.pdf` })}>
              <FileDown className="size-4" />
              Export PDF
            </Button>
          </PageHeader.Actions>
        </PageHeader>

        <dl className="-mt-1 flex shrink-0 flex-wrap items-baseline gap-x-5 gap-y-0.5">
          {([["Academy / bay", `${GOLFER.academy} · ${SESSION.bay}`], ["Club", SESSION.club], ["Coach", SESSION.coach], ["Date", SESSION.date], ["Cameras", SESSION.cameras], ["Launch monitor", SESSION.launchMonitor]] as const).map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-1.5">
              <dt className="text-3xs font-semibold uppercase text-muted-foreground">{k}</dt>
              <dd className="text-2xs font-semibold text-foreground">{v}</dd>
            </div>
          ))}
        </dl>

        <SummaryStrip reviews={reviews} golfer={golfer} />

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-12 lg:grid-rows-[minmax(300px,1.15fr)_minmax(260px,1fr)]">
          <VideoPanel className="lg:col-span-5" swing={swing} view={view} phase={phase} onView={setView} onPhase={setPhase} onSelect={setSelected} />
          <ReviewPanel className="lg:col-span-4" swing={swing} reviews={reviews} onReview={(k, r) => setReviews((m) => ({ ...m, [k]: r }))} onSelect={setSelected} />
          <BallPanel className="lg:col-span-3" swing={swing} onSelect={setSelected} />
          <SignalsPanel className="lg:col-span-5" swing={swing} phase={phase} />
          <FundamentalsPanel className="lg:col-span-3" />
          <CoachingPanel className="lg:col-span-4" onSee={showFault} />
        </div>
      </div>

      <FullReport selected={selected} onSelect={setSelected} />
    </div>
  );
}

/* ── Building blocks ─────────────────────────────────────────────────── */

function Panel({ id, title, meta, action, className, bodyClassName, children }: {
  id?: string; title: string; meta?: React.ReactNode; action?: React.ReactNode; className?: string; bodyClassName?: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card", className)}>
      <header className="flex h-9 shrink-0 items-center gap-2 border-b border-border px-3">
        <h2 className="shrink-0 text-sm font-bold text-foreground">{title}</h2>
        {meta && <span className="min-w-0 truncate text-2xs text-muted-foreground">{meta}</span>}
        {action && <div className="ml-auto shrink-0">{action}</div>}
      </header>
      <div className={cn("flex min-h-0 flex-1 flex-col p-3", bodyClassName)}>{children}</div>
    </section>
  );
}

function PanelTabs<T extends string>({ value, onChange, tabs, className }: { value: T; onChange: (v: T) => void; tabs: [T, string][]; className?: string }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as T)}>
      {/* The shared TabsList sets h-9 through a group-data variant, so match it to shrink. */}
      <TabsList className={cn("group-data-[orientation=horizontal]/tabs:h-7", className)}>
        {tabs.map(([v, label]) => (
          <TabsTrigger key={v} value={v} className="px-2 text-2xs">{label}</TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

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
    <span className={cn("grid shrink-0 place-items-center rounded-md font-bold", TONE_FILL[tone], TONE_TEXT[tone], size === "lg" ? "size-9 text-xl" : size === "md" ? "size-7 text-md" : "size-5 text-xs")}>
      {g}
    </span>
  );
}

function Delta({ now, before, lowerIsBetter = false, unit = "", digits = 1 }: { now: number; before: number; lowerIsBetter?: boolean; unit?: string; digits?: number }) {
  const d = now - before;
  if (Math.abs(d) < 0.05) return <span className="text-muted-foreground">Same as {PREVIOUS.date}</span>;
  const better = lowerIsBetter ? d < 0 : d > 0;
  const Arrow = d > 0 ? TrendingUp : TrendingDown;
  const abs = Math.abs(d) % 1 ? Math.abs(d).toFixed(digits) : String(Math.abs(d));
  return (
    <span className={cn("inline-flex items-center gap-1", better ? "text-success" : "text-sev-critical")}>
      <Arrow className="size-3" />
      {d > 0 ? "+" : "−"}{abs}{unit} vs {PREVIOUS.date}
    </span>
  );
}

const signed = (v: number, digits = 1) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(digits)}`;

/* ── Summary strip ───────────────────────────────────────────────────── */

/** The golfer named in the URL (?person=), or the sample golfer. */
function useGolfer() {
  const name = new URLSearchParams(useLocation().search).get("person");
  if (!name) return GOLFER;
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return { ...GOLFER, name, initials };
}

function SummaryStrip({ reviews, golfer }: { reviews: Reviews; golfer: typeof GOLFER }) {
  const s = STATS;
  const open = SWINGS.flatMap((w) => findingsFor(w).map((f) => reviewKey(w.n, f.key))).filter((k) => !reviews[k]).length;
  const kpis: { label: string; value: string; tone?: string; info: string; delta: React.ReactNode }[] = [
    { label: "Swings", value: String(s.swings), info: "Swings the cameras picked up and analysed in this lesson.", delta: <span className="text-muted-foreground">{fmtClock(SESSION.lengthSec)} recorded</span> },
    { label: "Consistency", value: `${s.consistency}/100`, tone: "text-info", info: "How alike the swings were: the spread of turn, posture, path and tempo against each target's range. 100 = every swing the same.", delta: <Delta now={s.consistency} before={PREVIOUS.consistency} /> },
    { label: "Tempo", value: `${s.tempo.toFixed(1)} : 1`, tone: inRange(s.tempo, TARGET.tempo) ? "text-success" : "text-warning", info: "Backswing time divided by downswing time, averaged. Around 3 : 1 is typical.", delta: <Delta now={+s.tempo.toFixed(1)} before={PREVIOUS.tempo} lowerIsBetter /> },
    { label: "Club speed", value: `${s.clubSpeed.toFixed(1)} mph`, tone: "text-purple", info: "Average club head speed at impact, from the launch monitor.", delta: <Delta now={+s.clubSpeed.toFixed(1)} before={PREVIOUS.clubSpeed} unit=" mph" /> },
    { label: "Carry", value: `${Math.round(s.carry)} yd`, tone: "text-foreground", info: "Average carry distance, from the launch monitor.", delta: <Delta now={Math.round(s.carry)} before={PREVIOUS.carry} unit=" yd" /> },
    { label: "To review", value: String(open), tone: open ? "text-warning" : "text-success", info: "AI findings the coach hasn't confirmed or dismissed yet.", delta: <span className="text-muted-foreground">{open ? "Confirm or dismiss" : "All reviewed"}</span> },
  ];
  return (
    <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.3fr)_repeat(6,minmax(0,1fr))]">
      <div className="col-span-2 flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2 lg:col-span-1">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-2xs font-bold text-primary">{golfer.initials}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-foreground">{golfer.name}</p>
          <p className="truncate font-mono text-2xs text-muted-foreground">{GOLFER.id} · HCP {GOLFER.handicap}</p>
        </div>
      </div>
      <div className="col-span-2 flex items-center rounded-xl border border-border bg-card px-2.5 py-2 lg:col-span-1">
        <div className="flex min-w-0 items-center gap-2">
          <GradeBadge score={s.score} size="lg" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-3xs font-semibold uppercase text-muted-foreground">Swing score</p>
            <p className="font-mono text-sm font-bold text-foreground">{s.score}<span className="text-muted-foreground">/100</span></p>
            <p className="truncate text-3xs"><Delta now={s.score} before={PREVIOUS.score} /></p>
          </div>
        </div>
      </div>
      {kpis.map((k) => (
        <div key={k.label} title={k.info} className="min-w-0 cursor-help rounded-xl border border-border bg-card px-2.5 py-2">
          <p className="truncate text-3xs font-semibold uppercase text-muted-foreground">{k.label}</p>
          <p className={cn("mt-0.5 truncate text-lg font-bold leading-tight", k.tone ?? "text-foreground")}>{k.value}</p>
          <p className="truncate text-3xs">{k.delta}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Swing video ─────────────────────────────────────────────────────── */

const PHASE_ORDER = PHASES.map((p) => p.key);

function VideoPanel({ className, swing, view, phase, onView, onPhase, onSelect }: {
  className?: string; swing: Swing; view: View; phase: Phase; onView: (v: View) => void; onPhase: (p: Phase) => void; onSelect: (n: number) => void;
}) {
  const [showPose, setShowPose] = React.useState(true);
  const [tool, setTool] = React.useState<Tool>("none");
  const [marks, setMarks] = React.useState<Mark[]>([]);
  const [playing, setPlaying] = React.useState(false);
  /* Drawings belong to one frame: a new swing, view or moment starts clean. */
  const frame = `${swing.n}-${view}-${phase}`;
  const [markedFrame, setMarkedFrame] = React.useState(frame);
  if (markedFrame !== frame) {
    setMarkedFrame(frame);
    setMarks([]);
  }

  /* Play steps through the five moments of the swing, then stops at the finish. */
  const running = playing && phase !== "finish";
  React.useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => onPhase(PHASE_ORDER[PHASE_ORDER.indexOf(phase) + 1]), 650);
    return () => window.clearTimeout(id);
  }, [running, phase, onPhase]);

  const step = (d: number) => onPhase(PHASE_ORDER[Math.max(0, Math.min(PHASE_ORDER.length - 1, PHASE_ORDER.indexOf(phase) + d))]);
  const pct = (sec: number) => `${(sec / SESSION.lengthSec) * 100}%`;
  const toolBtn = (t: Exclude<Tool, "none">, Icon: typeof PenLine, label: string) => (
    <button type="button" aria-label={label} title={label} aria-pressed={tool === t} onClick={() => setTool(tool === t ? "none" : t)}
      className={cn("grid size-6 place-items-center rounded transition-colors", tool === t ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
      <Icon className="size-3.5" />
    </button>
  );

  return (
    <Panel
      id="golf-video"
      className={className}
      title="Swing Video"
      meta={`Swing ${swing.n} · ${PHASES.find((p) => p.key === phase)!.label}`}
      bodyClassName="p-0"
      action={
        <div className="flex items-center gap-1">
          {toolBtn("line", PenLine, "Draw a line")}
          {toolBtn("angle", TriangleRight, "Measure an angle (3 clicks)")}
          <button type="button" aria-label="Clear drawings" title="Clear drawings" disabled={!marks.length} onClick={() => setMarks([])}
            className="grid size-6 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40">
            <Eraser className="size-3.5" />
          </button>
          <label className="ml-1 mr-1 flex items-center gap-1 text-2xs text-muted-foreground">
            <Switch checked={showPose} onCheckedChange={setShowPose} className="scale-75" aria-label="Show pose" />
            Pose
          </label>
          <PanelTabs value={view} onChange={onView} tabs={[["face", "Face-on"], ["dtl", "Down-the-line"]]} />
        </div>
      }
    >
      <div className="relative min-h-0 flex-1 overflow-hidden bg-camera-feed max-lg:aspect-video">
        <SwingFrame swing={swing} view={view} phase={phase} showPose={showPose} className="absolute inset-0">
          <DrawLayer tool={tool} marks={marks} onAdd={(m) => setMarks((ms) => [...ms, m])} />
        </SwingFrame>
        {tool !== "none" && (
          <p className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-3xs text-white">
            {tool === "line" ? "Click two points to draw a line" : "Click three points · the middle one is the corner"}
          </p>
        )}
      </div>
      {/* Key moments of the picked swing */}
      <div className="flex h-8 shrink-0 items-center gap-1 border-t border-border px-2">
        <button type="button" aria-label={running ? "Pause" : "Play through the swing"}
          onClick={() => {
            if (running) return setPlaying(false);
            if (phase === "finish") onPhase("address");
            setPlaying(true);
          }}
          className="grid size-6 shrink-0 place-items-center rounded text-foreground hover:bg-muted">
          {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </button>
        <button type="button" aria-label="Previous moment" onClick={() => step(-1)} className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronLeft className="size-3.5" /></button>
        <div role="tablist" aria-label="Key moments" className="flex min-w-0 flex-1 gap-1">
          {PHASES.map((p) => (
            <button key={p.key} type="button" role="tab" aria-selected={p.key === phase} onClick={() => { setPlaying(false); onPhase(p.key); }}
              className={cn("min-w-0 flex-1 truncate rounded px-1 py-0.5 text-2xs font-semibold transition-colors duration-[var(--duration-fast)]",
                p.key === phase ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              {p.label}
            </button>
          ))}
        </div>
        <button type="button" aria-label="Next moment" onClick={() => step(1)} className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronRight className="size-3.5" /></button>
      </div>
      {/* Lesson timeline: every swing, coloured by its grade */}
      <div className="flex h-8 shrink-0 items-center gap-2 border-t border-border px-2">
        <span className="font-mono text-2xs text-muted-foreground">{fmtClock(swing.at)}</span>
        <div className="relative h-4 flex-1">
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-muted" />
          <div className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary/60" style={{ width: pct(swing.at) }} />
          {SWINGS.map((s) => {
            const tone = gradeTone(gradeOf(swingScore(s)));
            return (
              <button key={s.n} type="button" onClick={() => onSelect(s.n)} aria-label={`Swing ${s.n} at ${fmtClock(s.at)}`} title={`Swing ${s.n} · ${fmtClock(s.at)} · ${swingScore(s)}/100`}
                className={cn("absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-card transition-transform hover:scale-150", s.n === swing.n ? "bg-foreground" : TONE_DOT[tone])}
                style={{ left: pct(s.at) }} />
            );
          })}
        </div>
        <span className="font-mono text-2xs text-muted-foreground">{fmtClock(SESSION.lengthSec)}</span>
      </div>
    </Panel>
  );
}

/* ── Swing review ────────────────────────────────────────────────────── */

type CheckRow = { label: string; ok: boolean; note: string };

function checksFor(s: Swing): CheckRow[] {
  return [
    { label: "Setup", ok: inRange(s.spineAddr, TARGET.spineAddr), note: `Spine ${s.spineAddr}° · aim ${TARGET.spineAddr.join("–")}°` },
    { label: "Turn", ok: inRange(s.chestTurn, TARGET.chestTurn) && inRange(s.pelvisTurn, TARGET.pelvisTurn) && inRange(xFactor(s), TARGET.xFactor), note: `Chest ${s.chestTurn}° · pelvis ${s.pelvisTurn}° · X ${xFactor(s)}°` },
    { label: "Sway", ok: s.pelvisSway <= TARGET.pelvisSway[1] && s.headMove <= TARGET.headMove[1], note: `Pelvis ${s.pelvisSway.toFixed(1)} cm · head ${s.headMove.toFixed(1)} cm` },
    { label: "Posture hold", ok: spineLost(s) <= TARGET.spineLost[1] && s.pelvisThrust <= TARGET.pelvisThrust[1], note: `Lost ${spineLost(s)}° · hips ${s.pelvisThrust.toFixed(1)} cm to ball` },
    { label: "Sequence", ok: inSequence(s), note: inSequence(s) ? "Pelvis → chest → arms → club" : "Chest before pelvis" },
    { label: "Tempo", ok: inRange(tempo(s), TARGET.tempo), note: `${tempo(s).toFixed(1)} : 1 · ${s.backswing.toFixed(2)} s / ${s.downswing.toFixed(2)} s` },
    { label: "Club path", ok: inRange(s.clubPath, TARGET.clubPath), note: `${signed(s.clubPath)}° ${s.clubPath < 0 ? "out-to-in" : "in-to-out"}` },
  ];
}

const CONF_TONE = { High: "text-foreground", Medium: "text-warning", Low: "text-sev-critical" } as const;

function ReviewPanel({ className, swing, reviews, onReview, onSelect }: {
  className?: string; swing: Swing; reviews: Reviews; onReview: (k: string, r: Review) => void; onSelect: (n: number) => void;
}) {
  const checks = checksFor(swing);
  const met = checks.filter((c) => c.ok).length;
  const findings = findingsFor(swing);
  // Keep the picked swing in view in the sideways-scrolling row, wherever it was picked from.
  const strip = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    strip.current?.querySelector<HTMLElement>("[data-active]")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [swing.n]);
  const score = swingScore(swing);
  const tag = swing.n === BEST_SWING ? "Best swing" : swing.n === WEAKEST_SWING ? "Weakest swing" : null;
  return (
    <Panel className={className} title="Swing Review" meta="Pick a swing">
      {/* One row that scrolls sideways, however many swings the lesson had. */}
      <div ref={strip} role="tablist" aria-label="Swings" className="mb-2 flex shrink-0 gap-1 overflow-x-auto pb-1">
        {SWINGS.map((s) => {
          const active = s.n === swing.n;
          const sc = swingScore(s);
          return (
            <button key={s.n} type="button" role="tab" aria-selected={active} data-active={active || undefined} onClick={() => onSelect(s.n)}
              className={cn("flex w-12 shrink-0 flex-col items-center rounded-md border py-0.5 transition-colors duration-[var(--duration-fast)]",
                active ? "border-primary bg-primary/10 shadow-[inset_0_0_0_1px_var(--primary)]" : "border-border bg-background hover:border-primary/40")}>
              <span className="flex items-center gap-0.5 text-2xs font-bold text-foreground">
                #{s.n}
                {s.n === BEST_SWING && <span title="Best swing" className="size-1.5 rounded-full bg-success" />}
                {s.n === WEAKEST_SWING && <span title="Weakest swing" className="size-1.5 rounded-full bg-sev-critical" />}
              </span>
              <span className={cn("font-mono text-3xs font-semibold", TONE_TEXT[gradeTone(gradeOf(sc))])}>{sc}</span>
            </button>
          );
        })}
      </div>
      <p className="mb-1 flex shrink-0 items-center gap-2 font-mono text-2xs text-muted-foreground">
        <span>Swing {swing.n}: <span className="font-semibold text-foreground">{score}/100 · {swing.carry} yd · {shapeOf(swing)}</span> · {met}/{checks.length} met</span>
        {tag && <span className={cn("ml-auto rounded px-1.5 py-px font-sans text-3xs font-bold uppercase tracking-wider", swing.n === BEST_SWING ? "bg-success/15 text-success" : "bg-sev-critical/15 text-sev-critical")}>{tag}</span>}
      </p>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        <ul className="flex flex-col gap-0.5">
          {checks.map((c) => (
            <li key={c.label} className={cn("flex items-center gap-2 rounded-md px-2 py-1", c.ok ? "bg-background" : "bg-sev-critical/[0.07]")}>
              {c.ok ? <CircleCheck className="size-4 shrink-0 text-success" aria-label="Met" /> : <CircleX className="size-4 shrink-0 text-sev-critical" aria-label="Not met" />}
              <span className="shrink-0 text-xs font-semibold text-foreground">{c.label}</span>
              <span className={cn("ml-auto truncate text-right font-mono text-2xs", c.ok ? "text-muted-foreground" : "text-sev-critical")}>{c.note}</span>
            </li>
          ))}
        </ul>
        <div>
          <p className="mb-1 flex items-center gap-1 text-3xs font-bold uppercase tracking-wider text-muted-foreground">
            AI findings · coach review
            <InfoTip text="Confirm a finding to keep it in the golfer's report, or dismiss it if the AI got it wrong. Confidence is how sure the model is." />
          </p>
          {findings.length === 0 ? (
            <p className="rounded-md bg-background px-2 py-1.5 text-2xs text-muted-foreground">No faults found on this swing.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {findings.map((f) => <FindingRow key={f.key} n={swing.n} f={f} status={reviews[reviewKey(swing.n, f.key)]} onReview={onReview} />)}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}

function FindingRow({ n, f, status, onReview }: { n: number; f: Finding; status?: Review; onReview: (k: string, r: Review) => void }) {
  const k = reviewKey(n, f.key);
  return (
    <li className={cn("flex items-center gap-2 rounded-md border px-2 py-1", status === "dismissed" ? "border-border bg-background opacity-60" : status === "confirmed" ? "border-success/30 bg-success/[0.06]" : "border-warning/30 bg-warning/[0.06]")}>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-xs font-semibold text-foreground", status === "dismissed" && "line-through")}>{FAULTS[f.key].label}</p>
        <p className="truncate font-mono text-3xs text-muted-foreground">{f.detail} · <span className={CONF_TONE[f.confidence]}>{f.confidence} confidence</span></p>
      </div>
      {status ? (
        <button type="button" onClick={() => onReview(k, status === "confirmed" ? "dismissed" : "confirmed")} className="shrink-0 text-3xs font-semibold text-muted-foreground hover:text-foreground"
          title="Change review">
          {status === "confirmed" ? "Confirmed" : "Dismissed"} · undo
        </button>
      ) : (
        <div className="flex shrink-0 gap-1">
          <button type="button" aria-label={`Confirm ${FAULTS[f.key].label}`} title="Confirm" onClick={() => onReview(k, "confirmed")}
            className="grid size-6 place-items-center rounded border border-border bg-card text-success hover:bg-success/10"><Check className="size-3.5" /></button>
          <button type="button" aria-label={`Dismiss ${FAULTS[f.key].label}`} title="Dismiss" onClick={() => onReview(k, "dismissed")}
            className="grid size-6 place-items-center rounded border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-3.5" /></button>
        </div>
      )}
    </li>
  );
}

/* ── Ball & club ─────────────────────────────────────────────────────── */

function BallPanel({ className, swing, onSelect }: { className?: string; swing: Swing; onSelect: (n: number) => void }) {
  const shape = shapeOf(swing);
  const cells: [string, string, boolean?][] = [
    ["Club speed", `${swing.clubSpeed} mph`],
    ["Ball speed", `${swing.ballSpeed} mph`],
    ["Smash", smash(swing).toFixed(2)],
    ["Launch", `${swing.launch.toFixed(1)}°`],
    ["Spin", `${swing.spin.toLocaleString()} rpm`],
    ["Carry", `${swing.carry} yd`],
    ["Club path", `${signed(swing.clubPath)}°`, !inRange(swing.clubPath, TARGET.clubPath)],
    ["Face", `${signed(swing.faceAngle)}° ${swing.faceAngle > 0 ? "open" : swing.faceAngle < 0 ? "closed" : ""}`],
    ["Shape", shape, shape === "Slice" || shape === "Hook"],
  ];
  return (
    <Panel className={className} title="Ball & Club" meta={`Swing ${swing.n} · launch monitor`}>
      <div className="grid min-h-0 flex-1 place-items-center max-lg:aspect-square">
        <Dispersion swings={SWINGS} focus={swing.n} onSelect={onSelect} className="max-h-full" />
      </div>
      <dl className="mt-2 grid shrink-0 grid-cols-3 gap-x-2 gap-y-1">
        {cells.map(([k, v, bad]) => (
          <div key={k} className="min-w-0">
            <dt className="truncate text-3xs font-semibold uppercase text-muted-foreground">{k}</dt>
            <dd className={cn("truncate font-mono text-xs font-semibold", bad ? "text-sev-critical" : "text-foreground")}>{v}</dd>
          </div>
        ))}
      </dl>
      <ul className="mt-1.5 flex shrink-0 flex-wrap gap-x-3 gap-y-0.5 text-3xs text-muted-foreground">
        <li className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-success" />Straight</li>
        <li className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-info" />Draw / fade</li>
        <li className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-sev-critical" />Slice / hook</li>
      </ul>
    </Panel>
  );
}

/* ── Signals ─────────────────────────────────────────────────────────── */

const SYNC = { syncId: "golf-signals", syncMethod: "value" } as const;
const T_TICKS = [-1.5, -1, -0.5, 0];
const SEQ_TONE = { pelvis: "var(--info)", chest: "var(--warning)", arms: "var(--purple)", club: "var(--foreground)" } as const;

function SignalsPanel({ className, swing, phase }: { className?: string; swing: Swing; phase: Phase }) {
  const series = React.useMemo(() => swingSeries(swing), [swing]);
  const seq = React.useMemo(() => sequenceSeries(swing), [swing]);
  const now = phaseTime(swing, phase);
  const top = -swing.downswing;
  const lost = spineLost(swing);
  const lostBad = lost > TARGET.spineLost[1];
  const thrustBad = swing.pelvisThrust > TARGET.pelvisThrust[1];
  const marks = (
    <>
      <ReferenceLine x={top} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
      <ReferenceLine x={0} stroke="var(--foreground)" strokeDasharray="3 3" />
      {now >= WINDOW[0] && now <= WINDOW[1] && <ReferenceLine x={+now.toFixed(2)} stroke="var(--primary)" strokeWidth={2} />}
    </>
  );
  const xAxis = <XAxis dataKey="t" type="number" domain={WINDOW} ticks={T_TICKS} {...AXIS} />;
  return (
    <Panel className={className} title="Swing Signals" meta={`Swing ${swing.n} · dashed: top, impact`} action={<InfoTip text={METHOD_NOTE} />}
      bodyClassName="grid grid-cols-2 grid-rows-2 gap-2 max-lg:auto-rows-[120px]">
      <MiniChart title="Rotation" value={`Chest ${swing.chestTurn}° · pelvis ${swing.pelvisTurn}°`} legend={<><Swatch c="bg-warning" />Chest <Swatch c="bg-info" />Pelvis · ° from address</>}>
        <LineChart data={series} margin={{ top: 4, right: 4, left: -28, bottom: -6 }} {...SYNC}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
          {xAxis}
          <YAxis domain={[-100, 100]} ticks={[-90, 0, 90]} {...AXIS} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `${v} s`} formatter={(v, n) => [`${v}°`, n === "chest" ? "Chest" : "Pelvis"]} />
          {marks}
          <Line type="monotone" dataKey="chest" stroke="var(--warning)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="pelvis" stroke="var(--info)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </MiniChart>
      <MiniChart title="Sequence" value={inSequence(swing) ? "In order" : "Out of order"} bad={!inSequence(swing)}
        legend={<><Swatch c="bg-info" />Pelvis <Swatch c="bg-warning" />Chest <Swatch c="bg-purple" />Arms <Swatch c="bg-foreground" />Club ÷2</>}>
        <LineChart data={seq} margin={{ top: 4, right: 4, left: -24, bottom: -6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
          <XAxis dataKey="ms" type="number" domain={[-320, 80]} ticks={[-300, -200, -100, 0]} {...AXIS} />
          <YAxis domain={[0, 1100]} ticks={[0, 500, 1000]} {...AXIS} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `${v} ms to impact`} formatter={(v, n) => [`${n === "club" ? Number(v) * 2 : v}°/s`, String(n)[0].toUpperCase() + String(n).slice(1)]} />
          <ReferenceLine x={0} stroke="var(--foreground)" strokeDasharray="3 3" />
          {(["pelvis", "chest", "arms"] as const).map((k) => (
            <Line key={k} type="monotone" dataKey={k} stroke={SEQ_TONE[k]} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          ))}
          <Line type="monotone" dataKey={(d: { club: number }) => d.club / 2} name="club" stroke={SEQ_TONE.club} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </MiniChart>
      <MiniChart title="Spine angle" value={`${swing.spineAddr}° → ${swing.spineImpact}° · lost ${lost}°`} bad={lostBad}
        legend={<><Swatch c="bg-success/40" />Hold band · keep within {TARGET.spineLost[1]}° of address</>}>
        <LineChart data={series} margin={{ top: 4, right: 4, left: -28, bottom: -6 }} {...SYNC}>
          <ReferenceArea y1={swing.spineAddr - TARGET.spineLost[1]} y2={swing.spineAddr + 2} fill="var(--success)" fillOpacity={0.1} strokeOpacity={0} />
          {xAxis}
          <YAxis domain={[20, 42]} ticks={[25, 30, 35, 40]} {...AXIS} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `${v} s`} formatter={(v) => [`${v}°`, "Forward bend"]} />
          {marks}
          <Line type="monotone" dataKey="spine" stroke={lostBad ? "var(--sev-critical)" : "var(--success)"} strokeWidth={1.6} dot={false} isAnimationActive={false} />
        </LineChart>
      </MiniChart>
      <MiniChart title="Sway & hips" value={`Sway ${swing.pelvisSway.toFixed(1)} · hips ${swing.pelvisThrust.toFixed(1)} cm`} bad={thrustBad || swing.pelvisSway > TARGET.pelvisSway[1]}
        legend={<><Swatch c="bg-chart-2" />Side to side <Swatch c="bg-sev-high" />Toward ball · cm</>}>
        <LineChart data={series} margin={{ top: 4, right: 4, left: -28, bottom: -6 }} {...SYNC}>
          <ReferenceArea y1={0} y2={TARGET.pelvisThrust[1]} fill="var(--success)" fillOpacity={0.08} strokeOpacity={0} />
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
          {xAxis}
          <YAxis domain={[-12, 12]} ticks={[-8, 0, 8]} {...AXIS} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `${v} s`} formatter={(v, n) => [`${v} cm`, n === "sway" ? "Side to side" : "Toward ball"]} />
          {marks}
          <Line type="monotone" dataKey="sway" stroke="var(--chart-2)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="thrust" stroke="var(--sev-high)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </MiniChart>
    </Panel>
  );
}

function Swatch({ c }: { c: string }) {
  return <span className={cn("mr-1 ml-2.5 inline-block h-1.5 w-2.5 rounded-sm align-middle first:ml-0", c)} />;
}

function MiniChart({ title, value, bad, legend, children }: { title: string; value: string; bad?: boolean; legend: React.ReactNode; children: React.ReactElement }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-col rounded-lg border border-border bg-background px-2 pt-1.5">
      <div className="flex items-baseline gap-2">
        <span className="shrink-0 text-2xs font-semibold text-foreground">{title}</span>
        <span className={cn("ml-auto truncate font-mono text-3xs font-semibold", bad ? "text-sev-critical" : "text-muted-foreground")}>{value}</span>
      </div>
      <div className="relative min-h-16 flex-1">
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
      <p className="truncate pb-1 text-3xs text-muted-foreground">{legend}</p>
    </div>
  );
}

/* ── Fundamentals ────────────────────────────────────────────────────── */

function FundamentalsPanel({ className }: { className?: string }) {
  const rows = fundamentalsFor(SWINGS);
  return (
    <Panel className={className} title="Fundamentals" meta={`vs ${PREVIOUS.date}`}
      action={<InfoTip text={`Each fundamental is scored 0–100 on every swing and graded on the average: ${GRADE_BANDS.map(([g, m]) => `${g} ${m}+`).join(" · ")}. A swing meets it at 75+.`} />}>
      <ul className="flex min-h-0 flex-1 flex-col justify-between gap-1">
        {rows.map((f) => (
          <li key={f.key} className="flex items-center gap-2" title={f.measures}>
            <GradeBadge score={f.score} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="truncate text-xs font-semibold text-foreground">{f.label}</span>
                <span className="ml-auto shrink-0 font-mono text-3xs text-muted-foreground">{f.met}/{SWINGS.length} swings</span>
              </div>
              <div className="relative mt-0.5 h-1.5 rounded-full bg-muted">
                <div className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/35" style={{ width: `${f.previous}%` }} />
                <div className={cn("absolute inset-y-0 left-0 rounded-full", TONE_DOT[gradeTone(gradeOf(f.score))])} style={{ width: `${f.score}%`, opacity: 0.85 }} />
              </div>
            </div>
            <span className="w-14 shrink-0 text-right font-mono text-3xs">
              <span className="font-semibold text-foreground">{f.score}</span>{" "}
              <span className={f.score >= f.previous ? "text-success" : "text-sev-critical"}>{f.score >= f.previous ? "+" : "−"}{Math.abs(f.score - f.previous)}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 shrink-0 text-3xs text-muted-foreground"><span className="mr-1 inline-block h-1.5 w-2.5 rounded-sm bg-muted-foreground/35 align-middle" />{PREVIOUS.date} · solid bar this lesson</p>
    </Panel>
  );
}

/* ── Coaching ────────────────────────────────────────────────────────── */

function CoachingPanel({ className, onSee }: { className?: string; onSee: (n: number, k: FaultKey) => void }) {
  const faults = rankedFaults(SWINGS).slice(0, 2);
  const strongest = [...fundamentalsFor(SWINGS)].sort((a, b) => b.score - a.score).slice(0, 2);
  return (
    <Panel className={className} title="Coaching" meta="What to work on next">
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {faults.map((f, i) => (
          <div key={f.key} className="rounded-lg border border-border bg-background p-2">
            <div className="flex items-baseline gap-2">
              <span className="grid size-4 shrink-0 place-items-center rounded bg-sev-critical/15 font-mono text-3xs font-bold text-sev-critical">{i + 1}</span>
              <span className="text-xs font-bold text-foreground">{f.label}</span>
              <span className="ml-auto shrink-0 font-mono text-3xs text-muted-foreground">
                {f.count}/{SWINGS.length} swings{f.costYd > 0 && <> · <span className="text-sev-critical">−{f.costYd} yd</span></>}
              </span>
            </div>
            <p className="mt-0.5 text-2xs leading-snug text-muted-foreground">{f.what}</p>
            <div className="mt-1.5 rounded-md border-l-2 border-warning bg-warning/10 px-2 py-1">
              <p className="text-2xs leading-snug text-foreground"><strong>{f.drillName}:</strong> {f.drill}</p>
            </div>
            {f.example !== undefined && (
              <button type="button" onClick={() => onSee(f.example!, f.key)} className="mt-1 text-2xs font-semibold text-primary hover:underline">
                See swing {f.example} →
              </button>
            )}
          </div>
        ))}
        <p className="flex items-start gap-1.5 text-2xs leading-snug text-muted-foreground">
          <CircleCheck className="mt-px size-3.5 shrink-0 text-success" />
          <span><strong className="text-foreground">Working well:</strong> {strongest.map((f) => f.label.toLowerCase()).join(" and ")}. Keep them as they are.</span>
        </p>
      </div>
    </Panel>
  );
}

/* ── Full report ─────────────────────────────────────────────────────── */

function FullReport({ selected, onSelect }: { selected: number; onSelect: (n: number) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-foreground">Full report</h2>
      <CompareSection selected={selected} />
      <SwingTable selected={selected} onSelect={onSelect} />
      <ProgressSection />
    </div>
  );
}

/* Two swings side by side, stopped at the same moment. */
function CompareSection({ selected }: { selected: number }) {
  const [a, setA] = React.useState(BEST_SWING);
  const [b, setB] = React.useState(selected === BEST_SWING ? WEAKEST_SWING : selected);
  const [view, setView] = React.useState<View>("dtl");
  const [phase, setPhase] = React.useState<Phase>("impact");
  const A = swingByN(a);
  const B = swingByN(b);
  const swingSelect = (value: number, onChange: (n: number) => void, label: string, tone: string) => (
    <div className="flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", tone)} />
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="h-8 w-40 text-xs" aria-label={label}><SelectValue /></SelectTrigger>
        <SelectContent>
          {SWINGS.map((s) => (
            <SelectItem key={s.n} value={String(s.n)} className="text-xs">
              Swing {s.n} · {swingScore(s)}{s.n === BEST_SWING ? " · best" : s.n === WEAKEST_SWING ? " · weakest" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  type Row = { label: string; a: number; b: number; unit: string; target?: readonly [number, number]; lowerIsBetter?: boolean; digits?: number };
  const rows: Row[] = [
    { label: "Swing score", a: swingScore(A), b: swingScore(B), unit: "", digits: 0 },
    { label: "Chest turn", a: A.chestTurn, b: B.chestTurn, unit: "°", target: TARGET.chestTurn, digits: 0 },
    { label: "Pelvis turn", a: A.pelvisTurn, b: B.pelvisTurn, unit: "°", target: TARGET.pelvisTurn, digits: 0 },
    { label: "X-factor", a: xFactor(A), b: xFactor(B), unit: "°", target: TARGET.xFactor, digits: 0 },
    { label: "Pelvis sway", a: A.pelvisSway, b: B.pelvisSway, unit: " cm", target: TARGET.pelvisSway },
    { label: "Head move", a: A.headMove, b: B.headMove, unit: " cm", target: TARGET.headMove },
    { label: "Spine lost", a: spineLost(A), b: spineLost(B), unit: "°", target: TARGET.spineLost, digits: 0 },
    { label: "Hips to ball", a: A.pelvisThrust, b: B.pelvisThrust, unit: " cm", target: TARGET.pelvisThrust },
    { label: "Tempo", a: tempo(A), b: tempo(B), unit: " : 1", target: TARGET.tempo },
    { label: "Club path", a: A.clubPath, b: B.clubPath, unit: "°", target: TARGET.clubPath },
    { label: "Club speed", a: A.clubSpeed, b: B.clubSpeed, unit: " mph", digits: 0 },
    { label: "Carry", a: A.carry, b: B.carry, unit: " yd", digits: 0 },
  ];
  const fmt = (v: number, d = 1) => v.toFixed(d);
  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <h3 className="text-sm font-bold text-foreground">Compare swings</h3>
        <span className="text-2xs text-muted-foreground">Synced at the same moment</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {swingSelect(a, setA, "Swing A", "bg-success")}
          {swingSelect(b, setB, "Swing B", "bg-info")}
          {/* Same height as the swing pickers beside it. */}
          <PanelTabs value={view} onChange={setView} tabs={[["face", "Face-on"], ["dtl", "Down-the-line"]]} className="group-data-[orientation=horizontal]/tabs:h-8" />
        </div>
      </header>
      <div className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-12">
        <div className="flex flex-col gap-2 lg:col-span-8">
          <div role="tablist" aria-label="Sync at" className="flex gap-1">
            {PHASES.map((p) => (
              <button key={p.key} type="button" role="tab" aria-selected={p.key === phase} onClick={() => setPhase(p.key)}
                className={cn("rounded px-2 py-0.5 text-2xs font-semibold transition-colors", p.key === phase ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[A, B].map((s, i) => (
              <figure key={i} className="overflow-hidden rounded-lg border border-border">
                <div className="aspect-video"><SwingFrame swing={s} view={view} phase={phase} hud={false} /></div>
                <figcaption className="flex items-center gap-1.5 border-t border-border px-2 py-1 text-2xs">
                  <span className={cn("size-2 rounded-full", i === 0 ? "bg-success" : "bg-info")} />
                  <span className="font-semibold text-foreground">Swing {s.n}</span>
                  <span className="text-muted-foreground">{swingScore(s)}/100 · {s.carry} yd · {shapeOf(s)}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-3xs font-semibold uppercase text-muted-foreground">
                <th className="py-1.5 pr-2">Measure</th>
                <th className="py-1.5 pr-2 text-right">#{A.n}</th>
                <th className="py-1.5 pr-2 text-right">#{B.n}</th>
                <th className="py-1.5 pr-2 text-right">B − A</th>
                <th className="py-1.5 text-right">Target</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const d = r.b - r.a;
                const out = (v: number) => r.target && !inRange(+v.toFixed(r.digits ?? 1), r.target);
                return (
                  <tr key={r.label} className="border-b border-border/60 last:border-0 font-mono text-2xs">
                    <td className="py-1 pr-2 font-sans text-xs text-foreground">{r.label}</td>
                    <td className={cn("py-1 pr-2 text-right", out(r.a) ? "text-sev-critical" : "text-foreground")}>{fmt(r.a, r.digits)}{r.unit}</td>
                    <td className={cn("py-1 pr-2 text-right", out(r.b) ? "text-sev-critical" : "text-foreground")}>{fmt(r.b, r.digits)}{r.unit}</td>
                    <td className="py-1 pr-2 text-right text-muted-foreground">{Math.abs(d) < 0.05 ? "—" : signed(d, r.digits ?? 1)}</td>
                    <td className="py-1 text-right text-muted-foreground">{r.target ? `${r.target[0]}–${r.target[1]}` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-1.5 text-3xs text-muted-foreground">Red: outside the coach's target for this golfer.</p>
        </div>
      </div>
    </section>
  );
}

/* Every swing of the lesson in one table. */
function SwingTable({ selected, onSelect }: { selected: number; onSelect: (n: number) => void }) {
  const cols: [string, string][] = [
    ["#", "Swing"], ["Score", "Swing score"], ["Chest", "Chest turn, °"], ["Pelvis", "Pelvis turn, °"], ["X", "X-factor, °"], ["Sway", "Pelvis sway, cm"],
    ["Head", "Head move, cm"], ["Spine", "Spine angle lost, °"], ["Hips", "Hips toward ball, cm"], ["Tempo", "Backswing : downswing"], ["Club", "Club speed, mph"],
    ["Carry", "Carry, yd"], ["Path", "Club path, °"], ["Face", "Face to target, °"], ["Shape", "Ball flight"], ["Faults", "AI findings"],
  ];
  const cell = "px-2 py-1.5 font-mono text-2xs whitespace-nowrap";
  const red = (bad: boolean) => (bad ? "text-sev-critical" : "text-muted-foreground");
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <h3 className="text-sm font-bold text-foreground">Every swing</h3>
        <span className="text-2xs text-muted-foreground">Click a row to review that swing above</span>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              {cols.map(([h, full]) => <th key={h} title={full} className="px-2 py-1.5 text-left text-3xs font-semibold uppercase text-muted-foreground">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {SWINGS.map((s) => {
              const sc = swingScore(s);
              const faults = findingsFor(s);
              return (
                <tr key={s.n} tabIndex={0} onClick={() => onSelect(s.n)} onKeyDown={(e) => e.key === "Enter" && onSelect(s.n)}
                  className={cn("cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/50", s.n === selected && "bg-muted")}>
                  <td className={cn(cell, "font-semibold text-foreground")}>{s.n}</td>
                  <td className={cn(cell, "font-semibold", TONE_TEXT[gradeTone(gradeOf(sc))])}>{sc}</td>
                  <td className={cn(cell, red(!inRange(s.chestTurn, TARGET.chestTurn)))}>{s.chestTurn}</td>
                  <td className={cn(cell, red(!inRange(s.pelvisTurn, TARGET.pelvisTurn)))}>{s.pelvisTurn}</td>
                  <td className={cn(cell, red(!inRange(xFactor(s), TARGET.xFactor)))}>{xFactor(s)}</td>
                  <td className={cn(cell, red(s.pelvisSway > TARGET.pelvisSway[1]))}>{s.pelvisSway.toFixed(1)}</td>
                  <td className={cn(cell, red(s.headMove > TARGET.headMove[1]))}>{s.headMove.toFixed(1)}</td>
                  <td className={cn(cell, red(spineLost(s) > TARGET.spineLost[1]))}>{spineLost(s)}</td>
                  <td className={cn(cell, red(s.pelvisThrust > TARGET.pelvisThrust[1]))}>{s.pelvisThrust.toFixed(1)}</td>
                  <td className={cn(cell, red(!inRange(tempo(s), TARGET.tempo)))}>{tempo(s).toFixed(1)}</td>
                  <td className={cn(cell, "text-muted-foreground")}>{s.clubSpeed}</td>
                  <td className={cn(cell, "text-foreground")}>{s.carry}</td>
                  <td className={cn(cell, red(!inRange(s.clubPath, TARGET.clubPath)))}>{signed(s.clubPath)}</td>
                  <td className={cn(cell, "text-muted-foreground")}>{signed(s.faceAngle)}</td>
                  <td className={cn(cell, red(shapeOf(s) === "Slice" || shapeOf(s) === "Hook"))}>{shapeOf(s)}</td>
                  <td className={cn(cell, "font-sans")}>
                    {faults.length ? (
                      <span className="flex flex-wrap gap-1">
                        {faults.map((f) => <span key={f.key} className="rounded bg-sev-critical/10 px-1 py-px text-3xs font-semibold text-sev-critical">{FAULTS[f.key].label}</span>)}
                      </span>
                    ) : <span className="text-3xs text-muted-foreground">None</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* Score and key measures across the golfer's lessons, plus the coach's notes. */
function ProgressSection() {
  const [note, setNote] = React.useState("Good lesson. Turn is much better. Next: chair drill every practice to stop the hips moving toward the ball.");
  const small: { key: "spineLost" | "xFactor" | "clubSpeed"; title: string; unit: string; band?: readonly [number, number]; lowerIsBetter?: boolean }[] = [
    { key: "spineLost", title: "Spine angle lost", unit: "°", band: TARGET.spineLost, lowerIsBetter: true },
    { key: "xFactor", title: "X-factor", unit: "°", band: TARGET.xFactor },
    { key: "clubSpeed", title: "Club speed", unit: " mph" },
  ];
  return (
    <section className="grid grid-cols-1 gap-3 lg:grid-cols-12">
      <div className="rounded-xl border border-border bg-card p-3 lg:col-span-5">
        <div className="mb-2 flex items-baseline gap-2">
          <h3 className="text-sm font-bold text-foreground">Progress</h3>
          <span className="text-2xs text-muted-foreground">Swing score by lesson · goal {GOAL_SCORE}</span>
          <span className="ml-auto flex items-center gap-1 text-2xs text-muted-foreground"><Target className="size-3" />{GOAL_SCORE - STATS.score > 0 ? `${GOAL_SCORE - STATS.score} to goal` : "Goal reached"}</span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={LESSONS} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
              <XAxis dataKey="date" {...AXIS} fontSize={10} />
              <YAxis domain={[40, 90]} ticks={[50, 60, 70, 80, 90]} {...AXIS} fontSize={10} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${v}/100`, "Swing score"]} />
              <ReferenceLine y={GOAL_SCORE} stroke="var(--success)" strokeDasharray="4 3" label={{ value: "Goal", position: "insideTopRight", fill: "var(--success)", fontSize: 10 }} />
              <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3, fill: "var(--primary)" }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-4 lg:grid-cols-1">
        {small.map((m) => {
          const first = LESSONS[0][m.key];
          const last = LESSONS[LESSONS.length - 1][m.key];
          const better = m.lowerIsBetter ? last < first : last > first;
          return (
            <div key={m.key} className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
              <div className="w-28 shrink-0">
                <p className="truncate text-3xs font-semibold uppercase text-muted-foreground">{m.title}</p>
                <p className="font-mono text-md font-bold text-foreground">{last}{m.unit}</p>
                <p className={cn("text-3xs", better ? "text-success" : "text-sev-critical")}>{signed(last - first)}{m.unit} since {LESSONS[0].date}</p>
              </div>
              <div className="h-12 min-w-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={LESSONS} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                    {m.band && <ReferenceArea y1={m.band[0]} y2={m.band[1]} fill="var(--success)" fillOpacity={0.1} strokeOpacity={0} />}
                    <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(_, p) => String(p?.[0]?.payload?.date ?? "")} formatter={(v) => [`${v}${m.unit}`, m.title]} />
                    <Line type="monotone" dataKey={m.key} stroke={better ? "var(--success)" : "var(--sev-critical)"} strokeWidth={1.6} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 lg:col-span-3">
        <h3 className="text-sm font-bold text-foreground">Coach notes</h3>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-28 flex-1 text-sm" aria-label="Coach notes" />
        <div className="flex items-center gap-2">
          <span className="text-3xs text-muted-foreground">Shown on the golfer's report</span>
          <Button size="sm" className="ml-auto" onClick={() => toast.success("Notes saved")}>Save notes</Button>
        </div>
      </div>
    </section>
  );
}
