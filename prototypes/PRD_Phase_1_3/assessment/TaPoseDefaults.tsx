import * as React from "react";
import { toast } from "sonner";
import { AlertTriangle, Box, CheckCircle2, Cctv, Info, Layers, RotateCcw, Square } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { USE_CASES, USE_CASE_KEYS, type PoseMode, type UseCaseKey } from "./taData";
import { requiredCameras, unitReadiness, usePoseStore, type FewerCameras, type Smoothing } from "./taPose";
import { useTaModelsStore } from "./taModels";

/* System Configuration › Camera Defaults › Assessment Cameras & Pose.

   Pose settings moved here from the model wizard: they are a property of the
   cameras, not of a model. Picking 3D or 2D pose changes the camera
   requirements right underneath — how many views each bay, rack or room
   needs, and at what frame rate — and the readiness check against the
   cameras already installed at each site. */

const LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground";

function Segmented<T extends string | number>({
  value, options, onChange, label,
}: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex h-9 items-center rounded-md border border-border bg-background p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex h-full flex-1 items-center justify-center rounded px-2.5 text-sm font-semibold transition-colors",
            o.value === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ModeCard({
  mode, active, onPick, title, body, icon: Icon,
}: { mode: PoseMode; active: boolean; onPick: (m: PoseMode) => void; title: string; body: string; icon: React.ElementType }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={() => onPick(mode)}
      className={cn(
        "flex items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors",
        active ? "border-primary/60 bg-primary/[0.06]" : "border-border bg-background hover:border-primary/30",
      )}
    >
      <span className={cn("mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded-full border-2", active ? "border-primary" : "border-muted-foreground/40")}>
        {active && <span className="size-1.5 rounded-full bg-primary" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("flex items-center gap-1.5 text-base font-semibold", active ? "text-primary" : "text-foreground")}>
          <Icon className="size-4" />
          {title}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{body}</p>
      </div>
    </button>
  );
}

export function TaPoseDefaults() {
  const [uc, setUc] = React.useState<UseCaseKey>("golf");
  const s = usePoseStore((st) => st.settings[uc]);
  const patch = usePoseStore((st) => st.patch);
  const reset = usePoseStore((st) => st.reset);
  const models = useTaModelsStore((st) => st.models).filter((m) => m.assessment?.useCase === uc);
  const u = USE_CASES[uc];
  const pos = u.positions[s.mode];
  const need = requiredCameras(uc, s.mode);
  const readiness = unitReadiness(uc, s);
  const ready = readiness.filter((r) => r.ok).length;
  const reducedBlocked = !u.fewer.reducedAllowed && s.mode === "3d";

  function setMode(mode: PoseMode) {
    if (mode === s.mode) return;
    const next = USE_CASES[uc].positions[mode].required;
    patch(uc, { mode, fewer: !u.fewer.reducedAllowed && mode === "3d" ? "block" : s.fewer });
    toast.message(`${u.label} pose set to ${mode.toUpperCase()}`, {
      description: `Camera requirements updated · each ${u.unit} now needs ${next} camera${next === 1 ? "" : "s"}.`,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Use case + scope */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div data-slot="button-group" className="flex h-8 items-center rounded-md border border-border bg-background p-0.5">
          {USE_CASE_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setUc(k)}
              className={cn(
                "inline-flex h-full items-center rounded px-3 text-sm font-semibold transition-colors",
                uc === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {USE_CASES[k].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            Applies to {models.length === 0 ? "every new " + u.label.toLowerCase() + " model" : models.map((m) => m.name).join(", ")}
          </p>
          <button
            type="button"
            onClick={() => { reset(uc); toast.message(`${u.label} pose settings reset to defaults`); }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="size-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Pose settings */}
      <div>
        <p className={LABEL}>Pose Mode</p>
        <div role="radiogroup" aria-label="Pose mode" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ModeCard mode="3d" active={s.mode === "3d"} onPick={setMode} icon={Box} title="3D pose · two views"
            body="Joint angles in space: turn, rotation, left–right differences. Needs two cameras about 90° apart." />
          <ModeCard mode="2d" active={s.mode === "2d"} onPick={setMode} icon={Square} title="2D pose · one view"
            body="Angles in the camera's plane only. One camera per unit; faster to set up, fewer measures." />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={LABEL}>Frame Rate</label>
          <Select value={String(s.fps)} onValueChange={(v) => patch(uc, { fps: Number(v) })}>
            <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {u.pose.fpsOptions.map((f) => (
                <SelectItem key={f} value={String(f)}>
                  {f} fps{f === u.pose.fps ? " · recommended" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <p className={LABEL}>Smoothing</p>
          <Segmented<Smoothing>
            label="Smoothing"
            value={s.smoothing}
            onChange={(v) => patch(uc, { smoothing: v })}
            options={[{ value: "Light", label: "Light" }, { value: "Medium", label: "Medium" }, { value: "Strong", label: "Strong" }]}
          />
        </div>
        <div>
          <p className={LABEL}>Keypoints</p>
          <div className="flex h-9 items-center rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground">{u.pose.keypoints}</div>
        </div>
      </div>

      {/* Camera requirements — follow the pose mode */}
      <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="flex items-center gap-1.5 text-base font-bold text-foreground">
              <Cctv className="size-4 text-primary" />
              Camera requirements · per {u.unit}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Set by {s.mode.toUpperCase()} pose at {s.fps} fps. {pos.why}</p>
          </div>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {need} camera{need === 1 ? "" : "s"} required
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {pos.names.map((name, i) => {
            const required = i < pos.required;
            return (
              <div key={name} className="rounded-lg border border-border bg-card px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{name.replace(" (optional)", "")}</p>
                  <span className={cn("rounded-full px-2 py-px text-2xs font-semibold", required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                    {required ? "Required" : "Optional"}
                  </span>
                </div>
                <p className="mt-1 font-mono text-2xs text-muted-foreground">≥ {s.fps} fps · {u.resolution}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-px size-3.5 flex-shrink-0" />
          {u.placement}
        </p>
      </div>

      {/* Fewer cameras than required */}
      <div>
        <p className={LABEL}>When a {u.unit} has fewer cameras</p>
        <div role="radiogroup" aria-label="Fewer cameras" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {([
            ["reduced", "Run with reduced analysis", s.mode === "2d" ? "Not needed in 2D: one camera is the requirement." : u.fewer.reduced],
            ["block", `Block that ${u.unit}`, u.fewer.block],
          ] as [FewerCameras, string, string][]).map(([key, title, body]) => {
            const disabled = key === "reduced" && reducedBlocked;
            const active = s.fewer === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={disabled}
                onClick={() => patch(uc, { fewer: key })}
                className={cn(
                  "flex items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                  active ? "border-primary/60 bg-primary/[0.06]" : "border-border bg-background hover:border-primary/30",
                )}
              >
                <span className={cn("mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded-full border-2", active ? "border-primary" : "border-muted-foreground/40")}>
                  {active && <span className="size-1.5 rounded-full bg-primary" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">{title}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{disabled ? "Not allowed: clinical angles need both views." : body}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Readiness at the sites */}
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-3.5 py-2.5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Layers className="size-4 text-muted-foreground" />
            Installed cameras against these settings
          </p>
          <span className={cn("text-xs font-semibold", ready === readiness.length ? "text-success" : "text-warning")}>
            {ready} of {readiness.length} {u.units} ready
          </span>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-4">
          {readiness.map((r) => (
            <div key={`${r.areaId}-${r.unit}`} className="bg-card px-3 py-2">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {r.ok ? <CheckCircle2 className="size-3.5 text-success" /> : <AlertTriangle className="size-3.5 text-warning" />}
                {r.unit}
              </p>
              <p className="text-2xs text-muted-foreground">{r.siteName} · {r.areaName}</p>
              <p className={cn("mt-0.5 text-2xs", r.ok ? "text-muted-foreground" : "text-warning")}>
                {r.ok ? `${r.cameras.length} camera${r.cameras.length === 1 ? "" : "s"} · ${s.fps} fps` : r.issue}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <label className="flex items-start gap-3 rounded-lg border border-border bg-background px-3.5 py-3">
        <input
          type="checkbox"
          className="mt-0.5 size-4 accent-[var(--primary)]"
          checked={s.faceBlur}
          disabled={uc === "physio"}
          onChange={(e) => patch(uc, { faceBlur: e.target.checked })}
        />
        <span className="min-w-0">
          <span className="block text-base font-semibold text-foreground">Blur faces in stored clips</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {uc === "physio" ? "Locked on: clinical records always blur faces." : "Pose is read before blurring, so measures are unaffected."}
          </span>
        </span>
      </label>
    </div>
  );
}
