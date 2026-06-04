import * as React from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  ChevronDown,
  X,
  Trash2,
  Edit2,
  GripVertical,
  UploadCloud,
  BookOpen,
  Calendar,
  Layers,
  AlignLeft,
  Hash,
  Check,
  // Icon-picker pool
  Shield,
  Target,
  Eye,
  Cpu,
  Zap,
  Activity,
  AlertTriangle,
  Box,
  Camera,
  Clock,
  Fingerprint,
  Globe,
  Key,
  Lock,
  Radio,
  Settings,
  Star,
  Crosshair,
  Scan,
  Radar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { MOCK_MODELS, MODEL_TAGS } from "@/mocks/modelManagement";
import { MOCK_RULES } from "@/mocks/rulesLibrary";
import type { ModelData, ModelStep, StepFileType } from "@/types/modelManagement";
import type { RuleData, RuleSeverity } from "@/types/rules";

/* ── Counter ─────────────────────────────────────────────────────────────── */

let _ctr = 0;
function genId() {
  return `id-${++_ctr}-${Math.random().toString(36).slice(2, 5)}`;
}

/* ── Icon registry ───────────────────────────────────────────────────────── */

const MODEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  crosshair: Crosshair,
  eye: Eye,
  target: Target,
  cpu: Cpu,
  zap: Zap,
  activity: Activity,
  "alert-triangle": AlertTriangle,
  box: Box,
  camera: Camera,
  clock: Clock,
  fingerprint: Fingerprint,
  globe: Globe,
  key: Key,
  lock: Lock,
  radio: Radio,
  settings: Settings,
  star: Star,
  scan: Scan,
  radar: Radar,
};

function getIconComp(key: string): React.ComponentType<{ className?: string }> {
  return MODEL_ICONS[key] ?? Shield;
}

/* ── Icon picker ─────────────────────────────────────────────────────────── */

function IconPicker({ current, onChange }: { current: string; onChange: (key: string) => void }) {
  const IconComp = getIconComp(current);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="group relative flex size-10 flex-shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-primary/40 bg-primary/10 transition-all hover:border-primary hover:bg-primary/15"
          title="Change icon"
        >
          <IconComp className="size-5 text-primary" />
          <span className="absolute inset-0 flex items-center justify-center rounded-[10px] bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Edit2 className="size-3 text-white" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-3" sideOffset={6} align="start">
        <p className="mb-2.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/50">
          Choose Icon
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {Object.entries(MODEL_ICONS).map(([key, Comp]) => (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={cn(
                "flex items-center justify-center rounded-lg border p-2 transition-all hover:border-primary/40 hover:bg-primary/10",
                current === key
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-transparent bg-muted text-muted-foreground"
              )}
              title={key}
            >
              <Comp className="size-4" />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
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
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        s.bg,
        s.text
      )}
    >
      <span className={cn("size-1.5 flex-shrink-0 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

/* ── File type badge ─────────────────────────────────────────────────────── */

function FileTypeBadge({ type }: { type: StepFileType }) {
  return (
    <span
      className={cn(
        "rounded border px-1.5 py-px font-mono text-[10px] font-bold uppercase",
        type === "onnx"
          ? "border-primary/30 bg-primary/10 text-primary"
          : "border-info/30 bg-info/10 text-info"
      )}
    >
      {type}
    </span>
  );
}

/* ── Tag chip ────────────────────────────────────────────────────────────── */

function TagChip({ label }: { label: string }) {
  return (
    <span className="rounded border border-border bg-muted px-1.5 py-px text-[10px] font-medium text-muted-foreground">
      {label}
    </span>
  );
}

/* ── "+N more" tag chip with hover popover showing all tags ──────────────── */

function MoreTagsPopover({
  hiddenTags,
  allTags,
  label,
}: {
  hiddenTags: string[];
  allTags: string[];
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const closeTimer = React.useRef<number | null>(null);

  function show() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  }
  function scheduleHide() {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span
          onMouseEnter={show}
          onMouseLeave={scheduleHide}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((o) => !o);
          }}
          className="cursor-pointer rounded border border-primary/30 bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          {label ?? `+${hiddenTags.length} more`}
        </span>
      </PopoverTrigger>
      <PopoverContent
        onMouseEnter={show}
        onMouseLeave={scheduleHide}
        onClick={(e) => e.stopPropagation()}
        sideOffset={6}
        align="start"
        className="z-[100] w-56 p-3"
      >
        <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/55">
          All Tags · {allTags.length}
        </p>
        <div className="flex flex-wrap gap-1">
          {allTags.map((t) => (
            <TagChip key={t} label={t} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ── Tag input ───────────────────────────────────────────────────────────── */

function TagInput({
  tags,
  onAdd,
  onRemove,
  suggestions = [],
}: {
  tags: string[];
  onAdd: (t: string) => void;
  onRemove: (t: string) => void;
  suggestions?: readonly string[];
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
        className="flex min-h-[38px] cursor-text flex-wrap items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 transition-colors focus-within:border-primary"
        onClick={() => { ref.current?.focus(); setOpen(true); }}
      >
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded border border-border bg-muted px-2 py-0.5 text-[12px] font-medium text-foreground"
          >
            {t}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(t);
              }}
              className="flex size-3.5 items-center justify-center text-muted-foreground hover:text-foreground"
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
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Backspace" && !val && tags.length > 0) onRemove(tags[tags.length - 1]);
          }}
          placeholder={tags.length === 0 ? "+ Add tag" : ""}
          className="min-w-[80px] flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      {open && (filteredSuggestions.length > 0 || showCreate) && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-[200px] overflow-y-auto rounded-lg border border-border bg-card p-1 shadow-lg">
          {filteredSuggestions.length > 0 && (
            <div className="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Existing tags
            </div>
          )}
          {filteredSuggestions.slice(0, 8).map((s) => (
            <button
              key={s}
              onMouseDown={(e) => { e.preventDefault(); commit(s); }}
              className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-[13px] text-foreground hover:bg-muted"
            >
              <span className="inline-block size-1.5 rounded-full bg-primary/60" />
              {s}
            </button>
          ))}
          {showCreate && (
            <>
              {filteredSuggestions.length > 0 && <div className="my-1 border-t border-border" />}
              <button
                onMouseDown={(e) => { e.preventDefault(); commit(); }}
                className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-[13px] text-primary hover:bg-primary/10"
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

/* ── Section header — monospace label bar style ──────────────────────────── */

function SectionHeader({
  label,
  count,
  description,
}: {
  label: string;
  count?: number;
  description?: string;
}) {
  return (
    <div className="mb-3 border-t border-border pt-3">
      <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {count !== undefined && (
          <span className="font-mono text-[10px] text-muted-foreground">{count}</span>
        )}
      </div>
      {description && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/70">{description}</p>
      )}
    </div>
  );
}

/* ── Model card (left panel) ─────────────────────────────────────────────── */

function ModelCard({
  model,
  selected,
  onClick,
}: {
  model: ModelData;
  selected: boolean;
  onClick: () => void;
}) {
  const visibleTags = model.tags.slice(0, 3);
  const extraTags = model.tags.length - 3;
  const IconComp = getIconComp(model.iconKey);

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full rounded-xl border px-4 py-3.5 text-left transition-all",
        selected
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-card hover:border-primary/20 hover:bg-muted/30"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex size-8 flex-shrink-0 items-center justify-center rounded-lg border",
              selected ? "border-primary/30 bg-primary/10" : "border-border bg-muted"
            )}
          >
            <IconComp className={cn("size-4", selected ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                "truncate text-[13px] font-bold",
                selected ? "text-primary" : "text-foreground"
              )}
            >
              {model.name}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">{model.id}</p>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
            {model.sequenceIds.length} Steps
          </span>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {model.attachedRuleIds.length} Rules
          </span>
        </div>
      </div>

      <p className="mb-2 line-clamp-1 text-[12px] text-muted-foreground">{model.description}</p>

      {model.tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1">
          {visibleTags.map((t) => (
            <TagChip key={t} label={t} />
          ))}
          {extraTags > 0 && (
            <MoreTagsPopover
              hiddenTags={model.tags.slice(3)}
              allTags={model.tags}
              label={`+${extraTags} more`}
            />
          )}
        </div>
      ) : (
        <span className="text-[11px] italic text-muted-foreground/40">No tags</span>
      )}
    </button>
  );
}

/* ── Create model modal ──────────────────────────────────────────────────── */

function CreateModelModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (name: string, description: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[15px] font-bold text-foreground">Create Model</p>
            <p className="text-[12px] text-muted-foreground">Set basic information to get started.</p>
          </div>
          <button
            onClick={onCancel}
            className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Model Information
          </p>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-foreground">
              Model Name <span className="text-sev-critical">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter model name"
              className="h-10 text-[13px]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-foreground">
              Model Description <span className="text-sev-critical">*</span>
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe what the model is capable of…"
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border bg-background px-5 py-3.5">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!name.trim()}
            onClick={() => name.trim() && onConfirm(name.trim(), desc.trim())}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Add step modal ──────────────────────────────────────────────────────── */

function AddStepModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (step: Omit<ModelStep, "id" | "order">) => void;
  onCancel: () => void;
}) {
  const [actionLabel, setActionLabel] = React.useState("");
  const [label, setLabel] = React.useState("Model_12");
  const [fileType, setFileType] = React.useState<StepFileType>("onnx");
  const [fileName, setFileName] = React.useState("");
  const valid = actionLabel.trim() && label.trim() && fileName.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-[15px] font-bold text-foreground">Add New Step</p>
            <p className="text-[12px] text-muted-foreground">
              Define what the AI should verify at this step.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-foreground">
              Action Label <span className="text-sev-critical">*</span>
            </label>
            <Input
              value={actionLabel}
              onChange={(e) => setActionLabel(e.target.value)}
              placeholder="e.g. Verify worker is wearing approved helmet"
              className="h-10 text-[13px]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-foreground">
              Label <span className="text-sev-critical">*</span>
            </label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Helmet Detection v2.1"
              className="h-10 text-[13px]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-foreground">
              File <span className="text-sev-critical">*</span>
            </label>
            <div className="flex flex-col items-center gap-2.5 rounded-xl border-2 border-dashed border-border bg-background px-4 py-5 transition-colors hover:border-primary/40">
              <UploadCloud className="size-7 text-muted-foreground" />
              <p className="text-[12px] text-muted-foreground">
                Upload a <span className="font-semibold text-foreground">.onnx</span> or <span className="font-semibold text-foreground">.json</span> file or drag and drop
              </p>
              <Input
                value={fileName}
                onChange={(e) => {
                  const v = e.target.value;
                  setFileName(v);
                  if (v.toLowerCase().endsWith(".json")) setFileType("json");
                  else if (v.toLowerCase().endsWith(".onnx")) setFileType("onnx");
                }}
                placeholder="filename.onnx"
                className="h-8 text-center text-[12px]"
              />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Accepted: .onnx (model) or .json (artefact). Max file size 100 MB. Type is detected from the extension.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border bg-background px-5 py-3.5">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!valid}
            onClick={() =>
              valid && onConfirm({ label, actionLabel, fileType, fileName: fileName.trim() })
            }
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Delete model modal ──────────────────────────────────────────────────── */

function DeleteModelModal({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[440px] max-w-[92vw] overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5 text-[15px] font-bold text-foreground">
            <Trash2 className="size-4 text-sev-critical" />
            Delete Model
          </div>
          <p className="mt-1 text-[12px] text-muted-foreground">This action cannot be undone.</p>
        </div>
        <div className="px-5 py-4 text-[13px] text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">{name}</span>? Any deployments that
          reference this model will need to be updated.
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-background px-5 py-3.5">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} className="gap-1.5">
            <Trash2 className="size-3.5" />
            Delete Model
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Pool step card (no numbers, drag-out to sequence) ───────────────────── */

function PoolStepCard({
  step,
  editable,
  isDragging,
  onRemove,
  onDragStart,
  onDragEnd,
}: {
  step: ModelStep;
  editable: boolean;
  isDragging: boolean;
  onRemove: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable={editable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 transition-all",
        isDragging && "opacity-40",
        editable && "cursor-grab active:cursor-grabbing"
      )}
    >
      {editable && (
        <GripVertical className="size-3.5 flex-shrink-0 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold text-foreground">{step.actionLabel}</p>
        <p className="font-mono text-[11px] text-muted-foreground">{step.label}</p>
      </div>
      <FileTypeBadge type={step.fileType} />
      {editable && (
        <button
          onClick={onRemove}
          className="ml-1 flex size-6 flex-shrink-0 items-center justify-center rounded text-muted-foreground/40 opacity-0 transition-opacity hover:bg-sev-critical/10 hover:text-sev-critical group-hover:opacity-100"
          title="Remove step entirely"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}

/* ── Sequence item (numbered, drag-to-reorder) ───────────────────────────── */

function SequenceItem({
  step,
  index,
  editable,
  isDragging,
  isOver,
  onRemoveFromSequence,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  step: ModelStep;
  index: number;
  editable: boolean;
  isDragging: boolean;
  isOver: boolean;
  onRemoveFromSequence: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable={editable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2.5 transition-all",
        isDragging ? "opacity-40" : isOver ? "border-primary/60 bg-primary/5" : "border-border",
        editable && "cursor-grab active:cursor-grabbing"
      )}
    >
      {editable && (
        <GripVertical className="size-3.5 flex-shrink-0 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
      <span className="flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-[10px] font-bold text-primary">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold text-foreground">{step.actionLabel}</p>
        <p className="font-mono text-[11px] text-muted-foreground">{step.fileName}</p>
      </div>
      <FileTypeBadge type={step.fileType} />
      {editable && (
        <button
          onClick={onRemoveFromSequence}
          className="ml-1 flex size-6 flex-shrink-0 items-center justify-center rounded text-muted-foreground/40 opacity-0 transition-opacity hover:bg-sev-critical/10 hover:text-sev-critical group-hover:opacity-100"
          title="Remove from sequence (returns to pool)"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}

/* ── Attached rule card ──────────────────────────────────────────────────── */

function AttachedRuleCard({
  rule,
  editable,
  onDetach,
}: {
  rule: RuleData;
  editable: boolean;
  onDetach: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2.5">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] font-semibold text-foreground">{rule.name}</span>
          <SeverityBadge severity={rule.severity} />
        </div>
        {editable && (
          <button
            onClick={onDetach}
            className="flex size-5 flex-shrink-0 items-center justify-center rounded text-muted-foreground/40 hover:bg-sev-critical/10 hover:text-sev-critical"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
      <p className="mb-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
        {rule.description}
      </p>
      <div className="flex flex-wrap gap-1">
        {rule.tags.slice(0, 3).map((t) => (
          <TagChip key={t} label={t} />
        ))}
        {rule.tags.length > 3 && (
          <MoreTagsPopover
            hiddenTags={rule.tags.slice(3)}
            allTags={rule.tags}
            label={`+${rule.tags.length - 3}`}
          />
        )}
      </div>
    </div>
  );
}

/* ── Rule library card (draggable, shows attached state) ─────────────────── */

function RuleLibraryCard({
  rule,
  editable,
  isDragging,
  onDragStart,
  onDragEnd,
  onAttach,
}: {
  rule: RuleData;
  editable: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onAttach: () => void;
}) {
  return (
    <div
      draggable={editable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group rounded-lg border bg-background px-3 py-2.5 transition-all",
        isDragging ? "border-border opacity-40" : "border-border hover:border-primary/25",
        editable && "cursor-grab active:cursor-grabbing"
      )}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {editable && (
            <GripVertical className="size-3 flex-shrink-0 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
          )}
          <span className="text-[12px] font-semibold text-foreground">{rule.name}</span>
          <SeverityBadge severity={rule.severity} />
        </div>
        {editable && (
          <button
            onClick={onAttach}
            className="flex size-5 flex-shrink-0 items-center justify-center rounded border border-primary/30 bg-primary/10 text-primary opacity-0 transition-opacity hover:bg-primary/20 group-hover:opacity-100"
            title="Attach rule"
          >
            <Plus className="size-3" />
          </button>
        )}
      </div>
      <p className="mb-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
        {rule.description}
      </p>
      <div className="flex flex-wrap gap-1">
        {rule.tags.slice(0, 3).map((t) => (
          <TagChip key={t} label={t} />
        ))}
        {rule.tags.length > 3 && (
          <MoreTagsPopover
            hiddenTags={rule.tags.slice(3)}
            allTags={rule.tags}
            label={`+${rule.tags.length - 3}`}
          />
        )}
      </div>
    </div>
  );
}

/* ── Empty right panel state ─────────────────────────────────────────────── */

function EmptyDetailState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
      <div className="flex size-14 items-center justify-center rounded-full border border-dashed border-border">
        <Plus className="size-6" />
      </div>
      <p className="text-[13px]">Select a model to configure</p>
    </div>
  );
}

/* ── Edit draft type ─────────────────────────────────────────────────────── */

interface EditDraft {
  name: string;
  description: string;
  tags: string[];
  iconKey: string;
  steps: ModelStep[];
  sequenceIds: string[];
  attachedRuleIds: string[];
}

function modelToDraft(m: ModelData): EditDraft {
  return {
    name: m.name,
    description: m.description,
    tags: [...m.tags],
    iconKey: m.iconKey,
    steps: m.steps.map((s) => ({ ...s })),
    sequenceIds: [...m.sequenceIds],
    attachedRuleIds: [...m.attachedRuleIds],
  };
}

/* ── Drag payload ────────────────────────────────────────────────────────── */

type DragPayload =
  | { type: "pool"; stepId: string }
  | { type: "seq"; seqIdx: number }
  | { type: "rule"; ruleId: string };

/* ── Model detail panel ──────────────────────────────────────────────────── */

function ModelDetailPanel({
  model,
  allRules,
  allModels,
  onSave,
  onDelete,
}: {
  model: ModelData;
  allRules: RuleData[];
  allModels: ModelData[];
  onSave: (id: string, draft: EditDraft) => void;
  onDelete: (id: string) => void;
}) {
  const allTagsForModels = React.useMemo(() => {
    const set = new Set<string>(MODEL_TAGS);
    allModels.forEach((m) => m.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [allModels]);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<EditDraft>(() => modelToDraft(model));
  const [showAddStep, setShowAddStep] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);

  // Step drag state
  const [activeDrag, setActiveDrag] = React.useState(false);
  const [poolDragId, setPoolDragId] = React.useState<string | null>(null);
  const [seqDragIdx, setSeqDragIdx] = React.useState<number | null>(null);
  const [seqOverIdx, setSeqOverIdx] = React.useState<number | null>(null);

  // Rule drag state
  const [ruleDragId, setRuleDragId] = React.useState<string | null>(null);
  const [detectionRulesOver, setDetectionRulesOver] = React.useState(false);

  // Rule library search
  const [ruleSearch, setRuleSearch] = React.useState("");

  const dragPayload = React.useRef<DragPayload | null>(null);

  React.useEffect(() => {
    setDraft(modelToDraft(model));
    setIsEditing(false);
    setRuleSearch("");
  }, [model.id]);

  function patchDraft(p: Partial<EditDraft>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  function resetDrag() {
    setActiveDrag(false);
    setPoolDragId(null);
    setSeqDragIdx(null);
    setSeqOverIdx(null);
    setRuleDragId(null);
    setDetectionRulesOver(false);
    dragPayload.current = null;
  }

  // Derived: pool = all steps not placed in sequence
  const poolSteps = draft.steps.filter((s) => !draft.sequenceIds.includes(s.id));
  // Derived: sequence = steps in ordered placement
  const sequenceSteps = draft.sequenceIds
    .map((id) => draft.steps.find((s) => s.id === id))
    .filter((s): s is ModelStep => Boolean(s));

  const attachedRules = allRules.filter((r) => draft.attachedRuleIds.includes(r.id));

  // Library = unattached rules only (matches Step Pool ↔ Sequence pattern)
  const libraryRules = React.useMemo(() => {
    let list = allRules.filter((r) => !draft.attachedRuleIds.includes(r.id));
    if (ruleSearch.trim()) {
      const q = ruleSearch.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allRules, draft.attachedRuleIds, ruleSearch]);

  /* ── Step drag handlers ── */

  function handlePoolDragStart(stepId: string) {
    dragPayload.current = { type: "pool", stepId };
    setActiveDrag(true);
    setPoolDragId(stepId);
  }

  function handlePoolDragEnd() {
    resetDrag();
  }

  function handleSeqDragStart(idx: number) {
    dragPayload.current = { type: "seq", seqIdx: idx };
    setActiveDrag(true);
    setSeqDragIdx(idx);
  }

  function handleSeqItemDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.stopPropagation();
    setSeqOverIdx(idx);
  }

  function handleSeqItemDrop(e: React.DragEvent, targetIdx: number) {
    e.preventDefault();
    e.stopPropagation();
    const payload = dragPayload.current;
    if (!payload) { resetDrag(); return; }

    if (payload.type === "pool") {
      const next = [...draft.sequenceIds];
      next.splice(targetIdx, 0, payload.stepId);
      patchDraft({ sequenceIds: next });
    } else if (payload.type === "seq") {
      const fromIdx = payload.seqIdx;
      if (fromIdx === targetIdx) { resetDrag(); return; }
      const next = [...draft.sequenceIds];
      const [moved] = next.splice(fromIdx, 1);
      const insertAt = fromIdx < targetIdx ? targetIdx - 1 : targetIdx;
      next.splice(insertAt, 0, moved);
      patchDraft({ sequenceIds: next });
    }
    resetDrag();
  }

  function handleSeqDragEnd() {
    resetDrag();
  }

  function handleSeqContainerDragOver(e: React.DragEvent) {
    e.preventDefault();
    setSeqOverIdx(null);
  }

  function handleSeqContainerDrop(e: React.DragEvent) {
    e.preventDefault();
    const payload = dragPayload.current;
    if (!payload) { resetDrag(); return; }

    if (payload.type === "pool") {
      if (!draft.sequenceIds.includes(payload.stepId)) {
        patchDraft({ sequenceIds: [...draft.sequenceIds, payload.stepId] });
      }
    } else if (payload.type === "seq") {
      const fromIdx = payload.seqIdx;
      const next = [...draft.sequenceIds];
      const [moved] = next.splice(fromIdx, 1);
      next.push(moved);
      patchDraft({ sequenceIds: next });
    }
    resetDrag();
  }

  /* ── Rule drag handlers ── */

  function handleRuleDragStart(ruleId: string) {
    dragPayload.current = { type: "rule", ruleId };
    setActiveDrag(true);
    setRuleDragId(ruleId);
  }

  function handleRuleDragEnd() {
    resetDrag();
  }

  function handleDetectionDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (dragPayload.current?.type === "rule") setDetectionRulesOver(true);
  }

  function handleDetectionDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDetectionRulesOver(false);
  }

  function handleDetectionDrop(e: React.DragEvent) {
    e.preventDefault();
    setDetectionRulesOver(false);
    const payload = dragPayload.current;
    if (payload?.type !== "rule") { dragPayload.current = null; return; }
    const { ruleId } = payload;
    if (!draft.attachedRuleIds.includes(ruleId)) {
      patchDraft({ attachedRuleIds: [...draft.attachedRuleIds, ruleId] });
    }
    dragPayload.current = null;
    setActiveDrag(false);
    setRuleDragId(null);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* ── Header ── */}
      {isEditing ? (
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-border px-5 py-3.5">
          <IconPicker current={draft.iconKey} onChange={(k) => patchDraft({ iconKey: k })} />
          <div className="min-w-0 flex-1">
            <Input
              value={draft.name}
              onChange={(e) => patchDraft({ name: e.target.value })}
              className="h-9 text-[14px] font-bold"
              placeholder="Model name"
            />
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setDraft(modelToDraft(model)); setIsEditing(false); }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={() => { onSave(model.id, draft); setIsEditing(false); }}>
              Save Changes
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
              {React.createElement(getIconComp(model.iconKey), { className: "size-5 text-primary" })}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[15px] font-bold text-foreground">{model.name}</h2>
                <span className="rounded border border-border bg-muted px-1.5 py-px font-mono text-[11px] text-muted-foreground">
                  {model.id}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Calendar className="size-3" />
                  {model.createdAtDisplay}
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Layers className="size-3" />
                  {model.sequenceIds.length} Steps
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <BookOpen className="size-3" />
                  {model.attachedRuleIds.length} Rules
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              className="gap-1.5 text-sev-critical hover:border-sev-critical/40 hover:bg-sev-critical/10 hover:text-sev-critical"
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
            <Button size="sm" onClick={() => setIsEditing(true)} className="gap-1.5">
              <Edit2 className="size-3.5" />
              Edit Model
            </Button>
          </div>
        </div>
      )}

      {/* ── Combined scrollable content (Description/Tags scrolls with rest) ── */}
      <div className="flex-1 overflow-y-auto">
        {isEditing ? (
          <div className="space-y-3 border-b border-border bg-muted/10 px-5 py-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </label>
              <textarea
                value={draft.description}
                onChange={(e) => patchDraft({ description: e.target.value })}
                rows={2}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tags
              </label>
              <TagInput
                tags={draft.tags}
                onAdd={(t) => patchDraft({ tags: [...draft.tags, t] })}
                onRemove={(t) => patchDraft({ tags: draft.tags.filter((x) => x !== t) })}
                suggestions={allTagsForModels}
              />
            </div>
          </div>
        ) : (
          <div className="border-b border-border px-5 py-3">
            <p className="mb-2 text-[12px] leading-relaxed text-muted-foreground">
              {model.description}
            </p>
            {model.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {model.tags.map((t) => (
                  <TagChip key={t} label={t} />
                ))}
              </div>
            )}
          </div>
        )}

        {isEditing ? (
          <>
            {/* ── SEQUENCE section (edit mode) ── */}
            <div className="px-5 pb-5 pt-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[13px] font-bold uppercase tracking-widest text-foreground">
                  Sequence
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddStep(true)}
                  className="gap-1.5"
                >
                  <Plus className="size-3" />
                  Add Step
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">

                {/* Step Pool */}
                <div>
                  <SectionHeader
                    label="Step Pool"
                    count={poolSteps.length}
                    description="drag steps → sequence to build pipeline"
                  />
                  {draft.steps.length === 0 ? (
                    <div className="flex min-h-[460px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted-foreground">
                      <UploadCloud className="size-7 opacity-20" />
                      <p className="text-center text-[12px]">Click "+ Add Step" to upload</p>
                    </div>
                  ) : poolSteps.length === 0 ? (
                    <div className="flex min-h-[460px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted-foreground">
                      <Check className="size-6 opacity-20" />
                      <p className="text-center text-[12px]">All steps placed in sequence</p>
                    </div>
                  ) : (
                    <div className="h-[460px] space-y-2 overflow-y-auto pr-1">
                      {poolSteps.map((step) => (
                        <PoolStepCard
                          key={step.id}
                          step={step}
                          editable
                          isDragging={poolDragId === step.id}
                          onRemove={() =>
                            patchDraft({
                              steps: draft.steps.filter((s) => s.id !== step.id),
                              sequenceIds: draft.sequenceIds.filter((id) => id !== step.id),
                            })
                          }
                          onDragStart={() => handlePoolDragStart(step.id)}
                          onDragEnd={handlePoolDragEnd}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Sequence */}
                <div>
                  <SectionHeader
                    label="Sequence"
                    count={sequenceSteps.length}
                    description="each step triggers an AI model in order"
                  />
                  <div
                    onDragOver={handleSeqContainerDragOver}
                    onDrop={handleSeqContainerDrop}
                    className={cn(
                      "h-[460px] overflow-y-auto rounded-xl border-2 border-dashed pr-1 transition-all",
                      activeDrag
                        ? "border-primary/40 bg-primary/[0.03]"
                        : sequenceSteps.length === 0
                        ? "border-border"
                        : "border-transparent"
                    )}
                  >
                    {sequenceSteps.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Hash className="size-7 opacity-20" />
                        <p className="text-center text-[12px]">
                          Drag steps from the pool to build the sequence
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {sequenceSteps.map((step, idx) => (
                          <SequenceItem
                            key={step.id}
                            step={step}
                            index={idx}
                            editable
                            isDragging={seqDragIdx === idx}
                            isOver={seqOverIdx === idx && seqDragIdx !== idx}
                            onRemoveFromSequence={() =>
                              patchDraft({
                                sequenceIds: draft.sequenceIds.filter((id) => id !== step.id),
                              })
                            }
                            onDragStart={() => handleSeqDragStart(idx)}
                            onDragOver={(e) => handleSeqItemDragOver(e, idx)}
                            onDrop={(e) => handleSeqItemDrop(e, idx)}
                            onDragEnd={handleSeqDragEnd}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-5 border-t border-border" />

            {/* ── RULES section (edit mode) ── */}
            <div className="px-5 pb-6 pt-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[13px] font-bold uppercase tracking-widest text-foreground">
                  Rules
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/rules?new=true")}
                  className="gap-1.5"
                >
                  <Plus className="size-3" />
                  Add Rule
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">

                {/* Rule Library */}
                <div>
                  <SectionHeader
                    label="Rule Library"
                    count={libraryRules.length}
                    description="drag rules → detection rules"
                  />
                  <div className="relative mb-2.5">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground/50" />
                    <input
                      value={ruleSearch}
                      onChange={(e) => setRuleSearch(e.target.value)}
                      placeholder="Search rules…"
                      className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-[12px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:border-primary"
                    />
                  </div>
                  {libraryRules.length === 0 ? (
                    <div className="flex h-[412px] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-muted-foreground">
                      <BookOpen className="size-7 opacity-20" />
                      <p className="text-center text-[12px]">
                        {ruleSearch
                          ? "No rules match your search"
                          : allRules.length === 0
                          ? "No rules in library yet"
                          : "All rules attached"}
                      </p>
                    </div>
                  ) : (
                    <div className="h-[412px] space-y-2 overflow-y-auto pr-1">
                      {libraryRules.map((rule) => (
                        <RuleLibraryCard
                          key={rule.id}
                          rule={rule}
                          editable
                          isDragging={ruleDragId === rule.id}
                          onDragStart={() => handleRuleDragStart(rule.id)}
                          onDragEnd={handleRuleDragEnd}
                          onAttach={() =>
                            patchDraft({
                              attachedRuleIds: [...draft.attachedRuleIds, rule.id],
                            })
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Detection Rules — drop target */}
                <div>
                  <SectionHeader
                    label="Detection Rules"
                    count={attachedRules.length}
                    description="rules that trigger on this model"
                  />
                  <div
                    onDragOver={handleDetectionDragOver}
                    onDragLeave={handleDetectionDragLeave}
                    onDrop={handleDetectionDrop}
                    className={cn(
                      "h-[460px] overflow-y-auto rounded-xl border-2 border-dashed pr-1 transition-all",
                      detectionRulesOver
                        ? "border-primary/40 bg-primary/[0.03]"
                        : attachedRules.length === 0
                        ? "border-border"
                        : "border-transparent"
                    )}
                  >
                    {attachedRules.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                        <BookOpen className="size-7 opacity-20" />
                        <p className="text-center text-[12px]">← Drag rules from the library</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {attachedRules.map((rule) => (
                          <AttachedRuleCard
                            key={rule.id}
                            rule={rule}
                            editable
                            onDetach={() =>
                              patchDraft({
                                attachedRuleIds: draft.attachedRuleIds.filter((id) => id !== rule.id),
                              })
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ── VIEW MODE — single combined section ── */
          <div className="px-5 pb-6 pt-4">
            <div className="mb-4">
              <p className="text-[13px] font-bold text-foreground">Model Configuration</p>
              <p className="text-[11px] text-muted-foreground">
                {sequenceSteps.length} sequence step{sequenceSteps.length !== 1 ? "s" : ""} ·{" "}
                {attachedRules.length} detection rule{attachedRules.length !== 1 ? "s" : ""} linked to this model
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">

              {/* Sequence (view) */}
              <div>
                <SectionHeader
                  label="Sequence"
                  count={sequenceSteps.length}
                  description="each step triggers an AI model in order"
                />
                {sequenceSteps.length === 0 ? (
                  <div className="flex h-[460px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted-foreground">
                    <Hash className="size-7 opacity-20" />
                    <p className="text-center text-[12px]">No sequence defined</p>
                  </div>
                ) : (
                  <div className="h-[460px] space-y-2 overflow-y-auto pr-1">
                    {sequenceSteps.map((step, idx) => (
                      <SequenceItem
                        key={step.id}
                        step={step}
                        index={idx}
                        editable={false}
                        isDragging={false}
                        isOver={false}
                        onRemoveFromSequence={() => {}}
                        onDragStart={() => {}}
                        onDragOver={() => {}}
                        onDrop={() => {}}
                        onDragEnd={() => {}}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Detection Rules (view) */}
              <div>
                <SectionHeader
                  label="Detection Rules"
                  count={attachedRules.length}
                  description="rules that trigger on this model"
                />
                {attachedRules.length === 0 ? (
                  <div className="flex h-[460px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted-foreground">
                    <BookOpen className="size-7 opacity-20" />
                    <p className="text-center text-[12px]">No rules attached</p>
                  </div>
                ) : (
                  <div className="h-[460px] space-y-2 overflow-y-auto pr-1">
                    {attachedRules.map((rule) => (
                      <AttachedRuleCard
                        key={rule.id}
                        rule={rule}
                        editable={false}
                        onDetach={() => {}}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddStep && (
        <AddStepModal
          onCancel={() => setShowAddStep(false)}
          onConfirm={(s) => {
            const newStep: ModelStep = { ...s, id: genId(), order: draft.steps.length + 1 };
            patchDraft({ steps: [...draft.steps, newStep] });
            setShowAddStep(false);
          }}
        />
      )}

      {showDeleteModal && (
        <DeleteModelModal
          name={model.name}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={() => {
            onDelete(model.id);
            setShowDeleteModal(false);
          }}
        />
      )}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */

export default function ModelManagementPage() {
  const [models, setModels] = React.useState<ModelData[]>(MOCK_MODELS);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [tagFilter, setTagFilter] = React.useState<string[]>([]);
  const [tagFilterOpen, setTagFilterOpen] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return models.filter((m) => {
      if (
        q &&
        !m.name.toLowerCase().includes(q) &&
        !m.id.toLowerCase().includes(q) &&
        !m.description.toLowerCase().includes(q)
      )
        return false;
      if (tagFilter.length > 0 && !tagFilter.every((t) => m.tags.includes(t))) return false;
      return true;
    });
  }, [models, search, tagFilter]);

  const selectedModel = models.find((m) => m.id === selectedId) ?? null;

  function handleCreate(name: string, description: string) {
    const n = new Date();
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const display = `${n.getDate()} ${MONTHS[n.getMonth()]} ${n.getFullYear()}, ${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
    const newModel: ModelData = {
      id: `Mdl_${String(models.length + 1).padStart(3, "0")}`,
      name,
      description,
      tags: [],
      iconKey: "shield",
      steps: [],
      sequenceIds: [],
      attachedRuleIds: [],
      createdAt: n.toISOString(),
      createdAtDisplay: display,
    };
    setModels((prev) => [newModel, ...prev]);
    setSelectedId(newModel.id);
    setShowCreate(false);
    toast.success(`Model "${newModel.name}" created`);
  }

  function handleSave(id: string, d: EditDraft) {
    setModels((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              name: d.name,
              description: d.description,
              tags: d.tags,
              iconKey: d.iconKey,
              steps: d.steps,
              sequenceIds: d.sequenceIds,
              attachedRuleIds: d.attachedRuleIds,
            }
          : m
      )
    );
    toast.success(`Model "${d.name}" saved`);
  }

  function handleDelete(id: string) {
    const target = models.find((m) => m.id === id);
    setModels((prev) => prev.filter((m) => m.id !== id));
    setSelectedId(null);
    toast.success(`Model "${target?.name ?? id}" deleted`);
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Model Management</PageHeader.Title>
          <PageHeader.Description>
            Build and manage AI detection models with sequenced verification steps and attached rules.
          </PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="size-4" />
            Add New Model
          </Button>
        </PageHeader.Actions>
      </PageHeader>

    <div className="flex h-[calc(100vh-12rem)] min-h-[600px] gap-4">

      {/* ── Left panel ── */}
      <div className="flex w-[380px] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex-shrink-0 border-b border-border px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Models
              </p>
              <p className="text-[12px] text-muted-foreground">
                {models.length} model{models.length !== 1 ? "s" : ""} configured
              </p>
            </div>
          </div>

          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search model"
              className="h-9 pl-9 text-[13px]"
            />
          </div>

          <Popover open={tagFilterOpen} onOpenChange={setTagFilterOpen}>
            <PopoverTrigger asChild>
              <button className={cn(
                "flex h-9 w-full items-center justify-between gap-2 rounded-lg border bg-background px-3 text-[13px] transition-colors hover:border-primary",
                tagFilterOpen ? "border-primary" : "border-border",
                tagFilter.length > 0 ? "text-foreground" : "text-muted-foreground"
              )}>
                <span className="truncate">
                  {tagFilter.length === 0 ? "All tags" : tagFilter.length === 1 ? tagFilter[0] : `${tagFilter.length} tags selected`}
                </span>
                <ChevronDown className={cn("size-3.5 flex-shrink-0 text-muted-foreground transition-transform", tagFilterOpen && "rotate-180")} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="max-h-[260px] w-56 overflow-y-auto p-1.5">
              {MODEL_TAGS.map((tag) => {
                const checked = tagFilter.includes(tag);
                return (
                  <button key={tag}
                    onClick={() => setTagFilter((curr) => curr.includes(tag) ? curr.filter((x) => x !== tag) : [...curr, tag])}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground">
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
                  className="mt-1 w-full rounded px-2 py-1.5 text-center text-[11px] text-muted-foreground underline hover:text-primary">
                  Clear all
                </button>
              )}
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <AlignLeft className="size-8 opacity-20" />
              <p className="text-[12px]">No models match your search.</p>
            </div>
          ) : (
            filtered.map((m) => (
              <ModelCard
                key={m.id}
                model={m}
                selected={selectedId === m.id}
                onClick={() => setSelectedId(m.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        {selectedModel ? (
          <ModelDetailPanel
            model={selectedModel}
            allRules={MOCK_RULES}
            allModels={models}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        ) : (
          <EmptyDetailState />
        )}
      </div>

      {showCreate && (
        <CreateModelModal
          onCancel={() => setShowCreate(false)}
          onConfirm={handleCreate}
        />
      )}
    </div>
    </div>
  );
}
