import * as React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Calendar,
  Plus,
  X,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GripVertical,
  Lock,
  UploadCloud,
  Video,
  Trash2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize2,
  Download,
  MoreVertical,
  FileText,
  ArrowLeft,
  Sparkles,
  SlidersHorizontal,
  Shield,
  Crosshair,
  Eye,
  Target,
  Cpu,
  Zap,
  Activity,
  Box,
  Camera,
  Clock,
  Fingerprint,
  Globe,
  Key,
  Radio,
  Settings,
  Star,
  Scan,
  Radar,
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
import { TruncatedText } from "@/components/shared/TruncatedText";
import { cn } from "@/lib/utils";
import { MOCK_MODELS } from "@/mocks/modelManagement";
import { MOCK_RULES } from "@/mocks/rulesLibrary";
import { MOCK_VLMS, MOCK_PAST_ANALYSES } from "@/mocks/runAnalysis";
import type { ModelData } from "@/types/modelManagement";
import type { RuleData, RuleSeverity } from "@/types/rules";
import type {
  FlowStep,
  PastAnalysis,
  VLMOption,
  AnalysisResult,
  RunStatus,
  ActivityLogEntry,
  FinalResultEntry,
  StepResult,
  TriggeredRuleSummary,
  LogEventLevel,
  AnalysisVerdict,
  RunFailure,
} from "@/types/runAnalysis";

/* ── Icon registry for model display ─────────────────────────────────────── */

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield, crosshair: Crosshair, eye: Eye, target: Target, cpu: Cpu, zap: Zap,
  activity: Activity, "alert-triangle": AlertTriangle, box: Box, camera: Camera, clock: Clock,
  fingerprint: Fingerprint, globe: Globe, key: Key, lock: Lock, radio: Radio,
  settings: Settings, star: Star, scan: Scan, radar: Radar,
};
function getIconComp(key: string) { return ICON_MAP[key] ?? Shield; }

/* ── Status badges ───────────────────────────────────────────────────────── */

function StatusPill({ status }: { status: RunStatus }) {
  const map: Record<RunStatus, { bg: string; text: string; dot: string; label: string }> = {
    passed:  { bg: "bg-success/15 border-success/30",           text: "text-success",       dot: "bg-success",       label: "Passed" },
    failed:  { bg: "bg-sev-critical/15 border-sev-critical/30", text: "text-sev-critical",  dot: "bg-sev-critical",  label: "Failed" },
    warning: { bg: "bg-warning/15 border-warning/30",   text: "text-warning",   dot: "bg-warning",   label: "Warning" },
  };
  const s = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider",
        s.bg,
        s.text
      )}
    >
      <span className={cn("size-1.5 flex-shrink-0 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

/* ── Rule severity badge (sourced from Rule Library, never from run status) ─ */

const RULE_SEV: Record<RuleSeverity, { bg: string; text: string; dot: string; label: string }> = {
  low:      { bg: "bg-info/15",         text: "text-info",         dot: "bg-info",         label: "Low" },
  medium:   { bg: "bg-warning/15",      text: "text-warning",      dot: "bg-warning",      label: "Medium" },
  critical: { bg: "bg-sev-critical/15", text: "text-sev-critical", dot: "bg-sev-critical", label: "Critical" },
};

function RuleSeverityBadge({ severity }: { severity: RuleSeverity }) {
  const s = RULE_SEV[severity];
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

function TagChip({ label, tone = "default" }: { label: string; tone?: "default" | "passed" | "failed" | "warning" | "tested" }) {
  const map = {
    default: "border-border bg-muted text-muted-foreground",
    passed:  "border-success/30 bg-success/10 text-success",
    failed:  "border-sev-critical/30 bg-sev-critical/10 text-sev-critical",
    warning: "border-warning/30 bg-warning/10 text-warning",
    tested:  "border-info/30 bg-info/10 text-info",
  };
  return (
    <span className={cn("rounded border px-1.5 py-px text-2xs font-medium", map[tone])}>
      {label}
    </span>
  );
}

/* ── "+N more" tag chip with hover popover showing all tags ──────────────── */

function MoreTagsPopover({
  allTags,
  label,
}: {
  allTags: string[];
  label: string;
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
          className="cursor-pointer rounded border border-primary/30 bg-primary/10 px-1.5 py-px text-2xs font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          {label}
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
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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

/* ── Section header (matches model-management style) ─────────────────────── */

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
    <div className="mb-3">
      <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {count !== undefined && (
          <span className="font-mono text-2xs text-muted-foreground">{count}</span>
        )}
      </div>
      {description && (
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/70">{description}</p>
      )}
    </div>
  );
}

/* ── Stepper ─────────────────────────────────────────────────────────────── */

const FLOW_STEPS: { id: FlowStep; label: string }[] = [
  { id: "select", label: "Select Video" },
  { id: "upload", label: "Upload Video" },
  { id: "result", label: "Run Analysis" },
];

function Stepper({ current }: { current: FlowStep }) {
  const currentIdx = FLOW_STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center justify-center gap-0 py-2">
      {FLOW_STEPS.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isActive = idx === currentIdx;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 transition-all",
                  isDone
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                    ? "border-primary bg-primary/15"
                    : "border-border bg-card"
                )}
              >
                {isDone ? (
                  <Check className="size-4" />
                ) : isActive ? (
                  <span className="size-2.5 rounded-full bg-primary" />
                ) : (
                  <span className="size-2.5 rounded-full bg-muted-foreground/30" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-semibold",
                  isActive ? "text-foreground" : isDone ? "text-foreground/80" : "text-muted-foreground/60"
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < FLOW_STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-2 mb-5 h-px w-16 transition-colors",
                  idx < currentIdx ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ── Model summary chip (model name + counts) ────────────────────────────── */

function ModelSummaryRow({ model }: { model: ModelData }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-2xs font-semibold text-success">
        {model.sequenceIds.length} Steps
      </span>
      <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-2xs font-semibold text-primary">
        {model.attachedRuleIds.length} Rules
      </span>
    </div>
  );
}

/* ── Model card (for chooser grid) ───────────────────────────────────────── */

function ModelChooserCard({
  model,
  selected,
  onClick,
}: {
  model: ModelData;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = getIconComp(model.iconKey);
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-4 text-left transition-all",
        selected
          ? "border-primary/60 bg-primary/[0.04]"
          : "border-border bg-card hover:border-primary/25 hover:bg-muted/30"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div
            className={cn(
              "flex size-8 flex-shrink-0 items-center justify-center rounded-lg border",
              selected ? "border-primary/30 bg-primary/10" : "border-border bg-muted"
            )}
          >
            <Icon className={cn("size-4", selected ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div className="min-w-0">
            <TruncatedText
              text={model.name}
              className={cn(
                "text-base font-bold",
                selected ? "text-primary" : "text-foreground"
              )}
            />
            <span className="mt-0.5 inline-block rounded border border-border bg-muted px-1.5 py-px font-mono text-2xs text-muted-foreground">
              {model.id}
            </span>
          </div>
        </div>
        <ModelSummaryRow model={model} />
      </div>
      <TruncatedText text={model.description} className="mb-2 line-clamp-1 text-sm text-muted-foreground" />
      {model.tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1">
          {model.tags.slice(0, 4).map((t) => (
            <TagChip key={t} label={t} />
          ))}
          {model.tags.length > 4 && (
            <MoreTagsPopover
              allTags={model.tags}
              label={`+${model.tags.length - 4} more tags`}
            />
          )}
        </div>
      ) : (
        <span className="text-xs italic text-muted-foreground/40">No tag</span>
      )}
    </button>
  );
}

/* ── Sequence + Detection Rules read-only view ───────────────────────────── */

function ModelConfigurePanel({
  model,
  allRules,
  onNext,
}: {
  model: ModelData;
  allRules: RuleData[];
  onNext: () => void;
}) {
  const Icon = getIconComp(model.iconKey);
  const sequence = model.sequenceIds
    .map((id) => model.steps.find((s) => s.id === id))
    .filter(Boolean) as ModelData["steps"];
  const rules = allRules.filter((r) => model.attachedRuleIds.includes(r.id));

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
            <Icon className="size-5 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-md font-bold text-foreground">{model.name}</h2>
              <span className="rounded border border-border bg-muted px-1.5 py-px font-mono text-xs text-muted-foreground">
                {model.id}
              </span>
            </div>
            <TruncatedText text={model.description} className="mt-1 line-clamp-1 text-xs text-muted-foreground" />
            <div className="mt-1.5">
              <ModelSummaryRow model={model} />
            </div>
          </div>
        </div>
        <Button size="sm" onClick={onNext} className="flex-shrink-0 gap-1.5">
          <Video className="size-3.5" />
          Upload Video
        </Button>
      </div>

      {/* Content (scrollable) */}
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {/* Sequence */}
        <div>
          <SectionHeader
            label="Sequence"
            count={sequence.length}
            description="each step runs a dedicated CV model sequentially"
          />
          {sequence.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No sequence defined for this model
            </div>
          ) : (
            <div className="space-y-2">
              {sequence.map((step, idx) => (
                <div
                  key={step.id}
                  className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
                >
                  <GripVertical className="size-3.5 flex-shrink-0 text-muted-foreground/30" />
                  <span className="flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-2xs font-bold text-primary">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <TruncatedText text={step.actionLabel} className="text-sm font-semibold text-foreground" />
                    <p className="font-mono text-xs text-muted-foreground">{step.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detection Rules */}
        <div>
          <SectionHeader
            label="Detection Rules"
            count={rules.length}
            description="rules that trigger on this model"
          />
          {rules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No rules attached to this model
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-xl border border-border bg-background p-3.5"
                >
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-base font-bold text-foreground">{rule.name}</span>
                      <RuleSeverityBadge severity={rule.severity} />
                    </div>
                  </div>
                  <TruncatedText text={rule.description} className="mb-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {rule.tags.slice(0, 3).map((t) => (
                      <TagChip key={t} label={t} />
                    ))}
                    {rule.tags.length > 3 && (
                      <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-px text-2xs font-semibold text-primary">
                        +{rule.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── VLM option row ──────────────────────────────────────────────────────── */

function VLMRow({
  vlm,
  selected,
  onClick,
}: {
  vlm: VLMOption;
  selected: boolean;
  onClick: () => void;
}) {
  const speedTone = {
    fast: "border-success/30 bg-success/15 text-success",
    balanced: "border-info/30 bg-info/15 text-info",
    slow: "border-warning/30 bg-warning/15 text-warning",
  }[vlm.speed];

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-all",
        selected
          ? "border-primary/50 bg-primary/[0.04]"
          : "border-border bg-card hover:border-primary/25 hover:bg-muted/30"
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{vlm.name}</p>
        <p className="font-mono text-2xs text-muted-foreground">{vlm.params}</p>
      </div>
      <span
        className={cn(
          "rounded-full border px-2 py-0.5 text-2xs font-bold uppercase tracking-wider",
          speedTone
        )}
      >
        {vlm.speed}
      </span>
      <div
        className={cn(
          "flex size-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all",
          selected ? "border-primary bg-primary" : "border-border bg-card"
        )}
      >
        {selected && <span className="size-1.5 rounded-full bg-primary-foreground" />}
      </div>
    </button>
  );
}

/* ── Video upload zone (placeholder UX) ──────────────────────────────────── */

function VideoUploader({
  file,
  onUpload,
  onClear,
  invalid = false,
}: {
  file: { name: string; size: string } | null;
  onUpload: (f: { name: string; size: string }) => void;
  onClear: () => void;
  invalid?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  function pick() {
    inputRef.current?.click();
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    onUpload({
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    onUpload({
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
    });
  }

  if (file) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {/* fake video frame */}
        <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 80% at 50% 60%, rgba(180,140,80,0.18) 0%, rgba(60,40,20,0.1) 40%, rgba(0,0,0,0.95) 100%)",
            }}
          />
          <div className="absolute left-3 top-3">
            <button
              onClick={onClear}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sev-critical/40 bg-sev-critical/15 px-2.5 py-1 text-xs font-semibold text-sev-critical transition-colors hover:bg-sev-critical/25"
            >
              <Trash2 className="size-3" />
              Delete
            </button>
          </div>
          <div className="absolute right-3 top-3 rounded border border-border bg-card/80 px-2 py-0.5 text-2xs text-muted-foreground backdrop-blur-sm">
            {file.name} · {file.size}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
              <Play className="size-5 text-white" />
            </div>
          </div>
        </div>
        {/* fake controls */}
        <div className="border-t border-border bg-card px-3 py-2.5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-mono text-xs">00:00</span>
            <div className="relative flex-1">
              <div className="h-1 w-full rounded-full bg-muted">
                <div className="h-full w-[35%] rounded-full bg-primary" />
              </div>
              <span className="absolute left-[35%] top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
            </div>
            <span className="font-mono text-xs">32:31</span>
          </div>
          <div className="mt-1.5 flex items-center justify-center gap-3 text-muted-foreground">
            <button className="hover:text-foreground"><SkipBack className="size-4" /></button>
            <button className="flex size-7 items-center justify-center rounded-full bg-foreground/90 text-background hover:bg-foreground">
              <Pause className="size-3.5" />
            </button>
            <button className="hover:text-foreground"><SkipForward className="size-4" /></button>
            <span className="ml-2 text-xs"><Volume2 className="size-3.5" /></span>
            <span className="ml-auto text-xs"><Maximize2 className="size-3.5" /></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={pick}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-6 py-10 text-center transition-colors hover:border-primary/40",
        invalid && "border-sev-critical"
      )}
    >
      <UploadCloud className="size-9 text-muted-foreground/50" />
      <p className="text-base text-muted-foreground">
        <span className="font-semibold text-primary">Upload a file</span> or drag and drop
      </p>
      <p className="text-xs text-muted-foreground/60">
        Supported: MP4, MOV, AVI · Max 100 MB
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={onChange}
      />
    </button>
  );
}

/* ── Selected model summary (sidebar in upload step) ─────────────────────── */

function SelectedModelCard({ model, allRules }: { model: ModelData; allRules: RuleData[] }) {
  const [open, setOpen] = React.useState(true);
  const Icon = getIconComp(model.iconKey);

  const sequence = model.sequenceIds
    .map((id) => model.steps.find((s) => s.id === id))
    .filter(Boolean) as ModelData["steps"];
  const rules = allRules.filter((r) => model.attachedRuleIds.includes(r.id));

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
            <Icon className="size-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <TruncatedText text={model.name} className="text-base font-bold text-foreground" />
              <span className="rounded border border-border bg-muted px-1.5 py-px font-mono text-2xs text-muted-foreground">
                {model.id}
              </span>
            </div>
            <TruncatedText text={model.description} className="line-clamp-1 text-xs text-muted-foreground" />
          </div>
        </div>
        <ChevronDown
          className={cn(
            "size-4 flex-shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="space-y-4 border-t border-border px-4 py-3">
          <ModelSummaryRow model={model} />

          {/* Sequence */}
          {sequence.length > 0 && (
            <div>
              <SectionHeader label="Sequence" count={sequence.length} />
              <div className="space-y-1.5">
                {sequence.map((step, idx) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1.5"
                  >
                    <span className="flex size-4 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-3xs font-bold text-primary">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <TruncatedText text={step.actionLabel} className="text-xs font-semibold text-foreground" />
                      <p className="font-mono text-3xs text-muted-foreground">{step.label}</p>
                    </div>
                    {(() => {
                      const ext = step.modelFile.trim().match(/\.([a-z0-9]+)$/i)?.[1].toLowerCase() ?? "file";
                      return (
                        <span
                          className={cn(
                            "rounded border px-1.5 py-px font-mono text-3xs font-bold uppercase",
                            ext === "json"
                              ? "border-info/30 bg-info/10 text-info"
                              : "border-primary/30 bg-primary/10 text-primary"
                          )}
                        >
                          {ext}
                        </span>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detection Rules */}
          {rules.length > 0 && (
            <div>
              <SectionHeader label="Detection Rules" count={rules.length} />
              <div className="space-y-2">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="rounded-xl border border-border bg-background p-3"
                  >
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-sm font-bold text-foreground">{rule.name}</span>
                        <RuleSeverityBadge severity={rule.severity} />
                      </div>
                    </div>
                    <TruncatedText text={rule.description} className="mb-1.5 line-clamp-2 text-2xs leading-relaxed text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {rule.tags.slice(0, 3).map((t) => (
                        <TagChip key={t} label={t} />
                      ))}
                      {rule.tags.length > 3 && (
                        <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-px text-2xs font-semibold text-primary">
                          +{rule.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Activity log timeline (matches Incident Cases > Case Activity) ──────── */

const LOG_DOT: Record<LogEventLevel, string> = {
  info:    "border-info",
  passed:  "border-success",
  failed:  "border-sev-critical",
  warning: "border-warning",
};

function LogRow({ entry, isLast }: { entry: ActivityLogEntry; isLast: boolean }) {
  const isFailed = entry.level === "failed";
  return (
    <div className="relative flex gap-4">
      {/* Dot + vertical connector */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "z-10 mt-0.5 size-3.5 flex-shrink-0 rounded-full border-2 bg-card",
            LOG_DOT[entry.level]
          )}
        />
        {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
      </div>

      {/* Content */}
      <div className={cn("min-w-0 pb-5", isLast && "pb-0")}>
        <p className="mb-0.5 font-mono text-xs text-muted-foreground">{entry.timestamp}</p>
        <p
          className={cn(
            "text-base font-semibold leading-snug",
            isFailed ? "text-sev-critical" : "text-foreground"
          )}
        >
          {entry.title}
        </p>
        {entry.detail && (
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{entry.detail}</p>
        )}
      </div>
    </div>
  );
}

/* ── Step result row (left column of result view) ────────────────────────── */

function StepResultRow({ step, idx }: { step: StepResult; idx: number }) {
  const passed = step.status === "passed";
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-3 py-2.5",
        passed
          ? "border-success/30 bg-success/[0.07]"
          : "border-sev-critical/40 bg-sev-critical/[0.08]"
      )}
    >
      <span className="flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-2xs font-bold text-primary">
        {idx + 1}
      </span>
      <div className="min-w-0 flex-1">
        <TruncatedText text={step.label} className="text-sm font-semibold text-foreground" />
        <p className="font-mono text-2xs text-muted-foreground">{step.modelLabel}</p>
      </div>
      <span
        className={cn(
          "rounded-full border px-2 py-0.5 text-2xs font-bold uppercase tracking-wider",
          passed
            ? "border-success/30 bg-success/15 text-success"
            : "border-sev-critical/30 bg-sev-critical/15 text-sev-critical"
        )}
      >
        {passed ? "Passed" : "Failed"}
      </span>
    </div>
  );
}

/* ── Final result row (right column) ─────────────────────────────────────── */

function FinalResultRow({ entry }: { entry: FinalResultEntry }) {
  const passed = entry.status === "passed";
  return (
    <div className="flex items-center gap-3 px-3 py-1.5">
      <span className="w-10 flex-shrink-0 font-mono text-2xs text-muted-foreground/60">
        {entry.timestamp}
      </span>
      <span
        className={cn(
          "rounded-full border px-2 py-0.5 text-3xs font-bold uppercase tracking-wider",
          passed
            ? "border-success/30 bg-success/15 text-success"
            : "border-sev-critical/30 bg-sev-critical/15 text-sev-critical"
        )}
      >
        {passed ? "Passed" : "Failed"}
      </span>
      <TruncatedText text={entry.title} className="text-xs text-foreground" />
    </div>
  );
}

/* ── Triggered rule row ──────────────────────────────────────────────────── */

function TriggeredRuleRow({ rule }: { rule: TriggeredRuleSummary }) {
  const tone = {
    high:   "border-success/30 bg-success/10 text-success",
    medium: "border-warning/30 bg-warning/10 text-warning",
    low:    "border-sev-critical/30 bg-sev-critical/10 text-sev-critical",
  }[rule.confidence];

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5">
      <span
        className={cn(
          "rounded-full border px-2 py-0.5 text-2xs font-bold uppercase tracking-wider",
          tone
        )}
      >
        {rule.confidence}
      </span>
      <div className="min-w-0 flex-1">
        <TruncatedText text={rule.ruleName} className="text-sm font-semibold text-foreground" />
        <p className="text-2xs text-muted-foreground">{rule.detectionType}</p>
      </div>
      <div className="flex flex-shrink-0 items-baseline gap-1 rounded-md border border-border bg-muted/40 px-2 py-1">
        <span className="text-md font-bold leading-none text-foreground">{rule.count}</span>
        <span className="text-3xs font-mono uppercase tracking-wider text-muted-foreground/70">
          {rule.count === 1 ? "trigger" : "triggers"}
        </span>
      </div>
    </div>
  );
}

/* ── Score cards ─────────────────────────────────────────────────────────── */

import { KpiCard as SharedKpiCard, type KpiAccent } from "@/components/shared/KpiCard";
import { DateRangeBar } from "@/components/shared/DateRangeBar";

function ScoreHeroCard({ result, compact = false }: { result: AnalysisResult; compact?: boolean }) {
  const tone = result.status;
  const accent: KpiAccent =
    tone === "passed" ? "success" :
    tone === "failed" ? "sev-critical" :
    "warning";
  // Status moves into the SUB row (sentence-cased label) so the LABEL row stays uncluttered.
  const statusLabel = tone === "passed" ? "Passed" : tone === "failed" ? "Failed" : "Warning";
  return (
    <SharedKpiCard
      compact={compact}
      accent={accent}
      label="Score"
      value={`${result.score}%`}
      sub={
        <span className={cn("inline-flex items-center gap-1.5 font-semibold",
          tone === "passed" ? "text-success" :
          tone === "failed" ? "text-sev-critical" :
          "text-warning"
        )}>
          <span className={cn("size-1.5 rounded-full",
            tone === "passed" ? "bg-success" :
            tone === "failed" ? "bg-sev-critical" :
            "bg-warning"
          )} />
          {statusLabel}
        </span>
      }
    />
  );
}

function MiniScoreCard({ label, value, tone, sub, compact = false }: { label: string; value: string; tone: "success" | "warning"; sub?: React.ReactNode; compact?: boolean }) {
  const accent: KpiAccent = tone === "success" ? "success" : "warning";
  return <SharedKpiCard compact={compact} accent={accent} label={label} value={value} sub={sub} />;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDisplay(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

let _anyCtr = 7;
function nextAnalysisId() {
  _anyCtr += 1;
  return `ANY_${String(_anyCtr).padStart(3, "0")}`;
}

function buildSyntheticResult(modelSteps: number, modelRules: number): AnalysisResult {
  const stepsPassed = Math.max(1, Math.floor(modelSteps * 0.6));
  const rulesTriggered = Math.max(1, Math.floor(modelRules * 0.75));
  const score = Math.round((stepsPassed / Math.max(modelSteps, 1)) * 100);
  const status: RunStatus = score >= 80 ? "passed" : score >= 60 ? "warning" : "failed";

  const baseResult = MOCK_PAST_ANALYSES[0].result;
  return {
    ...baseResult,
    stepsPassed,
    stepsTotal: Math.max(modelSteps, 1),
    rulesTriggered,
    rulesTotal: Math.max(modelRules, 1),
    score,
    status,
  };
}

/* ── Analyzing progress stages ───────────────────────────────────────────── */

const ANALYZING_STAGES: { label: string; pct: number; etaSec: number }[] = [
  { label: "Uploading footage to processing pipeline…", pct: 15,  etaSec: 32 },
  { label: "Initializing model inference engine…",      pct: 35,  etaSec: 24 },
  { label: "Scanning frames & extracting detections…",  pct: 60,  etaSec: 16 },
  { label: "Generating VLM reasoning narrative…",       pct: 85,  etaSec: 8  },
  { label: "Finalising scores & compiling report…",     pct: 100, etaSec: 3  },
];

function formatEta(sec: number): string {
  if (sec <= 5) return "almost done";
  if (sec < 60) return `~${sec}s remaining`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `~${m}m ${s.toString().padStart(2, "0")}s remaining`;
}

function AnalysisLoadingScreen({
  stage,
  onCancel,
}: {
  stage: number;
  onCancel: () => void;
}) {
  const idx = Math.min(stage, ANALYZING_STAGES.length - 1);
  const current = ANALYZING_STAGES[idx];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Run Analysis</h2>
          <p className="text-base text-muted-foreground">
            The model is processing your footage. This may take a few seconds.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onCancel} className="gap-1.5 mt-1">
          <X className="size-3.5" />
          Cancel
        </Button>
      </div>

      <Stepper current="result" />

      <div className="rounded-xl border border-border bg-card px-8 py-14">
        <div className="mx-auto flex max-w-md flex-col items-center gap-5">
          <div className="size-12 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
          <div className="text-center">
            <p className="text-md font-bold text-foreground">Analysing your footage</p>
            <p className="mt-1 text-sm text-muted-foreground">{current.label}</p>
          </div>

          <div className="w-full">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${current.pct}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between font-mono text-2xs text-muted-foreground">
              <span>{current.pct}%</span>
              <span>
                Stage {idx + 1} of {ANALYZING_STAGES.length}
              </span>
            </div>
          </div>

          <div className="grid w-full grid-cols-5 gap-1.5">
            {ANALYZING_STAGES.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 rounded-full transition-colors",
                  i <= idx ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Estimated time remaining */}
          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
            <Clock className="size-3 text-muted-foreground" />
            <span className="font-mono text-xs text-muted-foreground">
              <strong className="text-foreground">{formatEta(current.etaSec)}</strong>
            </span>
          </div>

          <Button variant="outline" size="sm" onClick={onCancel} className="gap-1.5">
            <X className="size-3.5" />
            Cancel analysis
          </Button>

          <p className="text-center text-2xs text-muted-foreground/60">
            This typically takes a few seconds. You can cancel at any time.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Analysis failed screen ──────────────────────────────────────────────── */

function AnalysisFailedScreen({
  failure,
  onRetry,
  onBackToUpload,
  onNewAnalysis,
  onShowHistory,
}: {
  failure: RunFailure;
  onRetry: () => void;
  onBackToUpload: () => void;
  onNewAnalysis: () => void;
  onShowHistory: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Run Analysis</h2>
          <p className="text-base text-muted-foreground">
            The pipeline could not complete. Review the failure and retry or edit setup.
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onShowHistory} className="gap-1.5">
            <FileText className="size-3.5" />
            History
          </Button>
          <Button variant="outline" size="sm" onClick={onBackToUpload} className="gap-1.5">
            <ArrowLeft className="size-3.5" />
            Edit Setup
          </Button>
          <Button variant="outline" size="sm" onClick={onNewAnalysis} className="gap-1.5">
            <Plus className="size-3.5" />
            New Analysis
          </Button>
          <Button size="sm" onClick={onRetry} className="gap-1.5">
            <Sparkles className="size-3.5" />
            Retry Run
          </Button>
        </div>
      </div>

      <Stepper current="result" />

      <div className="rounded-xl border border-sev-critical/30 bg-sev-critical/[0.05] px-8 py-12">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-5 text-center">
          <div className="flex size-14 items-center justify-center rounded-full border-2 border-sev-critical/40 bg-sev-critical/15">
            <XCircle className="size-7 text-sev-critical" />
          </div>

          <div>
            <p className="text-lg font-bold text-foreground">Analysis run failed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The pipeline did not complete. No results have been generated.
            </p>
          </div>

          <div className="w-full rounded-lg border border-sev-critical/25 bg-card px-4 py-3 text-left">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Failure
              </span>
              <span className="rounded border border-sev-critical/30 bg-sev-critical/10 px-1.5 py-px font-mono text-2xs font-bold uppercase tracking-wider text-sev-critical">
                {failure.code}
              </span>
            </div>
            <p className="text-base font-semibold text-foreground">{failure.reason}</p>
            {failure.detail && (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {failure.detail}
              </p>
            )}
          </div>

          <p className="text-2xs text-muted-foreground/60">
            This failed run has still been logged in your history for traceability.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */
/* ─── Page ──────────────────────────────────────────────────────────────── */
/* ───────────────────────────────────────────────────────────────────────── */

export default function RunAnalysisPage({
  forcedState = "normal",
  onRetry,
}: {
  /** Prototype hook — forces the page's data-state (loading / empty / error / no-results). */
  forcedState?: RunForcedState;
  onRetry?: () => void;
} = {}) {
  const [tab, setTab] = React.useState<"analysis" | "history">("analysis");

  // Flow state
  const [flowStep, setFlowStep] = React.useState<FlowStep>("select");
  const [selectedModelId, setSelectedModelId] = React.useState<string | null>(null);
  const [analysisName, setAnalysisName] = React.useState("");
  const [uploadedFile, setUploadedFile] = React.useState<{ name: string; size: string } | null>(null);
  const [selectedVlmId, setSelectedVlmId] = React.useState<string | null>(MOCK_VLMS[0]?.id ?? null);
  const [currentResult, setCurrentResult] = React.useState<AnalysisResult | null>(null);
  const [completedToast, setCompletedToast] = React.useState(false);

  // Analysis loading flow (Fix #5)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analyzingStage, setAnalyzingStage] = React.useState(0);
  const [currentRunId, setCurrentRunId] = React.useState<string | null>(null);
  const [currentFailure, setCurrentFailure] = React.useState<RunFailure | null>(null);
  const pendingRunRef = React.useRef<{ result: AnalysisResult; newRun: PastAnalysis } | null>(null);
  const currentRunIdRef = React.useRef<string | null>(null);

  // Past analyses (history)
  const [pastAnalyses, setPastAnalyses] = React.useState<PastAnalysis[]>(MOCK_PAST_ANALYSES);
  const [viewingPastId, setViewingPastId] = React.useState<string | null>(null);

  // Selector filters (step 1)
  const [modelSearch, setModelSearch] = React.useState("");
  const [tagFilter, setTagFilter] = React.useState<string[]>([]);

  const allModels = MOCK_MODELS;
  const selectedModel = allModels.find((m) => m.id === selectedModelId) ?? null;

  const filteredModels = React.useMemo(() => {
    const q = modelSearch.toLowerCase().trim();
    return allModels.filter((m) => {
      if (q && !m.name.toLowerCase().includes(q) && !m.id.toLowerCase().includes(q)) return false;
      if (tagFilter.length > 0 && !tagFilter.every((t) => m.tags.includes(t))) return false;
      return true;
    });
  }, [allModels, modelSearch, tagFilter]);

  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    allModels.forEach((m) => m.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [allModels]);

  function resetFlow() {
    setFlowStep("select");
    setSelectedModelId(null);
    setAnalysisName("");
    setUploadedFile(null);
    setSelectedVlmId(null);
    setCurrentResult(null);
    setCompletedToast(false);
    setIsAnalyzing(false);
    setAnalyzingStage(0);
    setCurrentRunId(null);
    setCurrentFailure(null);
    currentRunIdRef.current = null;
    pendingRunRef.current = null;
  }

  function handleCancelAnalysis() {
    setIsAnalyzing(false);
    setAnalyzingStage(0);
    setCurrentFailure(null);
    pendingRunRef.current = null;
    setFlowStep("upload");
  }

  // Probability that a freshly triggered run technically fails mid-pipeline.
  const FAILURE_PROBABILITY = 0.15;

  const FAILURE_LIBRARY: RunFailure[] = [
    {
      code: "VLM_UNAVAILABLE",
      reason: "Selected VLM is currently unreachable",
      detail: "The VLM service did not respond within the connection timeout. Choose another model or retry shortly.",
    },
    {
      code: "VLM_TIMEOUT",
      reason: "VLM inference exceeded the 2× footage duration SLA",
      detail: "Inference took longer than the per-run budget. Try a faster VLM or a shorter clip.",
    },
    {
      code: "INFERENCE_ERROR",
      reason: "Pipeline crashed during frame extraction",
      detail: "An internal worker stopped responding while decoding frames. The partial run was discarded.",
    },
    {
      code: "FOOTAGE_CORRUPT",
      reason: "Uploaded footage failed integrity check",
      detail: "Bitstream metadata was inconsistent past frame 312. Re-export the clip and retry.",
    },
  ];

  function handleRun() {
    if (!selectedModel) return;
    if (!analysisName.trim() || !uploadedFile || !selectedVlmId) return;

    const willFail = Math.random() < FAILURE_PROBABILITY;
    const result = buildSyntheticResult(
      Math.max(selectedModel.sequenceIds.length, 1),
      Math.max(selectedModel.attachedRuleIds.length, 1)
    );

    const vlm = MOCK_VLMS.find((v) => v.id === selectedVlmId)!;
    const now = new Date();
    const failure = willFail
      ? FAILURE_LIBRARY[Math.floor(Math.random() * FAILURE_LIBRARY.length)]
      : undefined;

    const newRun: PastAnalysis = {
      id: nextAnalysisId(),
      name: analysisName.trim(),
      modelId: selectedModel.id,
      modelName: selectedModel.name,
      vlmId: vlm.id,
      vlmName: vlm.name,
      score: result.score,
      status: result.status,
      tags: willFail
        ? ["Failed", "Script Error"]
        : [result.status === "passed" ? "Passed" : result.status === "failed" ? "Failed" : "Warning", "Tested"],
      createdAt: now.toISOString(),
      createdAtDisplay: fmtDisplay(now),
      result,
      runState: willFail ? "failed" : "completed",
      failure,
      verdict: "pending",
      runtimeDisplay: willFail ? "—" : "32s",
      completedAtDisplay: fmtDisplay(now),
      startedBy: "Delbin Arkar",
    };

    pendingRunRef.current = { result, newRun };
    setFlowStep("result");
    setAnalyzingStage(0);
    setCompletedToast(false);
    setCurrentResult(null);
    setIsAnalyzing(true);
    toast.message("Analysis started", {
      description: `${newRun.name} · ${selectedModel.name}`,
    });
  }

  function handleRetryRun() {
    // Re-trigger the same configuration; reuse the existing handleRun pathway.
    handleRun();
  }

  function handleSetVerdict(verdict: AnalysisVerdict) {
    const target = pendingRunRef.current?.newRun.id ?? currentRunIdRef.current;
    if (!target) return;
    const now = new Date();
    setPastAnalyses((prev) =>
      prev.map((a) =>
        a.id === target
          ? {
              ...a,
              verdict,
              verdictAt: now.toISOString(),
              verdictAtDisplay: fmtDisplay(now),
            }
          : a
      )
    );
  }

  // Drive the analyzing progress stages
  React.useEffect(() => {
    if (!isAnalyzing) return;
    const stageMs = 850;
    const id = window.setInterval(() => {
      setAnalyzingStage((s) => {
        if (s >= ANALYZING_STAGES.length - 1) {
          window.clearInterval(id);
          const pending = pendingRunRef.current;
          if (pending) {
            setPastAnalyses((p) => [pending.newRun, ...p]);
            setCurrentRunId(pending.newRun.id);
            currentRunIdRef.current = pending.newRun.id;

            if (pending.newRun.runState === "failed") {
              setCurrentFailure(pending.newRun.failure ?? null);
              setCurrentResult(null);
              setCompletedToast(false);
              toast.error("Analysis failed", {
                description: pending.newRun.failure?.reason ?? "Run aborted mid-flow.",
              });
            } else {
              setCurrentResult(pending.result);
              setCurrentFailure(null);
              setCompletedToast(true);
              toast.success("Analysis completed", {
                description: `${pending.newRun.name} · score ${pending.newRun.score}`,
              });
            }
            pendingRunRef.current = null;
          }
          setIsAnalyzing(false);
          return s;
        }
        return s + 1;
      });
    }, stageMs);
    return () => window.clearInterval(id);
  }, [isAnalyzing]);

  /* ─── Render ─── */

  return (
    <div className="flex flex-col gap-4">


      {/* ── Tab content ── */}
      {tab === "analysis" ? (
        flowStep === "select" ? (
          <SelectStep
            selectedModelId={selectedModelId}
            onSelectModel={setSelectedModelId}
            selectedModel={selectedModel}
            allRules={MOCK_RULES}
            modelSearch={modelSearch}
            setModelSearch={setModelSearch}
            tagFilter={tagFilter}
            setTagFilter={setTagFilter}
            allTags={allTags}
            filteredModels={filteredModels}
            totalModels={allModels.length}
            onNext={() => setFlowStep("upload")}
            onShowHistory={() => setTab("history")}
            forcedState={forcedState}
          />
        ) : flowStep === "upload" ? (
          <UploadStep
            selectedModel={selectedModel!}
            analysisName={analysisName}
            setAnalysisName={setAnalysisName}
            uploadedFile={uploadedFile}
            setUploadedFile={setUploadedFile}
            selectedVlmId={selectedVlmId}
            setSelectedVlmId={setSelectedVlmId}
            onBack={() => setFlowStep("select")}
            onRun={handleRun}
            onShowHistory={() => setTab("history")}
          />
        ) : isAnalyzing ? (
          <AnalysisLoadingScreen
            stage={analyzingStage}
            onCancel={handleCancelAnalysis}
          />
        ) : currentFailure ? (
          <AnalysisFailedScreen
            failure={currentFailure}
            onRetry={handleRetryRun}
            onBackToUpload={() => { setCurrentFailure(null); setFlowStep("upload"); }}
            onNewAnalysis={resetFlow}
            onShowHistory={() => setTab("history")}
          />
        ) : !currentResult ? (
          <AnalysisLoadingScreen
            stage={analyzingStage}
            onCancel={handleCancelAnalysis}
          />
        ) : (
          <ResultStep
            result={currentResult}
            modelName={selectedModel?.name ?? ""}
            vlmName={MOCK_VLMS.find((v) => v.id === selectedVlmId)?.name ?? ""}
            currentRun={pastAnalyses.find((a) => a.id === currentRunId) ?? null}
            completedToast={completedToast}
            onDismissToast={() => setCompletedToast(false)}
            onGoBack={resetFlow}
            onSetVerdict={handleSetVerdict}
          />
        )
      ) : (
        <HistoryTab
          pastAnalyses={pastAnalyses}
          onView={(id) => setViewingPastId(id)}
          onDelete={(id) => {
            const target = pastAnalyses.find((a) => a.id === id);
            setPastAnalyses((p) => p.filter((a) => a.id !== id));
            toast.success(`Analysis "${target?.name ?? id}" deleted`);
          }}
          onBackToAnalysis={() => setTab("analysis")}
          forcedState={forcedState}
          onRetry={onRetry}
        />
      )}

      {/* ── History detail drawer ── */}
      {viewingPastId && (
        <HistoryDetailDrawer
          analysis={pastAnalyses.find((a) => a.id === viewingPastId)!}
          onClose={() => setViewingPastId(null)}
        />
      )}
    </div>
  );
}

/* ─── Step 1 ─────────────────────────────────────────────────────────────── */

/* ─── Forced data-states (loading / empty / error / no-results) ──────────── */

export type RunForcedState = "normal" | "loading" | "empty" | "error" | "noresults";

function ModelChooserSkeleton() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

/* Empty model list — no validated models to run an analysis on. */
function ModelListEmptyCTA() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
      <Cpu className="size-8 opacity-30" />
      <p className="text-sm">Create a model in the Model Management to continue.</p>
      <Button size="sm" className="gap-1.5" onClick={() => navigate("/models")}>
        <Plus className="size-4" />
        Create Model
      </Button>
    </div>
  );
}

function ContentError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-sev-critical/30 bg-sev-critical/[0.05] py-20 text-muted-foreground">
      <AlertTriangle className="size-8 text-sev-critical" />
      <p className="text-sm text-foreground">Couldn't load analysis history.</p>
      {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Retry</Button>}
    </div>
  );
}

function HistoryNoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-24 text-muted-foreground">
      <Search className="size-10 opacity-30" />
      <p className="text-sm font-medium text-foreground">No analyses match your filters</p>
      <p className="text-[12px]">Try a different status, model, or date range — or clear the active filters.</p>
      <Button variant="outline" size="sm" className="mt-1" onClick={onClear}>Clear filters</Button>
    </div>
  );
}

function HistorySkeletonRA() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[96px] animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-11 w-full animate-pulse rounded-xl bg-muted" />
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="h-10 border-b border-border bg-muted/30" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border/60 px-4 py-3 last:border-0">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="h-3 flex-1 animate-pulse rounded bg-muted" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectStep({
  selectedModelId,
  onSelectModel,
  selectedModel,
  allRules,
  modelSearch,
  setModelSearch,
  tagFilter,
  setTagFilter,
  allTags,
  filteredModels,
  totalModels,
  onNext,
  onShowHistory,
  forcedState,
}: {
  selectedModelId: string | null;
  onSelectModel: (id: string) => void;
  selectedModel: ModelData | null;
  allRules: RuleData[];
  modelSearch: string;
  setModelSearch: (v: string) => void;
  tagFilter: string[];
  setTagFilter: (v: string[]) => void;
  allTags: string[];
  filteredModels: ModelData[];
  totalModels: number;
  onNext: () => void;
  onShowHistory: () => void;
  forcedState?: RunForcedState;
}) {
  const isLoading = forcedState === "loading";
  const isEmpty = forcedState === "empty";
  return (
    <div className="flex flex-col gap-4">

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Run Analysis</h2>
          <p className="text-base text-muted-foreground">
            Test models against uploaded footage with VLM-powered reasoning before deployment.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onShowHistory} className="gap-1.5 mt-1">
          <FileText className="size-3.5" />
          History
        </Button>
      </div>

      <div className="flex h-[calc(100vh-16rem)] min-h-[560px] gap-4">

      {/* ── Left panel — model chooser ── */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex-shrink-0 border-b border-border px-5 py-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-md font-bold text-foreground">Choose an AI Model</h2>
              <p className="text-sm text-muted-foreground">
                Select the model you want to run on your footage
              </p>
            </div>
            <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              {totalModels} Models
            </span>
          </div>

          <div className="grid grid-cols-[1fr_180px] gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                placeholder="Search model"
                className="h-9 pl-9 text-base"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button className={cn(
                  "h-9 inline-flex items-center justify-between gap-2 rounded-lg border bg-background px-3 text-base transition-colors hover:border-primary",
                  tagFilter.length > 0 ? "border-primary text-foreground" : "border-border text-muted-foreground"
                )}>
                  <TruncatedText
                    text={tagFilter.length === 0 ? "All tags" : tagFilter.length === 1 ? tagFilter[0] : `${tagFilter.length} tags`}
                    className="truncate"
                  />
                  <ChevronDown className="size-3.5 flex-shrink-0 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="max-h-[280px] w-56 overflow-y-auto p-1.5">
                {allTags.map((tag) => {
                  const checked = tagFilter.includes(tag);
                  return (
                    <button key={tag} onClick={() => setTagFilter(checked ? tagFilter.filter((x) => x !== tag) : [...tagFilter, tag])}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-base text-muted-foreground hover:bg-muted hover:text-foreground">
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
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <ModelChooserSkeleton />
          ) : isEmpty ? (
            <ModelListEmptyCTA />
          ) : filteredModels.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
              <Search className="size-8 opacity-20" />
              <p className="text-sm">No models match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
              {filteredModels.map((m) => (
                <ModelChooserCard
                  key={m.id}
                  model={m}
                  selected={selectedModelId === m.id}
                  onClick={() => onSelectModel(m.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel — configuration ── */}
      <div className="flex w-[440px] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="flex h-full flex-col gap-3 p-5">
            <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
            <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
            <div className="mt-auto h-10 w-full animate-pulse rounded-md bg-muted" />
          </div>
        ) : selectedModel ? (
          <ModelConfigurePanel
            model={selectedModel}
            allRules={allRules}
            onNext={onNext}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="flex size-14 items-center justify-center rounded-full border border-dashed border-border">
              <Plus className="size-6" />
            </div>
            <p className="text-base">Select a model to configure</p>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

/* ─── Step 2 ─────────────────────────────────────────────────────────────── */

function UploadStep({
  selectedModel,
  analysisName,
  setAnalysisName,
  uploadedFile,
  setUploadedFile,
  selectedVlmId,
  setSelectedVlmId,
  onBack,
  onRun,
  onShowHistory,
}: {
  selectedModel: ModelData;
  analysisName: string;
  setAnalysisName: (v: string) => void;
  uploadedFile: { name: string; size: string } | null;
  setUploadedFile: (f: { name: string; size: string } | null) => void;
  selectedVlmId: string | null;
  setSelectedVlmId: (id: string) => void;
  onBack: () => void;
  onRun: () => void;
  onShowHistory: () => void;
}) {
  const [errors, setErrors] = React.useState<{ name?: string; file?: string; vlm?: string }>({});

  function handleRunClick() {
    const next: { name?: string; file?: string; vlm?: string } = {};
    if (!analysisName.trim()) next.name = "Analysis name is required.";
    if (!uploadedFile) next.file = "Upload a video file to analyze.";
    if (!selectedVlmId) next.vlm = "Select a VLM model.";
    setErrors(next);
    if (Object.keys(next).length === 0) onRun();
  }

  return (
    <div className="space-y-5">

      {/* Top actions */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Run Analysis</h2>
          <p className="text-base text-muted-foreground">
            Upload your footage and select a VLM to run the model against the clip.
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onShowHistory} className="gap-1.5">
            <FileText className="size-3.5" />
            History
          </Button>
          <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="size-3.5" />
            Go Back
          </Button>
          <Button size="sm" onClick={handleRunClick} className="gap-1.5">
            <Sparkles className="size-3.5" />
            Run Analysis
          </Button>
        </div>
      </div>

      <Stepper current="upload" />

      <div className="grid grid-cols-[1fr_420px] gap-5">

        {/* ── Left: analysis info + uploader ── */}
        <div className="space-y-4">
          <div>
            <p className="mb-3 text-md font-bold text-foreground">Analysis Information</p>

            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Analysis Name
              </label>
              <Input
                value={analysisName}
                onChange={(e) => {
                  setAnalysisName(e.target.value);
                  if (e.target.value.trim()) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                placeholder="Enter analysis name (e.g. Model A Analysis)"
                className="h-10 text-base"
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="mt-1 text-xs text-sev-critical">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Video Footage
              </label>
              <VideoUploader
                file={uploadedFile}
                onUpload={(f) => {
                  setUploadedFile(f);
                  setErrors((prev) => ({ ...prev, file: undefined }));
                }}
                onClear={() => setUploadedFile(null)}
                invalid={!!errors.file}
              />
              {errors.file && <p className="mt-1 text-xs text-sev-critical">{errors.file}</p>}
            </div>
          </div>
        </div>

        {/* ── Right: selected model + VLM picker ── */}
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Selected Model
            </p>
            <SelectedModelCard model={selectedModel} allRules={MOCK_RULES} />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select VLM Model
            </p>
            <div
              className={cn(
                "overflow-hidden rounded-xl border border-border bg-card",
                errors.vlm && "border-sev-critical"
              )}
            >
              <div className="border-b border-border bg-muted/20 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-3.5 text-primary" />
                  <p className="text-base font-bold text-foreground">SOP VLM for Reasoning</p>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  AI will describe &amp; reason about the footage
                </p>
              </div>
              <div className="h-[316px] space-y-1.5 overflow-y-auto p-2">
                {MOCK_VLMS.map((vlm) => (
                  <VLMRow
                    key={vlm.id}
                    vlm={vlm}
                    selected={selectedVlmId === vlm.id}
                    onClick={() => {
                      setSelectedVlmId(vlm.id);
                      setErrors((prev) => ({ ...prev, vlm: undefined }));
                    }}
                  />
                ))}
              </div>
            </div>
            {errors.vlm && <p className="mt-1 text-xs text-sev-critical">{errors.vlm}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Verdict badge (shown once user has approved/rejected a run) ─────────── */

function VerdictBadge({
  verdict,
  verdictAtDisplay,
}: {
  verdict: AnalysisVerdict;
  verdictAtDisplay?: string;
}) {
  if (verdict === "pending") return null;
  const isApproved = verdict === "approved";
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-1.5",
        isApproved
          ? "border-success/40 bg-success/10"
          : "border-sev-critical/40 bg-sev-critical/10"
      )}
    >
      {isApproved ? (
        <CheckCircle2 className="size-4 text-success" />
      ) : (
        <XCircle className="size-4 text-sev-critical" />
      )}
      <div className="leading-tight">
        <p
          className={cn(
            "text-sm font-bold",
            isApproved ? "text-success" : "text-sev-critical"
          )}
        >
          {isApproved ? "Approved for Deployment" : "Rejected — Needs Improvement"}
        </p>
        {verdictAtDisplay && (
          <p className="text-2xs text-muted-foreground">{verdictAtDisplay}</p>
        )}
      </div>
    </div>
  );
}

/* ── Run metadata bar (Model · VLM · Started by · etc.) ──────────────────── */

function RunMetadataBar({
  modelName,
  vlmName,
  completedAtDisplay,
  runtimeDisplay,
  startedBy,
  runId,
}: {
  modelName: string;
  vlmName: string;
  completedAtDisplay?: string;
  runtimeDisplay?: string;
  startedBy?: string;
  runId?: string;
}) {
  const items: { label: string; value: React.ReactNode }[] = [];
  if (runId) items.push({ label: "Run ID", value: <span className="font-mono">{runId}</span> });
  if (modelName) items.push({ label: "Model", value: modelName });
  if (vlmName) items.push({ label: "VLM", value: vlmName });
  if (startedBy) items.push({ label: "Started by", value: startedBy });
  if (completedAtDisplay) items.push({ label: "Completed", value: completedAtDisplay });
  if (runtimeDisplay) items.push({ label: "Runtime", value: runtimeDisplay });

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-border bg-card px-4 py-2.5">
      {items.map((it, i) => (
        <React.Fragment key={it.label}>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-3xs uppercase tracking-widest text-muted-foreground/60">
              {it.label}
            </span>
            <span className="text-sm font-semibold text-foreground">{it.value}</span>
          </div>
          {i < items.length - 1 && <span className="text-muted-foreground/30">·</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ─── Step 3 (result) ────────────────────────────────────────────────────── */

function ResultStep({
  result,
  modelName,
  vlmName,
  currentRun,
  completedToast,
  onDismissToast,
  onGoBack,
  onSetVerdict,
}: {
  result: AnalysisResult;
  modelName: string;
  vlmName: string;
  currentRun: PastAnalysis | null;
  completedToast: boolean;
  onDismissToast: () => void;
  onGoBack: () => void;
  onSetVerdict: (verdict: AnalysisVerdict) => void;
}) {
  const [vlmOpen, setVlmOpen] = React.useState(true);
  const verdict = currentRun?.verdict ?? "pending";
  const verdictDecided = verdict !== "pending";
  const canApprove = result.status === "passed" || result.status === "warning";

  return (
    <div className="space-y-5">

      {/* Top bar */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Analysis Result</h2>
          <p className="text-base text-muted-foreground">{currentRun?.name ?? modelName}</p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onGoBack} className="gap-1.5">
            <ArrowLeft className="size-3.5" />
            Go Back
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="size-3.5" />
            Export PDF
          </Button>
          {verdictDecided ? (
            <VerdictBadge verdict={verdict} verdictAtDisplay={currentRun?.verdictAtDisplay} />
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSetVerdict("rejected")}
                className="gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10 hover:text-sev-critical"
              >
                <XCircle className="size-3.5" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => onSetVerdict("approved")}
                disabled={!canApprove}
                className="gap-1.5"
              >
                <CheckCircle2 className="size-3.5" />
                Approve for Deployment
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Completion toast */}
      {completedToast && (
        <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/[0.06] px-4 py-3">
          <CheckCircle2 className="size-5 flex-shrink-0 text-success" />
          <div className="flex-1">
            <p className="text-base font-semibold text-foreground">Analysis completed successfully</p>
            <p className="text-xs text-muted-foreground">
              Your footage has been fully processed and results are ready to review.
            </p>
          </div>
          <button
            onClick={onDismissToast}
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Metadata bar */}
      <RunMetadataBar
        modelName={modelName}
        vlmName={vlmName}
        completedAtDisplay={currentRun?.completedAtDisplay}
        runtimeDisplay={currentRun?.runtimeDisplay}
        startedBy={currentRun?.startedBy}
        runId={currentRun?.id}
      />

      {/* Score row */}
      <div className="grid grid-cols-3 gap-4">
        <ScoreHeroCard result={result} />
        <MiniScoreCard
          label="Steps Passed"
          value={`${result.stepsPassed}/${result.stepsTotal}`}
          tone="success"
          sub={`${Math.round((result.stepsPassed / Math.max(1, result.stepsTotal)) * 100)}% complete`}
        />
        <MiniScoreCard
          label="Rules Triggered"
          value={`${result.rulesTriggered}/${result.rulesTotal}`}
          tone="warning"
          sub={result.rulesTriggered === 0 ? "No violations" : `${result.rulesTriggered} violation${result.rulesTriggered === 1 ? "" : "s"}`}
        />
      </div>

      {/* Body grid */}
      <div className="grid grid-cols-2 gap-5">

        {/* Left col */}
        <div className="space-y-4">
          {/* Video */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(120% 80% at 50% 60%, rgba(180,140,80,0.18) 0%, rgba(60,40,20,0.1) 40%, rgba(0,0,0,0.95) 100%)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
                  <Play className="size-5 text-white" />
                </div>
              </div>
            </div>
            <div className="border-t border-border bg-card px-3 py-2.5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-mono text-xs">00:51</span>
                <div className="relative flex-1">
                  <div className="h-1 w-full rounded-full bg-muted">
                    <div className="h-full w-[15%] rounded-full bg-primary" />
                  </div>
                  <span className="absolute left-[15%] top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
                </div>
                <span className="font-mono text-xs">32:31</span>
              </div>
              <div className="mt-1.5 flex items-center justify-center gap-3 text-muted-foreground">
                <button className="hover:text-foreground"><SkipBack className="size-4" /></button>
                <button className="flex size-7 items-center justify-center rounded-full bg-foreground/90 text-background hover:bg-foreground">
                  <Play className="size-3.5" />
                </button>
                <button className="hover:text-foreground"><SkipForward className="size-4" /></button>
                <span className="ml-2 text-xs"><Volume2 className="size-3.5" /></span>
                <span className="ml-auto text-xs"><Maximize2 className="size-3.5" /></span>
              </div>
            </div>
          </div>

          {/* Step Results */}
          <div className="rounded-xl border border-border bg-card p-4">
            <SectionHeader
              label="Step Results"
              count={result.stepResults.length}
              description="outcome of each model step on the uploaded footage"
            />
            <div className="space-y-2">
              {result.stepResults.map((step, idx) => (
                <StepResultRow key={step.stepId} step={step} idx={idx} />
              ))}
            </div>
          </div>

          {/* Triggered Rules Summary */}
          <div className="rounded-xl border border-border bg-card p-4">
            <SectionHeader
              label="Triggered Rules Summary"
              count={result.triggeredRules.length}
              description="rules that fired with their detection confidence"
            />
            <div className="space-y-2">
              {result.triggeredRules.map((r) => (
                <TriggeredRuleRow key={r.id} rule={r} />
              ))}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-4">
          {/* Activity Log */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-base font-bold text-foreground">Activity Log</p>
                <p className="text-xs text-muted-foreground">
                  {result.activityLog.length} events
                </p>
              </div>
              <span className="font-mono text-3xs uppercase tracking-[0.18em] text-muted-foreground/55">
                {result.stepsTotal} Steps
              </span>
            </div>
            <div className="max-h-[460px] overflow-y-auto px-4 py-4">
              {result.activityLog.map((e, i) => (
                <LogRow key={e.id} entry={e} isLast={i === result.activityLog.length - 1} />
              ))}
            </div>
          </div>

          {/* Final Results */}
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <p className="text-base font-bold text-foreground">Final Results</p>
              <p className="text-xs text-muted-foreground">verdict per step / rule</p>
            </div>
            <div className="divide-y divide-border/40">
              {result.finalResults.map((e) => (
                <FinalResultRow key={e.id} entry={e} />
              ))}
            </div>
          </div>

          {/* VLM Reasoning */}
          <VLMReasoningPanel
            reasoning={result.vlmReasoning}
            clipSeconds={result.clipDurationSeconds}
            open={vlmOpen}
            onToggle={() => setVlmOpen((o) => !o)}
          />
        </div>
      </div>
    </div>
  );
}

/* ── VLM Reasoning panel (purple-themed AI section) ──────────────────────── */

function VLMReasoningPanel({
  reasoning,
  clipSeconds,
  open,
  onToggle,
}: {
  reasoning: string;
  clipSeconds: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-purple/30 bg-card">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-purple-soft"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-purple" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            VLM Reasoning
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded border border-purple/40 bg-purple-soft px-2 py-0.5 text-2xs font-bold uppercase tracking-wider text-purple">
            AI-Generated · {clipSeconds}s Clip
          </span>
          <ChevronUp
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              !open && "rotate-180"
            )}
          />
        </div>
      </button>
      {open && (
        <div className="border-t border-purple/20 px-4 py-3">
          <div className="rounded-lg border border-purple/20 bg-purple-soft p-4">
            <p className="text-base leading-relaxed text-muted-foreground">
              {reasoning}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── History tab ────────────────────────────────────────────────────────── */

type DatePreset = "today" | "yesterday" | "week" | "month" | "all" | "custom";
const DATE_PRESETS: { key: DatePreset; label: string; display: string }[] = [
  { key: "all",       label: "All time",  display: "all time" },
  { key: "today",     label: "Today",     display: "today" },
  { key: "yesterday", label: "Yesterday", display: "yesterday" },
  { key: "week",      label: "This Week", display: "this week" },
  { key: "month",     label: "This Month", display: "this month" },
];

/* ── Analysis History KPI configs ────────────────────────────────────────── */

type HistoryKpiFilter = "all" | "passed" | "failed" | "approved" | "rejected" | "pipeline-error";

const HISTORY_KPI_CONFIGS: {
  key: HistoryKpiFilter;
  label: string;
  sub: string;
  barClass: string;
  valueClass: string;
  activeClass: string;
  getValue: (items: PastAnalysis[]) => number;
}[] = [
  {
    key: "all",
    label: "Total Analyses",
    sub: "All recorded runs",
    barClass: "bg-muted-foreground/30",
    valueClass: "text-foreground",
    activeClass: "border-primary",
    getValue: (items) => items.length,
  },
  {
    key: "passed",
    label: "Passed",
    sub: "Model met the bar",
    barClass: "bg-success",
    valueClass: "text-success",
    activeClass: "border-success",
    getValue: (items) => items.filter((a) => a.status === "passed").length,
  },
  {
    key: "failed",
    label: "Failed",
    sub: "Model below threshold",
    barClass: "bg-sev-critical",
    valueClass: "text-sev-critical",
    activeClass: "border-sev-critical",
    getValue: (items) => items.filter((a) => a.status === "failed").length,
  },
  {
    key: "approved",
    label: "Approved",
    sub: "Cleared for deployment",
    barClass: "bg-info",
    valueClass: "text-info",
    activeClass: "border-info",
    getValue: (items) => items.filter((a) => a.verdict === "approved").length,
  },
  {
    key: "rejected",
    label: "Rejected",
    sub: "Needs improvement",
    barClass: "bg-purple",
    valueClass: "text-purple",
    activeClass: "border-purple",
    getValue: (items) => items.filter((a) => a.verdict === "rejected").length,
  },
  {
    key: "pipeline-error",
    label: "Script Errors",
    sub: "Run failed mid-flow",
    barClass: "bg-warning",
    valueClass: "text-warning",
    activeClass: "border-warning",
    getValue: (items) => items.filter((a) => a.runState === "failed").length,
  },
];

function HistoryKpiCard({
  config,
  items,
  active,
  onClick,
}: {
  config: (typeof HISTORY_KPI_CONFIGS)[number];
  items: PastAnalysis[];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/60",
        active ? config.activeClass : "border-border"
      )}
    >
      {active && (
        <span className="absolute right-2 top-2 rounded bg-primary/10 px-1.5 py-0.5 text-3xs font-bold uppercase tracking-widest text-primary">
          Active Filter
        </span>
      )}
      <div className={cn("absolute inset-x-0 top-0 h-0.5", config.barClass)} />
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {config.label}
      </div>
      <div className={cn("text-3xl font-bold leading-none", config.valueClass)}>
        {config.getValue(items)}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{config.sub}</div>
    </button>
  );
}

function HistoryTab({
  pastAnalyses,
  onView,
  onDelete,
  onBackToAnalysis,
  forcedState = "normal",
  onRetry,
}: {
  pastAnalyses: PastAnalysis[];
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onBackToAnalysis: () => void;
  forcedState?: RunForcedState;
  onRetry?: () => void;
}) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | RunStatus>("all");
  const [modelFilter, setModelFilter] = React.useState<string>("all");
  const [vlmFilter, setVlmFilter] = React.useState<string>("all");
  const [verdictFilter, setVerdictFilter] = React.useState<"all" | AnalysisVerdict>("all");
  const [datePreset, setDatePreset] = React.useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [kpiFilter, setKpiFilter] = React.useState<HistoryKpiFilter>("all");
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [sortAsc, setSortAsc] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
  const pageSize = 10;

  const allModelNames = React.useMemo(() => {
    const set = new Set<string>();
    pastAnalyses.forEach((a) => set.add(a.modelName));
    return Array.from(set);
  }, [pastAnalyses]);

  const allVlmNames = React.useMemo(() => {
    const set = new Set<string>();
    pastAnalyses.forEach((a) => set.add(a.vlmName));
    return Array.from(set);
  }, [pastAnalyses]);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = pastAnalyses.filter((a) => {
      if (
        q &&
        !a.id.toLowerCase().includes(q) &&
        !a.name.toLowerCase().includes(q) &&
        !a.modelName.toLowerCase().includes(q) &&
        !a.vlmName.toLowerCase().includes(q)
      )
        return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (modelFilter !== "all" && a.modelName !== modelFilter) return false;
      if (vlmFilter !== "all" && a.vlmName !== vlmFilter) return false;
      if (verdictFilter !== "all" && a.verdict !== verdictFilter) return false;
      if (kpiFilter === "passed"          && a.status !== "passed") return false;
      if (kpiFilter === "failed"          && a.status !== "failed") return false;
      if (kpiFilter === "approved"        && a.verdict !== "approved") return false;
      if (kpiFilter === "rejected"        && a.verdict !== "rejected") return false;
      if (kpiFilter === "pipeline-error"  && a.runState !== "failed") return false;
      // Date preset filtering — uses the mock 25 May 2026 reference for "today"
      if (datePreset !== "all") {
        const d = a.createdAt.slice(0, 10);
        if (datePreset === "today"     && d !== "2026-05-25") return false;
        if (datePreset === "yesterday" && d !== "2026-05-24") return false;
        if (datePreset === "week"      && (d < "2026-05-19" || d > "2026-05-25")) return false;
        if (datePreset === "month"     && (d < "2026-05-01" || d > "2026-05-31")) return false;
        if (datePreset === "custom"    && dateFrom && dateTo && (d < dateFrom || d > dateTo)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) =>
      sortAsc
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt)
    );
    return list;
  }, [pastAnalyses, search, statusFilter, modelFilter, vlmFilter, verdictFilter, datePreset, dateFrom, dateTo, kpiFilter, sortAsc]);

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (modelFilter !== "all" ? 1 : 0) +
    (vlmFilter !== "all" ? 1 : 0) +
    (verdictFilter !== "all" ? 1 : 0) +
    (search ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const deleteTarget = pastAnalyses.find((a) => a.id === pendingDeleteId);

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setModelFilter("all");
    setVlmFilter("all");
    setVerdictFilter("all");
  }

  function getScoreTone(score: number) {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-sev-critical";
  }

  const HistoryHeader = (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold text-foreground">Analysis History</h2>
        <p className="text-base text-muted-foreground">
          Browse, search, and review past analyses across all models.
        </p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onBackToAnalysis} className="gap-1.5 text-base">
          <ArrowLeft className="size-3.5" />
          Back to Run Analysis
        </Button>
      </div>
    </div>
  );

  if (forcedState === "loading") {
    return <div className="flex flex-col gap-4">{HistoryHeader}<HistorySkeletonRA /></div>;
  }
  if (forcedState === "error") {
    return <div className="flex flex-col gap-4">{HistoryHeader}<ContentError onRetry={onRetry} /></div>;
  }
  if (forcedState === "noresults") {
    return <div className="flex flex-col gap-4">{HistoryHeader}<HistoryNoResults onClear={clearFilters} /></div>;
  }

  return (
  <div className="flex flex-col gap-4">

    {/* Title row with right action */}
    {HistoryHeader}

    {/* KPI cards */}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {HISTORY_KPI_CONFIGS.map((cfg) => (
        <HistoryKpiCard
          key={cfg.key}
          config={cfg}
          items={pastAnalyses}
          active={kpiFilter === cfg.key}
          onClick={() => {
            setKpiFilter((cur) => (cur === cfg.key ? "all" : cfg.key));
            setPage(1);
          }}
        />
      ))}
    </div>

    {/* Date preset row — shared canonical design */}
    <DateRangeBar
      presets={DATE_PRESETS}
      active={datePreset}
      onSelect={(k) => { setDatePreset(k as DatePreset); if (k !== "custom") { setDateFrom(""); setDateTo(""); } }}
      customFrom={dateFrom}
      customTo={dateTo}
      onCustomChange={(f, t) => { setDateFrom(f); setDateTo(t); }}
      onCustomApply={(f, t) => { setDateFrom(f); setDateTo(t); }}
      onCustomReset={() => { setDatePreset("all"); setDateFrom(""); setDateTo(""); }}
      showingLabel={
        datePreset === "custom" && dateFrom && dateTo ? (
          <>
            Showing <strong className="text-foreground">{dateFrom}</strong>
            {" – "}
            <strong className="text-foreground">{dateTo}</strong>
          </>
        ) : (
          <>
            Showing{" "}
            <strong className="text-foreground">
              {DATE_PRESETS.find((p) => p.key === datePreset)?.label ?? "Custom range"}
            </strong>
          </>
        )
      }
    />

    {/* Collapsible filter panel (Detection Feed pattern) */}
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setFilterOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-base font-semibold text-foreground">Filters</span>
          {activeFilterCount > 0 ? (
            <span className="rounded-full bg-primary px-2 py-px text-xs font-semibold text-primary-foreground">
              {activeFilterCount} active
            </span>
          ) : (
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {["All statuses", "All verdicts", "All models", "All VLMs"].map((l) => (
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
          {activeFilterCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); clearFilters(); }}
              className="text-sm text-muted-foreground underline hover:text-primary"
            >
              Clear all
            </button>
          )}
          {filterOpen ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {filterOpen && (
        <div className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, analysis name, model, or VLM…"
              className="h-9 w-full pl-9 text-base"
            />
          </div>

          {/* 4 dropdowns */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Verdict
              </div>
              <Select
                value={verdictFilter}
                onValueChange={(v) => setVerdictFilter(v as typeof verdictFilter)}
              >
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="All verdicts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All verdicts</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Model
              </div>
              <Select value={modelFilter} onValueChange={(v) => setModelFilter(v)}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="All models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All models</SelectItem>
                  {allModelNames.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                VLM
              </div>
              <Select value={vlmFilter} onValueChange={(v) => setVlmFilter(v)}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="All VLMs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All VLMs</SelectItem>
                  {allVlmNames.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Count + sort */}
    <div className="flex items-center justify-between gap-3">
      <p className="text-base text-muted-foreground">
        <strong className="text-foreground">{filtered.length}</strong>{" "}
        {filtered.length === 1 ? "analysis" : "analyses"} match current filters
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-2 text-muted-foreground underline hover:text-primary"
          >
            Clear filters
          </button>
        )}
      </p>
      <div className="flex-shrink-0">
        <Select
          value={sortAsc ? "oldest" : "newest"}
          onValueChange={(v) => setSortAsc(v === "oldest")}
        >
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Newest first" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    {/* Table card */}
    <div className="overflow-hidden rounded-xl border border-border bg-card">

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr className="border-b border-border text-left">
              {["RULE ID", "ANALYSIS NAME", "STATUS", "SELECTED MODEL", "SCORE", "CREATED ON", "ACTION"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 font-mono text-2xs uppercase tracking-[0.15em] text-muted-foreground/60"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  No past analyses found.
                </td>
              </tr>
            ) : (
              pageItems.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => onView(a.id)}
                  className="group cursor-pointer text-base transition-colors hover:bg-muted/20"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-semibold text-muted-foreground transition-colors group-hover:text-primary">
                      {a.id}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className="font-semibold text-foreground transition-colors group-hover:text-primary">
                        {a.name}
                      </span>
                      <div className="flex flex-wrap items-center gap-1">
                        {a.runState === "failed" && (
                          <span className="inline-flex items-center gap-1 rounded border border-sev-critical/30 bg-sev-critical/10 px-1.5 py-px text-3xs font-bold uppercase tracking-wider text-sev-critical">
                            <AlertTriangle className="size-2.5" />
                            Script Error
                          </span>
                        )}
                        {a.verdict === "approved" && (
                          <span className="inline-flex items-center gap-1 rounded border border-success/30 bg-success/10 px-1.5 py-px text-3xs font-bold uppercase tracking-wider text-success">
                            <CheckCircle2 className="size-2.5" />
                            Approved
                          </span>
                        )}
                        {a.verdict === "rejected" && (
                          <span className="inline-flex items-center gap-1 rounded border border-sev-critical/30 bg-sev-critical/10 px-1.5 py-px text-3xs font-bold uppercase tracking-wider text-sev-critical">
                            <XCircle className="size-2.5" />
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    <div className="flex flex-col gap-0.5">
                      <span>{a.modelName}</span>
                      <span className="font-mono text-2xs text-muted-foreground">
                        VLM · {a.vlmName}
                      </span>
                    </div>
                  </td>
                  <td className={cn("px-4 py-3 font-semibold", getScoreTone(a.score))}>{a.score}%</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="size-3" />
                      {a.createdAtDisplay}
                    </div>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
                          <MoreVertical className="size-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-44 p-1" align="end">
                        <button
                          onClick={() => onView(a.id)}
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted"
                        >
                          <FileText className="size-3.5 text-muted-foreground" />
                          View details
                        </button>
                        <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted">
                          <Download className="size-3.5 text-muted-foreground" />
                          Export report
                        </button>
                        <div className="my-1 border-t border-border" />
                        <button
                          onClick={() => setPendingDeleteId(a.id)}
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-sev-critical hover:bg-sev-critical/10"
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </button>
                      </PopoverContent>
                    </Popover>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Entries per page <span className="ml-2 font-semibold text-foreground">10</span>
          <span className="ml-4">
            {filtered.length === 0
              ? "0 of 0 entries"
              : `${(page - 1) * pageSize + 1} – ${Math.min(page * pageSize, filtered.length)} of ${filtered.length} entries`}
          </span>
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40"
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <span className="px-2 text-sm text-foreground">
            {page} <span className="text-muted-foreground/60">of {pageCount}</span>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
            className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40"
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>

    {/* Delete confirmation modal */}
    <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setPendingDeleteId(null)}>
      <DialogContent className="w-[440px] max-w-[95vw] p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="flex items-center gap-2.5 text-base font-bold text-destructive">
            <Trash2 className="size-4" />
            Delete Analysis
          </DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">This action cannot be undone.</p>
        </DialogHeader>
        {deleteTarget && (
          <div className="px-5 py-4 text-base text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">{deleteTarget.id}</span>{" "}
            <span className="font-semibold text-foreground">— {deleteTarget.name}</span>? Any
            references to this run from validation history will be removed.
          </div>
        )}
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={() => setPendingDeleteId(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              if (deleteTarget) onDelete(deleteTarget.id);
              setPendingDeleteId(null);
            }}
          >
            <Trash2 className="size-3.5" />
            Delete Analysis
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
  );
}

/* ─── History detail drawer ──────────────────────────────────────────────── */

function HistoryDetailDrawer({
  analysis,
  onClose,
}: {
  analysis: PastAnalysis;
  onClose: () => void;
}) {
  const [tab, setTab] = React.useState<"result" | "logs">("result");
  const [vlmOpen, setVlmOpen] = React.useState(true);
  const { result } = analysis;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-[560px] max-w-[92vw] flex-col overflow-hidden border-l border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="text-md font-bold text-foreground">{analysis.name}</p>
            <p className="text-xs text-muted-foreground">
              {analysis.modelName} · {analysis.createdAtDisplay}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5">
              <Download className="size-3.5" />
              Export Result
            </Button>
            <button
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-shrink-0 items-center border-b border-border px-5">
          {(["result", "logs"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "mr-6 border-b-2 py-3 text-base font-semibold transition-colors",
                tab === t
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "result" ? "Analysis Result" : "Logs"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "result" ? (
            <div className="space-y-4">
              {/* Verdict badge / Pipeline error chip */}
              {analysis.runState === "failed" && analysis.failure && (
                <div className="flex items-start gap-3 rounded-xl border border-sev-critical/30 bg-sev-critical/[0.05] px-4 py-3">
                  <XCircle className="size-5 flex-shrink-0 text-sev-critical" />
                  <div className="flex-1">
                    <div className="mb-0.5 flex items-center justify-between">
                      <p className="text-base font-semibold text-sev-critical">Pipeline failure</p>
                      <span className="rounded border border-sev-critical/30 bg-sev-critical/10 px-1.5 py-px font-mono text-2xs font-bold uppercase tracking-wider text-sev-critical">
                        {analysis.failure.code}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{analysis.failure.reason}</p>
                    {analysis.failure.detail && (
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {analysis.failure.detail}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {analysis.verdict !== "pending" && (
                <VerdictBadge verdict={analysis.verdict} verdictAtDisplay={analysis.verdictAtDisplay} />
              )}

              {/* Metadata bar */}
              <RunMetadataBar
                runId={analysis.id}
                modelName={analysis.modelName}
                vlmName={analysis.vlmName}
                startedBy={analysis.startedBy}
                completedAtDisplay={analysis.completedAtDisplay}
                runtimeDisplay={analysis.runtimeDisplay}
              />

              {/* Score row */}
              <div className="grid grid-cols-3 gap-2">
                <ScoreHeroCard result={result} compact />
                <MiniScoreCard
                  label="Steps Passed"
                  value={`${result.stepsPassed}/${result.stepsTotal}`}
                  tone="success"
                  compact
                  sub={`${Math.round((result.stepsPassed / Math.max(1, result.stepsTotal)) * 100)}% complete`}
                />
                <MiniScoreCard
                  label="Rules Triggered"
                  value={`${result.rulesTriggered}/${result.rulesTotal}`}
                  tone="warning"
                  compact
                  sub={result.rulesTriggered === 0 ? "No violations" : `${result.rulesTriggered} violation${result.rulesTriggered === 1 ? "" : "s"}`}
                />
              </div>

              {/* Video */}
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(120% 80% at 50% 60%, rgba(180,140,80,0.18) 0%, rgba(60,40,20,0.1) 40%, rgba(0,0,0,0.95) 100%)",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex size-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
                      <Play className="size-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="border-t border-border bg-card px-3 py-2.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-mono text-xs">00:51</span>
                    <div className="relative flex-1">
                      <div className="h-1 w-full rounded-full bg-muted">
                        <div className="h-full w-[15%] rounded-full bg-primary" />
                      </div>
                    </div>
                    <span className="font-mono text-xs">32:31</span>
                  </div>
                </div>
              </div>

              {/* Step Results */}
              <div className="rounded-xl border border-border bg-card p-4">
                <SectionHeader
                  label="Step Results"
                  count={result.stepResults.length}
                  description="outcome of each model step on the uploaded footage"
                />
                <div className="space-y-2">
                  {result.stepResults.map((step, idx) => (
                    <StepResultRow key={step.stepId} step={step} idx={idx} />
                  ))}
                </div>
              </div>

              {/* Triggered Rules Summary */}
              <div className="rounded-xl border border-border bg-card p-4">
                <SectionHeader
                  label="Triggered Rules Summary"
                  count={result.triggeredRules.length}
                  description="rules that fired with their detection confidence"
                />
                <div className="space-y-2">
                  {result.triggeredRules.map((r) => (
                    <TriggeredRuleRow key={r.id} rule={r} />
                  ))}
                </div>
              </div>

              {/* VLM Reasoning */}
              <VLMReasoningPanel
                reasoning={result.vlmReasoning}
                clipSeconds={result.clipDurationSeconds}
                open={vlmOpen}
                onToggle={() => setVlmOpen((o) => !o)}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-base font-bold text-foreground">Analysis Logs</p>
                  <p className="text-xs text-muted-foreground">{result.activityLog.length} events</p>
                </div>
                <div className="px-4 py-4">
                  {result.activityLog.map((e, i) => (
                    <LogRow key={e.id} entry={e} isLast={i === result.activityLog.length - 1} />
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-base font-bold text-foreground">Final Results</p>
                </div>
                <div className="divide-y divide-border/40">
                  {result.finalResults.map((e) => (
                    <FinalResultRow key={e.id} entry={e} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
