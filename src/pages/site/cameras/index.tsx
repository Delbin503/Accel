import * as React from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import type { DeploymentData } from "@/types/deployments";

/* ── Status pill ─────────────────────────────────────────────────────────── */

const STATUS_STYLES: Record<CameraStatus, { bg: string; text: string; dot: string; label: string }> = {
  online:              { bg: "bg-success/15 border-success/30",           text: "text-success",          dot: "bg-success",          label: "Online" },
  offline:             { bg: "bg-muted border-border",                    text: "text-muted-foreground", dot: "bg-muted-foreground", label: "Offline" },
  "connection-failed": { bg: "bg-sev-critical/15 border-sev-critical/30", text: "text-sev-critical",     dot: "bg-sev-critical",     label: "Failed" },
  pending:             { bg: "bg-warning/15 border-warning/30",           text: "text-warning",          dot: "bg-warning",          label: "Pending" },
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
  barClass: string;
  valueClass: string;
  activeClass: string;
  getValue: (items: CameraData[]) => number;
}[] = [
  {
    key: "all",
    label: "Total Cameras",
    sub: "Across all sites",
    barClass: "bg-muted-foreground/30",
    valueClass: "text-foreground",
    activeClass: "border-primary",
    getValue: (items) => items.length,
  },
  {
    key: "online",
    label: "Online",
    sub: "Streaming + healthy",
    barClass: "bg-success",
    valueClass: "text-success",
    activeClass: "border-success",
    getValue: (items) => items.filter((c) => c.status === "online").length,
  },
  {
    key: "offline",
    label: "Offline",
    sub: "Last seen > threshold",
    barClass: "bg-muted-foreground",
    valueClass: "text-muted-foreground",
    activeClass: "border-muted-foreground",
    getValue: (items) => items.filter((c) => c.status === "offline").length,
  },
  {
    key: "connection-failed",
    label: "Connection Failed",
    sub: "RTSP unreachable",
    barClass: "bg-sev-critical",
    valueClass: "text-sev-critical",
    activeClass: "border-sev-critical",
    getValue: (items) => items.filter((c) => c.status === "connection-failed").length,
  },
  {
    key: "unlinked",
    label: "Unlinked to NVR",
    sub: "Events have no footage",
    barClass: "bg-warning",
    valueClass: "text-warning",
    activeClass: "border-warning",
    getValue: (items) => items.filter((c) => !c.nvrId).length,
  },
];

function KpiCard({
  config,
  items,
  active,
  onClick,
}: {
  config: (typeof KPI_CONFIGS)[number];
  items: CameraData[];
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
        <span className="absolute right-2 top-2 rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary">
          Active Filter
        </span>
      )}
      <div className={cn("absolute inset-x-0 top-0 h-0.5", config.barClass)} />
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {config.label}
      </div>
      <div className={cn("text-[26px] font-bold leading-none", config.valueClass)}>
        {config.getValue(items)}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{config.sub}</div>
    </button>
  );
}

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
          <span className="truncate font-medium">{displayLabel}</span>
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

const STATUS_OPTS: FilterOption[] = [
  { value: "online",            label: "Online" },
  { value: "offline",           label: "Offline" },
  { value: "connection-failed", label: "Failed" },
  { value: "pending",           label: "Pending" },
];

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
              {["All sites", "All areas", "All statuses", "All NVRs"].map((l) => (
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { key: "site"   as const, label: "Site",   opts: CAMERA_SITES },
              { key: "area"   as const, label: "Area",   opts: CAMERA_AREAS },
              { key: "status" as const, label: "Status", opts: STATUS_OPTS },
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

function StatCard({
  label,
  value,
  icon,
  valueClass,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  valueClass?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-3">
      <div className="mb-1 flex items-center gap-1.5">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      </div>
      <p className={cn("text-[18px] font-bold leading-none text-foreground", valueClass)}>{value}</p>
      {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* ── Deployment status pill (mini, drawer-only) ──────────────────────────── */

const DEPLOY_STATUS_STYLES: Record<DeploymentData["status"], { bg: string; text: string; dot: string; label: string }> = {
  active:           { bg: "bg-success/15 border-success/30",           text: "text-success",      dot: "bg-success",      label: "Active" },
  paused:           { bg: "bg-warning/15 border-warning/30",           text: "text-warning",      dot: "bg-warning",      label: "Paused" },
  "pending-camera": { bg: "bg-info/15 border-info/30",                 text: "text-info",         dot: "bg-info",         label: "Pending" },
  stopped:          { bg: "bg-sev-critical/15 border-sev-critical/30", text: "text-sev-critical", dot: "bg-sev-critical", label: "Stopped" },
  failed:           { bg: "bg-sev-critical/15 border-sev-critical/30", text: "text-sev-critical", dot: "bg-sev-critical", label: "Failed" },
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
            <p className="truncate text-[13px] font-bold text-foreground transition-colors group-hover:text-primary">Recording · {r.dateLabel}</p>
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

function DrawZoneModal({ open, cameraName, existingZones, onClose, onSave, onUpdateZone, onRemoveZone }: {
  open: boolean;
  cameraName: string;
  existingZones: BoundaryZone[];
  onClose: () => void;
  onSave: (label: string, box: [number, number, number, number]) => void;
  onUpdateZone: (zoneId: string, label: string) => void;
  onRemoveZone: (zoneId: string) => void;
}) {
  const [label, setLabel] = React.useState("");
  const [box, setBox] = React.useState<{ x: number; y: number; w: number; h: number }>({ x: 0.25, y: 0.25, w: 0.4, h: 0.4 });
  const [editingZoneId, setEditingZoneId] = React.useState<string | null>(null);
  const [editingLabel, setEditingLabel] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const drawRef = React.useRef<{ startX: number; startY: number; mode: "draw" | "move" | null }>({ startX: 0, startY: 0, mode: null });

  React.useEffect(() => {
    if (open) {
      setLabel("");
      setBox({ x: 0.25, y: 0.25, w: 0.4, h: 0.4 });
      setEditingZoneId(null);
    }
  }, [open]);

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
    if ((e.target as HTMLElement).closest("[data-zone-box]")) return;
    if ((e.target as HTMLElement).closest("[data-existing-zone]")) return;
    const [x, y] = normalizedPoint(e);
    drawRef.current = { startX: x, startY: y, mode: "draw" };
    setBox({ x, y, w: 0, h: 0 });
    const onMove = (ev: MouseEvent) => {
      const ctx = drawRef.current;
      if (!ctx || ctx.mode !== "draw") return;
      const [cx, cy] = normalizedPoint(ev);
      setBox({
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

  function onMouseDownBox(e: React.MouseEvent) {
    e.stopPropagation();
    const [x, y] = normalizedPoint(e);
    const offsetX = x - box.x;
    const offsetY = y - box.y;
    drawRef.current.mode = "move";
    const onMove = (ev: MouseEvent) => {
      if (drawRef.current.mode !== "move") return;
      const [cx, cy] = normalizedPoint(ev);
      setBox((curr) => ({
        ...curr,
        x: Math.max(0, Math.min(1 - curr.w, cx - offsetX)),
        y: Math.max(0, Math.min(1 - curr.h, cy - offsetY)),
      }));
    };
    const onUp = () => {
      drawRef.current.mode = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function onResizeBox(e: React.MouseEvent) {
    e.stopPropagation();
    const onMove = (ev: MouseEvent) => {
      const [cx, cy] = normalizedPoint(ev);
      setBox((curr) => ({
        ...curr,
        w: Math.max(0.05, Math.min(1 - curr.x, cx - curr.x)),
        h: Math.max(0.05, Math.min(1 - curr.y, cy - curr.y)),
      }));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function commit() {
    if (!label.trim() || box.w < 0.05 || box.h < 0.05) return;
    onSave(label.trim(), [box.x, box.y, box.x + box.w, box.y + box.h]);
    setLabel("");
    setBox({ x: 0.25, y: 0.25, w: 0.4, h: 0.4 });
  }

  function commitEdit() {
    if (editingZoneId && editingLabel.trim()) {
      onUpdateZone(editingZoneId, editingLabel.trim());
    }
    setEditingZoneId(null);
    setEditingLabel("");
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-[560px] max-w-[95vw] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex-shrink-0 border-b border-border px-5 py-4">
          <p className="text-base font-bold text-foreground">Edit Detection Zones</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            View, edit and draw boundary zones on <strong className="text-foreground">{cameraName}</strong>. Drag a new rectangle on the canvas, or click any existing zone to edit.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {/* Camera canvas with existing + new zones */}
          <div
            ref={containerRef}
            onMouseDown={onMouseDownContainer}
            className="relative aspect-video w-full select-none overflow-hidden rounded-lg border-2 border-border bg-neutral-950"
            style={{ background: "radial-gradient(120% 80% at 40% 60%, rgba(180,140,80,0.22) 0%, rgba(40,30,15,0.1) 45%, rgba(0,0,0,0.95) 100%)" }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 3px)" }} />
            <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-sev-critical/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
              LIVE
            </span>
            <span className="pointer-events-none absolute right-3 top-3 rounded bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white/85 backdrop-blur-sm">{cameraName}</span>

            {/* Existing zones — info color */}
            {existingZones.map((z, i) => {
              const [x0, y0, x1, y1] = z.box;
              const w = x1 - x0;
              const h = y1 - y0;
              const isEditing = editingZoneId === z.id;
              return (
                <div
                  key={z.id}
                  data-existing-zone
                  className={cn(
                    "absolute border-2 transition-colors",
                    isEditing ? "border-warning bg-warning/15" : "border-info bg-info/15 hover:border-info/80"
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
                    {i + 1}. {z.label}
                  </span>
                </div>
              );
            })}

            {/* New zone being drawn — primary color */}
            {box.w > 0 && box.h > 0 && (
              <div
                data-zone-box
                onMouseDown={onMouseDownBox}
                className="absolute cursor-move border-2 border-primary bg-primary/15"
                style={{
                  left: `${box.x * 100}%`, top: `${box.y * 100}%`,
                  width: `${box.w * 100}%`, height: `${box.h * 100}%`,
                }}
              >
                <span className="absolute -top-5 left-0 rounded bg-primary px-1.5 py-px text-[10px] font-bold text-primary-foreground">
                  {label || "New zone (drawing…)"}
                </span>
                <div onMouseDown={onResizeBox}
                  className="absolute -bottom-1 -right-1 size-3 cursor-nwse-resize rounded-sm bg-primary"
                  title="Resize" />
              </div>
            )}
          </div>

          {/* New zone form */}
          <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-primary/30 bg-primary/[0.04] p-3 sm:grid-cols-[1fr_auto]">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Plus className="-mt-0.5 mr-1 inline size-3 text-primary" /> Add a new zone
              </label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)}
                placeholder="Name (e.g. Entrance, Counter, Loading Dock…)"
                className="h-9 text-[13px]" />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Box: [{box.x.toFixed(2)}, {box.y.toFixed(2)}, {(box.x + box.w).toFixed(2)}, {(box.y + box.h).toFixed(2)}]
              </p>
            </div>
            <div className="flex items-end">
              <Button disabled={!label.trim() || box.w < 0.05 || box.h < 0.05} onClick={commit} className="gap-1.5">
                <Check className="size-3.5" />
                Add Zone
              </Button>
            </div>
          </div>

          {/* Existing zones list with inline edit / delete */}
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
                    <div key={z.id} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                      <span className="font-mono text-[10px] font-bold text-info">{i + 1}</span>
                      <span className="rounded bg-muted px-1.5 py-px font-mono text-[10px] text-muted-foreground">
                        {z.id}
                      </span>
                      {isEditing ? (
                        <Input value={editingLabel} onChange={(e) => setEditingLabel(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") { setEditingZoneId(null); setEditingLabel(""); } }}
                          className="h-7 flex-1 text-[13px]" />
                      ) : (
                        <span className="flex-1 text-[13px] font-semibold text-foreground">{z.label}</span>
                      )}
                      <span className="font-mono text-[10px] text-muted-foreground/70">
                        [{z.box.map((n) => n.toFixed(2)).join(", ")}]
                      </span>
                      {isEditing ? (
                        <>
                          <Button size="sm" className="gap-1.5" onClick={commitEdit}>
                            <Check className="size-3" />
                            Save
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setEditingZoneId(null); setEditingLabel(""); }}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingZoneId(z.id); setEditingLabel(z.label); }}
                            className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                            title="Edit label">
                            <Pencil className="size-3" />
                          </button>
                          <button onClick={() => onRemoveZone(z.id)}
                            className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-sev-critical/40 hover:text-sev-critical"
                            title="Remove zone">
                            <Trash2 className="size-3" />
                          </button>
                        </>
                      )}
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
      </div>
    </div>
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

interface CameraDrawerProps {
  camera: CameraData | null;
  open: boolean;
  onClose: () => void;
  onOpenNvr: (nvrId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onUndeploy: (deploymentId: string) => void;
  onDeployNewModel: () => void;
  onZoneAdd: (cameraId: string, label: string, box?: [number, number, number, number]) => void;
  onZoneRemove: (cameraId: string, zoneId: string) => void;
  onZoneUpdate: (cameraId: string, zoneId: string, label: string) => void;
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
  onZoneAdd,
  onZoneRemove,
  onZoneUpdate,
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
  const [, setToast] = React.useState<string | null>(null);

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
                <div className="mb-1 flex items-center gap-2">
                  <SheetTitle className="truncate text-[17px] font-bold">{camera.name}</SheetTitle>
                  <span className="rounded border border-border bg-muted px-1.5 py-px font-mono text-[10px] text-muted-foreground">
                    {camera.id}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <StatusPill status={camera.status} />
                  <span>·</span>
                  <MapPin className="size-3" />
                  {camera.siteName} · {camera.areaName}
                </div>
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
                <button
                  onClick={() => onOpenNvr(camera.nvrId!)}
                  className="group flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg border border-info/30 bg-info/10">
                    <HardDrive className="size-4 text-info" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-foreground transition-colors group-hover:text-primary">
                      {camera.nvrName}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {nvr.model} · {camera.nvrId} · Channel {camera.channel} · IP {nvr.ipAddress}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Used: <span className="font-semibold text-foreground">{nvr.usedStorageGb.toFixed(1)}</span> / {nvr.totalStorageGb.toFixed(1)} TB
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary" />
                </button>
              ) : (
                <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/[0.06] px-3.5 py-3">
                  <AlertTriangle className="size-4 flex-shrink-0 text-warning" />
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold text-foreground">Not linked to any NVR</p>
                    <p className="text-[11px] text-muted-foreground">
                      Detection events from this camera will have no replayable footage.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5">
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
                            <p className="truncate text-[13px] font-bold text-foreground">
                              {d.modelName}
                            </p>
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
                    {zonesEditing ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
                    {zonesEditing ? "Done" : "Edit Zones"}
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
                <Button variant="outline" size="sm" className="mt-2 gap-1.5">
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
                  setToast(`${count} recording${count === 1 ? "" : "s"} deleted`);
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
        />
      )}
    </Sheet>
  );
}

/* ── Camera form modal (Add + Edit) ──────────────────────────────────────── */

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_DAYS = [1, 2, 3, 4, 5]; // Mon–Fri

interface CameraFormFields {
  id: string;
  name: string;
  siteId: string;
  areaId: string;
  ipAddress: string;
  rtspPort: number;
  resolution: string;
  frameRate: number;
  retentionDays: number;
  nvrId: string;
  channel: number | null;
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
    siteId: CAMERA_SITES[0]?.value ?? "",
    areaId: CAMERA_AREAS[0]?.value ?? "",
    ipAddress: "10.10.0.",
    rtspPort: 554,
    resolution: "1920x1080",
    frameRate: 25,
    retentionDays: 30,
    nvrId: "",
    channel: null,
    scheduleDays: [...DEFAULT_DAYS],
    scheduleStart: "08:00",
    scheduleEnd: "18:00",
  };
}

function fromCamera(c: CameraData): CameraFormFields {
  return {
    id: c.id,
    name: c.name,
    siteId: c.siteId,
    areaId: c.areaId,
    ipAddress: c.ipAddress,
    rtspPort: c.rtspPort,
    resolution: c.stream.resolution,
    frameRate: c.stream.frameRate,
    retentionDays: c.recording.retentionDays,
    nvrId: c.nvrId ?? "",
    channel: c.channel,
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
    fields.scheduleDays.length > 0 &&
    fields.scheduleStart < fields.scheduleEnd;

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
                options={CAMERA_SITES}
              />
            </FormField>
            <FormField label="Area">
              <FormSelect
                value={fields.areaId}
                onChange={(v) => set("areaId", v)}
                options={CAMERA_AREAS}
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
                onChange={(v) => set("rtspPort", Number(v) || 554)}
                type="number"
                mono
              />
            </FormField>
            <FormField label="Resolution">
              <FormSelect
                value={fields.resolution}
                onChange={(v) => set("resolution", v)}
                options={[
                  { value: "1280x720",  label: "1280×720 (HD)" },
                  { value: "1920x1080", label: "1920×1080 (Full HD)" },
                  { value: "2560x1440", label: "2560×1440 (2K)" },
                  { value: "3840x2160", label: "3840×2160 (4K)" },
                ]}
              />
            </FormField>
            <FormField label="Frame Rate">
              <FormSelect
                value={String(fields.frameRate)}
                onChange={(v) => set("frameRate", Number(v))}
                options={[
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
                onChange={(v) => set("retentionDays", Number(v) || 30)}
                type="number"
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

            <div className="mb-3">
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
              {fields.scheduleDays.length === 7 && (
                <p className="mt-1 text-[11px] text-muted-foreground">Recording every day.</p>
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
          </div>
        </div>
        <div className="flex flex-shrink-0 justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!canSubmit} onClick={() => onSubmit(fields)} className="gap-1.5">
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

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed right-5 top-5 z-[70] flex items-start gap-2.5 rounded-lg border border-border bg-card px-4 py-3 shadow-xl">
      <Check className="size-4 flex-shrink-0 text-success" />
      <p className="text-[13px] font-medium text-foreground">{message}</p>
      <button onClick={onClose} className="ml-2 text-muted-foreground hover:text-foreground">
        <X className="size-3.5" />
      </button>
    </div>
  );
}

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
  const [toast, setToast] = React.useState<string | null>(null);
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
  const hasFilters = !!(search || Object.values(filters).some((a) => a.length > 0) || kpiFilter !== "all");

  function handleKpiClick(key: KpiFilter) {
    setKpiFilter((current) => (current === key ? "all" : key));
    setPage(1);
  }

  function buildCameraFromFields(fields: CameraFormFields, base?: CameraData): CameraData {
    const site = CAMERA_SITES.find((s) => s.value === fields.siteId);
    const area = CAMERA_AREAS.find((a) => a.value === fields.areaId);
    const nvr = fields.nvrId ? MOCK_NVRS.find((n) => n.id === fields.nvrId) : null;
    return {
      id: fields.id.trim(),
      name: fields.name.trim(),
      siteId: fields.siteId,
      siteName: site?.label ?? fields.siteId,
      areaId: fields.areaId,
      areaName: area?.label ?? fields.areaId,
      status: base?.status ?? "pending",
      ipAddress: fields.ipAddress.trim(),
      rtspPort: fields.rtspPort,
      rtspUrl: `rtsp://${fields.ipAddress.trim()}:${fields.rtspPort}/Streaming/Channels/101`,
      stream: {
        codec: base?.stream.codec ?? "h264",
        resolution: fields.resolution,
        frameRate: fields.frameRate,
      },
      recording: {
        retentionDays: fields.retentionDays,
        bitrateKbps: base?.recording.bitrateKbps ?? 4096,
        schedule: fields.scheduleDays.length === 7 && fields.scheduleStart === "00:00" && fields.scheduleEnd >= "23:00"
          ? "always"
          : "custom",
        scheduleDays: fields.scheduleDays,
        scheduleStart: fields.scheduleStart,
        scheduleEnd: fields.scheduleEnd,
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
    setToast(`${newCam.name} added`);
  }
  function handleEdit(fields: CameraFormFields) {
    const updated = buildCameraFromFields(fields, cameras.find((c) => c.id === fields.id));
    updateCamera(fields.id, updated);
    setModal(null);
    setToast("Camera updated");
  }
  function handleDelete(cameraId: string) {
    const target = cameras.find((c) => c.id === cameraId);
    deleteCameraFromStore(cameraId);
    setDeployments((curr) => curr.filter((d) => d.cameraId !== cameraId));
    setModal(null);
    setDrawerId(null);
    setToast(`${target?.name ?? "Camera"} deleted`);
  }
  function handleUndeploy(deploymentId: string) {
    setDeployments((curr) => curr.filter((d) => d.id !== deploymentId));
    setModal(null);
    setToast("Model undeployed from camera");
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {KPI_CONFIGS.map((cfg) => (
          <KpiCard
            key={cfg.key}
            config={cfg}
            items={cameras}
            active={kpiFilter === cfg.key}
            onClick={() => handleKpiClick(cfg.key)}
          />
        ))}
      </div>

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
        onDeployNewModel={() => navigate("/deployments")}
        onZoneAdd={(cameraId, label, box) => {
          const target = cameras.find((c) => c.id === cameraId);
          if (!target) return;
          const id = `${cameraId}-z${target.boundaryZones.length + 1}-${Math.random().toString(36).slice(2, 5)}`;
          updateCamera(cameraId, {
            boundaryZones: [...target.boundaryZones, { id, label, box: box ?? [0.1, 0.1, 0.4, 0.4] }],
          });
          setToast(`Zone "${label}" added`);
        }}
        onZoneRemove={(cameraId, zoneId) => {
          const target = cameras.find((c) => c.id === cameraId);
          if (!target) return;
          updateCamera(cameraId, {
            boundaryZones: target.boundaryZones.filter((z) => z.id !== zoneId),
          });
          setToast("Zone removed");
        }}
        onZoneUpdate={(cameraId, zoneId, label) => {
          const target = cameras.find((c) => c.id === cameraId);
          if (!target) return;
          updateCamera(cameraId, {
            boundaryZones: target.boundaryZones.map((z) =>
              z.id === zoneId ? { ...z, label } : z
            ),
          });
          setToast(`Zone renamed to "${label}"`);
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

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
