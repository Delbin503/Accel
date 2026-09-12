import * as React from "react";
import { ChevronDown, Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/shared/Modal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { newCondition, templateFor } from "@/lib/ruleTemplates";
import {
  CONDITION_PARAM_META,
  EVENT_TEMPLATES,
  OBJECT_CLASSES,
  RULE_ZONES,
} from "@/mocks/ruleTemplates";
import type {
  ConditionParamId,
  DurationUnit,
  RuleCondition,
} from "@/types/ruleTemplates";

/* ── Multi-select used for object classes and parameters ─────────────────── */

function MultiSelect({
  values,
  options,
  onToggle,
  placeholder,
  invalid,
  lockedValues = [],
  mono = false,
}: {
  values: string[];
  options: { value: string; label: string }[];
  onToggle: (v: string) => void;
  placeholder: string;
  invalid?: boolean;
  /** Rendered without a remove affordance and not toggleable. */
  lockedValues?: string[];
  mono?: boolean;
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
              {values.map((v) => {
                const locked = lockedValues.includes(v);
                const label = options.find((o) => o.value === v)?.label ?? v;
                return (
                  <span
                    key={v}
                    className={cn(
                      "inline-flex items-center gap-1 rounded border px-1.5 py-px text-2xs font-semibold",
                      mono && "font-mono",
                      locked
                        ? "border-border bg-muted text-muted-foreground"
                        : "border-primary/30 bg-primary/10 text-primary"
                    )}
                  >
                    {label}
                    {!locked && (
                      <X
                        className="size-2.5 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggle(v);
                        }}
                      />
                    )}
                  </span>
                );
              })}
            </span>
          )}
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-[260px] w-[--radix-popover-trigger-width] min-w-56 overflow-y-auto p-1.5"
      >
        {options.map((o) => {
          const checked = values.includes(o.value);
          const locked = lockedValues.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              disabled={locked}
              onClick={() => !locked && onToggle(o.value)}
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-base transition-colors",
                locked ? "cursor-not-allowed opacity-60" : "hover:bg-muted"
              )}
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded border",
                  checked ? "border-primary bg-primary" : "border-border"
                )}
              >
                {checked && <span className="size-1.5 rounded-[1px] bg-primary-foreground" />}
              </span>
              <span className={cn("flex-1", mono && "font-mono text-sm")}>{o.label}</span>
              {locked && <span className="text-2xs text-muted-foreground">always</span>}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

/* ── Edit / add condition modal ──────────────────────────────────────────── */

interface ConditionErrors {
  templateId?: string;
  parameters?: string;
  objectClasses?: string;
  confidence?: string;
}

/* Mounted only while open, so the draft starts fresh on each open. */
export function ConditionModal({
  condition,
  isNew,
  onClose,
  onSave,
}: {
  condition: RuleCondition;
  isNew: boolean;
  onClose: () => void;
  onSave: (next: RuleCondition) => void;
}) {
  const [draft, setDraft] = React.useState<RuleCondition>(condition);
  const [errors, setErrors] = React.useState<ConditionErrors>({});

  const template = templateFor(draft.templateId);
  const has = (p: ConditionParamId) => draft.parameters.includes(p);

  function patch(p: Partial<RuleCondition>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  /** Switching event reseeds the parameters from the new template. */
  function pickTemplate(id: string) {
    const tpl = templateFor(id);
    if (!tpl) return;
    setDraft((d) => ({
      ...d,
      templateId: id,
      parameters: Array.from(
        new Set<ConditionParamId>(["object_class", "confidence", ...tpl.parameters])
      ),
    }));
    setErrors((e) => ({ ...e, templateId: undefined }));
  }

  function toggleParam(p: ConditionParamId) {
    setDraft((d) => ({
      ...d,
      parameters: d.parameters.includes(p)
        ? d.parameters.filter((x) => x !== p)
        : [...d.parameters, p],
    }));
  }

  function toggleClass(cls: string) {
    setDraft((d) => ({
      ...d,
      objectClasses: d.objectClasses.includes(cls)
        ? d.objectClasses.filter((c) => c !== cls)
        : [...d.objectClasses, cls],
    }));
    setErrors((e) => ({ ...e, objectClasses: undefined }));
  }

  function submit() {
    const next: ConditionErrors = {};
    if (!draft.templateId) next.templateId = "Pick an event.";
    if (draft.parameters.length === 0) next.parameters = "Pick at least one parameter.";
    if (draft.objectClasses.length === 0) next.objectClasses = "Pick at least one object class.";
    if (!(draft.confidence >= 0 && draft.confidence <= 100)) {
      next.confidence = "Confidence must be between 0 and 100.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    // Zone is optional — drop it when the parameter is not carried.
    onSave({ ...draft, zone: has("zone") ? draft.zone : undefined });
  }

  return (
    <Modal open onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title={isNew ? "Add Condition" : "Edit Condition"}
          description="Choose the event this condition watches and the values it fires on."
        />
        <ModalBody className="space-y-4">
          {/* Event */}
          <div>
            <label className="mb-1.5 block text-base font-semibold text-foreground">
              Event Name
            </label>
            <Select value={draft.templateId} onValueChange={pickTemplate}>
              <SelectTrigger className="h-10 w-full text-base" aria-invalid={!!errors.templateId}>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {template && (
              <p className="mt-1 font-mono text-2xs text-muted-foreground">
                {template.id} · emits {template.event}
                {template.requires.length > 0 && ` · needs ${template.requires.join(", ")}`}
              </p>
            )}
            {errors.templateId && (
              <p className="mt-1 text-xs text-sev-critical">{errors.templateId}</p>
            )}
          </div>

          {/* Parameters */}
          <div>
            <label className="mb-1.5 block text-base font-semibold text-foreground">
              Parameters
            </label>
            <MultiSelect
              values={draft.parameters}
              options={(Object.keys(CONDITION_PARAM_META) as ConditionParamId[]).map((p) => ({
                value: p,
                label: CONDITION_PARAM_META[p].label,
              }))}
              lockedValues={["object_class", "confidence"]}
              onToggle={(v) => toggleParam(v as ConditionParamId)}
              placeholder="Select parameters…"
              invalid={!!errors.parameters}
            />
            <p className="mt-1 text-2xs text-muted-foreground">
              Object classes and confidence are always carried. Add the rest as the event needs them.
            </p>
            {errors.parameters && (
              <p className="mt-1 text-xs text-sev-critical">{errors.parameters}</p>
            )}
          </div>

          {/* Object classes */}
          <div>
            <label className="mb-1.5 block text-base font-semibold text-foreground">
              Object Classes
            </label>
            <MultiSelect
              values={draft.objectClasses}
              options={OBJECT_CLASSES.map((c) => ({ value: c, label: c }))}
              onToggle={toggleClass}
              placeholder="Select object classes…"
              invalid={!!errors.objectClasses}
              mono
            />
            {errors.objectClasses && (
              <p className="mt-1 text-xs text-sev-critical">{errors.objectClasses}</p>
            )}
          </div>

          {/* Confidence */}
          <div>
            <label className="mb-1.5 block text-base font-semibold text-foreground">
              Confidence
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={100}
                value={draft.confidence}
                onChange={(e) => {
                  patch({ confidence: Number(e.target.value) });
                  setErrors((x) => ({ ...x, confidence: undefined }));
                }}
                className="h-10 text-base"
                aria-invalid={!!errors.confidence}
              />
              <span className="shrink-0 text-base text-muted-foreground">%</span>
            </div>
            {errors.confidence && (
              <p className="mt-1 text-xs text-sev-critical">{errors.confidence}</p>
            )}
          </div>

          {/* Zone — optional */}
          {has("zone") && (
            <div>
              <label className="mb-1.5 block text-base font-semibold text-foreground">
                Zone <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <Select
                value={draft.zone ?? "__any__"}
                onValueChange={(v) => patch({ zone: v === "__any__" ? undefined : v })}
              >
                <SelectTrigger className="h-10 w-full text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__any__">Anywhere in frame</SelectItem>
                  {RULE_ZONES.map((z) => (
                    <SelectItem key={z} value={z}>
                      {z}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Duration */}
          {has("duration") && (
            <div>
              <label className="mb-1.5 block text-base font-semibold text-foreground">
                Duration
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  value={draft.duration}
                  onChange={(e) => patch({ duration: Number(e.target.value) })}
                  className="h-10 text-base"
                />
                <Select
                  value={draft.durationUnit}
                  onValueChange={(v) => patch({ durationUnit: v as DurationUnit })}
                >
                  <SelectTrigger className="h-10 w-[130px] text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Seconds</SelectItem>
                    <SelectItem value="minutes">Minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Count threshold */}
          {has("count_threshold") && (
            <div>
              <label className="mb-1.5 block text-base font-semibold text-foreground">
                Count Threshold
              </label>
              <Input
                type="number"
                min={1}
                value={draft.countThreshold}
                onChange={(e) => patch({ countThreshold: Number(e.target.value) })}
                className="h-10 text-base"
              />
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit}>
            {isNew ? "Add Condition" : "Save Condition"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Condition card ──────────────────────────────────────────────────────── */

function ConditionCard({
  condition,
  onEdit,
  onRemove,
}: {
  condition: RuleCondition;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const template = templateFor(condition.templateId);
  const summary = [
    condition.objectClasses.length > 0 ? condition.objectClasses.join(", ") : "no classes yet",
    `≥ ${condition.confidence}%`,
    condition.zone ?? "anywhere in frame",
    condition.parameters.includes("duration")
      ? `${condition.duration} ${condition.durationUnit}`
      : null,
    condition.parameters.includes("count_threshold") ? `≥ ${condition.countThreshold} objects` : null,
  ].filter(Boolean);

  return (
    <div className="rounded-lg border border-border bg-background px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-foreground">
            {template?.name ?? condition.templateId}
          </p>
          <p className="truncate font-mono text-2xs text-muted-foreground">{condition.templateId}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${template?.name ?? "condition"}`}
            title="Edit condition"
            className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
          >
            <Pencil className="size-3" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${template?.name ?? "condition"}`}
            title="Remove condition"
            className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:border-sev-critical/40 hover:bg-sev-critical/10 hover:text-sev-critical"
          >
            <X className="size-3" />
          </button>
        </div>
      </div>
      <p className="mt-1.5 truncate text-sm text-muted-foreground">{summary.join(" · ")}</p>
    </div>
  );
}

/* ── Rule Conditions section ─────────────────────────────────────────────── */

export function RuleConditions({
  conditions,
  onChange,
  invalid,
}: {
  conditions: RuleCondition[];
  onChange: (next: RuleCondition[]) => void;
  invalid?: boolean;
}) {
  /** The condition being edited, plus whether it is new (Cancel discards it). */
  const [editing, setEditing] = React.useState<{ condition: RuleCondition; isNew: boolean } | null>(
    null
  );

  function add() {
    setEditing({ condition: newCondition(EVENT_TEMPLATES[0]), isNew: true });
  }

  function save(next: RuleCondition) {
    const exists = conditions.some((c) => c.id === next.id);
    onChange(exists ? conditions.map((c) => (c.id === next.id ? next : c)) : [...conditions, next]);
    setEditing(null);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">Rule Conditions</h2>
        <Button variant="outline" size="sm" onClick={add} className="gap-1.5">
          <Plus className="size-3.5" />
          Add Condition
        </Button>
      </div>

      {conditions.length === 0 ? (
        <button
          type="button"
          onClick={add}
          className={cn(
            "group flex min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-muted-foreground transition-colors hover:text-foreground",
            invalid ? "border-sev-critical" : "border-border"
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-full border border-border transition-colors group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary">
            <Plus className="size-4" />
          </div>
          <p className="text-base">Add your first condition</p>
        </button>
      ) : (
        <div className="space-y-2">
          {conditions.map((c) => (
            <ConditionCard
              key={c.id}
              condition={c}
              onEdit={() => setEditing({ condition: c, isNew: false })}
              onRemove={() => onChange(conditions.filter((x) => x.id !== c.id))}
            />
          ))}
        </div>
      )}

      {invalid && conditions.length === 0 && (
        <p className="mt-1 text-xs text-sev-critical">Add at least one condition.</p>
      )}

      {editing && (
        <ConditionModal
          condition={editing.condition}
          isNew={editing.isNew}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}
