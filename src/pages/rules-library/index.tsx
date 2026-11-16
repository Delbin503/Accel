import * as React from "react";
import { ItemButton } from "@accel/ui/components/ui/item";
import { DataTable, type DataTableColumn } from "@accel/ui/components/shared/DataTable";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  Edit2,
  MoreHorizontal,
  BookOpen,
  ArrowLeft,
  ArrowUpDown,
  Calendar,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@accel/ui/components/ui/button";
import { Input } from "@accel/ui/components/ui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@accel/ui/components/shared/Modal";
import { ToolbarSearch } from "@accel/ui/components/shared/Toolbar";
import { Popover, PopoverContent, PopoverTrigger } from "@accel/ui/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@accel/ui/components/ui/select";
import { Textarea } from "@accel/ui/components/ui/textarea";
import { cn } from "@accel/ui/lib/utils";
import { PageHeader } from "@accel/ui/components/layout/PageHeader";
import { TruncatedText } from "@accel/ui/components/shared/TruncatedText";
import {
  MOCK_RULES,
  ALL_TAGS,
} from "@/mocks/rulesLibrary";
import type { RuleData, RuleSeverity } from "@/types/rules";
import type { RuleConfig } from "@/types/ruleTemplates";
import { configFromConditions, configToRows, inferConfig, newConfig } from "@/lib/ruleTemplates";
import { RuleConditions } from "./RuleConditions";

/* ── Severity badge ──────────────────────────────────────────────────────── */

const SEV_BADGE: Record<RuleSeverity, { bg: string; text: string; dot: string; label: string }> = {
  low:      { bg: "bg-info/15",         text: "text-info",         dot: "bg-info",         label: "Low" },
  medium:   { bg: "bg-warning/15",      text: "text-warning",      dot: "bg-warning",      label: "Medium" },
  critical: { bg: "bg-severity-critical/15", text: "text-severity-critical", dot: "bg-severity-critical", label: "Critical" },
};

function SeverityBadge({ severity }: { severity: RuleSeverity }) {
  const s = SEV_BADGE[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider",
        s.bg,
        s.text
      )}
    >
      <span className={cn("size-1.5 flex-shrink-0 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

/* ── ExpandableTags ──────────────────────────────────────────────────────── */

function ExpandableTags({ tags }: { tags: string[] }) {
  const visible = tags.slice(0, 4);
  const rest = tags.slice(4);
  return (
    <div data-slot="expandable-tags" className="flex flex-wrap items-center gap-1">
      {visible.map((t) => (
        <span
          key={t}
          className="rounded border border-border bg-muted px-1.5 py-px text-2xs font-medium text-muted-foreground"
        >
          {t}
        </span>
      ))}
      {rest.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="xs"
              onClick={(e) => e.stopPropagation()}
              className="h-auto rounded border border-primary/30 bg-primary/10 px-1.5 py-px text-2xs font-semibold text-primary-ink hover:bg-primary/15 hover:text-primary-ink aria-expanded:bg-primary/10 aria-expanded:text-primary-ink dark:border-primary/30 dark:bg-primary/10 dark:hover:bg-primary/15"
            >
              +{rest.length} more tags
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={6} className="z-[var(--z-popover)] w-64 p-3">
            <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              All Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t}
                  className="rounded border border-border bg-muted px-1.5 py-px text-2xs font-medium text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

/* ── Multi-select filter dropdown ────────────────────────────────────────── */

interface FilterDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}

function FilterDropdown({ label, options, selected, onChange }: FilterDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const hasValue = selected.length > 0;
  const displayLabel = hasValue
    ? selected.length === 1
      ? (options.find((o) => o.value === selected[0])?.label ?? label)
      : `${selected.length} selected`
    : label;

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ItemButton variant="plain"
          className={cn(
            "justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-base transition-colors hover:border-primary",
            open ? "border-primary" : "border-border",
            hasValue ? "text-primary-ink" : "text-muted-foreground"
          )}
        >
          <TruncatedText text={displayLabel} className="truncate font-medium" />
          <ChevronDown
            className={cn(
              "size-3.5 flex-shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </ItemButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1.5">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <ItemButton variant="plain"
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className="gap-2 rounded px-2 py-1.5 text-base text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <div
                className={cn(
                  "flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                  checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                )}
              >
                {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
              </div>
              {opt.label}
            </ItemButton>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

/* ── Filter options ──────────────────────────────────────────────────────── */

interface RuleFilters {
  tags: string[];
  severity: string[];
}
const EMPTY_RULE_FILTERS: RuleFilters = { tags: [], severity: [] };

const SEVERITY_OPTS = [
  { value: "critical", label: "Critical" },
  { value: "medium",   label: "Medium" },
  { value: "low",      label: "Low" },
];

const TAG_OPTS = ALL_TAGS.map((t) => ({ value: t, label: t }));

/* ── Rule filter panel ───────────────────────────────────────────────────── */

function RuleFilterPanel({
  filters,
  onChange,
  search,
  onSearchChange,
}: {
  filters: RuleFilters;
  onChange: (f: RuleFilters) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const filterCount = filters.tags.length + filters.severity.length;
  const activeCount = filterCount + (search ? 1 : 0);

  function setGroup(group: keyof RuleFilters, values: string[]) {
    onChange({ ...filters, [group]: values });
  }

  return (
    <div data-slot="rule-filter-panel" className="rounded-xl border border-border bg-card">
      <div data-slot="rule-filter-panel-header"
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <ItemButton variant="plain" type="button" onClick={() => setOpen((v) => !v)} className="w-auto flex-1 gap-2.5">
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-base font-semibold text-foreground">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary-fill px-2 py-px text-xs font-semibold text-primary-foreground">
              {activeCount} active
            </span>
          ) : (
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {["All severities", "All tags"].map((l) => (
                <span
                  key={l}
                  className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                >
                  {l}
                </span>
              ))}
            </div>
          )}
        </ItemButton>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-xs" className="size-auto rounded-none p-0 hover:bg-transparent dark:hover:bg-transparent" type="button" aria-label={open ? "Collapse filters" : "Expand filters"} onClick={() => setOpen((v) => !v)}>
            {open ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>

      {open && (
        <div data-slot="rule-filter-panel-body" className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
          <ToolbarSearch value={search} onChange={onSearchChange} placeholder="Search by rule ID, name, tag…" className="sm:w-full" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "severity" as const, label: "Severity",  opts: SEVERITY_OPTS },
              { key: "tags"     as const, label: "Tags",      opts: TAG_OPTS },
            ].map(({ key, label, opts }) => (
              <div key={key}>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </div>
                <FilterDropdown
                  label={`All ${label.toLowerCase()}`}
                  options={opts}
                  selected={filters[key]}
                  onChange={(v) => setGroup(key, v)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Row action menu ─────────────────────────────────────────────────────── */

function RowActionMenu({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div data-slot="row-action-menu" className="relative" ref={ref}>
      <Button variant="ghost" size="icon-sm" aria-label={label} aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="size-7 rounded border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-muted hover:text-foreground dark:hover:bg-muted"
      >
        <MoreHorizontal className="size-4" />
      </Button>
      {open && (
        <div data-slot="row-action-menu-content" className="absolute right-0 top-8 z-50 min-w-[160px] overflow-hidden rounded-lg border border-border bg-card py-1 shadow-floating">
          <ItemButton variant="plain"
            onClick={() => { setOpen(false); onEdit(); }}
            className="gap-2 px-3 py-2 text-base text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Edit2 className="size-3.5" />
            Edit Rule
          </ItemButton>
          <div className="my-1 h-px bg-border" />
          <ItemButton variant="plain"
            onClick={() => { setOpen(false); onDelete(); }}
            className="gap-2 px-3 py-2 text-base text-severity-critical hover:bg-severity-critical/10"
          >
            <Trash2 className="size-3.5" />
            Delete Rule
          </ItemButton>
        </div>
      )}
    </div>
  );
}

/* ── Keyword badge (builder) ─────────────────────────────────────────────── */

/* ── Tag input with chips ────────────────────────────────────────────────── */

function TagInput({
  tags,
  onAdd,
  onRemove,
  suggestions = [],
  invalid = false,
}: {
  tags: string[];
  onAdd: (t: string) => void;
  onRemove: (t: string) => void;
  suggestions?: readonly string[];
  invalid?: boolean;
}) {
  const [val, setVal] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLInputElement>(null);

  function commit(raw?: string) {
    const t = (raw ?? val).trim().replace(/,/g, "");
    if (t && !tags.includes(t)) onAdd(t);
    setVal("");
  }

  const q = val.trim().toLowerCase();
  const filteredSuggestions = suggestions
    .filter((s) => !tags.includes(s))
    .filter((s) => (q ? s.toLowerCase().includes(q) : true));
  const showCreate = q && !suggestions.some((s) => s.toLowerCase() === q) && !tags.includes(val.trim());

  return (
    <div data-slot="tag-input" className="relative">
      <div
        className={cn(
          "flex min-h-[42px] cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 transition-colors focus-within:border-primary",
          invalid && "border-severity-critical"
        )}
        onClick={() => { ref.current?.focus(); setOpen(true); }}
      >
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 text-sm font-medium text-foreground"
          >
            {t}
            <Button variant="ghost" size="icon-xs"
              onClick={(e) => { e.stopPropagation(); onRemove(t); }}
              className="size-4 rounded text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
            >
              <X className="size-2.5" />
            </Button>
          </span>
        ))}
        <Input
          ref={ref}
          value={val}
          onChange={(e) => { setVal(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); }
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Backspace" && !val && tags.length > 0) onRemove(tags[tags.length - 1]);
          }}
          placeholder={tags.length === 0 ? "+ Add tag" : ""}
          className="h-auto w-auto min-w-[80px] flex-1 rounded-none border-0 bg-transparent px-0 py-0 text-base text-foreground shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0 md:text-base dark:bg-transparent"
        />
      </div>
      {open && (filteredSuggestions.length > 0 || showCreate) && (
        <div data-slot="tag-input-suggestions" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-[220px] overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-floating">
          {filteredSuggestions.length > 0 && (
            <div className="mb-1 px-2 py-1 text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
              Existing tags
            </div>
          )}
          {filteredSuggestions.slice(0, 10).map((sg) => (
            <ItemButton variant="plain"
              key={sg}
              onMouseDown={(e) => { e.preventDefault(); commit(sg); }}
              className="gap-1.5 rounded px-2 py-1.5 text-base text-foreground hover:bg-muted"
            >
              <span className="inline-block size-1.5 rounded-full bg-primary/60" />
              {sg}
            </ItemButton>
          ))}
          {showCreate && (
            <>
              {filteredSuggestions.length > 0 && <div className="my-1 border-t border-border" />}
              <ItemButton variant="plain"
                onMouseDown={(e) => { e.preventDefault(); commit(); }}
                className="gap-1.5 rounded px-2 py-1.5 text-base text-primary-ink hover:bg-primary/10"
              >
                <Plus className="size-3" />
                Create "{val.trim()}"
              </ItemButton>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Builder side panel ──────────────────────────────────────────────────── */

const SEV_OPTS: { sev: RuleSeverity; label: string; active: string; dot: string }[] = [
  { sev: "low",      label: "Low",      active: "border-info/50 bg-info/10 text-info",                         dot: "bg-info" },
  { sev: "medium",   label: "Medium",   active: "border-warning/50 bg-warning/10 text-warning",                dot: "bg-warning" },
  { sev: "critical", label: "Critical", active: "border-severity-critical/50 bg-severity-critical/10 text-severity-critical", dot: "bg-severity-critical" },
];

/* ── Builder state ───────────────────────────────────────────────────────── */

interface BuilderErrors {
  name?: string;
  description?: string;
  tags?: string;
  conditions?: string;
}

interface BuilderState {
  name: string;
  description: string;
  tags: string[];
  /** Included fields + their values — the source of truth for the rule's logic. */
  config: RuleConfig;
  severity: RuleSeverity;
  errors: BuilderErrors;
}

const EMPTY_BUILDER: BuilderState = {
  name: "",
  description: "",
  tags: [],
  config: newConfig(),
  severity: "critical",
  errors: {},
};

function ruleToBuilder(rule: RuleData): BuilderState {
  return {
    name: rule.name,
    description: rule.description,
    tags: [...rule.tags],
    // Rules saved before the form was parameterised carry no config — infer one
    // so the form opens populated rather than blank.
    config: rule.config
      ? {
          ...rule.config,
          objectClasses: [...rule.config.objectClasses],
          perClass: { ...rule.config.perClass },
          conditions: [...(rule.config.conditions ?? [])],
        }
      : inferConfig(rule),
    severity: rule.severity,
      errors: {},
  };
}

/* ── Rule Builder view ───────────────────────────────────────────────────── */

function RuleBuilder({
  mode,
  editingRule,
  sourceModel,
  existingTags,
  onBack,
  onConfirm,
}: {
  mode: "create" | "edit";
  editingRule: RuleData | null;
  /** Set when the rule was extracted from a model — names the page. */
  sourceModel: string | null;
  existingTags: readonly string[];
  onBack: () => void;
  onConfirm: (
    data: Omit<RuleData, "id" | "createdAt" | "createdAtDisplay" | "createdTimeDisplay">
  ) => void;
}) {
  const [s, setS] = React.useState<BuilderState>(() =>
    editingRule ? ruleToBuilder(editingRule) : { ...EMPTY_BUILDER }
  );

  // Conditions are the authoring surface; objectClasses/perClass are projected
  // off them so the rule cards, the summary rows and Model Management keep working.
  const derivedConfig = React.useMemo(() => configFromConditions(s.config), [s.config]);

  // The WHEN/IN/AND/FOR/THEN projection every other surface renders.
  const rows = React.useMemo(() => configToRows(derivedConfig, s.name), [derivedConfig, s.name]);
  function ruleFields() {
    return {
      name: s.name,
      description: s.description,
      tags: s.tags,
      conditions: rows,
      severity: s.severity,
      config: derivedConfig,
    };
  }

  function patch(p: Partial<BuilderState>) {
    setS((prev) => ({ ...prev, ...p }));
  }

  function clearError(field: keyof BuilderErrors) {
    setS((prev) =>
      prev.errors[field] ? { ...prev, errors: { ...prev.errors, [field]: undefined } } : prev
    );
  }

  function handleConditionsChange(next: RuleConfig["conditions"]) {
    setS((prev) => ({
      ...prev,
      config: { ...prev.config, conditions: next },
      errors: { ...prev.errors, conditions: undefined },
    }));
  }

  function validate(): BuilderErrors {
    const errors: BuilderErrors = {};
    if (!s.name.trim()) errors.name = "Rule name is required.";
    if (!s.description.trim()) errors.description = "Rule description is required.";
    if (s.tags.length === 0) errors.tags = "Add at least one tag.";
    if ((s.config.conditions ?? []).length === 0) {
      errors.conditions = "Add at least one condition.";
    }
    return errors;
  }

  function handleConfirmClick() {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      patch({ errors });
      return;
    }
    onConfirm(ruleFields());
  }


  return (
    <div data-slot="rule-builder" className="flex flex-col gap-5 pb-20">
      <div data-slot="rule-builder-header" className="flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {sourceModel ?? (mode === "create" ? "Create Rule" : "Edit Rule")}
        </h1>
      </div>

      <div data-slot="rule-builder-content" className="flex flex-col gap-6">
        <div>
          <h2 className="mb-4 text-lg font-bold text-foreground">Rule Information</h2>
          <div data-slot="rule-builder-info-form" className="space-y-4">
            {/* Name and description share a row, as do tags and severity. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-base font-semibold text-foreground">
                  Rule Name
                </label>
                <Input
                  value={s.name}
                  onChange={(e) => { patch({ name: e.target.value }); clearError("name"); }}
                  placeholder="e.g. Helmet not worn in Armoury-B"
                  className="h-10 text-base"
                  aria-invalid={!!s.errors.name}
                />
                {s.errors.name && <p className="mt-1 text-xs text-severity-critical">{s.errors.name}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-base font-semibold text-foreground">
                  Rule Description
                </label>
                <Textarea
                  value={s.description}
                  onChange={(e) => { patch({ description: e.target.value }); clearError("description"); }}
                  placeholder="e.g. Triggers when a person is detected inside Armoury-B without a helmet for more than 5 seconds during operating hours."
                  rows={2}
                  className="w-full resize-none text-base"
                  aria-invalid={!!s.errors.description}
                />
                {s.errors.description && (
                  <p className="mt-1 text-xs text-severity-critical">{s.errors.description}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-base font-semibold text-foreground">
                  Rule Tag(s)
                </label>
                <TagInput
                  tags={s.tags}
                  onAdd={(t) => { patch({ tags: [...s.tags, t] }); clearError("tags"); }}
                  onRemove={(t) => patch({ tags: s.tags.filter((x) => x !== t) })}
                  suggestions={existingTags}
                  invalid={!!s.errors.tags}
                />
                {s.errors.tags && <p className="mt-1 text-xs text-severity-critical">{s.errors.tags}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-base font-semibold text-foreground">
                  Severity Score
                </label>
                <Select
                  value={s.severity}
                  onValueChange={(v) => patch({ severity: v as RuleSeverity })}
                >
                  <SelectTrigger className="h-10 w-full text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEV_OPTS.map(({ sev, label, dot }) => (
                      <SelectItem key={sev} value={sev}>
                        <span className="flex items-center gap-2">
                          <span className={cn("size-1.5 rounded-full", dot)} />
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">
                  Priority of the alert when this rule triggers.
                </p>
              </div>
            </div>
          </div>
        </div>

        <RuleConditions
          conditions={s.config.conditions ?? []}
          onChange={handleConditionsChange}
          invalid={!!s.errors.conditions}
        />
      </div>

      {/* Sticky footer */}
      <div data-slot="rule-builder-footer" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:left-[var(--sidebar-width,16rem)]">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="size-3.5" />
            Go Back
          </Button>
          <Button
            size="sm"
            onClick={handleConfirmClick}
            className="gap-1.5"
          >
            <Check className="size-3.5" />
            {mode === "create" ? "Create Rule" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete modal ────────────────────────────────────────────────────────── */

export function DeleteModal({
  ruleName,
  onConfirm,
  onCancel,
}: {
  ruleName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open onOpenChange={(v) => !v && onCancel()}>
      <ModalContent size="sm">
        <ModalHeader title="Delete Rule" />
        <ModalBody>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Are you sure you want to delete <strong className="text-foreground">{ruleName}</strong>? Models that reference it will need
            updating.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="destructive" size="sm" onClick={onConfirm}>Delete Rule</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

export default function RulesLibraryPage({
  forcedState = "normal",
}: {
  forcedState?: "normal" | "empty";
} = {}) {
  const isEmptyState = forcedState === "empty";
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Work out once, on mount, whether we arrived to edit a specific rule:
  // - from Model Management "Edit" on a model-extracted rule (router state handoff) → edit it
  //   on the full builder page; saving bounces back to the model editor.
  // - from Model Management "Edit" on a library rule (?edit=<id>) → jump straight to its builder.
  const [initialEntry] = React.useState(() => {
    const handoff = (location.state as { extractedEdit?: { rule: RuleData; modelId: string; ruleId: string; returnTo: string; sourceModel?: string } } | null)?.extractedEdit ?? null;
    if (handoff) return { handoff, rule: handoff.rule };
    const editId = searchParams.get("edit");
    const target = editId ? (isEmptyState ? [] : MOCK_RULES).find((r) => r.id === editId) : undefined;
    return { handoff: null, rule: target ?? null };
  });
  // Set when we arrived here to edit a model's extracted rule — save bounces back to the model.
  const extractedHandoff = React.useRef<{ returnTo: string; modelId: string; ruleId: string } | null>(
    initialEntry.handoff
      ? { returnTo: initialEntry.handoff.returnTo, modelId: initialEntry.handoff.modelId, ruleId: initialEntry.handoff.ruleId }
      : null
  );
  /** Model file an extracted rule came from — titles the builder when set. */
  const [sourceModel] = React.useState<string | null>(initialEntry.handoff?.sourceModel ?? null);
  const initialView = initialEntry.rule || searchParams.get("new") === "true" ? "builder" : "list";
  const [view, setView] = React.useState<"list" | "builder">(initialView);
  const [builderMode, setBuilderMode] = React.useState<"create" | "edit">(initialEntry.rule ? "edit" : "create");
  const [editingRule, setEditingRule] = React.useState<RuleData | null>(initialEntry.rule);
  const [rules, setRules] = React.useState<RuleData[]>(isEmptyState ? [] : MOCK_RULES);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<RuleFilters>(EMPTY_RULE_FILTERS);
  const [sortBy, setSortBy] = React.useState<"newest" | "oldest" | "name-asc" | "name-desc">("newest");
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  // Aggregate existing tags for autocomplete (built-in tags + tags from any rule)
  const existingRuleTags = React.useMemo(() => {
    const set = new Set<string>(ALL_TAGS);
    rules.forEach((r) => r.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [rules]);

  // If we landed here with ?new=true (from Model Management +Add Rule), clean the URL
  // and remember which model to bounce back to after save.
  const cameFromModel = React.useRef(searchParams.get("new") === "true");
  const returnModelId = React.useRef(searchParams.get("model"));
  React.useEffect(() => {
    // The handoff / ?edit= entry was applied to the initial state above; just clear it.
    if (initialEntry.handoff) {
      window.history.replaceState({}, "");
      return;
    }
    const editId = searchParams.get("edit");
    if (editId) {
      setSearchParams({}, { replace: true });
    } else if (searchParams.get("new") === "true") {
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = React.useMemo(() => {
    let list = [...rules];
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filters.tags.length > 0) list = list.filter((r) => filters.tags.some((t) => r.tags.includes(t)));
    if (filters.severity.length > 0) list = list.filter((r) => filters.severity.includes(r.severity));
    if (sortBy === "oldest") list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    else if (sortBy === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "name-desc") list.sort((a, b) => b.name.localeCompare(a.name));
    else list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list;
  }, [rules, search, filters, sortBy]);

  function openCreate() {
    setEditingRule(null);
    setBuilderMode("create");
    setView("builder");
  }

  function openEdit(rule: RuleData) {
    setEditingRule(rule);
    setBuilderMode("edit");
    setView("builder");
  }

  function handleConfirm(
    data: Omit<RuleData, "id" | "createdAt" | "createdAtDisplay" | "createdTimeDisplay">
  ) {
    // Editing a model-extracted rule — hand the edited fields back to the model editor.
    if (extractedHandoff.current) {
      const h = extractedHandoff.current;
      extractedHandoff.current = null;
      navigate(h.returnTo, {
        replace: true,
        state: {
          extractedResult: {
            modelId: h.modelId,
            ruleId: h.ruleId,
            patch: { name: data.name, severity: data.severity, description: data.description, tags: data.tags },
          },
        },
      });
      return;
    }
    if (builderMode === "edit" && editingRule) {
      setRules((prev) => prev.map((r) => (r.id === editingRule.id ? { ...editingRule, ...data } : r)));
      // Sync edits back to module-level mock so other pages see the change.
      const idx = MOCK_RULES.findIndex((r) => r.id === editingRule.id);
      if (idx >= 0) MOCK_RULES[idx] = { ...editingRule, ...data } as RuleData;
      toast.success(`Rule "${data.name}" updated`);
    } else {
      const n = new Date();
      const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const displayDate = `${n.getDate()} ${MONTHS[n.getMonth()]} ${n.getFullYear()}, ${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`;
      const newRule: RuleData = {
        ...data,
        id: `Rul_${String(MOCK_RULES.length + 1).padStart(3, "0")}`,
        createdAt: n.toISOString(),
        createdAtDisplay: displayDate,
        createdTimeDisplay: "",
      };
      setRules((prev) => [newRule, ...prev]);
      // Mutate module-level mock so the Model Management page picks the new rule up
      // when we navigate back to it.
      MOCK_RULES.unshift(newRule);
      toast.success(`Rule "${data.name}" created`);
    }
    // If we arrived here from Model Management's +Add Rule button, bounce back to the
    // model editor we came from so the new rule lands directly in its Rule Library panel.
    if (cameFromModel.current && builderMode === "create") {
      cameFromModel.current = false;
      const target = returnModelId.current
        ? `/models?model=${returnModelId.current}&edit=1`
        : "/models";
      navigate(target, { replace: true });
      return;
    }
    setView("list");
  }

  const deleteTarget = rules.find((r) => r.id === deleteId);
  const hasActiveFilters = filters.tags.length > 0 || filters.severity.length > 0;

  if (view === "builder") {
    return (
      <RuleBuilder
        mode={builderMode}
        editingRule={editingRule}
        sourceModel={sourceModel}
        existingTags={existingRuleTags}
        onBack={() => {
          if (extractedHandoff.current) {
            const h = extractedHandoff.current;
            extractedHandoff.current = null;
            navigate(h.returnTo, { replace: true });
          } else {
            setView("list");
          }
        }}
        onConfirm={handleConfirm}
      />
    );
  }

  const ruleColumns: DataTableColumn<RuleData>[] = [
    {
      key: "id",
      header: "RULE ID",
      headClassName: "w-[120px]",
      cell: (rule) => (
        <span className="font-mono text-sm font-semibold text-muted-foreground transition-colors group-hover:text-primary-ink">
          {rule.id}
        </span>
      ),
    },
    {
      key: "name",
      header: "RULE NAME",
      headClassName: "w-[210px]",
      cell: (rule) => (
        <div className="flex flex-col items-start gap-1.5">
          <span className="text-base font-semibold text-foreground transition-colors group-hover:text-primary-ink">
            {rule.name}
          </span>
          <SeverityBadge severity={rule.severity} />
        </div>
      ),
    },
    {
      key: "description",
      header: "RULE DESCRIPTION",
      cell: (rule) => <TruncatedText text={rule.description} className="line-clamp-2 text-base text-muted-foreground" />,
    },
    {
      key: "tags",
      header: "TAG",
      headClassName: "w-[260px]",
      stopRowClick: true,
      cell: (rule) => <ExpandableTags tags={rule.tags} />,
    },
    {
      key: "created",
      header: (
        <Button variant="link"
          onClick={() => setSortBy((s) => (s === "newest" ? "oldest" : "newest"))}
          className="h-auto gap-1 rounded-none border-0 p-0 text-2xs font-bold text-muted-foreground hover:text-foreground hover:no-underline"
        >
          CREATED
          <ArrowUpDown className="size-3 opacity-40" />
        </Button>
      ),
      headClassName: "w-[180px]",
      cell: (rule) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="size-3 flex-shrink-0" />
          {rule.createdAtDisplay}
        </div>
      ),
    },
    {
      key: "action",
      header: "ACTION",
      headClassName: "w-[64px]",
      stopRowClick: true,
      cell: (rule) => (
        <RowActionMenu
          label={`Actions for ${rule.name}`}
          onEdit={() => openEdit(rule)}
          onDelete={() => setDeleteId(rule.id)}
        />
      ),
    },
  ];

  return (
    <div data-slot="rules-library-page" className="flex flex-col gap-section">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Rule Library</PageHeader.Title>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="size-4" />
            Add Rule
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Filter panel */}
      <RuleFilterPanel
        filters={filters}
        onChange={setFilters}
        search={search}
        onSearchChange={setSearch}
      />

      {/* Count + sort */}
      <div data-slot="rules-library-page-toolbar" className="flex items-center justify-between gap-3">
        <p className="text-base text-muted-foreground">
          <strong className="text-foreground">{filtered.length}</strong>{" "}
          Rule{filtered.length !== 1 ? "s" : ""}
          {(search || hasActiveFilters) && (
            <Button variant="link"
              onClick={() => { setSearch(""); setFilters(EMPTY_RULE_FILTERS); }}
              className="ml-2 h-auto border-0 p-0 text-base font-normal text-muted-foreground underline hover:text-primary-ink"
            >
              Clear all
            </Button>
          )}
        </p>
        <div className="flex-shrink-0">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger aria-label="Sort rules" className="h-9 w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name (A→Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z→A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table or empty */}
      {filtered.length === 0 ? (
        rules.length === 0 ? (
          <div data-slot="rules-library-page-empty" className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
            <BookOpen className="size-10 opacity-20" />
            <p className="text-base font-semibold text-foreground">No rules yet</p>
            <p className="max-w-sm text-center text-sm">
              Create your first detection rule to start monitoring alert conditions.
            </p>
            <Button size="sm" onClick={openCreate} className="gap-1.5">
              <Plus className="size-4" />
              Add Rule
            </Button>
          </div>
        ) : (
          <div data-slot="rules-library-page-no-results" className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
            <BookOpen className="size-10 opacity-20" />
            <p className="text-sm">No rules match the current filters.</p>
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilters(EMPTY_RULE_FILTERS); }}>
              Clear filters
            </Button>
          </div>
        )
      ) : (
        <div data-slot="rules-library-page-table" className="overflow-hidden rounded-xl border border-border bg-card">
          <DataTable
            variant="list"
            className="min-w-[820px] border-collapse"
            columns={ruleColumns}
            data={filtered}
            getRowId={(rule) => rule.id}
            onRowClick={openEdit}
            getRowClassName={() => "transition-colors"}
          />
        </div>
      )}

      {deleteTarget && (
        <DeleteModal
          ruleName={deleteTarget.name}
          onConfirm={() => { setRules((prev) => prev.filter((r) => r.id !== deleteId)); setDeleteId(null); }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
