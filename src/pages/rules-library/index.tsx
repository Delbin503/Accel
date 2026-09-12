import * as React from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Search,
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { TruncatedText } from "@/components/shared/TruncatedText";
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
  critical: { bg: "bg-sev-critical/15", text: "text-sev-critical", dot: "bg-sev-critical", label: "Critical" },
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
    <div className="flex flex-wrap items-center gap-1">
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
            <button
              onClick={(e) => e.stopPropagation()}
              className="rounded border border-primary/30 bg-primary/10 px-1.5 py-px text-2xs font-semibold text-primary hover:bg-primary/15"
            >
              +{rest.length} more tags
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" sideOffset={6} className="z-[100] w-64 p-3">
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
        <button
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-base transition-colors hover:border-primary",
            open ? "border-primary" : "border-border",
            hasValue ? "text-primary" : "text-muted-foreground"
          )}
        >
          <TruncatedText text={displayLabel} className="truncate font-medium" />
          <ChevronDown
            className={cn(
              "size-3.5 flex-shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1.5">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-base text-muted-foreground hover:bg-muted hover:text-foreground"
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
            </button>
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
    <div className="rounded-xl border border-border bg-card">
      <div
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-base font-semibold text-foreground">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary px-2 py-px text-xs font-semibold text-primary-foreground">
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
        </button>
        <div className="flex items-center gap-3">
          <button type="button" aria-label={open ? "Collapse filters" : "Expand filters"} onClick={() => setOpen((v) => !v)}>
            {open ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by rule ID, name, tag…"
              className="h-9 w-full pl-9 text-base"
            />
          </div>
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

function RowActionMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
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
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex size-7 items-center justify-center rounded border border-transparent text-muted-foreground/50 transition-colors hover:border-border hover:bg-muted hover:text-foreground"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 min-w-[160px] overflow-hidden rounded-lg border border-border bg-card py-1 shadow-xl">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-base text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Edit2 className="size-3.5" />
            Edit Rule
          </button>
          <div className="my-1 h-px bg-border" />
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex w-full items-center gap-2 px-3 py-2 text-base text-sev-critical hover:bg-sev-critical/10"
          >
            <Trash2 className="size-3.5" />
            Delete Rule
          </button>
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
    <div className="relative">
      <div
        className={cn(
          "flex min-h-[42px] cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 transition-colors focus-within:border-primary",
          invalid && "border-sev-critical"
        )}
        onClick={() => { ref.current?.focus(); setOpen(true); }}
      >
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 text-sm font-medium text-foreground"
          >
            {t}
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(t); }}
              className="flex size-4 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            >
              <X className="size-2.5" />
            </button>
          </span>
        ))}
        <input
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
          className="min-w-[80px] flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      {open && (filteredSuggestions.length > 0 || showCreate) && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-[220px] overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg">
          {filteredSuggestions.length > 0 && (
            <div className="mb-1 px-2 py-1 text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
              Existing tags
            </div>
          )}
          {filteredSuggestions.slice(0, 10).map((sg) => (
            <button
              key={sg}
              onMouseDown={(e) => { e.preventDefault(); commit(sg); }}
              className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-base text-foreground hover:bg-muted"
            >
              <span className="inline-block size-1.5 rounded-full bg-primary/60" />
              {sg}
            </button>
          ))}
          {showCreate && (
            <>
              {filteredSuggestions.length > 0 && <div className="my-1 border-t border-border" />}
              <button
                onMouseDown={(e) => { e.preventDefault(); commit(); }}
                className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-base text-primary hover:bg-primary/10"
              >
                <Plus className="size-3" />
                Create "{val.trim()}"
              </button>
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
  { sev: "critical", label: "Critical", active: "border-sev-critical/50 bg-sev-critical/10 text-sev-critical", dot: "bg-sev-critical" },
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
    <div className="flex flex-col gap-5 pb-20">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {sourceModel ?? (mode === "create" ? "Create Rule" : "Edit Rule")}
        </h1>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <h2 className="mb-4 text-lg font-bold text-foreground">Rule Information</h2>
          <div className="space-y-4">
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
                {s.errors.name && <p className="mt-1 text-xs text-sev-critical">{s.errors.name}</p>}
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
                  <p className="mt-1 text-xs text-sev-critical">{s.errors.description}</p>
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
                {s.errors.tags && <p className="mt-1 text-xs text-sev-critical">{s.errors.tags}</p>}
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
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:left-[var(--sidebar-width,16rem)]">
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
        <ModalHeader
          title="Delete Rule"
          description="This action cannot be undone."
          icon={Trash2}
          tone="destructive"
        />
        <ModalBody className="text-base text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">{ruleName}</span>? Any models that
          reference this rule will need to be updated.
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} className="gap-1.5">
            <Trash2 className="size-3.5" />
            Delete Rule
          </Button>
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
  // Set when we arrived here to edit a model's extracted rule — save bounces back to the model.
  const extractedHandoff = React.useRef<{ returnTo: string; modelId: string; ruleId: string } | null>(null);
  /** Model file an extracted rule came from — titles the builder when set. */
  const [sourceModel, setSourceModel] = React.useState<string | null>(null);
  const initialView = searchParams.get("new") === "true" ? "builder" : "list";
  const [view, setView] = React.useState<"list" | "builder">(initialView);
  const [builderMode, setBuilderMode] = React.useState<"create" | "edit">("create");
  const [editingRule, setEditingRule] = React.useState<RuleData | null>(null);
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
    // Opened from Model Management "Edit" on a model-extracted rule → edit it on the full
    // builder page; saving bounces back to the model editor.
    const handoff = (location.state as { extractedEdit?: { rule: RuleData; modelId: string; ruleId: string; returnTo: string; sourceModel?: string } } | null)?.extractedEdit;
    if (handoff) {
      extractedHandoff.current = { returnTo: handoff.returnTo, modelId: handoff.modelId, ruleId: handoff.ruleId };
      setSourceModel(handoff.sourceModel ?? null);
      setEditingRule(handoff.rule);
      setBuilderMode("edit");
      setView("builder");
      window.history.replaceState({}, "");
      return;
    }
    // Opened from Model Management "Edit" on a library rule → jump straight to its builder.
    const editId = searchParams.get("edit");
    if (editId) {
      const target = rules.find((r) => r.id === editId);
      if (target) {
        setEditingRule(target);
        setBuilderMode("edit");
        setView("builder");
      }
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

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Rule Library</PageHeader.Title>
          <PageHeader.Description>
            Create and manage detection rules and alert conditions.
          </PageHeader.Description>
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
      <div className="flex items-center justify-between gap-3">
        <p className="text-base text-muted-foreground">
          <strong className="text-foreground">{filtered.length}</strong>{" "}
          Rule{filtered.length !== 1 ? "s" : ""}
          {(search || hasActiveFilters) && (
            <button
              onClick={() => { setSearch(""); setFilters(EMPTY_RULE_FILTERS); }}
              className="ml-2 text-muted-foreground underline hover:text-primary"
            >
              Clear all
            </button>
          )}
        </p>
        <div className="flex-shrink-0">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="h-9 w-[160px]">
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
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
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
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
            <BookOpen className="size-10 opacity-20" />
            <p className="text-sm">No rules match the current filters.</p>
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilters(EMPTY_RULE_FILTERS); }}>
              Clear filters
            </Button>
          </div>
        )
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead className="bg-muted/30">
                <tr className="border-b border-border text-left">
                  {(
                    [
                      { label: "RULE ID",          cls: "w-[120px]" },
                      { label: "RULE NAME",        cls: "w-[210px]" },
                      { label: "RULE DESCRIPTION", cls: "" },
                      { label: "TAG",              cls: "w-[260px]" },
                      { label: "CREATED",          cls: "w-[180px]", sort: true },
                      { label: "ACTION",           cls: "w-[64px]" },
                    ] as { label: string; cls: string; sort?: boolean }[]
                  ).map(({ label, cls, sort }) => (
                    <th
                      key={label}
                      className={cn(
                        "px-4 py-2.5 font-mono text-2xs uppercase tracking-[0.15em] text-muted-foreground/60",
                        cls
                      )}
                    >
                      {sort ? (
                        <button
                          onClick={() => setSortBy((s) => (s === "newest" ? "oldest" : "newest"))}
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          {label}
                          <ArrowUpDown className="size-3 opacity-40" />
                        </button>
                      ) : (
                        label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((rule) => (
                  <tr
                    key={rule.id}
                    onClick={() => openEdit(rule)}
                    className="group cursor-pointer text-base transition-colors hover:bg-muted/20"
                  >
                    {/* Rule ID */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-muted-foreground transition-colors group-hover:text-primary">
                        {rule.id}
                      </span>
                    </td>

                    {/* Rule Name + Severity badge */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                          {rule.name}
                        </span>
                        <SeverityBadge severity={rule.severity} />
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3">
                      <TruncatedText text={rule.description} className="line-clamp-2 text-base text-muted-foreground" />
                    </td>

                    {/* Tags */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <ExpandableTags tags={rule.tags} />
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="size-3 flex-shrink-0" />
                        {rule.createdAtDisplay}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <RowActionMenu
                        onEdit={() => openEdit(rule)}
                        onDelete={() => setDeleteId(rule.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
