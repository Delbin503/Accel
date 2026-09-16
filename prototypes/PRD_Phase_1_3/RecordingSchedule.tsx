import * as React from "react";
import { AlertTriangle, Clock, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeSelect } from "@/components/shared/TimeSelect";
import { formatTimeOfDay } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CONFIG,
  FPS_OPTIONS,
  RECORDING_TYPES,
  RESOLUTIONS,
  TONE_CLASSES,
  resolutionRank,
  type RecordingTypeConfig,
  type RecordingTypeDef,
  type RecordingTypeId,
} from "./recordingTypes";

/* Recording Schedule — the Phase 1.3 proposal, built to sit inside the
   System Configuration › Camera Defaults section. Field labels, control
   heights and row chrome copy that page so it drops straight in. */

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full border transition-colors",
        checked ? "border-primary bg-primary" : "border-border bg-muted"
      )}
    >
      <span className={cn("inline-block size-3.5 rounded-full bg-card shadow-sm transition-transform",
        checked ? "translate-x-[18px]" : "translate-x-0.5")} />
    </button>
  );
}

const FIELD_LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground";

/* ── One recording type ──────────────────────────────────────────────── */

function TypeRow({ def, config, onChange }: {
  def: RecordingTypeDef;
  config: RecordingTypeConfig;
  onChange: (next: Partial<RecordingTypeConfig>) => void;
}) {
  const tone = TONE_CLASSES[def.tone];
  const belowMinRes = resolutionRank(config.resolution) < resolutionRank(def.minResolution);
  const belowMinFps = config.fps < def.minFps;
  /* An end time at or before the start time means the window runs past
     midnight — legitimate for standby, so it is called out, not blocked. */
  const overnight = !def.alwaysOn && config.endTime <= config.startTime;

  return (
    <div className="rounded-lg border border-border bg-background px-3.5 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className={cn("rounded border px-1.5 py-px text-2xs font-bold uppercase tracking-wider", tone.chip)}>
              {def.label}
            </span>
            <span className="font-mono text-2xs text-muted-foreground">{def.ref}</span>
            {def.alwaysOn && (
              <span className="rounded border border-border bg-muted px-1.5 py-px text-2xs font-semibold text-muted-foreground">24/7</span>
            )}
          </div>
          <p className={cn("text-xs leading-snug", config.enabled ? "text-foreground" : "text-muted-foreground")}>
            {def.requirement}
          </p>
        </div>
        <Toggle checked={config.enabled} onChange={(v) => onChange({ enabled: v })} label={`Enable ${def.label} recording`} />
      </div>

      <div className={cn("mt-3 border-t border-border pt-3", !config.enabled && "pointer-events-none opacity-40")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>

        {(belowMinRes || belowMinFps || overnight || def.note) && (
          <div className="mt-3 space-y-1.5">
            {(belowMinRes || belowMinFps) && (
              <p className="flex items-start gap-1.5 text-xs text-warning">
                <AlertTriangle className="mt-0.5 size-3 flex-shrink-0" />
                {def.ref} requires at least {def.minResolution} at {def.minFps} fps — this is set below it.
              </p>
            )}
            {overnight && (
              <p className="flex items-start gap-1.5 text-xs text-info">
                <Info className="mt-0.5 size-3 flex-shrink-0" />
                Window runs overnight — {formatTimeOfDay(config.startTime)} through {formatTimeOfDay(config.endTime)} the next day.
              </p>
            )}
            {def.note && (
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3 flex-shrink-0" />
                {def.note}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 24-hour coverage strip ──────────────────────────────────────────── */

function CoverageStrip({ configs }: { configs: Record<RecordingTypeId, RecordingTypeConfig> }) {
  function toPct(time: string) {
    const [h, m] = time.split(":").map(Number);
    return ((h * 60 + m) / (24 * 60)) * 100;
  }

  return (
    <div className="rounded-lg border border-border bg-background px-3.5 py-3">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily Coverage</p>
      <div className="space-y-2">
        {RECORDING_TYPES.map((def) => {
          const cfg = configs[def.id];
          const tone = TONE_CLASSES[def.tone];
          const start = toPct(cfg.startTime);
          const end = toPct(cfg.endTime);
          /* A window that wraps past midnight draws as two bars. */
          const spans = def.alwaysOn
            ? [{ left: 0, width: 100 }]
            : end > start
              ? [{ left: start, width: end - start }]
              : [{ left: start, width: 100 - start }, { left: 0, width: end }];

          return (
            <div key={def.id} className="flex items-center gap-3">
              <span className="w-24 shrink-0 truncate text-xs text-muted-foreground">{def.label}</span>
              <div className="relative h-4 flex-1 overflow-hidden rounded bg-muted">
                {cfg.enabled && spans.map((s, i) => (
                  <div key={i} className={cn("absolute inset-y-0 rounded-sm opacity-80", tone.bar)}
                    style={{ left: `${s.left}%`, width: `${s.width}%` }} />
                ))}
              </div>
              {/* Same 12-hour formatting as the time fields below. */}
              <span className="w-32 shrink-0 text-right font-mono text-2xs text-muted-foreground">
                {cfg.enabled
                  ? def.alwaysOn
                    ? "All day"
                    : `${formatTimeOfDay(cfg.startTime)} – ${formatTimeOfDay(cfg.endTime)}`
                  : "off"}
              </span>
            </div>
          );
        })}
      </div>
      {/* Hour ruler — same column widths as the rows above so it lines up. */}
      <div className="mt-2 flex items-center gap-3">
        <span className="w-24 shrink-0" />
        <div className="flex flex-1 justify-between font-mono text-3xs text-muted-foreground">
          {[0, 6, 12, 18, 24].map((h) => (
            <span key={h}>{String(h).padStart(2, "0")}:00</span>
          ))}
        </div>
        <span className="w-32 shrink-0" />
      </div>
    </div>
  );
}

/* ── Section body ────────────────────────────────────────────────────── */

export function RecordingSchedule() {
  const [configs, setConfigs] = React.useState(DEFAULT_CONFIG);

  function patch(id: RecordingTypeId, next: Partial<RecordingTypeConfig>) {
    setConfigs((c) => ({ ...c, [id]: { ...c[id], ...next } }));
  }

  const enabledCount = RECORDING_TYPES.filter((t) => configs[t.id].enabled).length;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Each type records independently — a camera produces one recording per enabled type, per day.
        Turn off any the deployment does not need.{" "}
        <strong className="text-foreground">{enabledCount} of {RECORDING_TYPES.length} enabled.</strong>
      </p>
      <CoverageStrip configs={configs} />
      {RECORDING_TYPES.map((def) => (
        <TypeRow key={def.id} def={def} config={configs[def.id]} onChange={(next) => patch(def.id, next)} />
      ))}
    </div>
  );
}
