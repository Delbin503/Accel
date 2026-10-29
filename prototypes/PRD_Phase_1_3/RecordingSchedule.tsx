import * as React from "react";
import { AlertTriangle, Check, ChevronDown, Clock, Copy, Info, MapPin, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeSelect } from "@/components/shared/TimeSelect";
import { formatTimeOfDay } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useSitesStore } from "@/stores/useSitesStore";
import { MOCK_CAMERAS } from "@/mocks/cameras";
import type { SiteData } from "@/types/sites";
import {
  DEFAULT_CONFIG,
  FPS_OPTIONS,
  RESOLUTIONS,
  REVERT_OPTIONS,
  TONE_CLASSES,
  childrenOf,
  typeById,
  resolutionRank,
  type RecordingTypeConfig,
  type RecordingTypeDef,
  type RecordingTypeId,
} from "./recordingTypes";

/* Recording Schedule — the Phase 1.3 proposal, built to sit inside the
   System Configuration › Camera Defaults section. Field labels, control
   heights and row chrome copy that page so it drops straight in.

   It lists sites, not settings: each site shows the modes it records in, opens
   to its daily coverage, and is edited on its own. */

function Toggle({ checked, onChange, label, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full border transition-colors disabled:opacity-50",
        checked ? "border-primary bg-primary" : "border-border bg-muted"
      )}
    >
      <span className={cn("inline-block size-3.5 rounded-full bg-card shadow-sm transition-transform",
        checked ? "translate-x-[18px]" : "translate-x-0.5")} />
    </button>
  );
}

const FIELD_LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground";

/* ── Warnings shared by a type and its nested child ──────────────────── */

function QualityWarning({ def, config }: { def: RecordingTypeDef; config: RecordingTypeConfig }) {
  const below = resolutionRank(config.resolution) < resolutionRank(def.minResolution) || config.fps < def.minFps;
  if (!below) return null;
  return (
    <p className="flex items-start gap-1.5 text-xs text-warning">
      <AlertTriangle className="mt-0.5 size-3 flex-shrink-0" />
      {def.label} is specified for at least {def.minResolution} at {def.minFps} fps — this is set below it.
    </p>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
      <Info className="mt-0.5 size-3 flex-shrink-0" />
      {children}
    </p>
  );
}

/* ── Quality pair, the only controls motion carries ──────────────────── */

function QualityFields({ def, config, onChange }: {
  def: RecordingTypeDef;
  config: RecordingTypeConfig;
  onChange: (next: Partial<RecordingTypeConfig>) => void;
}) {
  return (
    <>
      <div>
        <label className={FIELD_LABEL}>Resolution</label>
        <Select value={config.resolution} onValueChange={(v) => onChange({ resolution: v })}>
          <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {RESOLUTIONS.map((r) => (
              <SelectItem key={r} value={r}>{r}{r === def.minResolution && " · minimum"}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className={FIELD_LABEL}>Frame Rate</label>
        <Select value={String(config.fps)} onValueChange={(v) => onChange({ fps: Number(v) })}>
          <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FPS_OPTIONS.map((f) => (
              <SelectItem key={f} value={String(f)}>{f} fps{f === def.minFps && " · minimum"}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

/* ── Motion, nested inside its parent ────────────────────────────────── */

/** Motion is a mode the parent switches into, so it has no window of its own —
    only quality, and how long to wait before dropping back. */
function NestedTrigger({ def, config, onChange }: {
  def: RecordingTypeDef;
  config: RecordingTypeConfig;
  onChange: (next: Partial<RecordingTypeConfig>) => void;
}) {
  const tone = TONE_CLASSES[def.tone];

  return (
    <div className="rounded-lg border border-border bg-card px-3.5 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className={cn("rounded border px-1.5 py-px text-2xs font-bold uppercase tracking-wider", tone.chip)}>
              {def.label}
            </span>
          </div>
          <p className="text-xs leading-snug text-foreground">{def.description}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded border border-border bg-muted px-2 py-0.5 text-2xs text-muted-foreground">
          <Clock className="size-3" />
          Switched on in the weekly schedule
        </span>
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <QualityFields def={def} config={config} onChange={onChange} />
          <div>
            <label className={FIELD_LABEL}>Revert After</label>
            <Select
              value={String(config.revertSeconds ?? 50)}
              onValueChange={(v) => onChange({ revertSeconds: Number(v) })}
            >
              <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REVERT_OPTIONS.map((s) => (
                  <SelectItem key={s} value={String(s)}>{s} seconds</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          <QualityWarning def={def} config={config} />
          <Note>
            After {config.revertSeconds ?? 50} seconds with no motion, the camera drops back to
            standby until the next trigger.
          </Note>
          {def.note && <Note>{def.note}</Note>}
        </div>
      </div>
    </div>
  );
}

/* ── One scheduled type ──────────────────────────────────────────────── */

function TypeRow({ def, config, configs, scheduledBy, windowFromSchedule, onChange, onChangeChild }: {
  def: RecordingTypeDef;
  config: RecordingTypeConfig;
  configs: Record<RecordingTypeId, RecordingTypeConfig>;
  /** Set when the weekly schedule decides when this mode runs — the card shows
      that instead of a switch. */
  scheduledBy?: string;
  /** Set when the schedule owns the window too, so the card drops its times. */
  windowFromSchedule?: boolean;
  onChange: (next: Partial<RecordingTypeConfig>) => void;
  onChangeChild: (id: RecordingTypeId, next: Partial<RecordingTypeConfig>) => void;
}) {
  const tone = TONE_CLASSES[def.tone];
  /* An end time at or before the start time means the window runs past
     midnight — legitimate for standby, so it is called out, not blocked. */
  const overnight = !def.alwaysOn && config.endTime <= config.startTime;
  const children = childrenOf(def.id);

  return (
    <div className="rounded-lg border border-border bg-background px-3.5 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className={cn("rounded border px-1.5 py-px text-2xs font-bold uppercase tracking-wider", tone.chip)}>
              {def.label}
            </span>
            {def.alwaysOn && (
              <span className="rounded border border-border bg-muted px-1.5 py-px text-2xs font-semibold text-muted-foreground">24/7</span>
            )}
          </div>
          <p className={cn("text-xs leading-snug", config.enabled || scheduledBy ? "text-foreground" : "text-muted-foreground")}>
            {def.description}
          </p>
        </div>
        {scheduledBy ? (
          <span className="flex shrink-0 items-center gap-1.5 rounded border border-border bg-muted px-2 py-0.5 text-2xs text-muted-foreground">
            <Clock className="size-3" />
            {scheduledBy}
          </span>
        ) : (
          <Toggle checked={config.enabled} onChange={(v) => onChange({ enabled: v })} label={`Enable ${def.label} recording`} />
        )}
      </div>

      <div className={cn("mt-3 border-t border-border pt-3", !config.enabled && !scheduledBy && "pointer-events-none opacity-40")}>
        <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", !windowFromSchedule && "lg:grid-cols-4")}>
          {/* A scheduled mode takes its window from the week, so it has none here. */}
          {!windowFromSchedule && (
            <>
              <div>
                <label className={FIELD_LABEL}>Start Time</label>
                {def.alwaysOn ? (
                  <div className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-muted px-3 text-base text-muted-foreground">
                    <Clock className="size-3.5" />
                    Always on
                  </div>
                ) : (
                  <TimeSelect value={config.startTime} onChange={(v) => onChange({ startTime: v })} aria-label={`${def.label} start time`} />
                )}
              </div>
              <div>
                <label className={FIELD_LABEL}>End Time</label>
                {def.alwaysOn ? (
                  <div className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-muted px-3 text-base text-muted-foreground">
                    <Clock className="size-3.5" />
                    Always on
                  </div>
                ) : (
                  <TimeSelect value={config.endTime} onChange={(v) => onChange({ endTime: v })} aria-label={`${def.label} end time`} />
                )}
              </div>
            </>
          )}
          <QualityFields def={def} config={config} onChange={onChange} />
        </div>

        <div className="mt-3 space-y-1.5">
          <QualityWarning def={def} config={config} />
          {overnight && !windowFromSchedule && (
            <p className="flex items-start gap-1.5 text-xs text-info">
              <Info className="mt-0.5 size-3 flex-shrink-0" />
              Window runs overnight — {formatTimeOfDay(config.startTime)} through {formatTimeOfDay(config.endTime)} the next day.
            </p>
          )}
          {def.note && <Note>{def.note}</Note>}
          {def.id === "continuous" && scheduledBy && <Note>Set a day to Operation in the weekly schedule to record by hours instead.</Note>}
        </div>

        {/* Modes that run inside this type rather than on their own schedule.
            Switched off, they are not drawn at all. */}
        {children.some((c) => configs[c.id].enabled) && (
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Switches into
            </p>
            {children.filter((c) => configs[c.id].enabled).map((child) => (
              <NestedTrigger
                key={child.id}
                def={child}
                config={configs[child.id]}
                onChange={(next) => onChangeChild(child.id, next)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Operation mode ──────────────────────────────────────────────────── */

/* With continuous recording off, a site's cameras record during operation
   hours — by default the site's own (set in Site Management), or a weekly
   schedule set day by day. */

const WEEKDAYS = [
  { id: "mon", label: "Monday",    initial: "M" },
  { id: "tue", label: "Tuesday",   initial: "T" },
  { id: "wed", label: "Wednesday", initial: "W" },
  { id: "thu", label: "Thursday",  initial: "T" },
  { id: "fri", label: "Friday",    initial: "F" },
  { id: "sat", label: "Saturday",  initial: "S" },
  { id: "sun", label: "Sunday",    initial: "S" },
] as const;
type Weekday = (typeof WEEKDAYS)[number]["id"];

/* A day records round the clock, by its operation hours, or not at all — so a
   site can run continuous on a Monday and operation hours the rest of the
   week, which one mode for the whole site could not express. */
export type DayMode = "continuous" | "operation" | "closed";

const DAY_MODES: { id: DayMode; label: string; sub: string; dot: string }[] = [
  { id: "continuous", label: "Continuous", sub: "Records all day",        dot: TONE_CLASSES.info.dot },
  { id: "operation",  label: "Operation",  sub: "Records between hours",  dot: TONE_CLASSES.success.dot },
  { id: "closed",     label: "Closed",     sub: "No recording",           dot: "bg-muted-foreground/40" },
];

/* The modes a day can be switched into. Closed is not one of them — it is what
   a day is once both switches are off. */
const MODE_SWITCHES = DAY_MODES.filter((m) => m.id !== "closed");

interface DayHours {
  mode: DayMode;
  start: string;
  end: string;
}

export interface OperationConfig {
  source: "site" | "custom";
  days: Record<Weekday, DayHours>;
}

/** A site open round the clock is stored as 00:00–23:59. */
const isAllDay = (start: string, end: string) => start === "00:00" && end === "23:59";
const hoursLabel = (start: string, end: string) =>
  isAllDay(start, end) ? "All day" : `${formatTimeOfDay(start)} – ${formatTimeOfDay(end)}`;

/** Today's weekday id, for the coverage strip's custom row. */
function todayWeekday(): Weekday {
  return WEEKDAYS[(new Date().getDay() + 6) % 7].id;
}

/** Hours an operation day records by — the site's own, or the day's. */
function hoursFor(site: SiteData, config: OperationConfig, day: DayHours) {
  const h = site.operatingHours;
  return config.source === "site" && h ? { start: h.from, end: h.to } : { start: day.start, end: day.end };
}

/** Which modes the week actually uses, so only those get settings below. */
function weekModes(config: OperationConfig): Set<DayMode> {
  return new Set(WEEKDAYS.map((d) => config.days[d.id].mode));
}

/* The week sits above every recording mode: a day is the thing that records,
   and the mode is what it records in. Pick a day, pick its mode. */
function WeeklySchedule({ site, config, activeDay, onActiveDay, onChange, onPatch }: {
  site: SiteData;
  config: OperationConfig;
  /** Lifted, because the mode cards below only show what this day records in. */
  activeDay: Weekday;
  onActiveDay: (d: Weekday) => void;
  onChange: (next: OperationConfig) => void;
  /** Turning a day to operation switches standby and motion on with it. */
  onPatch: (id: RecordingTypeId, next: Partial<RecordingTypeConfig>) => void;
}) {
  const h = site.operatingHours;
  // A site open all day has no hours to record by — its days need their own.
  const allDaySite = !h || isAllDay(h.from, h.to);
  const setDay = (id: Weekday, next: Partial<DayHours>) =>
    onChange({ ...config, days: { ...config.days, [id]: { ...config.days[id], ...next } } });
  const copyMonday = () =>
    onChange({ ...config, days: Object.fromEntries(WEEKDAYS.map((d) => [d.id, { ...config.days.mon }])) as OperationConfig["days"] });

  const day = config.days[activeDay];
  const d = WEEKDAYS.find((w) => w.id === activeDay)!;
  const nextDay = WEEKDAYS[(WEEKDAYS.findIndex((w) => w.id === activeDay) + 1) % 7].label;
  const anyOperation = weekModes(config).has("operation");
  const siteHours = hoursFor(site, config, day);
  const overnight = day.mode === "operation" && siteHours.end <= siteHours.start;

  /* Operation brings standby and motion with it — a site that keeps hours has
     to do something outside them. They are switched on here and shown by their
     own cards below, so the day itself only carries the two real choices. */
  const startOperation = () => {
    setDay(activeDay, { mode: "operation" });
    onPatch("standby", { enabled: true });
    onPatch("motion", { enabled: true });
  };

  const modeRows = MODE_SWITCHES.map((m) => ({
    id: m.id,
    label: m.label,
    sub: m.sub,
    dot: m.dot,
    on: day.mode === m.id,
    blocked: m.id === "operation" && day.mode === "continuous",
    aria: `${m.label} on ${d.label}`,
    onChange: (v: boolean) => {
      if (m.id === "operation" && v) startOperation();
      else setDay(activeDay, { mode: v ? (m.id as DayMode) : "closed" });
    },
  }));

  return (
    <div className="rounded-lg border border-border bg-background px-3.5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Weekly Schedule</span>
        <button type="button" onClick={copyMonday} className="flex items-center gap-1 text-2xs font-semibold text-primary hover:underline">
          <Copy className="size-3" />Copy Monday to all days
        </button>
      </div>
      <p className="mt-1 text-xs leading-snug text-foreground">
        Pick a day to set the mode it records in. Each day runs on its own — a site can be continuous on
        one and keep operation hours on the next.
      </p>

      {/* The whole week at a glance — one letter a day, with a dot for how it
          records. Picking a day opens it below. */}
      <div role="tablist" aria-label="Day of week" className="mt-3 flex flex-wrap gap-1">
        {WEEKDAYS.map((w) => {
          const wd = config.days[w.id];
          const mode = DAY_MODES.find((m) => m.id === wd.mode)!;
          const picked = w.id === activeDay;
          return (
            <button
              key={w.id}
              type="button"
              role="tab"
              aria-selected={picked}
              aria-label={`${w.label} — ${mode.label}`}
              title={`${w.label} — ${mode.label}`}
              onClick={() => onActiveDay(w.id)}
              className={cn(
                "flex size-8 flex-col items-center justify-center gap-0.5 rounded-md border transition-colors",
                picked ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
              )}
            >
              <span className={cn("text-xs font-semibold leading-none", picked ? "text-foreground" : "text-muted-foreground")}>
                {w.initial}
              </span>
              <span className={cn("size-1 rounded-full", mode.dot)} />
            </button>
          );
        })}
      </div>

      <div className="mt-3 rounded-md border border-border px-3.5 py-3">
        <label className={FIELD_LABEL}>{d.label} records</label>
        {/* A switch a mode, rather than one pick across all of them. Continuous
            fills the day, so it leaves operation nothing to run in — turning it
            on holds operation off rather than silently overriding it. Both off
            is a closed day. Standby and motion only appear once there is an
            operation day for them to sit outside of. */}
        <div className="space-y-2">
          {modeRows.map((r) => (
            <div
              key={r.id}
              className={cn(
                "flex items-start gap-3 rounded-md border px-3 py-2.5 transition-colors",
                r.blocked ? "border-border opacity-45" : r.on ? "border-primary/40 bg-primary/5" : "border-border"
              )}
            >
              <Toggle checked={r.on} disabled={r.blocked} onChange={r.onChange} label={r.aria} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={cn("size-2 shrink-0 rounded-full", r.dot)} />
                  <span className="text-md font-semibold text-foreground">{r.label}</span>
                </div>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  {r.blocked ? "Continuous already covers the whole day." : r.sub}
                </p>
              </div>
            </div>
          ))}
        </div>

        {day.mode === "operation" && (
          <div className="mt-2.5">
            {config.source === "site" ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-9 flex-1 items-center gap-1.5 rounded-md border border-border bg-muted px-3 text-base text-muted-foreground">
                  <Clock className="size-3.5" />
                  {hoursLabel(siteHours.start, siteHours.end)} · site hours
                </span>
                <button type="button" onClick={() => onChange({ ...config, source: "custom" })}
                  className="text-2xs font-semibold text-primary hover:underline">
                  Set hours per day
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 items-center gap-2">
                <TimeSelect value={day.start} onChange={(v) => setDay(activeDay, { start: v })} aria-label={`${d.label} start time`} />
                <TimeSelect value={day.end} onChange={(v) => setDay(activeDay, { end: v })} aria-label={`${d.label} end time`} />
                {!allDaySite && (
                  <button type="button" onClick={() => onChange({ ...config, source: "site" })}
                    className="col-span-2 text-left text-2xs font-semibold text-primary hover:underline">
                    Use the site's hours on every day instead
                  </button>
                )}
              </div>
            )}
            {overnight && (
              <span className="mt-1.5 flex items-center gap-1 text-2xs text-info">
                <Info className="size-3" />Runs past midnight into {nextDay}
              </span>
            )}
          </div>
        )}
        {day.mode === "continuous" && (
          <p className="mt-2 text-xs text-muted-foreground">Records around the clock on {d.label} — standby does not run.</p>
        )}
        {day.mode === "closed" && (
          <p className="mt-2 text-xs text-muted-foreground">Both off — nothing is recorded on {d.label}.</p>
        )}
      </div>

      {anyOperation && config.source === "site" && (
        <div className="mt-2">
          <Note>The site's hours are set in Site Management, so a change there applies here too.</Note>
        </div>
      )}
    </div>
  );
}

/* ── Per-site schedule ───────────────────────────────────────────────── */

/* The week decides what runs: each day records continuously, by operation
   hours with standby (and motion-based inside it) outside them, or not at all.
   `configs` holds the quality and windows each mode uses when a day calls for
   it — it no longer decides whether that mode runs. */

export interface SiteSchedule {
  configs: Record<RecordingTypeId, RecordingTypeConfig>;
  operation: OperationConfig;
}

/** A site open round the clock records continuously; one that keeps hours records by them. */
function defaultSchedule(site: SiteData): SiteSchedule {
  const h = site.operatingHours;
  const roundTheClock = !h || isAllDay(h.from, h.to);
  // A round-the-clock site has no hours of its own, so operation starts from an ordinary working day.
  const from = roundTheClock ? "08:00" : h.from;
  const to = roundTheClock ? "20:00" : h.to;
  const workday: DayHours = { mode: "operation", start: from, end: to };
  const weekend: DayHours = { mode: "closed", start: from, end: to };
  const everyDay = (mode: DayMode): Record<Weekday, DayHours> =>
    Object.fromEntries(WEEKDAYS.map((d) => [d.id, { mode, start: from, end: to }])) as Record<Weekday, DayHours>;
  return {
    configs: {
      ...DEFAULT_CONFIG,
      // Quality is always editable; the week decides which modes actually run.
      continuous: { ...DEFAULT_CONFIG.continuous, enabled: true },
      operation: { ...DEFAULT_CONFIG.operation, enabled: true },
      // Standby fills the hours outside operation, so it starts at closing and ends at opening.
      standby: { ...DEFAULT_CONFIG.standby, startTime: to, endTime: from },
      motion: { ...DEFAULT_CONFIG.motion, startTime: to, endTime: from },
    },
    operation: {
      source: roundTheClock ? "custom" : "site",
      // A round-the-clock site records continuously every day; one that keeps
      // hours works weekdays and closes at the weekend.
      days: roundTheClock
        ? everyDay("continuous")
        : { mon: workday, tue: workday, wed: workday, thu: workday, fri: workday, sat: weekend, sun: weekend },
    },
  };
}

/** The modes a site records with across the week, for the row's chips. */
function activeTypes(s: SiteSchedule): RecordingTypeId[] {
  const modes = weekModes(s.operation);
  const out: RecordingTypeId[] = [];
  if (modes.has("continuous")) out.push("continuous");
  if (modes.has("operation")) {
    out.push("operation");
    if (s.configs.standby.enabled) out.push("standby");
    if (s.configs.standby.enabled && s.configs.motion.enabled) out.push("motion");
  }
  return out;
}

/* ── 24-hour coverage strip ──────────────────────────────────────────── */

function toPct(time: string) {
  const [h, m] = time.split(":").map(Number);
  return ((h * 60 + m) / (24 * 60)) * 100;
}

function spansOf(start: string, end: string) {
  const a = toPct(start);
  const b = toPct(end);
  return b > a ? [{ left: a, width: b - a }] : [{ left: a, width: 100 - a }, { left: 0, width: b }];
}

/** One site's day: continuous across it, or operation hours with standby and motion around them. */
function CoverageStrip({ site, schedule }: { site: SiteData; schedule: SiteSchedule }) {
  const { configs, operation } = schedule;
  const today = todayWeekday();

  /* A row per day, so the week reads top to bottom. Each bar carries the modes
     that day runs, layered: operation hours, the standby window around them,
     and motion drawn as a band inside standby, which is where it triggers. */
  type Band = { cls: string; spans: { left: number; width: number }[]; inset?: boolean };
  function bandsFor(day: DayHours): { bands: Band[]; note: string } {
    if (day.mode === "continuous") {
      return { bands: [{ cls: TONE_CLASSES.info.bar, spans: [{ left: 0, width: 100 }] }], note: "All day" };
    }
    if (day.mode === "closed") return { bands: [], note: "Closed" };

    const hours = hoursFor(site, operation, day);
    const bands: Band[] = [{ cls: TONE_CLASSES.success.bar, spans: spansOf(hours.start, hours.end) }];
    if (configs.standby.enabled) {
      const w = configs.standby;
      bands.push({ cls: TONE_CLASSES.purple.bar, spans: spansOf(w.startTime, w.endTime) });
      if (configs.motion.enabled) {
        bands.push({ cls: TONE_CLASSES.warning.bar, spans: spansOf(w.startTime, w.endTime), inset: true });
      }
    }
    return { bands, note: hoursLabel(hours.start, hours.end) };
  }

  const legend = ([
    ["continuous", WEEKDAYS.some((d) => operation.days[d.id].mode === "continuous")],
    ["operation", WEEKDAYS.some((d) => operation.days[d.id].mode === "operation")],
    ["standby", configs.standby.enabled && WEEKDAYS.some((d) => operation.days[d.id].mode === "operation")],
    ["motion", configs.standby.enabled && configs.motion.enabled && WEEKDAYS.some((d) => operation.days[d.id].mode === "operation")],
  ] as const).filter(([, show]) => show).map(([id]) => typeById(id));

  return (
    <div className="rounded-lg border border-border bg-background px-3.5 py-3">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Weekly Coverage</p>

      <div className="space-y-1">
        {WEEKDAYS.map((w) => {
          const day = operation.days[w.id];
          const { bands, note } = bandsFor(day);
          const isToday = w.id === today;
          return (
            <div key={w.id} className="flex items-center gap-3">
              <span className={cn("w-10 shrink-0 text-xs", isToday ? "font-semibold text-foreground" : "text-muted-foreground")}>
                {w.label.slice(0, 3)}
              </span>
              <div className={cn("relative h-4 flex-1 overflow-hidden rounded bg-muted", isToday && "ring-1 ring-primary/40")}>
                {bands.map((b, bi) =>
                  b.spans.map((sp, i) => (
                    <div
                      key={`${bi}-${i}`}
                      className={cn("absolute rounded-sm", b.cls, b.inset ? "bottom-0 h-1.5 opacity-90" : "inset-y-0 opacity-80")}
                      style={{ left: `${sp.left}%`, width: `${sp.width}%` }}
                    />
                  ))
                )}
              </div>
              {/* Same 12-hour formatting as the time fields. */}
              <span className={cn("w-32 shrink-0 text-right font-mono text-2xs", isToday ? "text-foreground" : "text-muted-foreground")}>
                {note}
              </span>
            </div>
          );
        })}
      </div>

      {/* Hour ruler — same column widths as the rows above so it lines up. */}
      <div className="mt-2 flex items-center gap-3">
        <span className="w-10 shrink-0" />
        <div className="flex flex-1 justify-between font-mono text-3xs text-muted-foreground">
          {[0, 6, 12, 18, 24].map((hr) => (
            <span key={hr}>{String(hr).padStart(2, "0")}:00</span>
          ))}
        </div>
        <span className="w-32 shrink-0" />
      </div>

      {/* Rows are days now, so the modes need naming somewhere. */}
      {legend.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-2.5">
          {legend.map((def) => (
            <span key={def.id} className="flex items-center gap-1.5 text-2xs text-muted-foreground">
              <span className={cn("size-1.5 rounded-full", TONE_CLASSES[def.tone].dot)} />
              {def.label}
              {def.id === "motion" && <span className="text-muted-foreground/60">· inside standby, when triggered</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Editing one site ────────────────────────────────────────────────── */

function SiteEditor({ site, schedule, onSave, onCancel }: {
  site: SiteData;
  schedule: SiteSchedule;
  onSave: (next: SiteSchedule) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = React.useState(schedule);
  const [activeDay, setActiveDay] = React.useState<Weekday>(todayWeekday);
  const continuous = typeById("continuous");
  const standby = typeById("standby");

  function patch(id: RecordingTypeId, next: Partial<RecordingTypeConfig>) {
    setDraft((d) => {
      const configs = { ...d.configs, [id]: { ...d.configs[id], ...next } };
      /* A nested type records inside its parent's hours, so moving the
         parent's window moves it too. */
      if (next.startTime || next.endTime) {
        childrenOf(id).forEach((child) => {
          configs[child.id] = { ...configs[child.id], startTime: configs[id].startTime, endTime: configs[id].endTime };
        });
      }
      return { ...d, configs };
    });
  }

  const operation = typeById("operation");
  /* The cards show how the picked day records — a continuous day has no
     operation hours, so its controls would only be noise. */
  const dayMode = draft.operation.days[activeDay].mode;
  const everyDayClosed = [...weekModes(draft.operation)].every((m) => m === "closed");

  return (
    <div className="flex flex-col gap-3">
      <CoverageStrip site={site} schedule={draft} />

      {/* The week comes first, above every mode — it is what decides which of
          them run at all. The cards below only set how each one records. */}
      <WeeklySchedule
        site={site}
        config={draft.operation}
        activeDay={activeDay}
        onActiveDay={setActiveDay}
        onChange={(next) => setDraft((d) => ({ ...d, operation: next }))}
        onPatch={patch}
      />

      {/* A card only exists for a mode the picked day actually runs — the
          switches all live in the weekly schedule above. */}
      {dayMode === "continuous" && (
        <TypeRow def={continuous} config={draft.configs.continuous} configs={draft.configs}
          scheduledBy="Runs on the days set to Continuous" windowFromSchedule
          onChange={(next) => patch("continuous", next)} onChangeChild={patch} />
      )}

      {dayMode === "operation" && (
        <>
          <TypeRow def={operation} config={draft.configs.operation} configs={draft.configs}
            scheduledBy="Runs on the days set to Operation, by their hours" windowFromSchedule
            onChange={(next) => patch("operation", next)} onChangeChild={patch} />
          {/* Standby fills the hours outside operation, so it only has a job on
              an operation day — and only once it is switched on. */}
          {draft.configs.standby.enabled && (
            <TypeRow def={standby} config={draft.configs.standby} configs={draft.configs}
              scheduledBy="Runs outside operation hours"
              onChange={(next) => patch("standby", next)} onChangeChild={patch} />
          )}
        </>
      )}

      {dayMode === "closed" && (
        <div className="rounded-lg border border-border bg-background px-3.5 py-3">
          <Note>
            {everyDayClosed
              ? "Every day is closed, so this site records nothing. Set a day to Continuous or Operation above."
              : "This day is closed, so there is nothing to configure for it. Pick another day to see how it records."}
          </Note>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" className="gap-1.5" onClick={() => onSave(draft)}>
          <Check className="size-3.5" />
          Save {site.name}
        </Button>
      </div>
    </div>
  );
}

/* ── Section body ────────────────────────────────────────────────────── */

/* A list of sites, each with the modes it records in. The chevron opens a
   site's daily coverage; Edit opens it with the controls. */
export function RecordingSchedule() {
  const sites = useSitesStore((s) => s.sites);
  const [schedules, setSchedules] = React.useState<Record<string, SiteSchedule>>({});
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const scheduleOf = (site: SiteData) => schedules[site.id] ?? defaultSchedule(site);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Each site records either continuously, or by operation hours with standby and motion-based recording outside them.
        Open a site to see its day; edit it to change how it records.
      </p>
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-background">
        {sites.map((site) => {
          const schedule = scheduleOf(site);
          const open = openId === site.id;
          const editing = editingId === site.id;
          const cameras = MOCK_CAMERAS.filter((c) => c.siteId === site.id).length;
          const h = site.operatingHours;
          // Closed days say nothing about how a site records, so they are left out.
          const recording = [...weekModes(schedule.operation)].filter((m) => m !== "closed");
          const hours =
            recording.length === 0 ? "No recording"
              : recording.length > 1 ? "Varies by day"
                : recording[0] === "continuous" ? "Records 24/7"
                  : schedule.operation.source === "custom" ? "Custom weekly hours"
                    : h ? hoursLabel(h.from, h.to) : "Site hours";
          return (
            <li key={site.id}>
              <div className={cn("flex items-center gap-3 px-3.5 py-3", open && "bg-muted/20")}>
                <button
                  type="button"
                  onClick={() => { setOpenId(open ? null : site.id); if (open) setEditingId(null); }}
                  aria-expanded={open}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                    <MapPin className="size-4" />
                  </span>
                  <span className="min-w-32 flex-1">
                    <span className="block truncate text-base font-semibold text-foreground">{site.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{cameras} camera{cameras === 1 ? "" : "s"} · {hours}</span>
                  </span>
                  {/* The modes this site records in. */}
                  <span className="hidden min-w-0 flex-wrap justify-end gap-1.5 sm:flex">
                    {activeTypes(schedule).map((id) => {
                      const def = typeById(id);
                      return (
                        <span key={id} className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-2xs font-bold uppercase tracking-wider", TONE_CLASSES[def.tone].chip)}>
                          <span className={cn("size-1.5 rounded-full", TONE_CLASSES[def.tone].dot)} />
                          {def.label}
                        </span>
                      );
                    })}
                  </span>
                </button>
                <Button
                  variant={editing ? "secondary" : "outline"}
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => { setOpenId(site.id); setEditingId(editing ? null : site.id); }}
                  aria-pressed={editing}
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
                <button
                  type="button"
                  onClick={() => { setOpenId(open ? null : site.id); if (open) setEditingId(null); }}
                  aria-label={open ? `Collapse ${site.name}` : `Show ${site.name}'s daily coverage`}
                  className="flex size-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ChevronDown className={cn("size-4 transition-transform duration-[var(--duration-fast)] ease-standard", open && "rotate-180")} />
                </button>
              </div>

              {open && (
                <div className="border-t border-border bg-card px-3.5 py-3.5">
                  {editing ? (
                    <SiteEditor
                      key={site.id}
                      site={site}
                      schedule={schedule}
                      onCancel={() => setEditingId(null)}
                      onSave={(next) => {
                        setSchedules((s) => ({ ...s, [site.id]: next }));
                        setEditingId(null);
                      }}
                    />
                  ) : (
                    <CoverageStrip site={site} schedule={schedule} />
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
