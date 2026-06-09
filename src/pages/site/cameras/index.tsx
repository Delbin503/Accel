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
  Plus,
  Video,
  WifiOff,
  AlertTriangle,
  HardDrive,
  MapPin,
  Calendar,
  Trash2,
  MoreHorizontal,
  Pencil,
  Clock,
  Play,
  Link2,
  Cpu,
  Radio,
  CircleDot,
  FileVideo,
  Layers,
  Unlink,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { CAMERA_SITES, CAMERA_AREAS } from "@/mocks/cameras";
import { useCamerasStore } from "@/stores/useCamerasStore";
import { MOCK_NVRS } from "@/mocks/nvr";
import { MOCK_DEPLOYMENTS } from "@/mocks/deployments";
import { getRecordingsForCamera, type RecordingDisplay } from "@/mocks/recordings";
import type { CameraData, CameraStatus, BoundaryZone } from "@/types/cameras";
import { KpiCard, KpiGrid, type KpiAccent } from "@/components/shared/KpiCard";
import { TruncatedText } from "@/components/shared/TruncatedText";
import type { DeploymentData } from "@/types/deployments";

/* ── Status pill ─────────────────────────────────────────────────────────── */

const STATUS_STYLES: Record<CameraStatus, { bg: string; text: string; dot: string; label: string }> = {
  online:              { bg: "bg-success/15 border-success/30",           text: "text-success",          dot: "bg-success",          label: "Online" },
  offline:             { bg: "bg-muted border-border",                    text: "text-muted-foreground", dot: "bg-muted-foreground", label: "Offline" },
  "connection-failed": { bg: "bg-sev-critical/15 border-sev-critical/30", text: "text-sev-critical",     dot: "bg-sev-critical",     label: "Failed" },
};

function StatusPill({ status }: { status: CameraStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        s.bg,
        s.text
      )}
    >
      <span className={cn("size-1.5 flex-shrink-0 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

/* ── KPI cards ───────────────────────────────────────────────────────────── */

type KpiFilter = "all" | "online" | "offline" | "connection-failed" | "unlinked";

const KPI_CONFIGS: {
  key: KpiFilter;
  label: string;
  sub: string;
  accent: KpiAccent;
  getValue: (items: CameraData[]) => number;
}[] = [
  { key: "all",               label: "Total Cameras",     sub: "Across all sites",        accent: "primary",      getValue: (i) => i.length },
  { key: "online",            label: "Online",            sub: "Streaming + healthy",     accent: "success",      getValue: (i) => i.filter((c) => c.status === "online").length },
  { key: "offline",           label: "Offline",           sub: "Last seen > threshold",   accent: "muted",        getValue: (i) => i.filter((c) => c.status === "offline").length },
  { key: "connection-failed", label: "Connection Failed", sub: "RTSP unreachable",        accent: "sev-critical", getValue: (i) => i.filter((c) => c.status === "connection-failed").length },
  { key: "unlinked",          label: "Unlinked to NVR",   sub: "Events have no footage",  accent: "warning",      getValue: (i) => !i ? 0 : i.filter((c) => !c.nvrId).length },
];

/* ── Multi-select dropdown ───────────────────────────────────────────────── */

interface FilterOption { value: string; label: string }

function FilterDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly FilterOption[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
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
            "flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2 text-[13px] transition-colors hover:border-primary",
            open ? "border-primary" : "border-border",
            hasValue ? "text-primary" : "text-muted-foreground"
          )}
        >
          <TruncatedText text={displayLabel} className="font-medium" />
          <ChevronDown
            className={cn("size-3.5 flex-shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
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
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground"
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

/* ── Filter panel ────────────────────────────────────────────────────────── */

interface CameraFilters {
  site: string[];
  area: string[];
  status: string[];
  nvr: string[];
}
const EMPTY_FILTERS: CameraFilters = { site: [], area: [], status: [], nvr: [] };


function FilterPanel({
  filters,
  onChange,
  search,
  onSearchChange,
}: {
  filters: CameraFilters;
  onChange: (f: CameraFilters) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const filterCount = Object.values(filters).reduce((s, arr) => s + arr.length, 0);
  const activeCount = filterCount + (search ? 1 : 0);

  function setGroup(group: keyof CameraFilters, values: string[]) {
    onChange({ ...filters, [group]: values });
  }

  const NVR_OPTS = MOCK_NVRS.map((n) => ({ value: n.id, label: n.name }));

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-muted/30"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <SlidersHorizontal className="size-4 flex-shrink-0 text-muted-foreground" />
          <span className="text-[13px] font-semibold text-foreground">Filters</span>
          {activeCount > 0 ? (
            <span className="rounded-full bg-primary px-2 py-px text-[11px] font-semibold text-primary-foreground">
              {activeCount} active
            </span>
          ) : (
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {["All sites", "All areas", "All NVRs"].map((l) => (
                <span
                  key={l}
                  className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground"
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
              onClick={(e) => { e.stopPropagation(); onChange(EMPTY_FILTERS); onSearchChange(""); }}
              className="text-[12px] text-muted-foreground underline hover:text-primary"
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
              placeholder="Search by ID, name, IP, or NVR…"
              className="h-9 w-full pl-9 text-[13px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { key: "site"   as const, label: "Site",   opts: CAMERA_SITES },
              { key: "area"   as const, label: "Area",   opts: CAMERA_AREAS },
              { key: "nvr"    as const, label: "NVR",    opts: NVR_OPTS },
            ].map(({ key, label, opts }) => (
              <div key={key}>
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </div>
                <FilterDropdown
                  label={`All ${label.toLowerCase()}s`}
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

/* ── Drawer sub-components ───────────────────────────────────────────────── */

function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {children}
      </span>
      {aside}
    </div>
  );
}

// Unified compact StatCard — delegates to the shared KpiCard so accent bar + sizing match.
function StatCard({
  label,
  value,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  icon: _icon,
  valueClass,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  valueClass?: string;
  sub?: string;
}) {
  // Derive accent from valueClass (text-success / text-info / text-sev-critical / text-warning).
  const accent: KpiAccent =
    valueClass?.includes("text-success")      ? "success" :
    valueClass?.includes("text-info")         ? "info" :
    valueClass?.includes("text-sev-critical") ? "sev-critical" :
    valueClass?.includes("text-warning")      ? "warning" :
    valueClass?.includes("text-purple")       ? "purple" :
    "primary";
  return <KpiCard compact label={label} value={value} sub={sub} accent={accent} />;
}

/* ── Deployment status pill (mini, drawer-only) ──────────────────────────── */

// Status colors mirror the Model Deployment History KPI cards exactly:
//   active=success  paused=warning  pending=info  stopped=muted  failed=sev-critical
const DEPLOY_STATUS_STYLES: Record<DeploymentData["status"], { bg: string; text: string; dot: string; label: string }> = {
  active:           { bg: "bg-success/15 border-success/30",           text: "text-success",          dot: "bg-success",          label: "Active" },
  paused:           { bg: "bg-warning/15 border-warning/30",           text: "text-warning",          dot: "bg-warning",          label: "Paused" },
  "pending-camera": { bg: "bg-info/15 border-info/30",                 text: "text-info",             dot: "bg-info",             label: "Pending" },
  stopped:          { bg: "bg-muted border-border",                    text: "text-muted-foreground", dot: "bg-muted-foreground", label: "Stopped" },
  failed:           { bg: "bg-sev-critical/15 border-sev-critical/30", text: "text-sev-critical",     dot: "bg-sev-critical",     label: "Failed" },
};

function DeployStatusPill({ status }: { status: DeploymentData["status"] }) {
  const s = DEPLOY_STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        s.bg,
        s.text
      )}
    >
      <span className={cn("size-1.5 flex-shrink-0 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

/* ── Recording mode chip ─────────────────────────────────────────────────── */

const RECORDING_MODE_STYLES: Record<RecordingDisplay["mode"], { bg: string; text: string; label: string }> = {
  continuous: { bg: "bg-primary/10 border-primary/20",     text: "text-primary",    label: "Continuous" },
  event:      { bg: "bg-info/10 border-info/20",           text: "text-info",       label: "Event" },
  scheduled:  { bg: "bg-purple-soft border-purple/20",     text: "text-purple",     label: "Scheduled" },
};

function RecordingModeChip({ mode }: { mode: RecordingDisplay["mode"] }) {
  const s = RECORDING_MODE_STYLES[mode];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        s.bg,
        s.text
      )}
    >
      {s.label}
    </span>
  );
}

/* ── Recording card ──────────────────────────────────────────────────────── */

function RecordingCard({ r, isSelected, onToggle, onOpen }: {
  r: RecordingDisplay; isSelected: boolean; onToggle: () => void; onOpen: () => void;
}) {
  return (
    <div className={cn("group relative flex flex-col items-stretch overflow-hidden rounded-xl border bg-card text-left transition-all hover:-translate-y-px hover:shadow-md",
      isSelected ? "border-primary" : "border-border hover:border-primary/40")}>
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={cn("absolute left-2.5 top-2.5 z-20 flex size-5 items-center justify-center rounded border-2 transition-colors",
          isSelected ? "border-primary bg-primary" : "border-white/60 bg-black/40 hover:border-white opacity-0 group-hover:opacity-100",
          isSelected && "opacity-100")}
        aria-label="Select recording for deletion">
        {isSelected && <Check className="size-3 text-primary-foreground" strokeWidth={3} />}
      </button>
      <button onClick={onOpen} className="flex flex-col items-stretch text-left">
        <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
          <div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 50% 60%, rgba(180,140,80,0.18) 0%, rgba(60,40,20,0.1) 40%, rgba(0,0,0,0.95) 100%)" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-transform group-hover:scale-110">
              <Play className="size-4 text-white" />
            </div>
          </div>
          <div className="absolute right-2.5 top-2.5 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white/90 backdrop-blur-sm">{r.durationDisplay}</div>
          <div className="absolute left-9 top-2.5"><RecordingModeChip mode={r.mode} /></div>
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 text-[10px] text-white/90">
            <span className="rounded bg-black/60 px-1.5 py-0.5 font-mono backdrop-blur-sm">{r.startsAtDisplay}</span>
            <span className="rounded bg-black/60 px-1.5 py-0.5 backdrop-blur-sm">{r.fileSizeDisplay}</span>
          </div>
        </div>
        <div className="p-3.5">
          <div className="mb-1 flex items-start justify-between gap-2">
            <TruncatedText text={`Recording · ${r.dateLabel}`} className="text-[13px] font-bold text-foreground transition-colors group-hover:text-primary" />
            <p className="flex-shrink-0 font-mono text-[10px] text-muted-foreground">{r.id}</p>
          </div>
          <p className="mb-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="size-2.5" />
            {r.areaName}
          </p>
          <div className="flex items-center justify-between border-t border-border/60 pt-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">
              <CircleDot className="size-2.5" />
              {r.eventCount} events
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">{r.durationDisplay}</span>
          </div>
        </div>
      </button>
    </div>
  );
}

/* ── Draw zone modal ─────────────────────────────────────────────────────── */

function DrawZoneModal({ open, cameraName, existingZones, onClose, onSave, onUpdateZone, onRemoveZone, onUpdateZoneBox }: {
  open: boolean;
  cameraName: string;
  existingZones: BoundaryZone[];
  onClose: () => void;
  onSave: (label: string, box: [number, number, number, number]) => void;
  onUpdateZone: (zoneId: string, label: string) => void;
  onRemoveZone: (zoneId: string) => void;
  onUpdateZoneBox: (zoneId: string, box: [number, number, number, number]) => void;
}) {
  const [label, setLabel] = React.useState("");
  // null = no draft, else a draft new zone the user is drawing/positioning
  const [draft, setDraft] = React.useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [editingZoneId, setEditingZoneId] = React.useState<string | null>(null);
  const [editingLabel, setEditingLabel] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const drawRef = React.useRef<{ startX: number; startY: number; mode: "draw" | "move" | null }>({ startX: 0, startY: 0, mode: null });

  React.useEffect(() => {
    if (open) {
      setLabel("");
      setDraft(null);
      setEditingZoneId(null);
      setEditingLabel("");
    }
  }, [open]);

  // Live-edited box for the currently-edited existing zone
  const editingZone = editingZoneId ? existingZones.find((z) => z.id === editingZoneId) : null;

  if (!open) return null;

  function normalizedPoint(e: MouseEvent | React.MouseEvent): [number, number] {
    const el = containerRef.current;
    if (!el) return [0, 0];
    const r = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    return [x, y];
  }

  function onMouseDownContainer(e: React.MouseEvent) {
    // If user clicks on an existing zone, that zone's handler runs instead.
    if ((e.target as HTMLElement).closest("[data-zone-box]")) return;
    if ((e.target as HTMLElement).closest("[data-existing-zone]")) return;
    // Empty canvas click → start a new draft box
    setEditingZoneId(null);
    const [x, y] = normalizedPoint(e);
    drawRef.current = { startX: x, startY: y, mode: "draw" };
    setDraft({ x, y, w: 0, h: 0 });
    const onMove = (ev: MouseEvent) => {
      const ctx = drawRef.current;
      if (!ctx || ctx.mode !== "draw") return;
      const [cx, cy] = normalizedPoint(ev);
      setDraft({
        x: Math.min(ctx.startX, cx),
        y: Math.min(ctx.startY, cy),
        w: Math.abs(cx - ctx.startX),
        h: Math.abs(cy - ctx.startY),
      });
    };
    const onUp = () => {
      drawRef.current.mode = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // Generic drag-to-move for any rectangle. updateFn receives the new (x, y).
  function dragBox(e: React.MouseEvent, current: { x: number; y: number; w: number; h: number }, updateFn: (x: number, y: number) => void) {
    e.stopPropagation();
    const [px, py] = normalizedPoint(e);
    const offsetX = px - current.x;
    const offsetY = py - current.y;
    drawRef.current.mode = "move";
    const onMove = (ev: MouseEvent) => {
      if (drawRef.current.mode !== "move") return;
      const [cx, cy] = normalizedPoint(ev);
      const nx = Math.max(0, Math.min(1 - current.w, cx - offsetX));
      const ny = Math.max(0, Math.min(1 - current.h, cy - offsetY));
      updateFn(nx, ny);
    };
    const onUp = () => {
      drawRef.current.mode = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // Generic corner-resize for any rectangle.
  function resizeBox(e: React.MouseEvent, current: { x: number; y: number }, updateFn: (w: number, h: number) => void) {
    e.stopPropagation();
    const onMove = (ev: MouseEvent) => {
      const [cx, cy] = normalizedPoint(ev);
      const w = Math.max(0.05, Math.min(1 - current.x, cx - current.x));
      const h = Math.max(0.05, Math.min(1 - current.y, cy - current.y));
      updateFn(w, h);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function commit() {
    if (!draft || !label.trim() || draft.w < 0.05 || draft.h < 0.05) return;
    onSave(label.trim(), [draft.x, draft.y, draft.x + draft.w, draft.y + draft.h]);
    setLabel("");
    setDraft(null);
  }

  function moveExistingZone(zoneId: string, nx: number, ny: number) {
    const z = existingZones.find((x) => x.id === zoneId);
    if (!z) return;
    const w = z.box[2] - z.box[0];
    const h = z.box[3] - z.box[1];
    onUpdateZoneBox(zoneId, [nx, ny, nx + w, ny + h]);
  }

  function resizeExistingZone(zoneId: string, nw: number, nh: number) {
    const z = existingZones.find((x) => x.id === zoneId);
    if (!z) return;
    onUpdateZoneBox(zoneId, [z.box[0], z.box[1], z.box[0] + nw, z.box[1] + nh]);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[840px] max-w-[95vw] flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Edit Detection Zones</DialogTitle>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            View, draw and edit boundary zones on <strong className="text-foreground">{cameraName}</strong>.
            Drag on empty canvas to create a new zone · click any zone to edit it · drag corner handles to resize.
          </p>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-5">
          {/* Camera canvas — bigger so zones are easier to manipulate */}
          <div
            ref={containerRef}
            onMouseDown={onMouseDownContainer}
            className="relative aspect-video w-full cursor-crosshair select-none overflow-hidden rounded-lg border-2 border-border bg-neutral-950"
            style={{ background: "radial-gradient(120% 80% at 40% 60%, rgba(180,140,80,0.22) 0%, rgba(40,30,15,0.1) 45%, rgba(0,0,0,0.95) 100%)" }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 3px)" }} />
            <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-sev-critical/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
              LIVE
            </span>
            <span className="pointer-events-none absolute right-3 top-3 rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white/85 backdrop-blur-sm">{cameraName}</span>

            {/* Empty-state hint */}
            {existingZones.length === 0 && !draft && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="rounded-lg border border-dashed border-white/30 bg-black/40 px-4 py-2 text-center text-[11px] text-white/70 backdrop-blur-sm">
                  Click and drag anywhere on the canvas to draw a new zone
                </div>
              </div>
            )}

            {/* Existing zones */}
            {existingZones.map((z, i) => {
              const [x0, y0, x1, y1] = z.box;
              const w = x1 - x0;
              const h = y1 - y0;
              const isEditing = editingZoneId === z.id;
              return (
                <div
                  key={z.id}
                  data-existing-zone
                  onMouseDown={(e) => {
                    if (!isEditing) {
                      // First click: enter edit mode
                      e.stopPropagation();
                      setEditingZoneId(z.id);
                      setEditingLabel(z.label);
                      return;
                    }
                    // Already editing → drag to move
                    dragBox(e, { x: x0, y: y0, w, h }, (nx, ny) => moveExistingZone(z.id, nx, ny));
                  }}
                  className={cn(
                    "absolute border-2 transition-colors",
                    isEditing
                      ? "cursor-move border-warning bg-warning/20 ring-2 ring-warning/40"
                      : "cursor-pointer border-info bg-info/15 hover:border-info/80 hover:bg-info/25"
                  )}
                  style={{
                    left: `${x0 * 100}%`, top: `${y0 * 100}%`,
                    width: `${w * 100}%`, height: `${h * 100}%`,
                  }}
                >
                  <span className={cn(
                    "absolute -top-5 left-0 rounded px-1.5 py-px font-mono text-[10px] font-bold",
                    isEditing ? "bg-warning text-neutral-900" : "bg-info text-white"
                  )}>
                    {i + 1}. {z.label}{isEditing && " · editing"}
                  </span>
                  {/* Corner resize handle (only when editing) */}
                  {isEditing && (
                    <div onMouseDown={(e) => resizeBox(e, { x: x0, y: y0 }, (nw, nh) => resizeExistingZone(z.id, nw, nh))}
                      className="absolute -bottom-1.5 -right-1.5 z-10 size-4 cursor-nwse-resize rounded-sm border-2 border-warning bg-warning"
                      title="Resize" />
                  )}
                </div>
              );
            })}

            {/* Draft (new) zone */}
            {draft && draft.w > 0 && draft.h > 0 && (
              <div
                data-zone-box
                onMouseDown={(e) => dragBox(e, draft, (nx, ny) => setDraft((d) => d && ({ ...d, x: nx, y: ny })))}
                className="absolute cursor-move border-2 border-primary bg-primary/20 ring-2 ring-primary/40"
                style={{
                  left: `${draft.x * 100}%`, top: `${draft.y * 100}%`,
                  width: `${draft.w * 100}%`, height: `${draft.h * 100}%`,
                }}
              >
                <span className="absolute -top-5 left-0 rounded bg-primary px-1.5 py-px text-[10px] font-bold text-primary-foreground">
                  {label || "New zone"}
                </span>
                <div onMouseDown={(e) => resizeBox(e, draft, (nw, nh) => setDraft((d) => d && ({ ...d, w: nw, h: nh })))}
                  className="absolute -bottom-1.5 -right-1.5 z-10 size-4 cursor-nwse-resize rounded-sm border-2 border-primary bg-primary"
                  title="Resize" />
              </div>
            )}
          </div>

          {/* Both editor cards always render when applicable so user can draw AND edit names simultaneously */}
          <div className="mt-4 space-y-3">
            {/* New zone form — appears when user has dragged a draft */}
            {draft && (
              <div className="grid grid-cols-1 gap-3 rounded-lg border border-primary/40 bg-primary/[0.04] p-3 sm:grid-cols-[1fr_auto]">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-primary">
                    <Plus className="-mt-0.5 mr-1 inline size-3" /> Name your new zone
                  </label>
                  <Input value={label} onChange={(e) => setLabel(e.target.value)}
                    autoFocus placeholder="e.g. Entrance, Counter, Loading Dock…"
                    onKeyDown={(e) => { if (e.key === "Enter" && label.trim() && draft.w >= 0.05) commit(); }}
                    className="h-9 text-[13px]" />
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Box: [{draft.x.toFixed(2)}, {draft.y.toFixed(2)}, {(draft.x + draft.w).toFixed(2)}, {(draft.y + draft.h).toFixed(2)}]
                  </p>
                </div>
                <div className="flex items-end gap-1.5">
                  <Button variant="ghost" size="sm" onClick={() => { setDraft(null); setLabel(""); }}>Discard</Button>
                  <Button disabled={!label.trim() || draft.w < 0.05 || draft.h < 0.05} onClick={commit} className="gap-1.5">
                    <Check className="size-3.5" />
                    Add Zone
                  </Button>
                </div>
              </div>
            )}

            {/* Rename form — appears when user clicked an existing zone */}
            {editingZone && (
              <div className="rounded-lg border border-warning/40 bg-warning/[0.06] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-warning">
                    <Pencil className="-mt-0.5 mr-1 inline size-3" />
                    Renaming zone {existingZones.findIndex((z) => z.id === editingZone.id) + 1}
                  </label>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    [{editingZone.box.map((n) => n.toFixed(2)).join(", ")}]
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input value={editingLabel} onChange={(e) => setEditingLabel(e.target.value)}
                    autoFocus placeholder="Zone name"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && editingLabel.trim()) {
                        onUpdateZone(editingZone.id, editingLabel.trim());
                        setEditingZoneId(null);
                      }
                      if (e.key === "Escape") setEditingZoneId(null);
                    }}
                    className="h-9 flex-1 text-[13px]" />
                  <Button size="sm" className="gap-1.5"
                    disabled={!editingLabel.trim() || editingLabel === editingZone.label}
                    onClick={() => { onUpdateZone(editingZone.id, editingLabel.trim()); setEditingZoneId(null); }}>
                    <Check className="size-3" />
                    Save Name
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingZoneId(null)}>Cancel</Button>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  You can also drag the highlighted zone on the canvas to reposition · drag its corner handle to resize.
                </p>
              </div>
            )}

            {/* Default hint when nothing is being drawn or edited */}
            {!draft && !editingZone && (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-3 text-center text-[11px] text-muted-foreground">
                Drag on the canvas above to create a new zone · click any existing zone (or its row below) to rename it.
              </div>
            )}
          </div>

          {/* Existing zones list — click on row OR canvas to edit */}
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Current zones ({existingZones.length})
            </p>
            {existingZones.length === 0 ? (
              <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-[12px] italic text-muted-foreground">
                No zones drawn yet. Draw one on the canvas above.
              </p>
            ) : (
              <div className="space-y-1.5">
                {existingZones.map((z, i) => {
                  const isEditing = editingZoneId === z.id;
                  return (
                    <div key={z.id}
                      className={cn(
                        "flex items-center gap-2 rounded-lg border bg-background px-3 py-2 transition-colors",
                        isEditing ? "border-warning bg-warning/[0.04]" : "border-border"
                      )}>
                      <span className={cn("font-mono text-[10px] font-bold", isEditing ? "text-warning" : "text-info")}>{i + 1}</span>
                      <span className="rounded bg-muted px-1.5 py-px font-mono text-[10px] text-muted-foreground">{z.id}</span>
                      <span className="flex-1 text-[13px] font-semibold text-foreground">{z.label}</span>
                      <span className="hidden font-mono text-[10px] text-muted-foreground/70 sm:inline">
                        [{z.box.map((n) => n.toFixed(2)).join(", ")}]
                      </span>
                      {/* Explicit Edit + Delete buttons (always visible) */}
                      <button
                        onClick={() => { setEditingZoneId(z.id); setEditingLabel(z.label); }}
                        className={cn(
                          "flex size-7 items-center justify-center rounded border transition-colors",
                          isEditing ? "border-warning bg-warning/15 text-warning"
                                    : "border-border text-muted-foreground hover:border-warning/40 hover:text-warning"
                        )}
                        title="Rename zone">
                        <Pencil className="size-3" />
                      </button>
                      <button onClick={() => { onRemoveZone(z.id); if (isEditing) setEditingZoneId(null); }}
                        className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-sev-critical/40 hover:text-sev-critical"
                        title="Remove zone">
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 justify-end gap-2 border-t border-border bg-card px-5 py-3.5">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Camera Drawer ───────────────────────────────────────────────────────── */

type DrawerTab = "overview" | "recordings";

const RECORDING_DATE_FILTERS: { key: string; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "today",     label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week",      label: "This Week" },
  { key: "month",     label: "This Month" },
  { key: "custom",    label: "Custom Date" },
];

/* ── Link NVR modal — pick an NVR + free channel at the camera's site ── */

function LinkNvrModal({
  open, camera, onClose, onLink,
}: {
  open: boolean;
  camera: CameraData | null;
  onClose: () => void;
  onLink: (cameraId: string, nvrId: string, nvrName: string, channel: number) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [selection, setSelection] = React.useState<{ nvrId: string; channel: number } | null>(null);

  React.useEffect(() => {
    if (open) { setSearch(""); setSelection(null); }
  }, [open]);

  if (!camera) return null;

  const siteNvrs = MOCK_NVRS.filter((n) => n.siteId === camera.siteId);

  // Build the candidate channel rows — only free channels are linkable.
  const rows = siteNvrs.flatMap((n) =>
    n.channels.map((ch) => ({
      nvrId: n.id,
      nvrName: n.name,
      nvrModel: n.model,
      nvrIp: n.ipAddress,
      channel: ch.channel,
      cameraId: ch.cameraId,
    }))
  );
  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) =>
        `${r.nvrId} ${r.nvrName} ${r.nvrModel} ${r.nvrIp} ch${r.channel} ${r.cameraId ?? ""}`.toLowerCase().includes(q)
      )
    : rows;

  function commit() {
    if (!selection || !camera) return;
    const row = rows.find((r) => r.nvrId === selection.nvrId && r.channel === selection.channel);
    if (!row) return;
    onLink(camera.id, row.nvrId, row.nvrName, row.channel);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">Link NVR Channel</DialogTitle>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Choose a channel for <span className="font-mono text-foreground">{camera.id}</span> · {camera.name}
          </p>
        </DialogHeader>
        <div className="border-b border-border px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by NVR name, model, IP or channel…" className="h-9 pl-9 text-[13px]" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {siteNvrs.length === 0 ? (
            <p className="py-8 text-center text-[12px] italic text-muted-foreground">
              No NVRs registered for this site yet.
            </p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-[12px] italic text-muted-foreground">No channels match "{search}".</p>
          ) : (
            <ul className="space-y-1">
              {filtered.map((r) => {
                const inUse = !!r.cameraId;
                const selected = selection?.nvrId === r.nvrId && selection?.channel === r.channel;
                return (
                  <li key={`${r.nvrId}-${r.channel}`}>
                    <button
                      disabled={inUse}
                      onClick={() => setSelection({ nvrId: r.nvrId, channel: r.channel })}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                        inUse ? "cursor-not-allowed border-border bg-muted/30 opacity-60"
                        : selected ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                      )}
                    >
                      <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-md bg-info/10 text-info">
                        <HardDrive className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
                          <TruncatedText text={r.nvrName} />
                          <span className="font-mono text-[10px] text-muted-foreground">Ch {String(r.channel).padStart(2, "0")}</span>
                        </p>
                        <TruncatedText text={`${r.nvrModel} · ${r.nvrIp}`} className="mt-0.5 text-[10px] text-muted-foreground" />
                      </div>
                      {inUse ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">In use · {r.cameraId}</span>
                      ) : (
                        <span className="rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">Available</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="flex flex-shrink-0 items-center justify-between gap-2 border-t border-border px-5 py-3.5">
          <Button onClick={commit} disabled={!selection} className="gap-1.5">
            <Link2 className="size-3.5" />
            Link Channel
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CameraDrawerProps {
  camera: CameraData | null;
  open: boolean;
  onClose: () => void;
  onOpenNvr: (nvrId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onUndeploy: (deploymentId: string) => void;
  onDeployNewModel: () => void;
  onLinkNvrRequest: (cameraId: string) => void;
  onUnlinkNvr: (cameraId: string) => void;
  onZoneAdd: (cameraId: string, label: string, box?: [number, number, number, number]) => void;
  onZoneRemove: (cameraId: string, zoneId: string) => void;
  onZoneUpdate: (cameraId: string, zoneId: string, label: string) => void;
  onZoneUpdateBox: (cameraId: string, zoneId: string, box: [number, number, number, number]) => void;
}

function CameraDrawer({
  camera,
  open,
  onClose,
  onOpenNvr,
  onEdit,
  onDelete,
  onUndeploy,
  onDeployNewModel,
  onLinkNvrRequest,
  onUnlinkNvr,
  onZoneAdd,
  onZoneRemove,
  onZoneUpdate,
  onZoneUpdateBox,
}: CameraDrawerProps) {
  const navigate = useNavigate();
  const [tab, setTab] = React.useState<DrawerTab>("overview");
  const [recordingSearch, setRecordingSearch] = React.useState("");
  const [recordingDate, setRecordingDate] = React.useState("all");
  const [customFrom, setCustomFrom] = React.useState("");
  const [customTo, setCustomTo] = React.useState("");
  const [selectedRecordingIds, setSelectedRecordingIds] = React.useState<Set<string>>(new Set());
  const [zonesEditing, setZonesEditing] = React.useState(false);
  const [zoneDrawOpen, setZoneDrawOpen] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setTab("overview");
      setRecordingSearch("");
      setRecordingDate("all");
      setCustomFrom("");
      setCustomTo("");
      setSelectedRecordingIds(new Set());
      setZonesEditing(false);
      setZoneDrawOpen(false);
    }
  }, [open, camera?.id]);

  const deployments = React.useMemo(
    () => (camera ? MOCK_DEPLOYMENTS.filter((d) => d.cameraId === camera.id) : []),
    [camera]
  );
  const recordings = React.useMemo(
    () => (camera ? getRecordingsForCamera(camera.id) : []),
    [camera]
  );
  const nvr = camera && camera.nvrId ? MOCK_NVRS.find((n) => n.id === camera.nvrId) : null;

  const filteredRecordings = recordings.filter((r) => {
    if (recordingSearch) {
      const q = recordingSearch.toLowerCase();
      if (!`${r.id} ${r.areaName} ${r.dateLabel}`.toLowerCase().includes(q)) return false;
    }
    if (recordingDate === "today") return r.dateLabel === "Today";
    if (recordingDate === "yesterday") return r.dateLabel === "Yesterday";
    if (recordingDate === "week") return r.dateLabel === "Today" || r.dateLabel === "Yesterday";
    if (recordingDate === "custom") {
      if (!customFrom && !customTo) return true;
      const startsAt = new Date(r.startsAt).getTime();
      if (customFrom) {
        const fromTs = new Date(customFrom + "T00:00:00").getTime();
        if (startsAt < fromTs) return false;
      }
      if (customTo) {
        const toTs = new Date(customTo + "T23:59:59").getTime();
        if (startsAt > toTs) return false;
      }
      return true;
    }
    return true;
  });

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="flex w-[min(860px,58vw)] max-w-[95vw] flex-col gap-0 p-0"
      >
        {/* Header */}
        <SheetHeader className="border-b border-border bg-card px-5 py-4">
          {camera ? (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                  <StatusPill status={camera.status} />
                </div>
                <div className="mb-1 flex items-center gap-2">
                  <SheetTitle className="min-w-0 text-[17px] font-bold"><TruncatedText text={camera.name} /></SheetTitle>
                  <span className="rounded border border-border bg-muted px-1.5 py-px font-mono text-[10px] text-muted-foreground">
                    {camera.id}
                  </span>
                </div>
                <p className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <MapPin className="size-3" />
                  {camera.siteName} · {camera.areaName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-0.5 flex size-7 flex-shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <SheetTitle className="text-[15px] text-muted-foreground">Camera not found</SheetTitle>
              <button
                onClick={onClose}
                className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {/* Tabs */}
          {camera && (
            <div className="mt-3 flex items-center gap-1 border-b border-transparent">
              {[
                { key: "overview" as const,   label: "Overview",   icon: Layers },
                { key: "recordings" as const, label: "Recordings", icon: FileVideo, badge: recordings.length },
              ].map(({ key, label, icon: Icon, badge }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold transition-colors",
                    tab === key
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                  {badge != null && badge > 0 && (
                    <span className="ml-0.5 rounded-full bg-muted px-1.5 py-px text-[10px] font-semibold text-muted-foreground">
                      {badge}
                    </span>
                  )}
                  {tab === key && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </SheetHeader>

        {/* Body */}
        {camera && tab === "overview" && (
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {/* Live feed */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(120% 80% at 50% 60%, rgba(180,140,80,0.18) 0%, rgba(60,40,20,0.1) 40%, rgba(0,0,0,0.95) 100%)",
                  }}
                />
                {camera.status === "online" ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
                      <Play className="size-5 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <WifiOff className="size-7 opacity-60" />
                    <p className="text-[11px]">Feed unavailable</p>
                  </div>
                )}
                <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm">
                  <span className="size-1.5 animate-pulse rounded-full bg-sev-critical" />
                  Live
                </div>
                <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white/80 backdrop-blur-sm">
                  {camera.siteName} / {camera.areaName}
                </div>
              </div>
            </div>

            {/* 3-up stat strip */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Recordings"
                value={recordings.length}
                icon={<FileVideo className="size-3 text-primary" />}
                sub="Last 14 days"
              />
              <StatCard
                label="Network"
                value={camera.status === "online" ? "Strong" : camera.status === "connection-failed" ? "Failed" : "Down"}
                valueClass={
                  camera.status === "online" ? "text-success"
                  : camera.status === "connection-failed" ? "text-sev-critical"
                  : "text-muted-foreground"
                }
                icon={<Radio className={cn(
                  "size-3",
                  camera.status === "online" ? "text-success"
                  : camera.status === "connection-failed" ? "text-sev-critical"
                  : "text-muted-foreground"
                )} />}
                sub={camera.lastSeenDisplay}
              />
              <StatCard
                label="NVR Status"
                value={nvr ? (nvr.status === "online" ? "Recording" : nvr.status === "degraded" ? "Degraded" : "Offline") : "Not Linked"}
                valueClass={
                  !nvr ? "text-warning"
                  : nvr.status === "online" ? "text-success"
                  : nvr.status === "degraded" ? "text-warning"
                  : "text-muted-foreground"
                }
                icon={<HardDrive className={cn(
                  "size-3",
                  !nvr ? "text-warning"
                  : nvr.status === "online" ? "text-success"
                  : nvr.status === "degraded" ? "text-warning"
                  : "text-muted-foreground"
                )} />}
                sub={nvr ? `${nvr.id} · Ch ${camera.channel}` : "Footage unavailable"}
              />
            </div>

            {/* Device Info — full KV grid */}
            <div>
              <SectionTitle>Device Info</SectionTitle>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-border bg-card p-4">
                {(
                  [
                    ["Camera Name",     camera.name],
                    ["Camera ID",       <span className="font-mono text-xs text-primary">{camera.id}</span>],
                    ["Status",          <StatusPill status={camera.status} />],
                    ["Last Activity",   camera.lastSeenDisplay],
                    ["Site Location",   camera.siteName],
                    ["Area Name",       camera.areaName],
                    ["IP Address",      <span className="font-mono text-xs">{camera.ipAddress}</span>],
                    ["RTSP Port",       <span className="font-mono text-xs">{camera.rtspPort}</span>],
                    ["Active Since",    camera.activeAtDisplay],
                    ["Events (24h)",    <span className="font-semibold">{camera.recentEventCount}</span>],
                    ["Active Models",   <span className="font-semibold">{deployments.filter((d) => d.status === "active").length}</span>],
                    ["Retention",       `${camera.recording.retentionDays} days`],
                  ] as [string, React.ReactNode][]
                ).map(([label, value]) => (
                  <div key={label as string} className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {label}
                    </span>
                    <span className="text-[13px] font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stream + Video Specs */}
            <div>
              <SectionTitle>Stream Specifications</SectionTitle>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg border border-border bg-card p-4">
                {(
                  [
                    ["Codec",         camera.stream.codec.toUpperCase()],
                    ["Resolution",    <span className="font-mono text-xs">{camera.stream.resolution}</span>],
                    ["Frame Rate",    `${camera.stream.frameRate} fps`],
                    ["Bitrate",       <span className="font-mono text-xs">{camera.recording.bitrateKbps} kbps</span>],
                    ["Schedule",      <span className="capitalize">{camera.recording.schedule.replace(/-/g, " ")}</span>],
                    ["RTSP URL",      <span className="break-all font-mono text-[11px] text-foreground">{camera.rtspUrl}</span>],
                  ] as [string, React.ReactNode][]
                ).map(([label, value]) => (
                  <div key={label as string} className={cn("flex flex-col gap-0.5", label === "RTSP URL" && "col-span-2")}>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {label}
                    </span>
                    <span className="text-[13px] font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NVR Storage */}
            <div>
              <SectionTitle>NVR Storage</SectionTitle>
              {nvr && camera.nvrId && camera.nvrName ? (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-3">
                  <button
                    onClick={() => onOpenNvr(camera.nvrId!)}
                    className="group flex min-w-0 flex-1 items-center gap-3 text-left transition-colors"
                  >
                    <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg border border-info/30 bg-info/10">
                      <HardDrive className="size-4 text-info" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <TruncatedText
                        text={camera.nvrName}
                        className="text-[13px] font-semibold text-foreground transition-colors group-hover:text-primary"
                      />
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {nvr.model} · {camera.nvrId} · Channel {camera.channel} · IP {nvr.ipAddress}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Used: <span className="font-semibold text-foreground">{nvr.usedStorageGb.toFixed(1)}</span> / {nvr.totalStorageGb.toFixed(1)} TB
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => onUnlinkNvr(camera.id)}
                    title="Unlink NVR"
                    className="inline-flex items-center gap-1.5 rounded-md border border-sev-critical/30 px-2.5 py-1 text-[11px] font-semibold text-sev-critical transition-colors hover:bg-sev-critical/10"
                  >
                    <Unlink className="size-3" />
                    Unlink
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/[0.06] px-3.5 py-3">
                  <AlertTriangle className="size-4 flex-shrink-0 text-warning" />
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold text-foreground">Not linked to any NVR</p>
                    <p className="text-[11px] text-muted-foreground">
                      Detection events from this camera will have no replayable footage.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onLinkNvrRequest(camera.id)}>
                    <Link2 className="size-3.5" />
                    Link NVR
                  </Button>
                </div>
              )}
            </div>

            {/* Deployed Models */}
            <div>
              <SectionTitle
                aside={
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={onDeployNewModel}>
                    <Plus className="size-3.5" />
                    Deploy Model
                  </Button>
                }
              >
                Deployed Models ({deployments.length})
              </SectionTitle>
              {deployments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center">
                  <Cpu className="mx-auto size-7 text-muted-foreground/40" />
                  <p className="mt-2 text-[12px] text-muted-foreground">
                    No models deployed to this camera yet.
                  </p>
                  <Button variant="ghost" size="sm" className="mt-2 gap-1.5" onClick={onDeployNewModel}>
                    <Plus className="size-3.5" />
                    Deploy a model
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {deployments.map((d) => (
                    <div
                      key={d.id}
                      className="w-full rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:border-primary/20 hover:bg-muted/30"
                    >
                      {/* Top row: icon + name/id + pills */}
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg border border-purple/30 bg-purple-soft">
                            <Cpu className="size-4 text-purple" />
                          </div>
                          <div className="min-w-0">
                            <TruncatedText
                              text={d.modelName}
                              className="text-[13px] font-bold text-foreground"
                            />
                            <p className="font-mono text-[11px] text-muted-foreground">{d.id}</p>
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-1.5">
                          <DeployStatusPill status={d.status} />
                          <span className="rounded-full border border-info/30 bg-info/10 px-2 py-0.5 text-[10px] font-semibold text-info">
                            {d.eventCount} events
                          </span>
                        </div>
                      </div>

                      {/* Meta row: deployed date + actor + last validation */}
                      <div className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="size-2.5" />
                          <strong className="text-foreground">Deployed</strong> {d.deployedAtDisplay}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          by <strong className="text-foreground">{d.deployedBy}</strong>
                        </span>
                        {d.lastValidationRunId && (
                          <span className="inline-flex items-center gap-1 font-mono">
                            Validation: <span className="text-success">{d.lastValidationRunId}</span>
                          </span>
                        )}
                      </div>

                      {/* Action footer */}
                      <div className="flex items-center justify-end border-t border-border/60 pt-2.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 border-sev-critical/30 text-sev-critical hover:bg-sev-critical/10"
                          onClick={() => onUndeploy(d.id)}
                        >
                          <Unlink className="size-3.5" />
                          Undeploy
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Boundary zones */}
            <div>
              <SectionTitle
                aside={
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setZonesEditing((v) => !v)}>
                    {zonesEditing ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                    {zonesEditing ? "Done" : "Add Zone"}
                  </Button>
                }
              >
                Boundary Zones ({camera.boundaryZones.length})
              </SectionTitle>
              {camera.boundaryZones.length === 0 && !zonesEditing ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-[12px] text-muted-foreground">
                  No zones drawn yet.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {camera.boundaryZones.map((z) => (
                    <div
                      key={z.id}
                      className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2"
                    >
                      <span className="font-mono text-[10px] text-muted-foreground">{z.id}</span>
                      <span className="text-[12px] font-medium text-foreground">{z.label}</span>
                      <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                        [{z.box.map((n) => n.toFixed(2)).join(", ")}]
                      </span>
                      {zonesEditing && (
                        <button onClick={() => onZoneRemove(camera.id, z.id)}
                          className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-sev-critical/10 hover:text-sev-critical"
                          title="Remove zone">
                          <Trash2 className="size-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {zonesEditing && (
                <div className="mt-2 flex items-center justify-end gap-2 rounded-lg border border-primary/30 bg-primary/[0.04] px-3 py-2">
                  <p className="mr-auto text-[11px] text-muted-foreground">
                    Draw the zone directly on the live camera view.
                  </p>
                  <Button onClick={() => setZoneDrawOpen(true)} className="gap-1.5">
                    <Plus className="size-3.5" />
                    Add Zone
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {camera && tab === "recordings" && (
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {/* Search + date filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={recordingSearch}
                  onChange={(e) => setRecordingSearch(e.target.value)}
                  placeholder="Search by recording ID or area…"
                  className="h-9 w-full pl-9 text-[13px]"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {RECORDING_DATE_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setRecordingDate(f.key)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-[12px] font-semibold transition-colors",
                      recordingDate === f.key
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {recordingDate === "custom" && (
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-background p-3">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      From
                    </label>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      max={customTo || undefined}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-[12px] text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      To
                    </label>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      min={customFrom || undefined}
                      className="h-8 w-full rounded-md border border-input bg-background px-2 text-[12px] text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <p className="text-[12px] text-muted-foreground">
              <strong className="text-foreground">{filteredRecordings.length}</strong>{" "}
              recording{filteredRecordings.length === 1 ? "" : "s"}
              {camera.nvrId && (
                <>
                  <span className="mx-1.5 text-muted-foreground/40">·</span>
                  Stored on {camera.nvrName} · Channel {camera.channel}
                </>
              )}
            </p>

            {/* Recordings grid */}
            {!camera.nvrId ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-muted-foreground">
                <FileVideo className="size-9 opacity-30" />
                <p className="text-[13px] font-medium">No NVR linked</p>
                <p className="max-w-xs text-center text-[11px]">
                  Link an NVR to start recording footage from this camera.
                </p>
                <Button variant="outline" size="sm" className="mt-2 gap-1.5" onClick={() => onLinkNvrRequest(camera.id)}>
                  <Link2 className="size-3.5" />
                  Link NVR
                </Button>
              </div>
            ) : filteredRecordings.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-16 text-muted-foreground">
                <FileVideo className="size-9 opacity-30" />
                <p className="text-[13px]">No recordings match this filter.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {filteredRecordings.map((r) => (
                    <RecordingCard
                      key={r.id}
                      r={r}
                      isSelected={selectedRecordingIds.has(r.id)}
                      onToggle={() => setSelectedRecordingIds((curr) => {
                        const next = new Set(curr);
                        next.has(r.id) ? next.delete(r.id) : next.add(r.id);
                        return next;
                      })}
                      onOpen={() => navigate("/recordings", { state: { openRecordingId: r.id } })}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Floating selection bar inside drawer */}
        {camera && tab === "recordings" && selectedRecordingIds.size > 0 && (
          <div className="absolute inset-x-4 bottom-20 z-40 mx-auto flex max-w-[640px] flex-wrap items-center gap-3 rounded-xl border border-primary bg-card px-4 py-3 shadow-[0_16px_48px_hsl(var(--primary)/0.25)]">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Check className="size-3.5" strokeWidth={3} />
              </div>
              <span className="text-[13px] font-semibold text-foreground">
                {selectedRecordingIds.size} recording{selectedRecordingIds.size > 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              <Button variant="ghost" className="gap-1.5 text-[12px] text-muted-foreground"
                onClick={() => setSelectedRecordingIds(new Set())}>
                <X className="size-3.5" />
                Clear selection
              </Button>
              <div className="mx-1 h-4 w-px bg-border" />
              <Button variant="outline" className="gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10"
                onClick={() => {
                  const count = selectedRecordingIds.size;
                  setSelectedRecordingIds(new Set());
                  toast.success(`${count} recording${count === 1 ? "" : "s"} deleted`);
                }}>
                <Trash2 className="size-3.5" />
                Delete {selectedRecordingIds.size}
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        {camera && (
          <div className="flex items-center gap-2 border-t border-border bg-card px-5 py-3.5">
            <Button size="sm" className="gap-1.5" onClick={onEdit}>
              <Pencil className="size-3.5" />
              Edit Camera
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto gap-1.5 border-sev-critical/40 text-sev-critical hover:bg-sev-critical/10"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
              Delete Camera
            </Button>
          </div>
        )}
      </SheetContent>
      {camera && (
        <DrawZoneModal
          open={zoneDrawOpen}
          cameraName={camera.name}
          existingZones={camera.boundaryZones}
          onClose={() => setZoneDrawOpen(false)}
          onSave={(label, box) => onZoneAdd(camera.id, label, box)}
          onUpdateZone={(zoneId, label) => onZoneUpdate(camera.id, zoneId, label)}
          onRemoveZone={(zoneId) => onZoneRemove(camera.id, zoneId)}
          onUpdateZoneBox={(zoneId, box) => onZoneUpdateBox(camera.id, zoneId, box)}
        />
      )}
    </Sheet>
  );
}

/* ── Camera form modal (Add + Edit) ──────────────────────────────────────── */

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_DAYS = [1, 2, 3, 4, 5]; // Mon–Fri

type RecordingMode = "continuous" | "scheduled";

interface CameraFormFields {
  id: string;
  name: string;
  siteId: string;
  areaId: string;
  ipAddress: string;
  /** String-typed in the form so empty inputs render as placeholders; parsed on submit. */
  rtspPort: string;
  rtspUrl: string;          // full RTSP URL the user provides (or auto-built from IP:port)
  resolution: string;
  /** String-typed in the form so empty inputs render as placeholders; parsed on submit. */
  frameRate: string;
  /** String-typed in the form so empty inputs render as placeholders; parsed on submit. */
  retentionDays: string;
  nvrId: string;
  channel: number | null;
  /** "" while the user hasn't picked yet — surfaces a "Select mode" placeholder option. */
  recordingMode: RecordingMode | "";
  scheduleDays: number[];
  scheduleStart: string;
  scheduleEnd: string;
}

function nextCameraId(takenIds: string[]): string {
  let n = 1;
  while (takenIds.includes(`Cam-${String(n).padStart(2, "0")}`)) n++;
  return `Cam-${String(n).padStart(2, "0")}`;
}

function emptyForm(takenIds: string[]): CameraFormFields {
  return {
    id: nextCameraId(takenIds),
    name: "",
    siteId: "",
    areaId: "",
    ipAddress: "",
    rtspPort: "",
    resolution: "",
    frameRate: "",
    retentionDays: "",
    nvrId: "",
    channel: null,
    rtspUrl: "",
    recordingMode: "",
    scheduleDays: [],
    scheduleStart: "",
    scheduleEnd: "",
  };
}

function fromCamera(c: CameraData): CameraFormFields {
  // Recording mode: derive from schedule shape. Always-on = continuous; otherwise scheduled.
  const mode: RecordingMode =
    c.recording.schedule === "always" ||
    ((c.recording.scheduleDays ?? []).length === 7 && (c.recording.scheduleStart ?? "00:00") <= "00:00" && (c.recording.scheduleEnd ?? "23:59") >= "23:59")
      ? "continuous"
      : "scheduled";
  return {
    id: c.id,
    name: c.name,
    siteId: c.siteId,
    areaId: c.areaId,
    ipAddress: c.ipAddress,
    rtspPort: String(c.rtspPort),
    rtspUrl: c.rtspUrl,
    resolution: c.stream.resolution,
    frameRate: String(c.stream.frameRate),
    retentionDays: String(c.recording.retentionDays),
    nvrId: c.nvrId ?? "",
    channel: c.channel,
    recordingMode: mode,
    scheduleDays: c.recording.scheduleDays ?? [...DEFAULT_DAYS],
    scheduleStart: c.recording.scheduleStart ?? "00:00",
    scheduleEnd: c.recording.scheduleEnd ?? "23:59",
  };
}

function FormField({ label, children, span = 1, hint }: { label: string; children: React.ReactNode; span?: 1 | 2; hint?: string }) {
  return (
    <div className={cn(span === 2 && "col-span-2")}>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
function TextInput({ value, onChange, mono, placeholder, type = "text", disabled }: { value: string | number; onChange: (v: string) => void; mono?: boolean; placeholder?: string; type?: "text" | "number"; disabled?: boolean }) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none",
        mono && "font-mono",
        disabled && "cursor-not-allowed opacity-60"
      )}
    />
  );
}
function FormSelect({ value, onChange, options, disabled }: { value: string; onChange: (v: string) => void; options: readonly { value: string; label: string }[]; disabled?: boolean }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground focus:border-primary focus:outline-none",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function CameraFormModal({
  open,
  mode,
  initial,
  takenIds,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "add" | "edit";
  initial: CameraFormFields | null;
  takenIds: string[];
  onClose: () => void;
  onSubmit: (fields: CameraFormFields) => void;
}) {
  const [fields, setFields] = React.useState<CameraFormFields>(() => emptyForm(takenIds));

  React.useEffect(() => {
    if (open) setFields(initial ?? emptyForm(takenIds));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  function set<K extends keyof CameraFormFields>(key: K, value: CameraFormFields[K]) {
    setFields((curr) => ({ ...curr, [key]: value }));
  }
  function toggleDay(day: number) {
    setFields((curr) => ({
      ...curr,
      scheduleDays: curr.scheduleDays.includes(day)
        ? curr.scheduleDays.filter((d) => d !== day)
        : [...curr.scheduleDays, day].sort((a, b) => a - b),
    }));
  }

  // NVRs available for the current site
  const siteNvrs = MOCK_NVRS.filter((n) => n.siteId === fields.siteId);
  const selectedNvr = MOCK_NVRS.find((n) => n.id === fields.nvrId);

  // Available channels for the selected NVR (free channels OR the channel this camera currently occupies)
  const availableChannels = React.useMemo(() => {
    if (!selectedNvr) return [] as number[];
    const ownChannel = mode === "edit" && initial?.nvrId === selectedNvr.id ? initial.channel : null;
    return selectedNvr.channels
      .filter((c) => !c.cameraId || c.channel === ownChannel)
      .map((c) => c.channel);
  }, [selectedNvr, mode, initial]);

  // When site changes, reset NVR if it's not at the new site
  React.useEffect(() => {
    if (fields.nvrId && selectedNvr && selectedNvr.siteId !== fields.siteId) {
      setFields((curr) => ({ ...curr, nvrId: "", channel: null }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.siteId]);

  // When NVR changes, ensure channel is valid; default to first available
  React.useEffect(() => {
    if (!fields.nvrId) {
      if (fields.channel != null) setFields((curr) => ({ ...curr, channel: null }));
      return;
    }
    if (availableChannels.length === 0) {
      if (fields.channel != null) setFields((curr) => ({ ...curr, channel: null }));
      return;
    }
    if (fields.channel == null || !availableChannels.includes(fields.channel)) {
      setFields((curr) => ({ ...curr, channel: availableChannels[0] }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.nvrId, availableChannels.length]);

  const canSubmit =
    fields.name.trim() &&
    fields.ipAddress.trim() &&
    (fields.recordingMode === "continuous" ||
      (fields.scheduleDays.length > 0 && fields.scheduleStart < fields.scheduleEnd));

  // In edit mode, keep Save disabled until the user actually changes something.
  const isDirty =
    mode === "add" || (initial != null && JSON.stringify(fields) !== JSON.stringify(initial));

  const nvrOptions = siteNvrs.length === 0
    ? [{ value: "", label: "— No NVR at this site —" }]
    : [{ value: "", label: "— None (unlinked) —" }, ...siteNvrs.map((n) => ({ value: n.id, label: `${n.name} (${n.id})` }))];

  const channelOptions = availableChannels.length === 0
    ? [{ value: "", label: "— No available channels —" }]
    : availableChannels.map((ch) => ({ value: String(ch), label: `Channel ${ch}` }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-border px-5 py-4">
          <DialogTitle className="text-base font-bold">
            {mode === "add" ? "Add Camera" : "Edit Camera"}
          </DialogTitle>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {mode === "add"
              ? "Register a new camera. Camera ID is generated automatically."
              : `Update fields for ${initial?.id}. Camera ID cannot be changed.`}
          </p>
        </DialogHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* Edit mode shows read-only ID */}
          {mode === "edit" && (
            <FormField label="Camera ID" span={2}>
              <TextInput value={fields.id} onChange={() => {}} mono disabled />
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Camera Name" span={2}>
              <TextInput
                value={fields.name}
                onChange={(v) => set("name", v)}
                placeholder="e.g. Loading Bay 3 — Dock"
              />
            </FormField>
            <FormField label="Site">
              <FormSelect
                value={fields.siteId}
                onChange={(v) => set("siteId", v)}
                options={[{ value: "", label: "Select a site" }, ...CAMERA_SITES]}
              />
            </FormField>
            <FormField label="Area">
              <FormSelect
                value={fields.areaId}
                onChange={(v) => set("areaId", v)}
                options={[{ value: "", label: "Select an area" }, ...CAMERA_AREAS]}
              />
            </FormField>
            <FormField label="IP Address">
              <TextInput
                value={fields.ipAddress}
                onChange={(v) => set("ipAddress", v)}
                placeholder="10.10.0.101"
                mono
              />
            </FormField>
            <FormField label="RTSP Port">
              <TextInput
                value={fields.rtspPort}
                onChange={(v) => set("rtspPort", v)}
                placeholder="554"
                type="number"
                mono
              />
            </FormField>
            <FormField label="Resolution">
              <FormSelect
                value={fields.resolution}
                onChange={(v) => set("resolution", v)}
                options={[
                  { value: "",          label: "Select resolution" },
                  { value: "1280x720",  label: "1280×720 (HD)" },
                  { value: "1920x1080", label: "1920×1080 (Full HD)" },
                  { value: "2560x1440", label: "2560×1440 (2K)" },
                  { value: "3840x2160", label: "3840×2160 (4K)" },
                ]}
              />
            </FormField>
            <FormField label="Frame Rate">
              <FormSelect
                value={fields.frameRate}
                onChange={(v) => set("frameRate", v)}
                options={[
                  { value: "",   label: "Select frame rate" },
                  { value: "15", label: "15 fps" },
                  { value: "20", label: "20 fps" },
                  { value: "25", label: "25 fps" },
                  { value: "30", label: "30 fps" },
                  { value: "60", label: "60 fps" },
                ]}
              />
            </FormField>
            <FormField label="Retention (days)" span={2}>
              <TextInput
                value={fields.retentionDays}
                onChange={(v) => set("retentionDays", v)}
                placeholder="30"
                type="number"
              />
            </FormField>
            <FormField label="RTSP URL" span={2} hint="Full RTSP feed URL. Leave blank to auto-build from IP + port.">
              <TextInput
                value={fields.rtspUrl}
                onChange={(v) => set("rtspUrl", v)}
                placeholder={`rtsp://${fields.ipAddress || "10.10.0.x"}:${fields.rtspPort || "554"}/Streaming/Channels/101`}
                mono
              />
            </FormField>
          </div>

          {/* NVR linkage */}
          <div className="rounded-lg border border-border bg-background p-3.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              NVR Linkage
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Link to NVR (optional)"
                hint={
                  siteNvrs.length === 0
                    ? "No NVRs registered at this site."
                    : "Only NVRs at the same site can be linked."
                }
              >
                <FormSelect
                  value={fields.nvrId}
                  onChange={(v) => set("nvrId", v)}
                  options={nvrOptions}
                  disabled={siteNvrs.length === 0}
                />
              </FormField>
              <FormField
                label="Channel"
                hint={
                  fields.nvrId
                    ? availableChannels.length === 0
                      ? "All channels are in use on this NVR."
                      : `${availableChannels.length} of ${selectedNvr?.channelCount ?? 0} channels available.`
                    : "Pick an NVR first."
                }
              >
                <FormSelect
                  value={fields.channel != null ? String(fields.channel) : ""}
                  onChange={(v) => set("channel", v ? Number(v) : null)}
                  options={channelOptions}
                  disabled={!fields.nvrId || availableChannels.length === 0}
                />
              </FormField>
            </div>
          </div>

          {/* Recording schedule */}
          <div className="rounded-lg border border-border bg-background p-3.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recording Schedule
            </p>

            <FormField label="Mode" span={2} hint="Continuous records 24/7. Scheduled lets you pick specific days and times.">
              <FormSelect
                value={fields.recordingMode}
                onChange={(v) => set("recordingMode", v as RecordingMode)}
                options={[
                  { value: "",           label: "Select recording mode" },
                  { value: "continuous", label: "Continuous · 24/7 recording" },
                  { value: "scheduled",  label: "Scheduled · selected days & hours" },
                ]}
              />
            </FormField>

            {fields.recordingMode === "continuous" ? (
              <div className="mt-3 flex items-center gap-2 rounded-md border border-info/30 bg-info/[0.05] px-3 py-2 text-[12px] text-info">
                <Clock className="size-3.5 flex-shrink-0" />
                Recording continuously — all 7 days, 00:00 to 23:59.
              </div>
            ) : (
              <>
                <div className="mb-3 mt-3">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                    Days
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {DAY_LABELS.map((label, idx) => {
                      const selected = fields.scheduleDays.includes(idx);
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => toggleDay(idx)}
                          className={cn(
                            "h-9 min-w-[44px] rounded-md border px-2.5 text-[12px] font-semibold transition-colors",
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {fields.scheduleDays.length === 0 && (
                    <p className="mt-1 text-[11px] text-sev-critical">Select at least one day.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Start Time">
                    <input
                      type="time"
                      value={fields.scheduleStart}
                      onChange={(e) => set("scheduleStart", e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground focus:border-primary focus:outline-none"
                    />
                  </FormField>
                  <FormField label="End Time">
                    <input
                      type="time"
                      value={fields.scheduleEnd}
                      min={fields.scheduleStart}
                      onChange={(e) => set("scheduleEnd", e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-[13px] text-foreground focus:border-primary focus:outline-none"
                    />
                  </FormField>
                </div>
                {fields.scheduleStart >= fields.scheduleEnd && (
                  <p className="mt-1 text-[11px] text-sev-critical">End time must be after start time.</p>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!canSubmit || !isDirty} onClick={() => onSubmit(fields)} className="gap-1.5">
            {mode === "add" ? <Plus className="size-3.5" /> : <Check className="size-3.5" />}
            {mode === "add" ? "Add Camera" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Confirm modal ───────────────────────────────────────────────────────── */

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[560px] max-w-[95vw] p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className={cn("text-base font-bold", destructive && "text-destructive")}>
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="px-5 py-4">
          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/[0.06] px-3 py-2.5">
            <AlertTriangle className="mt-0.5 size-4 flex-shrink-0 text-warning" />
            <div className="text-[12px] leading-snug text-muted-foreground">{description}</div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            size="sm"
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Toast ───────────────────────────────────────────────────────────────── */


/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function CamerasPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const cameras = useCamerasStore((s) => s.cameras);
  const addCamera = useCamerasStore((s) => s.addCamera);
  const updateCamera = useCamerasStore((s) => s.updateCamera);
  const deleteCameraFromStore = useCamerasStore((s) => s.deleteCamera);
  const [deployments, setDeployments] = React.useState<DeploymentData[]>(() => [...MOCK_DEPLOYMENTS]);
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<CameraFilters>(EMPTY_FILTERS);
  const [kpiFilter, setKpiFilter] = React.useState<KpiFilter>("all");
  const [drawerId, setDrawerId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const incoming = (location.state as { openCameraId?: string } | null)?.openCameraId;
    if (incoming) {
      setDrawerId(incoming);
      // Clear the state so a back/forward doesn't re-trigger.
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);
  const [page, setPage] = React.useState(1);
  const [modal, setModal] = React.useState<
    | { kind: "add" }
    | { kind: "edit"; cameraId: string }
    | { kind: "delete"; cameraId: string }
    | { kind: "undeploy"; deploymentId: string }
    | null
  >(null);
  const pageSize = 10;

  const filtered = React.useMemo(() => {
    return cameras.filter((c) => {
      if (kpiFilter === "unlinked" && c.nvrId) return false;
      if (kpiFilter !== "all" && kpiFilter !== "unlinked" && c.status !== kpiFilter) return false;
      if (filters.site.length > 0 && !filters.site.includes(c.siteId)) return false;
      if (filters.area.length > 0 && !filters.area.includes(c.areaId)) return false;
      if (filters.status.length > 0 && !filters.status.includes(c.status)) return false;
      if (filters.nvr.length > 0 && (!c.nvrId || !filters.nvr.includes(c.nvrId))) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [c.id, c.name, c.ipAddress, c.nvrName ?? "", c.areaName, c.siteName].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [cameras, kpiFilter, filters, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  const drawerCamera = drawerId ? cameras.find((c) => c.id === drawerId) ?? null : null;
  const [linkNvrCameraId, setLinkNvrCameraId] = React.useState<string | null>(null);
  const hasFilters = !!(search || Object.values(filters).some((a) => a.length > 0) || kpiFilter !== "all");

  function handleKpiClick(key: KpiFilter) {
    setKpiFilter((current) => (current === key ? "all" : key));
    setPage(1);
  }

  function buildCameraFromFields(fields: CameraFormFields, base?: CameraData): CameraData {
    const site = CAMERA_SITES.find((s) => s.value === fields.siteId);
    const area = CAMERA_AREAS.find((a) => a.value === fields.areaId);
    const nvr = fields.nvrId ? MOCK_NVRS.find((n) => n.id === fields.nvrId) : null;
    // Parse string-typed form numerics into actual numbers, with sensible defaults when empty.
    const rtspPort      = Number(fields.rtspPort)      || 554;
    const frameRate     = Number(fields.frameRate)     || 25;
    const retentionDays = Number(fields.retentionDays) || 30;
    const recordingMode = fields.recordingMode || "continuous";
    return {
      id: fields.id.trim(),
      name: fields.name.trim(),
      siteId: fields.siteId,
      siteName: site?.label ?? fields.siteId,
      areaId: fields.areaId,
      areaName: area?.label ?? fields.areaId,
      status: base?.status ?? "offline",
      ipAddress: fields.ipAddress.trim(),
      rtspPort,
      rtspUrl: fields.rtspUrl.trim() || `rtsp://${fields.ipAddress.trim()}:${rtspPort}/Streaming/Channels/101`,
      stream: {
        codec: base?.stream.codec ?? "h264",
        resolution: fields.resolution || "1920x1080",
        frameRate,
      },
      recording: {
        retentionDays,
        bitrateKbps: base?.recording.bitrateKbps ?? 4096,
        schedule: recordingMode === "continuous" ? "always" : "custom",
        scheduleDays: recordingMode === "continuous" ? [0, 1, 2, 3, 4, 5, 6] : fields.scheduleDays,
        scheduleStart: recordingMode === "continuous" ? "00:00" : (fields.scheduleStart || "08:00"),
        scheduleEnd:   recordingMode === "continuous" ? "23:59" : (fields.scheduleEnd   || "18:00"),
      },
      nvrId: fields.nvrId || null,
      nvrName: nvr?.name ?? null,
      channel: fields.nvrId ? fields.channel : null,
      boundaryZones: base?.boundaryZones ?? [],
      recentEventCount: base?.recentEventCount ?? 0,
      lastSeenAt: base?.lastSeenAt ?? new Date().toISOString(),
      lastSeenDisplay: base?.lastSeenDisplay ?? "Just now",
      activeAt: base?.activeAt ?? new Date().toISOString(),
      activeAtDisplay: base?.activeAtDisplay ?? new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
    };
  }

  function handleAdd(fields: CameraFormFields) {
    const newCam = buildCameraFromFields(fields);
    addCamera(newCam);
    setModal(null);
    toast.success(`${newCam.name} added`);
  }
  function handleEdit(fields: CameraFormFields) {
    const updated = buildCameraFromFields(fields, cameras.find((c) => c.id === fields.id));
    updateCamera(fields.id, updated);
    setModal(null);
    toast.success("Camera updated");
  }
  function handleDelete(cameraId: string) {
    const target = cameras.find((c) => c.id === cameraId);
    deleteCameraFromStore(cameraId);
    setDeployments((curr) => curr.filter((d) => d.cameraId !== cameraId));
    setModal(null);
    setDrawerId(null);
    toast.success(`${target?.name ?? "Camera"} deleted`);
  }
  function handleUndeploy(deploymentId: string) {
    setDeployments((curr) => curr.filter((d) => d.id !== deploymentId));
    setModal(null);
    toast.success("Model undeployed from camera");
  }

  const editingCamera = modal?.kind === "edit" ? cameras.find((c) => c.id === modal.cameraId) : null;
  const deletingCamera = modal?.kind === "delete" ? cameras.find((c) => c.id === modal.cameraId) : null;
  const undeployingDep = modal?.kind === "undeploy" ? deployments.find((d) => d.id === modal.deploymentId) : null;

  // Sync the global MOCK_DEPLOYMENTS so the deployments shown in the drawer reflect local state
  React.useEffect(() => {
    MOCK_DEPLOYMENTS.length = 0;
    MOCK_DEPLOYMENTS.push(...deployments);
  }, [deployments]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Cameras</PageHeader.Title>
          <PageHeader.Description>
            Manage cameras across all sites — RTSP feeds, NVR linkage, and boundary zones.
          </PageHeader.Description>
        </PageHeader.Content>
        <PageHeader.Actions>
          <Button size="sm" className="gap-1.5" onClick={() => setModal({ kind: "add" })}>
            <Plus className="size-4" />
            Add Camera
          </Button>
        </PageHeader.Actions>
      </PageHeader>

      {/* KPI cards */}
      <KpiGrid cols={5}>
        {KPI_CONFIGS.map((cfg) => (
          <KpiCard
            key={cfg.key}
            label={cfg.label}
            value={cfg.getValue(cameras)}
            sub={cfg.sub}
            accent={cfg.accent}
            active={kpiFilter === cfg.key}
            onClick={() => handleKpiClick(cfg.key)}
          />
        ))}
      </KpiGrid>

      {/* Filter panel */}
      <FilterPanel
        filters={filters}
        onChange={(f) => { setFilters(f); setPage(1); }}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
      />

      {/* Count */}
      <p className="text-[13px] text-muted-foreground">
        <strong className="text-foreground">{filtered.length}</strong>{" "}
        {filtered.length === 1 ? "camera" : "cameras"} match current filters
        {hasFilters && (
          <button
            onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); setKpiFilter("all"); }}
            className="ml-2 text-muted-foreground underline hover:text-primary"
          >
            Clear filters
          </button>
        )}
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <Video className="size-10 opacity-20" />
          <p className="text-sm">No cameras match the current filters.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); setKpiFilter("all"); }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="border-b border-border text-left">
                  {["ID", "NAME", "STATUS", "IP", "LOCATION", "NVR · CH", "EVENTS 24H", "ACTIVE", "ACTION"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {pageItems.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setDrawerId(c.id)}
                    className="group cursor-pointer text-[13px] transition-colors hover:bg-muted/20"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-[12px] font-semibold text-muted-foreground transition-colors group-hover:text-primary">
                        {c.id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-foreground transition-colors group-hover:text-primary">
                        {c.name}
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                    <td className="px-4 py-3 font-mono text-[12px] text-muted-foreground">
                      {c.ipAddress}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-foreground">{c.areaName}</span>
                        <span className="text-[11px]">{c.siteName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.nvrId && c.channel ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/site/nvr?nvr=${c.nvrId}`); }}
                          className="inline-flex items-center gap-1.5 rounded-md border border-info/20 bg-info/5 px-2 py-1 text-[11px] text-info hover:bg-info/15"
                        >
                          <HardDrive className="size-3" />
                          <span className="font-mono">{c.nvrId}</span>
                          <span className="text-muted-foreground">· Ch {c.channel}</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md border border-warning/20 bg-warning/5 px-2 py-1 text-[11px] text-warning">
                          <AlertTriangle className="size-3" />
                          Unlinked
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">{c.recentEventCount}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3" />
                        {c.lastSeenDisplay}
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex size-7 items-center justify-center rounded border border-transparent text-muted-foreground/50 transition-colors hover:border-border hover:bg-muted hover:text-foreground">
                            <MoreHorizontal className="size-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-44 p-1" align="end">
                          <button
                            onClick={() => setDrawerId(c.id)}
                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-foreground hover:bg-muted"
                          >
                            <Video className="size-3.5 text-muted-foreground" />
                            View details
                          </button>
                          <button
                            onClick={() => setModal({ kind: "edit", cameraId: c.id })}
                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-foreground hover:bg-muted"
                          >
                            <Pencil className="size-3.5 text-muted-foreground" />
                            Edit camera
                          </button>
                          {c.nvrId && (
                            <button
                              onClick={() => navigate(`/site/nvr?nvr=${c.nvrId}`)}
                              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-foreground hover:bg-muted"
                            >
                              <HardDrive className="size-3.5 text-muted-foreground" />
                              Open NVR
                            </button>
                          )}
                          <div className="my-1 border-t border-border" />
                          <button
                            onClick={() => setModal({ kind: "delete", cameraId: c.id })}
                            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[12px] text-sev-critical hover:bg-sev-critical/10"
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </button>
                        </PopoverContent>
                      </Popover>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
            <p className="text-[12px] text-muted-foreground">
              {filtered.length === 0
                ? "0 of 0"
                : `${(page - 1) * pageSize + 1} – ${Math.min(page * pageSize, filtered.length)} of ${filtered.length}`}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <span className="px-2 text-[12px] text-foreground">
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
      )}

      {/* Drawer */}
      <CameraDrawer
        camera={drawerCamera}
        open={drawerId !== null}
        onClose={() => setDrawerId(null)}
        onOpenNvr={(nvrId) => {
          setDrawerId(null);
          navigate(`/site/nvr?nvr=${nvrId}`);
        }}
        onEdit={() => drawerCamera && setModal({ kind: "edit", cameraId: drawerCamera.id })}
        onDelete={() => drawerCamera && setModal({ kind: "delete", cameraId: drawerCamera.id })}
        onUndeploy={(deploymentId) => setModal({ kind: "undeploy", deploymentId })}
        onLinkNvrRequest={(cameraId) => setLinkNvrCameraId(cameraId)}
        onUnlinkNvr={(cameraId) => {
          const target = cameras.find((c) => c.id === cameraId);
          if (!target) return;
          updateCamera(cameraId, { nvrId: null, nvrName: null, channel: null });
          toast.success(`Unlinked ${target.id} from ${target.nvrName ?? "NVR"}`);
        }}
        onDeployNewModel={() => {
          if (!drawerCamera) return;
          navigate("/deployment", {
            state: {
              prefill: {
                siteId:   drawerCamera.siteId,
                siteName: drawerCamera.siteName,
                areaId:   drawerCamera.areaId,
                areaName: drawerCamera.areaName,
                cameraId: drawerCamera.id,
                cameraName: drawerCamera.name,
              },
            },
          });
        }}
        onZoneAdd={(cameraId, label, box) => {
          const target = cameras.find((c) => c.id === cameraId);
          if (!target) return;
          const id = `${cameraId}-z${target.boundaryZones.length + 1}-${Math.random().toString(36).slice(2, 5)}`;
          updateCamera(cameraId, {
            boundaryZones: [...target.boundaryZones, { id, label, box: box ?? [0.1, 0.1, 0.4, 0.4] }],
          });
          toast.success(`Zone "${label}" added`);
        }}
        onZoneRemove={(cameraId, zoneId) => {
          const target = cameras.find((c) => c.id === cameraId);
          if (!target) return;
          updateCamera(cameraId, {
            boundaryZones: target.boundaryZones.filter((z) => z.id !== zoneId),
          });
          toast.success("Zone removed");
        }}
        onZoneUpdate={(cameraId, zoneId, label) => {
          const target = cameras.find((c) => c.id === cameraId);
          if (!target) return;
          updateCamera(cameraId, {
            boundaryZones: target.boundaryZones.map((z) =>
              z.id === zoneId ? { ...z, label } : z
            ),
          });
          toast.success(`Zone renamed to "${label}"`);
        }}
        onZoneUpdateBox={(cameraId, zoneId, box) => {
          const target = cameras.find((c) => c.id === cameraId);
          if (!target) return;
          updateCamera(cameraId, {
            boundaryZones: target.boundaryZones.map((z) =>
              z.id === zoneId ? { ...z, box } : z
            ),
          });
        }}
      />

      {/* Link NVR */}
      <LinkNvrModal
        open={linkNvrCameraId !== null}
        camera={linkNvrCameraId ? cameras.find((c) => c.id === linkNvrCameraId) ?? null : null}
        onClose={() => setLinkNvrCameraId(null)}
        onLink={(cameraId, nvrId, nvrName, channel) => {
          updateCamera(cameraId, { nvrId, nvrName, channel });
          toast.success(`Linked to ${nvrName} · Ch ${channel}`);
        }}
      />

      {/* Modals */}
      <CameraFormModal
        open={modal?.kind === "add"}
        mode="add"
        initial={null}
        takenIds={cameras.map((c) => c.id)}
        onClose={() => setModal(null)}
        onSubmit={handleAdd}
      />
      <CameraFormModal
        open={modal?.kind === "edit"}
        mode="edit"
        initial={editingCamera ? fromCamera(editingCamera) : null}
        takenIds={cameras.map((c) => c.id)}
        onClose={() => setModal(null)}
        onSubmit={handleEdit}
      />
      <ConfirmModal
        open={modal?.kind === "delete"}
        title="Delete Camera"
        destructive
        confirmLabel="Delete Camera"
        onClose={() => setModal(null)}
        onConfirm={() => deletingCamera && handleDelete(deletingCamera.id)}
        description={
          <>
            <strong className="text-foreground">{deletingCamera?.name}</strong> ({deletingCamera?.id}) will be removed.
            Any deployed models will be detached and recordings on linked NVR will remain until their retention expires.
            This action cannot be undone.
          </>
        }
      />
      <ConfirmModal
        open={modal?.kind === "undeploy"}
        title="Undeploy Model"
        confirmLabel="Undeploy"
        onClose={() => setModal(null)}
        onConfirm={() => undeployingDep && handleUndeploy(undeployingDep.id)}
        description={
          <>
            <strong className="text-foreground">{undeployingDep?.modelName}</strong> will stop running on{" "}
            <strong className="text-foreground">{undeployingDep?.cameraName}</strong>.
            No new detection events will be produced until the model is redeployed.
          </>
        }
      />

    </div>
  );
}
