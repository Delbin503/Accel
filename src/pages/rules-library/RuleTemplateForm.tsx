import * as React from "react";
import { Check, ChevronDown, Plus, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { OBJECT_CLASSES, PARAMETER_META, ZONE_OPTIONS } from "@/mocks/ruleTemplates";
import type {
  DurationUnit,
  GeneratedRulePayload,
  RuleConfig,
  RuleParameterId,
  RuleTemplateParams,
} from "@/types/ruleTemplates";

/* ── Small building blocks ───────────────────────────────────────────────── */

/** Field header with the hint and the control that drops the field entirely. */
function FieldHeader({
  field,
  onRemove,
}: {
  field: RuleParameterId;
  onRemove: () => void;
}) {
  const meta = PARAMETER_META[field];
  return (
    <div className="mb-1.5 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <label className="block text-base font-semibold text-foreground">{meta.label}</label>
        <p className="text-xs text-muted-foreground">{meta.hint}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        title={`Remove ${meta.label}`}
        aria-label={`Remove ${meta.label}`}
        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded border border-border text-muted-foreground transition-colors duration-[var(--duration-fast)] ease-standard hover:border-sev-critical/40 hover:text-sev-critical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-3" />
      </button>
    </div>
  );
}

function MultiSelect({
  values,
  options,
  placeholder,
  onToggle,
  invalid,
}: {
  values: string[];
  options: string[];
  placeholder: string;
  onToggle: (v: string) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-invalid={invalid}
          className={cn(
            "flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-1.5 text-left text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-input/30",
            invalid && "border-destructive"
          )}
        >
          {values.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <span className="flex flex-wrap gap-1">
              {values.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-1.5 py-px font-mono text-2xs font-semibold text-primary"
                >
                  {v}
                  <X
                    className="size-2.5 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle(v);
                    }}
                  />
                </span>
              ))}
            </span>
          )}
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-[260px] w-64 overflow-y-auto p-1.5">
        {options.map((opt) => {
          const checked = values.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <span
                className={cn(
                  "flex size-3.5 shrink-0 items-center justify-center rounded border transition-colors",
                  checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                )}
              >
                {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
              </span>
              <span className="font-mono">{opt}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

/** Chips for fields the operator has removed, so they can be added back. */
function AddFieldBar({
  available,
  onAdd,
}: {
  available: RuleParameterId[];
  onAdd: (f: RuleParameterId) => void;
}) {
  if (available.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
      <span className="inline-flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-muted-foreground">
        <SlidersHorizontal className="size-3" />
        Add field
      </span>
      {available.map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => onAdd(f)}
          className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border px-2.5 py-1 text-sm font-medium text-muted-foreground transition-colors duration-[var(--duration-fast)] ease-standard hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-3" />
          {PARAMETER_META[f].label}
        </button>
      ))}
    </div>
  );
}

/* ── Parameter form ──────────────────────────────────────────────────────── */

/** Shared width envelope so every control lines up down the column. */
const FIELD_WIDTH = "max-w-sm";

/** Display order for the fields, matching the rule form spec. */
const FIELD_ORDER: RuleParameterId[] = [
  "object_class",
  "confidence",
  "zone",
  "count_threshold",
  "duration",
];

export function RuleTemplateForm({
  config,
  onChange,
  invalidClasses,
}: {
  config: RuleConfig;
  onChange: (next: RuleConfig) => void;
  invalidClasses?: boolean;
}) {
  function patchParams(p: Partial<RuleTemplateParams>) {
    onChange({ ...config, params: { ...config.params, ...p } });
  }

  function removeField(f: RuleParameterId) {
    onChange({ ...config, fields: config.fields.filter((x) => x !== f) });
  }

  function addField(f: RuleParameterId) {
    onChange({
      ...config,
      fields: FIELD_ORDER.filter((x) => x === f || config.fields.includes(x)),
    });
  }

  function toggleClass(c: string) {
    const has = config.params.objectClasses.includes(c);
    patchParams({
      objectClasses: has
        ? config.params.objectClasses.filter((x) => x !== c)
        : [...config.params.objectClasses, c],
    });
  }

  const has = (f: RuleParameterId) => config.fields.includes(f);
  const active = FIELD_ORDER.filter(has);
  const available = FIELD_ORDER.filter((f) => !has(f));

  return (
    <div>
      <div className="mb-2">
        <h2 className="text-lg font-bold text-foreground">Rule Parameters</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {active.length === 0
            ? "No parameters — this rule fires on any detection."
            : `${active.length} parameter${active.length === 1 ? "" : "s"} on this rule. Remove any you don't need.`}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        {active.length === 0 ? (
          <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 text-muted-foreground">
            <SlidersHorizontal className="size-5 opacity-40" />
            <p className="text-base">Add a parameter to narrow this rule</p>
          </div>
        ) : (
          <div className="space-y-4">
            {has("object_class") && (
              <div>
                <FieldHeader field="object_class" onRemove={() => removeField("object_class")} />
                <div className={FIELD_WIDTH}>
                <MultiSelect
                  values={config.params.objectClasses}
                  options={OBJECT_CLASSES}
                  placeholder="Select object classes…"
                  onToggle={toggleClass}
                  invalid={invalidClasses}
                />
                </div>
                {invalidClasses && (
                  <p className="mt-1 text-xs text-sev-critical">Pick at least one object class.</p>
                )}
              </div>
            )}

            <div className="space-y-4">
              {has("confidence") && (
                <div>
                  <FieldHeader field="confidence" onRemove={() => removeField("confidence")} />
                  <div className={cn(FIELD_WIDTH, "flex items-center gap-2")}>
                    <span className="rounded border border-border bg-muted px-2 py-1 font-mono text-sm text-muted-foreground">
                      &gt;=
                    </span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={config.params.confidence}
                      onChange={(e) => patchParams({ confidence: Number(e.target.value) })}
                      className="h-10 text-base"
                    />
                    <span className="w-14 shrink-0 text-base text-muted-foreground">%</span>
                  </div>
                </div>
              )}

              {has("zone") && (
                <div>
                  <FieldHeader field="zone" onRemove={() => removeField("zone")} />
                  <Select
                    value={config.params.zoneId}
                    onValueChange={(v) => patchParams({ zoneId: v })}
                  >
                    <SelectTrigger className={cn(FIELD_WIDTH, "h-10 w-full text-base")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ZONE_OPTIONS.map((z) => (
                        <SelectItem key={z.id} value={z.id}>
                          {z.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {has("count_threshold") && (
                <div>
                  <FieldHeader
                    field="count_threshold"
                    onRemove={() => removeField("count_threshold")}
                  />
                  <div className={cn(FIELD_WIDTH, "flex items-center gap-2")}>
                    <span className="rounded border border-border bg-muted px-2 py-1 font-mono text-sm text-muted-foreground">
                      &gt;=
                    </span>
                    <Input
                      type="number"
                      min={1}
                      value={config.params.countThreshold}
                      onChange={(e) => patchParams({ countThreshold: Number(e.target.value) })}
                      className="h-10 text-base"
                    />
                    <span className="w-14 shrink-0 text-base text-muted-foreground">objects</span>
                  </div>
                </div>
              )}

              {has("duration") && (
                <div>
                  <FieldHeader field="duration" onRemove={() => removeField("duration")} />
                  <div className={cn(FIELD_WIDTH, "flex items-center gap-2")}>
                    <span className="rounded border border-border bg-muted px-2 py-1 font-mono text-sm text-muted-foreground">
                      &gt;
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={config.params.duration}
                      onChange={(e) => patchParams({ duration: Number(e.target.value) })}
                      className="h-10 text-base"
                    />
                    <Select
                      value={config.params.durationUnit}
                      onValueChange={(v) => patchParams({ durationUnit: v as DurationUnit })}
                    >
                      <SelectTrigger className="h-10 w-[7.5rem] shrink-0 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seconds">seconds</SelectItem>
                        <SelectItem value="minutes">minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <AddFieldBar available={available} onAdd={addField} />
          </div>
        )}

        {active.length === 0 && available.length > 0 && (
          <AddFieldBar available={available} onAdd={addField} />
        )}
      </div>
    </div>
  );
}

/* ── Generated payload preview ───────────────────────────────────────────── */

export function PayloadPreview({ payload }: { payload: GeneratedRulePayload }) {
  return (
    <>
      <p className="text-sm font-semibold text-foreground">Generated Rule</p>
      <p className="text-xs text-muted-foreground">
        The payload Accel creates from this form.
      </p>
      <pre className="overflow-x-auto rounded-lg border border-border bg-background p-3 font-mono text-2xs leading-relaxed text-foreground">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </>
  );
}
