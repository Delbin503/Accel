import * as React from "react";
import { Check, ClipboardList, Plus, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { USE_CASES, USE_CASE_KEYS, type UseCaseKey } from "./taData";
import type { AssessmentInfo } from "./taModels";

/* Assessment pieces of Model Management: the basic info a Training Assessment
   model carries — its use case and the activities it assesses — as a form
   (Create Model, Edit Model) and as a read-only summary (model detail). */

/* ── Activities picker ─────────────────────────────────────────────────── */

export function ActivitiesPicker({
  useCase,
  value,
  onChange,
  invalid,
}: {
  useCase: UseCaseKey;
  value: string[];
  onChange: (next: string[]) => void;
  invalid?: boolean;
}) {
  const [custom, setCustom] = React.useState("");
  const options = [...new Set([...USE_CASES[useCase].activities, ...value])];

  function toggle(a: string) {
    onChange(value.includes(a) ? value.filter((x) => x !== a) : [...value, a]);
  }
  function addCustom() {
    const v = custom.trim();
    if (!v) return;
    if (!value.includes(v)) onChange([...value, v]);
    setCustom("");
  }

  return (
    <div className={cn("rounded-lg border bg-background p-2.5", invalid ? "border-sev-critical" : "border-border")}>
      <div className="flex flex-wrap gap-1.5">
        {options.map((a) => {
          const on = value.includes(a);
          return (
            <button
              key={a}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(a)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm font-medium transition-colors",
                on ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-muted/40 text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {on && <Check className="size-3" strokeWidth={3} />}
              {a}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
          placeholder="Add another activity"
          className="h-8 text-sm"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!custom.trim()}
          className="inline-flex h-8 flex-shrink-0 items-center gap-1 rounded-md border border-border px-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 disabled:opacity-40"
        >
          <Plus className="size-3.5" />
          Add
        </button>
      </div>
    </div>
  );
}

/* ── Use case select ───────────────────────────────────────────────────── */

export function UseCaseSelect({ value, onChange, invalid }: { value: UseCaseKey | ""; onChange: (v: UseCaseKey) => void; invalid?: boolean }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as UseCaseKey)}>
      <SelectTrigger className="h-10 w-full text-base" aria-invalid={invalid}>
        <SelectValue placeholder="Select a use case" />
      </SelectTrigger>
      <SelectContent>
        {USE_CASE_KEYS.map((k) => (
          <SelectItem key={k} value={k}>{USE_CASES[k].full}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ── Create / edit form block ──────────────────────────────────────────── */

export function AssessmentFields({
  value,
  onChange,
  errors,
  compact,
}: {
  value: { useCase: UseCaseKey | ""; activities: string[] };
  onChange: (next: { useCase: UseCaseKey | ""; activities: string[] }) => void;
  errors?: { useCase?: string; activities?: string };
  /** Edit mode in the detail panel uses the small uppercase labels. */
  compact?: boolean;
}) {
  const label = compact
    ? "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
    : "mb-1.5 block text-base font-semibold text-foreground";
  return (
    <>
      <div>
        <label className={label}>Use Case</label>
        <UseCaseSelect
          value={value.useCase}
          invalid={!!errors?.useCase}
          onChange={(k) => onChange({ useCase: k, activities: value.useCase === k ? value.activities : USE_CASES[k].defaultActivities })}
        />
        {errors?.useCase ? (
          <p className="mt-1 text-xs text-sev-critical">{errors.useCase}</p>
        ) : (
          <p className="mt-1 text-2xs text-muted-foreground">
            Sets who is assessed and what an attempt is. Camera and pose settings come from System Configuration › Camera Defaults.
          </p>
        )}
      </div>
      {value.useCase && (
        <div>
          <label className={label}>Activities</label>
          <ActivitiesPicker
            useCase={value.useCase}
            value={value.activities}
            invalid={!!errors?.activities}
            onChange={(activities) => onChange({ ...value, activities })}
          />
          {errors?.activities ? (
            <p className="mt-1 text-xs text-sev-critical">{errors.activities}</p>
          ) : (
            <p className="mt-1 text-2xs text-muted-foreground">
              {value.activities.length} selected · sessions pick from these.
            </p>
          )}
        </div>
      )}
    </>
  );
}

/* ── Read-only summary under the description ───────────────────────────── */

export function AssessmentSummary({ info }: { info: AssessmentInfo }) {
  const uc = USE_CASES[info.useCase];
  return (
    <div className="mt-3 grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:grid-cols-[180px_1fr]">
      <div>
        <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Use case</p>
        <p className="mt-0.5 text-base font-semibold text-foreground">{uc.full}</p>
        <p className="text-xs text-muted-foreground">
          Assesses {uc.people} · per {uc.unit}
        </p>
      </div>
      <div>
        <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Activities · {info.activities.length}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {info.activities.map((a) => (
            <span key={a} className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{a}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── View-mode column: what the model measures ─────────────────────────── */

export function AssessmentCriteriaColumn({ info }: { info: AssessmentInfo }) {
  const uc = USE_CASES[info.useCase];
  return (
    <div className="h-[460px] space-y-3 overflow-y-auto pr-1">
      <div className="rounded-xl border border-border bg-background p-3">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Target className="size-4 text-primary" />
          Criteria
        </p>
        <div className="divide-y divide-border/60">
          {uc.criteria.map(([name, target]) => (
            <div key={name} className="flex items-center justify-between gap-3 py-1.5 text-sm">
              <span className="text-foreground">{name}</span>
              <span className="font-mono text-xs text-muted-foreground">{target}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-background p-3">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <ClipboardList className="size-4 text-primary" />
          {info.useCase === "physio" ? "Compensations to detect" : "Faults to detect"}
        </p>
        <div className="flex flex-wrap gap-1">
          {uc.faults.map((f) => (
            <span key={f} className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">{f}</span>
          ))}
        </div>
      </div>
      <p className="px-1 text-xs leading-relaxed text-muted-foreground">
        Assessment models are scored against these criteria, so they need no detection rules. Pose mode, frame rate and the
        cameras each {uc.unit} needs are set in System Configuration › Camera Defaults.
      </p>
    </div>
  );
}
