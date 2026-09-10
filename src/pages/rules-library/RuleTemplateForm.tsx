import * as React from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  availableFields,
  newClassParams,
  paramsFor,
  withField,
  withoutField,
} from "@/lib/ruleTemplates";
import { OBJECT_CLASSES, PARAMETER_META } from "@/mocks/ruleTemplates";
import type {
  ClassParams,
  DurationUnit,
  RuleConfig,
  RuleParameterId,
} from "@/types/ruleTemplates";

/* ── Object class picker ─────────────────────────────────────────────────── */

function ClassMultiSelect({
  values,
  onToggle,
  invalid,
}: {
  values: string[];
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
            <span className="text-muted-foreground">Select object classes…</span>
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
      <PopoverContent align="start" className="max-h-[260px] w-[--radix-popover-trigger-width] min-w-56 overflow-y-auto p-1.5">
        {OBJECT_CLASSES.map((opt) => {
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

/* ── Parameter row ───────────────────────────────────────────────────────── */

/** One parameter on one class: label, its control, and a remove button. */
function ParamRow({
  field,
  params,
  onChange,
  onRemove,
}: {
  field: RuleParameterId;
  params: ClassParams;
  onChange: (p: Partial<ClassParams>) => void;
  onRemove: () => void;
}) {
  const meta = PARAMETER_META[field];

  const control =
    field === "confidence" ? (
      <>
        <span className="rounded border border-border bg-muted px-2 py-1 font-mono text-sm text-muted-foreground">
          &gt;=
        </span>
        <Input
          type="number"
          min={0}
          max={100}
          value={params.confidence}
          onChange={(e) => onChange({ confidence: Number(e.target.value) })}
          className="h-9 flex-1 text-base"
        />
        <span className="w-16 shrink-0 text-sm text-muted-foreground">%</span>
      </>
    ) : field === "count_threshold" ? (
      <>
        <span className="rounded border border-border bg-muted px-2 py-1 font-mono text-sm text-muted-foreground">
          &gt;=
        </span>
        <Input
          type="number"
          min={1}
          value={params.countThreshold}
          onChange={(e) => onChange({ countThreshold: Number(e.target.value) })}
          className="h-9 flex-1 text-base"
        />
        <span className="w-16 shrink-0 text-sm text-muted-foreground">objects</span>
      </>
    ) : (
      <>
        <span className="rounded border border-border bg-muted px-2 py-1 font-mono text-sm text-muted-foreground">
          &gt;
        </span>
        <Input
          type="number"
          min={0}
          value={params.duration}
          onChange={(e) => onChange({ duration: Number(e.target.value) })}
          className="h-9 flex-1 text-base"
        />
        <Select
          value={params.durationUnit}
          onValueChange={(v) => onChange({ durationUnit: v as DurationUnit })}
        >
          <SelectTrigger className="h-9 w-16 shrink-0 px-2 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="seconds">sec</SelectItem>
            <SelectItem value="minutes">min</SelectItem>
          </SelectContent>
        </Select>
      </>
    );

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">{meta.label}</span>
        <button
          type="button"
          onClick={onRemove}
          title={`Remove ${meta.label}`}
          aria-label={`Remove ${meta.label}`}
          className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/60 transition-colors duration-[var(--duration-fast)] ease-standard hover:bg-sev-critical/10 hover:text-sev-critical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3" />
        </button>
      </div>
      <div className="flex items-center gap-2">{control}</div>
    </div>
  );
}

/** The `+` menu offering the parameters a class does not carry yet. */
function AddParamMenu({
  available,
  onAdd,
}: {
  available: RuleParameterId[];
  onAdd: (f: RuleParameterId) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const disabled = available.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          title={disabled ? "Every parameter is already on this class" : "Add a parameter"}
          aria-label="Add a parameter"
          className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors duration-[var(--duration-fast)] ease-standard hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1.5">
        <p className="px-2 pb-1.5 pt-1 text-2xs font-bold uppercase tracking-wider text-muted-foreground">
          Add parameter
        </p>
        {available.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => {
              onAdd(f);
              setOpen(false);
            }}
            className="flex w-full flex-col items-start gap-0.5 rounded px-2 py-1.5 text-left transition-colors hover:bg-muted"
          >
            <span className="text-sm font-medium text-foreground">{PARAMETER_META[f].label}</span>
            <span className="text-2xs leading-snug text-muted-foreground">
              {PARAMETER_META[f].hint}
            </span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/* ── One class card ──────────────────────────────────────────────────────── */

function ClassCard({
  cls,
  params,
  onChange,
  onRemove,
}: {
  cls: string;
  params: ClassParams;
  onChange: (next: ClassParams) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = React.useState(true);
  const available = availableFields(params);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border border-border bg-background"
    >
      <div className={cn("flex items-center gap-2 px-3 py-2", open && "border-b border-border")}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform duration-[var(--duration-fast)] ease-standard",
                !open && "-rotate-90"
              )}
            />
            <span className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-1.5 py-px font-mono text-2xs font-semibold text-primary">
              {cls}
            </span>
            <span className="min-w-0 flex-1 truncate text-2xs text-muted-foreground">
              {params.fields.length === 0
                ? "any detection"
                : `${params.fields.length} parameter${params.fields.length === 1 ? "" : "s"}`}
            </span>
          </button>
        </CollapsibleTrigger>
        <AddParamMenu
          available={available}
          onAdd={(f) => {
            onChange(withField(params, f));
            setOpen(true);
          }}
        />
        <button
          type="button"
          onClick={onRemove}
          title={`Remove ${cls}`}
          aria-label={`Remove ${cls}`}
          className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors duration-[var(--duration-fast)] ease-standard hover:border-sev-critical/40 hover:text-sev-critical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <CollapsibleContent>
        <div className="px-3 py-3">
          {params.fields.length === 0 ? (
            <p className="text-sm italic text-muted-foreground">
              No parameters — fires on any detection of this class.
            </p>
          ) : (
            <div className="space-y-3">
              {params.fields.map((f) => (
                <ParamRow
                  key={f}
                  field={f}
                  params={params}
                  onChange={(p) => onChange({ ...params, ...p })}
                  onRemove={() => onChange(withoutField(params, f))}
                />
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ── Object classes + their parameters ───────────────────────────────────── */

export function RuleTemplateForm({
  config,
  onChange,
  invalidClasses,
}: {
  config: RuleConfig;
  onChange: (next: RuleConfig) => void;
  invalidClasses?: boolean;
}) {
  function toggleClass(cls: string) {
    if (config.objectClasses.includes(cls)) {
      const { [cls]: _dropped, ...rest } = config.perClass;
      void _dropped;
      onChange({
        ...config,
        objectClasses: config.objectClasses.filter((c) => c !== cls),
        perClass: rest,
      });
      return;
    }
    onChange({
      ...config,
      objectClasses: [...config.objectClasses, cls],
      perClass: { ...config.perClass, [cls]: newClassParams() },
    });
  }

  function setClass(cls: string, next: ClassParams) {
    onChange({ ...config, perClass: { ...config.perClass, [cls]: next } });
  }

  return (
    <div>
      {/* Mirrors "Rule Information" so the labels below line up across columns. */}
      <h2 className="mb-4 text-lg font-bold text-foreground">Detection Logic</h2>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-base font-semibold text-foreground">
            Object Classes
          </label>
          <ClassMultiSelect
            values={config.objectClasses}
            onToggle={toggleClass}
            invalid={invalidClasses}
          />
          {invalidClasses && (
            <p className="mt-1 text-xs text-sev-critical">Pick at least one object class.</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-base font-semibold text-foreground">
            Class Parameters
          </label>

          {config.objectClasses.length === 0 ? (
            <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground">
              <p className="text-base">No object classes selected yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {config.objectClasses.map((cls) => (
                <ClassCard
                  key={cls}
                  cls={cls}
                  params={paramsFor(config, cls)}
                  onChange={(next) => setClass(cls, next)}
                  onRemove={() => toggleClass(cls)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
