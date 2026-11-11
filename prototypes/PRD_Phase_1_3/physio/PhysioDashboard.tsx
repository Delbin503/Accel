import * as React from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  Area, CartesianGrid, ComposedChart, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, Cell,
} from "recharts";
import {
  Check, ChevronLeft, ChevronRight, CircleCheck, CircleX, FileDown, Info, Lock, Pause, Play, Share2, ShieldCheck, Sparkles, TrendingDown, TrendingUp, Undo2, Unplug, X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useDeviceMode, type DeviceMode } from "../assessment/deviceState";
import { DeviceOfflineBanner, DevicePreviewSwitch, DeviceStatusValue, NeedsDevice } from "../assessment/deviceMode";
import {
  BASELINE, EXERCISES, EXPECTED_BAND, EX_ORDER, FAULTS, HEALTHY, HOME_PROGRAMME, KEY_MOMENT, LIMIT, MEASURES, MOMENTS, PATIENT,
  PLAN_CHANGES, PLATE, PLATE_OFFLINE_AT, PREVIOUS, PROGRESS, REPS, REVIEW_BELOW, TIMELINE_WEEKS, TODAY, VISIT, VISITS,
  checksFor, dischargeFor, failedChecks, findingsFor, fmtClock, gaitSteps, goalWeek, hasLoad, loadSpan, lrFor, lrOfVisit, measuresFor, methodNote, momentTime,
  progressOf, repById, repName, repSeries, repsOf, scoredChecks, suggestedPlan,
  type FaultKey, type Finding, type MeasureKey, type Moment, type Plan, type Rep, type View,
} from "./physioSession";
import { RangeGauge, RoomFrame } from "./physioParts";

/* Rehab Analysis — one patient's visit, laid out like the golf Swing
   Assessment: the overview fits a laptop screen (summary, movement video with
   the 3D pose, range of motion, the picked rep's review, signals, measures vs
   goal and the clinician's programme decision), and the full report follows
   below it (recovery curve, pain, every rep, discharge criteria, notes and
   sign-off).

   One rep is "picked" at a time and every panel follows it. The patient is
   only ever compared with their own baseline and goal: no grades, no ranks.

   The force plate (?device=none | offline) only measures left–right load on
   sit-to-stand. Without it, those load checks are greyed and left out of the
   rep's count, and left–right falls back to what's left: step length on the
   walk, plus any sit-to-stands before the plate dropped out. */

const TOOLTIP_STYLE = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 };
const AXIS = { stroke: "var(--muted-foreground)", fontSize: 9, tickLine: false, axisLine: false } as const;

type Review = "confirmed" | "dismissed";
type Reviews = Record<string, Review>;
type Status = Review | "auto" | undefined;
const reviewKey = (id: string, k: FaultKey) => `${id}:${k}`;
const statusOf = (reviews: Reviews, r: Rep, f: Finding): Status => reviews[reviewKey(r.id, f.key)] ?? (f.conf >= REVIEW_BELOW ? "auto" : undefined);
const openFindings = (reviews: Reviews) => REPS.flatMap((r) => findingsFor(r).filter((f) => !statusOf(reviews, r, f)).map((f) => ({ rep: r, f })));

const repTone = (r: Rep, device: DeviceMode) => {
  const n = failedChecks(r, device);
  return n === 0 ? "success" : n === 1 ? "warning" : "sev-critical";
};
const TONE_TEXT = { success: "text-success", warning: "text-warning", "sev-critical": "text-sev-critical" } as const;
const TONE_DOT = { success: "bg-success", warning: "bg-warning", "sev-critical": "bg-sev-critical" } as const;

const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
const SIGNED_AT = "11 Nov · 10:48";

/* ── Page ────────────────────────────────────────────────────────────── */

export function PhysioDashboard() {
  const { search } = useLocation();
  const name = new URLSearchParams(search).get("person")?.trim() || PATIENT.name;
  const [device, setDevice] = useDeviceMode();

  const [selected, setSelected] = React.useState(TODAY.bestRom);
  const [view, setView] = React.useState<View>("side");
  const [moment, setMoment] = React.useState<Moment>(KEY_MOMENT.rom);
  const [reviews, setReviews] = React.useState<Reviews>({});
  const [plan, setPlan] = React.useState<Plan>(() => suggestedPlan().plan);
  const [approved, setApproved] = React.useState(false);
  const [signed, setSigned] = React.useState(false);
  const rep = repById(selected);
  const open = openFindings(reviews);

  /* Picking a rep opens it on its own camera, at the moment its main measure is read. */
  function pick(id: string, opts?: { view?: View; scroll?: boolean }) {
    const r = repById(id);
    setSelected(id);
    setView(opts?.view ?? EXERCISES[r.ex].camera);
    setMoment(KEY_MOMENT[r.ex]);
    if (opts?.scroll) window.requestAnimationFrame(() => document.getElementById("physio-video")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }
  function review(k: string, r: Review | null) {
    setSigned(false);
    setReviews((m) => {
      const next = { ...m };
      if (r) next[k] = r;
      else delete next[k];
      return next;
    });
  }

  const share = () => toast.success(`Shared with ${name}`, { description: `Visit report · week ${PATIENT.week} · ${VISIT.short}` });
  const exportPdf = () =>
    signed
      ? toast.success("Report exported", { description: `Visit_${PATIENT.id}_wk${PATIENT.week}.pdf` })
      : toast("Draft exported", { description: "Marked DRAFT until a clinician signs off." });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 lg:h-[calc(100svh-6rem)] lg:min-h-[720px]">
        <PageHeader>
          <PageHeader.Content className="flex-row items-center gap-3">
            <PageHeader.Title>Rehab Analysis</PageHeader.Title>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5 text-2xs font-semibold text-muted-foreground">
              <span className={cn("size-1.5 rounded-full", signed ? "bg-success" : "bg-warning")} />
              {signed ? "Signed off" : "Awaiting sign-off"}
            </span>
          </PageHeader.Content>
          <PageHeader.Actions>
            <DevicePreviewSwitch device={PLATE} mode={device} onChange={setDevice} />
            <UiTooltip>
              <TooltipTrigger asChild>
                <span tabIndex={signed ? -1 : 0}>
                  <Button variant="outline" size="sm" disabled={!signed} onClick={share}>
                    {signed ? <Share2 className="size-4" /> : <Lock className="size-4" />}
                    Share with patient
                  </Button>
                </span>
              </TooltipTrigger>
              {!signed && <TooltipContent className="max-w-56 text-xs">A clinician signs off the report before it can be shared. Sign-off is at the end of the full report.</TooltipContent>}
            </UiTooltip>
            <Button size="sm" onClick={exportPdf}>
              <FileDown className="size-4" />
              Export PDF
            </Button>
          </PageHeader.Actions>
        </PageHeader>

        <dl className="-mt-1 flex shrink-0 flex-wrap items-baseline gap-x-5 gap-y-0.5">
          {([
            ["Clinic / room", `${VISIT.clinic} · ${VISIT.room}`], ["Clinician", VISIT.clinician], ["Date", VISIT.date], ["Cameras", VISIT.cameras],
            ["Device", <DeviceStatusValue mode={device} connected={VISIT.device} offlineFrom={PLATE_OFFLINE_AT} />], ["Privacy", "Faces blurred"],
          ] as [string, React.ReactNode][]).map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-1.5">
              <dt className="text-3xs font-semibold uppercase text-muted-foreground">{k}</dt>
              <dd className="text-2xs font-semibold text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
        {device === "offline" && (
          <DeviceOfflineBanner>
            Force plate went offline at <span className="font-mono font-semibold">{PLATE_OFFLINE_AT}</span> — no left–right load for sit-to-stand {loadSpan(device).without}.
          </DeviceOfflineBanner>
        )}

        <SummaryStrip name={name} open={open.length} device={device} />

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-12 lg:grid-rows-[minmax(300px,1.15fr)_minmax(260px,1fr)]">
          <VideoPanel className="lg:col-span-5" rep={rep} view={view} moment={moment} device={device} onView={setView} onMoment={setMoment} onSelect={(id) => pick(id)} />
          <ReviewPanel className="lg:col-span-4" rep={rep} reviews={reviews} device={device} onReview={review} onSelect={(id) => pick(id)} />
          <RangePanel className="lg:col-span-3" rep={rep} />
          <SignalsPanel className="lg:col-span-5" rep={rep} moment={moment} device={device} onSelect={(id) => pick(id)} />
          <MeasuresPanel className="lg:col-span-3" device={device} />
          <ClinicianPanel className="lg:col-span-4" plan={plan} approved={approved}
            onPlan={(p) => { setPlan(p); setApproved(false); setSigned(false); }}
            onApprove={(v) => { setApproved(v); if (!v) setSigned(false); }} />
        </div>
      </div>

      <FullReport name={name} device={device} selected={selected} onSelect={(id) => pick(id, { scroll: true })} open={open} approved={approved} plan={plan}
        signed={signed} onSign={setSigned} onShare={share} />
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

function PanelTabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: [T, string, boolean?][] }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as T)}>
      {/* The shared TabsList sets h-9 through a group-data variant, so match it to shrink. */}
      <TabsList className="group-data-[orientation=horizontal]/tabs:h-7">
        {tabs.map(([v, label, disabled]) => (
          <TabsTrigger key={v} value={v} disabled={disabled} className="px-2 text-2xs">{label}</TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <UiTooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={text} className="inline-flex shrink-0 text-muted-foreground/70 transition-colors hover:text-foreground">
          <Info className="size-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64 text-xs leading-snug">{text}</TooltipContent>
    </UiTooltip>
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
      {d > 0 ? "+" : "−"}{Math.abs(d).toFixed(digits)}{unit} vs {PREVIOUS.date}
    </span>
  );
}

/** Progress from baseline to goal as a ring: never a grade. */
function ProgressRing({ value, size = 36 }: { value: number; size?: number }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 36 36" className="shrink-0 -rotate-90" width={size} height={size} aria-hidden>
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--muted)" strokeWidth="4" />
      <circle cx="18" cy="18" r={r} fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} />
    </svg>
  );
}

function Swatch({ c, dashed }: { c: string; dashed?: boolean }) {
  return <span className={cn("mr-1 ml-2.5 inline-block w-2.5 align-middle first:ml-0", dashed ? "h-0 border-t-2 border-dashed" : "h-1.5 rounded-sm", c)} />;
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

/* ── Summary strip ───────────────────────────────────────────────────── */

function SummaryStrip({ name, open, device }: { name: string; open: number; device: DeviceMode }) {
  const lr = lrFor(device);
  const kpis: { label: string; value: React.ReactNode; tone?: string; info: string; delta: React.ReactNode }[] = [
    {
      label: "Straighten", value: `${TODAY.lag}° short`, tone: TODAY.lag <= LIMIT.lag ? "text-success" : "text-warning",
      info: `Extension lag: how far short of fully straight the knee stops, averaged over today's knee-bend reps. Goal: within ${LIMIT.lag}°. Week 1: ${BASELINE.lag}°.`,
      delta: <Delta now={TODAY.lag} before={PREVIOUS.lag} lowerIsBetter unit="°" />,
    },
    {
      label: "Left–right",
      value: lr.tag ? <>{lr.now}%<span className="ml-1 text-3xs font-semibold text-muted-foreground">{lr.tag}</span></> : `${lr.now}%`,
      tone: lr.now <= LIMIT.lr ? "text-success" : "text-warning",
      info: `How unevenly the legs share the work, from ${lr.source}. Goal ${LIMIT.lr}% or less. Week 1: ${lr.baseline}%.`,
      delta: <Delta now={lr.now} before={lr.last} lowerIsBetter unit="%" />,
    },
    {
      label: "Pain", value: <>{TODAY.painBefore} → {TODAY.painAfter}<span className="text-xs text-muted-foreground"> /10</span></>, tone: "text-foreground",
      info: "Pain the patient reported before and after today's exercises, 0 (none) to 10 (worst).",
      delta: <Delta now={TODAY.painAfter} before={PREVIOUS.painAfter} lowerIsBetter />,
    },
    {
      label: "Adherence", value: `${TODAY.adherence}%`, tone: TODAY.adherence >= LIMIT.adherence ? "text-success" : "text-warning",
      info: "Home exercises done this week out of those planned, logged in the patient app.",
      delta: <Delta now={TODAY.adherence} before={PREVIOUS.adherence!} unit="%" />,
    },
    {
      label: "To review", value: String(open), tone: open ? "text-warning" : "text-success",
      info: `AI findings under ${REVIEW_BELOW}% confidence wait for the physio to confirm or dismiss. Findings at ${REVIEW_BELOW}% or more are kept unless dismissed.`,
      delta: <span className="text-muted-foreground">{open ? "Under 80% sure" : "All reviewed"}</span>,
    },
  ];
  return (
    <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1.5fr)_minmax(0,1.6fr)_repeat(5,minmax(0,0.95fr))]">
      <div className="col-span-2 flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2 lg:col-span-1">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-2xs font-bold text-primary">{initialsOf(name)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-foreground">{name}</p>
          <p className="truncate text-2xs text-muted-foreground">{PATIENT.side} knee · wk {PATIENT.week}</p>
        </div>
      </div>
      <div className="col-span-2 flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2 lg:col-span-1">
        <div className="relative grid place-items-center">
          <ProgressRing value={PROGRESS.now} />
          <span className="absolute font-mono text-3xs font-bold text-foreground">{PROGRESS.now}</span>
        </div>
        <div className="min-w-0 leading-tight">
          <p className="flex items-center gap-1 text-3xs font-semibold uppercase text-muted-foreground">
            <span className="truncate">Progress</span>
            <InfoTip text={`How far knee bend has come from week 1 (${BASELINE.flex}°) to the patient's goal (${LIMIT.goalFlex}°). Measured against their own baseline only, never against other patients.`} />
          </p>
          <p className="font-mono text-sm font-bold text-foreground">{PROGRESS.now}%</p>
          <p className="truncate text-3xs"><Delta now={PROGRESS.now} before={PROGRESS.last} unit="%" /></p>
        </div>
      </div>
      <div className="col-span-2 min-w-0 rounded-xl border border-border bg-card px-2.5 py-2 sm:col-span-2 lg:col-span-1">
        <p className="flex items-center gap-1 text-3xs font-semibold uppercase text-muted-foreground">
          <span className="truncate">Knee bend</span>
          <InfoTip text={`Most the right knee bent today (best of ${repsOf("rom").length} reps), against week 1 and the patient's goal. The left knee bends to ${HEALTHY.flex}°.`} />
        </p>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="text-lg font-bold leading-tight text-primary">{TODAY.flex}°</span>
          <span className="truncate text-3xs text-muted-foreground">wk 1 {BASELINE.flex}° · goal {LIMIT.goalFlex}°</span>
        </div>
        <p className="truncate text-3xs"><Delta now={TODAY.flex} before={PREVIOUS.flex} unit="°" /></p>
      </div>
      {kpis.map((k) => (
        <div key={k.label} className="min-w-0 rounded-xl border border-border bg-card px-2.5 py-2">
          <p className="flex items-center gap-1 text-3xs font-semibold uppercase text-muted-foreground">
            <span className="truncate">{k.label}</span>
            <InfoTip text={k.info} />
          </p>
          <p className={cn("mt-0.5 truncate text-lg font-bold leading-tight", k.tone ?? "text-foreground")}>{k.value}</p>
          <p className="truncate text-3xs">{k.delta}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Movement video ──────────────────────────────────────────────────── */

const MOMENT_ORDER: Moment[] = [0, 1, 2, 3];

function VideoPanel({ className, rep, view, moment, device, onView, onMoment, onSelect }: {
  className?: string; rep: Rep; view: View; moment: Moment; device: DeviceMode; onView: (v: View) => void; onMoment: (m: Moment) => void; onSelect: (id: string) => void;
}) {
  const [showPose, setShowPose] = React.useState(true);
  const [playing, setPlaying] = React.useState(false);
  const shown: View = rep.ex === "gait" ? "walk" : view === "walk" ? EXERCISES[rep.ex].camera : view;

  /* Play steps through the four moments of the rep, then stops. */
  const running = playing && moment !== 3;
  React.useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => onMoment((moment + 1) as Moment), 700);
    return () => window.clearTimeout(id);
  }, [running, moment, onMoment]);

  const step = (d: number) => onMoment(Math.max(0, Math.min(3, moment + d)) as Moment);
  const pct = (sec: number) => `${(sec / VISIT.lengthSec) * 100}%`;
  const room = rep.ex !== "gait";

  return (
    <Panel
      id="physio-video"
      className={className}
      title="Movement Video"
      meta={`${repName(rep)} · ${MOMENTS[rep.ex][moment]}`}
      bodyClassName="p-0"
      action={
        <div className="flex items-center gap-1">
          <label className="mr-1 flex items-center gap-1 text-2xs text-muted-foreground">
            <Switch checked={showPose} onCheckedChange={setShowPose} className="scale-75" aria-label="Show pose" />
            Pose
          </label>
          <PanelTabs value={shown} onChange={onView} tabs={[["front", "Front", !room], ["side", "Side", !room], ["walk", "Walkway", room]]} />
        </div>
      }
    >
      <div className="relative min-h-0 flex-1 overflow-hidden bg-camera-feed max-lg:aspect-video">
        <RoomFrame rep={rep} view={shown} moment={moment} showPose={showPose} noLoad={!hasLoad(rep, device)} className="absolute inset-0" />
      </div>
      {/* Moments of the picked rep */}
      <div className="flex h-8 shrink-0 items-center gap-1 border-t border-border px-2">
        <button type="button" aria-label={running ? "Pause" : "Play through the rep"}
          onClick={() => {
            if (running) return setPlaying(false);
            if (moment === 3) onMoment(0);
            setPlaying(true);
          }}
          className="grid size-6 shrink-0 place-items-center rounded text-foreground hover:bg-muted">
          {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        </button>
        <button type="button" aria-label="Previous moment" onClick={() => step(-1)} className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronLeft className="size-3.5" /></button>
        <div role="tablist" aria-label="Moments" className="flex min-w-0 flex-1 gap-1">
          {MOMENT_ORDER.map((m) => (
            <button key={m} type="button" role="tab" aria-selected={m === moment} onClick={() => { setPlaying(false); onMoment(m); }}
              className={cn("min-w-0 flex-1 truncate rounded px-1 py-0.5 text-2xs font-semibold transition-colors duration-[var(--duration-fast)]",
                m === moment ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              {MOMENTS[rep.ex][m]}
            </button>
          ))}
        </div>
        <button type="button" aria-label="Next moment" onClick={() => step(1)} className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronRight className="size-3.5" /></button>
      </div>
      {/* Visit timeline: every rep, grouped by exercise */}
      <div className="flex h-10 shrink-0 items-center gap-2 border-t border-border px-2">
        <span className="w-8 shrink-0 font-mono text-2xs text-muted-foreground">{fmtClock(rep.at)}</span>
        <div className="relative h-7 flex-1">
          {EX_ORDER.map((ex) => {
            const rs = repsOf(ex);
            const from = rs[0].at - 25;
            const to = rs[rs.length - 1].at + 25;
            return (
              <div key={ex} className={cn("absolute inset-y-0 rounded-md", ex === rep.ex ? "bg-primary/10" : "bg-muted/60")} style={{ left: pct(from), width: pct(to - from) }}>
                <span className={cn("absolute left-1 top-0 truncate text-3xs font-semibold", ex === rep.ex ? "text-primary" : "text-muted-foreground")}>{EXERCISES[ex].short}</span>
              </div>
            );
          })}
          {REPS.map((r) => (
            <button key={r.id} type="button" onClick={() => onSelect(r.id)} aria-label={`${repName(r)} at ${fmtClock(r.at)}`} title={`${repName(r)} · ${fmtClock(r.at)} · ${r.flex}°`}
              className={cn("absolute bottom-1 size-2 -translate-x-1/2 rounded-full ring-1 ring-card transition-transform hover:scale-150", r.id === rep.id ? "scale-125 bg-foreground" : TONE_DOT[repTone(r, device)])}
              style={{ left: pct(r.at) }} />
          ))}
        </div>
        <span className="w-8 shrink-0 text-right font-mono text-2xs text-muted-foreground">{fmtClock(VISIT.lengthSec)}</span>
      </div>
    </Panel>
  );
}

/* ── Rep review ──────────────────────────────────────────────────────── */

function RepPicker({ rep, device, onSelect }: { rep: Rep; device: DeviceMode; onSelect: (id: string) => void }) {
  /* One scrolling row: each movement type is labelled, followed by its reps.
     The picked rep is kept in view when it is chosen from elsewhere (timeline, video). */
  const activeRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [rep.id]);
  return (
    <div role="tablist" aria-label="Reps" className="mb-2 flex shrink-0 items-stretch gap-1 overflow-x-auto pb-1">
      {EX_ORDER.map((ex, i) => (
        <React.Fragment key={ex}>
          {i > 0 && <span aria-hidden className="mx-1 w-px shrink-0 self-stretch bg-border" />}
          <span className={cn("flex shrink-0 items-center pr-0.5 text-3xs font-semibold uppercase tracking-wider", ex === rep.ex ? "text-primary" : "text-muted-foreground")}>
            {EXERCISES[ex].short}
          </span>
          {repsOf(ex).map((r) => {
            const active = r.id === rep.id;
            const scored = scoredChecks(r, device).length;
            return (
              <button key={r.id} ref={active ? activeRef : undefined} type="button" role="tab" aria-selected={active} onClick={() => onSelect(r.id)}
                title={`${repName(r)} · ${r.flex}° · ${scored - failedChecks(r, device)}/${scored} checks${hasLoad(r, device) ? "" : " · no force-plate load"}`}
                className={cn("flex h-8 w-9 shrink-0 items-center justify-center gap-1 rounded-md border text-xs font-bold text-foreground transition-colors duration-[var(--duration-fast)]",
                  active ? "border-primary bg-primary/10 shadow-[inset_0_0_0_1px_var(--primary)]" : "border-border bg-background hover:border-primary/40")}>
                {r.n}
                <span className={cn("size-1.5 rounded-full", TONE_DOT[repTone(r, device)])} />
              </button>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

function ReviewPanel({ className, rep, reviews, device, onReview, onSelect }: {
  className?: string; rep: Rep; reviews: Reviews; device: DeviceMode; onReview: (k: string, r: Review | null) => void; onSelect: (id: string) => void;
}) {
  const checks = checksFor(rep, device);
  const scored = checks.filter((c) => !c.na);
  const met = scored.filter((c) => c.ok).length;
  const findings = findingsFor(rep);
  const best = rep.id === TODAY.bestRom;
  return (
    <Panel className={className} title="Rep Review" meta="Pick a rep" action={<span className="flex items-center gap-1.5 text-3xs text-muted-foreground"><span className="size-1.5 rounded-full bg-success" />all met<span className="size-1.5 rounded-full bg-warning" />1 missed<span className="size-1.5 rounded-full bg-sev-critical" />2+</span>}>
      <RepPicker rep={rep} device={device} onSelect={onSelect} />
      <p className="mb-1 flex shrink-0 items-center gap-2 font-mono text-2xs text-muted-foreground">
        <span className="truncate">{repName(rep)}: <span className="font-semibold text-foreground">{rep.flex}° · {met}/{scored.length} checks met</span></span>
        {best && <span className="ml-auto shrink-0 rounded bg-success/15 px-1.5 py-px font-sans text-3xs font-bold uppercase tracking-wider text-success">Best bend</span>}
      </p>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        <ul className="flex flex-col gap-0.5">
          {checks.map((c) => c.na ? (
            <li key={c.label} className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-0.5" title="Not counted: the force plate gave no load for this rep">
              <Unplug className="size-4 shrink-0 text-muted-foreground" aria-label="No data" />
              <span className="shrink-0 text-xs font-semibold text-muted-foreground">{c.label}</span>
              <NeedsDevice device={PLATE} className="ml-auto truncate text-right text-2xs" />
            </li>
          ) : (
            <li key={c.label} className={cn("flex items-center gap-2 rounded-md px-2 py-0.5", c.ok ? "bg-background" : "bg-sev-critical/[0.07]")}>
              {c.ok ? <CircleCheck className="size-4 shrink-0 text-success" aria-label="Met" /> : <CircleX className="size-4 shrink-0 text-sev-critical" aria-label="Not met" />}
              <span className="shrink-0 text-xs font-semibold text-foreground">{c.label}</span>
              <span className={cn("ml-auto truncate text-right font-mono text-2xs", c.ok ? "text-muted-foreground" : "text-sev-critical")}>{c.note}</span>
            </li>
          ))}
        </ul>
        <div>
          <p className="mb-1 flex items-center gap-1 text-3xs font-bold uppercase tracking-wider text-muted-foreground">
            AI findings · physio review
            <InfoTip text={`The physio confirms or dismisses any finding under ${REVIEW_BELOW}% confidence. Findings at ${REVIEW_BELOW}% or more are kept unless dismissed.`} />
          </p>
          {findings.length === 0 ? (
            <p className="rounded-md bg-background px-2 py-1.5 text-2xs text-muted-foreground">No compensations on this rep.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {findings.map((f) => <FindingRow key={f.key} rep={rep} f={f} status={statusOf(reviews, rep, f)} onReview={onReview} />)}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}

function FindingRow({ rep, f, status, onReview }: { rep: Rep; f: Finding; status: Status; onReview: (k: string, r: Review | null) => void }) {
  const k = reviewKey(rep.id, f.key);
  const label = FAULTS[f.key].label;
  return (
    <li className={cn("flex items-center gap-2 rounded-md border px-2 py-1",
      status === "dismissed" ? "border-border bg-background opacity-60" : status ? "border-success/30 bg-success/[0.06]" : "border-warning/30 bg-warning/[0.06]")}>
      <div className="min-w-0 flex-1">
        <p className={cn("flex items-center gap-1 truncate text-xs font-semibold text-foreground", status === "dismissed" && "line-through")}>
          {label}
          <InfoTip text={`${FAULTS[f.key].what} Cue: “${FAULTS[f.key].cue}”.`} />
        </p>
        <p className="truncate font-mono text-3xs text-muted-foreground">
          {f.detail} · <span className={f.conf >= REVIEW_BELOW ? "text-foreground" : "text-warning"}>{f.conf}% sure</span>
        </p>
      </div>
      {status ? (
        <button type="button" onClick={() => onReview(k, status === "auto" ? "dismissed" : null)} className="flex shrink-0 items-center gap-1 text-3xs font-semibold text-muted-foreground hover:text-foreground"
          title={status === "auto" ? "Dismiss" : "Undo review"}>
          {status === "auto" ? <>Kept · <X className="size-3" /></> : <>{status === "confirmed" ? "Confirmed" : "Dismissed"} · <Undo2 className="size-3" /></>}
        </button>
      ) : (
        <div className="flex shrink-0 gap-1">
          <button type="button" aria-label={`Confirm ${label}`} title="Confirm" onClick={() => onReview(k, "confirmed")}
            className="grid size-6 place-items-center rounded border border-border bg-card text-success hover:bg-success/10"><Check className="size-3.5" /></button>
          <button type="button" aria-label={`Dismiss ${label}`} title="Dismiss" onClick={() => onReview(k, "dismissed")}
            className="grid size-6 place-items-center rounded border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-3.5" /></button>
        </div>
      )}
    </li>
  );
}

/* ── Range of motion ─────────────────────────────────────────────────── */

function RangePanel({ className, rep }: { className?: string; rep: Rep }) {
  const ex = EXERCISES[rep.ex];
  const met = rep.flex >= ex.need;
  const cells: [string, string, boolean?][] = [
    ["Range", `${rep.lag}–${rep.flex}°`],
    [ex.needLabel, `${ex.need}°`, !met],
    ["To goal", `${Math.max(0, LIMIT.goalFlex - rep.flex)}°`],
    ["Left knee", `${rep.ex === "gait" ? HEALTHY.gaitSwing : HEALTHY.flex}°`],
    ["Week 1", `${BASELINE.flex}°`],
    ["Best today", `${TODAY.flex}°`],
  ];
  return (
    <Panel className={className} title="Range of Motion" meta={`${repName(rep)} · right knee`}
      action={<InfoTip text="The arc is the range this rep covered, from straightest to most bent. Green tick: the patient's goal. Grey: week 1. Dashed blue: the healthy left knee. Black tick: what this exercise needs." />}>
      <div className="flex shrink-0 items-baseline gap-2">
        <span className={cn("text-2xl font-bold leading-none", met ? "text-success" : "text-warning")}>{rep.flex}°</span>
        <span className="truncate text-2xs text-muted-foreground">{ex.peak}</span>
      </div>
      <div className="grid min-h-0 flex-1 place-items-center max-lg:aspect-[16/10]">
        <RangeGauge rep={rep} best={TODAY.flex} className="max-h-full" />
      </div>
      <dl className="mt-1 grid shrink-0 grid-cols-3 gap-x-2 gap-y-1">
        {cells.map(([k, v, bad]) => (
          <div key={k} className="min-w-0">
            <dt className="truncate text-3xs font-semibold uppercase text-muted-foreground">{k}</dt>
            <dd className={cn("truncate font-mono text-xs font-semibold", bad ? "text-warning" : "text-foreground")}>{v}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}

/* ── Signals ─────────────────────────────────────────────────────────── */

function SignalsPanel({ className, rep, moment, device, onSelect }: { className?: string; rep: Rep; moment: Moment; device: DeviceMode; onSelect: (id: string) => void }) {
  const series = React.useMemo(() => repSeries(rep), [rep]);
  const reps = repsOf(rep.ex);
  const byRep = reps.map((r) => ({ id: r.id, n: r.n, flex: r.flex }));
  const walk = rep.ex === "gait" ? rep : repsOf("gait")[repsOf("gait").length - 1];
  const steps = React.useMemo(() => gaitSteps(walk), [walk]);
  const now = +momentTime(rep, moment).toFixed(2);
  const need = EXERCISES[rep.ex].need;
  const T = series[series.length - 1].t;
  const tTicks = [0, Math.round(T / 2), Math.floor(T)];
  const kneeDomain: [number, number] = rep.ex === "gait" ? [0, 70] : [0, 140];
  const lo = Math.min(...byRep.map((d) => d.flex), need) - 4;
  const hi = Math.max(...byRep.map((d) => d.flex), need, rep.ex === "rom" ? LIMIT.goalFlex : 0) + 3;
  const yStep = hi - lo > 20 ? 10 : 5;
  const yTicks = Array.from({ length: 8 }, (_, i) => Math.ceil(lo / yStep) * yStep + i * yStep).filter((v) => v <= hi);
  return (
    <Panel className={className} title="Signals" meta={`${repName(rep)} · line: now`} action={<InfoTip text={methodNote(device)} />}
      bodyClassName="grid grid-cols-2 grid-rows-2 gap-2 max-lg:auto-rows-[120px]">
      <MiniChart title="Knee angle" value={`${rep.flex}° · L ${rep.ex === "gait" ? HEALTHY.gaitSwing : rep.ex === "rom" ? HEALTHY.flex : rep.flex}°`}
        legend={<><Swatch c="bg-primary" />Right <Swatch c="border-info" dashed />Left <Swatch c="border-foreground" dashed />Aim {need}°</>}>
        <LineChart data={series} margin={{ top: 4, right: 4, left: -24, bottom: -6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
          <XAxis dataKey="t" type="number" domain={[0, T]} ticks={tTicks} {...AXIS} unit="s" />
          <YAxis domain={kneeDomain} ticks={rep.ex === "gait" ? [0, 30, 60] : [0, 45, 90, 135]} {...AXIS} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `${v} s`} formatter={(v, n) => [`${v}°`, n === "knee" ? "Right knee" : "Left knee"]} />
          <ReferenceLine y={need} stroke="var(--foreground)" strokeDasharray="3 3" strokeOpacity={0.6} />
          {rep.ex === "rom" && <ReferenceLine y={LIMIT.goalFlex} stroke="var(--success)" strokeDasharray="4 3" />}
          <ReferenceLine x={now} stroke="var(--primary)" strokeWidth={2} />
          <Line type="monotone" dataKey="left" stroke="var(--info)" strokeWidth={1.3} strokeDasharray="4 3" dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="knee" stroke="var(--primary)" strokeWidth={1.8} dot={false} isAnimationActive={false} />
        </LineChart>
      </MiniChart>
      <MiniChart title={`${EXERCISES[rep.ex].short} by rep`} value={`${byRep.filter((d) => d.flex >= need).length}/${byRep.length} reached`}
        legend={<><Swatch c="border-foreground" dashed />Aim {need}°{rep.ex === "rom" && <><Swatch c="border-success" dashed />Goal {LIMIT.goalFlex}°</>}</>}>
        <LineChart data={byRep} margin={{ top: 6, right: 8, left: -24, bottom: -6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
          <XAxis dataKey="n" type="number" domain={[0.6, reps.length + 0.4]} ticks={byRep.map((d) => d.n)} {...AXIS} />
          <YAxis domain={[lo, hi]} ticks={yTicks} {...AXIS} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `Rep ${v}`} formatter={(v) => [`${v}°`, EXERCISES[rep.ex].peak]} />
          <ReferenceLine y={need} stroke="var(--foreground)" strokeDasharray="3 3" strokeOpacity={0.6} />
          {rep.ex === "rom" && <ReferenceLine y={LIMIT.goalFlex} stroke="var(--success)" strokeDasharray="4 3" />}
          <Line type="monotone" dataKey="flex" stroke="var(--muted-foreground)" strokeWidth={1.2} isAnimationActive={false}
            dot={(p: { cx?: number; cy?: number; payload?: { id: string; flex: number } }) => {
              const d = p.payload!;
              const active = d.id === rep.id;
              return (
                <circle key={d.id} cx={p.cx} cy={p.cy} r={active ? 5 : 3.5} className="cursor-pointer" onClick={() => onSelect(d.id)}
                  fill={active ? "var(--primary)" : d.flex >= need ? "var(--success)" : "var(--warning)"} stroke={active ? "var(--foreground)" : "var(--card)"} strokeWidth={1.5} />
              );
            }} />
        </LineChart>
      </MiniChart>
      <MiniChart title="Compensations" value={`${rep.hipHike.toFixed(1)} cm · ${rep.trunkLean}°`} bad={rep.hipHike > LIMIT.hipHike || rep.trunkLean > LIMIT.trunkLean}
        legend={<><Swatch c="bg-sev-high" />Hip hike cm <Swatch c="bg-chart-2" />Trunk lean °</>}>
        <LineChart data={series} margin={{ top: 4, right: 4, left: -28, bottom: -6 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
          <XAxis dataKey="t" type="number" domain={[0, T]} ticks={tTicks} {...AXIS} unit="s" />
          <YAxis domain={[0, 12]} ticks={[0, 4, 8, 12]} {...AXIS} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `${v} s`} formatter={(v, n) => (n === "hike" ? [`${v} cm`, "Hip hike"] : [`${v}°`, "Trunk lean"])} />
          <ReferenceLine y={LIMIT.hipHike} stroke="var(--sev-high)" strokeDasharray="3 3" strokeOpacity={0.6} />
          <ReferenceLine y={LIMIT.trunkLean} stroke="var(--chart-2)" strokeDasharray="3 3" strokeOpacity={0.6} />
          <ReferenceLine x={now} stroke="var(--primary)" strokeWidth={2} />
          <Line type="monotone" dataKey="hike" stroke="var(--sev-high)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          <Line type="monotone" dataKey="lean" stroke="var(--chart-2)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </MiniChart>
      <MiniChart title={`Gait · walk ${walk.n}`} value={`${walk.cadence}/min · L–R ${walk.lr}%`} bad={walk.lr > LIMIT.lr || walk.cadence < LIMIT.cadence}
        legend={<><Swatch c="bg-primary" />Right <Swatch c="bg-info" />Left · step cm</>}>
        <BarChart data={steps} margin={{ top: 4, right: 4, left: -28, bottom: -6 }} barCategoryGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
          <XAxis dataKey="i" {...AXIS} interval={3} />
          <YAxis domain={[40, 70]} ticks={[40, 55, 70]} {...AXIS} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--muted)", opacity: 0.4 }} labelFormatter={(v) => `Step ${v}`}
            formatter={(v, _n, p) => [`${v} cm`, (p?.payload as { side?: string } | undefined)?.side === "R" ? "Right step" : "Left step"]} />
          <Bar dataKey="len" isAnimationActive={false} radius={[2, 2, 0, 0]}>
            {steps.map((s) => <Cell key={s.i} fill={s.side === "R" ? "var(--primary)" : "var(--info)"} />)}
          </Bar>
        </BarChart>
      </MiniChart>
    </Panel>
  );
}

/* ── Measures vs goal ────────────────────────────────────────────────── */

function measureFmt(key: MeasureKey, v: number) {
  const m = MEASURES.find((x) => x.key === key)!;
  return `${m.digits && !Number.isInteger(v) ? v.toFixed(m.digits) : v}${m.unit}`;
}

function MeasuresPanel({ className, device }: { className?: string; device: DeviceMode }) {
  return (
    <Panel className={className} title="Measures vs Goal" meta="week 1 → goal"
      action={<InfoTip text="Each bar runs from the patient's week-1 baseline (left) to their goal (right). The tick is the last visit. Patients are only compared with themselves." />}>
      <ul className="flex min-h-0 flex-1 flex-col justify-between gap-1.5 overflow-y-auto">
        {measuresFor(device).map((m) => {
          const p = progressOf(m.baseline, m.goal, m.now);
          const last = progressOf(m.baseline, m.goal, m.last);
          const lowerIsBetter = m.goal < m.baseline;
          const better = lowerIsBetter ? m.now < m.last : m.now > m.last;
          const done = p >= 100;
          return (
            <li key={m.key} className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="truncate text-xs font-semibold text-foreground">{m.title}</span>
                <InfoTip text={`${m.label}: ${m.info}`} />
                <span className="ml-auto shrink-0 font-mono text-xs font-semibold text-foreground">{measureFmt(m.key, m.now)}</span>
                <span className={cn("w-8 shrink-0 text-right font-mono text-3xs", m.now === m.last ? "text-muted-foreground" : better ? "text-success" : "text-sev-critical")}>
                  {m.now === m.last ? "=" : `${m.now > m.last ? "+" : "−"}${+Math.abs(m.now - m.last).toFixed(m.digits ?? 0)}`}
                </span>
              </div>
              <div className="relative mt-0.5 h-1.5 rounded-full bg-muted">
                <div className={cn("absolute inset-y-0 left-0 rounded-full", done ? "bg-success" : "bg-primary")} style={{ width: `${p}%` }} />
                <div className="absolute -top-0.5 h-2.5 w-0.5 rounded-full bg-foreground/70" style={{ left: `${last}%` }} title={`${PREVIOUS.date}: ${measureFmt(m.key, m.last)}`} />
              </div>
              <div className="mt-0.5 flex justify-between gap-2 font-mono text-3xs text-muted-foreground">
                <span className="truncate">wk 1 {measureFmt(m.key, m.baseline)}</span>
                <span className="shrink-0">{p}% · goal {lowerIsBetter ? "≤" : ""}{measureFmt(m.key, m.goal)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/* ── Clinician ───────────────────────────────────────────────────────── */

const PLAN_LABEL: Record<Plan, string> = { progress: "Progress", hold: "Hold", regress: "Regress" };

function ClinicianPanel({ className, plan, approved, onPlan, onApprove }: {
  className?: string; plan: Plan; approved: boolean; onPlan: (p: Plan) => void; onApprove: (v: boolean) => void;
}) {
  const suggestion = suggestedPlan();
  const adding = approved && plan === "progress";
  return (
    <Panel className={className} title="Clinician" meta="Programme change needs approval">
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        <div className="rounded-lg border border-border bg-background p-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="flex items-center gap-1 text-3xs font-bold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="size-3 text-primary" />
              Suggested: <span className="text-primary">{PLAN_LABEL[suggestion.plan]}</span>
            </span>
            <div className="ml-auto">
              <PanelTabs value={plan} onChange={onPlan} tabs={(["progress", "hold", "regress"] as Plan[]).map((p) => [p, PLAN_LABEL[p]])} />
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {suggestion.reasons.map((r) => (
              <span key={r.label} className={cn("inline-flex items-center gap-1 rounded px-1.5 py-px text-3xs font-semibold", r.ok ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>
                {r.ok ? <Check className="size-3" /> : <X className="size-3" />}
                {r.label}
              </span>
            ))}
          </div>
          <ul className="mt-1.5 flex flex-col gap-0.5">
            {PLAN_CHANGES[plan].map((c) => (
              <li key={c} className="flex items-start gap-1.5 text-2xs leading-snug text-foreground">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                {c}
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center gap-2">
            {approved ? (
              <>
                <span className="inline-flex items-center gap-1 text-2xs font-semibold text-success"><ShieldCheck className="size-3.5" />Approved · {VISIT.clinician}</span>
                <button type="button" onClick={() => onApprove(false)} className="ml-auto inline-flex items-center gap-1 text-3xs font-semibold text-muted-foreground hover:text-foreground"><Undo2 className="size-3" />Undo</button>
              </>
            ) : (
              <>
                <span className="text-3xs text-muted-foreground">{plan === suggestion.plan ? "AI suggestion" : "Changed by clinician"}</span>
                <Button size="sm" className="ml-auto h-7 text-2xs" onClick={() => onApprove(true)}>
                  <Check className="size-3.5" />
                  Approve {PLAN_LABEL[plan].toLowerCase()}
                </Button>
              </>
            )}
          </div>
        </div>
        <div>
          <p className="mb-1 flex items-center gap-1 text-3xs font-bold uppercase tracking-wider text-muted-foreground">
            Home programme · this week
            <InfoTip text="Exercises the patient does at home, and how many days they logged them in the patient app this week." />
          </p>
          <ul className="flex flex-col gap-0.5">
            {HOME_PROGRAMME.map((e) => (
              <li key={e.name} className="flex items-center gap-2 rounded-md bg-background px-2 py-px">
                <span className="truncate text-xs font-semibold text-foreground">{e.name}</span>
                <span className="shrink-0 font-mono text-3xs text-muted-foreground">{e.dose}</span>
                <span className="ml-auto flex shrink-0 gap-0.5" aria-label={`${e.done} of ${e.planned} days`} title={`${e.done} of ${e.planned} days`}>
                  {Array.from({ length: e.planned }, (_, i) => <span key={i} className={cn("size-1.5 rounded-full", i < e.done ? "bg-success" : "bg-muted-foreground/30")} />)}
                </span>
              </li>
            ))}
            {adding && (
              <li className="flex items-center gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 px-2 py-0.5">
                <span className="truncate text-xs font-semibold text-foreground">Step-ups</span>
                <span className="shrink-0 font-mono text-3xs text-muted-foreground">3 × 8 · 10 cm</span>
                <span className="ml-auto shrink-0 rounded bg-primary/15 px-1 text-3xs font-bold uppercase text-primary">New</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </Panel>
  );
}

/* ── Full report ─────────────────────────────────────────────────────── */

function FullReport(props: {
  name: string; device: DeviceMode; selected: string; onSelect: (id: string) => void; open: { rep: Rep; f: Finding }[]; approved: boolean; plan: Plan; signed: boolean; onSign: (v: boolean) => void; onShare: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-foreground">Full report</h2>
      <RecoverySection device={props.device} />
      <RepTable device={props.device} selected={props.selected} onSelect={props.onSelect} />
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <DischargeCard className="lg:col-span-5" device={props.device} />
        <SignOffCard className="lg:col-span-7" {...props} />
      </section>
    </div>
  );
}

const CURVE_TABS: [Exclude<MeasureKey, "adherence">, string][] = [["flex", "Knee bend"], ["lag", "Straighten"], ["sts", "Sit-to-stand"], ["lr", "Left–right"]];

/* Recovery across visits against the usual timeline after a knee replacement, plus pain. */
function RecoverySection({ device }: { device: DeviceMode }) {
  const [key, setKey] = React.useState<Exclude<MeasureKey, "adherence">>("flex");
  const m = measuresFor(device).find((x) => x.key === key)!;
  const lrTag = lrFor(device).tag;
  const gw = goalWeek();
  const data = TIMELINE_WEEKS.map((wk) => {
    const v = VISITS.find((x) => x.wk === wk);
    const proj = key === "flex" && gw && wk >= PATIENT.week && wk <= gw ? Math.min(LIMIT.goalFlex, Math.round(TODAY.flex + ((LIMIT.goalFlex - TODAY.flex) * (wk - PATIENT.week)) / (gw - PATIENT.week))) : null;
    return { wk, band: EXPECTED_BAND[key](wk), actual: v ? (key === "lr" ? lrOfVisit(v, device) : v[key]) : null, proj };
  });
  const domain: Record<typeof key, [number, number]> = { flex: [60, 135], lag: [0, 18], sts: [8, 30], lr: [0, 40] };
  const lowerIsBetter = m.goal < m.baseline;
  const [lo, hi] = EXPECTED_BAND[key](PATIENT.week);
  const inBand = m.now >= lo && m.now <= hi;
  const ahead = lowerIsBetter ? m.now < lo : m.now > hi;
  return (
    <section className="grid grid-cols-1 gap-3 lg:grid-cols-12">
      <div className="rounded-xl border border-border bg-card p-3 lg:col-span-8">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-foreground">Recovery</h3>
          <span className="text-2xs text-muted-foreground">By week since surgery · vs usual recovery</span>
          <InfoTip text="The shaded band is the usual range at each week after a knee replacement. It is a guide, not a ranking: the patient is measured against their own baseline and goal." />
          <span className={cn("rounded px-1.5 py-px text-3xs font-bold uppercase", inBand ? "bg-success/10 text-success" : ahead ? "bg-info/10 text-info" : "bg-warning/10 text-warning")}>
            {inBand ? "On track" : ahead ? "Ahead" : "Behind usual"}
          </span>
          <div className="ml-auto"><PanelTabs value={key} onChange={setKey} tabs={CURVE_TABS} /></div>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
              <XAxis dataKey="wk" {...AXIS} fontSize={10} tickFormatter={(v) => `wk ${v}`} />
              <YAxis domain={domain[key]} {...AXIS} fontSize={10} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `Week ${v}`}
                formatter={(v, n) => (n === "band" && Array.isArray(v) ? [`${v[0]}–${v[1]}${m.unit}`, "Usual range"] : [`${v}${m.unit}`, n === "proj" ? "At this pace" : m.label])} />
              <Area type="monotone" dataKey="band" stroke="none" fill="var(--success)" fillOpacity={0.12} isAnimationActive={false} />
              <ReferenceLine y={m.goal} stroke="var(--success)" strokeDasharray="4 3" label={{ value: `Goal ${measureFmt(key, m.goal)}`, position: "insideTopRight", fill: "var(--success)", fontSize: 10 }} />
              <ReferenceLine x={PATIENT.week} stroke="var(--muted-foreground)" strokeDasharray="2 3" label={{ value: "Today", position: "insideTopLeft", fill: "var(--muted-foreground)", fontSize: 10 }} />
              <Line type="monotone" dataKey="proj" stroke="var(--primary)" strokeDasharray="4 3" strokeWidth={1.5} dot={false} connectNulls={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="actual" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3, fill: "var(--primary)" }} connectNulls={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 flex flex-wrap gap-x-3 text-3xs text-muted-foreground">
          <span><Swatch c="bg-primary" />{m.label}{key === "lr" && lrTag && ` (${lrTag})`}</span>
          <span><Swatch c="bg-success/30" />Usual range</span>
          {key === "flex" && gw && <span><Swatch c="border-primary" dashed />At this pace: goal by week {gw}</span>}
          {key === "lr" && device === "none" && <span>No force plate: step length on the walk, every visit</span>}
          {key === "lr" && device === "offline" && <span>Today: no force-plate load on sit-to-stand {loadSpan(device).without}</span>}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-3 lg:col-span-4">
        <div className="mb-2 flex items-baseline gap-2">
          <h3 className="text-sm font-bold text-foreground">Pain</h3>
          <span className="text-2xs text-muted-foreground">0–10, before and after each visit</span>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={VISITS} margin={{ top: 8, right: 12, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
              <XAxis dataKey="wk" {...AXIS} fontSize={10} tickFormatter={(v) => `wk ${v}`} />
              <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} {...AXIS} fontSize={10} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(v) => `Week ${v}`} formatter={(v, n) => [`${v}/10`, n === "painBefore" ? "Before" : "After"]} />
              <ReferenceLine y={LIMIT.pain} stroke="var(--success)" strokeDasharray="4 3" />
              <Line type="monotone" dataKey="painBefore" stroke="var(--warning)" strokeWidth={1.8} dot={{ r: 2.5, fill: "var(--warning)" }} isAnimationActive={false} />
              <Line type="monotone" dataKey="painAfter" stroke="var(--info)" strokeWidth={1.8} dot={{ r: 2.5, fill: "var(--info)" }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-1 text-3xs text-muted-foreground"><Swatch c="bg-warning" />Before <Swatch c="bg-info" />After <Swatch c="border-success" dashed />Discharge ≤ {LIMIT.pain}</p>
      </div>
    </section>
  );
}

/* Every rep of the visit in one table. */
function RepTable({ device, selected, onSelect }: { device: DeviceMode; selected: string; onSelect: (id: string) => void }) {
  const cols: [string, string][] = [
    ["Rep", "Exercise and rep"], ["Time", "Time into the visit"], ["Bend", "Most knee bend, °"], ["Short", "Short of straight, °"], ["Speed", "Bend speed °/s, or lowering s"],
    ["Hold", "Hold at end range, s"], ["Hip", "Hip hike, cm"], ["Trunk", "Trunk lean, °"], ["L–R", "Left–right difference, %"], ["Checks", "Checks met"], ["Findings", "AI findings"],
  ];
  const cell = "px-2 py-1.5 font-mono text-2xs whitespace-nowrap";
  const red = (bad: boolean) => (bad ? "text-sev-critical" : "text-muted-foreground");
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <h3 className="text-sm font-bold text-foreground">Every rep</h3>
        <span className="text-2xs text-muted-foreground">Click a row to review that rep above</span>
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
              const checks = scoredChecks(r, device);
              const met = checks.filter((c) => c.ok).length;
              const load = hasLoad(r, device);
              const fs = findingsFor(r);
              const need = EXERCISES[r.ex].need;
              return (
                <tr key={r.id} tabIndex={0} onClick={() => onSelect(r.id)} onKeyDown={(e) => e.key === "Enter" && onSelect(r.id)}
                  className={cn("cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/50", r.id === selected && "bg-muted")}>
                  <td className={cn(cell, "font-sans font-semibold text-foreground")}>{repName(r)}</td>
                  <td className={cn(cell, "text-muted-foreground")}>{fmtClock(r.at)}</td>
                  <td className={cn(cell, "font-semibold", r.flex >= need ? "text-foreground" : "text-sev-critical")}>{r.flex}</td>
                  <td className={cn(cell, red(r.lag > LIMIT.lag))}>{r.lag}</td>
                  <td className={cn(cell, r.ex === "rom" ? red(r.speed > LIMIT.romSpeed) : r.ex === "sts" ? red(r.hold < LIMIT.stsLower) : "text-muted-foreground")}>
                    {r.ex === "rom" ? `${r.speed}°/s` : r.ex === "sts" ? `${r.hold.toFixed(1)} s` : "—"}
                  </td>
                  <td className={cn(cell, r.ex === "rom" ? red(r.hold < LIMIT.hold) : "text-muted-foreground")}>{r.ex === "rom" ? r.hold.toFixed(1) : "—"}</td>
                  <td className={cn(cell, red(r.hipHike > LIMIT.hipHike))}>{r.hipHike.toFixed(1)}</td>
                  <td className={cn(cell, red(r.trunkLean > LIMIT.trunkLean))}>{r.trunkLean}</td>
                  <td className={cn(cell, r.ex === "rom" || !load ? "text-muted-foreground" : red(r.lr > LIMIT.lr))} title={load ? undefined : `Needs ${PLATE.toLowerCase()}`}>
                    {r.ex === "rom" || !load ? "—" : r.lr}
                  </td>
                  <td className={cn(cell, TONE_TEXT[repTone(r, device)])}>{met}/{checks.length}</td>
                  <td className={cn(cell, "font-sans")}>
                    {fs.length ? (
                      <span className="flex flex-wrap gap-1">
                        {fs.map((f) => <span key={f.key} className="rounded bg-sev-critical/10 px-1 py-px text-3xs font-semibold text-sev-critical">{FAULTS[f.key].label}</span>)}
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

function DischargeCard({ className, device }: { className?: string; device: DeviceMode }) {
  const criteria = dischargeFor(device);
  const met = criteria.filter((d) => d.met).length;
  return (
    <div className={cn("flex flex-col rounded-xl border border-border bg-card p-3", className)}>
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-sm font-bold text-foreground">Discharge criteria</h3>
        <span className="text-2xs text-muted-foreground">{met} of {criteria.length} met</span>
        <InfoTip text="What the patient needs to reach before they finish rehab. Set by the clinician for this patient." />
      </div>
      <div className="mb-2 h-1.5 rounded-full bg-muted">
        <div className="h-full rounded-full bg-success" style={{ width: `${(met / criteria.length) * 100}%` }} />
      </div>
      <ul className="flex flex-col gap-0.5">
        {criteria.map((d) => (
          <li key={d.label} className={cn("flex items-center gap-2 rounded-md px-2 py-1", d.met ? "bg-background" : "bg-muted/40")}>
            {d.met ? <CircleCheck className="size-4 shrink-0 text-success" aria-label="Met" /> : <span className="size-4 shrink-0 rounded-full border-2 border-muted-foreground/40" aria-label="Not yet" />}
            <span className="min-w-0 truncate text-xs font-semibold text-foreground">
              {d.label}
              {d.note && <span className="ml-1.5 text-3xs font-normal text-muted-foreground">{d.note}</span>}
            </span>
            <span className="ml-auto shrink-0 font-mono text-2xs text-muted-foreground">{d.target}</span>
            <span className={cn("w-16 shrink-0 text-right font-mono text-2xs font-semibold", d.met ? "text-success" : "text-foreground")}>{d.now}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignOffCard({ className, name, onSelect, open, approved, plan, signed, onSign, onShare }: {
  className?: string; name: string; onSelect: (id: string) => void; open: { rep: Rep; f: Finding }[]; approved: boolean; plan: Plan; signed: boolean; onSign: (v: boolean) => void; onShare: () => void;
}) {
  const [note, setNote] = React.useState(
    `Good week. Bend up to ${TODAY.flex}°, pain ${TODAY.painBefore} → ${TODAY.painAfter}. Hip hike on sit-to-stand when tired: cue “level hips”. Review in 1 week.`,
  );
  const ready = open.length === 0 && approved;
  const steps: { label: string; done: boolean; action?: React.ReactNode }[] = [
    {
      label: open.length ? `Review ${open.length} AI finding${open.length === 1 ? "" : "s"} under ${REVIEW_BELOW}%` : "AI findings reviewed",
      done: open.length === 0,
      action: open.length ? <button type="button" onClick={() => onSelect(open[0].rep.id)} className="text-2xs font-semibold text-primary hover:underline">Show {repName(open[0].rep).toLowerCase()} →</button> : undefined,
    },
    { label: approved ? `Programme change approved (${PLAN_LABEL[plan].toLowerCase()})` : "Approve the programme change", done: approved },
  ];
  return (
    <div className={cn("flex flex-col gap-2 rounded-xl border border-border bg-card p-3", className)}>
      <div className="flex items-baseline gap-2">
        <h3 className="text-sm font-bold text-foreground">Clinician notes & sign-off</h3>
        <span className="text-2xs text-muted-foreground">Shown on {name}'s visit report</span>
      </div>
      <Textarea value={note} onChange={(e) => { setNote(e.target.value); onSign(false); }} className="min-h-20 text-sm" aria-label="Clinician notes" />
      <ul className="flex flex-col gap-1">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-xs">
            {s.done ? <CircleCheck className="size-4 shrink-0 text-success" /> : <span className="size-4 shrink-0 rounded-full border-2 border-warning" />}
            <span className={s.done ? "text-muted-foreground" : "font-semibold text-foreground"}>{s.label}</span>
            {s.action && <span className="ml-auto">{s.action}</span>}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
        {signed ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success"><ShieldCheck className="size-4" />Signed off by {VISIT.clinician} · {SIGNED_AT}</span>
            <button type="button" onClick={() => onSign(false)} className="inline-flex items-center gap-1 text-2xs font-semibold text-muted-foreground hover:text-foreground"><Undo2 className="size-3" />Reopen</button>
            <Button size="sm" variant="outline" className="ml-auto" onClick={onShare}><Share2 className="size-4" />Share with patient</Button>
          </>
        ) : (
          <>
            <span className="text-3xs text-muted-foreground">Faces stay blurred in every clip. The report can't be shared until it's signed.</span>
            <Button size="sm" className="ml-auto" disabled={!ready} onClick={() => { onSign(true); toast.success("Report signed off", { description: `${VISIT.clinician} · ${SIGNED_AT}` }); }}>
              <ShieldCheck className="size-4" />
              Sign off as {VISIT.clinician}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
