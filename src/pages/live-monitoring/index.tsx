import * as React from "react";
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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { useCamerasStore } from "@/stores/useCamerasStore";
import { useSitesStore } from "@/stores/useSitesStore";
import { MOCK_EVENTS } from "@/mocks/detectionFeed";
import { useLiveMonitoringStore } from "@/stores/useLiveMonitoringStore";
import type { CameraData } from "@/types/cameras";

/* ── View modes ──────────────────────────────────────────────────────── */

type ViewMode = "hero" | "wall";

const VIEW_MODES: { key: ViewMode; label: string; icon: React.ElementType; description: string }[] = [
  { key: "hero",   label: "Hero",   icon: PanelsTopLeft, description: "Featured camera + sidebar of all cams" },
  { key: "wall",   label: "Wall",   icon: LayoutGrid,    description: "Uniform grid for all cameras" },
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
  const tileGradient = "radial-gradient(120% 80% at 40% 60%, rgba(180,140,80,0.18) 0%, rgba(40,30,15,0.1) 45%, rgba(0,0,0,0.95) 100%)";
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-lg border bg-neutral-950 text-left transition-all",
        isSelected ? "border-primary shadow-[0_0_0_2px_var(--primary)]" : "border-border hover:border-primary/40"
      )}
    >
      <div className="relative aspect-video w-full flex-1 overflow-hidden">
        {isOnline ? (
          <>
            <div className="absolute inset-0" style={{ background: tileGradient }} />
            {inlineBox && (
              <div className={cn("absolute border-[1.5px]",
                inlineBox.color === "info" && "border-info",
                inlineBox.color === "warning" && "border-warning",
                inlineBox.color === "critical" && "border-sev-critical")}
                style={{
                  left: `${inlineBox.x * 100}%`, top: `${inlineBox.y * 100}%`,
                  width: `${inlineBox.w * 100}%`, height: `${inlineBox.h * 100}%`,
                }} />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-neutral-950/95 text-sev-critical/80">
            <AlertTriangle className="size-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Offline</span>
          </div>
        )}
        {isOnline && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-sev-critical/95 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
            LIVE
          </span>
        )}
        {hasDetection && detectionCount !== undefined && detectionCount > 0 && (
          <span className="absolute right-2 top-2 inline-flex size-5 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-neutral-900">
            {detectionCount}
          </span>
        )}
        {/* Persistent pin indicator (only when actually pinned) */}
        {pinned && (
          <span title="Pinned"
            className={cn(
              "absolute z-10 inline-flex items-center justify-center rounded-full bg-primary text-white shadow",
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
              "absolute z-20 inline-flex h-7 items-center gap-1 rounded-md bg-black/75 px-2 text-[10px] font-semibold uppercase tracking-wider text-white opacity-0 backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100",
              "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hover:bg-primary"
            )}
          >
            {pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
            {pinned ? "Unpin" : "Pin"}
          </span>
        )}
        <span className={cn("absolute left-2 bottom-2 rounded bg-black/60 px-1.5 py-0.5 font-mono text-white/90 backdrop-blur-sm",
          size === "sm" ? "text-[9px]" : "text-[10px]")}>
          {camera.id}
        </span>
      </div>
    </button>
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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-950">
            <div className="absolute inset-0" style={{ background: "radial-gradient(120% 80% at 40% 60%, rgba(180,140,80,0.22) 0%, rgba(40,30,15,0.1) 45%, rgba(0,0,0,0.95) 100%)" }} />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-sev-critical/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              LIVE
            </span>
            <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-0.5 font-mono text-[10px] text-white/85 backdrop-blur-sm">
              {camera.id} · <span className="inline-flex items-center gap-1 text-sev-critical"><span className="size-1.5 animate-pulse rounded-full bg-sev-critical" />REC</span> · <span className="text-info">AI</span>
            </span>
            <div className="absolute left-3 bottom-3 rounded bg-black/60 px-2 py-1 font-mono text-[11px] text-white/90 backdrop-blur-sm">
              {now.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }).replace(",", " ·")}
            </div>
          </div>

          {/* Timeline */}
          <div className="border-t border-border bg-background/40 px-4 py-3">
            <div className="relative h-8 w-full">
              <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-warning/20" />
              <div className="absolute inset-y-0 right-0 w-px bg-sev-critical" />
              {events.map((e, i) => {
                const colors = ["bg-info", "bg-warning", "bg-sev-critical", "bg-info"];
                const left = 10 + (i * 14);
                return (
                  <span key={e.id} className={cn("absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full ring-2 ring-card", colors[i % colors.length])}
                    style={{ left: `${left}%` }} title={e.typeLabel} />
                );
              })}
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>5 min ago</span>
              <span>Now</span>
            </div>
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold text-foreground">{camera.siteName} · {camera.id}</p>
              <p className="truncate text-[11px] text-muted-foreground">{camera.areaName} · {camera.stream.resolution} · {camera.stream.frameRate}fps · accel-vms v4.2.1 active</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPaused((v) => !v)}
                className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted">
                {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
              </button>
              <button onClick={() => setMuted((v) => !v)}
                className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted">
                {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
              </button>
              <button title="Snapshot"
                className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted">
                <Camera className="size-3.5" />
              </button>
              <button title="Fullscreen"
                className="flex size-8 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted">
                <Maximize2 className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="flex max-h-[calc(100vh-12rem)] flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex-shrink-0 border-b border-border px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Cameras {multiSite ? `· ${Object.keys(bySite).length} sites` : `· ${Object.values(bySite)[0]?.siteName ?? ""}`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              <strong className="text-foreground">{cameras.length}</strong> · <strong className="text-success">{onlineCount}</strong> on{offlineCount > 0 && <> · <strong className="text-sev-critical">{offlineCount}</strong> off</>}
            </p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <CategoryChip label="All" count={cameras.length} active />
            <CategoryChip label="With detections" count={cameras.filter((c) => detCount(c.id) > 0).length} />
            <CategoryChip label="Offline" count={offlineCount} muted />
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
          {Object.entries(bySite).map(([siteId, siteData]) => (
            <div key={siteId} className="space-y-1.5">
              {Object.entries(siteData.areas).map(([areaKey, group]) => (
                <details key={areaKey} open className="group">
                  <summary className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-1.5 py-1.5 hover:bg-muted">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                        <ChevronDown className="size-3 transition-transform group-open:rotate-0 -rotate-90" />
                        {group.areaName}
                        <span className="rounded-full bg-warning/20 px-1.5 py-px text-[10px] font-bold text-warning">
                          {group.cams.filter((c) => detCount(c.id) > 0).length} ACTIVE
                        </span>
                      </p>
                      <p className="ml-4 inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <MapPin className="size-2.5" />
                        {siteData.siteName}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      <AlertTriangle className="mr-0.5 inline size-2.5" />{group.cams.filter((c) => c.status !== "online").length} · {group.cams.length}
                    </span>
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
      "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold",
      active ? "border-primary/40 bg-primary/15 text-primary" :
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
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-foreground">
          Wall view · Cameras {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}
        </p>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
            className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40">
            <ChevronLeft className="size-3.5" />
          </button>
          <button onClick={() => setPage(Math.min(pageCount, page + 1))} disabled={page === pageCount}
            className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground disabled:opacity-40">
            <ChevronRight className="size-3.5" />
          </button>
          <select value={gridSize} onChange={(e) => { setGridSize(Number(e.target.value)); setPage(1); }}
            className="h-7 rounded-md border border-input bg-background px-2 text-[12px] text-foreground focus:border-primary focus:outline-none">
            <option value={2}>2×2 grid (4)</option>
            <option value={3}>3×3 grid (9)</option>
            <option value={4}>4×4 grid (16)</option>
          </select>
        </div>
      </div>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
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
        <button className={cn(
          "h-9 inline-flex items-center justify-between gap-2 rounded-md border bg-background pl-3 pr-2 text-[13px] font-semibold transition-colors",
          open ? "border-primary" : "border-input",
          isAll ? "text-muted-foreground" : "text-foreground"
        )} style={{ minWidth: "160px" }}>
          {display}
          <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-[280px] w-56 overflow-y-auto p-1.5">
        <button onClick={() => { onChange([]); }}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground">
          <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
            isAll ? "border-primary bg-primary" : "border-muted-foreground/40")}>
            {isAll && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
          </div>
          All Sites
        </button>
        <div className="my-1 border-t border-border" />
        {sites.map((s) => {
          const checked = !isAll && selected.includes(s.id);
          return (
            <button key={s.id} onClick={() => toggle(s.id)}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground">
              <div className={cn("flex size-3.5 flex-shrink-0 items-center justify-center rounded border transition-colors",
                checked ? "border-primary bg-primary" : "border-muted-foreground/40")}>
                {checked && <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />}
              </div>
              {s.name}
            </button>
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
  const { pinned, togglePin } = useLiveMonitoringStore();
  const [siteFilter, setSiteFilter] = React.useState<string[]>([]); // empty = all
  const [search, setSearch] = React.useState("");
  const [viewMode, setViewMode] = React.useState<ViewMode>("hero");
  const [gridSize, setGridSize] = React.useState(4);
  const [page, setPage] = React.useState(1);
  const [selectedCameraId, setSelectedCameraId] = React.useState<string>("");

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

  React.useEffect(() => {
    if (!selectedCameraId && filteredCameras.length > 0) {
      setSelectedCameraId(filteredCameras[0].id);
    } else if (selectedCameraId && !filteredCameras.find((c) => c.id === selectedCameraId)) {
      setSelectedCameraId(filteredCameras[0]?.id ?? "");
    }
  }, [filteredCameras, selectedCameraId]);

  const selectedSiteInfo =
    siteFilter.length === 1 ? sites.find((s) => s.id === siteFilter[0]) :
    siteFilter.length === 0 ? { name: "All sites", address: "", areas: [], id: "all" } :
    null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader>
        <PageHeader.Content>
          <PageHeader.Title>Live Monitoring</PageHeader.Title>
          <PageHeader.Description>
            Real-time camera feeds across all sites — switch view modes and customize layouts.
          </PageHeader.Description>
        </PageHeader.Content>
      </PageHeader>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
        <MultiSiteSelector sites={sites.map((s) => ({ id: s.id, name: s.name }))} selected={siteFilter} onChange={setSiteFilter} />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${filteredCameras.length} cameras…`}
            className="h-9 w-full border-0 bg-transparent pl-9 text-[13px] focus-visible:ring-0" />
        </div>
        <div data-slot="button-group" className="flex items-center rounded-lg border border-border bg-background p-0.5">
          {VIEW_MODES.map((vm) => {
            const Icon = vm.icon;
            const active = viewMode === vm.key;
            return (
              <button key={vm.key} onClick={() => setViewMode(vm.key)} title={vm.description}
                className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                <Icon className="size-3.5" />
                {vm.label}
              </button>
            );
          })}
        </div>
        {pinned.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
            <Pin className="size-3" />
            {pinned.length} pinned
          </span>
        )}
      </div>

      {filteredCameras.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-20 text-muted-foreground">
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
      ) : (
        <WallView cameras={filteredCameras} gridSize={gridSize} setGridSize={setGridSize} page={page} setPage={setPage}
          pinnedIds={pinned} onTogglePin={togglePin} />
      )}

      {/* Site context strip */}
      {selectedSiteInfo && (
        <div className="rounded-xl border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground">
          <strong className="text-foreground">{selectedSiteInfo.name}</strong>
          {"address" in selectedSiteInfo && selectedSiteInfo.address && (
            <> · {selectedSiteInfo.address}</>
          )}
          {" · "}
          {filteredCameras.length} cameras total · {filteredCameras.filter((c) => c.status === "online").length} online
        </div>
      )}
    </div>
  );
}
