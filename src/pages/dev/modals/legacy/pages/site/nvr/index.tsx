/**
 * Frozen copy of src/pages/site/nvr/index.tsx as last committed, before the 2026 modal redesign —
 * only the modals the Modal Gallery's "Old" side shows, and what they need.
 * Generated; do not edit. The live components are in src/pages/site/nvr/index.tsx.
 */
import * as React from "react";
import { Search, ChevronDown, Check, X, Plus, AlertTriangle, Trash2, Video, Link2, Unlink, Download, Sparkles, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Modal, ModalContent, ModalHeader, ModalSubheader, ModalBody, ModalFooter } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { MOCK_CAMERAS, CAMERA_SITES, CAMERA_AREAS } from "@/mocks/cameras";
import { useCamerasStore } from "@/stores/useCamerasStore";
import { MOCK_RECORDINGS } from "@/mocks/recordings";
import { storageBandFor } from "@/types/nvr";
import type { NvrData, NvrStatus, StorageBand, NvrChannel } from "@/types/nvr";
import { TruncatedText } from "@/components/shared/TruncatedText";

/* ── Status pill ─────────────────────────────────────────────────────────── */

const STATUS_STYLES: Record<NvrStatus, { bg: string; text: string; dot: string; label: string }> = {
  online:   { bg: "bg-success/15 border-success/30",   text: "text-success",          dot: "bg-success",          label: "Online" },
  offline:  { bg: "bg-muted border-border",            text: "text-muted-foreground", dot: "bg-muted-foreground", label: "Offline" },
  degraded: { bg: "bg-warning/15 border-warning/30",   text: "text-warning",          dot: "bg-warning",          label: "Degraded" },
};

function StatusPill({ status }: { status: NvrStatus }) {
  const s = STATUS_STYLES[status];
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

/* ── Storage bar ─────────────────────────────────────────────────────────── */

const BAND_STYLES: Record<StorageBand, { bar: string; text: string; label: string }> = {
  healthy:  { bar: "bg-success",      text: "text-success",      label: "Healthy" },
  warning:  { bar: "bg-warning",      text: "text-warning",      label: "Warning" },
  critical: { bar: "bg-sev-critical", text: "text-sev-critical", label: "Critical" },
};

/* ── Channel storage helpers ─────────────────────────────────────────────── */

/** Returns total recorded GB for a (nvr, channel) pair. */
function channelStorageGb(nvrId: string, channel: NvrChannel): number {
  if (!channel.cameraId) return 0;
  const recs = MOCK_RECORDINGS.filter((r) => r.nvrId === nvrId && r.cameraId === channel.cameraId);
  const totalMb = recs.reduce((acc, r) => acc + r.fileSizeMb, 0);
  return Math.round((totalMb / 1024) * 100) / 100;
}

function channelRecordingCount(nvrId: string, channel: NvrChannel): number {
  if (!channel.cameraId) return 0;
  return MOCK_RECORDINGS.filter((r) => r.nvrId === nvrId && r.cameraId === channel.cameraId).length;
}

/** Decorate a channel with the linked camera's area + status. */
interface ChannelRow extends NvrChannel {
  cameraStatus?: "live" | "offline";
  cameraArea?: string;
  cameraSite?: string;
  storageGb: number;
  recordings: number;
  linkedAtDisplay?: string;
}

function buildChannelRows(nvr: NvrData): ChannelRow[] {
  return nvr.channels.map((ch) => {
    const cam = ch.cameraId ? MOCK_CAMERAS.find((c) => c.id === ch.cameraId) : null;
    return {
      ...ch,
      cameraStatus: cam
        ? (cam.status === "online" ? "live" : "offline")
        : ch.nvrManaged
        ? (ch.nvrRecording ? "live" : "offline")
        : undefined,
      cameraArea: cam?.areaName,
      cameraSite: cam?.siteName,
      storageGb: channelStorageGb(nvr.id, ch),
      recordings: channelRecordingCount(nvr.id, ch),
      // For the mock, treat the camera's activeAt as the linked-on date
      linkedAtDisplay: cam?.activeAtDisplay,
    };
  });
}

/* ── Export Recordings modal ─────────────────────────────────────────────── */

type ExportRange = "today" | "yesterday" | "week" | "month" | "all";

type ExportFormat = "zip" | "mp4-pack" | "manifest-only";

const EXPORT_RANGES: { value: ExportRange; label: string }[] = [
  { value: "today",     label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week",      label: "This Week" },
  { value: "month",     label: "This Month" },
  { value: "all",       label: "All Time" },
];

const EXPORT_FORMATS: { value: ExportFormat; label: string; desc: string }[] = [
  { value: "zip",            label: "ZIP archive",       desc: "All recordings packed in a single .zip" },
  { value: "mp4-pack",       label: "MP4 pack",          desc: "Individual .mp4 files in a folder" },
  { value: "manifest-only",  label: "Manifest only",     desc: "JSON listing — no media payload" },
];

export function ExportRecordingsModal({
  open, nvr, onClose, onConfirm,
}: {
  open: boolean;
  nvr: NvrData | null;
  onClose: () => void;
  onConfirm: (payload: { channels: number[]; range: ExportRange; format: ExportFormat; totalGb: number; recordingCount: number }) => void;
}) {
  const [channels, setChannels] = React.useState<number[]>([]);
  const [range, setRange] = React.useState<ExportRange>("all");
  const [format, setFormat] = React.useState<ExportFormat>("zip");

  React.useEffect(() => {
    if (open && nvr) {
      // Pre-select all linked channels
      setChannels(nvr.channels.filter((c) => c.cameraId).map((c) => c.channel));
      setRange("all");
      setFormat("zip");
    }
  }, [open, nvr?.id]);

  if (!nvr) return null;

  const rows = buildChannelRows(nvr).filter((c) => c.cameraId);
  const allSelected = rows.length > 0 && rows.every((r) => channels.includes(r.channel));
  const someSelected = !allSelected && rows.some((r) => channels.includes(r.channel));

  const selectedRows = rows.filter((r) => channels.includes(r.channel));
  const totalGb = selectedRows.reduce((acc, r) => acc + r.storageGb, 0);
  const recordingCount = selectedRows.reduce((acc, r) => acc + r.recordings, 0);

  function toggleAll() {
    setChannels(allSelected ? [] : rows.map((r) => r.channel));
  }
  function toggleChannel(ch: number) {
    setChannels((curr) => curr.includes(ch) ? curr.filter((c) => c !== ch) : [...curr, ch]);
  }

  const canSubmit = channels.length > 0;

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Export Recordings"
          description={<>Download recordings from selected channels on <strong className="text-foreground">{nvr.name}</strong>.</>}
        />
        <ModalBody className="space-y-4">
          {/* Channels */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Channels to Export
              </p>
              <button onClick={toggleAll} className="text-xs text-primary hover:underline">
                {allSelected ? "Unselect all" : "Select all"}
              </button>
            </div>
            {rows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                No channels with recordings.
              </div>
            ) : (
              <div className="max-h-[200px] space-y-1.5 overflow-y-auto pr-1">
                {rows.map((ch) => {
                  const checked = channels.includes(ch.channel);
                  return (
                    <button
                      key={ch.channel}
                      onClick={() => toggleChannel(ch.channel)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-left transition-colors",
                        checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      )}
                    >
                      <div className={cn(
                        "flex size-4 flex-shrink-0 items-center justify-center rounded border",
                        checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                      )}>
                        {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <TruncatedText
                          title={`${ch.cameraName} (Channel ${ch.channel})`}
                          className="text-base font-semibold text-foreground"
                        >
                          {ch.cameraName} <span className="font-mono text-xs text-muted-foreground">(Channel {ch.channel})</span>
                        </TruncatedText>
                        <p className="text-xs text-muted-foreground">
                          {ch.cameraSite} · {ch.cameraArea}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-semibold text-foreground">{ch.storageGb.toFixed(2)} GB</p>
                        <p className="text-2xs text-muted-foreground">{ch.recordings} files</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {someSelected && (
              <p className="mt-1 text-xs text-muted-foreground">
                {channels.length} of {rows.length} channels selected
              </p>
            )}
          </div>

          {/* Date range */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Date Range
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {EXPORT_RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-sm font-semibold transition-colors",
                    range === r.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Export Format
            </p>
            <div className="space-y-2">
              {EXPORT_FORMATS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border bg-background p-3 text-left transition-colors",
                    format === f.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                >
                  <div className={cn(
                    "mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded-full border",
                    format === f.value ? "border-primary" : "border-muted-foreground/40"
                  )}>
                    {format === f.value && <span className="size-2 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-foreground">{f.label}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{f.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          {canSubmit && (
            <div className="rounded-lg border border-info/30 bg-info/[0.06] px-3.5 py-2.5">
              <p className="text-sm text-muted-foreground">
                Exporting <strong className="text-foreground">{recordingCount}</strong> recordings
                ({totalGb.toFixed(2)} GB) from <strong className="text-foreground">{channels.length}</strong> channel{channels.length === 1 ? "" : "s"} —
                <strong className="text-foreground"> {EXPORT_RANGES.find((r) => r.value === range)?.label}</strong> ·
                <strong className="text-foreground"> {EXPORT_FORMATS.find((f) => f.value === format)?.label}</strong>
              </p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            disabled={!canSubmit}
            onClick={() => onConfirm({ channels, range, format, totalGb, recordingCount })}
            className="gap-1.5"
          >
            <Download className="size-3.5" />
            Export {totalGb > 0 ? `(${totalGb.toFixed(2)} GB)` : ""}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Clean Up Storage modal ──────────────────────────────────────────────── */

type CleanupMethod = "age" | "channel";

export function CleanupStorageModal({
  open, nvr, onClose, onConfirm,
}: {
  open: boolean;
  nvr: NvrData | null;
  onClose: () => void;
  onConfirm: (method: CleanupMethod, payload: { ageDays?: number; channels?: number[] }) => void;
}) {
  const [method, setMethod] = React.useState<CleanupMethod>("age");
  const [ageDays, setAgeDays] = React.useState(30);
  const [picked, setPicked] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (open) { setMethod("age"); setAgeDays(30); setPicked([]); }
  }, [open, nvr?.id]);

  if (!nvr) return null;

  const usedPct = Math.min(100, Math.round((nvr.usedStorageGb / nvr.totalStorageGb) * 100));
  const linkedChannels = buildChannelRows(nvr).filter((c) => c.cameraId);
  const canSubmit = method === "age" ? ageDays > 0 : picked.length > 0;

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Clean up Storage"
          description="Free space by removing recordings that fall outside the retention window."
        />

        <ModalBody className="space-y-4">
          {/* Current capacity */}
          <div className="rounded-lg border border-border bg-background p-3.5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Storage Capacity
            </p>
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="font-mono text-sm text-muted-foreground">
                <strong className="text-foreground">{nvr.usedStorageGb.toLocaleString()} GB</strong> of {nvr.totalStorageGb.toLocaleString()} GB used
              </span>
              <span className={cn("text-sm font-semibold", BAND_STYLES[storageBandFor(nvr.usedStorageGb, nvr.totalStorageGb)].text)}>
                {usedPct}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full", BAND_STYLES[storageBandFor(nvr.usedStorageGb, nvr.totalStorageGb)].bar)}
                style={{ width: `${usedPct}%` }}
              />
            </div>
          </div>

          {/* Method picker */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Clean up Method
            </p>
            <div className="space-y-2">
              {[
                { value: "age" as const,     title: "Age Based Clean up",     desc: "Remove recordings older than a specific number of days" },
                { value: "channel" as const, title: "Channel Based Clean up", desc: "Remove recordings from specific channels" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMethod(opt.value)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border bg-background p-3 text-left transition-colors",
                    method === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                >
                  <div className={cn(
                    "mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded-full border",
                    method === opt.value ? "border-primary" : "border-muted-foreground/40"
                  )}>
                    {method === opt.value && <span className="size-2 rounded-full bg-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-foreground">{opt.title}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {method === "age" && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Remove recordings older than
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {[7, 14, 30, 60, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setAgeDays(d)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors",
                      ageDays === d
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>
          )}

          {method === "channel" && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Select Channel*
              </p>
              {linkedChannels.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  No channels with recordings.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {linkedChannels.map((ch) => {
                    const checked = picked.includes(ch.channel);
                    return (
                      <button
                        key={ch.channel}
                        onClick={() =>
                          setPicked((curr) => curr.includes(ch.channel) ? curr.filter((c) => c !== ch.channel) : [...curr, ch.channel])
                        }
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-left transition-colors",
                          checked ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        )}
                      >
                        <div className={cn(
                          "flex size-4 flex-shrink-0 items-center justify-center rounded border",
                          checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                        )}>
                          {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <TruncatedText
                            title={`${ch.cameraName} (Channel ${ch.channel})`}
                            className="text-base font-semibold text-foreground"
                          >
                            {ch.cameraName} <span className="font-mono text-xs text-muted-foreground">(Channel {ch.channel})</span>
                          </TruncatedText>
                          <p className="text-xs text-muted-foreground">{ch.cameraSite} · {ch.cameraArea}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-semibold text-foreground">{ch.storageGb.toFixed(2)} GB</p>
                          <p className="text-2xs text-muted-foreground">{ch.recordings} Recordings</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            disabled={!canSubmit}
            onClick={() => onConfirm(method, method === "age" ? { ageDays } : { channels: picked })}
            className="gap-1.5"
          >
            <Sparkles className="size-3.5" />
            Confirm
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Clean Up Running (progress) modal ───────────────────────────────────── */

export function CleanupRunningModal({
  open, methodLabel, totalToProcess, onCancel,
}: {
  open: boolean;
  methodLabel: string;
  totalToProcess: number;
  onCancel: () => void;
}) {
  const [progress, setProgress] = React.useState(0);
  const [processed, setProcessed] = React.useState(0);

  React.useEffect(() => {
    if (!open) { setProgress(0); setProcessed(0); return; }
    let pct = 0;
    const interval = setInterval(() => {
      pct += 7 + Math.random() * 8;
      if (pct >= 100) pct = 100;
      setProgress(Math.round(pct));
      setProcessed(Math.floor((pct / 100) * totalToProcess));
      if (pct >= 100) clearInterval(interval);
    }, 220);
    return () => clearInterval(interval);
  }, [open, totalToProcess]);

  return (
    <Modal open={open} onOpenChange={() => { /* not dismissible by overlay */ }}>
      <ModalContent size="lg">
        <ModalHeader
          title="Cleaning Up Storage…"
          description={<>{methodLabel} · {processed} of {totalToProcess} files processed</>}
        />
        <ModalBody className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
                <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                <circle
                  cx="48" cy="48" r="40"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="8"
                  strokeDasharray={`${(progress / 100) * (2 * Math.PI * 40)} ${2 * Math.PI * 40}`}
                  strokeLinecap="round"
                  className="transition-all duration-200"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-2xl font-bold text-foreground">{progress}%</p>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-mono font-semibold text-foreground">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Don't close this window. Cleanup will continue until complete.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10"
          >
            <X className="size-3.5" />
            Cancel Cleanup
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Clean Up Completed modal ────────────────────────────────────────────── */

export function CleanupCompletedModal({
  open, previous, freed, current, total, processed, onClose,
}: {
  open: boolean;
  previous: number;
  freed: number;
  current: number;
  total: number;
  processed: { processed: number; outOf: number };
  onClose: () => void;
}) {
  const pct = total === 0 ? 0 : Math.round((current / total) * 100);

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Clean Up Completed"
          description={`${processed.processed} of ${processed.outOf} files processed`}
          icon={CheckCircle2}
          tone="success"
        />
        <ModalBody className="space-y-3">
          <div>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-muted-foreground">Storage Usage</span>
              <span className="text-sm font-bold text-success">{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-success transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-background p-3.5">
            <div className="flex items-center justify-between text-base">
              <span className="text-muted-foreground">Previous Usage:</span>
              <span className="font-mono font-semibold text-foreground">{previous.toLocaleString()} GB</span>
            </div>
            <div className="flex items-center justify-between text-base">
              <span className="text-muted-foreground">Space Freed:</span>
              <span className="font-mono font-semibold text-sev-critical">- {freed.toLocaleString()} GB</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2 text-base">
              <span className="text-muted-foreground">Current Storage:</span>
              <span className="font-mono font-semibold text-success">{current.toLocaleString()} GB ({pct}%)</span>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" onClick={onClose}>Done</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Link Camera modal ───────────────────────────────────────────────────── */

export function LinkCameraModal({
  open, nvr, channel, onClose, onConfirm,
}: {
  open: boolean;
  nvr: NvrData | null;
  channel: number | null;
  onClose: () => void;
  onConfirm: (cameraId: string) => void;
}) {
  const cameras = useCamerasStore((s) => s.cameras);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [areaFilter, setAreaFilter] = React.useState<string | "all">("all");

  React.useEffect(() => {
    if (open) { setPicked(null); setSearch(""); setAreaFilter("all"); }
  }, [open, channel]);

  if (!nvr || channel == null) return null;

  // Same-site cameras with no NVR link
  const candidates = cameras.filter((c) => c.siteId === nvr.siteId && !c.nvrId);
  const areas = Array.from(new Set(candidates.map((c) => c.areaId))).map((id) => {
    const cam = candidates.find((c) => c.areaId === id);
    return { id, label: cam?.areaName ?? id };
  });

  const q = search.trim().toLowerCase();
  const filtered = candidates.filter((c) => {
    if (areaFilter !== "all" && c.areaId !== areaFilter) return false;
    if (q && !`${c.id} ${c.name} ${c.areaName}`.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title={<>Link Camera to Channel {channel}</>}
          description={<>Only cameras at <strong className="text-foreground">{nvr.siteName}</strong> (same site as this NVR) can be linked.</>}
        />
        <ModalSubheader className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by camera name, ID or area…" className="h-9 pl-9 text-base" />
          </div>
          {areas.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Area</span>
              <button
                onClick={() => setAreaFilter("all")}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
                  areaFilter === "all" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}
              >
                All ({candidates.length})
              </button>
              {areas.map((a) => {
                const count = candidates.filter((c) => c.areaId === a.id).length;
                const active = areaFilter === a.id;
                return (
                  <button key={a.id} onClick={() => setAreaFilter(a.id)}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
                      active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    )}>
                    {a.label} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </ModalSubheader>
        <ModalBody className="space-y-2">
          {candidates.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
              <Video className="mx-auto size-7 text-muted-foreground/40" />
              <p className="mt-2 text-base text-muted-foreground">
                No unlinked cameras at this site.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add a camera at {nvr.siteName} first, or unlink an existing one to make it available.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm italic text-muted-foreground">No cameras match the current filters.</p>
          ) : (
            filtered.map((c) => {
              const selected = picked === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setPicked(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left transition-colors",
                    selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                >
                  <div className={cn(
                    "flex size-4 flex-shrink-0 items-center justify-center rounded-full border",
                    selected ? "border-primary" : "border-muted-foreground/40"
                  )}>
                    {selected && <span className="size-2 rounded-full bg-primary" />}
                  </div>
                  <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg border border-info/30 bg-info/10">
                    <Video className="size-4 text-info" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <TruncatedText text={c.name} className="text-base font-semibold text-foreground" />
                    <p className="font-mono text-xs text-muted-foreground">{c.id} · {c.areaName}</p>
                  </div>
                  <StatusPill status={c.status === "online" ? "online" : c.status === "offline" ? "offline" : "degraded"} />
                </button>
              );
            })
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!picked} onClick={() => picked && onConfirm(picked)} className="gap-1.5">
            <Link2 className="size-3.5" />
            Link to Channel {channel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Unlink confirmation modal ───────────────────────────────────────────── */

export function UnlinkConfirmModal({
  open, nvr, channel, onClose, onConfirm, onExportFirst,
}: {
  open: boolean;
  nvr: NvrData | null;
  channel: number | null;
  onClose: () => void;
  onConfirm: () => void;
  onExportFirst: () => void;
}) {
  const [exportFirst, setExportFirst] = React.useState(true);
  React.useEffect(() => { if (open) setExportFirst(true); }, [open, channel]);

  if (!nvr || channel == null) return null;
  const ch = nvr.channels.find((c) => c.channel === channel);
  if (!ch) return null;
  const cam = ch.cameraId ? MOCK_CAMERAS.find((c) => c.id === ch.cameraId) : null;
  const recCount = ch.cameraId ? MOCK_RECORDINGS.filter((r) => r.nvrId === nvr.id && r.cameraId === ch.cameraId).length : 0;
  const storageGb = channelStorageGb(nvr.id, ch);

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Unlink Camera"
          description="Confirm before disconnecting this channel."
          tone="destructive"
        />
        <ModalBody className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
            <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg border border-info/30 bg-info/10">
              <Video className="size-4 text-info" />
            </div>
            <div className="min-w-0 flex-1">
              <TruncatedText text={cam?.name ?? ch.cameraName ?? "—"} className="text-base font-semibold text-foreground" />
              <p className="font-mono text-xs text-muted-foreground">
                {ch.cameraId} · Channel {channel} · {cam?.areaName ?? ""}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-warning" />
              <div className="text-sm leading-relaxed text-muted-foreground">
                Unlinking will stop new recordings from this camera. Existing recordings —
                <strong className="text-foreground"> {recCount} files, {storageGb.toFixed(2)} GB</strong>
                — will remain on the NVR until their retention window expires.
                <p className="mt-1">
                  The camera detection events will <strong className="text-foreground">no longer have replayable footage</strong> until you link it to another channel.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setExportFirst((v) => !v)}
            className={cn(
              "flex w-full items-start gap-2.5 rounded-lg border bg-background px-3 py-2.5 text-left transition-colors",
              exportFirst ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
            )}
          >
            <div className={cn(
              "mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded border",
              exportFirst ? "border-primary bg-primary" : "border-muted-foreground/40"
            )}>
              {exportFirst && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-foreground">Export recordings before unlinking</p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                Download all {recCount} recordings ({storageGb.toFixed(2)} GB) as a ZIP archive before disconnecting.
              </p>
            </div>
          </button>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          {exportFirst && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { onExportFirst(); onConfirm(); }}>
              <Download className="size-3.5" />
              Export &amp; Unlink
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            className="gap-1.5"
            onClick={onConfirm}
          >
            <Unlink className="size-3.5" />
            Unlink without Export
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Add NVR modal ───────────────────────────────────────────────────────── */

interface AddNvrFields {
  id: string;          // auto-generated
  name: string;
  /** "" while the user hasn't picked a model — surfaces a "Select model" placeholder option. */
  model: string;
  siteId: string;
  areaId: string;
  ipAddress: string;
  /** Credentials the recorder is polled with. */
  username: string;
  password: string;
  /** String-typed in form to keep "empty placeholder" UX; parsed on submit. */
  httpPort: string;
  totalStorageGb: string;
  /** String so the field can be empty before user picks; parsed on submit. */
  channelCount: string;
  retentionDays: string;
  cleanupSchedule: NvrData["cleanupSchedule"] | "";
  /** Age-based cleanup: "remove recordings older than" (days). */
  cleanupAgeDays: string;
  /** Channel-based cleanup: channels selected for cleanup. */
  cleanupChannels: number[];
}

function nextNvrId(takenIds: string[]): string {
  let n = 1;
  while (takenIds.includes(`NVR-${String(n).padStart(3, "0")}`)) n++;
  return `NVR-${String(n).padStart(3, "0")}`;
}

const CLEANUP_AGE_PRESETS = [7, 14, 30, 60, 90];

/** Age-based cleanup: "remove recordings older than N days" preset chips. */
function CleanupAgePicker({
  value, onChange, error,
}: {
  value: string;
  onChange: (days: string) => void;
  error?: string;
}) {
  return (
    <div className="col-span-2">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Remove recordings older than
      </label>
      <div className="flex flex-wrap items-center gap-1.5">
        {CLEANUP_AGE_PRESETS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onChange(String(d))}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors",
              value === String(d)
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {d} days
          </button>
        ))}
      </div>
      {error && <p className="mt-1 text-xs text-sev-critical">{error}</p>}
    </div>
  );
}

/** Channel-based cleanup: multi-select dropdown of the NVR's channels. */
function CleanupChannelPicker({
  count, value, onChange, error,
}: {
  count: number;
  value: number[];
  onChange: (channels: number[]) => void;
  error?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const channels = Array.from({ length: count }, (_, i) => i + 1);
  const allSelected = count > 0 && value.length === count;

  function toggle(ch: number) {
    onChange(value.includes(ch) ? value.filter((c) => c !== ch) : [...value, ch]);
  }

  const label =
    value.length === 0
      ? "Select channels"
      : allSelected
        ? "All channels"
        : value
            .slice()
            .sort((a, b) => a - b)
            .map((c) => `Ch ${String(c).padStart(2, "0")}`)
            .join(", ");

  return (
    <div className="col-span-2">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Channels to clean up
      </label>
      {count > 0 ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-background px-3 text-left text-base transition-colors hover:border-primary",
                open ? "border-primary" : "border-input",
                error && "border-sev-critical",
                value.length === 0 && "text-muted-foreground"
              )}
            >
              <span className="truncate">{label}</span>
              <ChevronDown
                className={cn(
                  "size-3.5 flex-shrink-0 text-muted-foreground transition-transform",
                  open && "rotate-180"
                )}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-1.5">
            <button
              type="button"
              onClick={() => onChange(allSelected ? [] : channels)}
              className="mb-1 flex w-full items-center gap-2 rounded-md border-b border-border px-2 py-1.5 text-left text-sm font-semibold text-foreground hover:bg-muted"
            >
              <span
                className={cn(
                  "flex size-3.5 flex-shrink-0 items-center justify-center rounded-sm border transition-colors",
                  allSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                )}
              >
                {allSelected && <Check className="size-2.5" strokeWidth={3} />}
              </span>
              Select all channels
            </button>
            <div className="max-h-56 overflow-y-auto">
              {channels.map((ch) => {
                const checked = value.includes(ch);
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggle(ch)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-base text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <span
                      className={cn(
                        "flex size-3.5 flex-shrink-0 items-center justify-center rounded-sm border transition-colors",
                        checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                      )}
                    >
                      {checked && <Check className="size-2.5" strokeWidth={3} />}
                    </span>
                    Ch {String(ch).padStart(2, "0")}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <div className="rounded-lg border border-dashed border-border px-4 py-4 text-center text-sm text-muted-foreground">
          Select a channel count first.
        </div>
      )}
      {count > 0 && value.length > 0 && (
        <p className="mt-1.5 text-2xs text-muted-foreground">
          {value.length} channel{value.length === 1 ? "" : "s"} selected
        </p>
      )}
      {error && <p className="mt-1 text-xs text-sev-critical">{error}</p>}
    </div>
  );
}

export function AddNvrModal({
  open, takenIds, onClose, onConfirm,
}: {
  open: boolean;
  takenIds: string[];
  onClose: () => void;
  onConfirm: (fields: AddNvrFields) => void;
}) {
  const blank = (): AddNvrFields => ({
    id: nextNvrId(takenIds),
    name: "",
    model: "",
    siteId: "",
    areaId: "",
    ipAddress: "",
    username: "",
    password: "",
    httpPort: "",
    totalStorageGb: "",
    channelCount: "",
    retentionDays: "",
    cleanupSchedule: "",
    cleanupAgeDays: "",
    cleanupChannels: [],
  });

  const [fields, setFields] = React.useState<AddNvrFields>(blank);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = React.useState(false);

  React.useEffect(() => {
    if (open) { setFields(blank()); setErrors({}); setShowPassword(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function set<K extends keyof AddNvrFields>(key: K, value: AddNvrFields[K]) {
    setFields((curr) => ({ ...curr, [key]: value }));
    setErrors((curr) => {
      if (!curr[key as string]) return curr;
      const next = { ...curr };
      delete next[key as string];
      return next;
    });
  }

  function handleSubmit() {
    const next: Record<string, string> = {};
    if (!fields.name.trim()) next.name = "NVR name is required.";
    if (!fields.model.trim()) next.model = "Select a model.";
    if (!fields.siteId) next.siteId = "Select a site.";
    if (!fields.areaId) next.areaId = "Select an area.";
    if (!fields.ipAddress.trim()) next.ipAddress = "IP address is required.";
    if (!(Number(fields.channelCount) > 0)) next.channelCount = "Channel count is required.";
    if (!(Number(fields.totalStorageGb) > 0)) next.totalStorageGb = "Total storage is required.";
    if (fields.cleanupSchedule === "") next.cleanupSchedule = "Select a cleanup schedule.";
    if (fields.cleanupSchedule === "auto-age" && !fields.cleanupAgeDays)
      next.cleanupAgeDays = "Select how old recordings must be before cleanup.";
    if (fields.cleanupSchedule === "auto-channel" && fields.cleanupChannels.length === 0)
      next.cleanupChannels = "Select at least one channel to clean up.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onConfirm(fields);
  }

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Add NVR"
          description="Register a new Network Video Recorder. NVR ID is generated automatically."
        />
        <ModalBody className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">NVR Name</label>
              <input
                value={fields.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. FedEx Changi · NVR-A"
                className={cn(
                  "h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none",
                  errors.name && "border-sev-critical"
                )}
              />
              {errors.name && <p className="mt-1 text-xs text-sev-critical">{errors.name}</p>}
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Model</label>
              <Select value={fields.model} onValueChange={(v) => set("model", v)}>
                <SelectTrigger className={cn("h-9 w-full font-mono", errors.model && "border-sev-critical")}>
                  <SelectValue placeholder="Select an NVR model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hikvision DS-9664NI-I8">Hikvision DS-9664NI-I8 (64-ch)</SelectItem>
                  <SelectItem value="Hikvision DS-7716NI-I4">Hikvision DS-7716NI-I4 (16-ch)</SelectItem>
                  <SelectItem value="Dahua NVR5864-4KS2">Dahua NVR5864-4KS2 (64-ch)</SelectItem>
                  <SelectItem value="Dahua NVR4232-4KS2">Dahua NVR4232-4KS2 (32-ch)</SelectItem>
                  <SelectItem value="Uniview NVR308-32E2">Uniview NVR308-32E2 (32-ch)</SelectItem>
                </SelectContent>
              </Select>
              {errors.model && <p className="mt-1 text-xs text-sev-critical">{errors.model}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Site</label>
              <Select value={fields.siteId} onValueChange={(v) => set("siteId", v)}>
                <SelectTrigger className={cn("h-9 w-full", errors.siteId && "border-sev-critical")}>
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent>
                  {CAMERA_SITES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.siteId && <p className="mt-1 text-xs text-sev-critical">{errors.siteId}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Area</label>
              <Select value={fields.areaId} onValueChange={(v) => set("areaId", v)}>
                <SelectTrigger className={cn("h-9 w-full", errors.areaId && "border-sev-critical")}>
                  <SelectValue placeholder="Select an area" />
                </SelectTrigger>
                <SelectContent>
                  {CAMERA_AREAS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.areaId && <p className="mt-1 text-xs text-sev-critical">{errors.areaId}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">IP Address</label>
              <input
                value={fields.ipAddress}
                onChange={(e) => set("ipAddress", e.target.value)}
                placeholder="10.10.0.10"
                className={cn(
                  "h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none",
                  errors.ipAddress && "border-sev-critical"
                )}
              />
              {errors.ipAddress && <p className="mt-1 text-xs text-sev-critical">{errors.ipAddress}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">HTTP Port (Optional)</label>
              <input
                type="number"
                value={fields.httpPort}
                onChange={(e) => set("httpPort", e.target.value)}
                placeholder="80"
                className="h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</label>
              <input
                value={fields.username}
                onChange={(e) => set("username", e.target.value)}
                placeholder="admin"
                autoComplete="off"
                className={cn(
                  "h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none",
                  errors.username && "border-sev-critical"
                )}
              />
              {errors.username && <p className="mt-1 text-xs text-sev-critical">{errors.username}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={fields.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={cn(
                    "h-9 w-full rounded-md border border-input bg-background px-3 pr-9 font-mono text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none",
                    errors.password && "border-sev-critical"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-sev-critical">{errors.password}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Channel Count</label>
              <Select value={fields.channelCount} onValueChange={(v) => set("channelCount", v)}>
                <SelectTrigger className={cn("h-9 w-full", errors.channelCount && "border-sev-critical")}>
                  <SelectValue placeholder="Select channels" />
                </SelectTrigger>
                <SelectContent>
                  {[4, 8, 16, 32, 64].map((c) => (
                    <SelectItem key={c} value={String(c)}>{c} channels</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.channelCount && <p className="mt-1 text-xs text-sev-critical">{errors.channelCount}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Storage (GB)</label>
              <input
                type="number"
                value={fields.totalStorageGb}
                onChange={(e) => set("totalStorageGb", e.target.value)}
                placeholder="8000"
                className={cn(
                  "h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none",
                  errors.totalStorageGb && "border-sev-critical"
                )}
              />
              {errors.totalStorageGb && <p className="mt-1 text-xs text-sev-critical">{errors.totalStorageGb}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Retention (days) (Optional)</label>
              <input
                type="number"
                value={fields.retentionDays}
                onChange={(e) => set("retentionDays", e.target.value)}
                placeholder="30"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cleanup Mode</label>
              <Select
                value={fields.cleanupSchedule}
                onValueChange={(v) => set("cleanupSchedule", v as NvrData["cleanupSchedule"])}
              >
                <SelectTrigger className={cn("h-9 w-full", errors.cleanupSchedule && "border-sev-critical")}>
                  <SelectValue placeholder="Select cleanup mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto-age">Auto · Age based</SelectItem>
                  <SelectItem value="auto-channel">Auto · Channel based</SelectItem>
                </SelectContent>
              </Select>
              {errors.cleanupSchedule && <p className="mt-1 text-xs text-sev-critical">{errors.cleanupSchedule}</p>}
            </div>
            {fields.cleanupSchedule === "auto-age" && (
              <CleanupAgePicker
                value={fields.cleanupAgeDays}
                onChange={(d) => set("cleanupAgeDays", d)}
                error={errors.cleanupAgeDays}
              />
            )}
            {fields.cleanupSchedule === "auto-channel" && (
              <CleanupChannelPicker
                count={Number(fields.channelCount) || 0}
                value={fields.cleanupChannels}
                onChange={(chs) => set("cleanupChannels", chs)}
                error={errors.cleanupChannels}
              />
            )}
          </div>

          <div className="rounded-lg border border-info/30 bg-info/[0.06] px-3 py-2.5 text-sm text-muted-foreground">
            New NVRs start with all channels free. Link cameras to channels after creation from the
            <strong className="text-foreground"> Channel Management</strong> tab.
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} className="gap-1.5">
            <Plus className="size-3.5" />
            Add NVR
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Edit NVR modal ──────────────────────────────────────────────────────── */

interface NvrFormFields {
  name: string;
  username: string;
  password: string;
  siteId: string;
  areaId: string;
  ipAddress: string;
  httpPort: string;
  totalStorageGb: string;
  retentionDays: string;
  cleanupSchedule: NvrData["cleanupSchedule"] | "";
  cleanupAgeDays: string;
  cleanupChannels: number[];
}

function buildNvrFormFields(nvr: NvrData): NvrFormFields {
  return {
    name: nvr.name,
    username: nvr.username,
    password: nvr.password,
    siteId: nvr.siteId,
    areaId: nvr.areaId,
    ipAddress: nvr.ipAddress,
    httpPort: String(nvr.httpPort),
    totalStorageGb: String(nvr.totalStorageGb),
    retentionDays: String(nvr.retentionDays),
    cleanupSchedule: nvr.cleanupSchedule,
    cleanupAgeDays: nvr.cleanupSchedule === "auto-age" ? String(nvr.retentionDays) : "",
    cleanupChannels: [],
  };
}

function serializeNvrFormFields(fields: NvrFormFields): string {
  return JSON.stringify({
    ...fields,
    cleanupChannels: [...fields.cleanupChannels].sort((a, b) => a - b),
  });
}

export function EditNvrModal({
  open, nvr, onClose, onConfirm,
}: {
  open: boolean;
  nvr: NvrData | null;
  onClose: () => void;
  onConfirm: (fields: NvrFormFields) => void;
}) {
  const [fields, setFields] = React.useState<NvrFormFields>({
    name: "", username: "", password: "", siteId: "", areaId: "", ipAddress: "", httpPort: "", totalStorageGb: "", retentionDays: "", cleanupSchedule: "",
    cleanupAgeDays: "", cleanupChannels: [],
  });
  const [initialFields, setInitialFields] = React.useState<NvrFormFields | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [showEditPassword, setShowEditPassword] = React.useState(false);

  React.useEffect(() => {
    if (open && nvr) {
      const next = buildNvrFormFields(nvr);
      setFields(next);
      setInitialFields(next);
      setErrors({});
    }
  }, [open, nvr]);

  function set<K extends keyof NvrFormFields>(key: K, value: NvrFormFields[K]) {
    setFields((curr) => ({ ...curr, [key]: value }));
    setErrors((curr) => {
      if (!curr[key as string]) return curr;
      const next = { ...curr };
      delete next[key as string];
      return next;
    });
  }

  function handleSubmit() {
    const next: Record<string, string> = {};
    if (!fields.name.trim()) next.name = "NVR name is required.";
    if (!fields.siteId) next.siteId = "Select a site.";
    if (!fields.areaId) next.areaId = "Select an area.";
    if (!fields.ipAddress.trim()) next.ipAddress = "IP address is required.";
    if (!fields.username.trim()) next.username = "Username is required.";
    if (!fields.password) next.password = "Password is required.";
    if (!(Number(fields.totalStorageGb) > 0)) next.totalStorageGb = "Total storage is required.";
    if (fields.cleanupSchedule === "") next.cleanupSchedule = "Select a cleanup schedule.";
    if (fields.cleanupSchedule === "auto-age" && !fields.cleanupAgeDays)
      next.cleanupAgeDays = "Select how old recordings must be before cleanup.";
    if (fields.cleanupSchedule === "auto-channel" && fields.cleanupChannels.length === 0)
      next.cleanupChannels = "Select at least one channel to clean up.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onConfirm(fields);
  }

  if (!nvr) return null;

  const isDirty = initialFields !== null && serializeNvrFormFields(fields) !== serializeNvrFormFields(initialFields);

  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Edit NVR"
          description={<>Update fields for {nvr.id}. Model and channel count cannot be changed after registration.</>}
        />
        <ModalBody className="space-y-4">
          {/* Read-only header */}
          <div className="rounded-lg border border-border bg-background p-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">NVR ID</p>
                <p className="mt-0.5 font-mono text-primary">{nvr.id}</p>
              </div>
              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Model</p>
                <p className="mt-0.5 font-mono text-foreground">{nvr.model}</p>
              </div>
              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Channels</p>
                <p className="mt-0.5 font-semibold text-foreground">{nvr.channelsInUse} / {nvr.channelCount} in use</p>
              </div>
              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Total Storage</p>
                <p className="mt-0.5 font-mono text-foreground">{nvr.totalStorageGb.toLocaleString()} GB</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">NVR Name</label>
              <input
                value={fields.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. FedEx Changi · NVR-A"
                className={cn(
                  "h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none",
                  errors.name && "border-sev-critical"
                )}
              />
              {errors.name && <p className="mt-1 text-xs text-sev-critical">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Site</label>
              <Select value={fields.siteId} onValueChange={(v) => set("siteId", v)}>
                <SelectTrigger className={cn("h-9 w-full", errors.siteId && "border-sev-critical")}>
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent>
                  {CAMERA_SITES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.siteId && <p className="mt-1 text-xs text-sev-critical">{errors.siteId}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Area</label>
              <Select value={fields.areaId} onValueChange={(v) => set("areaId", v)}>
                <SelectTrigger className={cn("h-9 w-full", errors.areaId && "border-sev-critical")}>
                  <SelectValue placeholder="Select an area" />
                </SelectTrigger>
                <SelectContent>
                  {CAMERA_AREAS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.areaId && <p className="mt-1 text-xs text-sev-critical">{errors.areaId}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">IP Address</label>
              <input
                value={fields.ipAddress}
                onChange={(e) => set("ipAddress", e.target.value)}
                placeholder="10.10.0.10"
                className={cn(
                  "h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none",
                  errors.ipAddress && "border-sev-critical"
                )}
              />
              {errors.ipAddress && <p className="mt-1 text-xs text-sev-critical">{errors.ipAddress}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">HTTP Port (Optional)</label>
              <input
                type="number"
                value={fields.httpPort}
                onChange={(e) => set("httpPort", e.target.value)}
                placeholder="80"
                className="h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</label>
              <input
                value={fields.username}
                onChange={(e) => set("username", e.target.value)}
                placeholder="admin"
                autoComplete="off"
                className={cn(
                  "h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none",
                  errors.username && "border-sev-critical"
                )}
              />
              {errors.username && <p className="mt-1 text-xs text-sev-critical">{errors.username}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
              <div className="relative">
                <input
                  type={showEditPassword ? "text" : "password"}
                  value={fields.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={cn(
                    "h-9 w-full rounded-md border border-input bg-background px-3 pr-9 font-mono text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none",
                    errors.password && "border-sev-critical"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword((v) => !v)}
                  aria-label={showEditPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showEditPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-sev-critical">{errors.password}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Storage (GB)</label>
              <input
                type="number"
                value={fields.totalStorageGb}
                onChange={(e) => set("totalStorageGb", e.target.value)}
                placeholder="8000"
                className={cn(
                  "h-9 w-full rounded-md border border-input bg-background px-3 font-mono text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none",
                  errors.totalStorageGb && "border-sev-critical"
                )}
              />
              {errors.totalStorageGb && <p className="mt-1 text-xs text-sev-critical">{errors.totalStorageGb}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Retention (days) (Optional)</label>
              <input
                type="number"
                value={fields.retentionDays}
                onChange={(e) => set("retentionDays", e.target.value)}
                placeholder="30"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cleanup Mode</label>
              <Select
                value={fields.cleanupSchedule}
                onValueChange={(v) => set("cleanupSchedule", v as NvrFormFields["cleanupSchedule"])}
              >
                <SelectTrigger className={cn("h-9 w-full", errors.cleanupSchedule && "border-sev-critical")}>
                  <SelectValue placeholder="Select cleanup mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto-age">Auto · Age based</SelectItem>
                  <SelectItem value="auto-channel">Auto · Channel based</SelectItem>
                </SelectContent>
              </Select>
              {errors.cleanupSchedule && <p className="mt-1 text-xs text-sev-critical">{errors.cleanupSchedule}</p>}
            </div>
            {fields.cleanupSchedule === "auto-age" && (
              <CleanupAgePicker
                value={fields.cleanupAgeDays}
                onChange={(d) => set("cleanupAgeDays", d)}
                error={errors.cleanupAgeDays}
              />
            )}
            {fields.cleanupSchedule === "auto-channel" && (
              <CleanupChannelPicker
                count={nvr.channelCount}
                value={fields.cleanupChannels}
                onChange={(chs) => set("cleanupChannels", chs)}
                error={errors.cleanupChannels}
              />
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!isDirty} onClick={handleSubmit} className="gap-1.5">
            <Check className="size-3.5" />
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ── Delete NVR modal ────────────────────────────────────────────────────── */

export function DeleteNvrModal({
  open, nvr, onClose, onConfirm,
}: {
  open: boolean;
  nvr: NvrData | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!nvr) return null;
  return (
    <Modal open={open} onOpenChange={(v) => !v && onClose()}>
      <ModalContent size="lg">
        <ModalHeader
          title="Delete NVR"
          description="This action cannot be undone."
          tone="destructive"
        />
        <ModalBody>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="flex items-start gap-3">
              <Trash2 className="mt-0.5 size-4 flex-shrink-0 text-destructive" />
              <div>
                <p className="text-base font-semibold text-foreground">You are about to remove:</p>
                <p className="mt-1 font-mono text-sm text-muted-foreground">{nvr.id}</p>
                <p className="mt-0.5 text-base text-muted-foreground">{nvr.name} ({nvr.model})</p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            All <strong className="text-foreground">{nvr.channelsInUse}</strong> linked cameras will lose recording storage immediately.
            Stored recordings ({nvr.usedStorageGb.toLocaleString()} GB) cannot be recovered.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" variant="destructive" className="gap-1.5" onClick={onConfirm}>
            <Trash2 className="size-3.5" />
            Delete NVR
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
