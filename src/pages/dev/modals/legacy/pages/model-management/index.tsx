/**
 * Frozen copy of src/pages/model-management/index.tsx as last committed, before the 2026 modal redesign —
 * only the modals the Modal Gallery's "Old" side shows, and what they need.
 * Generated; do not edit. The live components are in src/pages/model-management/index.tsx.
 */
import * as React from "react";
import { Plus, Search, X, Trash2, UploadCloud, BookOpen, Layers, Check, LoaderCircle, FileCheck2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/shared/Modal";
import { TruncatedText } from "@/components/shared/TruncatedText";
import { cn } from "@/lib/utils";
import type { ModelStep } from "@/types/modelManagement";
import type { RuleData, RuleSeverity } from "@/types/rules";

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

/* ── Create model modal ──────────────────────────────────────────────────── */

/* Reusable upload dropzone — filename entry stands in for a real file picker. */
function UploadDropzone({
  value,
  onChange,
  primary,
  hint,
  placeholder,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  primary: React.ReactNode;
  hint: string;
  placeholder: string;
  invalid?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const accept = `.${placeholder.split(".").pop()}`;

  function pick() {
    inputRef.current?.click();
  }
  function handleFiles(files: FileList | null) {
    const f = files?.[0];
    if (f) onChange(f.name);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={pick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pick();
        }
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border-2 border-dashed bg-background px-4 py-5 text-center transition-colors hover:border-primary/40",
        invalid ? "border-sev-critical" : "border-border"
      )}
    >
      <UploadCloud className="size-7 text-muted-foreground" />
      {value ? (
        <div className="flex max-w-full items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1">
          <span className="truncate font-mono text-sm text-foreground">{value}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            aria-label="Remove file"
            className="flex size-4 flex-shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:text-sev-critical"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground">{primary}</p>
      )}
      <p className="text-center text-xs text-muted-foreground/80">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

const MODEL_FILE_EXTS = ".onnx";

export function CreateModelModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (name: string, description: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [errors, setErrors] = React.useState<{ name?: string; desc?: string }>({});

  function submit() {
    const next: { name?: string; desc?: string } = {};
    if (!name.trim()) next.name = "Model name is required.";
    if (!desc.trim()) next.desc = "Model description is required.";
    setErrors(next);
    if (Object.keys(next).length === 0) onConfirm(name.trim(), desc.trim());
  }

  return (
    <Modal open onOpenChange={(v) => !v && onCancel()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Create Model"
          description="Set basic information — add verification steps and upload model files next."
        />

        <ModalBody className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Model Information
          </p>
          <div>
            <label className="mb-1.5 block text-base font-semibold text-foreground">
              Model Name
            </label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
              }}
              placeholder="Enter model name"
              className="h-10 text-base"
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="mt-1 text-xs text-sev-critical">{errors.name}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-base font-semibold text-foreground">
              Model Description
            </label>
            <Textarea
              value={desc}
              onChange={(e) => {
                setDesc(e.target.value);
                if (errors.desc) setErrors((p) => ({ ...p, desc: undefined }));
              }}
              placeholder="Describe what the model is capable of…"
              rows={3}
              className="w-full resize-none"
              aria-invalid={!!errors.desc}
            />
            {errors.desc && <p className="mt-1 text-xs text-sev-critical">{errors.desc}</p>}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit}>
            Confirm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Add step modal ──────────────────────────────────────────────────────── */

/** How long the simulated model/manifest upload runs before the step commits. */
const UPLOAD_MS = 5000;

/** Frames per inference batch when the user doesn't set one. */
const DEFAULT_BATCH_SIZE = 8;

const BATCH_SIZE_MIN = 1;

const BATCH_SIZE_MAX = 64;

export function AddStepModal({
  initial,
  onConfirm,
  onCancel,
}: {
  initial?: Omit<ModelStep, "id" | "order">;
  onConfirm: (step: Omit<ModelStep, "id" | "order">) => void;
  onCancel: () => void;
}) {
  const isEdit = !!initial;
  const [actionLabel, setActionLabel] = React.useState(initial?.actionLabel ?? "");
  const [label, setLabel] = React.useState(initial?.label ?? "Model_12");
  const [modelFile, setModelFile] = React.useState(initial?.modelFile ?? "");
  const [manifestFile, setManifestFile] = React.useState(initial?.manifestFile ?? "");
  const [batchSize, setBatchSize] = React.useState(String(initial?.batchSize ?? DEFAULT_BATCH_SIZE));
  const [errors, setErrors] = React.useState<{
    actionLabel?: string;
    label?: string;
    modelFile?: string;
    manifestFile?: string;
    batchSize?: string;
  }>({});

  /* Simulated upload — the prototype has no backend, so Confirm holds the modal
     in an uploading state for UPLOAD_MS before the step is committed. */
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  // The parent passes `onConfirm` as an inline arrow, and the progress tick
  // re-renders every 80ms — depending on it directly would restart the timer on
  // every tick and the upload would never finish. Read it from a ref instead.
  const commitRef = React.useRef<() => void>(() => {});
  React.useEffect(() => {
    commitRef.current = () =>
      onConfirm({
        label,
        actionLabel,
        modelFile: modelFile.trim(),
        manifestFile: manifestFile.trim(),
        batchSize: Number(batchSize),
      });
  });

  React.useEffect(() => {
    if (!uploading) return;
    const started = Date.now();
    const tick = window.setInterval(() => {
      setProgress(Math.min(100, ((Date.now() - started) / UPLOAD_MS) * 100));
    }, 80);
    const done = window.setTimeout(() => commitRef.current(), UPLOAD_MS);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(done);
    };
  }, [uploading]);

  function submit() {
    const next: {
      actionLabel?: string;
      label?: string;
      modelFile?: string;
      manifestFile?: string;
      batchSize?: string;
    } = {};
    if (!actionLabel.trim()) next.actionLabel = "Action label is required.";
    if (!label.trim()) next.label = "Model title is required.";
    if (!modelFile.trim()) next.modelFile = "Upload a model file.";
    if (!manifestFile.trim()) next.manifestFile = "Upload a manifest file.";
    const batch = Number(batchSize);
    if (!batchSize.trim() || !Number.isInteger(batch) || batch < BATCH_SIZE_MIN || batch > BATCH_SIZE_MAX) {
      next.batchSize = `Enter a whole number between ${BATCH_SIZE_MIN} and ${BATCH_SIZE_MAX}.`;
    }
    setErrors(next);
    if (Object.keys(next).length === 0) setUploading(true);
  }

  const pct = Math.round(progress);

  return (
    <Modal open onOpenChange={(v) => !v && !uploading && onCancel()}>
      <ModalContent
        size="lg"
        // Don't let Esc / outside-click abandon an upload mid-flight.
        onEscapeKeyDown={(e) => uploading && e.preventDefault()}
        onInteractOutside={(e) => uploading && e.preventDefault()}
      >
        <ModalHeader
          title={uploading ? "Uploading model" : isEdit ? "Edit Step" : "Add New Step"}
          description={
            uploading
              ? "Validating the model bundle and manifest. This can take a moment."
              : "Define what the AI should verify at this step, then upload its model and manifest."
          }
        />

        {uploading ? (
          <ModalBody className="space-y-4" data-upload-progress={pct}>
            <div className="flex items-center gap-2.5">
              <LoaderCircle className="size-4 flex-shrink-0 animate-spin text-primary" />
              <span className="text-base font-semibold text-foreground">{label}</span>
              <span className="ml-auto font-mono text-sm tabular-nums text-muted-foreground">
                {pct}%
              </span>
            </div>

            <Progress value={progress} />

            <ul className="space-y-1.5">
              {[modelFile.trim(), manifestFile.trim()].map((f, i) => {
                // Manifest is small, so mark it done first; the model bundle trails.
                // Compared against the *displayed* percent so a row never reads
                // "Uploading…" while the header already shows 100%.
                const doneAt = i === 0 ? 100 : 55;
                const done = pct >= doneAt;
                return (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    {done ? (
                      <FileCheck2 className="size-3.5 flex-shrink-0 text-success" />
                    ) : (
                      <LoaderCircle className="size-3.5 flex-shrink-0 animate-spin text-muted-foreground" />
                    )}
                    <span className="min-w-0 truncate font-mono text-muted-foreground">{f}</span>
                    <span className={cn("ml-auto flex-shrink-0 text-2xs", done ? "text-success" : "text-muted-foreground")}>
                      {done ? "Verified" : "Uploading…"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </ModalBody>
        ) : (
        <ModalBody className="space-y-4">
          <div>
            <label className="mb-1.5 block text-base font-semibold text-foreground">
              Action Label
            </label>
            <Input
              value={actionLabel}
              onChange={(e) => {
                setActionLabel(e.target.value);
                if (errors.actionLabel) setErrors((p) => ({ ...p, actionLabel: undefined }));
              }}
              placeholder="e.g. Verify worker is wearing approved helmet"
              className="h-10 text-base"
              aria-invalid={!!errors.actionLabel}
            />
            {errors.actionLabel && (
              <p className="mt-1 text-xs text-sev-critical">{errors.actionLabel}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-base font-semibold text-foreground">
              Model Title
            </label>
            <Input
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (errors.label) setErrors((p) => ({ ...p, label: undefined }));
              }}
              placeholder="e.g. Helmet Detection v2.1"
              className="h-10 text-base"
              aria-invalid={!!errors.label}
            />
            {errors.label && <p className="mt-1 text-xs text-sev-critical">{errors.label}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-base font-semibold text-foreground">
              Model File
            </label>
            <UploadDropzone
              value={modelFile}
              onChange={(v) => {
                setModelFile(v);
                if (errors.modelFile) setErrors((p) => ({ ...p, modelFile: undefined }));
              }}
              primary={<>Upload your <span className="font-semibold text-foreground">CV model file</span> or drag and drop</>}
              placeholder="model.onnx"
              hint={`Accepted: ${MODEL_FILE_EXTS}. Max file size 1 GB.`}
              invalid={!!errors.modelFile}
            />
            {errors.modelFile && (
              <p className="mt-1 text-xs text-sev-critical">{errors.modelFile}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-base font-semibold text-foreground">
              Manifest File
            </label>
            <UploadDropzone
              value={manifestFile}
              onChange={(v) => {
                setManifestFile(v);
                if (errors.manifestFile) setErrors((p) => ({ ...p, manifestFile: undefined }));
              }}
              primary={<>Upload the <span className="font-semibold text-foreground">.json</span> manifest or drag and drop</>}
              placeholder="model.manifest.json"
              hint="Accepted: .json. Max file size 10 MB."
              invalid={!!errors.manifestFile}
            />
            {errors.manifestFile && (
              <p className="mt-1 text-xs text-sev-critical">{errors.manifestFile}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-base font-semibold text-foreground">
              Batch Size
            </label>
            <Input
              type="number"
              inputMode="numeric"
              min={BATCH_SIZE_MIN}
              max={BATCH_SIZE_MAX}
              value={batchSize}
              onChange={(e) => {
                setBatchSize(e.target.value);
                if (errors.batchSize) setErrors((p) => ({ ...p, batchSize: undefined }));
              }}
              placeholder={String(DEFAULT_BATCH_SIZE)}
              className="h-10 text-base"
              aria-invalid={!!errors.batchSize}
            />
            {errors.batchSize ? (
              <p className="mt-1 text-xs text-sev-critical">{errors.batchSize}</p>
            ) : (
              <p className="mt-1 text-2xs text-muted-foreground">
                Frames processed per inference pass ({BATCH_SIZE_MIN}–{BATCH_SIZE_MAX}). Higher uses
                more GPU memory.
              </p>
            )}
          </div>
        </ModalBody>
        )}

        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={uploading}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit} disabled={uploading} className="gap-1.5">
            {uploading && <LoaderCircle className="size-3.5 animate-spin" />}
            {uploading ? "Uploading…" : "Confirm"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Delete model modal ──────────────────────────────────────────────────── */

export function DeleteModelModal({
  name,
  onConfirm,
  onCancel,
}: {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open onOpenChange={(v) => !v && onCancel()}>
      <ModalContent size="sm">
        <ModalHeader
          title="Delete Model"
          description="This action cannot be undone."
          icon={Trash2}
          tone="destructive"
        />
        <ModalBody className="text-base text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">{name}</span>? Any deployments that
          reference this model will need to be updated.
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} className="gap-1.5">
            <Trash2 className="size-3.5" />
            Delete Model
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/**
 * How many object classes a detection rule watches. Hidden at zero — rules
 * authored before the form became class-based record none.
 */
function ClassCountChip({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-px text-2xs font-semibold text-muted-foreground">
      <Layers className="size-2.5" />
      {count} class{count === 1 ? "" : "es"}
    </span>
  );
}

/* ── Add rule from library modal ─────────────────────────────────────────── */

export function AddRuleModal({
  rules,
  onCancel,
  onAdd,
}: {
  rules: RuleData[];
  onCancel: () => void;
  onAdd: (ruleIds: string[]) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [picked, setPicked] = React.useState<string[]>([]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rules;
    return rules.filter((r) =>
      [r.name, r.description, ...r.tags].join(" ").toLowerCase().includes(q)
    );
  }, [rules, search]);

  function toggle(id: string) {
    setPicked((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]));
  }

  return (
    <Modal open onOpenChange={(v) => !v && onCancel()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Add Rules"
          description="Pick rules from the library to attach to this model."
          icon={BookOpen}
        />
        <ModalBody className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rules by name, description or tag…"
              className="h-9 pl-8 text-base"
            />
          </div>

          {rules.length === 0 ? (
            <div className="flex h-[280px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted-foreground">
              <BookOpen className="size-7 opacity-20" />
              <p className="text-sm">Every library rule is already attached.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-[280px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-muted-foreground">
              <Search className="size-7 opacity-20" />
              <p className="text-sm">No rules match your search.</p>
            </div>
          ) : (
            <div className="h-[280px] space-y-2 overflow-y-auto pr-1">
              {filtered.map((rule) => {
                const checked = picked.includes(rule.id);
                return (
                  <button
                    key={rule.id}
                    type="button"
                    onClick={() => toggle(rule.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors duration-[var(--duration-fast)] ease-standard",
                      checked ? "border-primary bg-primary/[0.06]" : "border-border bg-background hover:border-primary/30"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                        checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                      )}
                    >
                      {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground">{rule.name}</span>
                        <SeverityBadge severity={rule.severity} />
                        <ClassCountChip count={rule.config?.objectClasses.length ?? 0} />
                      </div>
                      <TruncatedText
                        text={rule.description}
                        className="line-clamp-2 text-xs leading-relaxed text-muted-foreground"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" disabled={picked.length === 0} onClick={() => onAdd(picked)} className="gap-1.5">
            <Plus className="size-3.5" />
            Add {picked.length > 0 ? picked.length : ""} Rule{picked.length === 1 ? "" : "s"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
