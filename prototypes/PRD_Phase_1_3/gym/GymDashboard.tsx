import * as React from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Check, ChevronLeft, ChevronRight, CircleCheck, CircleMinus, CircleX, Dumbbell, Eraser, FileDown, Info, Pause, PenLine, Play, Share2, Trophy,
  TrendingDown, TrendingUp, TriangleRight, X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DrawLayer, type Mark, type Tool } from "../golf/golfParts";
import {
  BEST_REP, FAULTS, GRADE_BANDS, HISTORY, LIFTER, METHOD_NOTE, PERSONAL_BESTS, PHASES, PREVIOUS, REPS, SESSION, SETS, STATS, STOP_AT, TARGET, WEAKEST_REP, WINDOW,
  findingsFor, fmtClock, fundamentalsFor, gradeOf, initialsOf, nextLoad, peakVelOf, phaseTime, rankedFaults, repById, repLoss, repScore, repSeries, repsOf,
  velLossOf, type FaultKey, type Finding, type Phase, type Rep,
} from "./gymSession";
import { BarPathPlot, RepFrame } from "./gymParts";

/* Lift Analysis — one lifter's back-squat workout at a rack, laid out like the
   golf Swing Assessment: the overview fits a laptop screen (summary, rep video
   with the pose and bar path, the picked rep's review, bar path, signals,
   fundamentals and coaching), and the full report follows below it (first rep
   vs last rep, every rep in a table, progress across sessions, coach notes).

   One rep is "picked" at a time and every panel follows it. */

const TOOLTIP_STYLE = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 };
const AXIS = { stroke: "var(--muted-foreground)", fontSize: 9, tickLine: false, axisLine: false } as const;
const gradeTone = (g: string) => (g === "A" || g === "B" ? "success" : g === "C" ? "warning" : "sev-critical");
const TONE_TEXT = { success: "text-success", warning: "text-warning", "sev-critical": "text-sev-critical" } as const;
const TONE_FILL = { success: "bg-success/15", warning: "bg-warning/15", "sev-critical": "bg-sev-critical/15" } as const;
const TONE_DOT = { success: "bg-success", warning: "bg-warning", "sev-critical": "bg-sev-critical" } as const;
const repTone = (r: Rep) => gradeTone(gradeOf(repScore(r)));

type Review = "confirmed" | "dismissed";
type Reviews = Record<string, Review>;
const reviewKey = (id: string, k: FaultKey) => `${id}:${k}`;

/** The moment of the rep that shows each fault best. */
const FAULT_PHASE: Record<FaultKey, Phase> = {
  hipsRiseFirst: "ascent", forwardLean: "bottom", barDrift: "ascent", shallowDepth: "bottom", backRounding: "bottom", heelLift: "bottom", kneeCave: "bottom",
};

/* ── Page ────────────────────────────────────────────────────────────── */

export function GymDashboard() {
  /* `?person=` (from the sessions list) names the lifter; the mock lifter otherwise. */
  const { search } = useLocation();
  const name = new URLSearchParams(search).get("person")?.trim() || LIFTER.name;
  const [selected, setSelected] = React.useState(WEAKEST_REP);
  const [phase, setPhase] = React.useState<Phase>("bottom");
  const [reviews, setReviews] = React.useState<Reviews>({});
  const rep = repById(selected);

  /* A coaching "See rep" link picks the rep and the moment that shows the fault. */
  function showFault(id: string, key: FaultKey) {
    setSelected(id);
    setPhase(FAULT_PHASE[key]);
    window.requestAnimationFrame(() => document.getElementById("gym-video")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:h-[calc(100svh-6rem)] lg:min-h-[720px]">
        <PageHeader>
          <PageHeader.Content className="flex-row items-center gap-3">
            <PageHeader.Title>Lift Analysis</PageHeader.Title>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5 text-2xs font-semibold text-muted-foreground">
              <span className="size-1.5 rounded-full bg-success" />
              Workout complete
            </span>
          </PageHeader.Content>
          <PageHeader.Actions>
            <Button variant="outline" size="sm" onClick={() => toast.success(`Shared with ${name}`, { description: `${SESSION.lift} · ${SESSION.date}` })}>
              <Share2 className="size-4" />
              Share with lifter
            </Button>
            <Button size="sm" onClick={() => toast.success("Report exported", { description: `Lift_${LIFTER.id}_${SESSION.rack.replace(" ", "")}.pdf` })}>
              <FileDown className="size-4" />
              Export PDF
            </Button>
          </PageHeader.Actions>
        </PageHeader>

        <dl className="-mt-1 flex shrink-0 flex-wrap items-baseline gap-x-5 gap-y-0.5">
          {([
            ["Gym / rack", `${SESSION.gym} · ${SESSION.rack}`], ["Lift", `${SESSION.lift} · ${SESSION.plannedSets} × ${SESSION.plannedReps} @ ${SESSION.load} kg`],
            ["Coach", SESSION.coach], ["Date", SESSION.date], ["Camera", `${SESSION.cameras} · no front`], ["Bar sensor", SESSION.sensor],
          ] as const).map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-1.5">
              <dt className="text-3xs font-semibold uppercase text-muted-foreground">{k}</dt>
              <dd className="text-2xs font-semibold text-foreground">{v}</dd>
            </div>
          ))}
        </dl>

        <SummaryStrip name={name} />

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-12 lg:grid-rows-[minmax(300px,1.15fr)_minmax(260px,1fr)]">
          <VideoPanel className="lg:col-span-5" rep={rep} phase={phase} onPhase={setPhase} onSelect={setSelected} />
          <ReviewPanel className="lg:col-span-4" rep={rep} reviews={reviews} onReview={(k, r) => setReviews((m) => ({ ...m, [k]: r }))} onSelect={setSelected} />
          <BarPathPanel className="lg:col-span-3" rep={rep} onSelect={setSelected} />
          <SignalsPanel className="lg:col-span-5" rep={rep} phase={phase} onSelect={setSelected} />
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

function PanelTabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: [T, string][] }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as T)}>
      {/* The shared TabsList sets h-9 through a group-data variant, so match it to shrink. */}
      <TabsList className="group-data-[orientation=horizontal]/tabs:h-7">
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

function Delta({ now, before, lowerIsBetter = false, unit = "", digits = 0 }: { now: number; before: number; lowerIsBetter?: boolean; unit?: string; digits?: number }) {
  const d = +(now - before).toFixed(digits);
  if (d === 0) return <span className="text-muted-foreground">Same as {PREVIOUS.date}</span>;
  const better = lowerIsBetter ? d < 0 : d > 0;
  const Arrow = d > 0 ? TrendingUp : TrendingDown;
  return (
    <span className={cn("inline-flex items-center gap-1", better ? "text-success" : "text-sev-critical")}>
      <Arrow className="size-3" />
      {d > 0 ? "+" : "−"}{Math.abs(d).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}{unit} vs {PREVIOUS.date}
    </span>
  );
}

const signed = (v: number, digits = 1) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(digits)}`;
const repLabel = (r: Rep) => `Set ${r.set} · Rep ${r.rep}`;

/* ── Summary strip ───────────────────────────────────────────────────── */

function SummaryStrip({ name }: { name: string }) {
  const s = STATS;
  const lossBad = s.velLoss > TARGET.velLoss;
  const kpis: { label: string; value: string; tone?: string; info: string; delta: React.ReactNode }[] = [
    { label: "Sets", value: `${s.sets}/${SESSION.plannedSets}`, tone: s.sets >= SESSION.plannedSets ? "text-success" : "text-warning", info: "Sets done out of the sets planned for this workout.", delta: <span className="text-muted-foreground">{s.sets >= SESSION.plannedSets ? "All planned" : `${SESSION.plannedSets - s.sets} skipped`}</span> },
    { label: "Good reps", value: `${s.good}/${s.reps}`, tone: s.good / s.reps >= 0.85 ? "text-success" : "text-warning", info: "Reps with no fault found: depth, torso lean, bar path and the rest all within the coach's targets.", delta: <Delta now={s.good} before={PREVIOUS.good} /> },
    { label: "Volume", value: `${s.volume.toLocaleString()} kg`, info: "Load × reps across every set.", delta: <Delta now={s.volume} before={PREVIOUS.volume} unit=" kg" /> },
    { label: "Avg bar speed", value: `${s.avgVel.toFixed(2)} m/s`, tone: "text-info", info: `Mean speed of the bar on the way up, averaged over every rep. From the bar speed sensor. Last session was at ${PREVIOUS.load} kg.`, delta: <Delta now={+s.avgVel.toFixed(2)} before={PREVIOUS.avgVel} unit=" m/s" digits={2} /> },
    { label: "Est. 1RM", value: `${s.e1rm} kg`, tone: "text-purple", info: "Estimated one-rep max from the load and how fast the first rep of each set moved (load–velocity profile).", delta: <Delta now={s.e1rm} before={PREVIOUS.e1rm} unit=" kg" /> },
    { label: "Velocity loss", value: `${s.velLoss}%`, tone: lossBad ? "text-sev-critical" : "text-success", info: `How much slower the last rep was than the first, in the worst set. Above ${TARGET.velLoss}% form usually breaks down.`, delta: <Delta now={s.velLoss} before={PREVIOUS.velLoss} unit="%" lowerIsBetter /> },
  ];
  return (
    <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.3fr)_repeat(6,minmax(0,1fr))]">
      <div className="col-span-2 flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2 lg:col-span-1">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-2xs font-bold text-primary">{initialsOf(name)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-foreground">{name}</p>
          <p className="truncate font-mono text-2xs text-muted-foreground">{LIFTER.id}</p>
        </div>
      </div>
      <UiTooltip>
        <TooltipTrigger asChild>
          <div className="col-span-2 flex cursor-help items-center rounded-xl border border-border bg-card px-2.5 py-2 lg:col-span-1">
            <div className="flex min-w-0 items-center gap-2">
              <GradeBadge score={s.score} size="lg" />
              <div className="min-w-0 leading-tight">
                <p className="truncate text-3xs font-semibold uppercase text-muted-foreground">Form score</p>
                <p className="font-mono text-sm font-bold text-foreground">{s.score}<span className="text-muted-foreground">/100</span></p>
                <p className="truncate text-3xs"><Delta now={s.score} before={PREVIOUS.score} /></p>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-64 text-xs leading-snug">Average rep score across the workout, from the six fundamentals. {GRADE_BANDS.map(([g, m]) => `${g} ${m}+`).join(" · ")}.</TooltipContent>
      </UiTooltip>
      {kpis.map((k) => (
        <UiTooltip key={k.label}>
          <TooltipTrigger asChild>
            <div className="min-w-0 cursor-help rounded-xl border border-border bg-card px-2.5 py-2">
              <p className="truncate text-3xs font-semibold uppercase text-muted-foreground">{k.label}</p>
              <p className={cn("mt-0.5 truncate text-lg font-bold leading-tight", k.tone ?? "text-foreground")}>{k.value}</p>
              <p className="truncate text-3xs">{k.delta}</p>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-64 text-xs leading-snug">{k.info}</TooltipContent>
        </UiTooltip>
      ))}
    </div>
  );
}

/* ── Rep video ───────────────────────────────────────────────────────── */

const PHASE_ORDER = PHASES.map((p) => p.key);

function VideoPanel({ className, rep, phase, onPhase, onSelect }: {
  className?: string; rep: Rep; phase: Phase; onPhase: (p: Phase) => void; onSelect: (id: string) => void;
}) {
  const [showPose, setShowPose] = React.useState(true);
  const [showPath, setShowPath] = React.useState(true);
  const [tool, setTool] = React.useState<Tool>("none");
  const [marks, setMarks] = React.useState<Mark[]>([]);
  const [playing, setPlaying] = React.useState(false);
  /* Drawings belong to one frame: a new rep or moment starts clean. */
  const frame = `${rep.id}-${phase}`;
  const [markedFrame, setMarkedFrame] = React.useState(frame);
  if (markedFrame !== frame) {
    setMarkedFrame(frame);
    setMarks([]);
  }

  /* Play steps through the five moments of the rep, then stops at lockout. */
  const running = playing && phase !== "lockout";
  React.useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => onPhase(PHASE_ORDER[PHASE_ORDER.indexOf(phase) + 1]), 650);
    return () => window.clearTimeout(id);
  }, [running, phase, onPhase]);

  const step = (d: number) => onPhase(PHASE_ORDER[Math.max(0, Math.min(PHASE_ORDER.length - 1, PHASE_ORDER.indexOf(phase) + d))]);
  const toolBtn = (t: Exclude<Tool, "none">, Icon: typeof PenLine, label: string) => (
    <button type="button" aria-label={label} title={label} aria-pressed={tool === t} onClick={() => setTool(tool === t ? "none" : t)}
      className={cn("grid size-6 place-items-center rounded transition-colors", tool === t ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
      <Icon className="size-3.5" />
    </button>
  );

  return (
    <Panel
      id="gym-video"
      className={className}
      title="Rep Video"
      meta={repLabel(rep)}
      bodyClassName="p-0"
      action={
        <div className="flex items-center gap-1">
          {toolBtn("line", PenLine, "Draw a line")}
          {toolBtn("angle", TriangleRight, "Measure an angle (3 clicks)")}
          <button type="button" aria-label="Clear drawings" title="Clear drawings" disabled={!marks.length} onClick={() => setMarks([])}
            className="grid size-6 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40">
            <Eraser className="size-3.5" />
          </button>
          <label className="ml-1 flex items-center gap-1 text-2xs text-muted-foreground">
            <Switch checked={showPose} onCheckedChange={setShowPose} className="scale-75" aria-label="Show pose" />
            Pose
          </label>
          <label className="flex items-center gap-1 text-2xs text-muted-foreground">
            <Switch checked={showPath} onCheckedChange={setShowPath} className="scale-75" aria-label="Show bar path" />
            Path
          </label>
        </div>
      }
    >
      <div className="relative min-h-0 flex-1 overflow-hidden bg-camera-feed max-lg:aspect-video">
        <RepFrame rep={rep} phase={phase} showPose={showPose} showPath={showPath} className="absolute inset-0">
          <DrawLayer tool={tool} marks={marks} onAdd={(m) => setMarks((ms) => [...ms, m])} />
        </RepFrame>
        {tool !== "none" && (
          <p className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-3xs text-white">
            {tool === "line" ? "Click two points to draw a line" : "Click three points · the middle one is the corner"}
          </p>
        )}
      </div>
      {/* Key moments of the picked rep */}
      <div className="flex h-8 shrink-0 items-center gap-1 border-t border-border px-2">
        <button type="button" aria-label={running ? "Pause" : "Play through the rep"}
          onClick={() => {
            if (running) return setPlaying(false);
            if (phase === "lockout") onPhase("setup");
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
      {/* Workout timeline: every rep, grouped by set, coloured by its grade */}
      <div className="flex h-8 shrink-0 items-center gap-2 border-t border-border px-2">
        <span className="w-8 shrink-0 font-mono text-2xs text-muted-foreground">{fmtClock(rep.at)}</span>
        <div className="flex min-w-0 flex-1 gap-1.5">
          {SETS.map((s) => (
            <div key={s} className="flex min-w-0 flex-1 items-center gap-0.5 rounded bg-muted/60 px-1 py-0.5">
              <span className={cn("mr-0.5 shrink-0 text-3xs font-bold", s === rep.set ? "text-foreground" : "text-muted-foreground")}>S{s}</span>
              {repsOf(s).map((r) => (
                <button key={r.id} type="button" onClick={() => onSelect(r.id)} aria-label={`${repLabel(r)} at ${fmtClock(r.at)}`} title={`${repLabel(r)} · ${fmtClock(r.at)} · ${repScore(r)}/100`}
                  className={cn("h-2.5 min-w-0 flex-1 rounded-sm transition-transform hover:scale-y-150", r.id === rep.id ? "bg-foreground ring-2 ring-primary/50" : TONE_DOT[repTone(r)])} />
              ))}
            </div>
          ))}
        </div>
        <span className="w-8 shrink-0 text-right font-mono text-2xs text-muted-foreground">{fmtClock(SESSION.lengthSec)}</span>
      </div>
    </Panel>
  );
}

/* ── Rep review ──────────────────────────────────────────────────────── */

type CheckRow = { label: string; ok: boolean | null; note: string };

function checksFor(r: Rep): CheckRow[] {
  return [
    { label: "Depth", ok: r.depth >= TARGET.depth, note: `${signed(r.depth)} cm vs knee · below parallel` },
    { label: "Torso lean", ok: r.lean <= TARGET.lean, note: `${r.lean}° · max ${TARGET.lean}°` },
    { label: "Bar path", ok: r.drift <= TARGET.drift, note: `${r.drift.toFixed(1)} cm drift · max ${TARGET.drift}` },
    { label: "Knee tracking", ok: r.knee === null ? null : r.knee <= TARGET.knee, note: r.knee === null ? "Needs front camera" : `${r.knee}° · max ${TARGET.knee}°` },
    { label: "Tempo", ok: r.ecc >= TARGET.ecc[0] && r.ecc <= TARGET.ecc[1], note: `Down ${r.ecc.toFixed(1)} s · up ${r.con.toFixed(1)} s` },
    { label: "Lockout", ok: r.lockout >= TARGET.lockout, note: `Hip ${r.lockout}° · min ${TARGET.lockout}°` },
  ];
}

const CONF_TONE = { High: "text-foreground", Medium: "text-warning", Low: "text-sev-critical" } as const;

function ReviewPanel({ className, rep, reviews, onReview, onSelect }: {
  className?: string; rep: Rep; reviews: Reviews; onReview: (k: string, r: Review) => void; onSelect: (id: string) => void;
}) {
  const checks = checksFor(rep);
  const measured = checks.filter((c) => c.ok !== null);
  const met = measured.filter((c) => c.ok).length;
  const findings = findingsFor(rep);
  const score = repScore(rep);
  const open = REPS.flatMap((r) => findingsFor(r).map((f) => reviewKey(r.id, f.key))).filter((k) => !reviews[k]).length;
  const tag = rep.id === BEST_REP ? "Best rep" : rep.id === WEAKEST_REP ? "Weakest rep" : null;
  return (
    <Panel className={className} title="Rep Review" meta={open ? `${open} findings to review` : "All reviewed"}>
      {/* One set at a time: the set tabs carry each set's speed loss, and the
          picked set's reps sit underneath at full size. */}
      <div role="tablist" aria-label="Sets" className="mb-1.5 grid shrink-0 grid-cols-4 gap-1">
        {SETS.map((s) => {
          const active = s === rep.set;
          const loss = velLossOf(s);
          return (
            <button key={s} type="button" role="tab" aria-selected={active} onClick={() => !active && onSelect(repsOf(s)[0].id)}
              className={cn("flex items-center justify-between gap-1 rounded-md border px-2 py-1 transition-colors duration-[var(--duration-fast)]",
                active ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40")}>
              <span className={cn("text-2xs font-semibold", active ? "text-foreground" : "text-muted-foreground")}>Set {s}</span>
              <span className={cn("font-mono text-3xs", loss > TARGET.velLoss ? "text-sev-critical" : "text-muted-foreground")}>−{loss}%</span>
            </button>
          );
        })}
      </div>
      <div role="tablist" aria-label={`Set ${rep.set} reps`} className="mb-2 grid shrink-0 grid-cols-5 gap-1">
        {repsOf(rep.set).map((r) => {
          const active = r.id === rep.id;
          return (
            <button key={r.id} type="button" role="tab" aria-selected={active} aria-label={repLabel(r)} onClick={() => onSelect(r.id)}
              className={cn("flex flex-col items-center rounded-md border py-0.5 transition-colors duration-[var(--duration-fast)]",
                active ? "border-primary bg-primary/10 shadow-[inset_0_0_0_1px_var(--primary)]" : "border-border bg-background hover:border-primary/40")}>
              <span className="flex items-center gap-0.5 text-2xs font-bold text-foreground">
                Rep {r.rep}
                {r.id === BEST_REP && <span title="Best rep" className="size-1.5 rounded-full bg-success" />}
                {r.id === WEAKEST_REP && <span title="Weakest rep" className="size-1.5 rounded-full bg-sev-critical" />}
              </span>
              <span className={cn("font-mono text-3xs font-semibold", TONE_TEXT[repTone(r)])}>{repScore(r)}</span>
            </button>
          );
        })}
      </div>
      <p className="mb-1 flex shrink-0 items-center gap-2 font-mono text-2xs text-muted-foreground">
        <span className="truncate">{repLabel(rep)}: <span className="font-semibold text-foreground">{score}/100 · {rep.meanVel.toFixed(2)} m/s</span> · {met}/{measured.length} met</span>
        {tag && <span className={cn("ml-auto shrink-0 rounded px-1.5 py-px font-sans text-3xs font-bold uppercase tracking-wider", rep.id === BEST_REP ? "bg-success/15 text-success" : "bg-sev-critical/15 text-sev-critical")}>{tag}</span>}
      </p>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        <ul className="flex flex-col gap-0.5">
          {checks.map((c) => (
            <li key={c.label} className={cn("flex items-center gap-2 rounded-md px-2 py-1", c.ok === false ? "bg-sev-critical/[0.07]" : "bg-background")}>
              {c.ok === null ? <CircleMinus className="size-4 shrink-0 text-muted-foreground" aria-label="Not measured" />
                : c.ok ? <CircleCheck className="size-4 shrink-0 text-success" aria-label="Met" />
                : <CircleX className="size-4 shrink-0 text-sev-critical" aria-label="Not met" />}
              <span className={cn("shrink-0 text-xs font-semibold", c.ok === null ? "text-muted-foreground" : "text-foreground")}>{c.label}</span>
              {c.ok === null && <InfoTip text="Knee cave is read from the front. Add the optional front camera to this rack to measure it." />}
              <span className={cn("ml-auto truncate text-right font-mono text-2xs", c.ok === false ? "text-sev-critical" : "text-muted-foreground")}>{c.note}</span>
            </li>
          ))}
        </ul>
        <div>
          <p className="mb-1 flex items-center gap-1 text-3xs font-bold uppercase tracking-wider text-muted-foreground">
            AI findings · coach review
            <InfoTip text="Confirm a finding to keep it in the lifter's report, or dismiss it if the AI got it wrong. Confidence is how sure the model is: back rounding is hard to read from one side camera." />
          </p>
          {findings.length === 0 ? (
            <p className="rounded-md bg-background px-2 py-1.5 text-2xs text-muted-foreground">No faults on this rep.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {findings.map((f) => <FindingRow key={f.key} id={rep.id} f={f} status={reviews[reviewKey(rep.id, f.key)]} onReview={onReview} />)}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}

function FindingRow({ id, f, status, onReview }: { id: string; f: Finding; status?: Review; onReview: (k: string, r: Review) => void }) {
  const k = reviewKey(id, f.key);
  return (
    <li className={cn("flex items-center gap-2 rounded-md border px-2 py-1", status === "dismissed" ? "border-border bg-background opacity-60" : status === "confirmed" ? "border-success/30 bg-success/[0.06]" : "border-warning/30 bg-warning/[0.06]")}>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-xs font-semibold text-foreground", status === "dismissed" && "line-through")}>{FAULTS[f.key].label}</p>
        <p className="truncate font-mono text-3xs text-muted-foreground">{f.detail} · <span className={CONF_TONE[f.confidence]}>{f.confidence}</span></p>
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

/* ── Bar path ────────────────────────────────────────────────────────── */

function BarPathPanel({ className, rep, onSelect }: { className?: string; rep: Rep; onSelect: (id: string) => void }) {
  const peak = peakVelOf(rep);
  const cells: [string, string, boolean?][] = [
    ["Drift", `${rep.drift.toFixed(1)} cm`, rep.drift > TARGET.drift],
    ["Bar travel", `${rep.rom} cm`],
    ["Start", `${signed(rep.setup)} cm`, rep.setup > TARGET.setup],
    ["Mean speed", `${rep.meanVel.toFixed(2)} m/s`],
    ["Peak speed", `${peak.toFixed(2)} m/s`],
    ["Power", `${Math.round(SESSION.load * 9.81 * rep.meanVel)} W`],
  ];
  return (
    <Panel className={className} title="Bar Path" meta={`${repLabel(rep)} · side view`}
      action={<InfoTip text={`The bar should travel straight up and down over mid-foot. Drift is the furthest it moves off that line; up to ${TARGET.drift} cm is fine. Faint lines are the other reps of the set — click one to pick it.`} />}>
      <div className="grid min-h-0 flex-1 place-items-center max-lg:aspect-square">
        <BarPathPlot rep={rep} others={repsOf(rep.set)} onSelect={onSelect} className="max-h-full" />
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
        <li className="flex items-center gap-1"><span className={cn("h-0.5 w-3 rounded-full", rep.drift > TARGET.drift ? "bg-sev-critical" : "bg-primary")} />Rep {rep.rep}</li>
        <li className="flex items-center gap-1"><span className="h-0.5 w-3 rounded-full bg-muted-foreground/50" />Set {rep.set}</li>
        <li className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-sm bg-success/20" />±{TARGET.drift} cm</li>
      </ul>
    </Panel>
  );
}

/* ── Signals ─────────────────────────────────────────────────────────── */

const SYNC = { syncId: "gym-signals", syncMethod: "value" } as const;
const T_TICKS = [0, 1, 2, 3, 4];

function SignalsPanel({ className, rep, phase, onSelect }: { className?: string; rep: Rep; phase: Phase; onSelect: (id: string) => void }) {
  const series = React.useMemo(() => repSeries(rep), [rep]);
  const now = +phaseTime(rep, phase).toFixed(2);
  const bottom = +phaseTime(rep, "bottom").toFixed(2);
  const atBottom = series.reduce((a, p) => (Math.abs(p.t - bottom) < Math.abs(a.t - bottom) ? p : a));
  const leanBad = rep.lean > TARGET.lean;
  const setReps = repsOf(rep.set);
  const stop = +(setReps[0].meanVel * STOP_AT).toFixed(2);
  const loss = repLoss(rep);
  const marks = (
    <>
      <ReferenceLine x={bottom} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
      <ReferenceLine x={now} stroke="var(--primary)" strokeWidth={2} />
    </>
  );
  const xAxis = <XAxis dataKey="t" type="number" domain={WINDOW} ticks={T_TICKS} {...AXIS} />;
  return (
    <Panel className={className} title="Rep Signals" meta={repLabel(rep)} action={<InfoTip text={METHOD_NOTE} />}
      bodyClassName="grid grid-cols-2 grid-rows-2 gap-2 max-lg:auto-rows-[120px]">
      <MiniChart title="Bar speed" value={`avg ${rep.meanVel.toFixed(2)} · pk ${peakVelOf(rep).toFixed(2)}`} legend={<><Swatch c="bg-info" />m/s · dashed: bottom</>}>
        <LineChart data={series} margin={{ top: 4, right: 4, left: -26, bottom: -6 }} {...SYNC}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
          {xAxis}
          <YAxis domain={[-1.2, 1.2]} ticks={[-1, 0, 1]} {...AXIS} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `${v} s`} formatter={(v) => [`${v} m/s`, "Bar speed"]} />
          <ReferenceLine y={0} stroke="var(--border)" />
          {marks}
          <Line type="monotone" dataKey="vel" stroke="var(--info)" strokeWidth={1.6} dot={false} isAnimationActive={false} />
        </LineChart>
      </MiniChart>
      <MiniChart title="Hip & knee" value={`Hip ${atBottom.hip}° · knee ${atBottom.knee}°`} legend={<><Swatch c="bg-warning" />Hip <Swatch c="bg-purple" />Knee · joint angle °</>}>
        <LineChart data={series} margin={{ top: 4, right: 4, left: -26, bottom: -6 }} {...SYNC}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
          {xAxis}
          <YAxis domain={[30, 185]} ticks={[45, 90, 135, 180]} {...AXIS} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `${v} s`} formatter={(v, n) => [`${v}°`, n === "hip" ? "Hip" : "Knee"]} />
          {marks}
          <Line type="monotone" dataKey="hip" stroke="var(--warning)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="knee" stroke="var(--purple)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </MiniChart>
      <MiniChart title="Torso lean" value={`${rep.lean}°${rep.hipRise > TARGET.hipRise ? ` · hips +${rep.hipRise}°` : ""}`} bad={leanBad || rep.hipRise > TARGET.hipRise}
        legend={<><Swatch c="bg-success/40" />Up to {TARGET.lean}° from vertical</>}>
        <LineChart data={series} margin={{ top: 4, right: 4, left: -26, bottom: -6 }} {...SYNC}>
          <ReferenceArea y1={0} y2={TARGET.lean} fill="var(--success)" fillOpacity={0.08} strokeOpacity={0} />
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
          {xAxis}
          <YAxis domain={[0, 70]} ticks={[0, 20, 45, 60]} {...AXIS} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `${v} s`} formatter={(v) => [`${v}°`, "Torso lean"]} />
          <ReferenceLine y={TARGET.lean} stroke="var(--success)" strokeDasharray="3 3" />
          {marks}
          <Line type="monotone" dataKey="lean" stroke={leanBad || rep.hipRise > TARGET.hipRise ? "var(--sev-critical)" : "var(--success)"} strokeWidth={1.6} dot={false} isAnimationActive={false} />
        </LineChart>
      </MiniChart>
      <MiniChart title={`Set ${rep.set} speed`} value={`Rep ${rep.rep} −${loss}%`} bad={velLossOf(rep.set) > TARGET.velLoss}
        legend={<><Swatch c="bg-primary" />Picked <span className="ml-2.5 mr-1 inline-block w-2.5 border-t border-dashed border-sev-critical align-middle" />Stop at −{TARGET.velLoss}% ({stop} m/s)</>}>
        <BarChart data={setReps.map((r) => ({ id: r.id, rep: r.rep, vel: r.meanVel, loss: repLoss(r) }))} margin={{ top: 4, right: 4, left: -26, bottom: -6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
          <XAxis dataKey="rep" {...AXIS} tickFormatter={(v) => `R${v}`} />
          <YAxis domain={[0, 0.7]} ticks={[0, 0.2, 0.4, 0.6]} {...AXIS} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--muted)", opacity: 0.4 }} labelFormatter={(v) => `Rep ${v}`}
            formatter={(v, _n, p) => [`${v} m/s · −${(p?.payload as { loss?: number } | undefined)?.loss ?? 0}%`, "Mean speed"]} />
          <ReferenceLine y={stop} stroke="var(--sev-critical)" strokeDasharray="3 3" />
          <Bar dataKey="vel" radius={[3, 3, 0, 0]} isAnimationActive={false} className="cursor-pointer"
            onClick={(d) => { const id = (d as { payload?: { id?: string } }).payload?.id; if (id) onSelect(id); }}>
            {setReps.map((r) => (
              <Cell key={r.id} fill={r.id === rep.id ? "var(--primary)" : r.meanVel < stop ? "var(--sev-critical)" : "var(--muted-foreground)"} fillOpacity={r.id === rep.id ? 1 : 0.45} />
            ))}
          </Bar>
        </BarChart>
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
  const rows = fundamentalsFor(REPS);
  return (
    <Panel className={className} title="Fundamentals" meta={`vs ${PREVIOUS.date}`}
      action={<InfoTip text={`Each fundamental is scored 0–100 on every rep and graded on the average: ${GRADE_BANDS.map(([g, m]) => `${g} ${m}+`).join(" · ")}. A rep meets it at 75+. Hover a row for what it measures.`} />}>
      <ul className="flex min-h-0 flex-1 flex-col justify-between gap-1">
        {rows.map((f) => (
          <li key={f.key} className="flex items-center gap-2" title={f.measures}>
            <GradeBadge score={f.score} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-1.5">
                <span className="truncate text-xs font-semibold text-foreground">{f.label}</span>
                <span className="ml-auto shrink-0 font-mono text-3xs text-muted-foreground">{f.met}/{REPS.length}</span>
              </div>
              <div className="relative mt-0.5 h-1.5 rounded-full bg-muted">
                <div className="absolute inset-y-0 left-0 rounded-full bg-muted-foreground/35" style={{ width: `${f.previous}%` }} />
                <div className={cn("absolute inset-y-0 left-0 rounded-full opacity-85", TONE_DOT[gradeTone(gradeOf(f.score))])} style={{ width: `${f.score}%` }} />
              </div>
            </div>
            <span className="w-12 shrink-0 text-right font-mono text-3xs">
              <span className="font-semibold text-foreground">{f.score}</span>{" "}
              <span className={f.score >= f.previous ? "text-success" : "text-sev-critical"}>{f.score >= f.previous ? "+" : "−"}{Math.abs(f.score - f.previous)}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 shrink-0 text-3xs text-muted-foreground"><span className="mr-1 inline-block h-1.5 w-2.5 rounded-sm bg-muted-foreground/35 align-middle" />{PREVIOUS.date} · solid bar today</p>
    </Panel>
  );
}

/* ── Coaching ────────────────────────────────────────────────────────── */

function CoachingPanel({ className, onSee }: { className?: string; onSee: (id: string, k: FaultKey) => void }) {
  const faults = rankedFaults(REPS).slice(0, 2);
  const strongest = [...fundamentalsFor(REPS)].sort((a, b) => b.score - a.score).slice(0, 2);
  const next = nextLoad();
  return (
    <Panel className={className} title="Coaching" meta="Ranked by impact"
      action={<InfoTip text="Faults are ranked by how many reps they hit and how much they matter for safety and the lift. Speed is how much slower those reps moved than clean reps." />}>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {faults.map((f, i) => (
          <div key={f.key} className="rounded-lg border border-border bg-background p-2">
            <div className="flex items-center gap-2">
              <span className="grid size-4 shrink-0 place-items-center rounded bg-sev-critical/15 font-mono text-3xs font-bold text-sev-critical">{i + 1}</span>
              <span className="min-w-0 truncate text-xs font-bold text-foreground">{f.label}</span>
              <InfoTip text={`${f.what} First seen in set ${f.firstSet}.`} />
              <span className="ml-auto shrink-0 font-mono text-3xs text-muted-foreground">
                {f.count}/{REPS.length} reps{f.velCost > 0 && <> · <span className="text-sev-critical">−{f.velCost.toFixed(2)} m/s</span></>}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded-md border-l-2 border-warning bg-warning/10 px-2 py-0.5 text-2xs font-semibold text-foreground">“{f.cue}”</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-2xs text-muted-foreground"><Dumbbell className="size-3" />{f.drill}</span>
              {f.example && (
                <button type="button" onClick={() => onSee(f.example!, f.key)} className="ml-auto text-2xs font-semibold text-primary hover:underline">
                  See rep {f.example} →
                </button>
              )}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/[0.06] p-2">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-3xs font-bold uppercase tracking-wider text-muted-foreground">
              Next session
              <InfoTip text={next.hold
                ? `Hold the load: the last set lost ${STATS.velLoss}% speed and form broke down. Stop a set when the bar is ${TARGET.velLoss}% slower than its first rep. Add 2.5 kg once every set stays under that.`
                : "Every set stayed under the velocity-loss cut-off with clean reps, so add 2.5 kg."} />
            </p>
            <p className="truncate whitespace-nowrap font-mono text-md font-bold text-foreground">{next.load} kg <span className="text-2xs font-semibold text-muted-foreground">· {SESSION.plannedSets} × {SESSION.plannedReps}</span></p>
          </div>
          <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-3xs font-bold uppercase", next.hold ? "bg-warning/15 text-warning" : "bg-success/15 text-success")}>{next.hold ? "Hold" : "+2.5 kg"}</span>
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-2xs text-foreground">Stop &lt; {next.stopVel} m/s</span>
        </div>
        <p className="flex items-center gap-1.5 text-2xs text-muted-foreground">
          <CircleCheck className="size-3.5 shrink-0 text-success" />
          <span><strong className="text-foreground">Working well:</strong> {strongest.map((f) => f.label.toLowerCase()).join(", ")}</span>
        </p>
      </div>
    </Panel>
  );
}

/* ── Full report ─────────────────────────────────────────────────────── */

function FullReport({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-foreground">Full report</h2>
      <CompareSection />
      <RepTable selected={selected} onSelect={onSelect} />
      <ProgressSection />
    </div>
  );
}

/* First rep vs last rep (or any two), stopped at the same moment: fatigue at a glance. */
function CompareSection() {
  const [a, setA] = React.useState(REPS[0].id);
  const [b, setB] = React.useState(REPS[REPS.length - 1].id);
  const [phase, setPhase] = React.useState<Phase>("bottom");
  const [overlay, setOverlay] = React.useState(false);
  const A = repById(a);
  const B = repById(b);
  const repSelect = (value: string, onChange: (id: string) => void, label: string, tone: string) => (
    <div className="flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", tone)} />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-40 text-xs" aria-label={label}><SelectValue /></SelectTrigger>
        <SelectContent>
          {REPS.map((r) => (
            <SelectItem key={r.id} value={r.id} className="text-xs">
              {repLabel(r)} · {repScore(r)}{r.id === REPS[0].id ? " · first" : r.id === REPS[REPS.length - 1].id ? " · last" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
  type Row = { label: string; a: number; b: number; unit: string; target?: string; bad?: (v: number) => boolean; digits?: number };
  const rows: Row[] = [
    { label: "Rep score", a: repScore(A), b: repScore(B), unit: "", digits: 0 },
    { label: "Depth", a: A.depth, b: B.depth, unit: " cm", target: "≥ 0", bad: (v) => v < TARGET.depth },
    { label: "Torso lean", a: A.lean, b: B.lean, unit: "°", target: `≤ ${TARGET.lean}`, bad: (v) => v > TARGET.lean, digits: 0 },
    { label: "Hips first", a: A.hipRise, b: B.hipRise, unit: "°", target: `≤ ${TARGET.hipRise}`, bad: (v) => v > TARGET.hipRise, digits: 0 },
    { label: "Bar drift", a: A.drift, b: B.drift, unit: " cm", target: `≤ ${TARGET.drift}`, bad: (v) => v > TARGET.drift },
    { label: "Back flexion", a: A.backRound, b: B.backRound, unit: "°", target: `≤ ${TARGET.backRound}`, bad: (v) => v > TARGET.backRound, digits: 0 },
    { label: "Descent", a: A.ecc, b: B.ecc, unit: " s", target: TARGET.ecc.join("–"), bad: (v) => v < TARGET.ecc[0] || v > TARGET.ecc[1] },
    { label: "Ascent", a: A.con, b: B.con, unit: " s", digits: 2 },
    { label: "Mean speed", a: A.meanVel, b: B.meanVel, unit: " m/s", digits: 2 },
    { label: "Peak speed", a: peakVelOf(A), b: peakVelOf(B), unit: " m/s", digits: 2 },
    { label: "Lockout", a: A.lockout, b: B.lockout, unit: "°", target: `≥ ${TARGET.lockout}`, bad: (v) => v < TARGET.lockout, digits: 0 },
    { label: "Heel lift", a: A.heelLift, b: B.heelLift, unit: " cm", target: `≤ ${TARGET.heelLift}`, bad: (v) => v > TARGET.heelLift },
  ];
  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <h3 className="text-sm font-bold text-foreground">First rep vs last rep</h3>
        <InfoTip text="Fatigue shows as the workout goes on: compare the first rep with the last at the same moment, or pick any two reps." />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {repSelect(a, setA, "Rep A", "bg-success")}
          {repSelect(b, setB, "Rep B", "bg-info")}
          <label className="flex items-center gap-1.5 text-2xs text-muted-foreground">
            <Switch checked={overlay} onCheckedChange={setOverlay} aria-label="Overlay rep B on rep A" />
            Overlay
          </label>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-12">
        <div className="flex flex-col gap-2 lg:col-span-8">
          <PanelTabs value={phase} onChange={setPhase} tabs={PHASES.map((p) => [p.key, p.label])} />
          {overlay ? (
            <figure className="overflow-hidden rounded-lg border border-border">
              <div className="aspect-video"><RepFrame rep={A} phase={phase} ghost={B} showPath={false} /></div>
              <figcaption className="flex gap-3 border-t border-border px-2 py-1 text-2xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-success" />{repLabel(A)} (pose)</span>
                <span className="flex items-center gap-1"><span className="h-0.5 w-3 border-t-2 border-dashed border-info" />{repLabel(B)} (dashed)</span>
              </figcaption>
            </figure>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[A, B].map((r, i) => (
                <figure key={i} className="overflow-hidden rounded-lg border border-border">
                  <div className="aspect-video"><RepFrame rep={r} phase={phase} hud={false} /></div>
                  <figcaption className="flex items-center gap-1.5 border-t border-border px-2 py-1 text-2xs">
                    <span className={cn("size-2 rounded-full", i === 0 ? "bg-success" : "bg-info")} />
                    <span className="font-semibold text-foreground">{repLabel(r)}</span>
                    <span className="truncate text-muted-foreground">{repScore(r)}/100 · {r.meanVel.toFixed(2)} m/s · {findingsFor(r).length || "no"} faults</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
        <div className="lg:col-span-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border text-left text-3xs font-semibold uppercase text-muted-foreground">
                <th className="py-1.5 pr-2">Measure</th>
                <th className="py-1.5 pr-2 text-right">{A.id}</th>
                <th className="py-1.5 pr-2 text-right">{B.id}</th>
                <th className="py-1.5 pr-2 text-right">B − A</th>
                <th className="py-1.5 text-right">Target</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const dg = r.digits ?? 1;
                const d = +(r.b - r.a).toFixed(dg);
                return (
                  <tr key={r.label} className="border-b border-border/60 font-mono text-2xs last:border-0">
                    <td className="py-1 pr-2 font-sans text-xs text-foreground">{r.label}</td>
                    <td className={cn("py-1 pr-2 text-right", r.bad?.(r.a) ? "text-sev-critical" : "text-foreground")}>{r.a.toFixed(dg)}{r.unit}</td>
                    <td className={cn("py-1 pr-2 text-right", r.bad?.(r.b) ? "text-sev-critical" : "text-foreground")}>{r.b.toFixed(dg)}{r.unit}</td>
                    <td className="py-1 pr-2 text-right text-muted-foreground">{d === 0 ? "—" : signed(d, dg)}</td>
                    <td className="py-1 text-right text-muted-foreground">{r.target ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-1.5 text-3xs text-muted-foreground">Red: outside the coach's target.</p>
        </div>
      </div>
    </section>
  );
}

/* Every rep of the workout in one table, grouped by set. */
function RepTable({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const cols: [string, string][] = [
    ["Set", "Set"], ["Rep", "Rep in the set"], ["Score", "Rep score"], ["Depth", "Hip crease vs knee, cm (+ below)"], ["Lean", "Torso lean at the bottom, °"],
    ["Hips", "Extra lean off the bottom (hips first), °"], ["Drift", "Bar drift off mid-foot, cm"], ["Speed", "Mean bar speed up, m/s"], ["Loss", "Slower than the set's first rep, %"],
    ["Down", "Descent, s"], ["Up", "Ascent, s"], ["Lockout", "Hip angle at the top, °"], ["Knee", "Knee tracking — needs front camera"], ["Faults", "AI findings"],
  ];
  const cell = "px-2 py-1.5 font-mono text-2xs whitespace-nowrap";
  const red = (bad: boolean) => (bad ? "text-sev-critical" : "text-muted-foreground");
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <h3 className="text-sm font-bold text-foreground">Every rep</h3>
        <span className="text-2xs text-muted-foreground">{REPS.length} reps · click to review</span>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              {cols.map(([h, full]) => <th key={h} title={full} className="px-2 py-1.5 text-left text-3xs font-semibold uppercase text-muted-foreground">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {REPS.map((r) => {
              const sc = repScore(r);
              const faults = findingsFor(r);
              const loss = repLoss(r);
              return (
                <tr key={r.id} tabIndex={0} onClick={() => onSelect(r.id)} onKeyDown={(e) => e.key === "Enter" && onSelect(r.id)}
                  className={cn("cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/50", r.rep === 1 && r.set > 1 && "border-t-2 border-t-border", r.id === selected && "bg-muted")}>
                  <td className={cn(cell, "font-semibold", r.rep === 1 ? "text-foreground" : "text-transparent")}>{r.set}</td>
                  <td className={cn(cell, "text-foreground")}>{r.rep}</td>
                  <td className={cn(cell, "font-semibold", TONE_TEXT[repTone(r)])}>{sc}</td>
                  <td className={cn(cell, red(r.depth < TARGET.depth))}>{signed(r.depth)}</td>
                  <td className={cn(cell, red(r.lean > TARGET.lean))}>{r.lean}</td>
                  <td className={cn(cell, red(r.hipRise > TARGET.hipRise))}>{r.hipRise}</td>
                  <td className={cn(cell, red(r.drift > TARGET.drift))}>{r.drift.toFixed(1)}</td>
                  <td className={cn(cell, "text-foreground")}>{r.meanVel.toFixed(2)}</td>
                  <td className={cn(cell, red(loss > TARGET.velLoss))}>{loss ? `−${loss}` : "—"}</td>
                  <td className={cn(cell, red(r.ecc < TARGET.ecc[0]))}>{r.ecc.toFixed(1)}</td>
                  <td className={cn(cell, "text-muted-foreground")}>{r.con.toFixed(2)}</td>
                  <td className={cn(cell, red(r.lockout < TARGET.lockout))}>{r.lockout}</td>
                  <td className={cn(cell, "text-muted-foreground/60")} title="Needs front camera">{r.knee ?? "n/a"}</td>
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

/* Est. 1RM and volume across the lifter's back-squat sessions, personal bests, and the coach's notes. */
function ProgressSection() {
  const [note, setNote] = React.useState("Strong first three sets at 100 kg. Set 4 fell apart from rep 4: hips shot up and the chest dropped. Stay at 100 kg next week and stop a set once the bar slows past 0.42 m/s.");
  const first = HISTORY[0];
  const small: { key: "avgVel" | "velLoss" | "goodPct"; title: string; unit: string; band?: [number, number]; lowerIsBetter?: boolean; digits?: number; pad: number }[] = [
    { key: "avgVel", title: "Avg bar speed", unit: " m/s", digits: 2, pad: 0.02 },
    { key: "velLoss", title: "Velocity loss", unit: "%", band: [0, TARGET.velLoss], lowerIsBetter: true, digits: 0, pad: 2 },
    { key: "goodPct", title: "Good reps", unit: "%", digits: 0, pad: 2 },
  ];
  return (
    <section className="grid grid-cols-1 gap-3 lg:grid-cols-12">
      <div className="flex flex-col rounded-xl border border-border bg-card p-3 lg:col-span-5">
        <div className="mb-2 flex flex-wrap items-baseline gap-2">
          <h3 className="text-sm font-bold text-foreground">Progress</h3>
          <span className="text-2xs text-muted-foreground">Back squat · est. 1RM and volume</span>
          <span className="ml-auto flex items-center gap-2 text-3xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-0.5 w-3 rounded-full bg-primary" />Est. 1RM</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-muted-foreground/40" />Volume</span>
          </span>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={HISTORY} margin={{ top: 8, right: -8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
              <XAxis dataKey="date" {...AXIS} fontSize={10} />
              <YAxis yAxisId="rm" domain={[100, 125]} ticks={[100, 110, 120]} {...AXIS} fontSize={10} />
              <YAxis yAxisId="vol" orientation="right" domain={[0, 2400]} hide />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                formatter={(v, n) => (n === "volume" ? [`${Number(v).toLocaleString()} kg`, "Volume"] : [`${v} kg`, "Est. 1RM"])} />
              <Bar yAxisId="vol" dataKey="volume" fill="var(--muted-foreground)" fillOpacity={0.25} radius={[3, 3, 0, 0]} barSize={22} isAnimationActive={false} />
              <Line yAxisId="rm" type="monotone" dataKey="e1rm" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3, fill: "var(--primary)" }} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <ul className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {PERSONAL_BESTS.map((p) => (
            <li key={p.label} className={cn("min-w-0 rounded-lg border px-2 py-1", p.isNew ? "border-warning/30 bg-warning/[0.06]" : "border-border bg-background")}>
              <p className="flex items-center gap-1 truncate text-3xs font-semibold uppercase text-muted-foreground">
                {p.isNew && <Trophy className="size-3 shrink-0 text-warning" />}{p.label}
              </p>
              <p className="truncate font-mono text-xs font-bold text-foreground">{p.value}</p>
              <p className="truncate text-3xs text-muted-foreground">{p.isNew ? `PB · was ${p.was}` : p.was}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-4 lg:grid-cols-1">
        {small.map((m) => {
          const a = first[m.key];
          const z = HISTORY[HISTORY.length - 1][m.key];
          const better = m.lowerIsBetter ? z < a : z > a;
          return (
            <div key={m.key} className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
              <div className="w-28 shrink-0">
                <p className="truncate text-3xs font-semibold uppercase text-muted-foreground">{m.title}</p>
                <p className="font-mono text-md font-bold text-foreground">{z.toFixed(m.digits)}{m.unit}</p>
                <p className={cn("truncate text-3xs", better ? "text-success" : "text-sev-critical")}>{signed(z - a, m.digits)}{m.unit} since {first.date}</p>
              </div>
              <div className="h-12 min-w-0 flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={HISTORY} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                    {m.band && <ReferenceArea y1={m.band[0]} y2={m.band[1]} fill="var(--success)" fillOpacity={0.1} strokeOpacity={0} />}
                    <YAxis hide domain={[(v: number) => v - m.pad, (v: number) => v + m.pad]} />
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
          <span className="text-3xs text-muted-foreground">Shown on the lifter's report</span>
          <Button size="sm" className="ml-auto" onClick={() => toast.success("Notes saved")}>Save notes</Button>
        </div>
      </div>
    </section>
  );
}
