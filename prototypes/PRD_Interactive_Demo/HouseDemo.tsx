import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  Cctv,
  Check,
  CircleHelp,
  Clock,
  DoorOpen,
  FileText,
  KeyRound,
  LockKeyhole,
  MapPin,
  MousePointerClick,
  Phone,
  Radar,
  RotateCcw,
  Sparkles,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import {
  CONTEXT_FACTS,
  INCIDENT_ID,
  RESPONSES,
  SENSOR_EVENTS,
  SENSOR_ORDER,
  assess,
  eventFor,
  type Assessment,
  type Level,
  type ResponseId,
  type SensorId,
} from "./demoScenario";

/* Interactive demo — one incident, built by the visitor and followed through Accel.

   The house stays on screen for all four stages; only what is known about it
   changes. Every click adds understanding: a sensor adds a signal, "Add context"
   places the signals on the map and timeline, "Analyse situation" connects them,
   and the chosen response is written to the incident record. Sensors stay
   switchable throughout, so the assessment can be seen following the evidence. */

const SENSOR_ICON: Record<SensorId, React.ElementType> = { camera: Cctv, door: DoorOpen, motion: Radar };
const RESPONSE_ICON: Record<ResponseId, React.ElementType> = { camera: Video, household: Phone, notify: BellRing };

/* Where each sensor sits on the 640 × 440 floor plan — as a class for the
   button, and as coordinates for the evidence path drawn through them. */
const SENSOR_SPOT: Record<SensorId, { cls: string; x: number; y: number; labelCls: string }> = {
  camera: { cls: "left-[54.7%] top-[85.9%]", x: 350, y: 378, labelCls: "left-full ml-2" },
  door: { cls: "left-[40.6%] top-[77.3%]", x: 260, y: 340, labelCls: "right-full mr-2" },
  motion: { cls: "left-[40.6%] top-[58%]", x: 260, y: 255, labelCls: "left-full ml-2" },
};

const LEVEL: Record<Level, { text: string; panel: string; stroke: string; bar: string }> = {
  critical: { text: "text-sev-critical", panel: "border-sev-critical/40 bg-sev-critical/[0.06]", stroke: "stroke-sev-critical", bar: "bg-sev-critical" },
  medium: { text: "text-sev-medium", panel: "border-sev-medium/40 bg-sev-medium/[0.06]", stroke: "stroke-sev-medium", bar: "bg-sev-medium" },
  low: { text: "text-sev-low", panel: "border-sev-low/40 bg-sev-low/[0.06]", stroke: "stroke-sev-low", bar: "bg-sev-low" },
};

const STAGES = [
  { n: 1, title: "Unify sources", blurb: "Click the sensors on the house. Each one reports its own event — separate signals, with no explanation yet." },
  { n: 2, title: "Contextualize", blurb: "Place the events on the house map and timeline, alongside what the home already knows." },
  { n: 3, title: "Understand & analyse", blurb: "Connect the evidence and see what it adds up to — and which signals support it." },
  { n: 4, title: "Decision & action", blurb: "Choose a response. Whatever you pick is written to the incident record." },
] as const;

/* ── Progress ────────────────────────────────────────────────────────── */

function Stepper({ stage, canReach, onGo }: { stage: number; canReach: (n: number) => boolean; onGo: (n: number) => void }) {
  return (
    <ol className="flex items-center gap-2">
      {STAGES.map((s, i) => {
        const done = s.n < stage, current = s.n === stage, reachable = canReach(s.n);
        return (
          <li key={s.n} className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => onGo(s.n)}
              disabled={!reachable}
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                reachable ? "hover:bg-muted/60" : "cursor-not-allowed"
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-2xs font-bold transition-colors",
                  current && "border-primary bg-primary text-primary-foreground",
                  done && "border-primary/40 bg-primary/15 text-primary",
                  !current && !done && "border-border bg-card text-muted-foreground"
                )}
              >
                {done ? <Check className="size-3" strokeWidth={3} /> : s.n}
              </span>
              <span className={cn("hidden truncate text-sm font-semibold sm:block", current ? "text-foreground" : "text-muted-foreground")}>
                {s.title}
              </span>
            </button>
            {i < STAGES.length - 1 && <span className={cn("h-px flex-1", s.n < stage ? "bg-primary/50" : "bg-border")} />}
          </li>
        );
      })}
    </ol>
  );
}

/* ── The house ───────────────────────────────────────────────────────── */

function HouseScene({
  selected, onToggle, contextOn, assessment, hint,
}: {
  selected: SensorId[];
  onToggle: (id: SensorId) => void;
  contextOn: boolean;
  /** Set once the situation has been analysed. */
  assessment: Assessment | null;
  /** Nudges the visitor to click a sensor while none is selected. */
  hint: boolean;
}) {
  const has = (id: SensorId) => selected.includes(id);
  const ordered = SENSOR_ORDER.filter(has);
  const path = ordered.map((id) => `${SENSOR_SPOT[id].x},${SENSOR_SPOT[id].y}`).join(" ");

  return (
    <div className="relative aspect-[640/440] w-full select-none">
      <svg viewBox="0 0 640 440" className="absolute inset-0 size-full" role="img" aria-label="Floor plan of the house with a porch camera, a front door sensor and a hallway motion sensor">
        {/* Garden path and porch */}
        <rect x="245" y="384" width="30" height="56" className="fill-muted/40" />
        <rect x="216" y="340" width="88" height="44" rx="4" className="fill-muted/50 stroke-border" strokeDasharray="4 4" />

        {/* What each sensor covers */}
        <polygon points="350,378 222,346 246,438" className={cn("transition-opacity duration-[var(--duration-normal)]", has("camera") ? "fill-info/15" : "fill-transparent")} />
        <circle cx="260" cy="255" r="52" className={cn("transition-all duration-[var(--duration-normal)]", has("motion") ? "fill-warning/10 stroke-warning/40" : "fill-transparent stroke-transparent")} strokeDasharray="3 5" />

        {/* Shell and rooms */}
        <rect x="80" y="40" width="480" height="300" rx="6" className={cn("fill-card transition-colors duration-[var(--duration-normal)]", contextOn ? "stroke-warning/60" : "stroke-border")} strokeWidth="2.5" />
        <g className="stroke-border" strokeWidth="2">
          <line x1="320" y1="40" x2="320" y2="150" />
          <line x1="320" y1="190" x2="320" y2="340" />
          <line x1="80" y1="220" x2="150" y2="220" />
          <line x1="190" y1="220" x2="200" y2="220" />
          <line x1="200" y1="220" x2="200" y2="340" />
          <line x1="320" y1="180" x2="440" y2="180" />
          <line x1="480" y1="180" x2="560" y2="180" />
        </g>
        <g className="fill-muted-foreground" fontSize="11" fontWeight="600" letterSpacing="1.2" textAnchor="middle">
          <text x="200" y="134">LIVING ROOM</text>
          <text x="440" y="114">KITCHEN</text>
          <text x="440" y="304">BEDROOM</text>
          <text x="140" y="284">BATH</text>
          <text x="260" y="206">HALLWAY</text>
          <text x="260" y="404" className="fill-muted-foreground/70">PORCH</text>
        </g>

        {/* Front door — the opening in the wall, and the leaf swung open once its sensor reports */}
        <line x1="240" y1="340" x2="280" y2="340" className="stroke-card" strokeWidth="5" />
        <line x1="240" y1="340" x2={has("door") ? 258 : 280} y2={has("door") ? 306 : 340} className={cn("transition-all duration-[var(--duration-normal)]", has("door") ? "stroke-primary" : "stroke-muted-foreground")} strokeWidth="3" strokeLinecap="round" />

        {/* Evidence, connected in the order it happened */}
        {assessment && ordered.length > 1 && (
          <polyline points={path} fill="none" className={LEVEL[assessment.level].stroke} strokeWidth="2.5" strokeDasharray="7 6" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>

      {/* Context on the map */}
      {contextOn && (
        <>
          <StatusBadge tone="warning" dot={false} className="absolute left-[13.5%] top-[4%] gap-1.5 animate-in fade-in-0 zoom-in-95 duration-[var(--duration-normal)]">
            <LockKeyhole className="size-3" /> Away mode · armed 18:05
          </StatusBadge>
          <StatusBadge tone="neutral" dot={false} className="absolute left-[3%] top-[80%] gap-1.5 animate-in fade-in-0 zoom-in-95 duration-[var(--duration-normal)]">
            <KeyRound className="size-3" /> No authorised unlock
          </StatusBadge>
        </>
      )}
      {assessment && (
        <StatusBadge tone={assessment.level} className="absolute right-[13.5%] top-[4%] animate-in fade-in-0 zoom-in-95 duration-[var(--duration-normal)]">
          {assessment.title}
        </StatusBadge>
      )}

      {/* Sensors — the things the visitor clicks */}
      {SENSOR_EVENTS.map((ev) => {
        const Icon = SENSOR_ICON[ev.id], spot = SENSOR_SPOT[ev.id], on = has(ev.id);
        return (
          <div key={ev.id} className={cn("absolute -translate-x-1/2 -translate-y-1/2", spot.cls)}>
            {hint && <span className="absolute inset-0 animate-ping rounded-full bg-primary/40" />}
            <button
              type="button"
              aria-pressed={on}
              aria-label={`${ev.device} — ${on ? "selected, click to remove" : "click to add its signal"}`}
              onClick={() => onToggle(ev.id)}
              className={cn(
                "relative flex size-10 items-center justify-center rounded-full border-2 shadow-lg transition-all duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {contextOn && on && (
                <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full border border-background bg-foreground font-mono text-3xs font-bold text-background">
                  {SENSOR_ORDER.filter(has).indexOf(ev.id) + 1}
                </span>
              )}
            </button>
            <span className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-background/90 px-1.5 py-0.5 text-2xs font-semibold", spot.labelCls, on ? "text-foreground" : "text-muted-foreground")}>
              {contextOn && on && <span className="mr-1 font-mono text-primary">{ev.time}</span>}
              {ev.device}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Side panel pieces ───────────────────────────────────────────────── */

function SignalCard({ id, selected }: { id: SensorId; selected: boolean }) {
  const ev = eventFor(id), Icon = SENSOR_ICON[id];
  if (!selected)
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border px-3 py-2.5 text-muted-foreground">
        <Icon className="size-4 shrink-0" />
        <p className="text-sm">Click the <span className="font-semibold text-foreground">{ev.device.toLowerCase()}</span> on the house</p>
      </div>
    );
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2.5 animate-in fade-in-0 slide-in-from-bottom-1 duration-[var(--duration-normal)]">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Icon className="size-3" /> {ev.source}
        </p>
        <span className="font-mono text-2xs text-muted-foreground">{ev.time}</span>
      </div>
      <p className="mt-1 text-sm font-semibold text-foreground">{ev.device}</p>
      <p className="mt-0.5 font-mono text-xs text-muted-foreground">{ev.raw}</p>
    </div>
  );
}

function Timeline({ selected }: { selected: SensorId[] }) {
  const events = SENSOR_EVENTS.filter((e) => selected.includes(e.id));
  return (
    <ol className="space-y-0">
      {events.map((ev, i) => (
        <li key={ev.id} className="relative flex gap-3 pb-3 last:pb-0">
          {i < events.length - 1 && <span className="absolute left-[9px] top-5 h-full w-px bg-border" />}
          <span className="relative mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full bg-foreground font-mono text-3xs font-bold text-background">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
              <span className="truncate">{ev.device}</span>
              <span className="shrink-0 font-mono text-2xs font-normal text-primary">{ev.time}</span>
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" /> {ev.place} · {ev.raw}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ContextFacts() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {CONTEXT_FACTS.map((f) => (
        <div key={f.key} className="rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2.5 animate-in fade-in-0 slide-in-from-bottom-1 duration-[var(--duration-normal)]">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</p>
          <p className="mt-0.5 text-md font-bold text-warning">{f.value}</p>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">{f.detail}</p>
        </div>
      ))}
    </div>
  );
}

function AssessmentCard({ a }: { a: Assessment }) {
  const tone = LEVEL[a.level];
  return (
    <div className={cn("rounded-lg border p-3.5 animate-in fade-in-0 slide-in-from-bottom-1 duration-[var(--duration-normal)]", tone.panel)} aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <StatusBadge tone={a.level}>{a.levelLabel}</StatusBadge>
        <span className="font-mono text-2xs text-muted-foreground">{a.supports.length} of {SENSOR_ORDER.length} signals</span>
      </div>
      <p className={cn("mt-2 text-xl font-bold leading-tight", tone.text)}>{a.title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{a.summary}</p>

      <div className="mt-3">
        <div className="flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          <span>Evidence strength</span>
          <span className="font-mono text-foreground">{a.confidence}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full transition-all duration-[var(--duration-slow)]", tone.bar)} style={{ width: `${a.confidence}%` }} />
        </div>
      </div>

      <p className="mt-3.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Why Accel thinks so</p>
      <ul className="mt-1.5 space-y-1.5">
        {a.supports.map((s) => {
          const Icon = SENSOR_ICON[s.sensor];
          return (
            <li key={s.sensor} className="flex items-start gap-2 text-sm text-foreground">
              <Icon className="mt-0.5 size-3.5 shrink-0 text-primary" /> {s.text}
            </li>
          );
        })}
        <li className="flex items-start gap-2 text-sm text-foreground">
          <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-warning" /> The home is in Away mode and no authorised unlock was recorded.
        </li>
      </ul>

      {a.gaps.length > 0 && (
        <>
          <p className="mt-3.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">What is still unknown</p>
          <ul className="mt-1.5 space-y-1.5">
            {a.gaps.map((g) => (
              <li key={g.sensor} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CircleHelp className="mt-0.5 size-3.5 shrink-0" /> {g.text}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function IncidentRecord({ a, selected, response }: { a: Assessment; selected: SensorId[]; response: ResponseId }) {
  const r = RESPONSES.find((x) => x.id === response)!;
  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Assessment", value: <span className={cn("font-semibold", LEVEL[a.level].text)}>{a.title}</span> },
    { label: "Evidence", value: SENSOR_EVENTS.filter((e) => selected.includes(e.id)).map((e) => e.device).join(" · ") },
    { label: "Context", value: "Away mode · no authorised unlock" },
    { label: "Response", value: <span className="font-semibold text-foreground">{r.record}</span> },
  ];
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background animate-in fade-in-0 slide-in-from-bottom-1 duration-[var(--duration-normal)]" aria-live="polite">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-3 py-2">
        <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground"><FileText className="size-3" /> Incident record</p>
        <span className="font-mono text-2xs text-primary">{INCIDENT_ID}</span>
      </div>
      <dl className="divide-y divide-border/60">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[84px_1fr] gap-3 px-3 py-2">
            <dt className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{row.label}</dt>
            <dd className="text-sm text-muted-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="flex items-center gap-1.5 border-t border-border bg-success/[0.06] px-3 py-2 text-xs text-success">
        <Check className="size-3.5" strokeWidth={3} /> {r.outcome} <span className="ml-auto flex items-center gap-1 font-mono text-2xs text-muted-foreground"><Clock className="size-3" />21:44:10</span>
      </p>
    </div>
  );
}

/* ── Demo ────────────────────────────────────────────────────────────── */

interface DemoState {
  stage: number;
  selected: SensorId[];
  contextOn: boolean;
  analysed: boolean;
  response: ResponseId | null;
}
type DemoAction =
  | { type: "toggle"; id: SensorId }
  | { type: "stage"; n: number }
  | { type: "context" }
  | { type: "analyse" }
  | { type: "respond"; id: ResponseId }
  | { type: "reset" };

const START: DemoState = { stage: 1, selected: [], contextOn: false, analysed: false, response: null };

/* A reducer, so quick successive clicks each build on the latest state. */
function reduce(s: DemoState, a: DemoAction): DemoState {
  switch (a.type) {
    case "toggle": {
      const selected = s.selected.includes(a.id) ? s.selected.filter((x) => x !== a.id) : [...s.selected, a.id];
      // Sensors can be switched at any stage. With none left there is no incident, so the demo starts over.
      return selected.length === 0 ? START : { ...s, selected };
    }
    case "stage": return { ...s, stage: a.n };
    case "context": return { ...s, contextOn: true };
    case "analyse": return { ...s, analysed: true };
    case "respond": return { ...s, response: a.id };
    case "reset": return START;
  }
}

export function HouseDemo() {
  const [state, dispatch] = React.useReducer(reduce, START);
  const { stage, selected, contextOn, analysed, response } = state;

  const assessment = analysed ? assess(selected) : null;
  const meta = STAGES[stage - 1];
  const setStage = (n: number) => dispatch({ type: "stage", n });
  const reset = () => dispatch({ type: "reset" });
  const toggle = (id: SensorId) => dispatch({ type: "toggle", id });

  const canReach = (n: number) => n === 1 || (n === 2 && selected.length > 0) || (n === 3 && contextOn) || (n === 4 && analysed);
  const canNext = stage < 4 && canReach(stage + 1);
  const nextHint =
    stage === 1 ? "Select at least one sensor on the house to continue."
      : stage === 2 ? "Add context to continue."
        : stage === 3 ? "Analyse the situation to continue."
          : "";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <StatusBadge tone="primary" dot={false} className="gap-1.5"><MousePointerClick className="size-3" /> Interactive demo</StatusBadge>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Build an incident. Follow it through Accel.</h1>
          <p className="mt-1 max-w-2xl text-base text-muted-foreground">
            An example home with three sensors. Choose which ones report, then watch separate signals become one understood, actioned incident.
          </p>
        </div>
      </header>

      <div className="rounded-xl border border-border bg-card px-3 py-2.5">
        <Stepper stage={stage} canReach={canReach} onGo={(n) => canReach(n) && setStage(n)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* The house — on screen for every stage */}
        <section className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="min-w-0">
              <p className="text-base font-bold text-foreground">12 Linden Close</p>
              <p className="text-xs text-muted-foreground">Example home · 3 sensors from 3 different systems</p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              <strong className="text-foreground">{selected.length}</strong> of {SENSOR_ORDER.length} sensors reporting
            </span>
          </div>
          <div className="flex flex-1 items-center bg-background/40 p-4">
            <HouseScene selected={selected} onToggle={toggle} contextOn={contextOn} assessment={assessment} hint={selected.length === 0} />
          </div>
          <p className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
            {selected.length === 0
              ? "Click a sensor on the house to add its signal."
              : "Sensors stay switchable — turn one on or off at any stage and the picture changes with the evidence."}
          </p>
        </section>

        {/* What the current stage reveals */}
        <section className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="text-2xs font-semibold uppercase tracking-wider text-primary">Stage {meta.n} of {STAGES.length}</p>
            <h2 className="mt-0.5 text-lg font-bold text-foreground">{meta.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{meta.blurb}</p>
          </div>

          <div className="flex-1 space-y-3 p-4">
            {stage === 1 && SENSOR_ORDER.map((id) => <SignalCard key={id} id={id} selected={selected.includes(id)} />)}

            {stage === 2 && !contextOn && (
              <>
                {SENSOR_ORDER.filter((id) => selected.includes(id)).map((id) => <SignalCard key={id} id={id} selected />)}
                <Button className="w-full gap-1.5" size="lg" onClick={() => dispatch({ type: "context" })}>
                  <MapPin className="size-4" /> Add context
                </Button>
              </>
            )}
            {stage === 2 && contextOn && (
              <>
                <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline · on the house map</p>
                <Timeline selected={selected} />
                <p className="pt-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">What the home already knows</p>
                <ContextFacts />
              </>
            )}

            {stage === 3 && !assessment && (
              <>
                <Timeline selected={selected} />
                <ContextFacts />
                <Button className="w-full gap-1.5" size="lg" onClick={() => dispatch({ type: "analyse" })}>
                  <Sparkles className="size-4" /> Analyse situation
                </Button>
              </>
            )}
            {stage === 3 && assessment && <AssessmentCard a={assessment} />}

            {stage === 4 && assessment && (
              <>
                <div className={cn("flex items-center justify-between gap-2 rounded-lg border px-3 py-2", LEVEL[assessment.level].panel)}>
                  <p className={cn("text-sm font-bold", LEVEL[assessment.level].text)}>{assessment.title}</p>
                  <StatusBadge tone={assessment.level}>{assessment.levelLabel}</StatusBadge>
                </div>
                <div role="radiogroup" aria-label="Choose a response" className="space-y-2">
                  {RESPONSES.map((r) => {
                    const Icon = RESPONSE_ICON[r.id], on = response === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => dispatch({ type: "respond", id: r.id })}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          on ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40"
                        )}
                      >
                        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg border", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground")}>
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-foreground">{r.label}</span>
                          <span className="block text-xs text-muted-foreground">{r.hint}</span>
                        </span>
                        {on && <Check className="size-4 shrink-0 text-primary" strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
                {response
                  ? <IncidentRecord a={assessment} selected={selected} response={response} />
                  : <p className="rounded-lg border border-dashed border-border px-3 py-3 text-center text-sm text-muted-foreground">Pick a response to see it in the incident record.</p>}
              </>
            )}
          </div>

          {/* Back · Reset · Next */}
          <div className="border-t border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setStage(stage - 1)} disabled={stage === 1} className="gap-1.5">
                <ArrowLeft className="size-3.5" /> Back
              </Button>
              <Button variant="ghost" onClick={reset} className="gap-1.5 text-muted-foreground">
                <RotateCcw className="size-3.5" /> Reset
              </Button>
              {stage < 4 && (
                <Button onClick={() => setStage(stage + 1)} disabled={!canNext} className="ml-auto gap-1.5">
                  Next · {STAGES[stage].title} <ArrowRight className="size-3.5" />
                </Button>
              )}
            </div>
            {stage < 4 && !canNext && <p className="mt-2 text-xs text-muted-foreground">{nextHint}</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
