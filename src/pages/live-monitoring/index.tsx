import * as React from "react";
import { toast } from "sonner";
import {
  Search,
  VideoOff,
  Maximize2,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Camera,
  LayoutGrid,
  PanelsTopLeft,
  AlertTriangle,
  Pin,
  PinOff,
  Check,
  MapPin,
  Plus,
  Trash2,
  Pencil,
  GripVertical,
  Save,
} from "lucide-react";
import { Input } from "@accel/ui/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@accel/ui/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@accel/ui/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@accel/ui/components/ui/select";
import { PageHeader } from "@accel/ui/components/layout/PageHeader";
import { Button } from "@accel/ui/components/ui/button";
import { ItemButton } from "@accel/ui/components/ui/item";
import { SegmentedControl, SegmentedControlItem } from "@accel/ui/components/ui/segmented-control";
import { cn } from "@accel/ui/lib/utils";
import { cameraFrame, OFFLINE_FRAME } from "@/mocks/cameraFrames";
import { useCamerasStore } from "@/stores/useCamerasStore";
import { useSitesStore } from "@/stores/useSitesStore";
import { MOCK_EVENTS } from "@/mocks/detectionFeed";
import { useLiveMonitoringStore, type CustomLayout, type CustomTile } from "@/stores/useLiveMonitoringStore";
import type { CameraData } from "@/types/cameras";
import { TruncatedText } from "@accel/ui/components/shared/TruncatedText";

/* ── View modes ──────────────────────────────────────────────────────── */

type ViewMode = "hero" | "wall" | "custom";

const VIEW_MODES: { key: ViewMode; label: string; icon: React.ElementType; description: string }[] = [
  { key: "hero",   label: "Hero",   icon: PanelsTopLeft, description: "Featured camera + sidebar of all cams" },
  { key: "wall",   label: "Wall",   icon: LayoutGrid,    description: "Uniform grid for all cameras" },
  /* PRD: only Hero and Wall are offered. The Custom view is still built below —
     add this entry back to make it selectable again.
     { key: "custom", label: "Custom", icon: Plus, description: "Drag, drop and resize cameras freely" }, */
];

function detCount(id: string): number {
  const h = id.split("").reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return (h % 5);
}

/* ── Tile rendering ──────────────────────────────────────────────────── */

function CameraTile({
  camera, isSelected, hasDetection, detectionCount, onSelect, size = "md", inlineBox, pinned, onTogglePin,
}: {
  camera: CameraData;
  isSelected?: boolean;
  hasDetection?: boolean;
  detectionCount?: number;
  onSelect?: () => void;
  size?: "sm" | "md" | "lg";
  inlineBox?: { x: number; y: number; w: number; h: number; color: "info" | "warning" | "critical" };
  pinned?: boolean;
  onTogglePin?: () => void;
}) {
  const isOnline = camera.status === "online";
  const frame = isOnline ? cameraFrame(camera.id) : OFFLINE_FRAME;
  const tileGradient = "radial-gradient(120% 80% at 40% 60%, rgba(180,140,80,0.18) 0%, rgba(40,30,15,0.1) 45%, rgba(0,0,0,0.95) 100%)";
  return (
    <ItemButton variant="plain" data-slot="camera-tile"
      onClick={onSelect}
      className={cn(
        "group relative h-full flex-col items-stretch gap-0 overflow-hidden rounded-lg border bg-media transition-all hover:bg-media",
        isSelected ? "border-primary shadow-[0_0_0_2px_var(--primary)]" : "border-border hover:border-primary/40"
      )}
    >
      <div data-slot="camera-tile-frame" className="relative aspect-video w-full flex-1 overflow-hidden">
        {isOnline ? (
          <>
            {frame ? (
              <img src={frame} alt={`${camera.name} live view`} className="absolute inset-0 size-full scale-[1.18] object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ background: tileGradient }} />
            )}
            {inlineBox && (
              <div className={cn("absolute border-[1.5px]",
                inlineBox.color === "info" && "border-info",
                inlineBox.color === "warning" && "border-warning",
                inlineBox.color === "critical" && "border-severity-critical")}
                style={{
                  left: `${inlineBox.x * 100}%`, top: `${inlineBox.y * 100}%`,
                  width: `${inlineBox.w * 100}%`, height: `${inlineBox.h * 100}%`,
                }} />
            )}
          </>
        ) : (
          <>
            <img src={OFFLINE_FRAME} alt="" aria-hidden className="absolute inset-0 size-full scale-[1.18] object-cover opacity-40" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-media/70 text-severity-critical/80">
              <AlertTriangle className="size-5" />
              <span className="text-2xs font-bold uppercase tracking-widest">Offline</span>
            </div>
          </>
        )}
        {isOnline && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-severity-critical/95 px-1.5 py-0.5 text-3xs font-bold uppercase tracking-widest text-status-foreground">
            LIVE
          </span>
        )}
        {hasDetection && detectionCount !== undefined && detectionCount > 0 && (
          <span className="absolute right-2 top-2 inline-flex size-5 items-center justify-center rounded-full bg-warning text-2xs font-bold text-status-foreground">
            {detectionCount}
          </span>
        )}
        {/* Persistent pin indicator (only when actually pinned) */}
        {pinned && (
          <span title="Pinned"
            className={cn(
              "absolute z-10 inline-flex items-center justify-center rounded-full bg-primary-fill text-primary-foreground shadow-raised",
              detectionCount && detectionCount > 0 ? "right-9 top-2 size-5" : "right-2 top-2 size-5"
            )}
          >
            <Pin className="size-3" />
          </span>
        )}
        {/* Hover pin/unpin button */}
        {onTogglePin && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onTogglePin(); } }}
            title={pinned ? "Unpin camera" : "Pin camera"}
            className={cn(
              "absolute z-20 inline-flex h-7 items-center gap-1 rounded-md bg-scrim/75 px-2 text-2xs font-semibold uppercase tracking-wider text-media-foreground opacity-0 backdrop-blur-sm transition-opacity duration-[var(--duration-fast)] group-hover:opacity-100",
              "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hover:bg-primary"
            )}
          >
            {pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
            {pinned ? "Unpin" : "Pin"}
          </span>
        )}
        <span className={cn("absolute left-2 bottom-2 rounded bg-scrim/60 px-1.5 py-0.5 font-mono text-media-foreground/90 backdrop-blur-sm",
          size === "sm" ? "text-3xs" : "text-2xs")}>
          {camera.id}
        </span>
      </div>
    </ItemButton>
  );
}

/* ── Hero view ───────────────────────────────────────────────────────── */

function HeroView({
  cameras, selectedCameraId, setSelectedCameraId, pinnedIds, onTogglePin,
}: {
  cameras: CameraData[];
  selectedCameraId: string;
  setSelectedCameraId: (id: string) => void;
  pinnedIds: string[];
  onTogglePin: (id: string) => void;
}) {
  const camera = cameras.find((c) => c.id === selectedCameraId) ?? cameras[0];
  const [muted, setMuted] = React.useState(true);
  const [paused, setPaused] = React.useState(false);
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const events = MOCK_EVENTS.filter((e) => e.camera === camera?.id).slice(0, 6);

  // Group cameras by site, then by area within site
  const bySite = cameras.reduce<Record<string, { siteName: string; areas: Record<string, { areaName: string; cams: CameraData[] }> }>>((acc, c) => {
    if (!acc[c.siteId]) acc[c.siteId] = { siteName: c.siteName, areas: {} };
    if (!acc[c.siteId].areas[c.areaId]) acc[c.siteId].areas[c.areaId] = { areaName: c.areaName, cams: [] };
    acc[c.siteId].areas[c.areaId].cams.push(c);
    return acc;
  }, {});

  const onlineCount = cameras.filter((c) => c.status === "online").length;
  const offlineCount = cameras.length - onlineCount;
  const multiSite = Object.keys(bySite).length > 1;

  if (!camera) return null;

  return (
    <div data-slot="hero-view" className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      <div data-slot="hero-view-main" className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div data-slot="hero-view-stage" className="relative aspect-[16/9] w-full overflow-hidden bg-media">
            {cameraFrame(camera.id) ? (
              <img
                src={cameraFrame(camera.id)}
                alt={`${camera.name} live view`}
                className="absolute inset-0 size-full scale-[1.18] object-cover"
              />
            ) : (
              <div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 40% 60%, rgba(180,140,80,0.22) 0%, rgba(40,30,15,0.1) 45%, rgba(0,0,0,0.95) 100%)" }} />
            )}
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-severity-critical/95 px-2 py-0.5 text-2xs font-bold uppercase tracking-widest text-status-foreground">
              <span className="size-1.5 animate-pulse rounded-full bg-status-foreground" />
              LIVE
            </span>
            <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-scrim/60 px-2 py-0.5 font-mono text-2xs text-media-foreground/85 backdrop-blur-sm">
              {camera.id} · <span className="inline-flex items-center gap-1 text-severity-critical"><span className="size-1.5 animate-pulse rounded-full bg-severity-critical" />REC</span> · <span className="text-info">AI</span>
            </span>
            <div className="absolute left-3 bottom-3 rounded bg-scrim/60 px-2 py-1 font-mono text-xs text-media-foreground/90 backdrop-blur-sm">
              {now.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }).replace(",", " ·")}
            </div>
          </div>

          {/* Timeline */}
          <div data-slot="hero-view-timeline" className="border-t border-border bg-background/40 px-4 py-3">
            <div className="relative h-8 w-full">
              <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-warning/20" />
              <div className="absolute inset-y-0 right-0 w-px bg-severity-critical" />
              {events.map((e, i) => {
                const colors = ["bg-info", "bg-warning", "bg-severity-critical", "bg-info"];
                const left = 10 + (i * 14);
                return (
                  <span key={e.id} className={cn("absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full ring-2 ring-card", colors[i % colors.length])}
                    style={{ left: `${left}%` }} title={e.typeLabel} />
                );
              })}
            </div>
            <div className="mt-1 flex items-center justify-between text-2xs text-muted-foreground">
              <span>5 min ago</span>
              <span>Now</span>
            </div>
          </div>

          {/* Footer controls */}
          <div data-slot="hero-view-controls" className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3">
            <div className="min-w-0">
              <TruncatedText text={`${camera.siteName} · ${camera.id}`} className="text-md font-bold text-foreground" />
              <TruncatedText text={`${camera.areaName} · ${camera.stream.resolution} · ${camera.stream.frameRate}fps · accel-vms v4.2.1 active`} className="text-xs text-muted-foreground" />
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setPaused((v) => !v)}
                    className="size-8 rounded-md border border-border bg-background text-foreground hover:bg-muted dark:border-border dark:bg-background dark:hover:bg-muted">
                    {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{paused ? "Play" : "Pause"}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setMuted((v) => !v)}
                    className="size-8 rounded-md border border-border bg-background text-foreground hover:bg-muted dark:border-border dark:bg-background dark:hover:bg-muted">
                    {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{muted ? "Unmute" : "Mute"}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-md border border-border bg-background text-foreground hover:bg-muted dark:border-border dark:bg-background dark:hover:bg-muted">
                    <Camera className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Snapshot</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-md border border-border bg-background text-foreground hover:bg-muted dark:border-border dark:bg-background dark:hover:bg-muted">
                    <Maximize2 className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Fullscreen</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div data-slot="hero-view-sidebar" className="flex max-h-[calc(100vh-12rem)] flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card">
        <div data-slot="hero-view-sidebar-header" className="flex-shrink-0 border-b border-border px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Cameras {multiSite ? `· ${Object.keys(bySite).length} sites` : `· ${Object.values(bySite)[0]?.siteName ?? ""}`}
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="cursor-default text-xs text-muted-foreground">
                  <strong className="text-foreground">{cameras.length}</strong> · <strong className="text-success">{onlineCount}</strong> on{offlineCount > 0 && <> · <strong className="text-severity-critical">{offlineCount}</strong> off</>}
                </p>
              </TooltipTrigger>
              <TooltipContent>
                {cameras.length} cameras · {onlineCount} online · {offlineCount} offline
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <CategoryChip label="All" count={cameras.length} active />
            <CategoryChip label="Incident Detected" count={cameras.filter((c) => detCount(c.id) > 0).length} />
            <CategoryChip label="Offline" count={offlineCount} muted />
          </div>
        </div>

        <div data-slot="hero-view-camera-list" className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
          {Object.entries(bySite).map(([siteId, siteData]) => (
            <div key={siteId} className="space-y-1.5">
              {Object.entries(siteData.areas).map(([areaKey, group]) => (
                <details key={areaKey} open className="group">
                  <summary className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-1.5 py-1.5 hover:bg-muted">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        <ChevronDown className="size-3 transition-transform group-open:rotate-0 -rotate-90" />
                        {group.areaName}
                        <span className="rounded-full bg-success/20 px-1.5 py-px text-2xs font-bold text-success">
                          {group.cams.filter((c) => detCount(c.id) > 0).length} ACTIVE
                        </span>
                      </p>
                      <p className="ml-4 inline-flex items-center gap-0.5 text-2xs text-muted-foreground">
                        <MapPin className="size-2.5" />
                        {siteData.siteName}
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-default text-2xs text-muted-foreground">
                          <AlertTriangle className="mr-0.5 inline size-2.5" />{group.cams.filter((c) => c.status !== "online").length} · {group.cams.length}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {group.cams.filter((c) => c.status !== "online").length} offline · {group.cams.length} camera{group.cams.length === 1 ? "" : "s"} in this area
                      </TooltipContent>
                    </Tooltip>
                  </summary>
                  <div className="mt-1 grid grid-cols-2 gap-1.5">
                    {group.cams.map((c) => (
                      <CameraTile key={c.id} camera={c}
                        isSelected={c.id === camera.id}
                        detectionCount={detCount(c.id)}
                        hasDetection={detCount(c.id) > 0}
                        onSelect={() => setSelectedCameraId(c.id)}
                        size="sm"
                        inlineBox={detCount(c.id) > 0 ? { x: 0.35, y: 0.35, w: 0.25, h: 0.35, color: detCount(c.id) > 2 ? "warning" : "info" } : undefined}
                        pinned={pinnedIds.includes(c.id)}
                        onTogglePin={() => onTogglePin(c.id)}
                      />
                    ))}
                  </div>
                </details>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryChip({ label, count, active, muted }: { label: string; count: number; active?: boolean; muted?: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-2xs font-semibold",
      active ? "border-primary/40 bg-primary/15 text-primary-ink" :
      muted ? "border-border bg-muted text-muted-foreground" :
              "border-warning/30 bg-warning/15 text-warning"
    )}>
      {label} <strong>{count}</strong>
    </span>
  );
}

/* ── Wall view ───────────────────────────────────────────────────────── */

function WallView({ cameras, gridSize, setGridSize, page, setPage, pinnedIds, onTogglePin }: {
  cameras: CameraData[]; gridSize: number; setGridSize: (n: number) => void;
  page: number; setPage: (n: number) => void;
  pinnedIds: string[]; onTogglePin: (id: string) => void;
}) {
  const total = cameras.length;
  const perPage = gridSize * gridSize;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const pageItems = cameras.slice((page - 1) * perPage, page * perPage);

  return (
    <div data-slot="wall-view" className="rounded-xl border border-border bg-card p-4">
      <div data-slot="wall-view-header" className="mb-3 flex items-center justify-between gap-3">
        <p className="text-base font-semibold text-foreground">
          Wall view · Cameras {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
        </p>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon-sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
            className="size-7 rounded border border-border bg-transparent text-muted-foreground hover:border-primary/30 hover:bg-transparent hover:text-foreground disabled:opacity-40 dark:border-border dark:bg-transparent dark:hover:bg-transparent">
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => setPage(Math.min(pageCount, page + 1))} disabled={page === pageCount}
            className="size-7 rounded border border-border bg-transparent text-muted-foreground hover:border-primary/30 hover:bg-transparent hover:text-foreground disabled:opacity-40 dark:border-border dark:bg-transparent dark:hover:bg-transparent">
            <ChevronRight className="size-3.5" />
          </Button>
          <Select value={String(gridSize)} onValueChange={(v) => { setGridSize(Number(v)); setPage(1); }}>
            <SelectTrigger className="h-7 w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2×2 grid (4)</SelectItem>
              <SelectItem value="3">3×3 grid (9)</SelectItem>
              <SelectItem value="4">4×4 grid (16)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div data-slot="wall-view-grid" className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
        {pageItems.map((c) => (
          <CameraTile key={c.id} camera={c} hasDetection={detCount(c.id) > 0} detectionCount={detCount(c.id)}
            inlineBox={detCount(c.id) > 0 ? { x: 0.4, y: 0.4, w: 0.2, h: 0.3, color: detCount(c.id) > 2 ? "warning" : "info" } : undefined}
            pinned={pinnedIds.includes(c.id)} onTogglePin={() => onTogglePin(c.id)} />
        ))}
        {Array.from({ length: Math.max(0, perPage - pageItems.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-video rounded-lg border border-dashed border-border bg-muted/20" />
        ))}
      </div>
    </div>
  );
}

/* ── Custom view (drag + drop + resize) ──────────────────────────────── */

const DEFAULT_GRID_COLS = 12;
const DEFAULT_GRID_ROWS = 8;
const MIN_GRID_COLS = 2;
const MAX_GRID_COLS = 24;
const MIN_GRID_ROWS = 2;
const MAX_GRID_ROWS = 16;
const CELL_SIZE_PX = 56;

function LayoutSwitcher({
  layouts, activeId, onSelect, onCreate, onRename, onDuplicate, onDelete,
}: {
  layouts: CustomLayout[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [renameId, setRenameId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const active = layouts.find((l) => l.id === activeId);

  function startRename(id: string, current: string) {
    setRenameId(id);
    setRenameValue(current);
  }
  function commitRename() {
    if (renameId && renameValue.trim()) onRename(renameId, renameValue.trim());
    setRenameId(null);
    setRenameValue("");
  }
  function commitCreate() {
    if (newName.trim()) onCreate(newName.trim());
    setCreating(false);
    setNewName("");
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setRenameId(null); setCreating(false); setNewName(""); } }}>
      <PopoverTrigger asChild>
        <ItemButton variant="plain" className={cn(
          "h-9 w-auto justify-between gap-2 rounded-md border bg-background px-3 text-base font-semibold transition-colors hover:bg-background",
          open ? "border-primary" : "border-input",
          "text-foreground"
        )} style={{ minWidth: "200px" }}>
          <TruncatedText text={active?.name ?? "Select layout"} />
          <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
        </ItemButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-1.5">
        <p className="px-2 py-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Saved layouts</p>
        <div className="max-h-64 space-y-0.5 overflow-y-auto">
          {layouts.map((l) => {
            const isActive = l.id === activeId;
            const isRenaming = renameId === l.id;
            return (
              <div key={l.id} className={cn("flex items-center gap-1.5 rounded-md px-1 py-1", isActive && "bg-muted/60")}>
                {isRenaming ? (
                  <>
                    <Input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenameId(null); }}
                      onBlur={commitRename}
                      className="h-7 flex-1 text-sm"
                    />
                  </>
                ) : (
                  <>
                    <ItemButton
                      variant="plain"
                      onClick={() => { onSelect(l.id); setOpen(false); }}
                      className="flex-1 gap-1.5 rounded px-1.5 py-1 text-sm hover:bg-muted/40"
                    >
                      <Check className={cn("size-3 flex-shrink-0", isActive ? "text-primary-ink" : "opacity-0")} strokeWidth={3} />
                      <TruncatedText text={l.name} className="min-w-0 flex-1 text-foreground" />
                      <span className="ml-auto rounded-full bg-muted px-1.5 py-px font-mono text-3xs text-muted-foreground">{l.tiles.length}</span>
                    </ItemButton>
                    <Button variant="ghost" size="icon-xs" onClick={() => startRename(l.id, l.name)} title="Rename"
                      className="size-6 rounded text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted">
                      <Pencil className="size-3" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => onDuplicate(l.id)} title="Duplicate"
                      className="size-6 rounded text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted">
                      <LayoutGrid className="size-3" />
                    </Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => { if (layouts.length > 1) onDelete(l.id); }} disabled={layouts.length <= 1} title="Delete"
                      className="size-6 rounded text-severity-critical hover:bg-severity-critical/10 hover:text-severity-critical disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-severity-critical/10">
                      <Trash2 className="size-3" />
                    </Button>
                  </>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-1 border-t border-border pt-1">
          {creating ? (
            <div className="flex items-center gap-1.5 px-1 py-1">
              <Input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") commitCreate(); if (e.key === "Escape") { setCreating(false); setNewName(""); } }}
                placeholder="Layout name…"
                className="h-7 flex-1 text-sm"
              />
              <Button variant="default" size="xs" onClick={commitCreate} className="h-auto rounded bg-primary-fill px-2 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary-hover">
                Add
              </Button>
            </div>
          ) : (
            <ItemButton variant="plain" onClick={() => setCreating(true)}
              className="gap-1.5 rounded-md px-2 py-1.5 text-sm font-semibold text-primary-ink hover:bg-primary/10">
              <Plus className="size-3" />
              New layout
            </ItemButton>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ── Grid size stepper used inside the Custom view toolbar ──────────── */
function GridSizeControl({
  cols,
  rows,
  onChange,
}: {
  cols: number;
  rows: number;
  onChange: (cols: number, rows: number) => void;
}) {
  function bumpCols(delta: number) {
    onChange(Math.max(MIN_GRID_COLS, Math.min(MAX_GRID_COLS, cols + delta)), rows);
  }
  function bumpRows(delta: number) {
    onChange(cols, Math.max(MIN_GRID_ROWS, Math.min(MAX_GRID_ROWS, rows + delta)));
  }
  return (
    <div data-slot="grid-size-control" className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs">
      <span className="font-semibold uppercase tracking-wider text-muted-foreground">Grid</span>
      {/* Columns */}
      <div className="inline-flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-xs"
          type="button"
          onClick={() => bumpCols(-1)}
          disabled={cols <= MIN_GRID_COLS}
          className="size-5 rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 dark:hover:bg-muted"
          aria-label="Fewer columns"
        >
          −
        </Button>
        <Input
          type="number"
          min={MIN_GRID_COLS}
          max={MAX_GRID_COLS}
          value={cols}
          onChange={(e) => {
            const v = Math.max(MIN_GRID_COLS, Math.min(MAX_GRID_COLS, Number(e.target.value) || MIN_GRID_COLS));
            onChange(v, rows);
          }}
          className="h-5 w-8 rounded border border-input bg-background px-0 py-0 text-center font-mono text-xs text-foreground shadow-none outline-none focus:border-primary md:text-xs dark:bg-background focus-visible:border-primary focus-visible:ring-0"
        />
        <Button
          variant="ghost"
          size="icon-xs"
          type="button"
          onClick={() => bumpCols(1)}
          disabled={cols >= MAX_GRID_COLS}
          className="size-5 rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 dark:hover:bg-muted"
          aria-label="More columns"
        >
          +
        </Button>
      </div>
      <span className="text-muted-foreground">×</span>
      {/* Rows */}
      <div className="inline-flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon-xs"
          type="button"
          onClick={() => bumpRows(-1)}
          disabled={rows <= MIN_GRID_ROWS}
          className="size-5 rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 dark:hover:bg-muted"
          aria-label="Fewer rows"
        >
          −
        </Button>
        <Input
          type="number"
          min={MIN_GRID_ROWS}
          max={MAX_GRID_ROWS}
          value={rows}
          onChange={(e) => {
            const v = Math.max(MIN_GRID_ROWS, Math.min(MAX_GRID_ROWS, Number(e.target.value) || MIN_GRID_ROWS));
            onChange(cols, v);
          }}
          className="h-5 w-8 rounded border border-input bg-background px-0 py-0 text-center font-mono text-xs text-foreground shadow-none outline-none focus:border-primary md:text-xs dark:bg-background focus-visible:border-primary focus-visible:ring-0"
        />
        <Button
          variant="ghost"
          size="icon-xs"
          type="button"
          onClick={() => bumpRows(1)}
          disabled={rows >= MAX_GRID_ROWS}
          className="size-5 rounded text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30 dark:hover:bg-muted"
          aria-label="More rows"
        >
          +
        </Button>
      </div>
    </div>
  );
}

function CustomView({
  cameras, allCameras, tiles, onChangeTiles, pinnedIds, onTogglePin,
  layouts, activeLayoutId, onSelectLayout, onCreateLayout, onRenameLayout, onDuplicateLayout, onDeleteLayout,
  cols, rows, onChangeGrid,
}: {
  cameras: CameraData[];
  allCameras: CameraData[];
  tiles: CustomTile[];
  onChangeTiles: (next: CustomTile[]) => void;
  pinnedIds: string[];
  onTogglePin: (id: string) => void;
  layouts: CustomLayout[];
  activeLayoutId: string | null;
  onSelectLayout: (id: string) => void;
  onCreateLayout: (name: string) => void;
  onRenameLayout: (id: string, name: string) => void;
  onDuplicateLayout: (id: string) => void;
  onDeleteLayout: (id: string) => void;
  cols: number;
  rows: number;
  onChangeGrid: (cols: number, rows: number) => void;
}) {
  const GRID_COLS = cols;
  const GRID_ROWS = rows;
  // Local mutator that wraps onChangeTiles in a setState-style API for ergonomics inside this component.
  const setTiles = React.useCallback((updater: CustomTile[] | ((prev: CustomTile[]) => CustomTile[])) => {
    const next = typeof updater === "function" ? (updater as (p: CustomTile[]) => CustomTile[])(tiles) : updater;
    onChangeTiles(next);
  }, [tiles, onChangeTiles]);

  const [editing, setEditing] = React.useState(tiles.length === 0);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const dragRef = React.useRef<{ id: string; offsetCol: number; offsetRow: number } | null>(null);
  const resizeRef = React.useRef<{ id: string; startX: number; startY: number; startCols: number; startRows: number } | null>(null);

  const usedIds = new Set(tiles.map((t) => t.cameraId));
  const availableCameras = cameras.filter((c) => !usedIds.has(c.id));

  function addTiles(ids: string[]) {
    setTiles((curr) => {
      const next = [...curr];
      let col = 1, row = 1;
      // simple flow placement
      for (const id of ids) {
        // find a 4x3 slot
        while (true) {
          const fits = !next.some((t) =>
            col < t.col + t.cols && col + 4 > t.col &&
            row < t.row + t.rows && row + 3 > t.row
          );
          if (fits && col + 4 - 1 <= GRID_COLS && row + 3 - 1 <= GRID_ROWS) break;
          col += 1;
          if (col + 4 - 1 > GRID_COLS) { col = 1; row += 1; }
          if (row > GRID_ROWS) { col = 1; row = 1; break; }
        }
        next.push({ id: `tile-${Math.random().toString(36).slice(2, 7)}`, cameraId: id, col, row, cols: 4, rows: 3 });
        col += 4;
        if (col + 4 - 1 > GRID_COLS) { col = 1; row += 3; }
      }
      return next;
    });
    setPickerOpen(false);
  }

  function removeTile(id: string) {
    setTiles((curr) => curr.filter((t) => t.id !== id));
  }

  function handleGridDragOver(e: React.DragEvent) {
    if (!dragRef.current) return;
    e.preventDefault();
  }

  function handleGridDrop(e: React.DragEvent) {
    if (!dragRef.current) return;
    const ctx = dragRef.current;
    const grid = e.currentTarget as HTMLDivElement;
    const r = grid.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const cellW = r.width / GRID_COLS;
    const cellH = CELL_SIZE_PX;
    const col = Math.max(1, Math.min(GRID_COLS, Math.round(x / cellW) - ctx.offsetCol + 1));
    const row = Math.max(1, Math.min(GRID_ROWS, Math.round(y / cellH) - ctx.offsetRow + 1));
    setTiles((curr) => curr.map((t) =>
      t.id === ctx.id ? { ...t, col: Math.min(col, GRID_COLS - t.cols + 1), row: Math.min(row, GRID_ROWS - t.rows + 1) } : t
    ));
    dragRef.current = null;
  }

  function handleDragStart(e: React.DragEvent, tile: CustomTile) {
    if (!editing) return;
    const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const cellW = r.width / tile.cols;
    const cellH = r.height / tile.rows;
    dragRef.current = {
      id: tile.id,
      offsetCol: Math.floor((e.clientX - r.left) / cellW),
      offsetRow: Math.floor((e.clientY - r.top) / cellH),
    };
    e.dataTransfer.effectAllowed = "move";
  }

  function handleResizeStart(e: React.MouseEvent, tile: CustomTile) {
    e.stopPropagation();
    e.preventDefault();
    resizeRef.current = { id: tile.id, startX: e.clientX, startY: e.clientY, startCols: tile.cols, startRows: tile.rows };
    function onMove(ev: MouseEvent) {
      const ctx = resizeRef.current;
      if (!ctx) return;
      const dx = ev.clientX - ctx.startX;
      const dy = ev.clientY - ctx.startY;
      const dCols = Math.round(dx / 90);
      const dRows = Math.round(dy / CELL_SIZE_PX);
      setTiles((curr) => curr.map((t) => {
        if (t.id !== ctx.id) return t;
        const cols = Math.max(2, Math.min(GRID_COLS - t.col + 1, ctx.startCols + dCols));
        const rows = Math.max(2, Math.min(GRID_ROWS - t.row + 1, ctx.startRows + dRows));
        return { ...t, cols, rows };
      }));
    }
    function onUp() {
      resizeRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <div data-slot="custom-view" className="flex flex-col gap-3">
      {/* Toolbar */}
      <div data-slot="custom-view-toolbar" className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
        <LayoutSwitcher
          layouts={layouts}
          activeId={activeLayoutId}
          onSelect={onSelectLayout}
          onCreate={onCreateLayout}
          onRename={onRenameLayout}
          onDuplicate={onDuplicateLayout}
          onDelete={onDeleteLayout}
        />
        <span className="rounded-full bg-muted px-1.5 py-px text-2xs text-muted-foreground">
          {tiles.length} tile{tiles.length === 1 ? "" : "s"}
        </span>
        {editing && (
          <GridSizeControl
            cols={GRID_COLS}
            rows={GRID_ROWS}
            onChange={onChangeGrid}
          />
        )}
        {!editing && (
          <span className="rounded-full border border-border bg-background px-1.5 py-px font-mono text-2xs text-muted-foreground">
            {GRID_COLS}×{GRID_ROWS}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          {editing ? (
            <>
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="xs" className="h-auto gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted dark:border-border dark:bg-background dark:hover:bg-muted">
                    <Plus className="size-3" />
                    Add Camera
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="max-h-[280px] w-64 overflow-y-auto p-1.5">
                  {availableCameras.length === 0 ? (
                    <p className="px-2 py-3 text-center text-sm italic text-muted-foreground">All cameras already in layout.</p>
                  ) : (
                    availableCameras.map((c) => (
                      <ItemButton variant="plain" key={c.id} onClick={() => addTiles([c.id])}
                        className="gap-2 rounded px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                        <span className="font-mono text-2xs text-primary-ink">{c.id}</span>
                        <TruncatedText text={c.name} />
                      </ItemButton>
                    ))
                  )}
                </PopoverContent>
              </Popover>
              <Button variant="default" size="xs" onClick={() => setEditing(false)}
                className="h-auto gap-1 rounded-md bg-primary-fill px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary-hover">
                <Save className="size-3" />
                Done
              </Button>
            </>
          ) : (
            <Button variant="outline" size="xs" onClick={() => setEditing(true)}
              className="h-auto gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted dark:border-border dark:bg-background dark:hover:bg-muted">
              <Pencil className="size-3" />
              Edit Layout
            </Button>
          )}
        </div>
      </div>

      {tiles.length === 0 ? (
        <div data-slot="custom-view-empty" className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <LayoutGrid className="size-10 opacity-20" />
          <p className="text-sm">No cameras in your custom layout yet.</p>
          <Button variant="default" size="sm" onClick={() => availableCameras.length > 0 && addTiles(availableCameras.slice(0, 4).map((c) => c.id))}
            className="h-auto gap-1.5 rounded-md bg-primary-fill px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
            <Plus className="size-3.5" />
            Add starter tiles
          </Button>
        </div>
      ) : (
        <div data-slot="custom-view-canvas" className="rounded-xl border border-border bg-card p-3">
          <div
            onDragOver={handleGridDragOver}
            onDrop={handleGridDrop}
            className={cn(
              "relative grid gap-2",
              editing && "rounded-lg outline-2 outline-dashed -outline-offset-2 outline-primary/20"
            )}
            style={{
              gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
              gridAutoRows: `${CELL_SIZE_PX}px`,
              minHeight: `${GRID_ROWS * CELL_SIZE_PX}px`,
            }}
          >
            {/* Background grid hints when editing */}
            {editing && Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, i) => (
              <div key={i} className="rounded border border-dashed border-border/30 bg-background/10"
                style={{ gridColumn: (i % GRID_COLS) + 1, gridRow: Math.floor(i / GRID_COLS) + 1 }} />
            ))}

            {tiles.map((tile) => {
              const c = cameras.find((x) => x.id === tile.cameraId) ?? allCameras.find((x) => x.id === tile.cameraId);
              if (!c) return null;
              return (
                <div
                  key={tile.id}
                  draggable={editing}
                  onDragStart={(e) => handleDragStart(e, tile)}
                  className="relative flex h-full min-h-0"
                  style={{
                    gridColumn: `${tile.col} / span ${tile.cols}`,
                    gridRow: `${tile.row} / span ${tile.rows}`,
                  }}
                >
                  <div className="flex flex-1 flex-col">
                    <CameraTile camera={c} hasDetection={detCount(c.id) > 0} detectionCount={detCount(c.id)}
                      pinned={pinnedIds.includes(c.id)} onTogglePin={() => onTogglePin(c.id)}
                      inlineBox={detCount(c.id) > 0 ? { x: 0.4, y: 0.4, w: 0.2, h: 0.3, color: detCount(c.id) > 2 ? "warning" : "info" } : undefined} />
                  </div>
                  {editing && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="absolute left-1.5 top-1.5 z-10 size-6 cursor-grab rounded bg-scrim/70 text-media-foreground/90 backdrop-blur-sm hover:bg-scrim/90 hover:text-media-foreground/90 active:cursor-grabbing dark:hover:bg-scrim/90"
                        title="Drag to reposition" onMouseDown={(e) => e.stopPropagation()}>
                        <GripVertical className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => removeTile(tile.id)}
                        className="absolute right-1.5 top-1.5 z-10 size-6 rounded bg-scrim/70 text-media-foreground/90 backdrop-blur-sm hover:bg-severity-critical/80 hover:text-media-foreground/90 dark:hover:bg-severity-critical/80"
                        title="Remove">
                        <Trash2 className="size-3" />
                      </Button>
                      <span className="absolute left-1/2 bottom-2 z-10 -translate-x-1/2 rounded bg-scrim/70 px-1.5 py-0.5 font-mono text-2xs text-media-foreground/85 backdrop-blur-sm">
                        {tile.cols}×{tile.rows}
                      </span>
                      <div
                        onMouseDown={(e) => handleResizeStart(e, tile)}
                        className="absolute bottom-0 right-0 z-10 flex size-5 cursor-nwse-resize items-end justify-end p-0.5"
                        title="Resize"
                      >
                        <div className="size-3 rounded-tl bg-primary" />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {editing && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Grid is {GRID_COLS}×{GRID_ROWS} · Drag the corner handle to resize · Drop on the grid to reposition
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Multi-site selector ─────────────────────────────────────────────── */

function MultiSiteSelector({ sites, selected, onChange }: {
  sites: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const isAll = selected.length === 0 || selected.length === sites.length;
  const display = isAll
    ? "All Sites"
    : selected.length === 1 ? sites.find((s) => s.id === selected[0])?.name ?? "1 site"
    : `${selected.length} sites`;

  function toggle(id: string) {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else onChange([...selected, id]);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ItemButton variant="plain" className={cn(
          "h-9 w-auto justify-between gap-2 rounded-md border bg-background pl-3 pr-2 text-base font-semibold transition-colors hover:bg-background",
          open ? "border-primary" : "border-input",
          isAll ? "text-muted-foreground" : "text-foreground"
        )} style={{ minWidth: "160px" }}>
          {display}
          <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
        </ItemButton>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-[280px] w-56 overflow-y-auto p-1.5">
        <ItemButton variant="plain" onClick={() => { onChange([]); }}
          className="gap-2 rounded px-2 py-1.5 text-base text-muted-foreground hover:bg-muted hover:text-foreground">
          <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
            isAll ? "border-primary bg-primary" : "border-muted-foreground/40")}>
            {isAll && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
          </div>
          All Sites
        </ItemButton>
        <div className="my-1 border-t border-border" />
        {sites.map((s) => {
          const checked = !isAll && selected.includes(s.id);
          return (
            <ItemButton variant="plain" key={s.id} onClick={() => toggle(s.id)}
              className="gap-2 rounded px-2 py-1.5 text-base text-muted-foreground hover:bg-muted hover:text-foreground">
              <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                checked ? "border-primary bg-primary" : "border-muted-foreground/40")}>
                {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
              </div>
              {s.name}
            </ItemButton>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */

export default function LiveMonitoringPage() {
  const allCameras = useCamerasStore((s) => s.cameras);
  const sites = useSitesStore((s) => s.sites);
  const {
    pinned, togglePin,
    customLayouts, activeLayoutId,
    setActiveLayout, setLayoutTiles, setLayoutGrid, createLayout, renameLayout, deleteLayout, duplicateLayout,
  } = useLiveMonitoringStore();
  const [siteFilter, setSiteFilter] = React.useState<string[]>([]); // empty = all
  const [search, setSearch] = React.useState("");
  const [viewMode, setViewMode] = React.useState<ViewMode>("hero");
  const [gridSize, setGridSize] = React.useState(4);
  const [page, setPage] = React.useState(1);
  const [selectedCameraId, setSelectedCameraId] = React.useState<string>("");

  const activeLayout = customLayouts.find((l) => l.id === activeLayoutId) ?? customLayouts[0];
  const activeTiles: CustomTile[] = activeLayout?.tiles ?? [];

  const filteredCameras = React.useMemo(() => {
    const list = allCameras.filter((c) => {
      if (siteFilter.length > 0 && !siteFilter.includes(c.siteId)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (![c.id, c.name, c.areaName, c.siteName].join(" ").toLowerCase().includes(q)) return false;
      }
      return true;
    });
    const pinnedSet = new Set(pinned);
    return [...list].sort((a, b) => {
      const ap = pinnedSet.has(a.id) ? 1 : 0;
      const bp = pinnedSet.has(b.id) ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return a.id.localeCompare(b.id);
    });
  }, [allCameras, siteFilter, search, pinned]);

  // Keep the selection on a visible camera: pick the first one when nothing is
  // selected or the selection is filtered out. Adjusted during render (it
  // converges after one pass) rather than in an effect.
  if (!selectedCameraId && filteredCameras.length > 0) {
    setSelectedCameraId(filteredCameras[0].id);
  } else if (selectedCameraId && !filteredCameras.find((c) => c.id === selectedCameraId)) {
    setSelectedCameraId(filteredCameras[0]?.id ?? "");
  }

  const selectedSiteInfo =
    siteFilter.length === 1 ? sites.find((s) => s.id === siteFilter[0]) :
    siteFilter.length === 0 ? { name: "All sites", address: "", areas: [], id: "all" } :
    null;

  return (
    <div data-slot="live-monitoring-page" className="flex flex-col gap-section">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Live Monitoring</PageHeader.Title>
        </PageHeader.Content>
      </PageHeader>

      {/* Toolbar */}
      <div data-slot="live-monitoring-page-toolbar" className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
        <MultiSiteSelector sites={sites.map((s) => ({ id: s.id, name: s.name }))} selected={siteFilter} onChange={setSiteFilter} />
        <div data-slot="live-monitoring-page-search" className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${filteredCameras.length} cameras…`}
            className="h-9 w-full border-0 bg-transparent pl-9 text-base focus-visible:ring-0" />
        </div>
        <SegmentedControl
          data-slot="button-group"
          type="single"
          value={viewMode}
          onValueChange={(next) => next && setViewMode(next as ViewMode)}
          className="flex gap-0 rounded-lg border border-border bg-background p-0.5"
        >
          {VIEW_MODES.map((vm) => {
            const Icon = vm.icon;
            const active = viewMode === vm.key;
            return (
              <SegmentedControlItem value={vm.key} key={vm.key} title={vm.description}
                className={cn("h-auto gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors data-[state=on]:shadow-none",
                  active ? "bg-primary-fill text-primary-foreground data-[state=on]:bg-primary-fill data-[state=on]:text-primary-foreground hover:text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                <Icon className="size-3.5" />
                {vm.label}
              </SegmentedControlItem>
            );
          })}
        </SegmentedControl>
        {pinned.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-semibold text-primary-ink">
            <Pin className="size-3" />
            {pinned.length} pinned
          </span>
        )}
      </div>

      {/* Site context strip — above the cameras, so it frames what follows (PRD). */}
      {selectedSiteInfo && (
        <div data-slot="live-monitoring-page-site-context" className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <strong className="text-foreground">{selectedSiteInfo.name}</strong>
          {"address" in selectedSiteInfo && selectedSiteInfo.address && (
            <> · {selectedSiteInfo.address}</>
          )}
          {" · "}
          {filteredCameras.length} cameras total · {filteredCameras.filter((c) => c.status === "online").length} online
        </div>
      )}

      {filteredCameras.length === 0 ? (
        <div data-slot="live-monitoring-page-empty" className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
          <VideoOff className="size-10 opacity-20" />
          <p className="text-sm">No cameras match the current filter.</p>
        </div>
      ) : viewMode === "hero" ? (
        <HeroView
          cameras={filteredCameras}
          selectedCameraId={selectedCameraId}
          setSelectedCameraId={setSelectedCameraId}
          pinnedIds={pinned}
          onTogglePin={togglePin}
        />
      ) : viewMode === "wall" ? (
        <WallView cameras={filteredCameras} gridSize={gridSize} setGridSize={setGridSize} page={page} setPage={setPage}
          pinnedIds={pinned} onTogglePin={togglePin} />
      ) : (
        <CustomView
          cameras={filteredCameras}
          allCameras={allCameras}
          tiles={activeTiles}
          cols={activeLayout?.cols ?? DEFAULT_GRID_COLS}
          rows={activeLayout?.rows ?? DEFAULT_GRID_ROWS}
          onChangeGrid={(c, r) => activeLayout && setLayoutGrid(activeLayout.id, c, r)}
          onChangeTiles={(next) => activeLayout && setLayoutTiles(activeLayout.id, next)}
          pinnedIds={pinned}
          onTogglePin={togglePin}
          layouts={customLayouts}
          activeLayoutId={activeLayoutId}
          onSelectLayout={setActiveLayout}
          onCreateLayout={(name) => { createLayout(name); toast.success(`Layout "${name}" created`); }}
          onRenameLayout={(id, name) => { renameLayout(id, name); toast.success(`Layout renamed to "${name}"`); }}
          onDuplicateLayout={(id) => {
            const src = customLayouts.find((l) => l.id === id);
            const newName = `${src?.name ?? "Layout"} copy`;
            duplicateLayout(id, newName);
            toast.success(`Layout duplicated as "${newName}"`);
          }}
          onDeleteLayout={(id) => {
            const target = customLayouts.find((l) => l.id === id);
            deleteLayout(id);
            toast.success(`Layout "${target?.name ?? "Untitled"}" deleted`);
          }}
        />
      )}

    </div>
  );
}
