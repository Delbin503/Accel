import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Check,
  X,
  Film,
  Play,
  Pause,
  Clock,
  MapPin,
  Video,
  HardDrive,
  CircleDot,
  Link2,
  AlertTriangle,
  Maximize2,
  SkipBack,
  SkipForward,
  Trash2,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/PageHeader";
import { DateRangeBar } from "@/components/shared/DateRangeBar";
import { TruncatedText } from "@/components/shared/TruncatedText";
import { cn } from "@/lib/utils";
import { MOCK_RECORDINGS, type RecordingDisplay } from "@/mocks/recordings";
import { MOCK_CAMERAS, CAMERA_SITES, CAMERA_AREAS } from "@/mocks/cameras";
import { MOCK_NVRS } from "@/mocks/nvr";
import { MOCK_EVENTS } from "@/mocks/detectionFeed";
import { ASSIGNEES } from "@/mocks/incidentCases";
import { useIncidentCasesStore } from "@/stores/useIncidentCasesStore";
import { SeverityBadge, parseEventText } from "@/pages/detection-feed/shared";
import { EventDrawer } from "@/pages/detection-feed/EventDrawer";
import type { DetectionEvent, Severity } from "@/types/detection";
import type { CaseAssignee } from "@/types/incidents";

/* ── Mode chip ───────────────────────────────────────────────────────────── */

const MODE_STYLES: Record<RecordingDisplay["mode"], { bg: string; text: string; label: string }> = {
  continuous: { bg: "bg-primary/10 border-primary/20", text: "text-primary", label: "Continuous" },
  event:      { bg: "bg-info/10 border-info/20",       text: "text-info",    label: "Event" },
  scheduled:  { bg: "bg-purple-soft border-purple/20", text: "text-purple",  label: "Scheduled" },
};

function RecordingModeChip({ mode }: { mode: RecordingDisplay["mode"] }) {
  const s = MODE_STYLES[mode];
  return (
    <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider", s.bg, s.text)}>
      {s.label}
    </span>
  );
}

/* ── KPI strip ───────────────────────────────────────────────────────────── */

import { KpiCard, KpiGrid, type KpiAccent } from "@/components/shared/KpiCard";

type KpiFilter = "all" | "today" | "high-events" | "continuous";

const KPI_CONFIGS: {
  key: KpiFilter; label: string; sub: string; accent: KpiAccent;
  getValue: (items: RecordingDisplay[]) => number;
}[] = [
  { key: "all",         label: "Total Recordings", sub: "Across all cameras",  accent: "primary", getValue: (items) => items.length },
  { key: "today",       label: "Today",            sub: "Recorded today",      accent: "success", getValue: (items) => items.filter((r) => r.dateLabel === "Today").length },
  { key: "high-events", label: "With Events",      sub: "≥ 5 detections each", accent: "warning", getValue: (items) => items.filter((r) => r.eventCount >= 5).length },
  { key: "continuous",  label: "Continuous",       sub: "24/7 recording mode", accent: "info",    getValue: (items) => items.filter((r) => r.mode === "continuous").length },
];

/* ── Multi-select dropdown ───────────────────────────────────────────────── */

interface FilterOption { value: string; label: string }

function FilterDropdown({ label, options, selected, onChange }: { label: string; options: readonly FilterOption[]; selected: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = React.useState(false);
  const hasValue = selected.length > 0;
  const displayLabel = hasValue
    ? selected.length === 1 ? (options.find((o) => o.value === selected[0])?.label ?? label) : `${selected.length} selected`
    : label;
  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn("flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-base transition-colors hover:border-primary", open ? "border-primary" : "border-border", hasValue ? "text-primary" : "text-muted-foreground")}>
          <TruncatedText text={displayLabel} className="font-medium" />
          <ChevronDown className={cn("size-3.5 flex-shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-[260px] w-56 overflow-y-auto p-1.5">
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <button key={opt.value} onClick={() => toggle(opt.value)} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-base text-muted-foreground hover:bg-muted hover:text-foreground">
              <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors", checked ? "border-primary bg-primary" : "border-muted-foreground/40")}>
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

/* ── Filter panel ────────────────────────────────────────────────────────── */

interface RecordingFilters { site: string[]; area: string[]; camera: string[]; mode: string[] }
const EMPTY_FILTERS: RecordingFilters = { site: [], area: [], camera: [], mode: [] };

const MODE_OPTS: FilterOption[] = [
  { value: "continuous", label: "Continuous" },
  { value: "event",      label: "Event" },
  { value: "scheduled",  label: "Scheduled" },
];

function FilterPanel({ filters, onChange, search, onSearchChange }: { filters: RecordingFilters; onChange: (f: RecordingFilters) => void; search: string; onSearchChange: (v: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const filterCount = Object.values(filters).reduce((s, arr) => s + arr.length, 0);
  const activeCount = filterCount + (search ? 1 : 0);
  function setGroup(group: keyof RecordingFilters, values: string[]) { onChange({ ...filters, [group]: values }); }
  const CAMERA_OPTS = MOCK_CAMERAS.map((c) => ({ value: c.id, label: `${c.id} · ${c.name}` }));

  return (
    <div className="rounded-xl border border-border bg-card">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-base font-semibold text-foreground">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary px-2 py-px text-xs font-semibold text-primary-foreground">{activeCount} active</span>
          ) : (
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {["All sites", "All areas", "All cameras", "All modes"].map((l) => (
                <span key={l} className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{l}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button onClick={(e) => { e.stopPropagation(); onChange(EMPTY_FILTERS); onSearchChange(""); }} className="text-sm text-muted-foreground underline hover:text-primary">
              Clear all
            </button>
          )}
          {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="space-y-3 rounded-b-xl border-t border-border bg-background px-4 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search by recording ID, camera, or area…" className="h-9 w-full pl-9 text-base" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { key: "site"   as const, label: "Site",   opts: CAMERA_SITES },
              { key: "area"   as const, label: "Area",   opts: CAMERA_AREAS },
              { key: "camera" as const, label: "Camera", opts: CAMERA_OPTS },
              { key: "mode"   as const, label: "Mode",   opts: MODE_OPTS },
            ].map(({ key, label, opts }) => (
              <div key={key}>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
                <FilterDropdown label={`All ${label.toLowerCase()}s`} options={opts} selected={filters[key]} onChange={(v) => setGroup(key, v)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Derived detected periods ────────────────────────────────────────────── */

interface DetectedPeriod {
  event: DetectionEvent;
  offsetSec: number;
  durationSec: number;
}

function periodsForRecording(rec: RecordingDisplay): DetectedPeriod[] {
  const start = new Date(rec.startsAt).getTime();
  const end = new Date(rec.endsAt).getTime();
  const real = MOCK_EVENTS
    .filter((e) => {
      if (e.camera !== rec.cameraId) return false;
      const t = new Date(`${e.date}T${e.time}`).getTime();
      return t >= start && t <= end;
    })
    .map((e) => {
      const eventTs = new Date(`${e.date}T${e.time}`).getTime();
      const offsetSec = Math.max(0, Math.round((eventTs - start) / 1000));
      return { event: e, offsetSec, durationSec: 8 + (e.severity === "critical" ? 4 : 0) };
    });
  if (real.length > 0) return real;

  // No mock events fell inside this recording window — emit synthetic samples
  // so the drawer always demonstrates the linked-incidents UX.
  const seed = rec.id.split("").reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const sampleCount = (seed % 3) + 1;
  const durationSec = Math.max(60, Math.round((end - start) / 1000));
  const samples: DetectedPeriod[] = [];
  for (let i = 0; i < sampleCount; i++) {
    const src = MOCK_EVENTS[(seed + i * 3) % MOCK_EVENTS.length];
    if (!src) continue;
    const offsetSec = Math.round(((i + 1) / (sampleCount + 1)) * durationSec);
    const eventMs = start + offsetSec * 1000;
    const d = new Date(eventMs);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    const ss = String(d.getUTCSeconds()).padStart(2, "0");
    samples.push({
      event: {
        ...src,
        id: `${src.id}::${rec.id}::${i}`,
        camera: rec.cameraId,
        siteDisplay: rec.siteName,
        areaDisplay: rec.areaName,
        date: rec.startsAt.slice(0, 10),
        time: `${hh}:${mm}:${ss}`,
      },
      offsetSec,
      durationSec: 8 + (src.severity === "critical" ? 4 : 0),
    });
  }
  return samples;
}

function fmtClock(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ── Faux player ─────────────────────────────────────────────────────────── */

function FauxPlayer({ rec, periods, currentSec, onSeek, isPlaying, onPlayToggle }: {
  rec: RecordingDisplay; periods: DetectedPeriod[];
  currentSec: number; onSeek: (sec: number) => void;
  isPlaying: boolean; onPlayToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 50% 60%, rgba(180,140,80,0.18) 0%, rgba(60,40,20,0.1) 40%, rgba(0,0,0,0.95) 100%)" }} />
        <button onClick={onPlayToggle} className="absolute inset-0 flex items-center justify-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition-transform hover:scale-105">
            {isPlaying ? <Pause className="size-6 text-white" /> : <Play className="size-6 text-white" />}
          </div>
        </button>
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-0.5 text-2xs font-bold uppercase tracking-widest text-white backdrop-blur-sm">
          <span className={cn("size-1.5 rounded-full", isPlaying ? "animate-pulse bg-sev-critical" : "bg-muted-foreground")} />
          {isPlaying ? "Playing" : "Paused"}
        </div>
        <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-0.5 font-mono text-2xs text-white/80 backdrop-blur-sm">
          {rec.cameraName} · {rec.areaName}
        </div>
        <div className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-0.5 font-mono text-2xs text-white/80 backdrop-blur-sm">
          {fmtClock(currentSec)} / {rec.durationDisplay}
        </div>
      </div>

      <div className="border-t border-border bg-background/40 p-3">
        <div className="mb-1.5 flex items-center justify-between text-2xs text-muted-foreground">
          <span className="font-mono">{rec.startsAtDisplay}</span>
          <span className="inline-flex items-center gap-1.5">
            <CircleDot className="size-3 text-success" />
            <strong className="text-foreground">{periods.length}</strong> detected period{periods.length === 1 ? "" : "s"}
          </span>
          <span className="font-mono">{rec.endsAtDisplay}</span>
        </div>
        <div className="relative h-3 w-full">
          <div className="absolute inset-0 rounded-full bg-muted" />
          <div className="absolute inset-y-0 left-0 rounded-full bg-primary/40" style={{ width: `${(currentSec / rec.durationSeconds) * 100}%` }} />
          {periods.map((p) => (
            <button key={p.event.id} onClick={() => onSeek(p.offsetSec)} title={`${p.event.typeLabel} at ${p.event.time}`}
              className="absolute top-0 bottom-0 rounded-sm bg-sev-critical/80 transition-all hover:bg-sev-critical hover:scale-y-[1.6]"
              style={{ left: `${(p.offsetSec / rec.durationSeconds) * 100}%`, width: `max(3px, ${(p.durationSec / rec.durationSeconds) * 100}%)` }} />
          ))}
          <input type="range" min={0} max={rec.durationSeconds} step={1} value={currentSec}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
          <div className="pointer-events-none absolute -top-1 size-5 -translate-x-1/2 rounded-full border-2 border-primary bg-card shadow-md"
            style={{ left: `${(currentSec / rec.durationSeconds) * 100}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-center gap-2.5">
          <Button variant="outline" className="gap-1.5" onClick={() => onSeek(Math.max(0, currentSec - 30))}>
            <SkipBack className="size-3.5" />
            -30s
          </Button>
          <Button className="gap-1.5" onClick={onPlayToggle}>
            {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => onSeek(Math.min(rec.durationSeconds, currentSec + 30))}>
            +30s
            <SkipForward className="size-3.5" />
          </Button>
          <Button variant="outline" className="ml-2 gap-1.5">
            <Maximize2 className="size-3.5" />
            Fullscreen
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Create Case modal ───────────────────────────────────────────────────── */

function CreateCaseModal({ open, recording, selectedEvents, onClose, onConfirm }: {
  open: boolean; recording: RecordingDisplay | null; selectedEvents: DetectionEvent[];
  onClose: () => void;
  onConfirm: (data: { title: string; severity: Severity; assignee: CaseAssignee; notes: string }) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [severity, setSeverity] = React.useState<Severity>("medium");
  const [assignee, setAssignee] = React.useState<CaseAssignee>(ASSIGNEES[0]);
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (open && recording) {
      setTitle(`Incidents from ${recording.cameraName} · ${recording.dateLabel}`);
      const order: Severity[] = ["low", "medium", "critical"];
      const max = selectedEvents.reduce<Severity>(
        (acc, e) => (order.indexOf(e.severity) > order.indexOf(acc) ? e.severity : acc),
        "low"
      );
      setSeverity(selectedEvents.length > 0 ? max : "medium");
      setNotes("");
      setAssignee(ASSIGNEES[0]);
    }
  }, [open, recording, selectedEvents]);

  if (!recording) return null;
  const canSubmit = title.trim().length > 0 && selectedEvents.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Create Incident Case</DialogTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            From recording <span className="font-mono text-foreground">{recording.id}</span> ·{" "}
            <strong className="text-foreground">{selectedEvents.length}</strong> incident{selectedEvents.length === 1 ? "" : "s"} will be linked
          </p>
        </DialogHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Case Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-base" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Severity</label>
              <div className="flex gap-1.5">
                {(["low", "medium", "critical"] as Severity[]).map((sv) => (
                  <button key={sv} onClick={() => setSeverity(sv)} className={cn(
                    "flex-1 rounded-md border px-2 py-1.5 text-xs font-bold uppercase transition-colors",
                    severity === sv
                      ? sv === "critical" ? "border-sev-critical/60 bg-sev-critical/10 text-sev-critical"
                        : sv === "medium" ? "border-warning/60 bg-warning/10 text-warning"
                        : "border-info/60 bg-info/10 text-info"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}>
                    {sv}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assign To</label>
              <Select value={assignee.id} onValueChange={(v) => { const a = ASSIGNEES.find((x) => x.id === v); if (a) setAssignee(a); }}>
                <SelectTrigger className="h-9 w-full text-base">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNEES.map((a) => <SelectItem key={a.id} value={a.id}>{a.name} ({a.id})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* SLA target — auto-set by severity (mirrors Detection Feed escalate modal) */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              SLA Target <span className="text-muted-foreground/60">(auto-set by severity)</span>
            </p>
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-background p-3">
              {(() => {
                const sla =
                  severity === "critical" ? { ack: "15 min", action: "1 hour",  resolve: "4 hours" } :
                  severity === "medium"   ? { ack: "1 hour", action: "4 hours", resolve: "1 day"   } :
                                            { ack: "4 hours",action: "1 day",   resolve: "3 days"  };
                return (
                  <>
                    <div>
                      <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Acknowledge</p>
                      <p className="mt-1 font-mono text-base font-bold text-foreground">{sla.ack}</p>
                    </div>
                    <div>
                      <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Initial Action</p>
                      <p className="mt-1 font-mono text-base font-bold text-foreground">{sla.action}</p>
                    </div>
                    <div>
                      <p className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">Resolution</p>
                      <p className="mt-1 font-mono text-base font-bold text-foreground">{sla.resolve}</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="mb-2 text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
              Linked Incidents ({selectedEvents.length})
            </p>
            {selectedEvents.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">Select at least one detected incident from the timeline.</p>
            ) : (
              <ul className="space-y-1">
                {selectedEvents.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 text-sm">
                    <SeverityBadge severity={e.severity} />
                    <span className="font-mono text-xs text-muted-foreground">{e.id}</span>
                    <TruncatedText text={e.typeLabel} className="text-foreground" />
                    <span className="ml-auto font-mono text-xs text-muted-foreground">{e.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes (optional)</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Add context for the investigator…"
              className="w-full text-base" />
          </div>
        </div>
        <div className="flex flex-shrink-0 justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!canSubmit} onClick={() => onConfirm({ title: title.trim(), severity, assignee, notes })} className="gap-1.5">
            <Check className="size-3.5" />
            Create Case
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Recording Drawer ────────────────────────────────────────────────────── */

function RecordingDrawer({ recording, open, onClose, onCreateCase, onOpenEvent, onDeleteRecording }: {
  recording: RecordingDisplay | null; open: boolean; onClose: () => void;
  onCreateCase: (rec: RecordingDisplay, events: DetectionEvent[]) => void;
  onOpenEvent: (event: DetectionEvent) => void;
  onDeleteRecording: (id: string) => void;
}) {
  const [currentSec, setCurrentSec] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [selectedEventIds, setSelectedEventIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (open) { setCurrentSec(0); setIsPlaying(false); setSelectedEventIds(new Set()); }
  }, [open, recording?.id]);

  React.useEffect(() => {
    if (!isPlaying || !recording) return;
    const id = setInterval(() => {
      setCurrentSec((s) => {
        if (s >= recording.durationSeconds) { setIsPlaying(false); return recording.durationSeconds; }
        return s + 30;
      });
    }, 500);
    return () => clearInterval(id);
  }, [isPlaying, recording]);

  if (!recording) return null;
  const periods = periodsForRecording(recording);
  const camera = MOCK_CAMERAS.find((c) => c.id === recording.cameraId);
  const nvr = MOCK_NVRS.find((n) => n.id === recording.nvrId);
  const selectedEvents = periods.filter((p) => selectedEventIds.has(p.event.id)).map((p) => p.event);

  function toggleEvent(id: string) {
    setSelectedEventIds((curr) => {
      const next = new Set(curr);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function selectAll() { setSelectedEventIds(new Set(periods.map((p) => p.event.id))); }
  function clearSel()  { setSelectedEventIds(new Set()); }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" showCloseButton={false} className="flex w-[min(860px,58vw)] max-w-[95vw] flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border bg-card px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <RecordingModeChip mode={recording.mode} />
              </div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <SheetTitle className="min-w-0 text-lg font-bold">
                  <TruncatedText text={`Recording · ${recording.dateLabel}`} />
                </SheetTitle>
                <span className="rounded border border-border bg-muted px-1.5 py-px font-mono text-2xs text-muted-foreground">{recording.id}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Video className="size-3" />
                {recording.cameraName} ({recording.cameraId})
                <span className="text-muted-foreground/40">·</span>
                <MapPin className="size-3" />
                {recording.areaName} · {recording.siteName}
                <span className="text-muted-foreground/40">·</span>
                <Clock className="size-3" />
                {recording.startsAtDisplay} – {recording.endsAtDisplay}
                <span className="text-muted-foreground/40">·</span>
                <span className="font-mono">{recording.durationDisplay}</span>
              </div>
            </div>
            <button onClick={onClose} className="mt-0.5 flex size-7 flex-shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <FauxPlayer rec={recording} periods={periods} currentSec={currentSec} onSeek={(s) => setCurrentSec(s)} isPlaying={isPlaying} onPlayToggle={() => setIsPlaying((v) => !v)} />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recording Info</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-border bg-card p-4">
              {([
                ["Recording ID", <span className="font-mono text-xs text-primary">{recording.id}</span>],
                ["Mode",         <RecordingModeChip mode={recording.mode} />],
                ["Camera",       <span className="font-mono text-xs">{recording.cameraId}</span>],
                ["Camera Name",  recording.cameraName],
                ["Site",         recording.siteName],
                ["Area",         recording.areaName],
                ["NVR",          <span className="inline-flex items-center gap-1.5"><HardDrive className="size-3 text-info" /><span className="font-mono">{nvr?.id ?? "—"}</span></span>],
                ["Resolution",   <span className="font-mono text-xs">{camera?.stream.resolution ?? "—"}</span>],
                ["Duration",     <span className="font-mono text-xs">{recording.durationDisplay}</span>],
                ["File Size",    <span className="font-mono text-xs">{recording.fileSizeDisplay}</span>],
                ["Starts At",    <span className="font-mono text-xs">{recording.startsAtDisplay}</span>],
                ["Ends At",      <span className="font-mono text-xs">{recording.endsAtDisplay}</span>],
              ] as [string, React.ReactNode][]).map(([label, value]) => (
                <div key={label as string} className="flex flex-col gap-0.5">
                  <span className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
                  <span className="text-base font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Detected Incidents ({periods.length})
              </span>
              {periods.length > 0 && (
                <button onClick={selectedEventIds.size === periods.length ? clearSel : selectAll} className="text-xs text-primary hover:underline">
                  {selectedEventIds.size === periods.length ? "Unselect all" : "Select all"}
                </button>
              )}
            </div>
            {periods.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                <CircleDot className="mx-auto mb-2 size-6 opacity-30" />
                No incidents detected during this recording window.
              </div>
            ) : (
              <div className="space-y-2">
                {periods.map((p) => {
                  const checked = selectedEventIds.has(p.event.id);
                  return (
                    <div key={p.event.id} className={cn("group rounded-xl border bg-card p-3.5 transition-colors", checked ? "border-primary/60 bg-primary/[0.04]" : "border-border hover:border-primary/30 hover:bg-muted/20")}
                      style={{ borderLeftWidth: 3, borderLeftColor: `var(--sev-${p.event.severity})` }}>
                      <div className="flex items-start gap-3">
                        <button onClick={() => toggleEvent(p.event.id)} className={cn("mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded border transition-colors", checked ? "border-primary bg-primary" : "border-muted-foreground/40 hover:border-primary/60")}>
                          {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-1.5">
                            <SeverityBadge severity={p.event.severity} />
                            <span className="text-base font-semibold text-foreground">{p.event.typeLabel}</span>
                            <span className="rounded border border-border bg-muted px-1.5 py-px font-mono text-2xs text-muted-foreground">{p.event.useCaseId}</span>
                            {p.event.caseId && (
                              <span className="rounded border border-success/30 bg-success/10 px-1.5 py-px text-2xs font-semibold text-success">In case</span>
                            )}
                          </div>
                          <p className="mb-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {parseEventText(p.event.summary)}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1"><Clock className="size-2.5" />{p.event.time}</span>
                            <span className="inline-flex items-center gap-1 font-mono"><CircleDot className="size-2.5 text-sev-critical" />@ {fmtClock(p.offsetSec)}</span>
                            <button onClick={() => setCurrentSec(p.offsetSec)} className="text-xs text-primary hover:underline">Jump to mark</button>
                          </div>
                        </div>
                        <Button variant="outline" className="gap-1.5" onClick={() => onOpenEvent(p.event)}>
                          View
                          <ChevronRight className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-border bg-card px-5 py-3.5">
          <Button className="gap-1.5" disabled={selectedEventIds.size === 0} onClick={() => onCreateCase(recording, selectedEvents)}>
            <Link2 className="size-3.5" />
            Create Case
          </Button>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{selectedEventIds.size}</strong> of {periods.length} selected
          </p>
          <Button variant="outline" className="ml-auto gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10"
            onClick={() => onDeleteRecording(recording.id)}>
            <Trash2 className="size-3.5" />
            Delete Recording
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

type SortKey = "newest" | "oldest" | "duration-desc" | "events-desc";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest",        label: "Newest First" },
  { key: "oldest",        label: "Oldest First" },
  { key: "duration-desc", label: "Longest Duration" },
  { key: "events-desc",   label: "Most Events" },
];

type DatePreset = "all" | "today" | "yesterday" | "week" | "month" | "custom";
const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: "all",       label: "All time" },
  { key: "today",     label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week",      label: "This Week" },
  { key: "month",     label: "This Month" },
];

const NOW_REF = new Date("2026-05-25T10:15:00").getTime();

export default function RecordingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  React.useEffect(() => {
    const incoming = (location.state as { openRecordingId?: string } | null)?.openRecordingId;
    if (incoming) {
      setDrawerId(incoming);
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, location.pathname]);
  const { createCase } = useIncidentCasesStore();
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<RecordingFilters>(EMPTY_FILTERS);
  const [kpiFilter, setKpiFilter] = React.useState<KpiFilter>("all");
  const [datePreset, setDatePreset] = React.useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("newest");
  const [sortOpen, setSortOpen] = React.useState(false);
  const [recordings, setRecordings] = React.useState<RecordingDisplay[]>(() => [...MOCK_RECORDINGS]);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [drawerId, setDrawerId] = React.useState<string | null>(null);
  const [openEvent, setOpenEvent] = React.useState<DetectionEvent | null>(null);
  const [createCaseFor, setCreateCaseFor] = React.useState<{ rec: RecordingDisplay; events: DetectionEvent[] } | null>(null);
  const [page, setPage] = React.useState(1);
  const pageSize = 12;

  const filtered = React.useMemo(() => {
    let list = recordings.filter((r) => {
      if (kpiFilter === "today" && r.dateLabel !== "Today") return false;
      if (kpiFilter === "high-events" && r.eventCount < 5) return false;
      if (kpiFilter === "continuous" && r.mode !== "continuous") return false;
      if (filters.site.length > 0) {
        const cam = MOCK_CAMERAS.find((c) => c.id === r.cameraId);
        if (!cam || !filters.site.includes(cam.siteId)) return false;
      }
      if (filters.area.length > 0) {
        const cam = MOCK_CAMERAS.find((c) => c.id === r.cameraId);
        if (!cam || !filters.area.includes(cam.areaId)) return false;
      }
      if (filters.camera.length > 0 && !filters.camera.includes(r.cameraId)) return false;
      if (filters.mode.length > 0 && !filters.mode.includes(r.mode)) return false;
      if (datePreset !== "all") {
        const ts = new Date(r.startsAt).getTime();
        if (datePreset === "today" && ts < NOW_REF - 24 * 60 * 60 * 1000) return false;
        if (datePreset === "yesterday") {
          const d = NOW_REF - 24 * 60 * 60 * 1000;
          if (ts < d - 24 * 60 * 60 * 1000 || ts > d) return false;
        }
        if (datePreset === "week"  && ts < NOW_REF - 7  * 24 * 60 * 60 * 1000) return false;
        if (datePreset === "month" && ts < NOW_REF - 30 * 24 * 60 * 60 * 1000) return false;
        if (datePreset === "custom") {
          if (dateFrom && ts < new Date(dateFrom + "T00:00:00").getTime()) return false;
          if (dateTo   && ts > new Date(dateTo   + "T23:59:59").getTime()) return false;
        }
      }
      if (search) {
        const q = search.toLowerCase();
        const hay = [r.id, r.cameraName, r.cameraId, r.areaName, r.siteName, r.dateLabel].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "oldest")        return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      if (sort === "duration-desc") return b.durationSeconds - a.durationSeconds;
      if (sort === "events-desc")   return b.eventCount - a.eventCount;
      return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
    });
    return list;
  }, [recordings, kpiFilter, filters, search, sort, datePreset, dateFrom, dateTo]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const drawerRecording = drawerId ? recordings.find((r) => r.id === drawerId) ?? null : null;
  const hasFilters = !!(search || Object.values(filters).some((a) => a.length > 0) || kpiFilter !== "all" || datePreset !== "all");

  function handleCreateCase(rec: RecordingDisplay, events: DetectionEvent[]) {
    setCreateCaseFor({ rec, events });
  }

  function handleBulkDelete(ids: string[]) {
    const count = ids.length;
    setRecordings((curr) => curr.filter((r) => !ids.includes(r.id)));
    setSelectedIds(new Set());
    toast.success(`${count} recording${count === 1 ? "" : "s"} deleted`);
  }
  function handleDeleteRecording(id: string) {
    const rec = recordings.find((r) => r.id === id);
    setRecordings((curr) => curr.filter((r) => r.id !== id));
    setSelectedIds((curr) => { const next = new Set(curr); next.delete(id); return next; });
    if (drawerId === id) setDrawerId(null);
    toast.success(`Recording ${rec?.id ?? id} deleted`);
  }
  function toggleRecording(id: string) {
    setSelectedIds((curr) => {
      const next = new Set(curr);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function commitCreateCase(data: { title: string; severity: Severity; assignee: CaseAssignee; notes: string }) {
    if (!createCaseFor) return;
    const cam = MOCK_CAMERAS.find((c) => c.id === createCaseFor.rec.cameraId);
    const caseId = createCase({
      title: data.title,
      severity: data.severity,
      site: cam?.siteId ?? createCaseFor.rec.siteName.toLowerCase(),
      siteDisplay: createCaseFor.rec.siteName,
      assignedTo: data.assignee,
      incidentIds: createCaseFor.events.map((e) => e.id),
      notes: data.notes,
    });
    setCreateCaseFor(null);
    setDrawerId(null);
    toast.success(`Case ${caseId} created`, {
      description: `${createCaseFor.events.length} incidents linked from recording ${createCaseFor.rec.id}.`,
      action: { label: "Open", onClick: () => navigate("/incidents", { state: { openCaseId: caseId } }) },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Recordings</PageHeader.Title>
          <PageHeader.Description>
            Browse all camera recordings — replay footage, link incidents and escalate to incident cases.
          </PageHeader.Description>
        </PageHeader.Content>
      </PageHeader>

      <KpiGrid cols={4}>
        {KPI_CONFIGS.map((cfg) => (
          <KpiCard key={cfg.key}
            label={cfg.label}
            value={cfg.getValue(recordings)}
            sub={cfg.sub}
            accent={cfg.accent}
            active={kpiFilter === cfg.key}
            onClick={() => { setKpiFilter((c) => (c === cfg.key ? "all" : cfg.key)); setPage(1); }} />
        ))}
      </KpiGrid>

      <DateRangeBar
        presets={DATE_PRESETS}
        active={datePreset}
        onSelect={(k) => { setDatePreset(k as DatePreset); if (k !== "custom") { setDateFrom(""); setDateTo(""); } setPage(1); }}
        customFrom={dateFrom}
        customTo={dateTo}
        onCustomChange={(f, t) => { setDateFrom(f); setDateTo(t); }}
        onCustomApply={(f, t) => { setDateFrom(f); setDateTo(t); setPage(1); }}
        onCustomReset={() => { setDatePreset("all"); setDateFrom(""); setDateTo(""); setPage(1); }}
        onClear={
          datePreset !== "all" || dateFrom || dateTo
            ? () => { setDatePreset("all"); setDateFrom(""); setDateTo(""); setPage(1); }
            : undefined
        }
      />

      <FilterPanel filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-base text-muted-foreground">
          <strong className="text-foreground">{filtered.length}</strong>{" "}
          recording{filtered.length === 1 ? "" : "s"} match current filters
          {hasFilters && (
            <button onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); setKpiFilter("all"); setDatePreset("all"); setDateFrom(""); setDateTo(""); }}
              className="ml-2 text-muted-foreground underline hover:text-primary">
              Clear filters
            </button>
          )}
        </p>
        <div className="flex items-center gap-2">
          <Popover open={sortOpen} onOpenChange={setSortOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-1.5">
                {SORT_OPTIONS.find((o) => o.key === sort)?.label}
                <ChevronDown className="size-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-1">
              {SORT_OPTIONS.map((o) => (
                <button key={o.key} onClick={() => { setSort(o.key); setSortOpen(false); }}
                  className={cn("flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted", sort === o.key ? "text-primary" : "text-foreground")}>
                  {o.label}
                  {sort === o.key && <Check className="size-3.5" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <Film className="size-10 opacity-20" />
          <p className="text-sm">No recordings match the current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((r) => {
            const periodCount = periodsForRecording(r).length;
            const isSelected = selectedIds.has(r.id);
            return (
              <div key={r.id}
                className={cn("group relative flex flex-col items-stretch rounded-xl border bg-card text-left transition-all hover:-translate-y-px hover:shadow-lg",
                  isSelected ? "border-primary" : "border-border hover:border-primary/40")}>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleRecording(r.id); }}
                  className={cn("absolute left-2.5 top-2.5 z-20 flex size-5 items-center justify-center rounded border-2 transition-colors",
                    isSelected ? "border-primary bg-primary" : "border-white/60 bg-black/40 hover:border-white opacity-0 group-hover:opacity-100",
                    isSelected && "opacity-100")}
                  aria-label="Select recording for deletion">
                  {isSelected && <Check className="size-3 text-primary-foreground" strokeWidth={3} />}
                </button>
                <button onClick={() => setDrawerId(r.id)}
                  className="flex flex-col items-stretch text-left">
                <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-neutral-900">
                  <div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 50% 60%, rgba(180,140,80,0.18) 0%, rgba(60,40,20,0.1) 40%, rgba(0,0,0,0.95) 100%)" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex size-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-transform group-hover:scale-110">
                      <Play className="size-4 text-white" />
                    </div>
                  </div>
                  <div className="absolute right-2.5 top-2.5 rounded bg-black/60 px-1.5 py-0.5 font-mono text-2xs text-white/90 backdrop-blur-sm">{r.durationDisplay}</div>
                  {/* Mode chip sits flush-left; shifts right only while the (hover-only) checkbox is shown. */}
                  <div className={cn("absolute top-2.5 transition-all", isSelected ? "left-9" : "left-2.5 group-hover:left-9")}>
                    <RecordingModeChip mode={r.mode} />
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 text-2xs text-white/90">
                    <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono backdrop-blur-sm">{r.startsAtDisplay}</span>
                    <span className="rounded bg-black/60 px-1.5 py-0.5 backdrop-blur-sm">{r.fileSizeDisplay}</span>
                  </div>
                </div>
                <div className="p-3.5">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <TruncatedText
                      text={r.cameraName}
                      className="text-base font-bold text-foreground transition-colors group-hover:text-primary"
                    />
                    <p className="flex-shrink-0 font-mono text-2xs text-muted-foreground">{r.id}</p>
                  </div>
                  <p className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-2.5" />
                    {r.areaName} · {r.siteName}
                  </p>
                  <div className="flex items-center justify-between border-t border-border/60 pt-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-1.5 py-0.5 text-2xs font-semibold text-success">
                      <CircleDot className="size-2.5" />
                      {r.eventCount} events
                    </span>
                    {periodCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-2xs text-sev-critical">
                        <AlertTriangle className="size-2.5" />
                        {periodCount} detected
                      </span>
                    )}
                    <span className="font-mono text-2xs text-muted-foreground">{r.dateLabel}</span>
                  </div>
                </div>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {`${(page - 1) * pageSize + 1} – ${Math.min(page * pageSize, filtered.length)} of ${filtered.length}`}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40">
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="px-2 text-sm text-foreground">
              {page} <span className="text-muted-foreground/60">of {pageCount}</span>
            </span>
            <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount}
              className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40">
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      <RecordingDrawer recording={drawerRecording} open={drawerId !== null} onClose={() => setDrawerId(null)}
        onCreateCase={handleCreateCase} onOpenEvent={(e) => setOpenEvent(e)}
        onDeleteRecording={handleDeleteRecording} />

      <EventDrawer event={openEvent} open={openEvent !== null}
        onClose={() => setOpenEvent(null)}
        onEscalate={() => setOpenEvent(null)} onDismiss={() => setOpenEvent(null)} />

      <CreateCaseModal open={createCaseFor !== null} recording={createCaseFor?.rec ?? null}
        selectedEvents={createCaseFor?.events ?? []}
        onClose={() => setCreateCaseFor(null)} onConfirm={commitCreateCase} />

      {/* Floating selection bar — mirrors Detection Feed */}
      {selectedIds.size > 0 && (
        <div className="fixed inset-x-6 bottom-6 z-50 mx-auto flex max-w-4xl flex-wrap items-center gap-3 rounded-xl border border-primary bg-card px-4 py-3 shadow-[0_16px_48px_hsl(var(--primary)/0.25)]">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Check className="size-3.5" strokeWidth={3} />
            </div>
            <span className="text-base font-semibold text-foreground">
              {selectedIds.size} recording{selectedIds.size > 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <Button variant="ghost" className="gap-1.5 text-sm text-muted-foreground"
              onClick={() => setSelectedIds(new Set())}>
              <X className="size-3.5" />
              Clear selection
            </Button>
            <div className="mx-1 h-4 w-px bg-border" />
            <Button variant="outline" className="gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10"
              onClick={() => handleBulkDelete([...selectedIds])}>
              <Trash2 className="size-3.5" />
              Delete {selectedIds.size}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
