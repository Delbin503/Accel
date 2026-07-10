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
  GripVertical,
  ArrowLeft,
  ArrowUpDown,
  Calendar,
  Check,
  SlidersHorizontal,
  Bookmark,
  Clock,
  LayoutTemplate,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  ZONES_LIST,
  CONDITIONS_LIST,
  ACTIONS_LIST,
  SCHEDULES_LIST,
  OPERATORS_LIST,
  UNITS_LIST,
  TEMPLATES,
} from "@/mocks/rulesLibrary";
import { MOCK_MODELS } from "@/mocks/modelManagement";
import type { RuleData, ConditionRow, RowType, RuleSeverity } from "@/types/rules";

/* Detection models available as WHEN suggestions — selectable by name, with
 * their model ID shown alongside. Free-typed classes/variables are also allowed. */
const MODEL_OPTIONS: string[] = MOCK_MODELS.map((m) => m.name);
const MODEL_ID_BY_NAME: Record<string, string> = Object.fromEntries(
  MOCK_MODELS.map((m) => [m.name, m.id])
);

/* ── Utility ─────────────────────────────────────────────────────────────── */

let _idCtr = 0;
function genId() {
  return `row-${++_idCtr}-${Math.random().toString(36).slice(2, 5)}`;
}

/* ── Row style registry ──────────────────────────────────────────────────── */

interface RowMeta {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  teal?: boolean;
}

const ROW_META: Record<RowType, RowMeta> = {
  WHEN:   { label: "WHEN",   bgClass: "bg-success/15",       textClass: "text-success",      borderClass: "border-success/40" },
  IN:     { label: "IN",     bgClass: "bg-primary/15",       textClass: "text-primary",      borderClass: "border-primary/40" },
  AND:    { label: "AND",    bgClass: "bg-warning/15",   textClass: "text-warning",  borderClass: "border-warning/40" },
  OR:     { label: "OR",     bgClass: "bg-sev-critical/15",  textClass: "text-sev-critical", borderClass: "border-sev-critical/40" },
  THEN:   { label: "THEN",   bgClass: "bg-purple/15",        textClass: "text-purple",       borderClass: "border-purple/40" },
  During: { label: "During", bgClass: "",                    textClass: "",                  borderClass: "", teal: true },
  FOR:    { label: "FOR",    bgClass: "bg-info/15",          textClass: "text-info",         borderClass: "border-info/40" },
};

const TEAL_INLINE = {
  background: "rgba(20,184,166,0.15)",
  color: "#14b8a6",
  borderColor: "rgba(20,184,166,0.4)",
} as const;

const SWAP_OPTIONS: { type: RowType; desc: string }[] = [
  { type: "FOR",    desc: "Duration — more than X seconds/minutes" },
  { type: "AND",    desc: "Additional condition" },
  { type: "THEN",   desc: "Action to take" },
  { type: "OR",     desc: "Alternative condition" },
  { type: "During", desc: "Schedule window" },
  { type: "WHEN",   desc: "Pick which model/detection triggers the rule" },
  { type: "IN",     desc: "Pick which zone/area it applies to" },
];

/* ── Plain-English summary ───────────────────────────────────────────────── */

function buildSummary(rows: ConditionRow[]): React.ReactNode {
  if (rows.length === 0) {
    return (
      <span className="italic text-muted-foreground">
        Add a condition or action to see the rule summary…
      </span>
    );
  }

  const nodes: React.ReactNode[] = [];
  const firstThenIdx = rows.findIndex((r) => r.type === "THEN");

  rows.forEach((row, i) => {
    const m = ROW_META[row.type];
    const isLt = row.operator.includes("less");

    nodes.push(
      <span
        key={`kw-${i}`}
        className={cn(
          "mx-0.5 inline-flex items-center rounded px-1.5 py-px font-mono text-xs font-bold",
          m.teal ? "" : cn(m.bgClass, m.textClass)
        )}
        style={m.teal ? { background: TEAL_INLINE.background, color: TEAL_INLINE.color } : undefined}
      >
        {row.type === "THEN" ? (i === firstThenIdx ? "Then" : "and also") : m.label}
      </span>
    );

    if (row.field) {
      nodes.push(
        <span key={`f-${i}`} className="mx-0.5 font-semibold text-foreground">
          {row.field}
        </span>
      );
    }

    if (row.type === "WHEN") {
      nodes.push(
        <span key={`s-${i}`} className="mx-0.5 text-muted-foreground">
          is detected
        </span>
      );
    }

    if ((row.type === "AND" || row.type === "OR" || row.type === "FOR") && row.operator) {
      nodes.push(
        <span
          key={`op-${i}`}
          className={cn(
            "mx-0.5 inline-flex items-center rounded px-1.5 py-px font-mono text-xs font-bold",
            isLt ? "bg-sev-critical/15 text-sev-critical" : "bg-info/15 text-info"
          )}
        >
          › {row.operator}
        </span>
      );
    }

    if ((row.type === "AND" || row.type === "OR" || row.type === "FOR") && row.value) {
      nodes.push(
        <span key={`v-${i}`} className="mx-0.5 font-semibold text-foreground">
          {row.value}
          {row.unit ? ` ${row.unit}` : ""}
        </span>
      );
    }

    if (i < rows.length - 1) nodes.push(<span key={`sp-${i}`}> </span>);
  });

  return <>{nodes}</>;
}

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
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
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
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange(EMPTY_RULE_FILTERS);
                onSearchChange("");
              }}
              className="text-sm text-muted-foreground underline hover:text-primary"
            >
              Clear all
            </button>
          )}
          {open ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

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

/* ── Active filter bar ───────────────────────────────────────────────────── */

function RuleActiveFilterBar({
  filters,
  onRemove,
  onClearAll,
}: {
  filters: RuleFilters;
  onRemove: (group: keyof RuleFilters, value: string) => void;
  onClearAll: () => void;
}) {
  const allActive = (Object.keys(filters) as (keyof RuleFilters)[]).flatMap((group) =>
    filters[group].map((val) => ({ group, value: val, label: val }))
  );

  if (allActive.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
      {allActive.map(({ group, value, label }) => (
        <span
          key={`${group}-${value}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary"
        >
          {label}
          <button
            onClick={() => onRemove(group, value)}
            className="flex size-4 items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-white"
          >
            <X className="size-2.5" />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="ml-auto text-xs text-muted-foreground underline hover:text-primary"
      >
        Clear all
      </button>
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

function KeywordBadge({ type, isAndAlso, onClick }: { type: RowType; isAndAlso?: boolean; onClick: () => void }) {
  const m = ROW_META[type];
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-[80px] flex-shrink-0 items-center justify-between gap-1 rounded-md border px-2.5 py-1.5 font-mono text-xs font-bold transition-opacity hover:opacity-80",
        m.teal ? "" : cn(m.bgClass, m.textClass, m.borderClass)
      )}
      style={m.teal ? TEAL_INLINE : undefined}
    >
      <span>{isAndAlso ? "and also" : type === "THEN" ? "Then" : m.label}</span>
      <ChevronDown className="size-2.5 opacity-60" />
    </button>
  );
}

/* ── Type swap popover ───────────────────────────────────────────────────── */

function SwapPopover({
  currentType,
  onSelect,
  onClose,
}: {
  currentType: RowType;
  onSelect: (t: RowType) => void;
  onClose: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full z-50 mt-1 min-w-[280px] overflow-hidden rounded-xl border border-border bg-card py-1.5 shadow-2xl"
    >
      <p className="px-3 pb-1 pt-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
        Change Row Type
      </p>
      {SWAP_OPTIONS.map(({ type, desc }) => {
        const m = ROW_META[type];
        return (
          <button
            key={type}
            onClick={() => { onSelect(type); onClose(); }}
            className={cn(
              "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted",
              type === currentType && "bg-muted/60"
            )}
          >
            <span
              className={cn(
                "w-[68px] flex-shrink-0 rounded px-2 py-px text-center font-mono text-xs font-bold",
                m.teal ? "" : cn(m.bgClass, m.textClass)
              )}
              style={m.teal ? { background: TEAL_INLINE.background, color: TEAL_INLINE.color } : undefined}
            >
              {m.label}
            </span>
            <span className="text-sm text-muted-foreground">{desc}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Operator pill ───────────────────────────────────────────────────────── */

function OperatorPill({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const isLt = value.includes("less");

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
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1 rounded-md border px-2.5 py-1.5 font-mono text-xs font-bold transition-colors",
          isLt
            ? "border-sev-critical/40 bg-sev-critical/15 text-sev-critical"
            : "border-info/40 bg-info/15 text-info"
        )}
      >
        › {value || "operator"}
        <ChevronDown className="size-2.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[150px] overflow-hidden rounded-lg border border-border bg-card py-1 shadow-xl">
          {OPERATORS_LIST.map((op) => (
            <button
              key={op}
              onClick={() => { onChange(op); setOpen(false); }}
              className={cn(
                "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                op === value ? "font-semibold text-foreground" : "text-muted-foreground"
              )}
            >
              {op}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Field search input ──────────────────────────────────────────────────── */

function FieldSearch({
  value,
  placeholder,
  options,
  onChange,
  hints,
  icon: Icon = Search,
}: {
  value: string;
  placeholder: string;
  options: string[];
  onChange: (v: string) => void;
  /** Optional right-aligned hint per option (e.g. a model ID shown beside the name). */
  hints?: Record<string, string>;
  /** Leading icon — defaults to a search magnifier. */
  icon?: React.ElementType;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const filtered = options.filter((o) => o.toLowerCase().includes(value.toLowerCase()));

  React.useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative min-w-[160px] flex-1" ref={ref}>
      <div
        className="flex cursor-text items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 transition-colors focus-within:border-primary hover:border-muted-foreground/40"
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        <Icon className="size-3.5 flex-shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
        {value && (
          <button
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-44 min-w-full overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-xl">
          {filtered.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-base transition-colors hover:bg-muted",
                opt === value ? "font-semibold text-foreground" : "text-muted-foreground"
              )}
            >
              <span className="truncate">{opt}</span>
              {hints?.[opt] && (
                <span className="flex-shrink-0 rounded border border-border bg-muted px-1.5 py-px font-mono text-xs text-muted-foreground">
                  {hints[opt]}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Single condition row ────────────────────────────────────────────────── */

const FIELD_OPTIONS: Record<RowType, string[]> = {
  WHEN:   MODEL_OPTIONS,
  IN:     ZONES_LIST,
  AND:    CONDITIONS_LIST,
  OR:     CONDITIONS_LIST,
  THEN:   ACTIONS_LIST,
  During: SCHEDULES_LIST,
  FOR:    [],
};

const FIELD_PLACEHOLDER: Record<RowType, string> = {
  WHEN:   "Select a model or type a class / variable…",
  IN:     "Select zone",
  AND:    "Pick condition",
  OR:     "Pick condition",
  THEN:   "Pick action",
  During: "Pick schedule",
  FOR:    "",
};

function ConditionRowItem({
  row,
  isAndAlso,
  swapOpen,
  onSwapToggle,
  onUpdate,
  onRemove,
  isDragging,
  isOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  row: ConditionRow;
  isAndAlso: boolean;
  swapOpen: boolean;
  onSwapToggle: () => void;
  onUpdate: (id: string, patch: Partial<ConditionRow>) => void;
  onRemove: (id: string) => void;
  isDragging: boolean;
  isOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const hasField = row.type !== "FOR";
  const hasOpValue = row.type === "AND" || row.type === "OR" || row.type === "FOR";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "group relative flex flex-wrap items-center gap-2 rounded-lg py-0.5 transition-all",
        isDragging && "opacity-40",
        isOver && "border-t-2 border-primary pt-1"
      )}
    >
      {/* Drag handle */}
      <GripVertical className="size-4 flex-shrink-0 cursor-grab text-muted-foreground/20 opacity-0 transition-opacity group-hover:opacity-100" />

      {/* Keyword badge — first THEN shows "Then", later THEN rows show "and also" */}
      <div className="relative flex-shrink-0">
        <KeywordBadge type={row.type} isAndAlso={isAndAlso} onClick={onSwapToggle} />
        {swapOpen && (
          <SwapPopover
            currentType={row.type}
            onSelect={(t) =>
              onUpdate(row.id, {
                type: t,
                field: "",
                operator: t === "AND" || t === "OR" || t === "FOR" ? "more than" : "",
                value: t === "AND" || t === "OR" || t === "FOR" ? "3" : "",
                unit:  t === "AND" || t === "OR" || t === "FOR" ? "Seconds" : "",
              })
            }
            onClose={onSwapToggle}
          />
        )}
      </div>

      {/* Field selector */}
      {hasField && (
        <FieldSearch
          value={row.field}
          placeholder={FIELD_PLACEHOLDER[row.type]}
          options={FIELD_OPTIONS[row.type]}
          hints={row.type === "WHEN" ? MODEL_ID_BY_NAME : undefined}
          icon={row.type === "WHEN" ? Tag : undefined}
          onChange={(v) => {
            // When switching to Custom Hours, seed default times
            const isCustom = v === "Custom Hours" && row.type === "During";
            onUpdate(row.id, isCustom
              ? { field: v, value: row.value || "08:00", unit: row.unit || "18:00" }
              : { field: v });
          }}
        />
      )}

      {/* Custom Hours time pickers */}
      {row.type === "During" && row.field === "Custom Hours" && (
        <div className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1">
          <Clock className="size-3 text-muted-foreground" />
          <input
            type="time"
            value={row.value || "08:00"}
            onChange={(e) => onUpdate(row.id, { value: e.target.value })}
            className="bg-transparent text-sm text-foreground outline-none"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="time"
            value={row.unit || "18:00"}
            min={row.value || "00:00"}
            onChange={(e) => onUpdate(row.id, { unit: e.target.value })}
            className="bg-transparent text-sm text-foreground outline-none"
          />
        </div>
      )}

      {/* Model ID badge — shown when a known detection model is selected */}
      {row.type === "WHEN" && MODEL_ID_BY_NAME[row.field] && (
        <span className="flex-shrink-0 rounded border border-border bg-muted px-1.5 py-px font-mono text-xs text-muted-foreground">
          {MODEL_ID_BY_NAME[row.field]}
        </span>
      )}

      {/* Suffix for WHEN */}
      {row.type === "WHEN" && (
        <span className="flex-shrink-0 text-base text-muted-foreground">is detected</span>
      )}

      {/* Operator + value + unit for AND / OR / FOR */}
      {hasOpValue && (
        <>
          <OperatorPill value={row.operator} onChange={(v) => onUpdate(row.id, { operator: v })} />
          <input
            type="number"
            value={row.value}
            onChange={(e) => onUpdate(row.id, { value: e.target.value })}
            className="w-16 rounded-md border border-border bg-background px-2 py-1.5 text-center text-base text-foreground outline-none focus:border-primary"
          />
          <Select value={row.unit} onValueChange={(v) => onUpdate(row.id, { unit: v })}>
            <SelectTrigger className="h-8 w-auto text-sm">
              <SelectValue placeholder="Unit" />
            </SelectTrigger>
            <SelectContent>
              {UNITS_LIST.map((u) => (
                <SelectItem key={u} value={u}>{u}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      {/* Remove button */}
      <button
        onClick={() => onRemove(row.id)}
        className="ml-auto flex size-7 flex-shrink-0 items-center justify-center rounded opacity-0 text-muted-foreground/40 transition-opacity hover:bg-sev-critical/10 hover:text-sev-critical group-hover:opacity-100"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

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

function TemplatesTabContent({ onLoadTemplate }: { onLoadTemplate: (i: number) => void }) {
  const [search, setSearch] = React.useState("");
  const [tagFilter, setTagFilter] = React.useState<string[]>([]);
  const [tagOpen, setTagOpen] = React.useState(false);

  const allTags = Array.from(new Set(TEMPLATES.flatMap((t) => t.tags))).sort();
  const filtered = TEMPLATES.map((t, i) => ({ t, i })).filter(({ t }) => {
    if (search) {
      const q = search.toLowerCase();
      if (![t.name, t.description, ...t.tags].join(" ").toLowerCase().includes(q)) return false;
    }
    if (tagFilter.length > 0 && !tagFilter.every((tag) => t.tags.includes(tag))) return false;
    return true;
  });

  return (
    <>
      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates…" className="h-8 pl-8 text-sm" />
        </div>
        <Popover open={tagOpen} onOpenChange={setTagOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between gap-1.5">
              <span className="inline-flex items-center gap-1.5">
                Tags
                {tagFilter.length > 0 && (
                  <span className="rounded-full bg-primary px-1.5 py-px text-2xs font-bold text-primary-foreground">
                    {tagFilter.length}
                  </span>
                )}
              </span>
              <ChevronDown className="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="max-h-[240px] w-52 overflow-y-auto p-1.5">
            {allTags.map((tag) => {
              const checked = tagFilter.includes(tag);
              return (
                <button key={tag}
                  onClick={() => setTagFilter((curr) => curr.includes(tag) ? curr.filter((x) => x !== tag) : [...curr, tag])}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                  <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                    checked ? "border-primary bg-primary" : "border-muted-foreground/40")}>
                    {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
                  </div>
                  {tag}
                </button>
              );
            })}
            {tagFilter.length > 0 && (
              <button onClick={() => setTagFilter([])}
                className="mt-1 w-full rounded px-2 py-1.5 text-center text-xs text-muted-foreground underline hover:text-primary">
                Clear all
              </button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm italic text-muted-foreground">
          No templates match the current filters.
        </p>
      ) : (
        filtered.map(({ t: tpl, i: idx }) => (
          <button
            key={idx}
            onClick={() => onLoadTemplate(idx)}
            className="w-full rounded-xl border border-border bg-background p-3.5 text-left transition-all hover:border-primary"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-base font-bold text-foreground">{tpl.name}</span>
              <span className="rounded border border-border bg-muted px-1.5 py-px font-mono text-2xs font-semibold text-muted-foreground">
                {tpl.model}
              </span>
            </div>
            <p className="mb-2.5 text-xs leading-relaxed text-muted-foreground">
              {tpl.description}
            </p>
            <div className="flex flex-wrap items-center gap-1">
              {tpl.tags.slice(0, 4).map((t) => (
                <span key={t} className="rounded border border-border bg-muted px-1.5 py-px text-2xs font-medium text-muted-foreground">
                  {t}
                </span>
              ))}
              <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-px text-2xs font-semibold text-primary">
                {tpl.conditions.length} Rules
              </span>
            </div>
          </button>
        ))
      )}
    </>
  );
}

function BuilderSidePanel({
  rows,
  severity,
  onSeverityChange,
  tab,
  onTabChange,
  onLoadTemplate,
  showEstimatedRate = false,
}: {
  rows: ConditionRow[];
  severity: RuleSeverity;
  onSeverityChange: (s: RuleSeverity) => void;
  tab: "summary" | "template";
  onTabChange: (t: "summary" | "template") => void;
  onLoadTemplate: (i: number) => void;
  showEstimatedRate?: boolean;
}) {
  const hasSummary = rows.length > 0;
  const BARS = [40, 65, 30, 50, 80, 55, 70];

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex border-b border-border px-4">
        {(["summary", "template"] as const).map((t) => (
          <button
            key={t}
            onClick={() => onTabChange(t)}
            className={cn(
              "mr-6 border-b-2 pb-3 pt-3.5 text-base font-semibold capitalize transition-colors",
              tab === t
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "summary" ? "Summary" : "Template"}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {tab === "summary" && (
          <>
            <p className="text-sm font-semibold text-foreground">Rule in Plain English</p>
            <div className="min-h-[90px] rounded-lg border border-border bg-background p-3.5 text-base leading-relaxed">
              {buildSummary(rows)}
            </div>

            {hasSummary && showEstimatedRate && (
              <div className="rounded-lg border border-border bg-background p-3.5">
                <p className="mb-0.5 text-2xs font-bold uppercase tracking-wider text-muted-foreground">
                  Estimated trigger rate
                </p>
                <div className="font-mono text-2xl font-bold text-foreground">~14</div>
                <p className="mb-2 text-xs text-muted-foreground">
                  times in the past 7 days (based on historical data)
                </p>
                <div className="flex h-9 items-end gap-0.5">
                  {BARS.map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm bg-primary opacity-70" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="mt-1 flex justify-between font-mono text-3xs text-muted-foreground">
                  {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => <span key={d}>{d}</span>)}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-border bg-background p-3.5">
              <p className="mb-0.5 text-2xs font-bold uppercase tracking-wider text-muted-foreground">
                Severity Score When Fired
              </p>
              <p className="mb-3 text-xs text-muted-foreground">
                Priority of the alert when this rule triggers
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SEV_OPTS.map(({ sev, label, active, dot }) => {
                  const isActive = severity === sev;
                  return (
                    <button
                      key={sev}
                      onClick={() => onSeverityChange(sev)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-all",
                        isActive
                          ? active
                          : "border-border bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className={cn("size-1.5 flex-shrink-0 rounded-full", isActive ? dot : "bg-muted-foreground/40")} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {tab === "template" && (
          <TemplatesTabContent onLoadTemplate={onLoadTemplate} />
        )}
      </div>
    </div>
  );
}

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
  rows: ConditionRow[];
  severity: RuleSeverity;
  sideTab: "summary" | "template";
  swapRowId: string | null;
  errors: BuilderErrors;
}

const EMPTY_BUILDER: BuilderState = {
  name: "",
  description: "",
  tags: [],
  rows: [],
  severity: "critical",
  sideTab: "summary",
  swapRowId: null,
  errors: {},
};

function ruleToBuilder(rule: RuleData): BuilderState {
  return {
    name: rule.name,
    description: rule.description,
    tags: [...rule.tags],
    rows: rule.conditions.map((c) => ({ ...c })),
    severity: rule.severity,
    sideTab: "summary",
    swapRowId: null,
    errors: {},
  };
}

/* ── Rule Builder view ───────────────────────────────────────────────────── */

function RuleBuilder({
  mode,
  editingRule,
  existingTags,
  onBack,
  onConfirm,
  onSaveTemplate,
}: {
  mode: "create" | "edit";
  editingRule: RuleData | null;
  existingTags: readonly string[];
  onBack: () => void;
  onConfirm: (
    data: Omit<RuleData, "id" | "createdAt" | "createdAtDisplay" | "createdTimeDisplay">
  ) => void;
  onSaveTemplate: (
    data: Omit<RuleData, "id" | "createdAt" | "createdAtDisplay" | "createdTimeDisplay">
  ) => void;
}) {
  const [s, setS] = React.useState<BuilderState>(() =>
    mode === "edit" && editingRule ? ruleToBuilder(editingRule) : { ...EMPTY_BUILDER }
  );
  const [dragIdx, setDragIdx] = React.useState<number | null>(null);
  const [overIdx, setOverIdx] = React.useState<number | null>(null);
  const [savedRecently, setSavedRecently] = React.useState(false);

  function handleSaveTemplateClick() {
    onSaveTemplate({ name: s.name, description: s.description, tags: s.tags, conditions: s.rows, severity: s.severity });
    setSavedRecently(true);
    setTimeout(() => setSavedRecently(false), 2000);
  }

  function patch(p: Partial<BuilderState>) {
    setS((prev) => ({ ...prev, ...p }));
  }

  function clearError(field: keyof BuilderErrors) {
    setS((prev) =>
      prev.errors[field] ? { ...prev, errors: { ...prev.errors, [field]: undefined } } : prev
    );
  }

  function addCondition() {
    const isFirst = s.rows.length === 0;
    clearError("conditions");
    patch({
      rows: [
        ...s.rows,
        {
          id: genId(),
          type: isFirst ? "WHEN" : "AND",
          field: "",
          operator: isFirst ? "" : "more than",
          value: isFirst ? "" : "3",
          unit: isFirst ? "" : "Seconds",
        },
      ],
    });
  }

  function validate(): BuilderErrors {
    const errors: BuilderErrors = {};
    if (!s.name.trim()) errors.name = "Rule name is required.";
    if (!s.description.trim()) errors.description = "Rule description is required.";
    if (s.tags.length === 0) errors.tags = "Add at least one tag.";
    if (s.rows.length === 0) errors.conditions = "Add at least one condition.";
    return errors;
  }

  function handleConfirmClick() {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      patch({ errors });
      return;
    }
    onConfirm({ name: s.name, description: s.description, tags: s.tags, conditions: s.rows, severity: s.severity });
  }


  function updateRow(id: string, p: Partial<ConditionRow>) {
    patch({ rows: s.rows.map((r) => (r.id === id ? { ...r, ...p } : r)) });
  }

  function removeRow(id: string) {
    patch({ rows: s.rows.filter((r) => r.id !== id) });
  }

  function handleDrop(targetIdx: number) {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null);
      setOverIdx(null);
      return;
    }
    const next = [...s.rows];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(targetIdx, 0, moved);
    patch({ rows: next });
    setDragIdx(null);
    setOverIdx(null);
  }

  function loadTemplate(idx: number) {
    const tpl = TEMPLATES[idx];
    patch({
      rows: tpl.conditions.map((c) => ({ ...c, id: genId() })),
      severity: tpl.severity,
      sideTab: "summary",
    });
  }

  const canSave = s.name.trim() && s.description.trim() && s.tags.length > 0;

  return (
    <div className="flex flex-col gap-5 pb-20">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {mode === "create" ? "Create Rule" : "Edit Rule"}
        </h1>
      </div>

      <div className="grid grid-cols-[1fr_360px] items-start gap-5">
        <div className="space-y-6">
          <div>
            <h2 className="mb-4 text-lg font-bold text-foreground">Rule Information</h2>
            <div className="space-y-4">
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
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Rule Conditions</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Define the trigger, conditions, duration and actions for this rule.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={addCondition} className="gap-1.5">
                <Plus className="size-3.5" />
                Add Condition
              </Button>
            </div>

            <div
              className={cn(
                "min-h-[320px] rounded-xl border border-border bg-card p-5",
                s.errors.conditions && "border-sev-critical"
              )}
            >
              {s.rows.length === 0 ? (
                <button
                  type="button"
                  onClick={addCondition}
                  className="group flex h-full min-h-[260px] w-full flex-col items-center justify-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <div className="flex size-11 items-center justify-center rounded-full border border-border transition-colors group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary">
                    <Plus className="size-5" />
                  </div>
                  <p className="text-base">
                    Click to add your first condition
                  </p>
                </button>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const firstThenIdx = s.rows.findIndex((r) => r.type === "THEN");
                    return s.rows.map((row, idx) => (
                    <ConditionRowItem
                      key={row.id}
                      row={row}
                      isAndAlso={row.type === "THEN" && idx !== firstThenIdx}
                      swapOpen={s.swapRowId === row.id}
                      onSwapToggle={() =>
                        patch({ swapRowId: s.swapRowId === row.id ? null : row.id })
                      }
                      onUpdate={updateRow}
                      onRemove={removeRow}
                      isDragging={dragIdx === idx}
                      isOver={overIdx === idx && dragIdx !== idx}
                      onDragStart={() => setDragIdx(idx)}
                      onDragOver={(e) => { e.preventDefault(); setOverIdx(idx); }}
                      onDrop={() => handleDrop(idx)}
                      onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                    />
                    ));
                  })()}
                </div>
              )}
            </div>
            {s.errors.conditions && (
              <p className="mt-1 text-xs text-sev-critical">{s.errors.conditions}</p>
            )}
          </div>
        </div>

        <div className="sticky top-4">
          <BuilderSidePanel
            rows={s.rows}
            severity={s.severity}
            onSeverityChange={(sv) => patch({ severity: sv })}
            tab={s.sideTab}
            onTabChange={(t) => patch({ sideTab: t })}
            onLoadTemplate={loadTemplate}
            showEstimatedRate={mode === "edit"}
          />
        </div>
      </div>

      {/* Sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:left-[var(--sidebar-width,16rem)]">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="size-3.5" />
            Go Back
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canSave || savedRecently}
            onClick={handleSaveTemplateClick}
            className={cn("gap-1.5", savedRecently && "border-success/40 text-success")}
          >
            {savedRecently ? <Check className="size-3.5" /> : <Bookmark className="size-3.5" />}
            {savedRecently ? "Saved" : "Save as Template"}
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

function DeleteModal({
  ruleName,
  onConfirm,
  onCancel,
}: {
  ruleName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="w-[440px] max-w-[95vw] p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-destructive">
            <Trash2 className="size-4" />
            Delete Rule
          </DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">This action cannot be undone.</p>
        </DialogHeader>
        <div className="px-5 py-4 text-base text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">{ruleName}</span>? Any models that
          reference this rule will need to be updated.
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} className="gap-1.5">
            <Trash2 className="size-3.5" />
            Delete Rule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

export default function RulesLibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Set when we arrived here to edit a model's extracted rule — save bounces back to the model.
  const extractedHandoff = React.useRef<{ returnTo: string; modelId: string; ruleId: string } | null>(null);
  const initialView = searchParams.get("new") === "true" ? "builder" : "list";
  const [view, setView] = React.useState<"list" | "builder" | "templates">(initialView);
  const [builderMode, setBuilderMode] = React.useState<"create" | "edit">("create");
  const [editingRule, setEditingRule] = React.useState<RuleData | null>(null);
  const [rules, setRules] = React.useState<RuleData[]>(MOCK_RULES);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<RuleFilters>(EMPTY_RULE_FILTERS);
  const [sortBy, setSortBy] = React.useState<"newest" | "oldest" | "name-asc" | "name-desc">("newest");
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  // Saved user templates (separate from built-in TEMPLATES mocks)
  interface UserTemplate {
    id: string;
    name: string;
    description: string;
    tags: string[];
    severity: RuleSeverity;
    conditions: ConditionRow[];
    savedAtDisplay: string;
  }
  const [userTemplates, setUserTemplates] = React.useState<UserTemplate[]>([]);
  const [deleteTemplateId, setDeleteTemplateId] = React.useState<string | null>(null);
  const [templateSearch, setTemplateSearch] = React.useState("");
  const [templateTagFilter, setTemplateTagFilter] = React.useState<string[]>([]);
  const [tagFilterOpen, setTagFilterOpen] = React.useState(false);

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
    const handoff = (location.state as { extractedEdit?: { rule: RuleData; modelId: string; ruleId: string; returnTo: string } } | null)?.extractedEdit;
    if (handoff) {
      extractedHandoff.current = { returnTo: handoff.returnTo, modelId: handoff.modelId, ruleId: handoff.ruleId };
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
    }
    // If we arrived here from Model Management's +Add Rule button, bounce back to the
    // model editor we came from so the new rule lands directly in its Rule Library panel.
    if (cameFromModel.current && builderMode === "create") {
      cameFromModel.current = false;
      const target = returnModelId.current
        ? `/models?model=${returnModelId.current}`
        : "/models";
      navigate(target, { replace: true });
      return;
    }
    setView("list");
  }

  const deleteTarget = rules.find((r) => r.id === deleteId);
  const hasActiveFilters = filters.tags.length > 0 || filters.severity.length > 0;

  function handleSaveTemplate(
    data: Omit<RuleData, "id" | "createdAt" | "createdAtDisplay" | "createdTimeDisplay">
  ) {
    const n = new Date();
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const display = `${n.getDate()} ${MONTHS[n.getMonth()]} ${n.getFullYear()}`;
    const tpl: UserTemplate = {
      id: `tpl_${Date.now()}`,
      name: data.name || "Untitled template",
      description: data.description,
      tags: data.tags,
      severity: data.severity,
      conditions: data.conditions,
      savedAtDisplay: display,
    };
    setUserTemplates((curr) => [tpl, ...curr]);
    toast.success(`Template "${tpl.name}" saved`);
  }

  function openTemplateInBuilder(tpl: UserTemplate) {
    // Hydrate as a draft rule with cleared id so it acts as new
    const stub: RuleData = {
      id: "",
      name: tpl.name,
      description: tpl.description,
      tags: [...tpl.tags],
      severity: tpl.severity,
      conditions: tpl.conditions.map((c) => ({ ...c })),
      createdAt: "",
      createdAtDisplay: "",
      createdTimeDisplay: "",
    };
    setEditingRule(stub);
    setBuilderMode("create");
    setView("builder");
  }

  if (view === "builder") {
    return (
      <RuleBuilder
        mode={builderMode}
        editingRule={editingRule}
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
        onSaveTemplate={handleSaveTemplate}
      />
    );
  }

  if (view === "templates") {
    const allTemplateTags = Array.from(new Set(userTemplates.flatMap((t) => t.tags))).sort();
    const filteredTemplates = userTemplates.filter((tpl) => {
      if (templateSearch) {
        const q = templateSearch.toLowerCase();
        const hay = [tpl.name, tpl.description ?? "", ...tpl.tags].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (templateTagFilter.length > 0) {
        if (!templateTagFilter.every((t) => tpl.tags.includes(t))) return false;
      }
      return true;
    });
    return (
      <div className="flex flex-col gap-4">
        <PageHeader>
          <PageHeader.Content>
            <PageHeader.Title>Saved Rule Templates</PageHeader.Title>
            <PageHeader.Description>
              Reusable rule scaffolds you've saved. Click Use Template to start a new rule from one.
            </PageHeader.Description>
          </PageHeader.Content>
          <PageHeader.Actions>
            <Button variant="outline" size="sm" onClick={() => setView("list")} className="gap-1.5">
              <ArrowLeft className="size-3.5" />
              Back to Rules
            </Button>
          </PageHeader.Actions>
        </PageHeader>

        {userTemplates.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={templateSearch} onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Search templates by name, description or tag…"
                className="h-9 w-full border-0 bg-transparent pl-9 text-base focus-visible:ring-0" />
            </div>
            <Popover open={tagFilterOpen} onOpenChange={setTagFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-1.5">
                  Tags
                  {templateTagFilter.length > 0 && (
                    <span className="ml-1 rounded-full bg-primary px-1.5 py-px text-2xs font-bold text-primary-foreground">
                      {templateTagFilter.length}
                    </span>
                  )}
                  <ChevronDown className="size-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="max-h-[280px] w-56 overflow-y-auto p-1.5">
                {allTemplateTags.length === 0 ? (
                  <p className="px-2 py-3 text-center text-xs italic text-muted-foreground">No tags yet</p>
                ) : (
                  <>
                    {allTemplateTags.map((tag) => {
                      const checked = templateTagFilter.includes(tag);
                      return (
                        <button key={tag} onClick={() => {
                          setTemplateTagFilter((curr) => curr.includes(tag) ? curr.filter((x) => x !== tag) : [...curr, tag]);
                        }}
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-base text-muted-foreground hover:bg-muted hover:text-foreground">
                          <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                            checked ? "border-primary bg-primary" : "border-muted-foreground/40")}>
                            {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
                          </div>
                          {tag}
                        </button>
                      );
                    })}
                    {templateTagFilter.length > 0 && (
                      <button onClick={() => setTemplateTagFilter([])}
                        className="mt-1 w-full rounded px-2 py-1.5 text-center text-xs text-muted-foreground underline hover:text-primary">
                        Clear all
                      </button>
                    )}
                  </>
                )}
              </PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground">
              {filteredTemplates.length} of {userTemplates.length}
            </span>
          </div>
        )}

        {userTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
            <LayoutTemplate className="size-10 opacity-20" />
            <p className="text-sm">No templates yet.</p>
            <p className="max-w-xs text-center text-sm">
              When creating or editing a rule, click <strong className="text-foreground">Save as Template</strong> to add it here.
            </p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-12 text-muted-foreground">
            <LayoutTemplate className="size-8 opacity-20" />
            <p className="text-base">No templates match the current filters.</p>
            <button onClick={() => { setTemplateSearch(""); setTemplateTagFilter([]); }}
              className="text-xs underline hover:text-primary">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((tpl) => (
              <div key={tpl.id} className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <TruncatedText text={tpl.name} className="text-base font-bold text-foreground" />
                    <p className="mt-0.5 text-xs text-muted-foreground">Saved {tpl.savedAtDisplay}</p>
                  </div>
                  <SeverityBadge severity={tpl.severity} />
                </div>
                {tpl.description && (
                  <TruncatedText text={tpl.description} className="line-clamp-2 text-sm text-muted-foreground" />
                )}
                {tpl.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tpl.tags.slice(0, 3).map((t) => (
                      <span key={t} className="rounded border border-border bg-muted px-1.5 py-px text-2xs text-muted-foreground">
                        {t}
                      </span>
                    ))}
                    {tpl.tags.length > 3 && (
                      <span className="rounded border border-border bg-muted px-1.5 py-px text-2xs text-muted-foreground">
                        +{tpl.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {tpl.conditions.length} condition{tpl.conditions.length === 1 ? "" : "s"}
                </p>
                <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-sev-critical/30 text-sev-critical hover:bg-sev-critical/10"
                    onClick={() => setDeleteTemplateId(tpl.id)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                  <Button size="sm" className="gap-1.5" onClick={() => openTemplateInBuilder(tpl)}>
                    <Edit2 className="size-3.5" />
                    Use Template
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {deleteTemplateId && (
          <DeleteModal
            ruleName={userTemplates.find((t) => t.id === deleteTemplateId)?.name ?? "this template"}
            onConfirm={() => {
              setUserTemplates((curr) => curr.filter((t) => t.id !== deleteTemplateId));
              setDeleteTemplateId(null);
              toast.success("Template deleted");
            }}
            onCancel={() => setDeleteTemplateId(null)}
          />
        )}
      </div>
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
          <Button variant="outline" size="sm" onClick={() => setView("templates")} className="gap-1.5">
            <LayoutTemplate className="size-3.5" />
            View Templates
            {userTemplates.length > 0 && (
              <span className="rounded-full bg-primary px-1.5 py-px text-2xs font-semibold text-primary-foreground">
                {userTemplates.length}
              </span>
            )}
          </Button>
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="size-4" />
            Add Rule
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* Active filter pills — sits above the filter panel */}
      {hasActiveFilters && (
        <RuleActiveFilterBar
          filters={filters}
          onRemove={(group, value) =>
            setFilters((f) => ({ ...f, [group]: f[group].filter((v) => v !== value) }))
          }
          onClearAll={() => setFilters(EMPTY_RULE_FILTERS)}
        />
      )}

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
              Clear filters
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
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <BookOpen className="size-10 opacity-20" />
          <p className="text-sm">No rules match the current filters.</p>
          <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setFilters(EMPTY_RULE_FILTERS); }}>
            Clear filters
          </Button>
        </div>
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
